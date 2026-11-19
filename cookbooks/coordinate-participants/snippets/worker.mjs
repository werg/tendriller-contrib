// SharedWorker or fenced elected owner, using one retained browser signing profile.
import { serveBrowserOwner } from '@tendriller/core/collaboration/worker';
import { createPeersClient, createPeerIntroductions } from '@tendriller/core/peers';
import { verifyAuthorityBundle } from '@chronolog/peer-session';
import { openBrowserDevice } from '@chronolog/peer-session/worker';
import { openSqlApplication } from '@chronolog/peer-session/sql';
import { openWebSocketConnection } from '@chronolog/peer-session/websocket';
import { reviewWorkspace } from './review-workspace.mjs';

// Register attachment listeners before waiting for deployment configuration.
serveBrowserOwner({ scope: self, async load({ signal }) {
const configuration = await fetch(new URL('./configuration.json', import.meta.url), { signal, cache: 'no-store' }).then(async response => {
  if (!response.ok) throw Error('The signed application configuration is unavailable.');
  return response.json();
});
if (new URL(configuration.page_url).origin !== self.location.origin) throw Error('Open the Worker from its enrolled publication origin.');
const definition = reviewWorkspace({ administrators: configuration.administrators });
return { profileId: configuration.profileId,
  async createIdentity() {
    const device = await openBrowserDevice({ name: configuration.profileId, create: true });
    try { return device.identity.publicKey; } finally { await device.close(); }
  },
  async openSession({ signal }) {
    let device, session, pool;
    try {
      device = await openBrowserDevice({ name: configuration.profileId });
      signal.throwIfAborted();
      const base = new URL('_tendril/', configuration.page_url);
      const peers = createPeersClient({ base: base.href, applicationId: configuration.applicationId,
        async request(path, { method = 'GET', body, signal } = {}) {
          const response = await fetch(new URL(path, base), { method, signal, credentials: 'same-origin', cache: 'no-store',
            ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
          const value = await response.json();
          if (!response.ok) throw Object.assign(Error(value.error?.message ?? `Host request failed (${response.status})`), { code: value.error?.code });
          return value;
        },
      });
      const authority = await peers.application(), verified = await verifyAuthorityBundle(authority, configuration.descriptor);
      if (!verified.grant(device.identity.publicKey)?.reader) throw Error(`This profile is not enrolled: ${device.identity.publicKey}. Enroll this exact signer before opening the workspace.`);
      session = await openSqlApplication({ device, definition, authority, schema: configuration.schema,
        databasePath: '/review-workspace.sqlite', signals: { delivery: 'application', localEcho: true },
        async createEngine() {
          // Identity, attachment and signals do not initialize OPFS SQL. The
          // engine is loaded only when the session first needs durable data.
          const { loadBrowserEngine, createBrowserSqlEngine } = await import('@chronolog/peer-session/sql-browser');
          const loaded = await loadBrowserEngine(new URL(configuration.engineBaseUrl, import.meta.url));
          if (typeof loaded.module.installOpfsSAHPoolVfs !== 'function') throw Error('This browser engine cannot retain the SQL profile.');
          pool = await loaded.module.installOpfsSAHPoolVfs({ name: `review-${configuration.profileId}`,
            directory: `review-${configuration.profileId}`, initialCapacity: 32 });
          return createBrowserSqlEngine({ ...loaded, vfs: pool.vfsName });
        },
      });
      const control = session.connectControlParticipant({ exchange: (request, options) => peers.exchange(request, options) });
      await session.participate({ control, ...createPeerIntroductions({ peers, identity: session.deviceId,
        // A Worker-native relay remains available when either page closes. RTC
        // may be added using the maintained owner bridge after qualification.
        openDirectConnection: async () => { throw Error('DIRECT_ROUTE_NOT_CONFIGURED'); },
        openRelayConnection: ({ relay, signal }) => openWebSocketConnection(relay, { ready: relay.ready, signal }),
      }) });
      return { session, control,
        close: async () => { await pool?.pauseVfs(); },
      };
    } catch (error) {
      try { if (session) await session.close(); else await device?.close(); } finally { await pool?.pauseVfs(); }
      throw error;
    }
  },
};
}});
