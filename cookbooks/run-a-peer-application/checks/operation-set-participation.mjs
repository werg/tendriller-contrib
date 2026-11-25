// Explicit qualification topology only. Production lifecycle belongs to
// @tendriller/core/peers participateApplication, not this test mailbox.
import assert from 'node:assert/strict';

export function signalingPair() {
  const queues = [[], []], waiting = [null, null], retired = [false, false];
  const observation = { sentMessages: 0, sentBytes: 0, closed: false };
  const endpoint = index => ({
    messages: { async *[Symbol.asyncIterator]() {
      const value = queues[index].length ? queues[index].shift() : await new Promise(resolve => { waiting[index] = resolve; });
      if (value !== null) yield value;
    } },
    async send(value) {
      observation.sentMessages++; observation.sentBytes += new TextEncoder().encode(JSON.stringify(value)).length;
      const other = 1 - index;
      if (waiting[other]) { const next = waiting[other]; waiting[other] = null; next(value); }
      else queues[other].push(value);
    },
    async close() { retired[index] = true; observation.closed = retired.every(Boolean); },
  });
  return { a: endpoint(0), b: endpoint(1), snapshot: () => structuredClone(observation) };
}

export async function connectFramedSessions(a, b, connections) {
  const opened = await Promise.allSettled([
    a.connectPeer({ connection: connections[0], peerIdentity: b.identity.publicKey }),
    b.connectPeer({ connection: connections[1], peerIdentity: a.identity.publicKey }),
  ]);
  if (opened.some(item => item.status === 'rejected')) {
    await Promise.allSettled(connections.map(connection => connection.close()));
    throw opened.find(item => item.status === 'rejected').reason;
  }
  const links = opened.map(item => item.value);
  assert.equal(links[0].peerIdentity, b.identity.publicKey);
  assert.equal(links[1].peerIdentity, a.identity.publicKey);
  return { links, synchronize: () => Promise.all(links.map(link => link.synchronize())),
    close: () => Promise.all(links.map(link => link.close())) };
}

// Bounded framed queues exercise the public authenticated/encrypted channel.
// They deliberately make no physical-network claim.
// `live` adds the optional unreliable, bounded datagram channel that carries
// disposable signals. Congestion is refused before dispatch (`false`), never queued.
export function framedPair({ live = false } = {}) {
  const states = [0, 1].map(() => ({ queue: [], wake: null, controller: new AbortController(), sentBytes: 0, receivedBytes: 0,
    liveQueue: [], liveWake: null, liveSentBytes: 0, liveReceivedBytes: 0 }));
  const liveEndpoint = index => ({
    signal: states[index].controller.signal,
    async trySend(frame, { signal } = {}) {
      assert.ok(frame instanceof Uint8Array && frame.length <= 20_000);
      signal?.throwIfAborted(); states[index].controller.signal.throwIfAborted();
      const remote = states[1 - index]; remote.controller.signal.throwIfAborted();
      if (remote.liveQueue.length >= 64) return false;
      states[index].liveSentBytes += frame.length; remote.liveReceivedBytes += frame.length;
      remote.liveQueue.push(frame.slice()); remote.liveWake?.(); return true;
    },
    async *frames(signal) {
      const state = states[index], wake = () => state.liveWake?.();
      signal?.addEventListener('abort', wake);
      try {
        while (!state.controller.signal.aborted && !signal?.aborted) {
          if (!state.liveQueue.length) await new Promise(resolve => { state.liveWake = resolve; });
          while (state.liveQueue.length) yield state.liveQueue.shift();
        }
      } finally { signal?.removeEventListener('abort', wake); }
    },
    async close() { for (const state of states) { state.controller.abort(); state.wake?.(); state.liveWake?.(); } },
  });
  const endpoint = index => ({
    signal: states[index].controller.signal,
    ...(live ? { live: liveEndpoint(index) } : {}),
    async send(frame) {
      assert.ok(frame instanceof Uint8Array && frame.length <= 1_100_000);
      const remote = states[1 - index]; assert.ok(!remote.controller.signal.aborted);
      assert.ok(remote.queue.length < 128, 'Qualification transport exceeded its frame bound');
      states[index].sentBytes += frame.length; remote.receivedBytes += frame.length;
      remote.queue.push(frame.slice()); remote.wake?.();
    },
    async *frames(signal) {
      const state = states[index], wake = () => state.wake?.();
      signal?.addEventListener('abort', wake);
      try {
        while (!state.controller.signal.aborted && !signal?.aborted) {
          if (!state.queue.length) await new Promise(resolve => { state.wake = resolve; });
          while (state.queue.length) yield state.queue.shift();
        }
      } finally { signal?.removeEventListener('abort', wake); }
    },
    async close() { for (const state of states) { state.controller.abort(); state.wake?.(); state.liveWake?.(); } },
  });
  return { connections: [endpoint(0), endpoint(1)], inspect: () => ({ sentBytes: states.reduce((n, s) => n + s.sentBytes, 0), receivedBytes: states.reduce((n, s) => n + s.receivedBytes, 0) }),
    inspectLive: () => ({ sentBytes: states.reduce((n, s) => n + s.liveSentBytes, 0), receivedBytes: states.reduce((n, s) => n + s.liveReceivedBytes, 0) }) };
}
export async function connectDirect(a, b, options) {
  const pair = framedPair(options), link = await connectFramedSessions(a, b, pair.connections);
  return { ...link, inspect: pair.inspect, inspectLive: pair.inspectLive };
}
