import { openWebRtcConnection } from '@chronolog/peer-session/webrtc';
import { createNativePeerConnection } from '@chronolog/peer-session/webrtc-native';

const native = { iceInterfaceAddresses: { udp4: '127.0.0.1' }, iceAdditionalHostAddresses: ['127.0.0.1'],
  iceUseIpv4: false, iceUseIpv6: false, iceUseTcp: false };
export const openFixtureConnection = options => openWebRtcConnection({ ...options,
  createPeerConnection: configuration => createNativePeerConnection(configuration, native) });
export const inspectFixtureConnection = connection => connection.session.getRoute();
