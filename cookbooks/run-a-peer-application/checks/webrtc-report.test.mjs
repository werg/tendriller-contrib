import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWebRtcReport } from './webrtc-report.mjs';

// Synthetic validator inputs are not runtime qualification evidence.
function report() {
  return { format: 'chronolog-webrtc-qualification/v1', passed: true,
    source: { chronolog: { head: 'a'.repeat(40), dirty: false } },
    runtime: { node: 'v24.0.0', browser: 'fixture-browser-version', native: 'werift@0.23.0' },
    topology: { transport: 'webrtc', nativeImplementation: 'werift', signaling: 'in-process qualification' },
    checks: [{ id: 'actual-peer-transfer', passed: true }],
    metrics: { signalingMessages: 2, signalingBytes: 4096, signalingClosed: true,
      signalingMessagesAfterClosed: 0, hostApplicationRequests: 0,
      bytesAfterSignalingClosed: { browserSent: 120000, nativeSent: 140000 },
      records: { browserAuthored: 2, nativeAuthored: 3, atBrowser: 5, atNative: 5 },
      history: { browserSha256: 'b'.repeat(64), nativeSha256: 'b'.repeat(64) },
      payload: { bytes: 100000, expectedSha256: 'c'.repeat(64), receivedSha256: 'c'.repeat(64) } } };
}

test('RTC report validation preserves actual scope, dirty source and unknown physical routing', () => {
  const input = report(); input.source.chronolog.dirty = true;
  const summary = validateWebRtcReport(input);
  assert.equal(summary.source.chronolog.dirty, true);
  assert.equal(summary.topology.signaling, 'in-process qualification');
  assert.equal(summary.topology.route, undefined);
  assert.equal(summary.peerBytesAfterIntroduction.browserSent, 120000);
  assert(summary.limits.some(limit => limit.includes('page-host quiescence')));
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
