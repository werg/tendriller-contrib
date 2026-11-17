import assert from 'node:assert/strict';
import test from 'node:test';
import { validateApplicationReport } from './application-report.mjs';

// Synthetic validator inputs exercise rejection rules, not runtime qualification.
function report() {
  const host = { opened: 6, sentMessages: 6, receivedMessages: 18, sentBytes: 12000, receivedBytes: 14000,
    activeSockets: 0, available: false };
  const introduction = { sentMessages: 1, receivedMessages: 1, sentBytes: 2000, receivedBytes: 2200 };
  const browsers = [[structuredClone(introduction)], [structuredClone(introduction)]];
  const peer = { route: 'webrtc', authenticatedMs: 15, sentBytes: 10000, receivedBytes: 1000000, queuedBytes: 0 };
  const state = { records: 100, recordDigest: 'a'.repeat(43), capabilityDigest: 'b'.repeat(43), finalOrderLength: 12 };
  const operations = [[{ operationId: 'claim-a', proposalId: 'proposal-a', status: 'final', outcome: 'accepted' }],
    [{ operationId: 'claim-b', proposalId: 'proposal-b', status: 'final', outcome: 'rejected', error: 'already claimed' }]];
  const artifactFields = ['kernelSha256', 'peerIntroductionRecipeSha256', 'peerIntroductionBundleSha256', 'wasmManifestSha256',
    'wasmSha256', 'publicModuleSha256', 'scopeModuleSha256', 'specimenManifestSha256'];
  return { format: 'chronolog-application-pilot/v3', passed: true, status: 'passed', error: '', browser: 'fixture-browser-version',
    pageErrors: [], checks: ['browser task/chat runtime', 'warm host outage', 'RTC reconnect'],
    revisions: { chronolog: { head: 'a'.repeat(40), dirty: false }, contrib: { head: 'b'.repeat(40), dirty: false },
      tendrillerRuntime: { head: 'not-a-git-checkout', dirty: true } },
    publicArtifacts: { runtimePackage: { name: '@tendriller/runtime', version: '0.3.0-rc.9' },
      ...Object.fromEntries(artifactFields.map(field => [field, 'c'.repeat(64)])) },
    counts: { hostApplicationRequests: 0, hostApplicationWrites: 0, effectDispatches: 1 },
    diagnostics: { routes: { engineSha256: 'd'.repeat(64), finalEventDigest: 'e'.repeat(64), failures: [], unexpectedHostRequests: 0,
      topology: { signaling: ['Chromium', 'packaged workerd SDP rendezvous', 'native peer'],
        application: ['Chromium Worker', 'RTC DataChannel over loopback UDP', 'native peer'] },
      measurement: { byteBoundary: 'Logical authenticated peer frame payload bytes before RTC packet headers; SDP JSON envelopes counted separately',
        queueScope: 'Sampled native send and receive queues', queueSampleIntervalMs: 10 },
      excludes: ['RTC packet headers and credit messages', 'IP/UDP/DTLS/SCTP packet overhead', 'provider billing', 'public NAT'],
      limits: { queueBytes: 4 * 1024 * 1024 },
      sessions: Array.from({ length: 6 }, (_, id) => ({ id, route: 'webrtc', readyMs: 10, authenticatedMs: 15,
        sentBytes: 1000000, receivedBytes: 10000, sampledPeakQueuedBytes: 1000000,
        nativeSignaling: { closed: true, sentDescriptions: 1, receivedDescriptions: 1, sentBytes: 2200, receivedBytes: 2400 } })),
      browserSessions: [[structuredClone(peer), structuredClone(peer)], [structuredClone(peer)]],
      browserSignaling: structuredClone(browsers), signaling: { ...host, available: true },
      hostOutage: { signalingBefore: { host: structuredClone(host), browsers: structuredClone(browsers) },
        signalingAfter: { host: structuredClone(host), browsers: structuredClone(browsers) },
        rtcBytesBefore: 1000000, rtcBytesAfter: 1010000, hostApplicationRequests: 0 },
      nativeState: state, replicaStates: [structuredClone(state), structuredClone(state)],
      originalOperations: { before: operations, after: structuredClone(operations) },
      catchUp: { applicationStringBytes: 768 * 1024, eventsPerProposal: 16, eventBodyBytes: 12 * 1024, elapsedMs: 200, applicationBytesPerSecond: 3932160 },
    } } };
}
function reject(changes) {
  for (const change of changes) { const value = report(); change(value); assert.throws(() => validateApplicationReport(value)); }
}

test('application summary preserves exact measured boundaries, outcomes, pins and unequal session lifetimes', () => {
  const input = report(); input.revisions.contrib.dirty = true;
  const summary = validateApplicationReport(input);
  assert.equal(summary.revisions.contrib.dirty, true);
  assert.equal(summary.publicArtifacts.peerIntroductionRecipeSha256, 'c'.repeat(64));
  assert.equal(summary.measurement.byteBoundary, input.diagnostics.routes.measurement.byteBoundary);
  assert.deepEqual(summary.originalOperations, input.diagnostics.routes.originalOperations);
  assert.equal(summary.sessions.native.length, 6);
  assert.equal(summary.sessions.browsers[0].length, 2);
  assert.equal(summary.sessions.browsers[1].length, 1);
  assert(summary.limits.some(limit => limit.includes('exclude RTC packet headers')));
});

test('old, failed, incomplete and build-only reports cannot qualify the RTC application', () => {
  reject([
    value => { value.format = 'chronolog-application-pilot/v1'; },
    value => { value.format = 'chronolog-application-pilot/v2'; },
    value => { value.passed = false; },
    value => { value.status = 'built; browser scenarios not run'; },
    value => { value.error = 'RTC connection failed'; },
    value => { delete value.browser; },
    value => { value.pageErrors.push('Worker failed'); },
    value => { value.checks = []; },
    value => { value.checks.push(value.checks[0]); },
    value => { delete value.diagnostics.routes; },
  ]);
});

test('actual public artifact and source identities cannot be replaced by branch names or missing digests', () => {
  reject([
    value => { value.revisions.chronolog.head = 'feat/portable-peer-core'; },
    value => { delete value.revisions.contrib.dirty; },
    value => { delete value.publicArtifacts.peerIntroductionRecipeSha256; },
    value => { delete value.publicArtifacts.peerIntroductionBundleSha256; },
    value => { value.publicArtifacts.runtimePackage.name = 'private-runtime-copy'; },
    value => { value.publicArtifacts.wasmSha256 = ''; },
    value => { delete value.diagnostics.routes.engineSha256; },
  ]);
});

test('zero host traffic requires complete counters, stopped listener and retired introduction sockets', () => {
  reject([
    value => { delete value.counts.hostApplicationRequests; },
    value => { value.counts.hostApplicationRequests = 1; },
    value => { value.counts.hostApplicationWrites = 1; },
    value => { value.counts.effectDispatches = 2; },
    value => { value.diagnostics.routes.unexpectedHostRequests = 1; },
    value => { value.diagnostics.routes.hostOutage.hostApplicationRequests = 1; },
    value => { delete value.diagnostics.routes.hostOutage.signalingBefore.host.sentBytes; },
    value => { value.diagnostics.routes.hostOutage.signalingBefore.host.activeSockets = 1; },
    value => { value.diagnostics.routes.hostOutage.signalingBefore.host.available = true; },
    value => { value.diagnostics.routes.hostOutage.signalingAfter.host.receivedMessages += 1; },
    value => { value.diagnostics.routes.hostOutage.signalingAfter.browsers[0][0].sentMessages += 1; },
    value => { value.diagnostics.routes.signaling.activeSockets = 1; },
  ]);
});

test('host outages must show growing RTC application bytes on authenticated bounded channels', () => {
  reject([
    value => { delete value.diagnostics.routes.hostOutage.rtcBytesBefore; },
    value => { value.diagnostics.routes.hostOutage.rtcBytesAfter = value.diagnostics.routes.hostOutage.rtcBytesBefore; },
    value => { value.diagnostics.routes.sessions[0].route = 'workerd-relay'; },
    value => { value.diagnostics.routes.sessions[0].authenticatedMs = null; },
    value => { value.diagnostics.routes.sessions[0].sentBytes = 0; },
    value => { value.diagnostics.routes.sessions[0].sampledPeakQueuedBytes = 9 * 1024 * 1024; },
    value => { value.diagnostics.routes.sessions[0].nativeSignaling.closed = false; },
    value => { value.diagnostics.routes.sessions[0].nativeSignaling.sentDescriptions = 2; },
    value => { value.diagnostics.routes.browserSessions[1] = []; },
    value => { value.diagnostics.routes.browserSessions[1][0].route = 'direct-wss'; },
    value => { value.diagnostics.routes.browserSignaling[1][0].receivedMessages = 0; },
    value => { value.diagnostics.routes.limits.queueBytes = 8 * 1024 * 1024; },
    value => { delete value.diagnostics.routes.measurement.byteBoundary; },
    value => { value.diagnostics.routes.excludes = []; },
  ]);
});

test('reconnect must preserve complete signed history, capability state and final order on both replicas', () => {
  reject([
    value => { value.diagnostics.routes.replicaStates.pop(); },
    value => { value.diagnostics.routes.replicaStates[0].recordDigest = 'c'.repeat(43); },
    value => { value.diagnostics.routes.replicaStates[1].capabilityDigest = 'c'.repeat(43); },
    value => { value.diagnostics.routes.replicaStates[1].records -= 1; },
    value => { value.diagnostics.routes.replicaStates[1].finalOrderLength -= 1; },
    value => { delete value.diagnostics.routes.finalEventDigest; },
    value => { value.diagnostics.routes.catchUp.applicationStringBytes = 767 * 1024; },
    value => { value.diagnostics.routes.catchUp.elapsedMs = NaN; },
  ]);
});

test('original accepted and rejected operations survive RTC reconnect without replacement or changed results', () => {
  reject([
    value => { delete value.diagnostics.routes.originalOperations; },
    value => { value.diagnostics.routes.originalOperations.before[0] = []; },
    value => { value.diagnostics.routes.originalOperations.after[0][0].proposalId = 'replacement-proposal'; },
    value => { value.diagnostics.routes.originalOperations.before[0][0].status = 'queued'; },
    value => { value.diagnostics.routes.originalOperations.before[1][0].status = 'rejected'; },
    value => { value.diagnostics.routes.originalOperations.after[1][0].outcome = 'accepted'; },
    value => { value.diagnostics.routes.originalOperations.before[1][0].outcome = 'accepted';
      value.diagnostics.routes.originalOperations.after = structuredClone(value.diagnostics.routes.originalOperations.before); },
  ]);
});
