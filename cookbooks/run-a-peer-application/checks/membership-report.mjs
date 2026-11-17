import assert from 'node:assert/strict';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const counter = (value, name, minimum = 0) => assert(Number.isSafeInteger(value) && value >= minimum, `${name} must be an observed safe integer`);

/** Require compact authenticated control bootstrap and actual RTC application transfer. */
export function validateMembershipReport(report) {
  assert.equal(report?.format, 'chronolog-thin-membership/v3', 'The current compact-proof RTC membership report is required');
  assert.equal(report.passed, true, 'The actual membership runtime scenarios must pass');
  assert.equal(report.status, 'passed', 'A build-only membership graph is not runtime evidence');
  assert(!report.error, 'A report with an error cannot pass');
  assert(nonempty(report.browser), 'The actual Chromium version is required');
  assert.deepEqual(report.pageErrors, [], 'The browser must report no runtime errors');
  const source = report.revisions?.chronolog;
  assert(source && /^[a-f0-9]{40}$/.test(source.head) && typeof source.dirty === 'boolean', 'Exact source and dirty state are required');
  assert(sha256(report.artifacts?.sdk?.sha256) && sha256(report.artifacts?.engine?.sha256), 'The public SDK and engine artifact digests are required');
  assert(sha256(report.artifacts.browserWorkerSha256) && sha256(report.artifacts.browserPageSha256), 'Both actual browser bundle digests are required');
  assert(Array.isArray(report.checks) && report.checks.length > 1 && report.checks.every(check => nonempty(check.name)) &&
    new Set(report.checks.map(check => check.name)).size === report.checks.length, 'Distinct completed membership scenarios are required');
  for (const field of ['applicationBytes', 'rtcSdpBytes', 'rtcSignalingRequestBytes', 'rtcSignalingResponseBytes']) {
    assert(nonempty(report.measurement?.[field]), `The ${field} measurement boundary is required`);
  }
  const rtc = report.final?.rtc, traffic = report.final?.traffic;
  assert.equal(rtc?.browser?.transport, 'webrtc', 'Membership application traffic must use actual browser RTC');
  assert.equal(rtc.browser.channelOwner, 'DedicatedWorker', 'The exclusive Worker must own the channel');
  assert.equal(rtc.native?.transport, 'webrtc', 'The native peer must use RTC');
  assert.equal(rtc.native.nativeImplementation, 'werift', 'The tested native RTC implementation is required');
  assert.equal(rtc.native.accepted, 3, 'Enrollment, reconnect after writer revocation and the restored administrator\'s new reader must each authenticate');
  assert(Array.isArray(rtc.browser.introductions) && rtc.browser.introductions.length === 3, 'All three actual browser introductions are required');
  for (const introduction of rtc.browser.introductions) {
    assert.equal(introduction.requests, 1, 'Each connection uses one direct introduction POST');
    assert.equal(introduction.closed, true, 'Introduction must retire after the channel is negotiated');
    counter(introduction.requestBytes, 'introduction request-body bytes', 1);
    counter(introduction.responseBytes, 'introduction response-body bytes', 1);
  }
  for (const field of ['membershipRequests', 'peerInboundBytes', 'peerOutboundBytes', 'rtcSignalingRequests',
    'rtcSignalingRequestBytes', 'rtcSignalingResponseBytes', 'rtcSdpBytes']) counter(traffic?.[field], field, 1);
  assert.equal(traffic.rtcSignalingDescriptions, 6, 'The three introductions require exactly three complete offer/answer pairs');
  assert.equal(traffic.applicationEnvelopeBytesToAdministrator, 0, 'The administrator must not receive application envelope bytes');
  assert.equal(traffic.candidateDescriptorBytes, 0, 'The administrator must not receive application descriptors');
  counter(traffic.inlineControlDescriptorBytes, 'authenticated control descriptor bytes', 1);
  counter(traffic.closureRecordBytes, 'signed compact checkpoint bytes', 1);
  assert.equal(traffic.unexpectedAdministratorRequests, 0, 'The administrator must not call application endpoints');
  return true;
}
