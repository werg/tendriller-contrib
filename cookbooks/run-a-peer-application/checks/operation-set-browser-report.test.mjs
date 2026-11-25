import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBrowserPeerReport } from './operation-set-browser-report.mjs';
import { syntheticBrowserReport,syntheticBrowserRelayReport } from './operation-set-report-fixtures.mjs';
for(const fixture of [syntheticBrowserReport,syntheticBrowserRelayReport])test(`browser schema accepts complete unit fixture ${fixture.name}`,()=>{assert.equal(validateBrowserPeerReport(fixture()).browser.storage,'OPFS');});
for(const [name,change] of [
  ['old protocol',r=>{delete r.protocol;}],['page-owned database',r=>{r.browser.transportOwner='page';}],['missing OPFS',r=>{r.browser.resources.opfsRoots=0;}],
  ['new-device key invention',r=>{r.ownership.explicitProvisioning=false;}],['private keys in page',r=>{r.ownership.pagePrivateKeys=1;}],
  ['offline authoring pending remote',r=>{r.offline.browserMaterialized='pending';}],['stale derived view',r=>{r.reactive.peerDigest='b'.repeat(64);}],
  ['draft overwritten',r=>{r.reactive.draftPreserved=false;}],['focus lost',r=>{r.reactive.focusPreserved=false;}],['retimestamp retry',r=>{r.retry.retriedTime='201';}],
  ['online-only reload',r=>{r.reload.startupHttpRequests=1;}],['graceful-only restart',r=>{r.reload.abruptWorkerRestart=false;}],['content digest mismatch',r=>{r.content.receivedSha256='b'.repeat(64);}],
  ['live signal in history',r=>{r.live.historyAfter='b'.repeat(64);}],['host traffic on save',r=>{r.hostOutage.after.requests++;}],
  ['no phone verification',r=>{r.ux.widths=[1280];}],['missing screenshots',r=>{r.ux.screenshots=[];}],['keyboard unusable',r=>{r.ux.keyboard=false;}],
])test(`browser schema rejects ${name}`,()=>{const report=syntheticBrowserReport();change(report);assert.throws(()=>validateBrowserPeerReport(report));});
for(const [name,change] of [['browser finality depends on native participant',r=>{r.browserFinality.nativeParticipantClosed=false;}],['excluded browser intent rewritten',r=>{r.browserFinality.retriedProposal='b'.repeat(64);}],['WASM rows differ',r=>{r.sqlParity.browserState='b'.repeat(64);}],['different SQL execution manifest',r=>{r.sqlParity.browserManifest='c'.repeat(64);}],['SQL rollback emits leaked',r=>{r.sqlParity.rollbackEvents=1;}]])test(`browser schema rejects ${name}`,()=>{const report=syntheticBrowserReport();change(report);assert.throws(()=>validateBrowserPeerReport(report));});
