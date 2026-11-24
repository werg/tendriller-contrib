import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRelayBridgeSender } from './peer-generation-relay-bridge.mjs';

// Public relay contract specimen. The runner loads these fields from its
// verified installed SDK, rather than relying on this test's values.
const limits = { pendingPackets: 32, pendingBytes: 512 * 1024, packetBytes: 64 * 1024, livePendingPackets: 8 };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
function heldBridge(lane = 'reliable') {
  const completion = deferred(), entered = deferred(), observed = [], failures = [], expected = [];
  const diagnostic = { pendingSendsHighWater: 0 }, state = { closed: false };
  const sender = createRelayBridgeSender({ limits, lane, diagnostic, isClosed: () => state.closed,
    async forward(frame) {
      observed.push(frame);
      if (observed.length === 1) { entered.resolve(); await completion.promise; }
    },
    terminate(cause, error) { state.closed = true; failures.push({ cause, error }); },
  });
  const send = (bytes, binary) => {
    expected.push({ binary, data: bytes.toString(binary ? 'base64' : 'utf8') });
    sender.send(bytes, binary);
  };
  const packet = index => { const bytes = Buffer.alloc(16 * 1024 + 4); bytes.writeUInt32BE(index + 1); return bytes; };
  const receipt = index => Buffer.from(JSON.stringify({ t: 'received', session: '00000000-0000-4000-8000-000000000001', sequence: index, receipt: 'c'.repeat(32) }));
  return { sender, send, packet, receipt, completion, entered, observed, failures, expected, diagnostic };
}

test('a held bridge completion admits packet and receipt credit in FIFO order', async () => {
  const bridge = heldBridge();
  bridge.send(bridge.packet(0), true);
  await bridge.entered.promise;
  try {
    for (let index = 1; index < 16; index++) bridge.send(bridge.packet(index), true);
    bridge.send(bridge.receipt(1), false);
    assert.equal(bridge.diagnostic.pendingSendsHighWater, 17, 'Reproduce the former valid-burst cutoff');
    assert.deepEqual(bridge.failures, []);
    assert.equal(bridge.observed.length, 1, 'HTTP completion must still serialize forwarding');

    // The first packet has reached workerd, but its HTTP completion is held.
    // Both public windows can therefore coexist with that one occupied slot.
    for (let index = 16; index <= 32; index++) bridge.send(bridge.packet(index), true);
    for (let index = 2; index <= 32; index++) bridge.send(bridge.receipt(index), false);
    assert.equal(bridge.diagnostic.pendingSendsHighWater, 65);
    assert.deepEqual(bridge.failures, []);
  } finally { bridge.completion.resolve(); }
  await bridge.sender.settled();
  assert.deepEqual(bridge.observed, bridge.expected, 'Binary packets and textual receipts keep their original order and bytes');
});

for (const [lane, window] of [['reliable', 32], ['live', 8]]) test(`${lane} excess queued messages still terminate once and fence queued sends`, async () => {
  const bridge = heldBridge(lane);
  bridge.send(bridge.packet(0), true);
  await bridge.entered.promise;
  try {
    for (let index = 1; index <= window; index++) {
      bridge.send(bridge.packet(index), true); bridge.send(bridge.receipt(index), false);
    }
    assert.deepEqual(bridge.failures, []);
    bridge.send(bridge.receipt(window + 1), false);
    bridge.send(bridge.receipt(window + 2), false);
    assert.equal(bridge.diagnostic.pendingSendsHighWater, 2 * window + 2);
    assert.deepEqual(bridge.failures.map(value => value.cause), ['FIXTURE_RELAY_PENDING_SEND_LIMIT']);
  } finally { bridge.completion.resolve(); }
  await bridge.sender.settled();
  assert.equal(bridge.observed.length, 1, 'A fatal queue failure must not forward retained messages later');
});

test('raw bytes remain bounded even below the packet count limit', async () => {
  const bridge = heldBridge();
  const packet = Buffer.alloc(limits.packetBytes + 4);
  bridge.send(packet, true);
  await bridge.entered.promise;
  try {
    for (let index = 0; index < 8; index++) bridge.send(packet, true);
    assert.deepEqual(bridge.failures, []);
    bridge.send(packet, true);
    assert.equal(bridge.diagnostic.pendingSendsHighWater, 10);
    assert.deepEqual(bridge.failures.map(value => value.cause), ['FIXTURE_RELAY_PENDING_BYTE_LIMIT']);
  } finally { bridge.completion.resolve(); }
  await bridge.sender.settled();
  assert.equal(bridge.observed.length, 1);
});
