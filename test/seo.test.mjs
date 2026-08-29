import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servePublic } from '../server.mjs';
import {
  canonicalUrl,
  headTags,
  injectHead,
  renderHeadTags,
  robotsTxt,
  sitemapXml,
} from '../lib/site-meta.mjs';

/* What a link crawler is served.
 *
 * The site is a client-rendered SPA, so for a while every URL returned the same
 * shell: one title, one description, no canonical and no Open Graph tags. Reddit
 * supplies most of this site's readers and its crawler does not run JavaScript,
 * so every article shared there previewed identically. The build now writes a
 * document per route; these check that what leaves the server actually carries
 * that route's identity.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(root, 'dist');
const postsDir = resolve(root, 'src/content/posts');

function listen(handler) {
  return new Promise((res) => {
    const server = createServer((req, r) => void handler(req, r));
    server.listen(0, '127.0.0.1', () => res(server));
  });
}

async function withSite(context) {
  const site = await listen(servePublic);
  context.after(() => site.close());
  return `http://127.0.0.1:${site.address().port}`;
}

/* A GET with a chosen Host header.
 *
 * Not fetch(): Host is a forbidden header name, and undici drops an attempt to
 * set it without saying so — which makes a broken hostname check look like a
 * passing test. */
function getWithHost(port, path, host) {
  return new Promise((res, rej) => {
    const req = request({ host: '127.0.0.1', port, path, headers: { Host: host } }, (r) => {
      let body = '';
      r.setEncoding('utf8');
      r.on('data', (c) => (body += c));
      r.on('end', () => res({ status: r.statusCode, body }));
    });
    req.on('error', rej);
    req.end();
  });
}

/* Frontmatter is read here with a regex rather than through the app's own
 * parser, which is TypeScript and cannot be imported by `node --test` anyway.
 * Reading it independently is the point: it checks the served pages against the
 * articles themselves, not against the same parse that produced them. */
function frontmatterValue(raw, key) {
  const match = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(raw.split(/^---$/m)[1] ?? '');
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : undefined;
}

function needsBuild(context) {
  if (existsSync(resolve(distDir, 'index.html'))) return false;
  context.skip('dist is produced by `npm run build`');
  return true;
}

/* ---------------------------------------------------------------- unit ---- */

test('a canonical URL is absolute and has no trailing slash but the root does', () => {
  const origin = 'https://rakuensoftware.com';
  assert.equal(canonicalUrl(origin, '/'), 'https://rakuensoftware.com/');
  assert.equal(canonicalUrl(origin, '/blog'), 'https://rakuensoftware.com/blog');
  /* /blog/x and /blog/x/ serve the same page. A canonical that disagreed with
   * itself between the two would be worse than none at all. */
  assert.equal(canonicalUrl(origin, '/blog/x/'), 'https://rakuensoftware.com/blog/x');
});

test('the head carries the tags a preview card reads, and escapes them', () => {
  const html = renderHeadTags(
    headTags({
      origin: 'https://rakuensoftware.com',
      path: '/blog/x',
      title: 'Bits & "bytes"',
      description: 'A <script> in the excerpt',
      type: 'article',
      published: '2026-08-22',
    }),
  );
  assert.match(html, /<title>Bits &amp; &quot;bytes&quot;<\/title>/);
  assert.match(html, /property="og:title" content="Bits &amp; &quot;bytes&quot;"/);
  assert.match(html, /property="og:type" content="article"/);
  assert.match(html, /property="article:published_time" content="2026-08-22"/);
  assert.match(html, /name="twitter:card" content="summary"/);
  assert.match(html, /rel="canonical" href="https:\/\/rakuensoftware\.com\/blog\/x"/);
  /* Frontmatter is trusted input, but it reaches an attribute either way. */
  assert.doesNotMatch(html, /<script>/);
});

test('a noindex page asks not to be indexed and claims no canonical', () => {
  const html = renderHeadTags(
    headTags({ origin: 'https://rakuensoftware.com', path: '/404', title: 'Gone', noindex: true }),
  );
  assert.match(html, /name="robots" content="noindex"/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test('injecting a head replaces the template’s own title and description', () => {
  const template = [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <title>Rakuen Software</title>',
    '    <meta',
    '      name="description"',
    '      content="the shared default"',
    '    />',
    '  </head>',
    '  <body><div id="root"></div></body>',
    '</html>',
  ].join('\n');

  const out = injectHead(
    template,
    headTags({ origin: 'https://rakuensoftware.com', path: '/blog', title: 'Blog' }),
  );

  /* Two of either and a crawler picks whichever it likes. */
  assert.equal(out.match(/<title>/g).length, 1);
  assert.equal(out.match(/name="description"/g).length, 1);
  assert.match(out, /<title>Blog<\/title>/);
  assert.doesNotMatch(out, /the shared default/);
  assert.match(out, /<meta charset="UTF-8" \/>/);
});

test('injecting into an already-injected document does not stack tags', () => {
  /* vite empties the out directory by default, but a build that does not would
   * feed the previous run's output back in as the template. */
  const template = '<!doctype html><html><head><title>Rakuen Software</title></head><body></body></html>';
  const tags = headTags({ origin: 'https://rakuensoftware.com', path: '/blog', title: 'Blog' });

  const once = injectHead(template, tags);
  const twice = injectHead(once, tags);

  assert.equal(twice, once);
  assert.equal(twice.match(/rel="canonical"/g).length, 1);
  assert.equal(twice.match(/property="og:title"/g).length, 1);
  assert.equal(twice.match(/<title>/g).length, 1);
});

test('robots.txt names the sitemap and keeps crawlers off the endpoints', () => {
  const txt = robotsTxt('https://rakuensoftware.com');
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, /^Sitemap: https:\/\/rakuensoftware\.com\/sitemap\.xml$/m);
  assert.match(txt, /^Disallow: \/__analytics\/$/m);
  assert.match(txt, /^Disallow: \/api\/$/m);
});

test('the sitemap is well-formed and carries lastmod when there is one', () => {
  const xml = sitemapXml('https://rakuensoftware.com', [
    { path: '/' },
    { path: '/blog/x', lastmod: '2026-08-22' },
  ]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/rakuensoftware\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/rakuensoftware\.com\/blog\/x<\/loc>/);
  assert.match(xml, /<lastmod>2026-08-22<\/lastmod>/);
  assert.equal(xml.match(/<lastmod>/g).length, 1);
});

/* -------------------------------------------------------------- served ---- */

test('robots.txt and sitemap.xml are served as robots.txt and sitemap.xml', async (context) => {
  if (needsBuild(context)) return;
  const base = await withSite(context);

  const robots = await fetch(`${base}/robots.txt`);
  assert.equal(robots.status, 200);
  /* Served as octet-stream these are ignored: Search Console rejects a sitemap
   * that is not XML, and the SPA fallback used to answer both with HTML. */
  assert.match(robots.headers.get('content-type') ?? '', /^text\/plain/);
  assert.match(await robots.text(), /^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);

  const sitemap = await fetch(`${base}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type') ?? '', /xml/);
  assert.match(await sitemap.text(), /<urlset/);
});

test('every published article is in the sitemap and serves its own head', async (context) => {
  if (needsBuild(context)) return;
  if (!existsSync(postsDir)) {
    context.skip('src/content/posts is generated by `npm run sync`');
    return;
  }
  const base = await withSite(context);
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();

  const files = (await readdir(postsDir)).filter((n) => n.endsWith('.md'));
  assert.ok(files.length > 0, 'expected published articles');

  for (const file of files) {
    const raw = await readFile(resolve(postsDir, file), 'utf8');
    const slug = frontmatterValue(raw, 'slug') ?? file.slice(0, -3);
    const title = frontmatterValue(raw, 'title');

    assert.match(sitemap, new RegExp(`<loc>[^<]*/blog/${slug}</loc>`), `${slug} missing from sitemap`);

    const res = await fetch(`${base}/blog/${slug}`);
    assert.equal(res.status, 200, `${slug} should serve`);
    const html = await res.text();
    /* The title is the whole point: this is the text Reddit and LinkedIn show. */
    assert.ok(html.includes(`<title>${title} — Rakuen Software</title>`), `${slug} has the wrong title`);
    assert.match(html, new RegExp(`rel="canonical" href="[^"]*/blog/${slug}"`), `${slug} canonical`);
    assert.match(html, /property="og:type" content="article"/, `${slug} og:type`);
    assert.match(html, /property="og:description" content="[^"]+"/, `${slug} og:description`);
  }
});

test('the pages that are not articles serve their own head too', async (context) => {
  if (needsBuild(context)) return;
  const base = await withSite(context);

  for (const [path, expected] of [
    ['/', 'Rakuen Software — Linux storage, routing and AI tooling'],
    ['/blog', 'Blog — Rakuen Software'],
    ['/cloud', 'aimee cloud — Rakuen Software'],
    ['/products/smoothnas', 'SmoothNAS — Rakuen Software'],
  ]) {
    const html = await (await fetch(`${base}${path}`)).text();
    assert.ok(html.includes(`<title>${expected}</title>`), `${path} should be titled "${expected}"`);
  }
});

test('the index route follows the hostname aimee cloud is served on', async (context) => {
  if (needsBuild(context)) return;
  const site = await listen(servePublic);
  context.after(() => site.close());
  const port = site.address().port;

  /* Same build, same "/" path, different site. Without this every share of
   * https://aimee.rakuensoftware.com/ previews as the company home page. */
  const cloud = await getWithHost(port, '/', 'aimee.rakuensoftware.com');
  assert.ok(cloud.body.includes('<title>aimee cloud — Rakuen Software</title>'));
  /* One page on two addresses: the canonical stays on the indexed one. */
  assert.match(cloud.body, /rel="canonical" href="https:\/\/rakuensoftware\.com\/cloud"/);

  const main = await getWithHost(port, '/', 'rakuensoftware.com');
  assert.ok(
    main.body.includes('<title>Rakuen Software — Linux storage, routing and AI tooling</title>'),
  );

  /* A hostname that merely contains "aimee" is not us. */
  const other = await getWithHost(port, '/', 'notaimee.example.com');
  assert.ok(
    other.body.includes('<title>Rakuen Software — Linux storage, routing and AI tooling</title>'),
  );
});

test('a path with no page behind it is not served as a copy of the home page', async (context) => {
  if (needsBuild(context)) return;
  const base = await withSite(context);

  for (const path of ['/nothing-here', '/blog/an-article-that-was-retired', '/404']) {
    const res = await fetch(`${base}${path}`);
    const html = await res.text();
    assert.match(html, /name="robots" content="noindex"/, `${path} should ask not to be indexed`);
    /* The old fallback sent index.html, whose canonical points at the home
     * page — which invites a search engine to treat a mistyped URL as another
     * copy of it. */
    assert.doesNotMatch(html, /rel="canonical"/, `${path} should claim no canonical`);
  }
});

test('a retired article still answers 404 with the app shell', async (context) => {
  if (needsBuild(context)) return;
  if (!existsSync(postsDir)) {
    context.skip('src/content/posts is generated by `npm run sync`');
    return;
  }
  const base = await withSite(context);
  const res = await fetch(`${base}/blog/an-article-that-was-retired`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') ?? '', /text\/html/);
});

test('the directory-index lookup cannot be walked out of dist', async (context) => {
  if (needsBuild(context)) return;
  const base = await withSite(context);

  /* Serving prerendered routes means resolving a path to <path>/index.html, so
   * the containment check has to hold for the directory form as well. */
  for (const path of ['/%2e%2e/server.mjs', '/%2e%2e/package.json', '/assets/%2e%2e/%2e%2e/server.mjs']) {
    const res = await fetch(`${base}${path}`);
    const body = await res.text();
    assert.doesNotMatch(body, /createServer|"dependencies"/, `${path} leaked a file outside dist`);
    assert.match(res.headers.get('content-type') ?? '', /text\/html/, `${path} should fall back to the shell`);
  }
});
