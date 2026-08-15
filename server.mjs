import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addressInCidr, buildSummary, createEventStore, normalizeEvent } from './lib/analytics.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(root, 'dist');
const dashboardFile = resolve(root, 'analytics/index.html');
const dataFile = resolve(process.env.ANALYTICS_DATA_DIR ?? resolve(root, 'data'), 'pageviews.jsonl');
const publicPort = Number(process.env.PORT ?? 3000);
const dashboardPort = Number(process.env.ANALYTICS_PORT ?? 3001);
const allowedCidr = process.env.ANALYTICS_ALLOWED_CIDR ?? '192.168.0.0/23';
const siteHost = process.env.SITE_HOST ?? 'rakuensoftware.com';
const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 400);
const store = createEventStore(dataFile, retentionDays);
const rateLimit = { startedAt: Date.now(), total: 0, visitors: new Map() };
const postsDir = resolve(root, 'src/content/posts');

/* Which article slugs exist, so a retired one can answer 404 instead of 200.
 *
 * The site is a single-page app and the handler below falls back to index.html
 * for every path it cannot match on disk, with a 200. React then renders the
 * NotFound route, so a human sees the right page and a crawler is told the page
 * is fine. Eleven articles were briefly live and then retired; without this they
 * stay indexed, because nothing ever told anyone they had gone.
 *
 * Read from src/content/posts rather than a build manifest because
 * sync-articles.mjs already writes exactly the published set there, and a second
 * list is a second thing to drift.
 *
 * Cached, and refreshed when the directory's mtime moves, so a deploy is picked
 * up without a restart while a request does not pay for a readdir.
 */
const publishedSlugs = { at: 0, mtimeMs: -1, slugs: null };

async function knownArticleSlugs() {
  try {
    const { mtimeMs } = await stat(postsDir);
    if (publishedSlugs.slugs && mtimeMs === publishedSlugs.mtimeMs) return publishedSlugs.slugs;
    const names = await readdir(postsDir);
    publishedSlugs.slugs = new Set(
      names.filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3)),
    );
    publishedSlugs.mtimeMs = mtimeMs;
    return publishedSlugs.slugs;
  } catch {
    /* Fail OPEN. If the directory cannot be read the answer is "unknown", and
     * serving a real article as 404 is a worse failure than leaving a retired
     * one at 200. */
    return null;
  }
}

/* Only /blog/<slug> is decided here. Product pages come from a TypeScript module
 * this process does not parse, and every other path is either a real route or
 * already rare enough not to be worth guessing about. */
async function isRetiredArticle(pathname) {
  const m = /^\/blog\/([^/]+)\/?$/.exec(pathname);
  if (!m) return false;
  const slugs = await knownArticleSlugs();
  if (!slugs) return false;
  return !slugs.has(decodeURIComponent(m[1]));
}

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function securityHeaders(extra = {}) {
  return {
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    ...extra,
  };
}

function send(res, status, body = '', headers = {}) {
  res.writeHead(status, securityHeaders(headers));
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 8192) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function collect(req, res) {
  try {
    const input = await readJson(req);
    const event = normalizeEvent(input, req.headers['user-agent']);
    if (event == null) return send(res, 204);
    const now = Date.now();
    if (now - rateLimit.startedAt >= 60_000) {
      rateLimit.startedAt = now;
      rateLimit.total = 0;
      rateLimit.visitors.clear();
    }
    const visitorEvents = rateLimit.visitors.get(event.visitorId) ?? 0;
    if (rateLimit.total >= 600 || visitorEvents >= 30) return send(res, 204);
    rateLimit.total += 1;
    rateLimit.visitors.set(event.visitorId, visitorEvents + 1);
    await store.append(event);
    return send(res, 204);
  } catch {
    return send(res, 400, 'Invalid analytics event');
  }
}

export async function servePublic(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/__analytics/pageview') return collect(req, res);
  if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/__analytics/health') return send(res, 204);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { allow: 'GET, HEAD, POST' });

  let requested;
  try {
    requested = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }
  const candidate = resolve(distDir, `.${requested}`);
  let file = candidate.startsWith(`${distDir}${sep}`) ? candidate : '';
  try {
    if (!file || !(await stat(file)).isFile()) file = '';
  } catch {
    file = '';
  }
  let status = 200;
  if (!file) {
    file = resolve(distDir, 'index.html');
    /* The app renders NotFound for this path either way. Sending 404 with the
     * same shell means a reader sees the page and a crawler is told the article
     * is gone, which a 200 never says. */
    if (await isRetiredArticle(requested)) status = 404;
  }

  try {
    const body = await readFile(file);
    const immutable = file.includes(`${sep}assets${sep}`) && /-[\w-]{8,}\./.test(file);
    send(res, status, req.method === 'HEAD' ? '' : body, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
  } catch {
    send(res, 503, 'Site build not found');
  }
}

export async function serveDashboard(req, res) {
  const remoteAddress = req.socket.remoteAddress ?? '';
  if (!addressInCidr(remoteAddress, allowedCidr)) return send(res, 403, 'Forbidden');

  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { allow: 'GET, HEAD' });

  if (url.pathname === '/api/summary') {
    const requestedDays = Number(url.searchParams.get('days') ?? 30);
    const summary = buildSummary(await store.read(), requestedDays, new Date(), siteHost);
    return send(res, 200, req.method === 'HEAD' ? '' : JSON.stringify(summary), {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
  }

  if (url.pathname !== '/' && url.pathname !== '/index.html') return send(res, 404, 'Not found');
  try {
    const body = await readFile(dashboardFile);
    return send(res, 200, req.method === 'HEAD' ? '' : body, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
  } catch {
    return send(res, 503, 'Dashboard not found');
  }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void store.compact().catch((error) => console.error('Analytics compaction failed:', error));
  createServer((req, res) => void servePublic(req, res)).listen(publicPort, '0.0.0.0', () => {
    console.log(`Public site listening on :${publicPort}`);
  });

  createServer((req, res) => void serveDashboard(req, res)).listen(dashboardPort, '0.0.0.0', () => {
    console.log(`Analytics dashboard listening on :${dashboardPort} (allowed: ${allowedCidr})`);
  });
}
