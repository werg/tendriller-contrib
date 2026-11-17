// Validate recorded observations; this does not run a peer or authenticate a report.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const digest = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
function counter(value, name, { positive = false } = {}) {
  assert(Number.isSafeInteger(value) && value >= (positive ? 1 : 0), `${name} must be a ${positive ? 'positive' : 'nonnegative'} safe integer`);
  return value;
}
function duration(value, name) {
  assert(Number.isFinite(value) && value >= 0, `${name} must be an observed nonnegative duration`);
}
function browserSignaling(pages) {
  assert(Array.isArray(pages) && pages.length === 2, 'Both browser layouts must preserve signaling observations');
  for (const sessions of pages) {
    assert(Array.isArray(sessions) && sessions.length > 0, 'Each browser must have an observed introduction');
    for (const session of sessions) {
      assert.equal(session.sentMessages, 1, 'Each browser introduction must send exactly one complete description');
      assert.equal(session.receivedMessages, 1, 'Each browser introduction must receive exactly one complete description');
      counter(session.sentBytes, 'browser signaling sent bytes', { positive: true });
      counter(session.receivedBytes, 'browser signaling received bytes', { positive: true });
    }
  }
}
function hostSignaling(host) {
  for (const field of ['opened', 'sentMessages', 'receivedMessages', 'sentBytes', 'receivedBytes']) {
    counter(host?.[field], `host signaling ${field}`, { positive: true });
  }
  assert.equal(host.activeSockets, 0, 'Every host introduction socket must be retired');
  assert.equal(typeof host.available, 'boolean', 'The observed host listener state is required');
}

export function validateApplicationReport(report) {
  assert.equal(report?.format, 'chronolog-application-pilot/v3', 'A current RTC application-pilot report is required');
  assert.equal(report.passed, true, 'Build-only, failed and incomplete runs cannot qualify an application');
  assert.equal(report.status, 'passed', 'The runtime scenarios must have completed');
  assert(!report.error, 'A report with an error cannot pass');
  assert(nonempty(report.browser), 'The actual browser version is required');
  assert.deepEqual(report.pageErrors, [], 'Browser errors cannot qualify an application');
  assert(Array.isArray(report.checks) && report.checks.length > 0 && report.checks.every(nonempty) &&
    new Set(report.checks).size === report.checks.length, 'Uniquely named completed scenario checks are required');
  for (const name of ['chronolog', 'contrib']) {
    const source = report.revisions?.[name];
    assert(source && /^[a-f0-9]{40}$/.test(source.head) && typeof source.dirty === 'boolean', `Exact ${name} source and dirty state are required`);
  }
  const artifacts = report.publicArtifacts;
  assert.equal(artifacts?.runtimePackage?.name, '@tendriller/runtime', 'The public Tendriller runtime package is required');
  assert(nonempty(artifacts.runtimePackage.version), 'The packaged runtime version is required');
  for (const field of ['kernelSha256', 'peerIntroductionRecipeSha256', 'peerIntroductionBundleSha256', 'wasmManifestSha256',
    'wasmSha256', 'publicModuleSha256', 'scopeModuleSha256', 'specimenManifestSha256']) {
    assert(sha256(artifacts[field]), `The actual ${field} artifact digest is required`);
  }
  assert.equal(counter(report.counts?.hostApplicationRequests, 'hostApplicationRequests'), 0, 'An application request reached or attempted a host service');
  assert.equal(counter(report.counts?.hostApplicationWrites, 'hostApplicationWrites'), 0, 'An application write reached a host service');
  assert.equal(counter(report.counts?.effectDispatches, 'effectDispatches'), 1, 'The native task worker must run exactly once');

  const routes = report.diagnostics?.routes;
  assert(routes && typeof routes === 'object', 'Actual packaged-host and RTC diagnostics are required');
  assert(sha256(routes.engineSha256), 'The actual packaged Tendriller engine digest is required');
  assert(sha256(routes.finalEventDigest), 'The complete shared final-event digest is required');
  assert.deepEqual(routes.failures, [], 'A failed peer session cannot qualify the application');
  assert.equal(counter(routes.unexpectedHostRequests, 'unexpectedHostRequests'), 0, 'The packaged-host fixture observed an application request');
  for (const field of ['signaling', 'application']) assert(Array.isArray(routes.topology?.[field]) &&
    routes.topology[field].length > 0 && routes.topology[field].every(nonempty), `The ${field} topology is required`);
  assert(nonempty(routes.measurement?.byteBoundary), 'The exact byte measurement boundary is required');
  assert(nonempty(routes.measurement.queueScope), 'The measured queue scope is required');
  assert(Array.isArray(routes.excludes) && routes.excludes.length > 0 && routes.excludes.every(nonempty), 'Unmeasured overhead and deployment limits must remain explicit');
  const queueLimit = counter(routes.limits?.queueBytes, 'transport queue byte limit', { positive: true });
  assert(queueLimit <= 4 * 1024 * 1024, 'The declared per-direction RTC queue exceeds the qualification bound');
  assert(Array.isArray(routes.sessions) && routes.sessions.length >= 2, 'Both browser peers require actual native RTC sessions');
  for (const session of routes.sessions) {
    assert.equal(session.route, 'webrtc', 'A WSS or hosted relay session cannot qualify RTC');
    duration(session.readyMs, 'native RTC readiness');
    duration(session.authenticatedMs, 'native peer authentication');
    counter(session.sentBytes, 'native peer sent bytes', { positive: true });
    counter(session.receivedBytes, 'native peer received bytes', { positive: true });
    assert(counter(session.sampledPeakQueuedBytes, 'sampled native queued bytes') <= 2 * queueLimit, 'The observed native queues exceed their declared limits');
    assert.equal(session.nativeSignaling?.closed, true, 'Native signaling must be closed');
    assert.equal(session.nativeSignaling.sentDescriptions, 1, 'Native introduction must send exactly one complete description');
    assert.equal(session.nativeSignaling.receivedDescriptions, 1, 'Native introduction must receive exactly one complete description');
    counter(session.nativeSignaling.sentBytes, 'native signaling sent bytes', { positive: true });
    counter(session.nativeSignaling.receivedBytes, 'native signaling received bytes', { positive: true });
  }
  assert(Array.isArray(routes.browserSessions) && routes.browserSessions.length === 2, 'Both layouts require Worker-owned RTC observations');
  for (const sessions of routes.browserSessions) {
    assert(Array.isArray(sessions) && sessions.length > 0, 'Each browser Worker must have an observed RTC session');
    for (const session of sessions) {
      assert.equal(session.route, 'webrtc', 'Every browser application session must use RTC');
      duration(session.authenticatedMs, 'browser peer authentication');
      counter(session.sentBytes, 'browser peer sent bytes', { positive: true });
      counter(session.receivedBytes, 'browser peer received bytes', { positive: true });
      assert(counter(session.queuedBytes, 'browser queued bytes') <= 2 * queueLimit, 'The observed browser queues exceed their declared limits');
    }
  }
  hostSignaling(routes.signaling);
  browserSignaling(routes.browserSignaling);
  const outage = routes.hostOutage;
  assert(outage && typeof outage === 'object', 'A measured host outage is required');
  hostSignaling(outage.signalingBefore?.host);
  assert.equal(outage.signalingBefore.host.available, false, 'The actual host listener must be stopped during warm work');
  browserSignaling(outage.signalingBefore.browsers);
  assert.deepEqual(outage.signalingAfter, outage.signalingBefore, 'Warm application work must not grow any host or browser signaling counter');
  assert.equal(counter(outage.hostApplicationRequests, 'outage hostApplicationRequests'), 0, 'Warm work attempted a hosted application request');
  counter(outage.rtcBytesBefore, 'pre-outage logical peer frame bytes');
  assert(counter(outage.rtcBytesAfter, 'post-outage logical peer frame bytes', { positive: true }) > outage.rtcBytesBefore,
    'Warm work must exchange real application bytes after the host stops');

  const state = routes.nativeState;
  counter(state?.records, 'native retained records', { positive: true });
  counter(state?.finalOrderLength, 'native final order length', { positive: true });
  assert(digest(state.recordDigest) && digest(state.capabilityDigest), 'Signed-content and capability SHA-256 digests are required');
  assert(Array.isArray(routes.replicaStates) && routes.replicaStates.length === 2, 'Both independent replica states are required');
  for (const replica of routes.replicaStates) assert.deepEqual(replica, state, 'Every retained record, capability and final order must agree');
  const originals = routes.originalOperations;
  assert(Array.isArray(originals?.before) && originals.before.length === 2 && originals.before.every(page => Array.isArray(page) && page.length > 0),
    'Original operation identities and outcomes from both browsers are required');
  const outcomes = new Set();
  for (const page of originals.before) for (const operation of page) {
    assert(nonempty(operation?.operationId) && nonempty(operation?.proposalId), 'The original operation and proposal identities are required');
    assert(operation.status === 'final' && ['accepted', 'rejected'].includes(operation.outcome), 'Every original operation must have its final accepted or rejected outcome');
    outcomes.add(operation.outcome);
  }
  assert(outcomes.has('accepted') && outcomes.has('rejected'), 'Both successful work and the rejected contested claim must remain observable');
  assert.deepEqual(originals.after, originals.before, 'RTC reconnect must preserve each original operation and its exact outcome');
  const catchUp = routes.catchUp;
  assert(counter(catchUp?.applicationStringBytes, 'catch-up application string bytes', { positive: true }) >= 768 * 1024, 'The real catch-up workload must include at least 768 KiB of event bodies');
  duration(catchUp.elapsedMs, 'RTC reconnect and catch-up duration');

  return { format: 'peer-application-evidence-summary/v1', revisions: report.revisions, browser: report.browser,
    publicArtifacts: artifacts, engineSha256: routes.engineSha256, checks: report.checks, counts: report.counts,
    topology: routes.topology, measurement: routes.measurement, excludes: routes.excludes,
    hostOutage: outage, signaling: { host: routes.signaling, browsers: routes.browserSignaling },
    sessions: { native: routes.sessions, browsers: routes.browserSessions },
    sharedState: state, finalEventDigest: routes.finalEventDigest, originalOperations: originals, catchUp,
    qualification: 'Two independent browser OPFS applications and a native task worker use RTC through packaged Tendriller introduction, progress with its listener stopped, and retain exact signed history and original outcomes after reconnect.',
    limits: ['The validator checks recorded observations; it does not execute the application or authenticate the report.',
      'Peer byte counters measure logical frame payloads; they exclude RTC packet headers, credit messages and IP/UDP/DTLS/SCTP overhead.',
      'The local TLS bridge supplies synthetic authenticated host sessions. Production login, Internet NAT, TURN interoperability and provider billing remain unqualified.'] };
}

async function main() {
  const { values } = parseArgs({ options: { report: { type: 'string' }, output: { type: 'string' } } });
  assert(values.report && values.output, 'Supply --report /exact/report.json --output /new/summary.json');
  const raw = await readFile(resolve(values.report));
  const summary = { ...validateApplicationReport(JSON.parse(raw.toString('utf8'))), rawReportSha256: createHash('sha256').update(raw).digest('hex') };
  await writeFile(resolve(values.output), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Application evidence summary: ${resolve(values.output)}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
