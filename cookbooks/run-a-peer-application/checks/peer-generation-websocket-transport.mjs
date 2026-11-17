import { openWebSocketConnection } from '@chronolog/peer-session/websocket';
import { createPeerRelay } from '@tendriller/core/peers';

// WebSocket is available in the owning Worker and in Node. Both environments
// feed the same bounded frame adapter and authenticated session connection.
export const serveFixtureConnections = () => null;
export const inspectFixtureConnection = () => ({ route: 'websocket-relay' });
export async function openFixtureConnection({ relayBase, channel, localIdentity, peerIdentity, signal }) {
  const socket = lane => {
    const url = new URL('/relay', relayBase); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.search = new URLSearchParams({ channel, peerId: localIdentity, remotePeerId: peerIdentity, lane });
    return new WebSocket(url, 'tendriller.relay.v1');
  };
  const relay = createPeerRelay({ reliable: socket('reliable'), live: socket('live') },
    { peerId: localIdentity, remotePeerId: peerIdentity, signal });
  return openWebSocketConnection(relay, { ready: relay.ready, signal });
}
