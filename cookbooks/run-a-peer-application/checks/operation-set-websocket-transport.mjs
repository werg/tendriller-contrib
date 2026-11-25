import { openWebSocketConnection } from '@chronolog/peer-session/websocket';
import { createPeerRelay } from '@tendriller/core/peers';
// An explicit qualification-only direct-route refusal precedes actual relay use.
// This is not production discovery, automatic fallback, or connection policy.
export const serveFixtureConnections = () => null;
export const inspectFixtureConnection = connection => ({ route: 'websocket-relay', directAttempts: connection.qualificationDirectAttempts });
export async function openFixtureConnection({ relayBase, channel, localIdentity, peerIdentity, signal }) {
  let directAttempts = 0;
  try { directAttempts++; throw Error('QUALIFICATION_DIRECT_UNAVAILABLE'); }
  catch (failure) { if (failure.message !== 'QUALIFICATION_DIRECT_UNAVAILABLE') throw failure; }
  const socket = lane => {
    const url = new URL('/relay', relayBase); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.search = new URLSearchParams({ channel, peerId: localIdentity, remotePeerId: peerIdentity, lane });
    return new WebSocket(url, 'tendriller.relay.v1');
  };
  const relay = createPeerRelay({ reliable: socket('reliable'), live: socket('live') }, { peerId: localIdentity, remotePeerId: peerIdentity, signal });
  const connection = await openWebSocketConnection(relay, { ready: relay.ready, signal });
  return Object.assign(connection, { qualificationDirectAttempts: directAttempts });
}
