// Executes only in Cloudflare's workerd test pool, from installed public packages.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { inject, test } from 'vitest';
import { createPeerRendezvous } from '@tendriller/core/peers';
import { createTestPage, initializeTestService } from '@tendriller/engine/testing';

test('public host controls and rendezvous serve independent native application peers', async () => {
  await initializeTestService(inject('d1Migrations'));
  const bridge = inject('bridge');
  const sessions = new Map(), running = new Set();
  let page, nextSession = 0, stopping = false;
  const send = async (path, value) => {
    const response = await fetch(`${bridge}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    assert.equal(response.status, 200, 'Test bridge delivery failed');
  };
  const handle = async job => {
    switch (job.kind) {
      case 'page':
        assert.equal(page, undefined, 'The fixture owns exactly one application');
        page = await createTestPage({ application: { kind: 'peer', id: job.applicationId } });
        return { ready: true };
      case 'api': {
        assert.ok(page);
        const response = await page.api(job.method, job.path, job.body);
        return { status: response.status, value: await response.json() };
      }
      case 'api.binary': {
        assert.ok(page);
        const body = job.base64 === undefined ? undefined : new Uint8Array(Buffer.from(job.base64, 'base64'));
        const response = await page.api(job.method, job.path, body,
          { headers: job.contentType === undefined ? {} : { 'Content-Type': job.contentType } });
        return { status: response.status, contentType: response.headers.get('Content-Type') ?? 'application/octet-stream',
          base64: Buffer.from(await response.arrayBuffer()).toString('base64') };
      }
      case 'page.fetch': {
        assert.ok(page);
        const response = await page.fetchPage(job.path);
        const headers = {};
        for (const name of ['Content-Type', 'Cache-Control', 'Content-Security-Policy', 'ETag']) {
          const value = response.headers.get(name); if (value !== null) headers[name] = value;
        }
        return { status: response.status, headers, base64: Buffer.from(await response.arrayBuffer()).toString('base64') };
      }
      case 'restart':
        assert.ok(page); await page.restart(); return { restarted: true };
      case 'traffic':
        assert.ok(page);
        return { host: page.hostTraffic, rendezvous: [...sessions.values()].flatMap(pair => pair.map(value => value.session.stats)) };
      case 'rendezvous.open': {
        assert.ok(page);
        const pair = job.peers.map(peer => {
          const session = createPeerRendezvous(page.rendezvousSocket(job.channel, peer));
          return { session, iterator: session.messages[Symbol.asyncIterator]() };
        });
        const id = `${++nextSession}`;
        sessions.set(id, pair);
        const ready = await Promise.all(pair.map(value => value.session.ready));
        return { id, roles: ready.map(value => value.role) };
      }
      case 'rendezvous.next': {
        const item = await sessions.get(job.id)[job.index].iterator.next();
        return item.done ? null : item.value;
      }
      case 'rendezvous.send':
        await sessions.get(job.id)[job.index].session.send(job.body); return { sent: true };
      case 'rendezvous.close':
        sessions.get(job.id)[job.index].session.close(); return { closed: true };
      case 'stop':
        stopping = true;
        for (const pair of sessions.values()) for (const endpoint of pair) assert.equal(endpoint.session.stats.closed, true);
        return { stopped: true, host: page?.hostTraffic };
      default: throw Error(`Unknown test bridge operation ${job.kind}`);
    }
  };
  await send('/testing/ready', { ready: true });
  try {
    while (!stopping) {
      const response = await fetch(`${bridge}/testing/next`);
      if (response.status === 204) continue;
      assert.equal(response.status, 200);
      const job = await response.json();
      if (job.kind === 'stop') {
        await Promise.all(running);
        const value = await handle(job);
        await send('/testing/complete', { id: job.jobId, value });
        break;
      }
      assert.ok(running.size < 32, 'The test bridge is bounded');
      const task = handle(job).then(value => send('/testing/complete', { id: job.jobId, value }),
        error => send('/testing/complete', { id: job.jobId, error: error instanceof Error ? error.message : String(error) }));
      running.add(task);
      void task.then(() => running.delete(task), () => running.delete(task));
    }
  } finally {
    for (const pair of sessions.values()) for (const endpoint of pair) endpoint.session.close();
    await Promise.allSettled(running);
  }
}, inject('fixtureLifetimeMs') ?? 360_000);
