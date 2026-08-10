import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const DAY = 86_400_000;
const BOT_PATTERN = /bot|crawler|spider|preview|slurp|headless|lighthouse|monitor/i;

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function normalizeEvent(input, userAgent = '', now = new Date()) {
  if (input == null || typeof input !== 'object' || BOT_PATTERN.test(userAgent)) return null;

  const visitorId = cleanString(input.visitorId, 80);
  const sessionId = cleanString(input.sessionId, 80);
  const path = cleanString(input.path, 500);
  if (!visitorId || !sessionId || !path.startsWith('/') || path.startsWith('//')) return null;

  const width = Number(input.screenWidth);
  return {
    timestamp: now.toISOString(),
    visitorId,
    sessionId,
    path,
    referrer: cleanString(input.referrer, 1000),
    source: cleanString(input.source, 120),
    campaign: cleanString(input.campaign, 160),
    device: Number.isFinite(width) && width <= 767 ? 'Mobile' : Number.isFinite(width) && width <= 1024 ? 'Tablet' : 'Desktop',
  };
}

export function createEventStore(filePath, retentionDays = 400) {
  let writeQueue = Promise.resolve();
  let writesSinceCompaction = 0;

  function enqueue(operation) {
    const result = writeQueue.then(operation);
    // Preserve ordering without letting a transient filesystem error poison
    // every later operation. The caller still receives the original failure.
    writeQueue = result.catch(() => undefined);
    return result;
  }

  async function compactFile() {
    let contents;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    const cutoff = Date.now() - retentionDays * DAY;
    const retained = contents.split('\n').filter(Boolean).filter((line) => {
      try {
        return Date.parse(JSON.parse(line).timestamp) >= cutoff;
      } catch {
        return false;
      }
    });
    const temporary = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporary, retained.length ? `${retained.join('\n')}\n` : '', { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, filePath);
    writesSinceCompaction = 0;
  }

  return {
    append(event) {
      return enqueue(async () => {
        await mkdir(dirname(filePath), { recursive: true });
        await appendFile(filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
        writesSinceCompaction += 1;
        if (writesSinceCompaction >= 1000) await compactFile();
      });
    },

    compact() {
      return enqueue(compactFile);
    },

    async read() {
      await writeQueue;
      try {
        const contents = await readFile(filePath, 'utf8');
        return contents.split('\n').filter(Boolean).flatMap((line) => {
          try {
            return [JSON.parse(line)];
          } catch {
            return [];
          }
        });
      } catch (error) {
        if (error?.code === 'ENOENT') return [];
        throw error;
      }
    },
  };
}

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function sourceName(event, siteHost) {
  if (event.source) return event.source;
  if (!event.referrer) return 'Direct';
  try {
    const host = new URL(event.referrer).hostname.replace(/^www\./, '');
    if (!host || host === siteHost || host.endsWith(`.${siteHost}`)) return 'Direct';
    if (host.includes('google.')) return 'Google';
    if (host === 'github.com') return 'GitHub';
    if (host.includes('bing.com')) return 'Bing';
    if (host.includes('duckduckgo.com')) return 'DuckDuckGo';
    return host;
  } catch {
    return 'Direct';
  }
}

function summarizePeriod(events) {
  const visitors = new Set(events.map((event) => event.visitorId)).size;
  const sessionCounts = new Map();
  for (const event of events) sessionCounts.set(event.sessionId, (sessionCounts.get(event.sessionId) ?? 0) + 1);
  const sessions = sessionCounts.size;
  const bounces = [...sessionCounts.values()].filter((count) => count === 1).length;
  return {
    visitors,
    views: events.length,
    sessions,
    bounceRate: sessions === 0 ? 0 : Math.round((bounces / sessions) * 1000) / 10,
  };
}

function rank(items, key, label, limit = 6) {
  const groups = new Map();
  for (const item of items) {
    const name = key(item);
    const current = groups.get(name) ?? { name, views: 0, visitors: new Set() };
    current.views += 1;
    current.visitors.add(item.visitorId);
    groups.set(name, current);
  }
  return [...groups.values()]
    .map((group) => ({ [label]: group.name, views: group.views, visitors: group.visitors.size }))
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
    .slice(0, limit);
}

export function buildSummary(allEvents, days = 30, now = new Date(), siteHost = 'rakuensoftware.com') {
  const safeDays = [7, 30, 90].includes(days) ? days : 30;
  const today = startOfUtcDay(now);
  const currentStart = today - (safeDays - 1) * DAY;
  const previousStart = currentStart - safeDays * DAY;
  const end = today + DAY;
  const valid = allEvents.filter((event) => Number.isFinite(Date.parse(event.timestamp)));
  const current = valid.filter((event) => {
    const time = Date.parse(event.timestamp);
    return time >= currentStart && time < end;
  });
  const previous = valid.filter((event) => {
    const time = Date.parse(event.timestamp);
    return time >= previousStart && time < currentStart;
  });
  const totals = summarizePeriod(current);
  const previousTotals = summarizePeriod(previous);

  const trend = Array.from({ length: safeDays }, (_, index) => {
    const time = currentStart + index * DAY;
    const date = new Date(time).toISOString().slice(0, 10);
    const dayEvents = current.filter((event) => event.timestamp.slice(0, 10) === date);
    return {
      date,
      views: dayEvents.length,
      visitors: new Set(dayEvents.map((event) => event.visitorId)).size,
    };
  });

  const firstTouch = new Map();
  for (const event of [...current].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    if (!firstTouch.has(event.visitorId)) firstTouch.set(event.visitorId, event);
  }

  const sources = rank([...firstTouch.values()], (event) => sourceName(event, siteHost), 'source');
  const pages = rank(current, (event) => event.path.split('?')[0] || '/', 'path');
  const devices = rank([...firstTouch.values()], (event) => event.device || 'Desktop', 'device', 3);
  const lastEvent = valid.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return {
    range: safeDays,
    generatedAt: now.toISOString(),
    lastEventAt: lastEvent?.timestamp ?? null,
    totals,
    changes: {
      visitors: percentChange(totals.visitors, previousTotals.visitors),
      views: percentChange(totals.views, previousTotals.views),
      sessions: percentChange(totals.sessions, previousTotals.sessions),
      bounceRate: Math.round((totals.bounceRate - previousTotals.bounceRate) * 10) / 10,
    },
    trend,
    sources,
    pages,
    devices,
  };
}

function ipv4Number(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    result = result * 256 + Number(part);
  }
  return result >>> 0;
}

export function addressInCidr(address, cidr) {
  const normalized = address.startsWith('::ffff:') ? address.slice(7) : address;
  const [networkAddress, prefixText] = cidr.split('/');
  const ip = ipv4Number(normalized);
  const network = ipv4Number(networkAddress);
  const prefix = Number(prefixText);
  if (ip == null || network == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ip & mask) === (network & mask);
}
