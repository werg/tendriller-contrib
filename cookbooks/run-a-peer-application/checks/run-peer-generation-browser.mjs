// Independent browser/native qualification from exact archives and declared
// testing dependencies, with no package alias back into a Chronolog checkout.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateBrowserPeerReport } from './peer-generation-browser-report.mjs';

const { values } = parseArgs({ options: { artifact: { type: 'string' }, output: { type: 'string' },
  chromium: { type: 'string' }, 'allow-dirty': { type: 'boolean', default: false } } });
if (!values.artifact || !values.output) throw Error('Usage: --artifact /exact/session-with-native-rtc.tgz --output /new/evidence-directory [--chromium /path/to/chromium]');
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../../..');
const artifact = resolve(values.artifact), output = resolve(values.output), consumer = join(output, 'consumer');
try { await stat(output); throw Error('Use a new evidence directory; earlier evidence must remain unchanged'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const source = { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  dirty: git('status', '--porcelain', '--untracked-files=all').length > 0 };
const fixtures = await Promise.all([
  ['peer-generation-browser-consumer.mjs', join(here, 'peer-generation-browser-consumer.mjs')],
  ['peer-generation-browser-page.mjs', join(here, 'peer-generation-browser-page.mjs')],
  ['peer-generation-browser-worker.mjs', join(here, 'peer-generation-browser-worker.mjs')],
  ['peer-generation-definition.mjs', join(here, '../snippets/peer-conversation.mjs')],
  ...['board.html', 'compact.html', 'style.css', 'app.mjs', 'recovery-choice.mjs'].map(name => [name, join(here, 'peer-ui', name)]),
  ['typing.mjs', join(here, 'shared/typing.mjs')],
].map(async ([name, path]) => {
  const bytes = await readFile(path), relativePath = relative(root, path).split(sep).join('/');
  if (!source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${source.commit}:${relativePath}`], { cwd: root })), 'Fixture changed after source capture');
  return { name, path: relativePath, bytes };
}));
await mkdir(consumer, { recursive: true });
const reportPath = join(output, 'report.json');
const report = { format: 'peer-generation-browser/v1', profile: 'peer-generation-v1', mode: 'runtime',
  topology: 'browser-worker-opfs-native-rtc', passed: false, source, artifacts: [], fixtures: [], error: null,
  runtime: { node: process.version, platform: process.platform, architecture: process.arch } };
try {
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-browser-peer-consumer', private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', artifact,
    'werift@0.27.0', 'playwright@1.65.0', 'esbuild@0.28.2'], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: join(output, 'empty-npm-cache') } });
  const installed = join(consumer, 'node_modules/@chronolog/peer-session');
  const metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.equal(metadata.name, '@chronolog/peer-session');
  for (const field of ['dependencies', 'optionalDependencies']) assert.deepEqual(metadata[field] ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, { werift: '0.27.0' });
  const provenanceBytes = await readFile(join(installed, 'provenance.json'));
  const provenance = JSON.parse(provenanceBytes);
  assert.match(provenance.source, /^[a-f0-9]{40}$/u); assert.match(provenance.sourceTree, /^[a-f0-9]{40}$/u);
  if (!values['allow-dirty']) assert.equal(provenance.dirty, false, 'Qualification requires a clean-source artifact');
  assert.ok(Object.keys(provenance.sha256 ?? {}).length > 0);
  for (const [name, digest] of Object.entries(provenance.sha256)) {
    const scoped = relative(installed, resolve(installed, name));
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`));
    assert.equal(hash(await readFile(join(installed, name))), digest, `Artifact content mismatch: ${name}`);
  }
  report.artifacts.push({ name: metadata.name, version: metadata.version, sha256: hash(await readFile(artifact)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty,
    provenance: { sha256: hash(provenanceBytes), profile: provenance.profile, optionalNativeRtc: provenance.optionalNativeRtc,
      sqlEngines: provenance.sqlEngines, files: provenance.sha256 } });
  const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(tree.dependencies).sort(), ['@chronolog/peer-session', 'esbuild', 'playwright', 'werift']);
  for (const [name, version] of Object.entries({ werift: '0.27.0', playwright: '1.65.0', esbuild: '0.28.2' })) assert.equal(tree.dependencies[name].version, version);
  const lockBytes = await readFile(join(consumer, 'package-lock.json')), lock = JSON.parse(lockBytes);
  report.runtime.dependencies = { lockSha256: hash(lockBytes),
    packages: Object.entries(lock.packages).filter(([name]) => name.startsWith('node_modules/') && name !== 'node_modules/@chronolog/peer-session')
      .map(([path, item]) => ({ path, version: item.version, integrity: item.integrity })) };
  assert.ok(report.runtime.dependencies.packages.every(item => item.integrity));
  const imports = new Set(), tools = new Set();
  for (const fixture of fixtures) {
    report.fixtures.push({ path: fixture.path, sha256: hash(fixture.bytes) });
    for (const match of fixture.bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || ['@chronolog/peer-session', '@chronolog/peer-session/native',
        '@chronolog/peer-session/browser', '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native',
        './peer-generation-definition.mjs', './deployment/bootstrap.mjs', '../peer-generation-browser-page.mjs',
        './typing.mjs', './recovery-choice.mjs', 'playwright', 'esbuild'].includes(specifier), `Non-public consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
      if (['playwright', 'esbuild'].includes(specifier)) tools.add(specifier);
    }
    await writeFile(join(consumer, fixture.name), fixture.bytes, { flag: 'wx' });
  }
  report.publicBoundary = { imports: [...imports].sort(), testTools: [...tools].sort(), siblingSourceImports: 0,
    applicationRpcMaps: 0, applicationRetryQueues: 0, residentRequired: false };
  if (values.chromium) report.runtime.browserExecutableSha256 = hash(await readFile(resolve(values.chromium)));
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(consumer, 'peer-generation-browser-consumer.mjs'), reportPath], {
    cwd: consumer, stdio: 'inherit', timeout: 420_000,
    env: { ...process.env, ...(values.chromium ? { PEER_GENERATION_CHROMIUM: resolve(values.chromium) } : {}) },
  });
  if (result.error) throw result.error;
  if (result.signal) throw Error(`Browser consumer terminated with ${result.signal}`);
  if (result.status !== 0) throw Error(`Browser consumer failed with exit code ${result.status}`);
  const raw = await readFile(reportPath), summary = validateBrowserPeerReport(JSON.parse(raw));
  summary.reportSha256 = hash(raw);
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Independent browser peer consumer passed. Evidence: ${reportPath}`);
} catch (error) {
  let observed = report;
  try { observed = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* Installation failed before the consumer ran. */ }
  observed.passed = false; observed.runnerError = error instanceof Error ? error.stack : String(error);
  observed.error ??= observed.runnerError;
  await writeFile(reportPath, `${JSON.stringify(observed, null, 2)}\n`); throw error;
}
function git(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
