import { negotiateWebRtc } from '@chronolog/transport-webrtc';

/**
 * Explicit coordinated Tendriller introduction; both endpoints must join the
 * same attempt. For cold contact with a resident, use connect-resident-worker.
 * Call only after the exclusive replica Worker is ready.
 * handoff must transfer the untouched RTCDataChannel synchronously; the Worker
 * then frames and authenticates it under its current application membership.
 */
export async function introducePeerWorker({ peers, channel, peerId = crypto.randomUUID(),
  handoff, configuration, signal, timeoutMs }) {
  if (typeof handoff !== 'function') throw new TypeError('A synchronous RTCDataChannel handoff is required');
  signal?.throwIfAborted();
  const rendezvous = peers.rendezvous(channel, peerId, { signal, timeoutMs });
  try {
    const { role } = await rendezvous.ready;
    return await negotiateWebRtc({ role, signaling: rendezvous, configuration, signal, timeoutMs,
      onDataChannel: handoff });
  } catch (error) {
    // Pairing can fail before the transport takes responsibility for signaling.
    rendezvous.close();
    throw error;
  }
}
