import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWebRtcReport } from './webrtc-report.mjs';

// Synthetic validator inputs are not runtime qualification evidence.
function report() {
  const host = { requests: 5, requestBytes: 2048, responseBytes: 20000, applicationRequests: 0,
    signalingMessages: 4, signalingBytes: 4096 };
  const browser = { proposalId: 'original-browser-proposal', outcome: { transactionId: 'original-browser-proposal',
    final: true, admissible: true, orderKey: 'original-order-key', outcome: { type: 'accepted' },
    observedAt: '2026-11-16T00:00:00.000Z', eventSetRevision: '10', materializedRevision: '10', changedByReplay: false } };
  const recovered = structuredClone(browser);
  recovered.proposalId = recovered.outcome.transactionId = 'original-reconnect-proposal';
  return { format: 'chronolog-webrtc-qualification/v2', passed: true,
    source: { chronolog: { head: 'a'.repeat(40), dirty: false }, contrib: { head: 'f'.repeat(40), dirty: false } },
    artifacts: { residentRecipeSha256: 'd'.repeat(64), residentBundleSha256: 'e'.repeat(64) },
    runtime: { node: 'v24.0.0', browser: 'fixture-browser-version', native: 'werift@0.23.0' },
    topology: { transport: 'webrtc', nativeImplementation: 'werift', signaling: 'loopback HTTP offer/answer fixture',
      hostStoppedAfterNegotiation: true },
    checks: [{ id: 'actual-peer-transfer', passed: true }, { id: 'public-resident-supervisor-reconnects-once-and-preserves-original-operations', passed: true }],
    metrics: { signalingMessages: 4, signalingBytes: 4096, signalingClosed: true,
      signalingMessagesAfterClosed: 0, hostApplicationRequests: 0,
      host: { before: structuredClone(host), after: structuredClone(host) },
      bytesAfterSignalingClosed: { browserSent: 120000, nativeSent: 140000 },
      records: { browserAuthored: 2, nativeAuthored: 3, atBrowser: 5, atNative: 5 },
      history: { browserSha256: 'b'.repeat(64), nativeSha256: 'b'.repeat(64) },
      retry: { browserAuthoredBefore: ['record-a', 'record-b'], browserAuthoredAfter: ['record-a', 'record-b'] },
      payload: { bytes: 100000, expectedSha256: 'c'.repeat(64), receivedSha256: 'c'.repeat(64) },
      introduction: { accepted: 2, active: 1, pending: 0, failed: 1 },
      reconnect: { readiness: 'authenticated', elapsedMs: 400, original: recovered, retry: structuredClone(recovered),
        browserAuthoredBefore: ['record-recovered'], browserAuthoredAfter: ['record-recovered'],
        introductions: Array.from({ length: 2 }, () => ({ requests: 1, requestBytes: 600, responseBytes: 600, closed: true })),
        expectedTerminations: ['WEBRTC_CONNECTION_ENDED'],
        routes: Array.from({ length: 2 }, () => ({ route: 'unknown', localCandidateType: null, remoteCandidateType: null })) },
      outcomes: { browser, retry: structuredClone(browser), native: { transactionId: 'original-native-proposal',
        final: true, admissible: true, orderKey: 'original-native-order-key', outcome: { type: 'accepted' } } } } };
}

test('RTC report validation preserves actual scope, dirty source and unknown physical routing', () => {
  const input = report(); input.source.chronolog.dirty = true;
  const summary = validateWebRtcReport(input);
  assert.equal(summary.source.chronolog.dirty, true);
  assert.equal(summary.topology.signaling, 'loopback HTTP offer/answer fixture');
  assert.equal(summary.topology.route, undefined);
  assert.equal(summary.peerBytesAfterIntroduction.browserSent, 120000);
  assert(summary.limits.some(limit => limit.includes('page-host quiescence')));
});

test('canonical final outcomes qualify without a phase field', () => {
  const input = report();
  const outcomes = [input.metrics.outcomes.browser.outcome, input.metrics.outcomes.retry.outcome,
    input.metrics.outcomes.native, input.metrics.reconnect.original.outcome, input.metrics.reconnect.retry.outcome];
  for (const outcome of outcomes) assert.equal(Object.hasOwn(outcome, 'phase'), false);
  const summary = validateWebRtcReport(input);
  assert.deepEqual(summary.originalOperations, input.metrics.outcomes);
  assert.deepEqual(summary.reconnect.original, input.metrics.reconnect.original);
  assert.deepEqual(summary.reconnect.retry, input.metrics.reconnect.retry);
});

test('all observed fixture host counters must remain unchanged after actual shutdown', () => {
  for (const change of [
    value => { delete value.metrics.host.before.requests; },
    value => { delete value.metrics.hostApplicationRequests; },
    value => { value.metrics.host.after.requests += 1; },
    value => { value.metrics.host.after.responseBytes += 1; },
    value => { value.topology.hostStoppedAfterNegotiation = false; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('original accepted outcomes and identity must survive exact retry after host shutdown', () => {
  for (const change of [
    value => { value.metrics.outcomes.retry.proposalId = 'replacement-proposal'; },
    value => { value.metrics.outcomes.browser.outcome.transactionId = 'another-proposal'; },
    value => { delete value.metrics.outcomes.browser.outcome.transactionId; },
    value => { value.metrics.outcomes.browser.outcome.final = false; },
    value => { delete value.metrics.outcomes.browser.outcome.final; },
    value => { value.metrics.outcomes.browser.outcome.outcome.type = 'rejected'; },
    value => { value.metrics.outcomes.browser.outcome.orderKey = ''; },
    value => { delete value.metrics.outcomes.browser.outcome.admissible; },
    value => { value.metrics.outcomes.retry.outcome.orderKey = 'replacement-order'; },
    value => { value.metrics.outcomes.retry.outcome.admissible = false; },
    value => { value.metrics.outcomes.native.final = false; },
    value => { value.metrics.outcomes.native.outcome.type = 'rejected'; },
    value => { value.metrics.outcomes.native.transactionId = ''; },
    value => { delete value.metrics.outcomes.native.orderKey; },
    value => { value.metrics.outcomes.native.admissible = false; },
    value => { delete value.metrics.outcomes.browser; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('a retry preserves its immutable decision while local observation revisions and time advance', () => {
  const value = report();
  Object.assign(value.metrics.outcomes.retry.outcome, { observedAt: '2026-11-16T00:00:01.000Z',
    eventSetRevision: '12', materializedRevision: '12', changedByReplay: true });
  const summary = validateWebRtcReport(value);
  assert.equal(summary.originalOperations.retry.outcome.eventSetRevision, '12');
  assert.equal(summary.originalOperations.browser.outcome.eventSetRevision, '10');
  assert.equal(summary.originalOperations.retry.proposalId, summary.originalOperations.browser.proposalId);
});

test('retry evidence must show unchanged original authored records, not merely equal accepted outcomes', () => {
  for (const change of [
    value => { delete value.metrics.retry; },
    value => { value.metrics.retry.browserAuthoredAfter.push('replacement-record'); },
    value => { value.metrics.retry.browserAuthoredAfter[0] = 'replacement-record'; },
    value => { value.metrics.retry.browserAuthoredBefore = []; value.metrics.retry.browserAuthoredAfter = []; },
    value => { value.metrics.retry.browserAuthoredBefore = ['record-a', 'record-a'];
      value.metrics.retry.browserAuthoredAfter = ['record-a', 'record-a']; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('build-only, failed, non-RTC and unpinned runs cannot be promoted to RTC evidence', () => {
  for (const change of [
    value => { value.format = 'chronolog-webrtc-qualification/v1'; },
    value => { value.passed = false; },
    value => { value.error = 'native connection failed'; },
    value => { value.topology.transport = 'direct-wss'; },
    value => { delete value.source.chronolog.dirty; },
    value => { delete value.source.contrib; },
    value => { delete value.artifacts.residentRecipeSha256; },
    value => { value.source.chronolog.head = 'branch-name'; },
    value => { delete value.runtime.browser; },
    value => { value.runtime.native = 'werift'; },
    value => { value.checks[0].passed = false; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('recovery must use the public authenticated recipe and retain the original records', () => {
  for (const change of [
    value => { value.checks.pop(); },
    value => { delete value.metrics.reconnect; },
    value => { value.metrics.reconnect.readiness = 'transport'; },
    value => { value.metrics.reconnect.introductions.push(value.metrics.reconnect.introductions[0]); },
    value => { value.metrics.reconnect.introductions[0].closed = false; },
    value => { value.metrics.reconnect.retry.proposalId = 'replacement'; },
    value => { value.metrics.reconnect.retry.outcome.final = false; },
    value => { value.metrics.reconnect.original.outcome.outcome.type = 'rejected'; },
    value => { value.metrics.reconnect.browserAuthoredAfter.push('replacement'); },
    value => { value.metrics.introduction.active = 2; },
    value => { value.metrics.introduction.failed = 2; },
    value => { value.metrics.reconnect.expectedTerminations[0] = 'PEER_HANDSHAKE_TIMEOUT'; },
    value => { value.metrics.reconnect.routes[0].route = 'direct'; },
    value => { value.metrics.reconnect.routes[0].route = 'relay'; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('unknown, increasing or still-open signaling cannot count as post-introduction independence', () => {
  for (const change of [
    value => { delete value.metrics.signalingMessagesAfterClosed; },
    value => { value.metrics.signalingMessagesAfterClosed = 1; },
    value => { value.metrics.signalingClosed = false; },
    value => { value.metrics.signalingMessages = 3; },
    value => { value.metrics.bytesAfterSignalingClosed.nativeSent = 0; },
    value => { value.metrics.hostApplicationRequests = 1; },
    value => { value.metrics.signalingBytes = NaN; },
    value => { value.metrics.signalingBytes = Number.MAX_SAFE_INTEGER + 1; },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});

test('equal counts without matching signed history and intact detached bytes cannot pass', () => {
  for (const change of [
    value => { value.metrics.history.nativeSha256 = 'd'.repeat(64); },
    value => { delete value.metrics.history; },
    value => { value.metrics.records.atBrowser = 4; },
    value => { value.metrics.records.browserAuthored = 0; },
    value => { value.metrics.payload.receivedSha256 = 'd'.repeat(64); },
    value => { value.metrics.payload.bytes = 300000; },
    value => { value.metrics.payload.expectedSha256 = ''; },
    value => { value.checks.push(value.checks[0]); },
  ]) { const value = report(); change(value); assert.throws(() => validateWebRtcReport(value)); }
});
