// Qualification deployment only: this fresh origin enrolls exactly one signer.
import { openBrowserOwner } from '@tendriller/core/browser-owner';
import { createCollaborationClient } from '@tendriller/core/collaboration';
import { createViewStore, verifyAuthorityBundle } from '@chronolog/peer-session';
const query = new URL(location.href).searchParams, profileId = query.get('profile'), mode = query.get('mode');
const key = `fixture-view:${profileId}:${location.pathname}`;
const requestedView = sessionStorage.getItem(key) ?? crypto.randomUUID();
const options = { workerUrl: new URL(`./worker.mjs?profile=${profileId}`, import.meta.url),
  profileId, applicationId: '81'.repeat(32), definitionId: 'independent-review-workspace', definitionVersion: '1', mode, requiresDedicatedWorker: true,
  context: { viewId: requestedView, documentPath: location.pathname } };
// An unsupported forced route must fail before it opens a competing profile.
globalThis.fixtureSharedStorageRejection = openBrowserOwner({ ...options, mode: 'shared' }).then(
  async owner => { await owner.detach(); throw Error('Unsupported SharedWorker SQL route opened'); },
  error => { if (error.code !== 'OWNER_STORAGE_UNSUPPORTED') throw error; return error.code; });
void globalThis.fixtureSharedStorageRejection.catch(() => undefined);
const ready = openBrowserOwner(options);
export const applicationReady = ready.then(attachment => {
  const session = attachment.session;
  sessionStorage.setItem(key, session.endpoint.context.viewId);
  globalThis.fixtureOwner = attachment; globalThis.fixtureSession = session;
  globalThis.fixtureClient = createCollaborationClient({ session, endpoint: session.endpoint, runId: `fixture-${session.endpoint.endpointIncarnation}` });
  globalThis.fixtureStore = createViewStore({ storage: localStorage, applicationId: session.applicationId, profileId: session.identity.publicKey, viewId: session.endpoint.context.viewId });
  return session;
});
globalThis.fixtureReady = applicationReady.then(session => ({ deviceId: session.identity.publicKey, endpoint: session.endpoint, ownerMode: globalThis.fixtureOwner.mode }));
void globalThis.fixtureReady.catch(() => undefined);
export const detachView = async () => (await ready).detach();
export const suspendView = async () => (await ready).suspend();
export const resumeView = async () => (await ready).resume();
export async function readParticipants(session) {
  const authority=await session.readAuthority();await verifyAuthorityBundle(authority);
  const grant=authority.memberships.at(-1).payload.members.find(member=>member.publicKey===session.identity.publicKey);
  if (!grant?.reader) return [];
  return (await session.endpoints()).map(endpoint => ({ deviceId: session.identity.publicKey, label: 'Enrolled reviewer',
    canRead: grant.reader, authorized: grant.writer === true, revoked: false, applicationAdministrator: true, kind: 'person', route: 'on-demand',
    deviceLabel: 'Qualification browser', viewLabel: endpoint.context.documentPath,
    endpoint: { ...endpoint, deviceId: session.identity.publicKey }, presence: { phase: endpoint.state, expiresAt: Date.now() + 30_000 },
    identityEvidence: 'authenticated-signer', labelEvidence: 'qualification-declaration' }));
}
