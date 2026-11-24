// Raw fixture transport only. Never decode, retry or acknowledge application work.
export function createRelayIngress(socket, { limits, forward }) {
  // A socket carries both the sender's binary window and receipts for the
  // opposite window. Physical Chronolog credits are binary relay packets too.
  const maxFrames = 2 * limits.pendingPackets;
  const maxBytes = limits.pendingBytes + limits.pendingPackets * (4 + 256);
  const highWater = Math.max(1, Math.floor(limits.pendingPackets / 2));
  const lowWater = Math.floor(highWater / 2);
  let stopped = false, failure, pendingFrames = 0, pendingBytes = 0, paused = false;
  let maxPendingFrames = 0, maxPendingBytes = 0, tail = Promise.resolve();
  const fail = error => {
    if (stopped) return;
    failure = error; stopped = true; socket.terminate();
  };
  const receive = (bytes, binary) => {
    if (stopped) return;
    const size = bytes.length;
    if (size > (binary ? limits.packetBytes + 4 : 256)) {
      fail(Error('FIXTURE_RELAY_INGRESS_PACKET_LIMIT')); return;
    }
    if (pendingFrames >= maxFrames || pendingBytes + size > maxBytes) {
      fail(Error('FIXTURE_RELAY_INGRESS_QUEUE_LIMIT')); return;
    }
    pendingFrames++; pendingBytes += size;
    maxPendingFrames = Math.max(maxPendingFrames, pendingFrames);
    maxPendingBytes = Math.max(maxPendingBytes, pendingBytes);
    const frame = { binary, data: binary ? bytes.toString('base64') : bytes.toString('utf8') };
    // Pause before the hard limit: ws can still emit the remainder of an
    // already-read TCP chunk, so retain room for the complete protocol windows.
    if (!paused && pendingFrames >= highWater) { paused = true; socket.pause(); }
    tail = tail.then(async () => { if (!stopped) await forward(frame); })
      .catch(fail).finally(() => {
        pendingFrames--; pendingBytes -= size;
        if (paused && !stopped && pendingFrames <= lowWater) { paused = false; socket.resume(); }
      });
  };
  socket.on('message', receive);
  return {
    get stats() { return { pendingFrames, pendingBytes, maxPendingFrames, maxPendingBytes, maxFrames, maxBytes }; },
    async close() {
      stopped = true; socket.removeListener('message', receive);
      await tail;
      if (failure) throw failure;
    },
  };
}
