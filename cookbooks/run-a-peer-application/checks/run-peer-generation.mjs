// Install one public archive in an empty directory and run the independent app.
// No sibling checkout, bundler, workspace alias or lifecycle script is available.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validatePeerGenerationReport } from './peer-generation-report.mjs';

const { values } = parseArgs({ options: {
  artifact: { type: 'string' }, output: { type: 'string' },
  transport: { type: 'string', default: 'direct' },
  'allow-dirty': { type: 'boolean', default: false },
} });
if (!values.artifact || !values.output) throw Error('Usage: --artifact /exact/chronolog-peer-session.tgz --output /new/evidence-directory [--transport direct|native-rtc]');
assert.ok(['direct', 'native-rtc'].includes(values.transport), 'Unknown transport');
const rtc = values.transport === 'native-rtc';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const artifact = resolve(values.artifact), output = resolve(values.output);
assert.notEqual(relative(root, output), '', 'Evidence cannot replace the source directory');
try { await stat(output); throw Error('Use a new evidence directory; earlier evidence must not be reused'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const consumer = join(output, 'consumer');
await mkdir(consumer, { recursive: true });
const reportPath = join(output, 'report.json');
const report = {
  format: 'peer-generation-consumer/v1', profile: 'peer-generation-v1', mode: 'runtime',
  topology: rtc ? 'independent-native-rtc' : 'independent-packed-peers', passed: false,
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  source: { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'),
    tree: git('rev-parse', 'HEAD^{tree}'), dirty: git('status', '--porcelain', '--untracked-files=all').length > 0 },
  artifacts: [], fixtures: [], error: null,
};
try {
  const entry = rtc ? 'peer-generation-rtc-consumer.mjs' : 'peer-generation-consumer.mjs';
  // Freeze the exact consumer bytes before installation; a later working-tree
  // edit must not masquerade as the source commit captured above.
  const fixtures = await Promise.all([
    [entry, join(here, entry)],
    ...(rtc ? [['peer-generation-host-client.mjs', join(here, 'peer-generation-host-client.mjs')]] : []),
    ...['peer-generation-scenario.mjs', 'peer-generation-fault.mjs'].map(name => [name, join(here, name)]),
    ['peer-generation-definition.mjs', join(here, '../snippets/peer-conversation.mjs')],
  ].map(async ([name, path]) => {
    const bytes = await readFile(path), sourcePath = relative(root, path).split(sep).join('/');
    if (!report.source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${report.source.commit}:${sourcePath}`], { cwd: root })), 'Fixture changed after source capture');
    return { name, sourcePath, bytes };
  }));
  if (process.env.PEER_GENERATION_HOST_EVIDENCE) {
    report.host = JSON.parse(await readFile(process.env.PEER_GENERATION_HOST_EVIDENCE, 'utf8'));
    assert.equal(rtc, true, 'The hosted qualification requires actual peer RTC');
  }
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-peer-generation-consumer', private: true, type: 'module' }));
  execFileSync('npm', ['install', ...(rtc ? [] : ['--offline', '--package-lock=false']), '--ignore-scripts', '--no-audit', '--no-fund',
    artifact, ...(rtc ? ['werift@0.27.0'] : [])], {
    cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: join(output, 'empty-npm-cache') },
  });
  const installed = join(consumer, 'node_modules/@chronolog/peer-session');
  const metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.equal(metadata.name, '@chronolog/peer-session');
  for (const field of ['dependencies', 'optionalDependencies']) {
    assert.deepEqual(metadata[field] ?? {}, {}, 'The standalone archive must not fetch runtime dependencies');
  }
  assert.deepEqual(metadata.peerDependencies ?? {}, rtc ? { werift: '0.27.0' } : {}, 'The optional native RTC adapter pins its external dependency');
  const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(tree.dependencies).sort(), rtc ? ['@chronolog/peer-session', 'werift'] : ['@chronolog/peer-session']);
  if (rtc) {
    assert.equal(tree.dependencies.werift.version, '0.27.0');
    const lockBytes = await readFile(join(consumer, 'package-lock.json'));
    const lock = JSON.parse(lockBytes);
    report.runtime.dependencies = { lockSha256: hash(lockBytes),
      packages: Object.entries(lock.packages).filter(([path]) => path.startsWith('node_modules/') && path !== 'node_modules/@chronolog/peer-session')
        .map(([path, item]) => ({ path, version: item.version, integrity: item.integrity })) };
    assert.ok(report.runtime.dependencies.packages.every(item => item.integrity), 'Every external RTC dependency needs an exact integrity');
  } else assert.deepEqual(tree.dependencies['@chronolog/peer-session'].dependencies ?? {}, {});
  const provenance = JSON.parse(await readFile(join(installed, 'provenance.json'), 'utf8'));
  assert.match(provenance.source, /^[a-f0-9]{40}$/u);
  assert.match(provenance.sourceTree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof provenance.dirty, 'boolean');
  if (!values['allow-dirty']) assert.equal(provenance.dirty, false, 'Release qualification requires a clean-source artifact; --allow-dirty is explicit local debugging');
  assert.ok(provenance.sha256 && Object.keys(provenance.sha256).length > 0, 'Package must record content digests');
  for (const [name, digest] of Object.entries(provenance.sha256)) {
    const path = resolve(installed, name), scoped = relative(installed, path);
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`), 'Package hash path escapes its archive');
    assert.equal(hash(await readFile(path)), digest, `Package content digest mismatch: ${name}`);
  }
  report.artifacts.push({ name: metadata.name, version: metadata.version, sha256: hash(await readFile(artifact)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty });
  const imports = new Set();
  for (const { name, sourcePath, bytes } of fixtures) {
    report.fixtures.push({ path: sourcePath, sha256: hash(bytes) });
    for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || ['@chronolog/peer-session', '@chronolog/peer-session/native',
        ...(rtc ? ['@chronolog/peer-session/webrtc-native'] : []),
        './peer-generation-definition.mjs', './peer-generation-scenario.mjs', './peer-generation-host-client.mjs', './peer-generation-fault.mjs'].includes(specifier), `Non-public consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
    }
    await writeFile(join(consumer, name), bytes, { flag: 'wx' });
  }
  report.publicBoundary = { imports: [...imports].sort(), siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(consumer, entry), reportPath], {
    cwd: consumer, stdio: 'inherit', timeout: rtc ? 300_000 : 180_000,
  });
  if (result.error) throw result.error;
  if (result.signal) throw Error(`Consumer terminated with ${result.signal}`);
  if (result.status !== 0) throw Error(`Consumer failed with exit code ${result.status}`);
  const raw = await readFile(reportPath);
  const summary = validatePeerGenerationReport(JSON.parse(raw));
  summary.reportSha256 = hash(raw);
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Independent peer-generation consumer passed. Evidence: ${reportPath}`);
} catch (error) {
  // Keep runtime observations already written by the consumer if it started.
  let observed = report;
  try { observed = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* Bootstrap failed before a report existed. */ }
  observed.passed = false;
  observed.runnerError = error instanceof Error ? error.stack ?? error.message : String(error);
  observed.error ??= observed.runnerError;
  await writeFile(reportPath, `${JSON.stringify(observed, null, 2)}\n`);
  throw error;
}

function git(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
