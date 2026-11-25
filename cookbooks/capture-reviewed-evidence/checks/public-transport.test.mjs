import test from 'node:test';
import assert from 'node:assert/strict';
import { publicTransport } from './public-transport.mjs';

test('test bridge preserves separate bounded reliable/live lanes and boolean live acceptance', async () => {
  const receiver = publicTransport(() => true);
  const sender = publicTransport((lane, bytes) => receiver.deliver(lane, bytes));
  try {
    assert.equal(await sender.connection.live.trySend(new Uint8Array([2])), true);
    await sender.connection.send(new Uint8Array([1]));
    const reliable = receiver.connection.frames()[Symbol.asyncIterator]();
    const live = receiver.connection.live.frames()[Symbol.asyncIterator]();
    assert.deepEqual((await reliable.next()).value, new Uint8Array([1]));
    assert.deepEqual((await live.next()).value, new Uint8Array([2]));
    await reliable.return(); await live.return();
    for (let index = 0; index < 64; index++) receiver.deliver('reliable', [index]);
    assert.throws(() => receiver.deliver('reliable', [65]), /capacity/);
    assert.equal(receiver.deliver('live', [1]), true);
    assert.throws(() => receiver.deliver('live', new Uint8Array(1024 * 1024 + 1)), /capacity/);
    assert.throws(() => receiver.deliver('unknown', []), /capacity/);
  } finally { await sender.close(); await receiver.close(); }
});

test('closing the test bridge wakes pending readers and rejects new sends', async () => {
  const bridge = publicTransport(() => true);
  const frames = bridge.connection.frames()[Symbol.asyncIterator]();
  const pending = frames.next();
  await bridge.close();
  assert.equal((await pending).done, true);
  assert.equal(bridge.deliver('reliable', [1]), false);
  await assert.rejects(bridge.connection.send(new Uint8Array([1])), { name: 'AbortError' });
  await assert.rejects(bridge.connection.live.trySend(new Uint8Array([1])), { name: 'AbortError' });
});
