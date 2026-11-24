import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import { createRelayIngress } from './peer-generation-relay-ingress.mjs';

// The packed SDK supplies these at runtime; mirror its declared v1 window here.
const limits = { packetBytes: 65_536, pendingPackets: 32, pendingBytes: 512 * 1024, livePendingPackets: 8 };
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
class Socket extends EventEmitter {
  pauses = 0; resumes = 0; terminated = false;
  pause() { this.pauses++; }
  resume() { this.resumes++; }
  terminate() { this.terminated = true; }
}

for (const count of [17, 64]) test(`raw relay ingress preserves a legal coalesced ${count}-message burst under backpressure`, async () => {
  const socket = new Socket(), gate = deferred(), complete = deferred(), delivered = [], expected = [];
  const ingress = createRelayIngress(socket, { limits, forward: async frame => {
    await gate.promise; delivered.push(frame); if (delivered.length === count) complete.resolve();
  } });
  for (let index = 0; index < count; index++) {
    // Include both windows: binary data/physical credits and reverse receipts.
    const binary = index < 32, bytes = binary ? Buffer.alloc(count === 17 ? 20 : 16_388, index)
      : Buffer.from(JSON.stringify({ t: 'received', sequence: index - 31 }));
    expected.push({ binary, data: bytes.toString(binary ? 'base64' : 'utf8') });
    socket.emit('message', bytes, binary);
  }
  assert.equal(socket.terminated, false);
  assert.equal(socket.pauses, 1);
  assert.equal(ingress.stats.pendingFrames, count);
  assert.ok(ingress.stats.pendingBytes <= ingress.stats.maxBytes);
  gate.resolve(); await complete.promise; await setImmediate();
  assert.deepEqual(delivered, expected, 'Bytes, binary flags and message order must remain exact');
  assert.equal(socket.resumes, 1);
  assert.equal(ingress.stats.pendingFrames, 0); assert.equal(ingress.stats.pendingBytes, 0);
  await ingress.close(); assert.equal(socket.listenerCount('message'), 0);
});

test('raw relay ingress refuses frame-count, byte and individual-packet overflow without growing its queue', async () => {
  for (const [count, size, binary, error] of [
    [66, 20, true, 'PENDING_SEND'],
    [10, 65_540, true, 'PENDING_BYTE'],
    [1, 65_541, true, 'INGRESS_PACKET'],
    [1, 257, false, 'INGRESS_PACKET'],
  ]) {
    const socket = new Socket();
    const ingress = createRelayIngress(socket, { limits, forward: async () => { assert.fail('Refused bursts must not be forwarded'); } });
    for (let index = 0; index < count; index++) socket.emit('message', Buffer.alloc(size), binary);
    assert.equal(socket.terminated, true);
    assert.ok(ingress.stats.pendingFrames <= ingress.stats.maxFrames);
    assert.ok(ingress.stats.pendingBytes <= ingress.stats.maxBytes);
    await assert.rejects(ingress.close(), new RegExp(`FIXTURE_RELAY_${error}_LIMIT`, 'u'));
    assert.equal(ingress.stats.pendingFrames, 0); assert.equal(ingress.stats.pendingBytes, 0);
    assert.equal(socket.listenerCount('message'), 0);
  }
});

test('raw relay ingress fences queued frames on forwarding failure and owner close', async () => {
  for (const failed of [false, true]) {
    const socket = new Socket(), started = deferred(), gate = deferred(); let calls = 0;
    const ingress = createRelayIngress(socket, { limits, forward: async () => {
      calls++; started.resolve(); await gate.promise; if (failed) throw Error('FIXTURE_FORWARD_FAILED');
    } });
    for (let index = 0; index < 17; index++) socket.emit('message', Buffer.alloc(20), true);
    await started.promise;
    if (failed) {
      gate.resolve(); await setImmediate();
      await assert.rejects(ingress.close(), /FIXTURE_FORWARD_FAILED/u);
      assert.equal(socket.terminated, true);
    } else {
      const closed = ingress.close(); gate.resolve(); await closed;
      assert.equal(socket.terminated, false);
    }
    assert.equal(calls, 1, 'Queued frames must not cross an ended owner');
    assert.equal(ingress.stats.pendingFrames, 0); assert.equal(ingress.stats.pendingBytes, 0);
    assert.equal(socket.listenerCount('message'), 0);
  }
});


test('socket backpressure retains both windows plus an in-flight HTTP completion', async () => {
  const socket = new Socket(), entered = deferred(), gate = deferred(), complete = deferred(), delivered = [];
  const ingress = createRelayIngress(socket, { limits, forward: async frame => {
    delivered.push(frame);
    if (delivered.length === 1) { entered.resolve(); await gate.promise; }
    if (delivered.length === 65) complete.resolve();
  } });
  socket.emit('message', Buffer.alloc(20), true);
  await entered.promise;
  try {
    for (let index = 0; index < 32; index++) {
      socket.emit('message', Buffer.alloc(16_388, index), true);
      socket.emit('message', Buffer.from(JSON.stringify({ t: 'received', sequence: index })), false);
    }
    assert.equal(socket.terminated, false); assert.equal(socket.pauses, 1);
    assert.equal(ingress.stats.pendingFrames, 65); assert.equal(ingress.stats.maxFrames, 65);
    assert.equal(delivered.length, 1);
  } finally { gate.resolve(); }
  await complete.promise; await setImmediate();
  assert.equal(socket.resumes, 1); assert.equal(ingress.stats.pendingFrames, 0);
  await ingress.close();
});

test('live socket backpressure uses its smaller window and fences overflow', async () => {
  const socket = new Socket(), entered = deferred(), gate = deferred(); let calls = 0;
  const ingress = createRelayIngress(socket, { limits, lane: 'live', forward: async () => {
    calls++; entered.resolve(); await gate.promise;
  } });
  socket.emit('message', Buffer.alloc(20), true); await entered.promise;
  try {
    for (let index = 0; index < 8; index++) {
      socket.emit('message', Buffer.alloc(20), true);
      socket.emit('message', Buffer.from('{}'), false);
    }
    assert.equal(socket.terminated, false); assert.equal(ingress.stats.pendingFrames, 17);
    assert.equal(ingress.stats.maxFrames, 17); assert.equal(socket.pauses, 1);
    socket.emit('message', Buffer.from('{}'), false);
    assert.equal(socket.terminated, true);
  } finally { gate.resolve(); }
  await assert.rejects(ingress.close(), /FIXTURE_RELAY_PENDING_SEND_LIMIT/u);
  assert.equal(calls, 1); assert.equal(ingress.stats.pendingFrames, 0);
});
