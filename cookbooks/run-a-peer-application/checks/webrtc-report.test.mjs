import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWebRtcReport } from './webrtc-report.mjs';

// Synthetic validator inputs are not runtime qualification evidence.
function report() {
  const host = { requests: 5, requestBytes: 2048, responseBytes: 20000, applicationRequests: 0,
    signalingMessages: 2, signalingBytes: 4096 };
  const browser = { proposalId: 'original-browser-proposal', outcome: { transactionId: 'original-browser-proposal',
    final: true, phase: 'accepted', admissible: true, orderKey: 'original-order-key', outcome: { type: 'accepted' },
    observedAt: '2026-11-16T00:00:00.000Z', eventSetRevision: '10', materializedRevision: '10', changedByReplay: false } };
  return { format: 'chronolog-webrtc-qualification/v1', passed: true,
    source: { chronolog: { head: 'a'.repeat(40), dirty: false } },
    runtime: { node: 'v24.0.0', browser: 'fixture-browser-version', native: 'werift@0.23.0' },
    topology: { transport: 'webrtc', nativeImplementation: 'werift', signaling: 'loopback HTTP offer/answer fixture',
      hostStoppedAfterNegotiation: true },
    checks: [{ id: 'actual-peer-transfer', passed: true }],
    metrics: { signalingMessages: 2, signalingBytes: 4096, signalingClosed: true,
      signalingMessagesAfterClosed: 0, hostApplicationRequests: 0,
      host: { before: structuredClone(host), after: structuredClone(host) },
      bytesAfterSignalingClosed: { browserSent: 120000, nativeSent: 140000 },
      records: { browserAuthored: 2, nativeAuthored: 3, atBrowser: 5, atNative: 5 },
      history: { browserSha256: 'b'.repeat(64), nativeSha256: 'b'.repeat(64) },
      retry: { browserAuthoredBefore: ['record-a', 'record-b'], browserAuthoredAfter: ['record-a', 'record-b'] },
      payload: { bytes: 100000, expectedSha256: 'c'.repeat(64), receivedSha256: 'c'.repeat(64) },
      outcomes: { browser, retry: structuredClone(browser), native: { transactionId: 'original-native-proposal',
        final: true, outcome: { type: 'accepted' } } } } };
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
    value => { value.metrics.outcomes.browser.outcome.final = false; },
    value => { value.metrics.outcomes.retry.outcome.orderKey = 'replacement-order'; },
    value => { value.metrics.outcomes.retry.outcome.admissible = false; },
    value => { value.metrics.outcomes.native.final = false; },
    value => { value.metrics.outcomes.native.outcome.type = 'rejected'; },
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
    value => { value.passed = false; },
    value => { value.error = 'native connection failed'; },
    value => { value.topology.transport = 'direct-wss'; },
    value => { delete value.source.chronolog.dirty; },
    value => { value.source.chronolog.head = 'branch-name'; },
    value => { delete value.runtime.browser; },
    value => { value.runtime.native = 'werift'; },
    value => { value.checks[0].passed = false; },
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
