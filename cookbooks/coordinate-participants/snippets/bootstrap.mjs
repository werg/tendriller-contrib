// Copy beside configuration.json and worker.mjs in the signed deployment graph.
// This composes the maintained owner; it does not implement owner election.
import { openBrowserOwner, createBrowserIdentity } from '@tendriller/core/collaboration/browser';
import { createPeersClient } from '@tendriller/core/peers';
import { verifyAuthorityBundle } from '@chronolog/peer-session';

const configuration = await fetch(new URL('./configuration.json', import.meta.url), { cache: 'no-store' }).then(async response => {
  if (!response.ok) throw Error('The signed application configuration is unavailable.');
  return response.json();
});
if (new URL(configuration.page_url).origin !== location.origin) throw Error('Open this application on its enrolled publication origin.');
const viewKey = `review-view:${configuration.applicationId}:${location.pathname}`;
let requestedView;
try { requestedView = sessionStorage.getItem(viewKey) ?? crypto.randomUUID(); }
catch { requestedView = crypto.randomUUID(); }
const ownerOptions = {
  workerUrl: new URL('./worker.mjs', import.meta.url), profileId: configuration.profileId,
  applicationId: configuration.applicationId, definitionId: 'independent-review-workspace', definitionVersion: '1',
  context: { viewId: requestedView, documentPath: location.pathname }, mode: 'auto',
};
const ownerReady = openBrowserOwner(ownerOptions);
export const applicationReady = ownerReady.then(({ session }) => {
  try { sessionStorage.setItem(viewKey, session.endpoint.context.viewId); } catch { /* Owner identity is authoritative. */ }
  return session;
});
export const detachView = async () => (await ownerReady).detach();
export const suspendView = async () => (await ownerReady).suspend();
export const resumeView = async () => (await ownerReady).resume();
// Call only after an explicit setup choice. No automatic catch/recreate fallback.
export const createProfile = () => createBrowserIdentity(ownerOptions);

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

/** Actual signing grants establish eligibility; publication labels remain descriptive. */
export async function readParticipants(session) {
  const authority = await verifyAuthorityBundle(await peers.application(), configuration.descriptor);
  const endpoints = await session.endpoints();
  return authority.control.payload.grants.filter(grant => grant.reader && grant.writer).flatMap(grant => {
    const label = configuration.participants?.[grant.publicKey] ?? {};
    const common = { deviceId: grant.publicKey, authorized: true, revoked: false,
      kind: label.kind === 'agent' ? 'agent' : 'person', label: label.label ?? `Signer ${grant.publicKey.slice(0, 8)}`,
      deviceLabel: label.deviceLabel ?? 'Enrolled device', route: label.route ?? 'unknown',
      identityEvidence: 'authenticated-signer', labelEvidence: 'publication-description',
      applicationAdministrator: configuration.administrators.includes(grant.publicKey),
      capabilities: ['review'], controlRevision: authority.control.payload.revision };
    if (grant.publicKey !== session.deviceId) return [common];
    return endpoints.map(endpoint => ({ ...common, endpoint: { ...endpoint, deviceId: session.deviceId },
      viewLabel: endpoint.context.documentPath ?? 'Local view',
      presence: { phase: endpoint.state, expiresAt: Date.now() + 30_000 } }));
  });
}
