import { openWorkerWebRtcConnection, serveWorkerWebRtcConnections } from '@chronolog/peer-session/webrtc';

export const serveFixtureConnections = (endpoint, options) => serveWorkerWebRtcConnections(endpoint, options);
export const openFixtureConnection = options => openWorkerWebRtcConnection(self, options);
export const inspectFixtureConnection = connection => connection.getRoute();
