import { createWebRtcHttpsListener } from '@chronolog/transport-webrtc/resident';

/**
 * Add this task to a native AgentApplication. Deployment owns TLS, reachability,
 * allowed page origins and introduction admission; the application context
 * authenticates current Chronolog reader grants on the resulting data channel.
 */
export function createResidentWebRtcTask({ context, signals, ...deployment }) {
  const listener = createWebRtcHttpsListener({ ...deployment,
    accept: connection => context.connectPeer({ connection, ...(signals === undefined ? {} : { signals }) }) });
  return { id: 'resident-webrtc', run: signal => listener.run(signal), get stats() { return listener.stats; } };
}
