import { openReleaseObserver } from '@chronolog/peer-session/releases';
import { openPageReleaseStore } from './peer-release-store.mjs';

const element = id => document.getElementById(id);
const config = window.__TENDRIL__;
const transport = window.tendril.host.peers.releases;
const bootstrap = transport.initial;
const draftKey = `peer-release-draft:${config.application.id}`;
element('draft').value = sessionStorage.getItem(draftKey) ?? '';
element('draft').addEventListener('input', event => sessionStorage.setItem(draftKey, event.target.value));

let store, observer, offered = null;
const failure = error => { element('error').textContent = error.message; document.documentElement.dataset.failed = 'true'; };
const action = (id, handler) => element(id).addEventListener('click', () => { void handler().catch(failure); });

try {
  store = await openPageReleaseStore(config.application.id);
  observer = await openReleaseObserver({
    applicationId: config.application.id, controlPublicKey: bootstrap.state.controlPublicKey,
    host: transport, store, initial: bootstrap,
  });
  action('check-update', async () => {
    const observation = await observer.refresh();
    offered = observation.selection?.activation.payload.releaseId === config.publication.id ? null : observation.selection;
    element('update-status').textContent = offered === null ? 'This version is current.' : 'An update is ready. Your draft stays here until you apply it.';
    element('apply-update').disabled = offered === null;
    element('defer-update').disabled = offered === null;
    document.documentElement.dataset.offered = offered?.activation.payload.releaseId ?? '';
  });
  action('defer-update', async () => { element('update-status').textContent = 'Update deferred. Continue with this version.'; });
  action('apply-update', async () => {
    if (offered === null) return;
    const selected = offered;
    sessionStorage.setItem(draftKey, element('draft').value);
    await observer.close(); await store.close();
    location.assign(new URL(`_publications/${selected.activation.payload.releaseId}/${selected.manifest.payload.entry}`, config.base));
  });
  action('load-lazy', async () => { element('lazy-version').textContent = (await import('./lazy.mjs')).default; });
  document.documentElement.dataset.release = config.publication.id;
  document.documentElement.dataset.ready = 'true';
} catch (error) { failure(error); }

addEventListener('pagehide', () => { void observer?.close().finally(() => store?.close()); }, { once: true });
