import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMembershipReport } from './membership-report.mjs';

// Synthetic format-validator inputs do not qualify browser membership behavior.
function report() {
  return { format: 'chronolog-thin-membership/v2', passed: true, status: 'passed', error: '', browser: 'fixture-browser-version', pageErrors: [],
    revisions: { chronolog: { head: 'a'.repeat(40), dirty: false } },
    artifacts: { sdk: { sha256: 'b'.repeat(64) }, engine: { sha256: 'c'.repeat(64) }, browserWorkerSha256: 'd'.repeat(64), browserPageSha256: 'e'.repeat(64) },
    checks: [{ name: 'public package build', evidence: {} }, { name: 'actual browser membership', evidence: {} }],
    measurement: { applicationBytes: 'Logical peer frame payload bytes', rtcSdpBytes: 'UTF-8 SDP bytes',
      rtcSignalingRequestBytes: 'HTTP request-body JSON bytes', rtcSignalingResponseBytes: 'HTTP response-body JSON bytes' },
    final: { rtc: { native: { transport: 'webrtc', nativeImplementation: 'werift', accepted: 3 },
      browser: { transport: 'webrtc', channelOwner: 'DedicatedWorker', introductions: Array.from({ length: 3 }, () =>
        ({ requests: 1, requestBytes: 600, responseBytes: 600, closed: true })) } },
      traffic: { membershipRequests: 10, peerInboundBytes: 10000, peerOutboundBytes: 1000000,
        rtcSignalingRequests: 3, rtcSignalingRequestBytes: 1800, rtcSignalingResponseBytes: 1800, rtcSdpBytes: 3000,
        rtcSignalingDescriptions: 6, applicationEnvelopeBytesToAdministrator: 0, unexpectedAdministratorRequests: 0 } } };
}
function reject(changes) {
  for (const change of changes) { const value = report(); change(value); assert.throws(() => validateMembershipReport(value)); }
}
test('current runtime evidence requires both Worker and native RTC observations', () => {
  assert.equal(validateMembershipReport(report()), true);
});
test('historical HTTP reports, build-only output and missing source/artifact identities fail closed', () => {
  reject([
    value => { value.format = 'chronolog-thin-membership/v1'; },
    value => { value.passed = false; },
    value => { value.status = 'built; workerd and browser scenarios not run'; },
    value => { delete value.browser; },
    value => { value.pageErrors.push('Worker failed'); },
    value => { delete value.revisions.chronolog.dirty; },
    value => { delete value.artifacts.browserPageSha256; },
  ]);
});
test('successful enrollment cannot stand in for each actual authorized RTC reconnection', () => {
  reject([
    value => { value.final.rtc.browser.transport = 'http-stream'; },
    value => { value.final.rtc.browser.channelOwner = 'Window'; },
    value => { value.final.rtc.native.accepted = 2; },
    value => { value.final.rtc.browser.introductions.pop(); },
    value => { value.final.rtc.browser.introductions[0].closed = false; },
    value => { value.final.rtc.browser.introductions[1].requests = 2; },
    value => { value.final.traffic.rtcSignalingDescriptions = 7; },
  ]);
});
test('unknown byte boundaries or counters cannot be treated as zero administrator load', () => {
  reject([
    value => { delete value.measurement.applicationBytes; },
    value => { delete value.final.traffic.rtcSignalingResponseBytes; },
    value => { value.final.traffic.peerOutboundBytes = 0; },
    value => { delete value.final.traffic.applicationEnvelopeBytesToAdministrator; },
    value => { value.final.traffic.applicationEnvelopeBytesToAdministrator = 1; },
    value => { value.final.traffic.unexpectedAdministratorRequests = 1; },
  ]);
});
