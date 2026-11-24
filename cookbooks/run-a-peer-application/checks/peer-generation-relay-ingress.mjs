import { createRelayBridgeSender } from './peer-generation-relay-bridge.mjs';

// Raw fixture transport only. The sender owns the single FIFO and both budgets.
export function createRelayIngress(socket, { limits, lane = 'reliable',
  diagnostic = { pendingSendsHighWater: 0 }, forward }) {
  let stopped = false, failure, paused = false;
  const fail = error => {
    if (stopped) return;
    failure = error; stopped = true; socket.terminate();
  };
  const sender = createRelayBridgeSender({ limits, lane, diagnostic, forward,
    isClosed: () => stopped,
    terminate: (cause, error) => fail(error ?? Error(cause)),
    onPendingChange: ({ pendingFrames, window }) => {
      if (stopped) return;
      const highWater = Math.max(1, Math.floor(window / 2)), lowWater = Math.floor(highWater / 2);
      // ws may emit the remainder of an already-read TCP chunk after pause.
      // Admission still allows both public windows and one held HTTP completion.
      if (!paused && pendingFrames >= highWater) { paused = true; socket.pause(); }
      else if (paused && pendingFrames <= lowWater) { paused = false; socket.resume(); }
    },
  });
  const receive = (bytes, binary) => {
    if (stopped) return;
    if (bytes.length > (binary ? limits.packetBytes + 4 : 256)) {
      fail(Error('FIXTURE_RELAY_INGRESS_PACKET_LIMIT')); return;
    }
    sender.send(bytes, binary);
  };
  socket.on('message', receive);
  return {
    get stats() { return sender.stats; },
    async close() {
      stopped = true; socket.removeListener('message', receive);
      await sender.settled();
      if (failure) throw failure;
    },
  };
}
