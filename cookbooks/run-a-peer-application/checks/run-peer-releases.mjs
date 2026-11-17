// Freeze an independent public consumer, bundle its page, then use real workerd.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validatePeerReleaseReport } from './peer-release-report.mjs';

const { values } = parseArgs({ options: { artifact: { type: 'string' }, artifacts: { type: 'string' }, output: { type: 'string' },
  'browser-executable': { type: 'string' } } });
if (!values.artifact || !values.artifacts || !values.output) throw Error('Usage: --artifact /exact/session.tgz --artifacts /exact/tendriller-dist --output /new/evidence [--browser-executable /supported/chromium]');
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../../..');
const output = resolve(values.output), consumer = join(output, 'consumer'), artifact = resolve(values.artifact), hostArtifacts = resolve(values.artifacts);
try { await stat(output); throw Error('Use a new evidence directory'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(consumer, { recursive: true });
const reportPath = join(output, 'report.json');
const report = { format: 'peer-release-consumer/v1', profile: 'chronolog-release-v1', mode: 'runtime',
  topology: 'independent-packed-workerd-browser', passed: false,
  source: { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
    dirty: git('status', '--porcelain', '--untracked-files=all').length > 0 },
  runtime: { node: process.version, platform: process.platform, architecture: process.arch }, artifacts: [], fixtures: [], error: null };
try {
  assert.equal(report.source.dirty, false, 'Release acceptance requires a clean consumer checkout');
  const names = await readdir(hostArtifacts), sdkName = names.filter(value => /^tendriller-sdk-.+\.tgz$/u.test(value));
  assert.equal(sdkName.length, 1); const sdk = join(hostArtifacts, sdkName[0]);
  const hostProvenance = JSON.parse(await readFile(join(hostArtifacts, 'provenance.json'), 'utf8'));
  assert.equal(hostProvenance.dirty, false);
  const sdkEvidence = hostProvenance.artifacts.find(value => value.file === sdkName[0]);
  assert.equal(hash(await readFile(sdk)), sdkEvidence.sha256);
  report.artifacts.push({ name: '@tendriller/core', version: sdkEvidence.version, sha256: sdkEvidence.sha256,
    sourceCommit: hostProvenance.source, sourceTree: hostProvenance.sourceTree, sourceDirty: hostProvenance.dirty });
  const fixtures = [
    ...['peer-release-consumer.mjs', 'peer-release-browser.mjs', 'peer-release-assets.mjs'].map(name => [name, join(here, name)]),
    ['peer-conversation.mjs', join(here, '../snippets/peer-conversation.mjs')],
    ...['peer-release-page.mjs', 'peer-release-store.mjs'].map(name => [name, join(here, '../snippets', name)]),
  ];
  const imports = new Set(), relativeImports = new Set(fixtures.map(([name]) => `./${name}`));
  relativeImports.add('./lazy.mjs');
  for (const [name, path] of fixtures) {
    const bytes = await readFile(path), sourcePath = relative(root, path).split(sep).join('/');
    assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${report.source.commit}:${sourcePath}`], { cwd: root })));
    for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || relativeImports.has(specifier) || ['@chronolog/peer-session', '@chronolog/peer-session/native',
        '@chronolog/peer-session/releases', '@tendriller/core', 'playwright'].includes(specifier), `Non-public release consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
    }
    report.fixtures.push({ path: sourcePath, sha256: hash(bytes) }); await writeFile(join(consumer, name), bytes, { flag: 'wx' });
  }
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-signed-release-consumer', private: true, type: 'module',
    dependencies: { '@chronolog/peer-session': `file:${artifact}`, '@tendriller/core': `file:${sdk}`, esbuild: '0.28.2', playwright: '1.65.0' } }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: consumer, stdio: 'inherit', env: { ...process.env, npm_config_cache: join(output, 'npm-cache') } });
  const installed = join(consumer, 'node_modules/@chronolog/peer-session'), metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.deepEqual(metadata.dependencies ?? {}, {}); assert.deepEqual(metadata.optionalDependencies ?? {}, {}); assert.deepEqual(metadata.peerDependencies ?? {}, {});
  assert.ok(metadata.exports['./releases']);
  const provenance = JSON.parse(await readFile(join(installed, 'provenance.json'), 'utf8')); assert.equal(provenance.dirty, false);
  assert.ok(Object.keys(provenance.sha256).length > 0);
  for (const [path, digest] of Object.entries(provenance.sha256)) {
    const full = resolve(installed, path), scoped = relative(installed, full);
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`));
    assert.equal(hash(await readFile(full)), digest, `Package content mismatch: ${path}`);
  }
  report.artifacts.push({ name: metadata.name, version: metadata.version, sha256: hash(await readFile(artifact)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty });
  const lockBytes = await readFile(join(consumer, 'package-lock.json')), lock = JSON.parse(lockBytes);
  report.runtime.dependencies = { lockSha256: hash(lockBytes), packages: Object.entries(lock.packages)
    .filter(([path]) => path.startsWith('node_modules/') && !['node_modules/@chronolog/peer-session', 'node_modules/@tendriller/core'].includes(path))
    .map(([path, value]) => ({ path, version: value.version, integrity: value.integrity })) };
  assert.ok(report.runtime.dependencies.packages.every(value => value.integrity));
  const { build } = await import(pathToFileURL(join(consumer, 'node_modules/esbuild/lib/main.js')));
  const bundle = await build({ absWorkingDir: consumer, entryPoints: ['peer-release-page.mjs'], bundle: true, format: 'esm', platform: 'browser',
    target: 'es2022', tsconfigRaw: {}, external: ['./lazy.mjs'], outfile: 'page.bundle.mjs', metafile: true });
  for (const path of Object.keys(bundle.metafile.inputs)) assert.ok(path.startsWith('node_modules/@chronolog/peer-session/') ||
    ['peer-release-page.mjs', 'peer-release-store.mjs'].includes(path), `Non-public page bundle input: ${path}`);
  report.bundle = { sha256: hash(await readFile(join(consumer, 'page.bundle.mjs'))), inputs: Object.keys(bundle.metafile.inputs).sort(),
    external: ['./lazy.mjs'], esbuild: '0.28.2' };
  report.publicBoundary = { imports: [...imports].sort(), siblingSourceImports: 0, copiedAuthorityStateMachines: 0,
    applicationRetryQueues: 0, pageSigningKeys: 0, automaticReloads: 0 };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const hostRunner = join(here, 'run-peer-generation-host.mjs');
  const result = spawnSync(process.execPath, [hostRunner, '--control-fixture', '--serve-runtime', '--artifacts', hostArtifacts,
    '--output', join(output, 'host'), '--fixture-script', join(consumer, 'peer-release-consumer.mjs'), '--fixture-cwd', consumer], {
    cwd: root, stdio: 'inherit', timeout: 600_000,
    env: { ...process.env, PEER_RELEASE_REPORT: reportPath, ...(values['browser-executable'] ? { PEER_RELEASE_BROWSER_EXECUTABLE: resolve(values['browser-executable']) } : {}) },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Independent release consumer exited with ${result.status ?? result.signal}`);
  const bytes = await readFile(reportPath), summary = validatePeerReleaseReport(JSON.parse(bytes));
  summary.reportSha256 = hash(bytes);
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Independent signed release consumer passed. Evidence: ${reportPath}`);
} catch (error) {
  let observed = report;
  try { observed = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* The installer failed before consumer startup. */ }
  observed.passed = false; observed.runnerError = error.stack ?? String(error); observed.error ??= observed.runnerError;
  await writeFile(reportPath, `${JSON.stringify(observed, null, 2)}\n`); throw error;
}

function git(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
