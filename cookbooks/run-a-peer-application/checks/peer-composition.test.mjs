import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { assemblePeerComposition } from './peer-composition.mjs';
import { syntheticReport, syntheticRtcReport, syntheticHostedReport, syntheticBrowserReport, syntheticTaskReport, syntheticRelayReport, syntheticBrowserRelayReport } from './peer-generation-report-fixtures.mjs';

// These records only test manifest assembly. No synthetic output is published as evidence.
function fixtures() {
  const reports = [syntheticReport(), syntheticRtcReport(), syntheticBrowserReport(), syntheticTaskReport(), syntheticHostedReport(), syntheticRelayReport(), syntheticBrowserRelayReport()];
  for (const report of reports) {
    report.source = { repository: 'werg/tendriller-contrib', commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: false };
    const sql = ['independent-packed-tasks', 'independent-native-websocket', 'browser-worker-opfs-websocket'].includes(report.topology), rtc = !sql && report.topology !== 'independent-packed-peers';
    const digit = sql ? '1' : rtc ? '2' : '3';
    report.executionManifestDigest = (report.topology === 'independent-packed-tasks' ? 'b' : 'a').repeat(64);
    report.artifacts = [{ name: '@chronolog/peer-session', version: `0.0.0-test-${sql ? 'sql' : rtc ? 'rtc' : 'events'}`,
      sha256: digit.repeat(64), sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false,
      provenance: { sha256: '4'.repeat(64), profile: report.profile, nativeRtc: true,
        sqlEngines: sql ? ['native'] : [], runtimeModules: { 'index.mjs': { inputs: ['packages/peer-session/src/session.ts'], imports: [] } },
        files: { 'index.mjs': '5'.repeat(64), ...(sql ? { 'engine/build/Release/doltlite.node': '6'.repeat(64) } : {}) } } }];
    if (report.host) {
      report.host.artifacts = report.host.artifacts.map((artifact, index) => ({ name: artifact.name, version: '0.1.0-test',
        sha256: String(index + 7).repeat(64), sourceCommit: '9'.repeat(40), sourceTree: '8'.repeat(40), sourceDirty: false }));
      report.host.provenance = { sha256: '7'.repeat(64), storageSchemaRevision: 9,
        files: { 'worker.mjs': '9'.repeat(64), 'peer-generation-provenance.json': '3'.repeat(64) },
        embeddedControl: { repository: 'werg/chronolog-db', source: '2'.repeat(40), sourceTree: '3'.repeat(40), dirty: false,
          profile: report.profile, sha256: '3'.repeat(64), files: Object.fromEntries(
            ['control.mjs', 'control.d.ts', 'participant.mjs', 'participant.d.ts'].map(name => [name, '1'.repeat(64)])) } };
    }
  }
  return reports;
}
const inputs = reports => reports.map((report, index) => ({ path: `gate-${index}/report.json`, bytes: Buffer.from(JSON.stringify(report)) }));

test('one manifest binds all exact clean local sources, artifact variants and observed gates', () => {
  const raw = inputs(fixtures()), manifest = assemblePeerComposition(raw);
  assert.equal(manifest.qualification, 'local-public-artifact-composition');
  assert.equal(manifest.sources.length, 3); assert.equal(manifest.artifacts.length, 5);
  assert.equal(manifest.host.storageSchemaRevision, 9);
  assert.equal(manifest.host.embeddedControl.source, '2'.repeat(40), 'A stable embedded verifier can precede session-only changes');
  assert.equal(manifest.gates['native-events'].reportSha256, createHash('sha256').update(raw[0].bytes).digest('hex'));
  assert.equal(Object.keys(manifest.gates).length, 7);
  assert.ok(manifest.unqualified.some(value => value.includes('Deployed')));
  assert.ok(manifest.unqualified.some(value => value.includes('fresh-agent')));
});

test('composition refuses missing, duplicate, failed and dirty gates', () => {
  assert.throws(() => assemblePeerComposition([]));
  assert.throws(() => assemblePeerComposition(inputs(fixtures().slice(1))), /Missing local composition gates/);
  assert.throws(() => assemblePeerComposition(inputs([...fixtures(), fixtures()[0]])), /Duplicate/);
  for (const mutate of [
    reports => { reports[0].passed = false; },
    reports => { reports[0].artifacts[0].provenance.nativeRtc = false; },
    reports => { delete reports[0].artifacts[0].provenance.nativeRtc; reports[0].artifacts[0].provenance.optionalNativeRtc = true; },
    reports => { reports[0].source.dirty = true; },
    reports => { reports[3].artifacts[0].sourceDirty = true; },
    reports => { reports[4].host.artifacts[0].sourceDirty = true; },
    reports => { reports[4].host.provenance.embeddedControl.dirty = true; },
  ]) {
    const reports = fixtures(); mutate(reports); assert.throws(() => assemblePeerComposition(inputs(reports)));
  }
});

test('composition rejects source, byte, execution and embedded-control mismatches', () => {
  for (const mutate of [
    reports => { reports[1].source.commit = '1'.repeat(40); },
    reports => { reports[1].artifacts[0].sourceTree = '1'.repeat(40); },
    reports => { reports[1].artifacts[0].sha256 = 'f'.repeat(64); },
    reports => { delete reports[1].artifacts[0].provenance.runtimeModules; },
    reports => { reports[2].artifacts[0].provenance.runtimeModules['index.mjs'].inputs.push('packages/peer-generation/src/replica.ts'); },
    reports => { reports[2].executionManifestDigest = 'c'.repeat(64); },
    reports => { delete reports[3].artifacts[0].provenance.files['engine/build/Release/doltlite.node']; },
    reports => { delete reports[4].host.provenance.storageSchemaRevision; },
    reports => { reports[4].host.provenance.embeddedControl.sha256 = 'f'.repeat(64); },
    reports => { delete reports[4].host.provenance.embeddedControl.files['control.mjs']; },
    reports => { reports[0].artifacts[0].provenance.files['../private'] = 'f'.repeat(64); },
    reports => { reports[2].ownership.secondOwnerRefused = false; },
    reports => { reports[5].host.provenance.files['worker.mjs'] = 'f'.repeat(64); },
    reports => { reports[5].relay.traffic.host.relayReceivedBytes = 0; },
  ]) {
    const reports = fixtures(); mutate(reports); assert.throws(() => assemblePeerComposition(inputs(reports)));
  }
});
