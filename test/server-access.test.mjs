import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { serveDashboard, servePublic } from '../server.mjs';

function listen(handler) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => void handler(req, res));
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('dashboard listener denies loopback while public health remains available', async (context) => {
  const dashboard = await listen(serveDashboard);
  const publicSite = await listen(servePublic);
  context.after(() => dashboard.close());
  context.after(() => publicSite.close());
  const dashboardPort = dashboard.address().port;
  const publicPort = publicSite.address().port;

  const denied = await fetch(`http://127.0.0.1:${dashboardPort}/`);
  assert.equal(denied.status, 403);
  assert.equal(await denied.text(), 'Forbidden');

  const health = await fetch(`http://127.0.0.1:${publicPort}/__analytics/health`);
  assert.equal(health.status, 204);
  const notDashboard = await fetch(`http://127.0.0.1:${publicPort}/api/summary?days=7`);
  assert.notEqual(notDashboard.headers.get('content-type'), 'application/json; charset=utf-8');
});
