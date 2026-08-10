import test from 'node:test';
import assert from 'node:assert/strict';
import { addressInCidr, buildSummary, normalizeEvent } from '../lib/analytics.mjs';

test('LAN CIDR accepts both halves of the /23 and rejects adjacent networks', () => {
  assert.equal(addressInCidr('192.168.0.1', '192.168.0.0/23'), true);
  assert.equal(addressInCidr('192.168.1.254', '192.168.0.0/23'), true);
  assert.equal(addressInCidr('::ffff:192.168.1.5', '192.168.0.0/23'), true);
  assert.equal(addressInCidr('192.168.2.1', '192.168.0.0/23'), false);
  assert.equal(addressInCidr('10.0.0.1', '192.168.0.0/23'), false);
  assert.equal(addressInCidr('127.0.0.1', '192.168.0.0/23'), false);
  assert.equal(addressInCidr('::1', '192.168.0.0/23'), false);
});

test('collector validates events, filters bots, and coarsens device data', () => {
  const event = normalizeEvent({
    visitorId: 'visitor-1', sessionId: 'session-1', path: '/blog?utm=test',
    referrer: 'https://google.com/search', screenWidth: 390,
  }, 'Mozilla/5.0', new Date('2026-08-10T10:00:00Z'));
  assert.deepEqual(event, {
    timestamp: '2026-08-10T10:00:00.000Z', visitorId: 'visitor-1', sessionId: 'session-1',
    path: '/blog?utm=test', referrer: 'https://google.com/search', source: '', campaign: '', device: 'Mobile',
  });
  assert.equal(normalizeEvent({ visitorId: 'v', sessionId: 's', path: 'invalid' }), null);
  assert.equal(normalizeEvent({ visitorId: 'v', sessionId: 's', path: '/' }, 'Googlebot'), null);
});

test('summary reports visitors, sessions, sources, and comparison changes', () => {
  const base = { referrer: '', source: '', campaign: '', device: 'Desktop' };
  const events = [
    { ...base, timestamp: '2026-08-09T10:00:00Z', visitorId: 'a', sessionId: 'a1', path: '/', referrer: 'https://www.google.com/' },
    { ...base, timestamp: '2026-08-09T10:01:00Z', visitorId: 'a', sessionId: 'a1', path: '/blog' },
    { ...base, timestamp: '2026-08-10T12:00:00Z', visitorId: 'b', sessionId: 'b1', path: '/', source: 'newsletter', device: 'Mobile' },
    { ...base, timestamp: '2026-08-01T12:00:00Z', visitorId: 'old', sessionId: 'old1', path: '/' },
  ];
  const summary = buildSummary(events, 7, new Date('2026-08-10T18:00:00Z'));
  assert.deepEqual(summary.totals, { visitors: 2, views: 3, sessions: 2, bounceRate: 50 });
  assert.equal(summary.sources[0].source, 'Google');
  assert.equal(summary.sources[1].source, 'newsletter');
  assert.deepEqual(summary.pages[0], { path: '/', views: 2, visitors: 2 });
  assert.equal(summary.changes.visitors, 100);
  assert.equal(summary.trend.length, 7);
});
