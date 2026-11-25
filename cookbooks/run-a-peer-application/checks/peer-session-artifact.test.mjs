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
      profile: 'chronolog-crdt-v1', nativeRtc: true, sqlEngines: [],
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
    const wasmCode="import locks from 'fs-native-extensions'; export { locks };\n",wasmSource='packages/materializer-doltlite/src/wasm-node.ts';
    await writeFile(join(installed,'sql-wasm.mjs'),wasmCode);
    const wasmMetadata={...metadata,dependencies:{...metadata.dependencies,'fs-native-extensions':'1.5.4'},exports:{...metadata.exports,'./sql-wasm':{import:'./sql-wasm.mjs'}}};
    const wasmProof={...provenance,runtimeInputs:[...provenance.runtimeInputs,wasmSource],sha256:{...provenance.sha256,'sql-wasm.mjs':hash(wasmCode)},
      runtimeModules:{...provenance.runtimeModules,'sql-wasm.mjs':{inputs:[wasmSource],imports:[{path:'fs-native-extensions',external:true}]}}};
    await writeEvidence(installed,wasmMetadata,wasmProof);await verifyPeerSessionArtifact({installed,archive});
    for(const change of [p=>{p.runtimeModules['sql-wasm.mjs'].imports=[];},p=>{p.runtimeModules['sql-wasm.mjs'].inputs=[];},p=>{delete p.sha256['sql-wasm.mjs'];}]){
      const invalid=structuredClone(wasmProof);change(invalid);await writeEvidence(installed,wasmMetadata,invalid);await assert.rejects(verifyPeerSessionArtifact({installed,archive}));
    }
    await writeEvidence(installed,metadata,provenance);
    await writeFile(join(installations[1].installed, 'chunks/data.mjs'), 'changed installed bytes');
    await assert.rejects(verifyPeerSessionArtifact({ installed: installations[1].installed, archive }), /Package content digest mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

// Standalone authority archives must retain their own exact byte/source identity.
test('authority verifier rejects dirty, external-runtime, path-escaping and altered packed evidence', async () => {
  const { verifyAuthorityArtifact } = await import('./peer-session-artifact.mjs');
  const temporary = new URL('../../../test-results/', import.meta.url); await mkdir(temporary,{recursive:true});
  const root = await mkdtemp(join(fileURLToPath(temporary),'authority-artifact-'));
  try {
    const archive=join(root,'authority.tgz');await writeFile(archive,'synthetic unit archive');
    const names=['index','control','metadata','participant','publication','finality'];
    const metadata={name:'@chronolog/authority',version:'0.0.0-test',exports:Object.fromEntries(names.map(name=>[name==='index'?'.':`./${name}`,{import:`./${name}.mjs`}]))};
    const files={'package.json':JSON.stringify(metadata),...Object.fromEntries(names.map(name=>[`${name}.mjs`,'export const synthetic = true;']))};
    for(const [name,bytes]of Object.entries(files))await writeFile(join(root,name),bytes);
    const proof={format:'chronolog-authority-package/v1',profile:'chronolog-crdt-v1',repository:'werg/chronolog-db',source:'a'.repeat(40),sourceTree:'b'.repeat(40),dirty:false,
      inputs:['packages/authority/src/index.ts'],runtimeModules:Object.fromEntries(names.map(name=>[`${name}.mjs`,{inputs:['packages/authority/src/index.ts'],imports:[]} ])),sha256:Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,hash(bytes)]))};
    const write=async value=>writeFile(join(root,'provenance.json'),JSON.stringify(value));await write(proof);
    const observed=await verifyAuthorityArtifact({installed:root,archive});assert.equal(observed.name,metadata.name);assert.equal(observed.sha256,hash('synthetic unit archive'));
    for(const change of [p=>{p.dirty=true;},p=>{p.profile='retired';},p=>{p.sha256['../escape']='a'.repeat(64);},p=>{p.runtimeModules['index.mjs'].imports=[{path:'node:fs',external:true}];},p=>{p.runtimeModules['index.mjs'].inputs=['packages/peer-session/src/session.ts'];}]){
      const invalid=structuredClone(proof);change(invalid);await write(invalid);await assert.rejects(verifyAuthorityArtifact({installed:root,archive}));
    }
    await write(proof);await writeFile(join(root,'index.mjs'),'changed authority bytes');await assert.rejects(verifyAuthorityArtifact({installed:root,archive}),/content digest mismatch/);
  }finally{await rm(root,{recursive:true,force:true});}
});
