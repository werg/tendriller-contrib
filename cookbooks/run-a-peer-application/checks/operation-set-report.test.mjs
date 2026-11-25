import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOperationSetReport } from './operation-set-report.mjs';
import { syntheticReport,syntheticRtcReport,syntheticHostedReport,syntheticRelayReport } from './operation-set-report-fixtures.mjs';
for(const fixture of [syntheticReport,syntheticRtcReport,syntheticHostedReport,syntheticRelayReport])test(`schema accepts complete unit fixture ${fixture.name}, not runtime evidence`,()=>{assert.equal(validateOperationSetReport(fixture()).protocol,'chronolog-crdt-v1');});
for(const [name,change] of [
  ['historical format',r=>{r.protocol='retired';}],['build-only',r=>{r.mode='build';}],['failed run',r=>{r.passed=false;}],
  ['unobserved archive',r=>{delete r.artifacts;}],['missing authority archive',r=>{r.artifacts.pop();}],['sibling source',r=>{r.publicBoundary.siblingSourceImports=1;}],
  ['coordinated offline',r=>{r.offline.connectedPeers=[1,1];}],['unmaterialized offline',r=>{r.offline.materialized[0]='pending';}],
  ['duplicate inflation',r=>{r.merge.operations=9;}],['divergent replay',r=>{r.merge.digests[2]='f'.repeat(64);}],['timestamp retry rewrite',r=>{r.retry.signedAfter='b'.repeat(64);}],
  ['fake finality',r=>{r.offline.finality='enabled';}],['same-store retention',r=>{r.retention.evidence[0].payload.storageId=r.retention.authorStorageId;}],
  ['uncaptured read',r=>{r.reactive.capturedAfter='b'.repeat(64);}],['stale live snapshot',r=>{r.reactive.liveSnapshot='b'.repeat(64);}],
  ['identity reset',r=>{r.reload.identityAfter='b'.repeat(64);}],['lost local operation',r=>{r.reload.proposalAfter='b'.repeat(64);}],['content mismatch',r=>{r.content.receivedSha256='b'.repeat(64);}],
])test(`native schema rejects ${name}`,()=>{const report=syntheticReport();change(report);assert.throws(()=>validateOperationSetReport(report));});
for(const [name,change] of [['unclosed signaling',r=>{r.rtc.connections[0].signaling.closed=false;}],['no real frames',r=>{r.rtc.connections[0].reliable.sentBytes=0;}],['unclosed transport',r=>{r.rtc.connections[0].closed=false;}]])test(`RTC schema rejects ${name}`,()=>{const report=syntheticRtcReport();change(report);assert.throws(()=>validateOperationSetReport(report));});
for(const [name,change] of [['host request during local writes',r=>{r.hostOutage.after.requests++;}],['unverified publication',r=>{r.host.publication.exactRetry=false;}],['served bytes differ',r=>{r.host.publication.second.servedCodeDigest='a'.repeat(64);}]])test(`host schema rejects ${name}`,()=>{const report=syntheticHostedReport();change(report);assert.throws(()=>validateOperationSetReport(report));});
for(const [name,change] of [['cleartext private payload',r=>{r.relay.traffic.sockets[0].plaintextMatches=['private'];}],['live lane multiplexed',r=>{r.relay.independentLanes=['reliable'];}],['unreconnected cut',r=>{r.relay.reconnect.reconnected=false;}]])test(`relay schema rejects ${name}`,()=>{const report=syntheticRelayReport();change(report);assert.throws(()=>validateOperationSetReport(report));});
for(const [name,change] of [['missing policy run',r=>{r.finality.pop();}],['finality excluded intent retimestamped',r=>{r.finality[0].retainedTime='101';}],['missing-body proof accepted as final read',r=>{r.finality[1].missingBodyBlockedFinalRead=false;}],['crash changed signed bytes',r=>{r.reload.abruptSignedAfter='b'.repeat(64);}]])test(`native schema rejects ${name}`,()=>{const report=syntheticReport();change(report);assert.throws(()=>validateOperationSetReport(report));});
