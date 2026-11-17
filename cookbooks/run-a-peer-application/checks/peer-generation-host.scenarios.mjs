// Executes only in Cloudflare's workerd test pool, from installed public packages.
import assert from 'node:assert/strict';
import { inject, test } from 'vitest';
import { createPeerRendezvous, createPeerInvitationListener } from '@tendriller/core/peers';
import { createTestPage, initializeTestService } from '@tendriller/engine/testing';

test('public host controls and rendezvous serve independent native application peers', async () => {
  await initializeTestService(inject('d1Migrations'));
  const bridge = inject('bridge');
  const sessions = new Map(), introduced = new Map(), running = new Set();
  let page, nextSession = 0, stopping = false;
  const send = async (path, value) => {
    const response = await fetch(`${bridge}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    assert.equal(response.status, 200, 'Test bridge delivery failed');
  };
  const handle = async job => {
    if (job.kind.startsWith('introductions.')) {
      const [, kind, action] = job.kind.split('.');
      if (action === 'open') {
        assert.ok(page);
        const session = kind === 'rendezvous' ? createPeerRendezvous(page.rendezvousSocket(job.channel, job.peerId))
          : createPeerInvitationListener(page.invitationSocket(job.peerId), job.peerId);
        const id = `${++nextSession}`;
        introduced.set(id, { kind, session, iterator: (kind === 'rendezvous' ? session.messages : session.invitations)[Symbol.asyncIterator]() });
        return { id };
      }
      const endpoint = introduced.get(job.id); assert.ok(endpoint);
      assert.equal(endpoint.kind, kind);
      if (action === 'ready') return await endpoint.session.ready ?? { ready: true };
      if (action === 'next') { const next = await endpoint.iterator.next(); return next.done ? null : next.value; }
      if (action === 'send') { await endpoint.session.send(job.description); return { sent: true }; }
      if (action === 'close') { endpoint.session.close(); return { closed: true }; }
      throw Error(`Unknown introduction action ${action}`);
    }
    switch (job.kind) {
      case 'page':
        assert.equal(page, undefined, 'The fixture owns exactly one application');
        page = await createTestPage({ application: { id: job.applicationId } });
        return { ready: true };
      case 'api': {
        assert.ok(page);
        const response = await page.api(job.method, job.path, job.body);
        return { status: response.status, value: await response.json() };
      }
      case 'asset': {
        assert.ok(page);
        const response = await page.asset(job.path);
        return { status: response.status, text: await response.text() };
      }
      case 'restart':
        assert.ok(page); await page.restart(); return { restarted: true };
      case 'traffic':
        assert.ok(page);
        return { host: page.hostTraffic, rendezvous: [...sessions.values()].flatMap(pair => pair.map(value => value.session.stats))
          .concat([...introduced.values()].filter(value => value.kind === 'rendezvous').map(value => value.session.stats)),
          invitations: [...introduced.values()].filter(value => value.kind === 'invitations').map(value => value.session.stats) };
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
        for (const endpoint of introduced.values()) assert.equal(endpoint.session.stats.closed, true);
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
    for (const endpoint of introduced.values()) endpoint.session.close();
    await Promise.allSettled(running);
  }
}, 360_000);
