import assert from 'node:assert/strict';

/** Test-only FIFO from raw client WebSockets to the workerd HTTP bridge. */
export function createRelayBridgeSender({ limits, lane, diagnostic, isClosed, forward, terminate }) {
  assert.ok(lane === 'reliable' || lane === 'live', 'Unknown fixture relay lane');
  const window = lane === 'live' ? limits.livePendingPackets : limits.pendingPackets;
  assert.ok([window, limits.pendingBytes, limits.packetBytes].every(value => Number.isSafeInteger(value) && value > 0));
  // Own binary credit plus receipts for the opposite window. One forwarded
  // message can release public credit before its HTTP completion reaches us.
  const maxMessages = 2 * window + 1;
  const maxBytes = Math.min(limits.pendingBytes, window * limits.packetBytes)
    + window * (4 + 256) + limits.packetBytes + 4;
  assert.ok(Number.isSafeInteger(maxMessages) && Number.isSafeInteger(maxBytes));
  let pendingSends = 0, pendingBytes = 0, failed = false, tail = Promise.resolve();
  const fail = (cause, error) => {
    if (failed) return;
    failed = true; terminate(cause, error);
  };
  return {
    send(bytes, binary) {
      if (failed) return;
      if (isClosed()) { fail('FIXTURE_RELAY_SEND_AFTER_CLOSE'); return; }
      const count = pendingSends + 1, size = pendingBytes + bytes.length;
      diagnostic.pendingSendsHighWater = Math.max(diagnostic.pendingSendsHighWater, count);
      diagnostic.pendingBytesHighWater = Math.max(diagnostic.pendingBytesHighWater ?? 0, size);
      if (count > maxMessages) { fail('FIXTURE_RELAY_PENDING_SEND_LIMIT'); return; }
      if (size > maxBytes) { fail('FIXTURE_RELAY_PENDING_BYTE_LIMIT'); return; }
      pendingSends = count; pendingBytes = size;
      const length = bytes.length;
      const frame = { binary, data: binary ? bytes.toString('base64') : bytes.toString('utf8') };
      tail = tail.then(async () => {
        if (!failed && !isClosed()) await forward(frame);
      }).catch(error => fail('FIXTURE_RELAY_SEND_FAILED', error)).finally(() => {
        pendingSends--; pendingBytes -= length;
      });
    },
    settled: () => tail,
  };
}
