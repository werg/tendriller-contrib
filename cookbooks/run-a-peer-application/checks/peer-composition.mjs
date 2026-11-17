// Bind independently executed public consumers to one exact local composition.
// A missing, failed, dirty or mismatched gate cannot produce a release manifest.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validatePeerGenerationReport } from './peer-generation-report.mjs';
import { validateBrowserPeerReport } from './peer-generation-browser-report.mjs';
import { validatePeerTaskReport } from './peer-generation-task-report.mjs';

const required = ['native-events', 'native-rtc', 'browser-worker', 'native-sql', 'hosted-participant'];
const digest = value => createHash('sha256').update(value).digest('hex');
const hex = (value, length, name) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'), name);

/** Each input retains the original raw report bytes, not a prevalidated summary. */
export function assemblePeerComposition(inputs) {
  assert.ok(Array.isArray(inputs) && inputs.length > 0, 'Supply actual raw reports');
  const gates = new Map(), packages = new Map(), sources = new Map(), profile = 'peer-generation-v1';
  let eventManifest, sqlManifest, sqlEngine, hostedProvenance, browser;
  const source = (repository, commit, tree, dirty) => {
    hex(commit, 40, `Missing ${repository} commit`); hex(tree, 40, `Missing ${repository} tree`);
    assert.equal(dirty, false, `${repository} is dirty; development evidence cannot qualify a composition`);
    const value = { repository, commit, tree, dirty };
    if (sources.has(repository)) assert.deepEqual(sources.get(repository), value, `Mixed source revisions for ${repository}`);
    else sources.set(repository, value);
  };
  const addPackage = (artifact, owner, requireProvenance) => {
    source(owner, artifact.sourceCommit, artifact.sourceTree, artifact.sourceDirty);
    assert.ok(typeof artifact.version === 'string' && artifact.version.length > 0, 'Missing exact package version');
    hex(artifact.sha256, 64, 'Missing archive digest');
    if (requireProvenance) {
      const proof = artifact.provenance;
      hex(proof?.sha256, 64, 'Missing installed package provenance digest');
      assert.equal(proof.profile, profile, 'The packed profile differs from the exercised one');
      assert.equal(typeof proof.optionalNativeRtc, 'boolean');
      assert.ok(Array.isArray(proof.sqlEngines));
      assert.ok(Object.keys(proof.files ?? {}).length > 0, 'Missing verified package content digests');
      for (const [path, sha256] of Object.entries(proof.files)) {
        assert.ok(path && !path.startsWith('/') && !path.split('/').includes('..'), 'Invalid package content path');
        hex(sha256, 64, `Missing file digest: ${path}`);
      }
    }
    const key = `${artifact.name}@${artifact.version}`;
    if (packages.has(key)) assert.deepEqual(packages.get(key), artifact, `Same package version has different bytes: ${key}`);
    else packages.set(key, artifact);
  };
  for (const input of inputs) {
    assert.ok(typeof input.path === 'string' && input.path.length > 0, 'Missing raw report location');
    const raw = Buffer.from(input.bytes), report = JSON.parse(raw);
    const topology = report.topology;
    let gate, summary;
    if (topology === 'browser-worker-opfs-native-rtc') {
      gate = 'browser-worker'; summary = validateBrowserPeerReport(report);
      browser = { implementation: report.browser.implementation, version: report.browser.version,
        storage: report.browser.storage, transportOwner: report.browser.transportOwner };
    } else if (topology === 'independent-packed-tasks') {
      gate = 'native-sql'; summary = validatePeerTaskReport(report);
      sqlManifest = report.executionManifestDigest; sqlEngine = report.sqlEngine;
    } else {
      summary = validatePeerGenerationReport(report);
      gate = report.hostOutage.boundary === 'tendriller-workerd-http' ? 'hosted-participant'
        : topology === 'independent-native-rtc' ? 'native-rtc' : 'native-events';
    }
    assert.equal(gates.has(gate), false, `Duplicate composition gate: ${gate}`);
    source('werg/tendriller-contrib', report.source.commit, report.source.tree, report.source.dirty);
    assert.equal(report.profile, profile);
    for (const artifact of report.artifacts) addPackage(artifact, 'werg/chronolog-db', true);
    const session = report.artifacts.find(value => value.name === '@chronolog/peer-session');
    assert.ok(session, 'Missing session archive');
    if (gate === 'native-sql') {
      assert.ok(session.provenance.sqlEngines.includes('native'), 'The SQL gate did not use a native engine archive');
      hex(session.provenance.files['engine/build/Release/doltlite.node'], 64, 'Missing qualified native engine binary digest');
    } else {
      if (eventManifest !== undefined) assert.equal(report.executionManifestDigest, eventManifest, 'Event execution manifests differ across consumers');
      eventManifest = report.executionManifestDigest;
      if (gate !== 'native-events') assert.equal(session.provenance.optionalNativeRtc, true, 'RTC gate requires the emitted native transport');
    }
    if (gate === 'hosted-participant') {
      for (const artifact of report.host.artifacts) addPackage(artifact, 'werg/tendriller', false);
      hostedProvenance = report.host.provenance;
      hex(hostedProvenance?.sha256, 64, 'Missing installed host provenance digest');
      assert.ok(Number.isSafeInteger(hostedProvenance.storageSchemaRevision) && hostedProvenance.storageSchemaRevision > 0,
        'Missing host storage schema revision');
      const embedded = hostedProvenance.embeddedControl;
      assert.equal(embedded?.repository, 'werg/chronolog-db'); assert.equal(embedded.profile, profile);
      assert.equal(embedded.dirty, false, 'The embedded verifier is dirty');
      hex(embedded.source, 40, 'Missing embedded verifier commit'); hex(embedded.sourceTree, 40, 'Missing embedded verifier tree');
      hex(embedded.sha256, 64, 'Missing embedded verifier provenance digest');
      assert.equal(hostedProvenance.files?.['peer-generation-provenance.json'], embedded.sha256,
        'The host archive does not bind this embedded verifier');
      for (const name of ['control.mjs', 'control.d.ts', 'participant.mjs', 'participant.d.ts']) hex(embedded.files?.[name], 64, `Missing embedded verifier ${name}`);
    }
    gates.set(gate, { report: input.path, reportSha256: digest(raw), topology, runtime: report.runtime,
      executionManifestDigest: report.executionManifestDigest, artifacts: report.artifacts.map(value => value.sha256),
      summary });
  }
  assert.deepEqual([...gates.keys()].sort(), [...required].sort(), 'Missing local composition gates');
  return { format: 'peer-application-composition/v1', qualification: 'local-public-artifact-composition',
    profile, participantProtocol: 'chronolog-participant-v1', sources: [...sources.values()].sort((a, b) => a.repository.localeCompare(b.repository)),
    artifacts: [...packages.values()].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)),
    execution: { events: eventManifest, sql: sqlManifest, nativeEngine: sqlEngine },
    host: hostedProvenance, browser,
    gates: Object.fromEntries(required.map(name => [name, gates.get(name)])),
    unqualified: ['Deployed authentication and controls, Internet/home/mobile/restrictive networks and TURN.',
      'Sustained suspension, quota pressure, eviction, device/provider cost and a production recovery envelope.',
      'Browser SQL/WASM equivalence and optional archive, protected effects or stronger settlement.',
      'An unassisted fresh-agent usability study for these exact artifacts; scripted consumers do not supply one.'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { report: { type: 'string', multiple: true }, output: { type: 'string' } } });
  if (!values.report?.length || !values.output) throw Error('Usage: --report /exact/report.json (repeat for all five gates) --output /new/composition.json');
  const inputs = await Promise.all(values.report.map(async path => ({ path, bytes: await readFile(resolve(path)) })));
  const manifest = assemblePeerComposition(inputs);
  await writeFile(resolve(values.output), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  console.log(`Recorded the exact local public composition in ${basename(values.output)}; deployed qualification remains separate.`);
}
