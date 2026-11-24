import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { verifyPeerSessionArtifact } from './peer-session-artifact.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Synthetic installed bytes test report identity and package guards, not runtime qualification.
for (const storage of ['node:sqlite', 'worker']) test(`native and browser evidence preserves the ${storage} package contract`, async () => {
  const temporary = new URL('../../../test-results/', import.meta.url);
  await mkdir(temporary, { recursive: true });
  const root = await mkdtemp(join(fileURLToPath(temporary), 'peer-artifact-'));
  try {
    const archive = join(root, 'session.tgz'), archiveBytes = Buffer.from('exact synthetic archive');
    const worker = storage === 'worker', storeModule = 'chunks/native-store.mjs', workerSource = 'packages/records/src/native-worker.ts';
    const metadata = { name: '@chronolog/peer-session', version: '0.0.0-test',
      dependencies: worker ? { 'better-sqlite3': '13.2.0', werift: '0.27.0' } : { werift: '0.27.0' },
      exports: { '.': { import: './index.mjs' }, './native': { import: './native.mjs' }, './webrtc-native': { import: './webrtc-native.mjs' } } };
    const files = {
      'index.mjs': "export const data = () => import('./chunks/data.mjs');\n",
      'native.mjs': "export { store } from './chunks/native-store.mjs';\n",
      'webrtc-native.mjs': "export { RTCPeerConnection } from 'werift';\n",
      'chunks/data.mjs': 'export const database = true;\n',
      [storeModule]: worker ? [
        "import { createRequire } from 'node:module';",
        "import { Worker } from 'node:worker_threads';",
        "const nativeWorkerSource = 'const { workerData } = require(\"node:worker_threads\"); const Database = require(workerData.sqliteModule); new Database(workerData.path);';",
        "export const store = path => new Worker(nativeWorkerSource, { eval: true, workerData: { path, sqliteModule: createRequire(import.meta.url).resolve('better-sqlite3') } });",
      ].join('\n') : "import { DatabaseSync } from 'node:sqlite';\nexport const store = path => new DatabaseSync(path);\n",
    };
    // Like esbuild output, internal import paths are package-relative, and the
    // persistent store lives in a shared chunk rather than the native entry.
    const runtimeModules = {
      'index.mjs': { inputs: ['packages/peer-session/src/session.ts'], imports: [{ path: 'chunks/data.mjs', kind: 'dynamic-import', external: false }] },
      'native.mjs': { inputs: ['packages/peer-session/src/native.ts'], imports: [{ path: storeModule, kind: 'import-statement', external: false }] },
      'webrtc-native.mjs': { inputs: ['packages/peer-session/src/webrtc-native.ts'], imports: [{ path: 'werift', kind: 'import-statement', external: true }] },
      'chunks/data.mjs': { inputs: ['packages/peer-session/src/application-data.ts'], imports: [] },
      [storeModule]: { inputs: ['packages/records/src/native.ts', ...(worker ? [workerSource] : [])],
        imports: (worker ? ['node:module', 'node:worker_threads'] : ['node:sqlite']).map(path => ({ path, kind: 'import-statement', external: true })) },
    };
    const provenance = { format: 'chronolog-peer-session-package/v1', repository: 'werg/chronolog-db',
      source: 'd'.repeat(40), sourceTree: 'e'.repeat(40), dirty: false,
      profile: 'peer-generation-v1', nativeRtc: true, sqlEngines: [],
      sha256: Object.fromEntries(Object.entries({ 'package.json': JSON.stringify(metadata), ...files }).map(([path, bytes]) => [path, hash(bytes)])),
      runtimeInputs: [...new Set(Object.values(runtimeModules).flatMap(module => module.inputs))].sort(), runtimeModules };
    const writeEvidence = async (installed, manifest = metadata, evidence = provenance) => {
      const packageBytes = JSON.stringify(manifest);
      await Promise.all([
        writeFile(join(installed, 'package.json'), packageBytes),
        writeFile(join(installed, 'provenance.json'), JSON.stringify({ ...evidence,
          sha256: { ...evidence.sha256, 'package.json': hash(packageBytes) } })),
      ]);
    };
    const provenanceBytes = Buffer.from(JSON.stringify(provenance));
    await writeFile(archive, archiveBytes);
    const installations = await Promise.all(['native', 'browser'].map(async name => {
      const installed = join(root, name); await mkdir(join(installed, 'chunks'), { recursive: true });
      await Promise.all(Object.entries(files).map(([path, bytes]) => writeFile(join(installed, path), bytes)));
      await writeEvidence(installed);
      return { installed, evidence: await verifyPeerSessionArtifact({ installed, archive }) };
    }));
    const [native, browser] = installations.map(value => value.evidence.artifact);
    assert.deepEqual(native, browser, 'The same archive must have one identity in every gate');
    assert.deepEqual(native.provenance.runtimeModules, provenance.runtimeModules, 'Native evidence must retain the browser lazy-load proof');
    assert.deepEqual(native.provenance.files, provenance.sha256);
    assert.equal(native.provenance.sha256, hash(provenanceBytes));
    assert.equal(native.sha256, hash(archiveBytes));
    const installed = installations[0].installed;
    for (const bad of [
      { dependencies: {} },
      { dependencies: worker ? { werift: '0.27.0' } : { 'better-sqlite3': '13.2.0', werift: '0.27.0' } },
      { dependencies: { 'better-sqlite3': '13.2.0' } },
      ...(worker ? [{ dependencies: { ...metadata.dependencies, 'better-sqlite3': '^13.2.0' } }] : []),
      { dependencies: { ...metadata.dependencies, werift: '^0.27.0' } },
      { dependencies: { ...metadata.dependencies, unexpected: '1.0.0' } },
      { peerDependencies: { werift: '0.27.0' } },
      { optionalDependencies: { werift: '0.27.0' } },
      { exports: {} },
      { exports: { ...metadata.exports, './native': undefined } },
    ]) {
      // Rehash the altered manifest so failures exercise the contract, not a stale digest.
      await writeEvidence(installed, { ...metadata, ...bad });
      await assert.rejects(verifyPeerSessionArtifact({ installed, archive }));
    }
    for (const [name, change, message] of [
      ['missing runtime inputs', evidence => { delete evidence.runtimeInputs; }, /runtime inputs/u],
      ['unhashed native chunk', evidence => { delete evidence.sha256[storeModule]; }, /content digest/u],
      ['missing native module', evidence => { delete evidence.runtimeModules['native.mjs']; }, /Missing native module/u],
      ['missing persistent store', evidence => { evidence.runtimeModules[storeModule].inputs = []; }, /persistent store/u],
      ['input missing from source list', evidence => {
        evidence.runtimeInputs = evidence.runtimeInputs.filter(input => input !== (worker ? workerSource : 'packages/records/src/native.ts'));
      }, /input missing from runtime inputs/u],
      ['worker outside native closure', evidence => {
        evidence.runtimeModules[storeModule].inputs = evidence.runtimeModules[storeModule].inputs.filter(input => input !== workerSource);
        evidence.runtimeModules['index.mjs'].inputs.push(workerSource);
        if (!evidence.runtimeInputs.includes(workerSource)) evidence.runtimeInputs.push(workerSource);
      }, /worker evidence must belong/u],
      ['unknown storage', evidence => {
        evidence.runtimeModules[storeModule].inputs = evidence.runtimeModules[storeModule].inputs.filter(input => input !== workerSource);
        evidence.runtimeInputs = evidence.runtimeInputs.filter(input => input !== workerSource);
        evidence.runtimeModules[storeModule].imports = [];
      }, /Unknown or mixed/u],
      ['mixed storage', evidence => {
        if (!worker) { evidence.runtimeModules[storeModule].inputs.push(workerSource); evidence.runtimeInputs.push(workerSource); }
        evidence.runtimeModules[storeModule].imports.push({ path: worker ? 'node:sqlite' : 'node:worker_threads', kind: 'import-statement', external: true });
      }, /Unknown or mixed/u],
      ...(worker ? [['missing worker runtime', evidence => {
        evidence.runtimeModules[storeModule].imports = evidence.runtimeModules[storeModule].imports.filter(item => item.path !== 'node:worker_threads');
      }, /must import its worker runtime/u]] : []),
    ]) {
      const evidence = structuredClone(provenance); change(evidence);
      await writeEvidence(installed, metadata, evidence);
      await assert.rejects(verifyPeerSessionArtifact({ installed, archive }), message, name);
    }
    await writeFile(join(installations[1].installed, 'chunks/data.mjs'), 'changed installed bytes');
    await assert.rejects(verifyPeerSessionArtifact({ installed: installations[1].installed, archive }), /Package content digest mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
