import assert from 'node:assert/strict';
import { hex, validateReportBoundary, validateNetwork, validateHost } from './operation-set-report.mjs';
export function validateBrowserPeerReport(report) {
  validateReportBoundary(report, 'operation-set-browser/v1');
  assert.ok(['browser-worker-opfs-native-rtc','browser-worker-opfs-websocket'].includes(report.topology));
  assert.equal(report.browser?.implementation,'chromium'); assert.ok(report.browser.version);
  assert.equal(report.browser.storage,'OPFS'); assert.equal(report.browser.transportOwner,'owning-worker');
  assert.ok(report.browser.resources?.opfsRoots > 0);
  for(const field of ['workerOnly','secondOwnerRefused','explicitProvisioning']) assert.equal(report.ownership?.[field],true);
  assert.equal(report.ownership.pagePrivateKeys,0); assert.ok(report.ownership.storageId);
  assert.equal(report.offline?.browserStored,true); assert.equal(report.offline.browserMaterialized,'accepted');
  assert.equal(report.offline.nativeMaterialized,'accepted'); assert.deepEqual(report.offline.connectedPeers,[0,0]); assert.equal(report.offline.finality,'none');
  assert.equal(report.reactive?.earlierFirst,'late-earlier'); assert.equal(report.reactive.draftPreserved,true); assert.equal(report.reactive.focusPreserved,true);
  hex(report.reactive.before);hex(report.reactive.after);assert.notEqual(report.reactive.before,report.reactive.after);
  assert.equal(report.reactive.currentDigest,report.reactive.peerDigest);
  hex(report.retry?.originalProposal);assert.equal(report.retry.retriedProposal,report.retry.originalProposal);
  assert.match(report.retry.originalTime,/^\d+$/u);assert.equal(report.retry.retriedTime,report.retry.originalTime);
  const reload=report.reload;hex(reload?.identityBefore);assert.equal(reload.identityAfter,reload.identityBefore);
  for(const field of ['cachedAuthority','offlineReload','offlineWrite','abruptWorkerRestart'])assert.equal(reload[field],true);
  assert.equal(reload.startupHttpRequests,0);hex(reload.digest);assert.equal(reload.peerDigest,reload.digest);
  assert.ok(report.content?.bytes>65536);hex(report.content.sha256);assert.equal(report.content.receivedSha256,report.content.sha256);
  assert.equal(report.content.transport,'authenticated-peer-channel');assert.equal(report.content.localReload,true);assert.equal(report.content.reloadSha256,report.content.sha256);
  assert.equal(report.live?.observed,true);hex(report.live.historyBefore);assert.equal(report.live.historyAfter,report.live.historyBefore);
  assert.equal(report.hostOutage?.blockedProbeRejected,true);assert.deepEqual(report.hostOutage.after,report.hostOutage.before);assert.ok(report.hostOutage.commandsMaterialized>=2);
  if(report.host)validateHost(report);else assert.equal(report.hostOutage.boundary,'fixture-http');
  const ux=report.ux;assert.deepEqual(ux?.widths,[1280,320]);for(const field of ['deepLinks','back','keyboard','longContent','draftPreserved','noHorizontalScroll'])assert.equal(ux[field],true);
  assert.ok(ux.screenshots.length>=6);assert.ok(ux.screenshots.every(name=>/^[a-z0-9-]+\.png$/u.test(name)));
  const parity=report.sqlParity;assert.equal(parity?.actualBrowserWasm,true);assert.equal(parity.actualNativeEngine,true);
  for(const field of ['browserManifest','nativeManifest','browserState','nativeState','browserOutcomes','nativeOutcomes','offlineReload'])hex(parity[field]);
  assert.equal(parity.browserManifest,parity.nativeManifest);assert.equal(parity.browserState,parity.nativeState);assert.equal(parity.browserOutcomes,parity.nativeOutcomes);
  assert.equal(parity.offlineReload,parity.nativeState);assert.equal(parity.lateDdlBefore,'rejected');assert.equal(parity.lateDdlAfter,'accepted');
  assert.equal(parity.rollback,'rejected');assert.equal(parity.unauthorizedDrop,'rejected');assert.equal(parity.capturedSchemaCoherent,true);assert.equal(parity.rollbackEvents,0);
  assert.ok(report.sqlEngine && report.wasmEngine, 'Record the exact native and browser WASM engine builds');
  const finality=report.browserFinality;assert.equal(finality?.policy,'signed-frontier');assert.equal(finality.nativeFinalizers,0);
  for(const field of ['nativeParticipantClosed','pendingBefore','finalized','excluded','stored','reloadFinalized','reloadExcluded'])assert.equal(finality[field],true);
  assert.equal(finality.closedThroughMs,'100');assert.ok(finality.proofs>=2);hex(finality.originalProposal);
  assert.equal(finality.retriedProposal,finality.originalProposal);assert.equal(finality.originalTime,'50');assert.equal(finality.retainedTime,'50');
  validateNetwork(report);
  return {format:'operation-set-browser-summary/v1',protocol:report.protocol,topology:report.topology,source:report.source,
    artifacts:report.artifacts,executionManifestDigest:report.executionManifestDigest,browser:report.browser,ux,
    limitations:['Actual loopback Chromium/Worker/OPFS qualification, not deployed mobile/background-lifetime qualification.',
      'Keeping the page open enables live synchronization; saving local work does not require another participant.']};
}
