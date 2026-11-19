// Qualification deployment only: this fresh origin enrolls exactly one signer.
import { openBrowserOwner } from '@tendriller/core/collaboration/browser';
import { createViewStore } from '@tendriller/core/collaboration';
const query = new URL(location.href).searchParams, profileId = query.get('profile'), mode = query.get('mode');
const key = `fixture-view:${profileId}:${location.pathname}`;
const requestedView = sessionStorage.getItem(key) ?? crypto.randomUUID();
const ready = openBrowserOwner({ workerUrl: new URL(`./worker.mjs?profile=${profileId}`, import.meta.url),
  profileId, applicationId: '81'.repeat(32), definitionId: 'independent-review-workspace', definitionVersion: '1', mode,
  context: { viewId: requestedView, documentPath: location.pathname } });
export const applicationReady = ready.then(attachment => {
  const session = attachment.session;
  sessionStorage.setItem(key, session.endpoint.context.viewId);
  globalThis.fixtureOwner = attachment; globalThis.fixtureSession = session;
  globalThis.fixtureStore = createViewStore({ storage: localStorage, applicationId: session.applicationId,
    profileId: session.deviceId, viewId: session.endpoint.context.viewId });
  return session;
});
globalThis.fixtureReady = applicationReady.then(session => ({ deviceId: session.deviceId, endpoint: session.endpoint }));
export const detachView = async () => (await ready).detach();
export const suspendView = async () => (await ready).suspend();
export const resumeView = async () => (await ready).resume();
export async function readParticipants(session) {
  return (await session.endpoints()).map(endpoint => ({ deviceId: session.deviceId, label: 'Enrolled reviewer',
    canRead: true, authorized: true, revoked: false, applicationAdministrator: true, kind: 'person', route: 'on-demand',
    deviceLabel: 'Qualification browser', viewLabel: endpoint.context.documentPath,
    endpoint: { ...endpoint, deviceId: session.deviceId }, presence: { phase: endpoint.state, expiresAt: Date.now() + 30_000 },
    identityEvidence: 'authenticated-signer', labelEvidence: 'qualification-declaration' }));
}
