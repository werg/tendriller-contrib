// Freeze real authored views and consume only exact public archives plus pinned
// browser test tools. Browser failures remain failures in the retained report.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { verifyPeerSessionArtifact } from '../../run-a-peer-application/checks/peer-session-artifact.mjs';
import { validateBrowserReport } from './browser-report.mjs';

const { values } = parseArgs({ options: { 'session-artifact': { type: 'string' }, 'core-artifact': { type: 'string' },
  'core-provenance': { type: 'string' }, wasm: { type: 'string' }, output: { type: 'string' }, chromium: { type: 'string' },
  'allow-dirty': { type: 'boolean', default: false } } });
for (const name of ['session-artifact', 'core-artifact', 'core-provenance', 'wasm', 'output']) assert.ok(values[name], `Required --${name} /exact/path`);
const here = import.meta.dirname, root = resolve(here, '../../..'), output = resolve(values.output), consumer = join(output, 'consumer');
try { await stat(output); throw Error('Use a new evidence directory'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { format: 'tendriller-collaboration-browser/v1', passed: false, error: null,
  source: { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
    dirty: Boolean(git('status', '--porcelain', '--untracked-files=all')) }, artifacts: [], fixtures: [], scenarios: [],
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  claims: { physicalDeviceQualified: false, deployedHostQualified: false, conversationalResumeQualified: false, exactlyOnceExternalEffects: false } };
await mkdir(consumer, { recursive: true }); const reportPath = join(output, 'report.json');
try {
  if (!values['allow-dirty']) assert.equal(report.source.dirty, false, 'Commit the authored views before qualification');
  const sessionArchive = resolve(values['session-artifact']), coreArchive = resolve(values['core-artifact']);
  const coreBytes = await readFile(resolve(values['core-provenance'])), coreProof = JSON.parse(coreBytes);
  assert.equal(coreProof.repository, 'werg/tendriller');
  const sdk = coreProof.artifacts.find(value => value.name === '@tendriller/core');
  assert.ok(sdk); assert.equal(hash(await readFile(coreArchive)), sdk.sha256);
  if (!values['allow-dirty']) assert.equal(coreProof.dirty, false);
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module', name: 'independent-collaboration-browser-consumer' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', sessionArchive, coreArchive,
    'playwright@1.65.0', 'esbuild@0.28.2'], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: join(output, 'npm-cache') } });
  const session = await verifyPeerSessionArtifact({ installed: join(consumer, 'node_modules/@chronolog/peer-session'),
    archive: sessionArchive, allowDirty: values['allow-dirty'] });
  assert.ok(session.metadata.exports['./sql-browser']);
  const core = JSON.parse(await readFile(join(consumer, 'node_modules/@tendriller/core/package.json'), 'utf8'));
  assert.ok(core.exports['./collaboration/browser']); assert.ok(core.exports['./collaboration/worker']);
  assert.equal(core.version, sdk.version);
  report.artifacts = [session.artifact, { name: core.name, version: core.version, sha256: sdk.sha256,
    sourceCommit: coreProof.source, sourceTree: coreProof.sourceTree, sourceDirty: coreProof.dirty, provenanceSha256: hash(coreBytes) }];
  const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(tree.dependencies).sort(), ['@chronolog/peer-session', '@tendriller/core', 'esbuild', 'playwright']);
  assert.equal(tree.dependencies.playwright.version, '1.65.0'); assert.equal(tree.dependencies.esbuild.version, '0.28.2');
  report.runtime.dependencies = { playwright: tree.dependencies.playwright.version, esbuild: tree.dependencies.esbuild.version,
    lockSha256: hash(await readFile(join(consumer, 'package-lock.json'))) };
  const manifest = JSON.parse(await readFile(join(resolve(values.wasm), 'manifest.json'), 'utf8'));
  assert.equal(manifest.toolchain, 'emscripten-4.0.20');
  assert.deepEqual(manifest.nativeManifest, session.provenance.nativeEngine.manifest, 'Native/browser engine build profiles must agree');
  const wasmBytes = await readFile(join(resolve(values.wasm), 'sqlite3.wasm'));
  assert.equal(hash(wasmBytes), manifest.wasmSha256);
  report.wasm = { toolchain: manifest.toolchain, sha256: hash(wasmBytes), manifest, assets: [] };
  await mkdir(join(consumer, 'engine'));
  for (const name of ['manifest.json', 'sqlite3.mjs', 'sqlite3.wasm', 'sqlite3-opfs-async-proxy.js']) {
    const bytes = await readFile(join(resolve(values.wasm), name)); await writeFile(join(consumer, 'engine', name), bytes);
    report.wasm.assets.push({ path: name, sha256: hash(bytes) });
  }
  const fixtures = [
    ['browser-consumer.mjs', join(here, 'browser-consumer.mjs')],
    ['source/page/deployment/bootstrap.mjs', join(here, 'browser-bootstrap.mjs')],
    ['source/page/deployment/worker.mjs', join(here, 'browser-worker.mjs')],
    ['source/page/domain/review-workspace.mjs', join(here, '../snippets/review-workspace.mjs')],
    ['source/page/domain/live-run.mjs', join(here, '../../share-live-signals/snippets/live-run.mjs')],
    ...['app.mjs', 'board.html', 'discussion.html', 'style.css'].map(name => [`source/page/${name}`, join(here, '../page', name)]),
  ];
  const allowed = new Set(['@chronolog/peer-session', '@chronolog/peer-session/worker', '@chronolog/peer-session/sql',
    '@chronolog/peer-session/sql-browser', '@tendriller/core/collaboration', '@tendriller/core/collaboration/browser',
    '@tendriller/core/collaboration/worker', './deployment/bootstrap.mjs', './domain/live-run.mjs', '../domain/review-workspace.mjs',
    'esbuild', 'playwright']);
  const imports = new Set();
  for (const [destination, source] of fixtures) {
    const bytes = await readFile(source), sourcePath = relative(root, source).split(sep).join('/');
    if (!report.source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${report.source.commit}:${sourcePath}`], { cwd: root })));
    for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/gu)) {
      assert.ok(match[1].startsWith('node:') || allowed.has(match[1]), `Non-public browser consumer import: ${match[1]}`);
      if (match[1].startsWith('@')) imports.add(match[1]);
    }
    const path = join(consumer, destination); await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes, { flag: 'wx' });
    report.fixtures.push({ path: sourcePath, sha256: hash(bytes) });
  }
  report.publicBoundary = { imports: [...imports].sort(), siblingSourceImports: 0, applicationRetryQueues: 0, applicationOwnerProtocols: 0 };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  // Each of the two real-SQL journeys now includes 11 requests and 19 messages.
  // Per-action deadlines remain 30s; this bounds their complete combined work.
  const result = spawnSync(process.execPath, [join(consumer, 'browser-consumer.mjs'), reportPath], { cwd: consumer, stdio: 'inherit', timeout: 720_000,
    env: { ...process.env, ...(values.chromium ? { COLLABORATION_CHROMIUM: resolve(values.chromium) } : {}) } });
  if (result.error) throw result.error;
  assert.equal(result.signal, null); assert.equal(result.status, 0, 'Authored browser consumer failed');
  const bytes = await readFile(reportPath), summary = validateBrowserReport(JSON.parse(bytes), { allowDirty: values['allow-dirty'] });
  summary.reportSha256 = hash(bytes); summary.qualification = values['allow-dirty'] ? 'development' : 'clean-local-browser-composition';
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Authored browser views passed: ${reportPath}`);
} catch (error) {
  let observed = report;
  try { observed = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* Installation did not finish. */ }
  observed.passed = false;
  const failure = error.stack ?? String(error);
  if (observed.error) observed.runnerError = failure;
  else observed.error = failure;
  await writeFile(reportPath, `${JSON.stringify(observed, null, 2)}\n`); throw error;
}
