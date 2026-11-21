// Build two real authored views around an explicitly supplied deployment owner.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { rewriteModuleSpecifiers } from './module-specifiers.mjs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { session: { type: 'string' }, core: { type: 'string' },
  deployment: { type: 'string' }, wasm: { type: 'string' }, output: { type: 'string' } } });
for (const name of ['session', 'core', 'deployment', 'output']) assert.ok(values[name], `Required: --${name} /exact/path`);
const here = dirname(fileURLToPath(import.meta.url)), session = resolve(values.session), core = resolve(values.core),
  deployment = resolve(values.deployment), output = resolve(values.output);
const sessionMetadata = JSON.parse(readFileSync(join(session, 'package.json'), 'utf8'));
const coreMetadata = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'));
assert.equal(sessionMetadata.name, '@chronolog/peer-session'); assert.equal(coreMetadata.name, '@tendriller/core');
assert.ok(coreMetadata.exports['./collaboration'], 'The public SDK must export collaboration');
assert.ok(coreMetadata.exports['./browser-owner'] && coreMetadata.exports['./worker-owner'], 'Use the matching maintained browser owner SDK');
assert.ok(sessionMetadata.exports['./sql-browser'], 'Use a public browser SQL archive for the guarded collaboration definition');
const proof = JSON.parse(readFileSync(join(session, 'provenance.json'), 'utf8'));
assert.equal(proof.dirty, false, 'Published graphs require clean public session artifacts');
for (const [name, digest] of Object.entries(proof.sha256)) {
  const file = resolve(session, name), scoped = relative(session, file);
  assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`));
  assert.equal(hash(readFileSync(file)), digest, `Session artifact changed: ${name}`);
}
const customBootstrap = existsSync(join(deployment, 'bootstrap.mjs'));
if (!customBootstrap) {
  assert.ok(values.wasm, 'The supplied bootstrap templates require --wasm /exact/browser-engine');
  const config = JSON.parse(readFileSync(join(deployment, 'configuration.json'), 'utf8'));
  assert.match(config.applicationId, /^[a-f0-9]{64}$/u);
  assert.equal(config.descriptor?.payload?.applicationId, config.applicationId);
  assert.equal(config.schema?.payload?.applicationId, config.applicationId);
  assert.ok(Array.isArray(config.administrators) && config.administrators.length > 0);
  for (const signer of config.administrators) assert.match(signer, /^[a-f0-9]{64}$/u);
  assert.match(config.profileId, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/u);
  assert.equal(config.engineBaseUrl, '../engine/', 'Use the exact engine graph supplied to this builder');
  assert.ok(['https:', 'http:'].includes(new URL(config.page_url).protocol));
}
let engine;
if (values.wasm) {
  const wasm = resolve(values.wasm), manifest = JSON.parse(readFileSync(join(wasm, 'manifest.json'), 'utf8'));
  assert.equal(manifest.toolchain, 'emscripten-4.0.20');
  assert.equal(hash(readFileSync(join(wasm, 'sqlite3.wasm'))), manifest.wasmSha256);
  if (proof.nativeEngine) assert.deepEqual(manifest.nativeManifest, proof.nativeEngine.manifest);
  engine = { manifest, directory: wasm };
}
for (const source of [here, resolve(here, '../page'), resolve(here, '../snippets'),
  resolve(here, '../../share-live-signals/snippets'), session, core, deployment, ...(engine ? [engine.directory] : [])]) {
  const scoped = relative(source, output);
  assert.ok(scoped === '..' || scoped.startsWith(`..${sep}`) || isAbsolute(scoped), 'Output must be outside its source trees');
}
assert.equal(existsSync(output), false, 'Use a new output directory');
mkdirSync(dirname(output), { recursive: true });
// EEXIST is the lock: concurrent builders cannot write into one mixed graph.
mkdirSync(output);
cpSync(join(here, '../page'), output, { recursive: true, dereference: false });
cpSync(session, join(output, 'peer-session'), { recursive: true, dereference: false });
cpSync(core, join(output, 'core'), { recursive: true, dereference: false });
cpSync(deployment, join(output, 'deployment'), { recursive: true, dereference: false });
if (!customBootstrap) for (const name of ['bootstrap.mjs', 'worker.mjs', 'review-workspace.mjs'])
  cpSync(join(here, '../snippets', name), join(output, 'deployment', name));
if (engine) {
  mkdirSync(join(output, 'engine'));
  for (const name of ['manifest.json', 'sqlite3.mjs', 'sqlite3.wasm', 'sqlite3-opfs-async-proxy.js'])
    cpSync(join(engine.directory, name), join(output, 'engine', name), { dereference: false });
}
mkdirSync(join(output, 'domain'));
writeFileSync(join(output, 'domain/review-workspace.mjs'), readFileSync(join(here, '../snippets/review-workspace.mjs')));
writeFileSync(join(output, 'domain/live-run.mjs'), readFileSync(join(here, '../../share-live-signals/snippets/live-run.mjs')));
const packages = new Map([['@chronolog/peer-session', { directory: 'peer-session', metadata: sessionMetadata }],
  ['@tendriller/core', { directory: 'core', metadata: coreMetadata }]]);
for (const path of walk(output).filter(path => path.endsWith('.mjs'))) {
  const original = readFileSync(path, 'utf8');
  const compiled = rewriteModuleSpecifiers(original, specifier => {
    if (!/^@(?:chronolog\/peer-session|tendriller\/core)(?:\/|$)/u.test(specifier)) return specifier;
    const packageName = specifier.startsWith('@chronolog/peer-session') ? '@chronolog/peer-session' : '@tendriller/core';
    const selected = packages.get(packageName), key = specifier === packageName ? '.' : `.${specifier.slice(packageName.length)}`;
    const declaration = selected.metadata.exports[key], exported = typeof declaration === 'string' ? declaration : declaration?.import;
    assert.equal(typeof exported, 'string', `No public browser implementation for ${specifier}`);
    const target = resolve(output, selected.directory, exported);
    const scoped = relative(resolve(output, selected.directory), target);
    assert.ok(scoped && scoped !== '..' && !scoped.startsWith(`..${sep}`) && !isAbsolute(scoped), 'Export must stay inside its package');
    assert.ok(existsSync(target) && statSync(target).isFile(), `Missing exported module for ${specifier}`);
    let local = relative(dirname(path), target).split(sep).join('/');
    if (!local.startsWith('.')) local = `./${local}`;
    return local;
  });
  if (compiled !== original) writeFileSync(path, compiled);
}
const files = walk(output).map(path => ({ path: relative(output, path).split(sep).join('/'), sha256: hash(readFileSync(path)) }));
writeFileSync(join(output, 'specimen-manifest.json'), `${JSON.stringify({ format: 'collaboration-pages/v1',
  entries: ['board.html', 'discussion.html'], session: { version: sessionMetadata.version, source: proof.source, sourceTree: proof.sourceTree },
  core: { version: coreMetadata.version, sourceEvidence: 'provided-public-package-directory' },
  ...(engine ? { wasm: { sha256: engine.manifest.wasmSha256, toolchain: engine.manifest.toolchain } } : {}),
  bootstrap: customBootstrap ? 'supplied deployment module' : 'reference authenticated host bootstrap',
  authority: 'explicit deployment bootstrap; no fixtures or embedded credentials', files }, null, 2)}\n`);
console.log(`Built ${files.length} immutable graph assets with two independently attached views.`);

function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    assert.equal(entry.isSymbolicLink(), false, 'Published graphs cannot contain symlinks');
    const path = join(directory, entry.name); return entry.isDirectory() ? walk(path) : [path];
  });
}
