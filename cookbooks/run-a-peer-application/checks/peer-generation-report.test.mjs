import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerGenerationReport } from './peer-generation-report.mjs';

// Deliberately synthetic input tests the evidence boundary, not a runtime.
function syntheticReport() {
  const receipt = { generation: 'g1', sequence: 2, root: 'a'.repeat(64) };
  const observed = (operationId, generation, viewGeneration) => ({ status: 'applied', attemptId: `attempt:${operationId}`,
    operationId, author: 'device-a', generation, sequence: 2, outcome: 'accepted', rejectionCode: null,
    revision: { applicationId: 'app', historyId: 'history', generation: viewGeneration, controlRevision: 0,
      point: { generation: viewGeneration, sequence: 4, root: 'a'.repeat(64) }, materializationRevision: 'observation-1' } });
  return {
    format: 'peer-generation-consumer/v2', mode: 'runtime', profile: 'peer-generation-v1',
    topology: 'independent-packed-peers', passed: true, executionManifestDigest: 'a'.repeat(64),
    runtime: { node: 'v24.0.0', platform: 'linux' },
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', version: '0.0.0-test', sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/native'], siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false },
    hostOutage: { boundary: 'portable-control-port', blocked: true, blockedProbeRejected: true, commandsApplied: 3,
      requests: { before: 4, after: 4 }, applicationBodyBytes: { before: 0, after: 0 }, finalityCapability: false },
    lostReply: { injectedAfterPersistence: true, originalOperationId: 'op-retained', retriedOperationId: 'op-retained',
      originalReceipt: receipt, retriedReceipt: structuredClone(receipt), orderedRecords: { before: 2, after: 2 } },
    recovery: { previousGeneration: 'g1', selectedGeneration: 'g2', previousHead: 4, adoptedPosition: 2,
      sourceRemoved: true, coherentReset: true, recoveredDigest: 'f'.repeat(64), freshPeerDigest: 'f'.repeat(64),
      inheritedOperationIds: ['op-retained'], abandonedOperationIds: ['op-abandoned'],
      inheritedBefore: observed('op-retained', 'g1', 'g1'), inheritedAfter: observed('op-retained', 'g1', 'g2'),
      inheritedIdentityPreserved: true, abandonedEvidencePreserved: true },
    returningBranch: { generationBefore: 'g2', generationAfter: 'g2', digestBefore: '1'.repeat(64), digestAfter: '1'.repeat(64),
      oldAttemptReadmitted: false, excludedAncestorReadopted: false, thirdGenerationChecked: true },
    reapply: { originalOperationId: 'op-abandoned', newOperationId: 'op-reapplied', originalAttemptId: 'attempt-abandoned', newAttemptId: 'attempt-reapplied', reapplyOf: 'attempt-abandoned',
      outcome: 'accepted', inputValidationChecked: true, reviewedAncestryChecked: true },
    reopen: { identityBefore: 'device-a', identityAfter: 'device-a', operationBefore: observed('op-reapplied', 'g2', 'g3'),
      operationAfter: observed('op-reapplied', 'g2', 'g3') },
  };
}

function rejects(mutate, message) {
  const value = syntheticReport();
  mutate(value);
  assert.throws(() => validatePeerGenerationReport(value), message);
}

test('peer-generation evidence retains actual source cleanliness and exact recovery limits', () => {
  const summary = validatePeerGenerationReport(syntheticReport());
  assert.equal(summary.source.dirty, true);
  assert.equal(summary.hostRequestsDuringCommands, 0);
  assert.deepEqual(summary.recovery.abandonedOperationIds, ['op-abandoned']);
  assert.equal(summary.recovery.previousHead, 4);
  assert.equal(summary.recovery.adoptedPosition, 2);
  assert.ok(summary.limitations.some(value => value.includes('not a deployed-network')));
});

test('a build, historical report, different profile or source checkout cannot qualify the packed peer session', () => {
  rejects(value => { value.format = 'peer-generation-consumer/v1'; });
  rejects(value => { value.mode = 'build-only'; });
  rejects(value => { value.profile = 'signed-inclusion-v2'; });
  rejects(value => { delete value.executionManifestDigest; });
  rejects(value => { value.source.commit = 'feat/portable-peer-core'; });
  rejects(value => { delete value.artifacts[0].sourceDirty; });
  rejects(value => { value.publicBoundary.siblingSourceImports = 1; });
  rejects(value => { value.publicBoundary.applicationRetryQueues = 1; });
  rejects(value => { value.publicBoundary.residentRequired = true; });
});

test('zero hosted command traffic needs an actual blocked workload and complete unchanged measurements', () => {
  rejects(value => { value.hostOutage.commandsApplied = 0; });
  rejects(value => { value.hostOutage.blockedProbeRejected = false; });
  rejects(value => { delete value.hostOutage.requests.before; });
  rejects(value => { value.hostOutage.requests.after += 1; });
  rejects(value => { value.hostOutage.applicationBodyBytes = { before: 100, after: 100 }; });
  rejects(value => { value.hostOutage.finalityCapability = true; });
});

test('lost-reply recovery must retain identity, original receipt and record count', () => {
  rejects(value => { value.lostReply.injectedAfterPersistence = false; });
  rejects(value => { value.lostReply.retriedOperationId = 'replacement'; });
  rejects(value => { value.lostReply.retriedReceipt.sequence += 1; });
  rejects(value => { value.lostReply.orderedRecords.after += 1; });
});

test('tolerant recovery must remove the source, lose a suffix and preserve adopted and abandoned evidence', () => {
  rejects(value => { value.recovery.sourceRemoved = false; });
  rejects(value => { value.recovery.adoptedPosition = value.recovery.previousHead; });
  rejects(value => { value.recovery.freshPeerDigest = '2'.repeat(64); });
  rejects(value => { value.recovery.coherentReset = false; });
  rejects(value => { value.recovery.inheritedOperationIds.push('op-abandoned'); });
  rejects(value => { value.recovery.abandonedEvidencePreserved = false; });
  rejects(value => { delete value.recovery.inheritedAfter.revision; });
  rejects(value => { value.recovery.inheritedAfter.revision.generation = 'g1'; });
  rejects(value => { value.recovery.inheritedAfter.attemptId = 'replacement'; });
  rejects(value => { value.recovery.inheritedAfter.status = 'final'; });
  rejects(value => { value.recovery.inheritedAfter.revision.finalRevision = 'invented'; });
});

test('observed revision tokens may change while reopening preserves the selected input and execution', () => {
  const report = syntheticReport();
  report.reopen.operationAfter.revision.materializationRevision = 'fresh-observation';
  validatePeerGenerationReport(report);
  rejects(value => { value.reopen.operationAfter.revision.point.sequence += 1; });
  rejects(value => { value.reopen.operationAfter.outcome = 'rejected'; });
});

test('returning old branches remain excluded across a later takeover', () => {
  rejects(value => { value.returningBranch.generationAfter = 'g1'; });
  rejects(value => { value.returningBranch.digestAfter = '2'.repeat(64); });
  rejects(value => { value.returningBranch.oldAttemptReadmitted = true; });
  rejects(value => { value.returningBranch.excludedAncestorReadopted = true; });
  rejects(value => { value.returningBranch.thirdGenerationChecked = false; });
});

test('deliberate reapplication needs new identity, linked intent, validated input and reviewed ancestry', () => {
  rejects(value => { value.reapply.newOperationId = value.reapply.originalOperationId; });
  rejects(value => { value.reapply.reapplyOf = 'unknown'; });
  rejects(value => { value.reapply.inputValidationChecked = false; });
  rejects(value => { value.reapply.reviewedAncestryChecked = false; });
  rejects(value => { value.reopen.identityAfter = 'replacement-device'; });
  rejects(value => { value.reopen.operationAfter.status = 'waiting'; });
});

function syntheticRtcReport() {
  const report = syntheticReport();
  report.topology = 'independent-native-rtc';
  report.publicBoundary.imports.push('@chronolog/peer-session/webrtc-native');
  report.runtime.dependencies = { lockSha256: 'c'.repeat(64), packages: [{ path: 'node_modules/werift', version: '0.27.0', integrity: 'sha512-synthetic' }] };
  const signaling = { sentMessages: 2, sentBytes: 2048, closed: true };
  report.rtc = { implementation: 'werift', version: '0.27.0', signalingBoundary: 'one-off-in-process-sdp-mailbox',
    byteBoundary: 'authenticated-reliable-application-frames', connections: Array.from({ length: 4 }, () => ({
      peers: ['1'.repeat(64), '2'.repeat(64)], authenticated: true, closed: true, signaling,
      routes: [{ route: 'unknown', localCandidateType: null, remoteCandidateType: null }, { route: 'unknown', localCandidateType: null, remoteCandidateType: null }],
      reliable: { sentBytes: 500, receivedBytes: 500 },
    })) };
  report.hostOutage.transport = { before: { reliable: { sentBytes: 100, receivedBytes: 100 }, signaling },
    after: { reliable: { sentBytes: 500, receivedBytes: 500 }, signaling } };
  return report;
}

test('native RTC evidence keeps unknown routes and the actual introduction and byte boundaries', () => {
  const report = syntheticRtcReport();
  const summary = validatePeerGenerationReport(report);
  assert.equal(summary.rtc.connections[0].routes[0].route, 'unknown');
  assert.ok(summary.limitations.some(value => value.includes('in-process SDP')));
  assert.throws(() => validatePeerGenerationReport({ ...syntheticReport(), topology: 'independent-native-rtc' }));
});

test('host-independent RTC commands require authenticated traffic after signaling retires', () => {
  for (const mutate of [
    value => { value.rtc.connections[0].authenticated = false; },
    value => { value.rtc.connections[0].closed = false; },
    value => { value.hostOutage.transport.after.reliable.sentBytes = 100; },
    value => { value.hostOutage.transport.after.signaling = { sentMessages: 3, sentBytes: 4096, closed: true }; },
    value => { value.rtc.connections[0].routes[0].route = 'direct'; },
    value => { delete value.runtime.dependencies.lockSha256; },
  ]) {
    const report = syntheticRtcReport(); mutate(report);
    assert.throws(() => validatePeerGenerationReport(report));
  }
});

function syntheticHostedReport() {
  const report = syntheticRtcReport();
  report.hostOutage.boundary = 'tendriller-workerd-http';
  report.rtc.signalingBoundary = 'tendriller-workerd-rendezvous';
  report.host = { runtime: 'workerd', identity: 'synthetic authenticated test accounts',
    publicImports: ['@tendriller/core/peers', '@tendriller/engine/testing'], fixtureSha256: '5'.repeat(64),
    dependencies: { lockSha256: '6'.repeat(64) }, artifacts: ['@tendriller/core', '@tendriller/engine'].map(name => ({
      ...report.artifacts[0], name,
    })) };
  const observation = { requestBodyBytes: 2000, worker: { host: { httpRequests: 6, requestBodyBytes: 2000,
    rendezvousUpgrades: 4, rendezvousSentBytes: 4000, rendezvousReceivedBytes: 4000 },
  rendezvous: Array.from({ length: 4 }, () => ({ closed: true, sentBytes: 1000, receivedBytes: 1000 })) } };
  report.hostOutage.observations = { before: structuredClone(observation), after: structuredClone(observation) };
  return report;
}

test('actual hosted evidence retains its synthetic identity and exact public artifact pairing', () => {
  const summary = validatePeerGenerationReport(syntheticHostedReport());
  assert.equal(summary.host.runtime, 'workerd');
  assert.ok(summary.limitations.some(value => value.includes('deployed login was not exercised')));
  assert.equal(summary.hostedTraffic.before.worker.host.rendezvousUpgrades, 4);
});

test('actual host qualification refuses missing HTTP counters, hidden signaling and an unpinned host', () => {
  for (const mutate of [
    value => { delete value.hostOutage.observations.before.worker.host.httpRequests; },
    value => { value.hostOutage.observations.after.worker.host.rendezvousReceivedBytes++; },
    value => { value.hostOutage.observations.after.requestBodyBytes++; },
    value => { value.hostOutage.observations.before.worker.rendezvous[0].closed = false; },
    value => { delete value.host.artifacts[0].sourceDirty; },
    value => { value.rtc.signalingBoundary = 'one-off-in-process-sdp-mailbox'; },
  ]) {
    const report = syntheticHostedReport(); mutate(report);
    assert.throws(() => validatePeerGenerationReport(report));
  }
});
