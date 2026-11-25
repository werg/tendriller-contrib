// Report schemas are protocol-specific. Historical green reports cannot qualify
// this protocol; all observations below must come from an executed consumer.
import assert from 'node:assert/strict';
import { validateRelayTraffic } from './operation-set-relay-report.mjs';
export const PROTOCOL = 'chronolog-crdt-v1';
export const hex = (value, size = 64) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${size}}$`, 'u'));
export function validateReportBoundary(report, format) {
  assert.equal(report?.format, format); assert.equal(report.protocol, PROTOCOL);
  assert.equal(report.mode, 'runtime'); assert.equal(report.passed, true); assert.equal(report.error, null);
  hex(report.executionManifestDigest); hex(report.source?.commit, 40); hex(report.source?.tree, 40);
  assert.equal(typeof report.source.dirty, 'boolean'); assert.ok(report.runtime?.node && report.runtime.platform);
  assert.equal(report.publicBoundary?.siblingSourceImports, 0); assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.equal(report.publicBoundary.residentRequired, false);
  const imports = report.publicBoundary.imports; assert.ok(Array.isArray(imports));
  for (const name of imports) assert.ok(['@chronolog/authority', '@chronolog/peer-session', '@chronolog/peer-session/native',
    '@chronolog/peer-session/browser', '@chronolog/peer-session/worker', '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native',
    '@chronolog/peer-session/websocket', '@chronolog/peer-session/sql', '@chronolog/peer-session/sql-native', '@chronolog/peer-session/sql-wasm', '@chronolog/peer-session/sql-browser',
    '@tendriller/core/peers', '@tendriller/core/authority'].includes(name), `Not a public packed import: ${name}`);
  for (const name of ['@chronolog/peer-session', '@chronolog/authority']) assert.ok(report.artifacts?.some(value => value.name === name), `Missing exact ${name} archive`);
  for (const artifact of report.artifacts) {
    assert.ok(artifact.name && artifact.version); hex(artifact.sha256); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40);
    assert.equal(typeof artifact.sourceDirty, 'boolean'); hex(artifact.provenance?.sha256);
    assert.ok(Object.keys(artifact.provenance.files ?? {}).length > 0);
  }
  assert.ok(report.fixtures?.length > 0); for (const fixture of report.fixtures) { assert.ok(fixture.path); hex(fixture.sha256); }
  hex(report.runtime.dependencies?.lockSha256);
  assert.ok(report.runtime.dependencies.packages.every(value => value.path && value.version && value.integrity));
}
export function validateNetwork(report) {
  if (report.topology.includes('rtc')) {
    const rtc = report.rtc; assert.equal(rtc?.implementation, 'werift'); assert.equal(rtc.version, '0.27.0');
    assert.equal(rtc.candidateSource, 'explicit-loopback-only'); assert.ok(rtc.connections?.length >= 2);
    for (const link of rtc.connections) {
      assert.equal(link.authenticated, true); assert.equal(link.closed, true);
      assert.equal(link.peers.length, 2); assert.notEqual(...link.peers); link.peers.forEach(peer => hex(peer));
      assert.ok(link.reliable.sentBytes > 0 && link.reliable.receivedBytes > 0);
      assert.equal(link.signaling.closed, true); assert.equal(link.signaling.sentMessages, 2); assert.ok(link.signaling.sentBytes > 0);
      assert.equal(link.routes.length, 2);
      for (const route of link.routes) {
        assert.ok(['direct', 'relay', 'unknown'].includes(route.route));
        if (route.route === 'direct') assert.ok(['host', 'srflx', 'prflx'].includes(route.localCandidateType) && ['host', 'srflx', 'prflx'].includes(route.remoteCandidateType));
        if (route.route === 'relay') assert.ok(route.localCandidateType === 'relay' || route.remoteCandidateType === 'relay');
      }
    }
  }
  if (report.topology.includes('websocket')) {
    validateRelayTraffic(report.relay, { implementation: report.topology.startsWith('browser') ? 'browser-websocket' : 'native-websocket', minimumSockets: 8 });
    assert.equal(report.relay.forcedDirectFailure, true);
    assert.ok(report.relay.connections.length >= 2);
    for (const link of report.relay.connections) { assert.equal(link.authenticated, true); assert.equal(link.closed, true); assert.ok(link.reliable.sentBytes > 0 && link.reliable.receivedBytes > 0); }
    assert.equal(report.relay.reconnect?.physicalLinksCut, true); assert.equal(report.relay.reconnect?.reconnected, true);
  }
}
export function validateHost(report) {
  if (report.hostOutage?.boundary === 'no-server') { assert.equal(report.hostOutage.requests, 0); assert.equal(report.hostOutage.finalizerProcesses, 0); return; }
  assert.equal(report.hostOutage?.boundary, 'tendriller-workerd-http'); assert.equal(report.host?.runtime, 'workerd');
  assert.equal(report.hostOutage.blockedProbeRejected, true); assert.deepEqual(report.hostOutage.after, report.hostOutage.before);
  assert.ok(report.hostOutage.commandsMaterialized >= 2);
  assert.equal(report.host.participant?.boundary,'public-authority-record'); assert.equal(report.host.participant.authorityVerified,true);
  assert.deepEqual(report.host.participant.hostRejected,['database.submit','content.chunk','ephemeral.signal']);
  const publication = report.host.publication;
  for (const field of ['administratorWithoutPublisher', 'exactRetry', 'lostReplyAfterPersistence', 'alteredBytesRejected', 'nonPublisherRejected', 'staleHeadRejected',
    'priorCodeRetained', 'headAndCodeSurviveRestart', 'applicationAuthorityUnchanged']) assert.equal(publication?.[field], true, `Missing publication ${field}`);
  hex(publication.first?.id); hex(publication.second?.id); assert.notEqual(publication.first.id, publication.second.id);
  for (const value of [publication.first, publication.second]) { hex(value.expectedCodeDigest); assert.equal(value.servedCodeDigest, value.expectedCodeDigest); }
  assert.equal(publication.second.previous, publication.first.id);
  assert.deepEqual(report.host.artifacts.map(value => value.name), ['@tendriller/core', '@tendriller/engine']);
  for (const value of report.host.artifacts) { hex(value.sha256); hex(value.sourceCommit, 40); hex(value.sourceTree, 40); }
  hex(report.host.fixtureSha256); hex(report.host.dependencies?.lockSha256);
}
export function validateOperationSetReport(report) {
  validateReportBoundary(report, 'operation-set-consumer/v1');
  assert.ok(['independent-packed-peers', 'independent-native-rtc', 'independent-native-websocket'].includes(report.topology));
  assert.equal(report.nativeOwnership?.secondOwnerRefused, true); assert.equal(report.nativeOwnership?.implicitIdentityCreationRefused, true);
  const offline = report.offline; assert.equal(offline?.finality, 'none'); assert.equal(offline.unsupportedWaitRejected, true);
  assert.equal(offline.independentAuthors.length, 2); assert.notEqual(...offline.independentAuthors); offline.independentAuthors.forEach(value => hex(value));
  assert.deepEqual(offline.connectedPeers, [0, 0]); assert.deepEqual(offline.stored, [true, true]); assert.deepEqual(offline.materialized, ['accepted', 'accepted']);
  const merge = report.merge; assert.ok(merge?.permutations >= 3 && merge.duplicateDeliveries >= 6); assert.equal(merge.operations, 3);
  assert.equal(merge.digests.length, 4); merge.digests.forEach(value => { hex(value); assert.equal(value, merge.digests[0]); });
  merge.revisions.forEach(value => { hex(value); assert.equal(value, merge.revisions[0]); });
  const reactive = report.reactive; assert.equal(reactive?.coherentCapturedView, true); hex(reactive.capturedBefore);
  assert.equal(reactive.capturedAfter, reactive.capturedBefore); assert.equal(reactive.liveSnapshot, reactive.snapshot);
  assert.equal(reactive.projectionCount, 3); hex(reactive.expectedEarlierProposal); assert.equal(reactive.earlierInsertionFirst, reactive.expectedEarlierProposal);
  assert.deepEqual(reactive.equalTimeAuthors, [...offline.independentAuthors].sort());
  const retry = report.retry; assert.equal(retry?.replyLostAfterStorage, true); hex(retry.originalProposalId);
  assert.equal(retry.retriedProposalId, retry.originalProposalId); hex(retry.signedBefore); assert.equal(retry.signedAfter, retry.signedBefore);
  assert.equal(retry.alteredIntentRejected, true); assert.equal(retry.operationCount, 3);
  assert.ok(report.retention?.evidence.some(value => value.payload.peer === report.retention.independentPeer && value.payload.storageId !== report.retention.authorStorageId && value.payload.proposalId === retry.originalProposalId && /^[a-f0-9]{128}$/.test(value.signature)));
  const reload = report.reload; hex(reload?.identityBefore); assert.equal(reload.identityAfter, reload.identityBefore);
  assert.equal(reload.proposalBefore, retry.originalProposalId); assert.equal(reload.proposalAfter, reload.proposalBefore);
  assert.equal(reload.signedBefore, retry.signedBefore); assert.equal(reload.signedAfter, reload.signedBefore);
  assert.equal(reload.cachedAuthority, true); assert.equal(reload.disconnectedAuthoring, true); assert.equal(reload.automaticUnion, true); assert.equal(reload.abruptNativeRestart,true); assert.equal(reload.abruptExitCode,73); hex(reload.abruptProposal); hex(reload.abruptSignedBefore); assert.equal(reload.abruptSignedAfter,reload.abruptSignedBefore);
  hex(reload.digest); assert.equal(reload.peerDigest, reload.digest);
  assert.ok(report.content?.bytes > 0); hex(report.content.sha256); assert.equal(report.content.receivedSha256, report.content.sha256);
  assert.equal(report.content.transport, 'authenticated-peer-channel'); assert.equal(report.content.localReload,true); assert.equal(report.content.reloadSha256,report.content.sha256);
  assert.equal(report.content.partialUploadResumed,true); assert.ok(report.content.originalStageId); assert.equal(report.content.resumedStageId,report.content.originalStageId);
  assert.deepEqual(report.finality?.map(value => value.policy), ['signed-frontier', 'fixed-validator']);
  for (const result of report.finality) {
    for (const field of ['unavailableProviderLocalAuthoring', 'finalized', 'missingBodyBlockedFinalRead', 'lateExcluded', 'reloadFinality']) assert.equal(result[field], true);
    assert.ok(result.proofs >= 2); hex(result.included); hex(result.lateProposal); hex(result.originalSignedDigest);
    assert.equal(result.retainedSignedDigest, result.originalSignedDigest); assert.equal(result.originalTime, '50'); assert.equal(result.retainedTime, result.originalTime);
  }
  validateHost(report); validateNetwork(report);
  return { format: 'operation-set-summary/v1', protocol: PROTOCOL, topology: report.topology, source: report.source,
    artifacts: report.artifacts, executionManifestDigest: report.executionManifestDigest, merge: report.merge,
    limitations: ['Explicit local test topology; not production discovery or Internet reachability.', 'Local durability, revisable materialization, retention and finality are independent facts.'] };
}
