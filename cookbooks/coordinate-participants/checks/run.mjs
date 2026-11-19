// Freeze this consumer and install only public archives in a new directory.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { verifyPeerSessionArtifact } from '../../run-a-peer-application/checks/peer-session-artifact.mjs';
import { validateCollaborationReport } from './report.mjs';

const { values } = parseArgs({ options: {
  'session-artifact': { type: 'string' }, 'core-artifact': { type: 'string' },
  'core-provenance': { type: 'string' }, output: { type: 'string' },
  'allow-dirty': { type: 'boolean', default: false },
} });
for (const name of ['session-artifact', 'core-artifact', 'core-provenance', 'output']) {
  assert.ok(values[name], `Required: --${name} /exact/path`);
}
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../../..');
const output = resolve(values.output), consumer = join(output, 'consumer');
try { await stat(output); throw Error('Use a new output directory; prior evidence must not be overwritten'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const report = {
  format: 'tendriller-collaboration-consumer/v1', mode: 'native-public-artifacts', passed: false, error: null,
  source: { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'),
    tree: git('rev-parse', 'HEAD^{tree}'), dirty: Boolean(git('status', '--porcelain', '--untracked-files=all')) },
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  artifacts: [], fixtures: [], checks: [],
  claims: { browserQualified: false, physicalDeviceQualified: false, deployedHostQualified: false,
    conversationalResumeQualified: false, exactlyOnceExternalEffects: false },
};
await mkdir(consumer, { recursive: true });
const reportPath = join(output, 'report.json');
try {
  if (!values['allow-dirty']) assert.equal(report.source.dirty, false, 'Commit the consumer before release qualification');
  const fixtures = await Promise.all([
    ['consumer.mjs', join(here, 'consumer.mjs')],
    ['review-workspace.mjs', join(here, '../snippets/review-workspace.mjs')],
    ['live-run.mjs', join(here, '../../share-live-signals/snippets/live-run.mjs')],
  ].map(async ([name, path]) => {
    const bytes = await readFile(path), sourcePath = relative(root, path).split(sep).join('/');
    if (!report.source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${report.source.commit}:${sourcePath}`], { cwd: root })));
    return { name, bytes, sourcePath };
  }));
  const sessionArtifact = resolve(values['session-artifact']), coreArtifact = resolve(values['core-artifact']);
  const coreProofBytes = await readFile(resolve(values['core-provenance'])), coreProof = JSON.parse(coreProofBytes);
  assert.equal(coreProof.repository, 'werg/tendriller');
  for (const value of [coreProof.source, coreProof.sourceTree]) assert.match(value, /^[a-f0-9]{40}$/u);
  assert.equal(typeof coreProof.dirty, 'boolean');
  if (!values['allow-dirty']) assert.equal(coreProof.dirty, false, 'Core archive must identify clean source');
  const declaredCore = coreProof.artifacts.find(value => value.name === '@tendriller/core');
  assert.ok(declaredCore, 'Core provenance must identify the public SDK archive');
  assert.equal(hash(await readFile(coreArtifact)), declaredCore.sha256, 'Core archive digest mismatch');
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-collaboration-consumer', private: true, type: 'module' }));
  execFileSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', sessionArtifact, coreArtifact], {
    cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, npm_config_cache: join(output, 'empty-npm-cache') },
  });
  const session = await verifyPeerSessionArtifact({ installed: join(consumer, 'node_modules/@chronolog/peer-session'),
    archive: sessionArtifact, allowDirty: values['allow-dirty'] });
  assert.ok(session.metadata.exports['./sql-native'], 'Collaboration claims require the public native SQL capability');
  const core = JSON.parse(await readFile(join(consumer, 'node_modules/@tendriller/core/package.json'), 'utf8'));
  assert.equal(core.name, '@tendriller/core'); assert.equal(core.version, declaredCore.version);
  assert.ok(core.exports['./collaboration'], 'Core archive must export the maintained collaboration module');
  const installedTree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(installedTree.dependencies).sort(), ['@chronolog/peer-session', '@tendriller/core']);
  report.artifacts = [session.artifact, { name: core.name, version: core.version, sha256: declaredCore.sha256,
    sourceCommit: coreProof.source, sourceTree: coreProof.sourceTree, sourceDirty: coreProof.dirty,
    provenanceSha256: hash(coreProofBytes) }];
  report.runtime.sqlEngine = session.provenance.nativeEngine;
  const imports = new Set();
  const allowed = new Set(['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/sql',
    '@chronolog/peer-session/sql-native', '@chronolog/peer-session/worker', '@chronolog/peer-session/browser',
    '@tendriller/core/collaboration', './review-workspace.mjs', './live-run.mjs']);
  for (const { name, sourcePath, bytes } of fixtures) {
    for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || allowed.has(specifier), `Non-public consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
    }
    report.fixtures.push({ path: sourcePath, sha256: hash(bytes) });
    await writeFile(join(consumer, name), bytes, { flag: 'wx' });
  }
  report.publicBoundary = { imports: [...imports].sort(), siblingSourceImports: 0, applicationRetryQueues: 0 };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(consumer, 'consumer.mjs'), reportPath], {
    cwd: consumer, stdio: 'inherit', timeout: 240_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Consumer terminated'); assert.equal(result.status, 0, 'Consumer failed');
  const observedBytes = await readFile(reportPath), observed = JSON.parse(observedBytes);
  const summary = validateCollaborationReport(observed, { allowDirty: values['allow-dirty'] });
  summary.reportSha256 = hash(observedBytes);
  summary.qualification = values['allow-dirty'] ? 'development' : 'clean-local-composition';
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Collaboration public consumer passed: ${reportPath}`);
} catch (error) {
  let observed = report;
  try { observed = JSON.parse(await readFile(reportPath, 'utf8')); } catch { /* Bootstrap did not finish. */ }
  observed.passed = false; observed.error = error instanceof Error ? error.stack ?? error.message : String(error);
  await writeFile(reportPath, `${JSON.stringify(observed, null, 2)}\n`);
  throw error;
}
