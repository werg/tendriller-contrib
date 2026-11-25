import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import { createRelayIngress } from './operation-set-relay-ingress.mjs';

// The packed SDK supplies these at runtime; mirror its declared v1 window here.
const limits = { packetBytes: 65_536, pendingPackets: 32, pendingBytes: 512 * 1024, livePendingPackets: 8 };
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
class Socket extends EventEmitter {
  pauses = 0; resumes = 0; terminated = false;
  pause() { this.pauses++; }
  resume() { this.resumes++; }
  terminate() { this.terminated = true; }
}

for (const [lane, window] of [['reliable', 32], ['live', 8]]) test(`${lane} ingress drains both windows and an outstanding completion in FIFO order`, async () => {
  const count = 2 * window + 1;
  const socket = new Socket(), gate = deferred(), started = deferred(), complete = deferred(), delivered = [], expected = [];
  const ingress = createRelayIngress(socket, { limits, lane, forward: async frame => {
    delivered.push(frame);
    // The workerd send released public credit; its HTTP completion is held.
    if (delivered.length === 1) { started.resolve(); await gate.promise; }
    if (delivered.length === count) complete.resolve();
  } });
  const send = (bytes, binary) => {
    expected.push({ binary, data: bytes.toString(binary ? 'base64' : 'utf8') });
    socket.emit('message', bytes, binary);
  };
  const packet = (sequence, size) => {
    const bytes = Buffer.alloc(size + 4, sequence); bytes.writeUInt32BE(sequence, 0); return bytes;
  };
  send(packet(1, limits.packetBytes), true);
  await started.promise;
  // pause() cannot retract frames from the same already-read TCP chunk.
  for (let index = 0; index < window; index++)
    send(packet(index + 2, Math.min(limits.packetBytes, Math.floor(limits.pendingBytes / window))), true);
  for (let index = 0; index < window; index++) {
    send(Buffer.from(JSON.stringify({ t: 'received', session: '00000000-0000-4000-8000-000000000001',
      sequence: index + 1, receipt: index.toString(16).padStart(32, '0') })), false);
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
  for (const [lane, count, size, binary, error] of [
    ['reliable', 66, 20, true, 'QUEUE'],
    ['live', 18, 20, true, 'QUEUE'],
    ['reliable', 10, 65_540, true, 'QUEUE'],
    ['live', 10, 65_540, true, 'QUEUE'],
    ['reliable', 1, 65_541, true, 'PACKET'],
    ['reliable', 1, 257, false, 'PACKET'],
  ]) {
    const socket = new Socket(), failures = [];
    const ingress = createRelayIngress(socket, { limits, lane, onFailure: error => failures.push(error.message),
      forward: async () => { assert.fail('Refused bursts must not be forwarded'); } });
    for (let index = 0; index < count; index++) socket.emit('message', Buffer.alloc(size), binary);
    assert.equal(socket.terminated, true);
    assert.ok(ingress.stats.pendingFrames <= ingress.stats.maxFrames);
    assert.ok(ingress.stats.pendingBytes <= ingress.stats.maxBytes);
    assert.deepEqual(failures, [`FIXTURE_RELAY_INGRESS_${error}_LIMIT`]);
    await assert.rejects(ingress.close(), new RegExp(`FIXTURE_RELAY_INGRESS_${error}_LIMIT`, 'u'));
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
      const closed = ingress.close();
      assert.equal(socket.listenerCount('message'), 0, 'Fence application input before resuming the close handshake');
      assert.equal(socket.resumes, 1, 'A paused socket must be able to receive its protocol close reply');
      socket.emit('message', Buffer.alloc(20), true);
      gate.resolve(); await closed;
      assert.equal(socket.terminated, false);
    }
    assert.equal(calls, 1, 'Queued frames must not cross an ended owner');
    assert.equal(ingress.stats.pendingFrames, 0); assert.equal(ingress.stats.pendingBytes, 0);
    assert.equal(socket.listenerCount('message'), 0);
  }
});
