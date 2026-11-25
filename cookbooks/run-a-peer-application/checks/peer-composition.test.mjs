import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { assemblePeerComposition } from './peer-composition.mjs';
import { syntheticReport,syntheticRtcReport,syntheticHostedReport,syntheticBrowserReport,syntheticTaskReport,syntheticRelayReport,syntheticBrowserRelayReport } from './operation-set-report-fixtures.mjs';
// Only unit-test records. No synthetic output is saved as qualification evidence.
const fixtures=()=>[syntheticReport(),syntheticRtcReport(),syntheticBrowserReport(),syntheticTaskReport(),syntheticHostedReport(),syntheticRelayReport(),syntheticBrowserRelayReport()];
const inputs=reports=>reports.map((report,index)=>({path:`synthetic-${index}.json`,bytes:Buffer.from(JSON.stringify(report))}));
test('composition binds every raw report byte and exact public source graph',()=>{const raw=inputs(fixtures()),manifest=assemblePeerComposition(raw);assert.equal(manifest.profile,'chronolog-crdt-v1');assert.equal(Object.keys(manifest.gates).length,7);assert.equal(manifest.controlBoundary,'@chronolog/authority');assert.ok(manifest.artifacts.some(value=>value.name==='@chronolog/authority'));for(const gate of Object.values(manifest.gates)){const input=raw.find(value=>value.path===gate.report);assert.equal(gate.reportSha256,createHash('sha256').update(input.bytes).digest('hex'));}});
test('composition requires all independently executed gates and rejects duplicates',()=>{const reports=fixtures();assert.throws(()=>assemblePeerComposition(inputs(reports.slice(0,-1))),/Missing local composition gates/);assert.throws(()=>assemblePeerComposition(inputs([...reports,reports[0]])),/Duplicate composition gate/);});
for(const [name,change] of [
 ['dirty consumer',r=>{r[0].source.dirty=true;}],['dirty session',r=>{r[0].artifacts[0].sourceDirty=true;}],
 ['mixed source',r=>{r[1].source.commit='f'.repeat(40);}],['mixed archive bytes',r=>{r[1].artifacts[0].sha256='f'.repeat(64);}],
 ['wrong protocol',r=>{r[0].protocol='retired';}],['mixed event manifest',r=>{r[1].executionManifestDigest='f'.repeat(64);}],
 ['unqualified native engine',r=>{delete r[3].artifacts[0].provenance.files['engine/build/Release/doltlite.node'];}],
 ['embedded source differs',r=>{r[4].host.provenance.embeddedAuthority.source='f'.repeat(40);}],
 ['embedded verifier bytes differ',r=>{r[4].host.provenance.embeddedAuthority.files['index.mjs']='f'.repeat(64);}],
 ['host digest not bound',r=>{r[4].host.provenance.files['authority-provenance.json']='f'.repeat(64);}],
 ['missing authority archive',r=>{r[0].artifacts.pop();}],
])test(`composition rejects ${name}`,()=>{const reports=fixtures();change(reports);assert.throws(()=>assemblePeerComposition(inputs(reports)));});
