import { createHttpWebRtcSignaling, negotiateWebRtc } from '@chronolog/transport-webrtc';

/**
 * Cold introduction directly to a reachable resident peer. The endpoint and
 * optional admission headers come from explicit initial deployment configuration.
 * Open the exclusive replica Worker first; transfer the untouched channel in
 * handoff synchronously. The Worker then authenticates the actual peer identity.
 */
export async function connectResidentWorker({ endpoint, headers, handoff, configuration, signal, timeoutMs }) {
  if (typeof handoff !== 'function') throw new TypeError('A synchronous RTCDataChannel handoff is required');
  signal?.throwIfAborted();
  const signaling = createHttpWebRtcSignaling({ url: endpoint, headers, signal, timeoutMs });
  try {
    return await negotiateWebRtc({ role: 'offerer', signaling, configuration, signal, timeoutMs, onDataChannel: handoff });
  } catch (error) {
    // A peer factory can fail before negotiation takes ownership of signaling.
    try { await signaling.close(); } catch { /* Preserve the original failure. */ }
    throw error;
  }
}
