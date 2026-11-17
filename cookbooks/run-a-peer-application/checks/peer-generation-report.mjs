// Evidence validation for the independent packed peer-generation consumer.
// This checks recorded observations; it never supplies missing measurements.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const hex = (value, size, name) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${size}}$`), name);
const count = (value, name) => assert.ok(Number.isSafeInteger(value) && value >= 0, name);
const nonempty = (value, name) => assert.ok(typeof value === 'string' && value.length > 0, name);
const same = (left, right, name) => assert.deepEqual(left, right, name);
const unchangedCounter = (value, name) => {
  count(value?.before, `${name}.before`);
  count(value?.after, `${name}.after`);
  same(value.after, value.before, `${name} changed during the host-blocked workload`);
};

export function validatePeerGenerationReport(report) {
  same(report?.format, 'peer-generation-consumer/v1', 'Wrong report format');
  same(report.mode, 'runtime', 'A build cannot qualify runtime behavior');
  same(report.profile, 'peer-generation-v1', 'A different profile cannot qualify tolerant recovery');
  hex(report.executionManifestDigest, 64, 'Missing exact execution manifest');
  assert.ok(['independent-packed-peers', 'independent-native-rtc'].includes(report.topology), 'Report the actual execution topology');
  const rtc = report.topology === 'independent-native-rtc';
  same(report.passed, true, 'The consumer did not pass');
  nonempty(report.runtime?.node, 'Missing actual Node version');
  nonempty(report.runtime?.platform, 'Missing actual platform');
  hex(report.source?.commit, 40, 'Missing exact consumer commit');
  hex(report.source?.tree, 40, 'Missing exact consumer tree');
  same(typeof report.source?.dirty, 'boolean', 'Consumer cleanliness must be observed');
  assert.ok(Array.isArray(report.artifacts) && report.artifacts.length > 0, 'Missing packed artifacts');
  assert.ok(report.artifacts.some(artifact => artifact.name === '@chronolog/peer-session'), 'Missing public session artifact');
  for (const artifact of report.artifacts) {
    nonempty(artifact.name, 'Missing artifact package');
    nonempty(artifact.version, 'Missing artifact version');
    hex(artifact.sha256, 64, 'Missing exact archive digest');
    hex(artifact.sourceCommit, 40, 'Missing artifact source commit');
    hex(artifact.sourceTree, 40, 'Missing artifact source tree');
    same(typeof artifact.sourceDirty, 'boolean', 'Artifact cleanliness must be observed');
  }
  same(report.publicBoundary?.imports, ['@chronolog/peer-session', '@chronolog/peer-session/native',
    ...(rtc ? ['@chronolog/peer-session/webrtc-native'] : [])], 'Use only the documented public session entry');
  same(report.publicBoundary?.siblingSourceImports, 0, 'A sibling source checkout is not an independent consumer');
  same(report.publicBoundary?.applicationRetryQueues, 0, 'The consumer must use the session journal');
  same(report.publicBoundary?.residentRequired, false, 'A permanent resident is not this profile');

  const host = report.hostOutage;
  assert.ok(['portable-control-port', 'tendriller-workerd-http'].includes(host?.boundary), 'Host traffic scope must be explicit');
  const hosted = host.boundary === 'tendriller-workerd-http';
  same(host?.blocked, true, 'Host endpoints were not blocked');
  same(host.blockedProbeRejected, true, 'Blocking must be observed by an actual refused request');
  count(host.commandsApplied, 'Missing completed command count');
  assert.ok(host.commandsApplied > 0, 'The host-blocked workload applied no commands');
  unchangedCounter(host.requests, 'Host requests');
  unchangedCounter(host.applicationBodyBytes, 'Hosted application body bytes');
  same(host.applicationBodyBytes.before, 0, 'Default commands must not upload application bodies');
  same(host.finalityCapability, false, 'Applied progress must not claim finality');
  if (hosted) {
    same(rtc, true, 'A real hosted gate also requires real peer transport');
    same(report.host?.runtime, 'workerd', 'A mocked host cannot qualify HTTP controls');
    same(report.host.identity, 'synthetic authenticated test accounts', 'Identity scope must be explicit');
    same(report.host.publicImports, ['@tendriller/core/peers', '@tendriller/engine/testing'], 'Host fixture must consume public packages');
    hex(report.host.fixtureSha256, 64, 'Missing exact workerd fixture');
    hex(report.host.dependencies?.lockSha256, 64, 'Missing host dependency lock');
    same(report.host.artifacts?.map(value => value.name), ['@tendriller/core', '@tendriller/engine'], 'Missing exact public host pairing');
    for (const artifact of report.host.artifacts) {
      nonempty(artifact.version, 'Missing host package version'); hex(artifact.sha256, 64, 'Missing host archive digest');
      hex(artifact.sourceCommit, 40, 'Missing host source commit'); hex(artifact.sourceTree, 40, 'Missing host source tree');
      same(typeof artifact.sourceDirty, 'boolean', 'Host cleanliness must be observed');
    }
    const before = host.observations?.before, after = host.observations?.after;
    assert.ok(before?.worker.host && after?.worker.host, 'Missing complete actual workerd request counters');
    for (const field of ['httpRequests', 'requestBodyBytes', 'rendezvousUpgrades', 'rendezvousSentBytes', 'rendezvousReceivedBytes']) {
      count(before.worker.host[field], `Host ${field}`);
      same(before.worker.host[field], after.worker.host[field], `Actual host ${field} changed during ordinary commands`);
    }
    assert.ok(before.worker.host.httpRequests > 0 && before.worker.host.rendezvousUpgrades >= 4, 'No actual hosted controls/reconnect introduction were observed');
    unchangedCounter({ before: before.requestBodyBytes, after: after.requestBodyBytes }, 'Native host bridge body bytes');
    same(before.worker.rendezvous, after.worker.rendezvous, 'Rendezvous traffic changed after introduction');
    assert.ok(before.worker.rendezvous?.length >= 4 && before.worker.rendezvous.every(value => value.closed), 'Every hosted introduction must retire');
  }
  if (rtc) {
    hex(report.runtime.dependencies?.lockSha256, 64, 'Missing exact RTC dependency lock');
    assert.ok(report.runtime.dependencies.packages?.length > 0, 'Missing RTC dependency provenance');
    assert.ok(report.runtime.dependencies.packages.every(item => item.path && item.version && item.integrity), 'Incomplete RTC dependency provenance');
    const network = report.rtc;
    same(network?.implementation, 'werift', 'Missing maintained native RTC adapter');
    same(network.version, '0.27.0', 'RTC dependency must match the public adapter pin');
    same(network.candidateSource, 'explicit-loopback-only', 'Do not infer representative interface discovery from a loopback fixture');
    same(network.interfaceEnumeration, 'disabled-by-native-options', 'Record actual native candidate configuration');
    same(network.signalingBoundary, hosted ? 'tendriller-workerd-rendezvous' : 'one-off-in-process-sdp-mailbox', 'The introduction boundary must be explicit');
    same(network.byteBoundary, 'authenticated-reliable-application-frames', 'Byte scope must exclude unobserved wire overhead');
    assert.ok(network.connections?.length >= 4, 'Recovery requires original, reconnect, fresh and returning-peer RTC sessions');
    for (const link of network.connections) {
      same(link.authenticated, true, 'RTC readiness alone is not peer authentication');
      assert.ok(link.peers?.length === 2 && link.peers[0] !== link.peers[1], 'RTC must connect two distinct devices');
      for (const peer of link.peers) hex(peer, 64, 'Missing authenticated device identity');
      same(link.closed, true, 'RTC lifetime must be released');
      same(link.signaling.closed, true, 'Introduction remains open');
      same(link.signaling.sentMessages, 2, 'Signaling must carry one complete offer and answer');
      assert.ok(link.signaling.sentBytes > 0, 'Missing actual SDP bytes');
      assert.ok(link.reliable.sentBytes > 0 && link.reliable.receivedBytes > 0, 'RTC carried no authenticated application frames');
      assert.ok(link.routes?.length === 2, 'Missing observed route states');
      for (const route of link.routes) {
        assert.ok(['direct', 'relay', 'unknown'].includes(route.route), 'Invented RTC route');
        if (route.route === 'direct') assert.ok(['host', 'srflx', 'prflx'].includes(route.localCandidateType) && ['host', 'srflx', 'prflx'].includes(route.remoteCandidateType), 'Direct route requires both observed candidates');
        if (route.route === 'relay') assert.ok(route.localCandidateType === 'relay' || route.remoteCandidateType === 'relay', 'Relay route requires an observed relay candidate');
      }
    }
    const transport = host.transport;
    assert.ok(transport?.after.reliable.sentBytes > transport?.before.reliable.sentBytes &&
      transport?.after.reliable.receivedBytes > transport?.before.reliable.receivedBytes, 'Host outage must carry actual RTC application traffic');
    same(transport.before.signaling, transport.after.signaling, 'Application work changed introduction traffic');
    same(transport.after.signaling.closed, true, 'Host-independent commands require retired signaling');
  }

  const retry = report.lostReply;
  same(retry?.injectedAfterPersistence, true, 'Lost reply must follow durable acceptance');
  nonempty(retry.originalOperationId, 'Missing original operation identity');
  same(retry.retriedOperationId, retry.originalOperationId, 'Retry changed intent identity');
  same(retry.originalReceipt, retry.retriedReceipt, 'Retry changed the original ordered receipt');
  assert.ok(retry.originalReceipt != null, 'Missing original receipt evidence');
  unchangedCounter(retry.orderedRecords, 'Records on exact retry');

  const recovery = report.recovery;
  nonempty(recovery?.previousGeneration, 'Missing predecessor generation');
  nonempty(recovery.selectedGeneration, 'Missing selected successor');
  assert.notEqual(recovery.selectedGeneration, recovery.previousGeneration, 'No takeover happened');
  count(recovery.previousHead, 'Missing previous head');
  count(recovery.adoptedPosition, 'Missing adopted prefix');
  assert.ok(recovery.adoptedPosition < recovery.previousHead, 'Recovery did not abandon a recent suffix');
  same(recovery.sourceRemoved, true, 'The original coordinator remained a recovery source');
  same(recovery.coherentReset, true, 'Application view/outcomes were not replaced coherently');
  same(recovery.recoveredDigest, recovery.freshPeerDigest, 'A fresh peer did not replay the recovered history');
  hex(recovery.recoveredDigest, 64, 'Missing complete replay digest');
  assert.ok(Array.isArray(recovery.inheritedOperationIds) && recovery.inheritedOperationIds.length > 0, 'No adopted operation was checked');
  assert.ok(Array.isArray(recovery.abandonedOperationIds) && recovery.abandonedOperationIds.length > 0, 'No abandoned operation was checked');
  assert.ok(recovery.inheritedOperationIds.every(id => !recovery.abandonedOperationIds.includes(id)), 'An operation cannot be both inherited and abandoned');
  same(recovery.inheritedIdentityPreserved, true, 'Inherited attempts lost their original identity');
  same(recovery.abandonedEvidencePreserved, true, 'Abandoned signed evidence was discarded');

  const old = report.returningBranch;
  same(old?.generationBefore, old.generationAfter, 'The old branch replaced the selected generation');
  same(old.generationAfter, recovery.selectedGeneration, 'The returned peer did not follow selection');
  same(old.digestBefore, old.digestAfter, 'The old suffix changed selected application state');
  hex(old.digestAfter, 64, 'Missing returning-branch digest');
  same(old.oldAttemptReadmitted, false, 'An old attempt silently acquired a new generation');
  same(old.excludedAncestorReadopted, false, 'A later takeover resurrected previously excluded history');
  same(old.thirdGenerationChecked, true, 'Two generations do not prove repeated-takeover ancestry');

  const reapply = report.reapply;
  assert.ok(recovery.abandonedOperationIds.includes(reapply?.originalOperationId), 'Reapplication must identify abandoned intent');
  nonempty(reapply.newOperationId, 'Missing new reapplication identity');
  assert.notEqual(reapply.newOperationId, reapply.originalOperationId, 'Reapplication reused the original identity');
  nonempty(reapply.originalAttemptId, 'Missing original attempt identity');
  nonempty(reapply.newAttemptId, 'Missing new attempt identity');
  assert.notEqual(reapply.newAttemptId, reapply.originalAttemptId, 'Reapplication reused original signed bytes');
  same(reapply.reapplyOf, reapply.originalAttemptId, 'Reapplication lost its signed provenance');
  same(reapply.outcome, 'accepted', 'Reviewed reapplication did not execute');
  same(reapply.currentGuardsChecked, true, 'Reapplication bypassed current domain guards');

  const reopening = report.reopen;
  nonempty(reopening?.identityBefore, 'Missing retained device identity');
  same(reopening.identityAfter, reopening.identityBefore, 'Reopening replaced device identity');
  same(reopening.operationBefore, reopening.operationAfter, 'Reopening lost original operation state');
  assert.ok(reopening.operationBefore != null, 'No operation was inspected after reopening');

  return {
    format: 'peer-generation-consumer-summary/v1',
    profile: report.profile,
    executionManifestDigest: report.executionManifestDigest,
    topology: report.topology,
    source: report.source,
    artifacts: report.artifacts,
    ...(rtc ? { rtc: report.rtc, runtimeDependencies: report.runtime.dependencies } : {}),
    ...(hosted ? { host: report.host, hostedTraffic: host.observations } : {}),
    commandsWithHostBlocked: host.commandsApplied,
    hostRequestsDuringCommands: host.requests.after - host.requests.before,
    hostedApplicationBodyBytes: host.applicationBodyBytes.after,
    recovery: {
      previousGeneration: recovery.previousGeneration,
      selectedGeneration: recovery.selectedGeneration,
      previousHead: recovery.previousHead,
      adoptedPosition: recovery.adoptedPosition,
      inheritedOperationIds: recovery.inheritedOperationIds,
      abandonedOperationIds: recovery.abandonedOperationIds,
    },
    reapplication: reapply,
    limitations: [
      rtc ? `Actual native loopback RTC with ${hosted ? 'Tendriller workerd rendezvous' : 'in-process SDP introduction'}; this is not a deployed-network or browser qualification.`
        : 'Independent packed runtime execution; this is not a deployed-network or browser qualification.',
      hosted ? 'Tendriller HTTP controls and rendezvous ran in workerd with synthetic authenticated accounts; deployed login was not exercised.'
        : 'Host measurements count portable control calls; Tendriller HTTP endpoints were not exercised.',
      rtc ? 'Explicit loopback candidates do not qualify network-interface discovery, Internet routes, provider cost or a universal loss bound.'
        : 'No physical route, provider cost, universal loss bound or unavailable optional service is inferred.',
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { report: { type: 'string' }, output: { type: 'string' } } });
  if (!values.report || !values.output) throw Error('Usage: --report /exact/report.json --output /new/summary.json');
  const raw = readFileSync(values.report);
  const summary = validatePeerGenerationReport(JSON.parse(raw));
  summary.reportSha256 = createHash('sha256').update(raw).digest('hex');
  writeFileSync(values.output, `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Validated ${summary.commandsWithHostBlocked} peer-generation commands with no hosted application traffic.`);
}
