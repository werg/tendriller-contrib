// Validate recorded observations; this does not run a peer or authenticate a report.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function counter(value, name, { positive = false } = {}) {
  assert(Number.isSafeInteger(value) && value >= (positive ? 1 : 0), `${name} must be a ${positive ? 'positive' : 'nonnegative'} safe integer`);
  return value;
}

export function validateWebRtcReport(report) {
  assert.equal(report?.format, 'chronolog-webrtc-qualification/v1', 'A current WebRTC qualification report is required');
  assert.equal(report.passed, true, 'Build-only, failed and incomplete runs cannot qualify WebRTC');
  assert(!report.error, 'A report with an error cannot pass');
  const source = report.source?.chronolog;
  assert(source && /^[a-f0-9]{40}$/.test(source.head) && typeof source.dirty === 'boolean', 'Exact source commit and dirty state are required');
  assert(nonempty(report.runtime?.node) && nonempty(report.runtime?.browser), 'Actual Node and browser versions are required');
  assert(/^werift@\d+\.\d+\.\d+(?:[-+].+)?$/.test(report.runtime?.native), 'The exact native RTC implementation version is required');
  assert.equal(report.topology?.transport, 'webrtc', 'A WSS or relay report cannot qualify an RTC data channel');
  assert.equal(report.topology?.nativeImplementation, 'werift', 'The native RTC implementation must be declared');
  assert(nonempty(report.topology.signaling), 'The actual signaling arrangement must be declared');
  assert(Array.isArray(report.checks) && report.checks.length > 0, 'Runtime scenario results are required');
  const ids = new Set();
  for (const check of report.checks) {
    assert(nonempty(check.id) && check.passed === true && !ids.has(check.id), 'Every uniquely named runtime check must pass');
    ids.add(check.id);
  }

  const metrics = report.metrics;
  assert(metrics && typeof metrics === 'object', 'Observed RTC metrics are required');
  assert.equal(counter(metrics.signalingMessages, 'signalingMessages'), 2, 'One complete offer and answer are required');
  counter(metrics.signalingBytes, 'signalingBytes', { positive: true });
  assert.equal(metrics.signalingClosed, true, 'Signaling must be disposed before the measured peer exchange');
  assert.equal(counter(metrics.signalingMessagesAfterClosed, 'signalingMessagesAfterClosed'), 0, 'Warm work must not send another signaling message');
  assert.equal(report.topology.hostStoppedAfterNegotiation, true, 'The fixture host must be stopped before the measured exchange');
  const host = metrics.host;
  const hostFields = ['requests', 'requestBytes', 'responseBytes', 'applicationRequests', 'signalingMessages', 'signalingBytes'];
  for (const field of hostFields) {
    counter(host?.before?.[field], `host.before.${field}`);
    counter(host?.after?.[field], `host.after.${field}`);
    assert.equal(host.before[field], host.after[field], `Fixture host ${field} changed after introduction`);
  }
  const traffic = metrics.bytesAfterSignalingClosed;
  counter(traffic?.browserSent, 'post-introduction browser bytes', { positive: true });
  counter(traffic?.nativeSent, 'post-introduction native bytes', { positive: true });
  const records = metrics.records;
  counter(records?.browserAuthored, 'browser authored records', { positive: true });
  counter(records?.nativeAuthored, 'native authored records', { positive: true });
  counter(records?.atBrowser, 'browser retained records', { positive: true });
  counter(records?.atNative, 'native retained records', { positive: true });
  assert.equal(records.atBrowser, records.atNative, 'Both peers must retain the same record count');
  assert(records.atBrowser >= records.browserAuthored + records.nativeAuthored, 'The retained history must include both peers\' authored records');
  assert(sha256(metrics.history?.browserSha256) && sha256(metrics.history?.nativeSha256), 'Both observed signed-history SHA-256 digests are required');
  assert.equal(metrics.history.browserSha256, metrics.history.nativeSha256, 'The actual signed histories must agree');
  const payload = metrics.payload;
  counter(payload?.bytes, 'detached payload bytes', { positive: true });
  assert(sha256(payload.expectedSha256) && sha256(payload.receivedSha256), 'Expected and received detached-payload SHA-256 digests are required');
  assert.equal(payload.expectedSha256, payload.receivedSha256, 'The detached payload must arrive intact');
  assert(traffic.browserSent + traffic.nativeSent >= payload.bytes, 'Observed RTC bytes cannot be smaller than the transferred payload');
  assert.equal(counter(metrics.hostApplicationRequests, 'hostApplicationRequests'), 0, 'Application requests reached a host during the fixture');
  assert.equal(host.after.applicationRequests, 0, 'Fixture host observed an application request');
  const outcomes = metrics.outcomes;
  assert(nonempty(outcomes?.browser?.proposalId), 'The browser original proposal identity is required');
  assert.equal(outcomes.browser.outcome?.transactionId, outcomes.browser.proposalId, 'The browser outcome must belong to its original proposal');
  assert.equal(outcomes.browser.outcome?.final, true, 'The original browser operation must reach finality');
  assert.equal(outcomes.browser.outcome?.outcome?.type, 'accepted', 'The original browser operation must be accepted');
  assert.deepEqual(outcomes.retry, outcomes.browser, 'Exact retry must preserve the original proposal and final outcome');
  assert(nonempty(outcomes.native?.transactionId), 'The native original proposal identity is required');
  assert.equal(outcomes.native?.final, true, 'The original native operation must reach finality');
  assert.equal(outcomes.native?.outcome?.type, 'accepted', 'The original native operation must be accepted');

  return { format: 'peer-webrtc-evidence-summary/v1', source: report.source, runtime: report.runtime,
    topology: report.topology, checks: [...ids],
    signaling: { messages: metrics.signalingMessages, bytes: metrics.signalingBytes,
      closedBeforeExchange: true, messagesAfterClosed: 0 },
    fixtureHost: host, peerBytesAfterIntroduction: traffic, records, history: metrics.history, payload,
    originalOperations: { browser: outcomes.browser, retry: outcomes.retry, native: outcomes.native },
    qualification: 'Actual browser/native RTC, converged signed history, intact detached payload and original final operations after the fixture host stops.',
    limits: ['The report validator checks declared observations; it does not execute the scenario or authenticate the report.',
      'Peer byte counters measure logical frame payloads; they exclude RTC packet headers, credit messages and IP/UDP/DTLS/SCTP overhead.',
      'This fixture report does not establish packaged Tendriller page-host quiescence, deployed authentication, Internet reachability, provider costs or mixed SQL application behavior.',
      'No direct ICE route is inferred from the use of WebRTC; preserve actual selected-candidate evidence separately.'] };
}

async function main() {
  const { values } = parseArgs({ options: { report: { type: 'string' }, output: { type: 'string' } } });
  assert(values.report && values.output, 'Supply --report /exact/report.json --output /new/summary.json');
  const raw = await readFile(resolve(values.report));
  const summary = { ...validateWebRtcReport(JSON.parse(raw.toString('utf8'))),
    rawReportSha256: createHash('sha256').update(raw).digest('hex') };
  await writeFile(resolve(values.output), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`WebRTC evidence summary: ${resolve(values.output)}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
