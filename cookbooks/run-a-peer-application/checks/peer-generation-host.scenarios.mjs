// Executes only in Cloudflare's workerd test pool, from installed public packages.
import assert from 'node:assert/strict';
import { inject, test } from 'vitest';
import { createPeerRendezvous, createPeerInvitationListener } from '@tendriller/core/peers';
import { createTestPage, initializeTestService } from '@tendriller/engine/testing';

test('public host participant and peer transports serve independent application peers', async () => {
  await initializeTestService(inject('d1Migrations'));
  const bridge = inject('bridge');
  const sessions = new Map(), introduced = new Map(), relays = new Map(), running = new Set();
  const privateMarkers = ['A continues without host access', 'B continues through its coordinating peer', 'private-live-signal-marker', 'private-content-marker'];
  let page, nextSession = 0, stopping = false;
  const send = async (path, value) => {
    const response = await fetch(`${bridge}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    assert.equal(response.status, 200, 'Test bridge delivery failed');
  };
  const handle = async job => {
    if (job.kind.startsWith('relay.')) {
      const action = job.kind.slice(6);
      if (action === 'open') {
        assert.ok(page);
        assert.ok(['reliable', 'live'].includes(job.lane));
        const socket = page.relaySocket(job.channel, job.peerId, job.remotePeerId, job.lane);
        const endpoint = relayMailbox(socket, privateMarkers, job.lane);
        const id = `${++nextSession}`; relays.set(id, endpoint); return { id };
      }
      if (action === 'traffic') return { boundary: 'actual-workerd-websocket-relay',
        sockets: [...relays.values()].map(endpoint => endpoint.inspect()), host: page.hostTraffic };
      if (action === 'cut') {
        for (const endpoint of relays.values()) endpoint.close();
        return { disconnected: true };
      }
      const endpoint = relays.get(job.id); assert.ok(endpoint, 'Unknown fixture relay socket');
      if (action === 'next') return endpoint.next();
      if (action === 'send') { endpoint.send(job.frame); return { sent: true }; }
      if (action === 'close') { endpoint.close(); return { closed: true }; }
      throw Error(`Unknown relay action ${action}`);
    }
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
        return { host: Object.fromEntries(Object.entries(page.hostTraffic).filter(([key]) => !key.startsWith('relay'))), rendezvous: [...sessions.values()].flatMap(pair => pair.map(value => value.session.stats))
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
        for (const endpoint of relays.values()) assert.equal(endpoint.inspect().closed, true);
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


// Test delivery only: preserve each actual Worker WebSocket message as bytes.
// The fixture bounds its own queue and scans declared private markers without
// decoding the encrypted peer protocol or supplying authentication behavior.
function relayMailbox(socket, markers, lane) {
  const queue = []; let reader, queuedBytes = 0, closed = false;
  const stats = { lane, sentBytes: 0, receivedBytes: 0, sentBinaryFrames: 0, receivedBinaryFrames: 0,
    maxQueuedBytes: 0, plaintextMatches: [] };
  const observe = bytes => {
    for (const marker of markers) if (Buffer.from(bytes).includes(Buffer.from(marker)) && !stats.plaintextMatches.includes(marker)) stats.plaintextMatches.push(marker);
  };
  const push = event => {
    if (closed && event.type !== 'close') return;
    const size = event.data?.length ?? 0;
    if (reader) { const deliver = reader; reader = undefined; deliver(event); return; }
    assert.ok(queue.length < 64 && queuedBytes + size <= 2_200_000, 'The relay test mailbox is bounded');
    queue.push({ event, size }); queuedBytes += size; stats.maxQueuedBytes = Math.max(stats.maxQueuedBytes, queuedBytes);
  };
  socket.addEventListener('message', event => {
    const binary = typeof event.data !== 'string', bytes = binary ? Buffer.from(event.data) : Buffer.from(event.data, 'utf8');
    stats.receivedBytes += bytes.length; if (binary) { stats.receivedBinaryFrames++; observe(bytes); }
    push({ type: 'message', binary, data: binary ? bytes.toString('base64') : event.data });
  });
  socket.addEventListener('close', () => { if (closed) return; closed = true; push({ type: 'close' }); });
  socket.addEventListener('error', () => push({ type: 'error', message: 'WORKER_RELAY_SOCKET_FAILED' }));
  return {
    inspect: () => ({ ...stats, plaintextMatches: [...stats.plaintextMatches], closed: closed || socket.readyState === 3 }),
    next() {
      if (queue.length) { const { event, size } = queue.shift(); queuedBytes -= size; return Promise.resolve(event); }
      if (closed) return Promise.resolve({ type: 'close' });
      assert.equal(reader, undefined, 'One fixture reader owns each raw socket');
      return new Promise(resolve => { reader = resolve; });
    },
    send(frame) {
      const bytes = frame.binary ? Buffer.from(frame.data, 'base64') : Buffer.from(frame.data, 'utf8');
      stats.sentBytes += bytes.length; if (frame.binary) { stats.sentBinaryFrames++; observe(bytes); }
      socket.send(frame.binary ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) : frame.data);
    },
    close() { socket.close(1000, 'Fixture owner closed'); },
  };
}
