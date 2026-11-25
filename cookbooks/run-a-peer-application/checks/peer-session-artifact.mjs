import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Native and browser gates verify and record one installed public artifact. */
export async function verifyPeerSessionArtifact({ installed, archive, allowDirty = false }) {
  const metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.equal(metadata.name, '@chronolog/peer-session');
  const provenanceBytes = await readFile(join(installed, 'provenance.json'));
  const provenance = JSON.parse(provenanceBytes);
  assert.equal(provenance.profile, 'chronolog-crdt-v1');
  assert.equal(provenance.repository, 'werg/chronolog-db');
  assert.deepEqual(metadata.optionalDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependenciesMeta ?? {}, {});
  assert.ok(metadata.exports?.['./webrtc-native'], 'The standard package must expose its native factory');
  assert.equal(provenance.nativeRtc, true, 'The standard package must include native RTC');
  assert.match(provenance.source, /^[a-f0-9]{40}$/u);
  assert.match(provenance.sourceTree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof provenance.dirty, 'boolean');
  if (!allowDirty) assert.equal(provenance.dirty, false, 'Qualification requires a clean-source artifact');
  assert.ok(Object.keys(provenance.sha256 ?? {}).length > 0, 'Package must record content digests');
  assert.ok(Object.keys(provenance.runtimeModules ?? {}).length > 0, 'Package must record its runtime module graph');
  for (const [name, digest] of Object.entries(provenance.sha256)) {
    const path = resolve(installed, name), scoped = relative(installed, path);
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`), 'Package hash path escapes its archive');
    assert.equal(hash(await readFile(path)), digest, `Package content digest mismatch: ${name}`);
  }
  assert.deepEqual(metadata.dependencies, nativeDependencies(metadata, provenance), 'Dependencies must match the recorded native storage implementation');
  return { metadata, provenance, artifact: {
    name: metadata.name, version: metadata.version, sha256: hash(await readFile(archive)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty,
    provenance: { sha256: hash(provenanceBytes), profile: provenance.profile, nativeRtc: provenance.nativeRtc,
      sqlEngines: provenance.sqlEngines, runtimeModules: provenance.runtimeModules, files: provenance.sha256 },
  } };
}

function nativeDependencies(metadata, provenance) {
  assert.equal(provenance.format, 'chronolog-peer-session-package/v1');
  assert.ok(Array.isArray(provenance.runtimeInputs), 'Package must record its runtime inputs');
  const entry = metadata.exports?.['./native']?.import;
  assert.ok(typeof entry === 'string' && entry.startsWith('./'), 'Package must identify its native entry');
  const runtimeInputs = new Set(provenance.runtimeInputs), inputs = new Set(), external = new Set(), visited = new Set();
  const pending = [entry.slice(2)];
  while (pending.length > 0) {
    const name = pending.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    assert.ok(Object.hasOwn(provenance.sha256, name), `Native module must have a content digest: ${name}`);
    assert.ok(Object.hasOwn(provenance.runtimeModules, name), `Missing native module evidence: ${name}`);
    const module = provenance.runtimeModules[name];
    assert.ok(Array.isArray(module.inputs) && Array.isArray(module.imports), `Incomplete native module evidence: ${name}`);
    for (const input of module.inputs) {
      assert.ok(runtimeInputs.has(input), `Native module input missing from runtime inputs: ${input}`);
      inputs.add(input);
    }
    for (const dependency of module.imports) {
      assert.equal(typeof dependency.path, 'string');
      assert.equal(typeof dependency.external, 'boolean');
      if (dependency.external) external.add(dependency.path);
      else pending.push(dependency.path);
    }
  }
  assert.ok(inputs.has('packages/records/src/native.ts'), 'Native entry must include its persistent store');
  const workerSource = 'packages/records/src/native-worker.ts', worker = inputs.has(workerSource);
  assert.equal(runtimeInputs.has(workerSource), worker, 'Native worker evidence must belong to the native entry');
  // Both implementations use the v1 package format. Select by the hashed native
  // closure, never by the dependency map that this check is meant to validate.
  assert.notEqual(worker, external.has('node:sqlite'), 'Unknown or mixed native storage implementation');
  if (worker) assert.ok(external.has('node:worker_threads'), 'Native worker storage must import its worker runtime');
  const dependencies = worker ? { 'better-sqlite3': '13.2.0', werift: '0.27.0' } : { werift: '0.27.0' };
  const wasmEntry = metadata.exports?.['./sql-wasm']?.import;
  const wasmSource = 'packages/materializer-doltlite/src/wasm-node.ts';
  assert.equal(runtimeInputs.has(wasmSource), wasmEntry !== undefined, 'Node WASM capability must match its recorded source graph');
  if (wasmEntry !== undefined) {
    assert.ok(typeof wasmEntry === 'string' && wasmEntry.startsWith('./'));
    const pending = [wasmEntry.slice(2)], visited = new Set(), wasmInputs = new Set(), wasmExternal = new Set();
    while (pending.length) {
      const name = pending.pop(); if (visited.has(name)) continue; visited.add(name);
      assert.ok(Object.hasOwn(provenance.sha256,name), 'Node WASM module must have a content digest');
      const module = provenance.runtimeModules[name]; assert.ok(Array.isArray(module?.inputs) && Array.isArray(module?.imports));
      for(const input of module.inputs) { assert.ok(runtimeInputs.has(input)); wasmInputs.add(input); }
      for(const dependency of module.imports) { assert.equal(typeof dependency.external,'boolean'); if(dependency.external) wasmExternal.add(dependency.path); else pending.push(dependency.path); }
    }
    assert.ok(wasmInputs.has(wasmSource), 'Node WASM entry must contain its actual filesystem adapter');
    assert.ok(wasmExternal.has('fs-native-extensions'), 'Node WASM must identify its native filesystem lock implementation');
    dependencies['fs-native-extensions'] = '1.5.4';
  }
  return dependencies;
}

/** Independently verify the standalone authority archive, not a source alias. */
export async function verifyAuthorityArtifact({ installed, archive, allowDirty = false }) {
  const metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  const bytes = await readFile(join(installed, 'provenance.json')), provenance = JSON.parse(bytes);
  assert.equal(metadata.name, '@chronolog/authority');
  assert.equal(provenance.format, 'chronolog-authority-package/v1');
  assert.equal(provenance.profile, 'chronolog-crdt-v1'); assert.equal(provenance.repository, 'werg/chronolog-db');
  assert.match(provenance.source, /^[a-f0-9]{40}$/u); assert.match(provenance.sourceTree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof provenance.dirty, 'boolean'); if (!allowDirty) assert.equal(provenance.dirty, false);
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) assert.deepEqual(metadata[field] ?? {}, {});
  for (const name of ['.', './control', './metadata', './participant', './publication', './finality']) assert.ok(metadata.exports?.[name]);
  assert.ok(Array.isArray(provenance.inputs) && provenance.inputs.length > 0);
  assert.ok(Object.keys(provenance.runtimeModules ?? {}).length > 0);
  for (const [name,module] of Object.entries(provenance.runtimeModules)) {
    assert.ok(Object.hasOwn(provenance.sha256,name), 'Authority module must have a content digest');
    assert.ok(Array.isArray(module.inputs) && Array.isArray(module.imports));
    for(const input of module.inputs) {
      assert.ok(provenance.inputs.includes(input), 'Authority module input must be recorded');
      assert.ok(!/(?:materializer|peer-session|node:)/u.test(input), 'Authority must remain portable and execution independent');
    }
    assert.ok(module.imports.every(value=>!value.external), 'Standalone authority must not require external runtime modules');
  }
  assert.ok(Object.keys(provenance.sha256 ?? {}).length > 0);
  for (const [name, digest] of Object.entries(provenance.sha256)) {
    const path = resolve(installed, name), scoped = relative(installed, path);
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`));
    assert.equal(hash(await readFile(path)), digest, `Authority content digest mismatch: ${name}`);
  }
  return { name: metadata.name, version: metadata.version, sha256: hash(await readFile(archive)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty,
    provenance: { sha256: hash(bytes), profile: provenance.profile, runtimeModules: provenance.runtimeModules, files: provenance.sha256 } };
}
