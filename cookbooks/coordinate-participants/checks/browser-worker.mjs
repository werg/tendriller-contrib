// Qualification-only enrollment on a fresh local origin. Production uses the
// explicit enrollment and signed-host bootstrap in ../snippets/worker.mjs.
import { bytesDigest, controlParticipantGrant, createGenerationRegistry, createPeerIdentity,
  MemoryBytesStore, participantGrant, signApplicationDescriptor, signControlRevision,
  signTransitionRequest } from '@chronolog/peer-session';
import { openBrowserDevice } from '@chronolog/peer-session/worker';
import { openSqlApplication, prepareSqlApplication } from '@chronolog/peer-session/sql';
import { createBrowserSqlEngine, loadBrowserEngine } from '@chronolog/peer-session/sql-browser';
import { serveBrowserOwner } from '@tendriller/core/worker-owner';
import { prepareCollaborationCommand } from '@tendriller/core/collaboration';
import { reviewWorkspace } from '../domain/review-workspace.mjs';

const profileId = new URL(import.meta.url).searchParams.get('profile');
if (!/^[a-z0-9-]{1,80}$/u.test(profileId ?? '')) throw Error('Qualification profile is required');
const applicationId = '81'.repeat(32), encoder = new TextEncoder(), decoder = new TextDecoder();
serveBrowserOwner({ profileId, async openSession({ signal }) {
  let device, session, pool;
  try {
    device = await openBrowserDevice({ name: profileId, create: true });
    const definition = reviewWorkspace({ administrators: [device.identity.publicKey] });
    const loaded = await loadBrowserEngine(new URL('./engine/', import.meta.url));
    signal.throwIfAborted();
    pool = await loaded.module.installOpfsSAHPoolVfs({ name: `qualification-${profileId}`,
      directory: `qualification-${profileId}`, initialCapacity: 48 });
    const engine = createBrowserSqlEngine({ ...loaded, vfs: pool.vfsName });
    let authority = await device.store.get('fixture/authority'), schema = await device.store.get('fixture/schema'),
      key = await device.store.get('fixture/epoch');
    if (!authority) {
      const host = await createPeerIdentity(); key = crypto.getRandomValues(new Uint8Array(32));
      const prepared = await prepareSqlApplication({ engine, applicationId, definition, schemaAdministrator: device.identity });
      const descriptor = await signApplicationDescriptor({ applicationId, historyId: profileId,
        profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: host.publicKey,
        ...prepared.binding }, host);
      const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
        revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(key), recoveryFloor: null,
        grants: [controlParticipantGrant(host.publicKey), participantGrant(device.identity.publicKey, { dataRole: 'member', administrator: true })] }, host);
      const registry = await createGenerationRegistry({ store: new MemoryBytesStore(), descriptor, controls: [control], signer: host });
      await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
        transitionId: 'browser-reference-initial', expectedGeneration: null, requester: device.identity.publicKey,
        coordinator: device.identity.publicKey, controlRevision: 0, reason: 'create', base: null }, device.identity));
      authority = encoder.encode(JSON.stringify(await registry.read())); schema = encoder.encode(JSON.stringify(prepared.schema));
      await device.store.put('fixture/authority', authority); await device.store.put('fixture/schema', schema); await device.store.put('fixture/epoch', key);
    }
    if (!schema || !key) throw Error('Qualification profile is incomplete; do not silently recreate it');
    session = await openSqlApplication({ device, definition, authority: JSON.parse(decoder.decode(authority)),
      schema: JSON.parse(decoder.decode(schema)), epochKeys: new Map([[0, key]]), databasePath: '/qualification.sqlite',
      createEngine: () => engine, signals: { localEcho: true, delivery: 'neighbors' } });
    return { session, prepareCommand: (endpoint, name, input) => prepareCollaborationCommand(endpoint, name, input, session.deviceId), close: async () => pool?.pauseVfs() };
  } catch (error) {
    try { if (session) await session.close(); else await device?.close(); } finally { await pool?.pauseVfs(); }
    throw error;
  }
} });
