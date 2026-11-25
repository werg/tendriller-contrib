// Install exact public archives in an empty directory and run the independent app.
// No sibling checkout, bundler, workspace alias or lifecycle script is available.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateOperationSetReport } from './operation-set-report.mjs';
import { validatePeerTaskReport } from './operation-set-task-report.mjs';
import { verifyAuthorityArtifact, verifyPeerSessionArtifact } from './peer-session-artifact.mjs';

const { values } = parseArgs({ options: {
  artifact: { type: 'string' }, authority: { type: 'string' }, output: { type: 'string' },
  transport: { type: 'string', default: 'direct' },
  domain: { type: 'string', default: 'conversation' },
  'allow-dirty': { type: 'boolean', default: false },
} });
if (!values.artifact || !values.authority || !values.output) throw Error('Usage: --artifact /exact/chronolog-peer-session.tgz --authority /exact/chronolog-authority.tgz --output /new/evidence-directory [--transport direct|native-rtc|websocket] [--domain conversation|tasks]');
assert.ok(['direct', 'native-rtc', 'websocket'].includes(values.transport), 'Unknown transport');
assert.ok(['conversation', 'tasks'].includes(values.domain), 'Unknown domain');
const tasks = values.domain === 'tasks';
if (tasks) assert.equal(values.transport, 'direct', 'The native guarded-task gate uses direct authenticated peers');
const rtc = values.transport === 'native-rtc', relay = values.transport === 'websocket';
if (relay) assert.ok(process.env.OPERATION_SET_HOST_SDK, 'WebSocket qualification needs the actual hosted relay');
const hostSdk = process.env.OPERATION_SET_HOST_SDK;
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
  format: 'operation-set-consumer/v1', protocol: 'chronolog-crdt-v1', mode: 'runtime',
  topology: tasks ? 'independent-packed-tasks' : rtc ? 'independent-native-rtc' : relay ? 'independent-native-websocket' : 'independent-packed-peers', passed: false,
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  source: { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'),
    tree: git('rev-parse', 'HEAD^{tree}'), dirty: git('status', '--porcelain', '--untracked-files=all').length > 0 },
  artifacts: [], fixtures: [], error: null,
};
try {
  const entry = tasks ? 'operation-set-task-consumer.mjs' : rtc ? 'operation-set-rtc-consumer.mjs' : relay ? 'operation-set-websocket-consumer.mjs' : 'operation-set-consumer.mjs';
  // Freeze the exact consumer bytes before installation; a later working-tree
  // edit must not masquerade as the source commit captured above.
  const fixtures = await Promise.all([
    [entry, join(here, entry)],
    ...(hostSdk ? [['operation-set-host-client.mjs', join(here, 'operation-set-host-client.mjs')]] : []),
    ['operation-set-authority.mjs', join(here, 'operation-set-authority.mjs')],
    ...(hostSdk ? [['operation-set-host-request.mjs', join(here, 'operation-set-host-request.mjs')]] : []),
    ...(hostSdk ? [['operation-set-host-document.mjs', join(here, 'operation-set-host-document.mjs')]] : []),
    ['operation-set-participation.mjs', join(here, 'operation-set-participation.mjs')],
    ...(!tasks ? ['operation-set-scenario.mjs', 'operation-set-finality.mjs', 'operation-set-native-restart.mjs'].map(name => [name, join(here,name)]) : []),
    ...(relay ? [['operation-set-websocket-transport.mjs', join(here, 'operation-set-websocket-transport.mjs')]] : []),
    ...(tasks ? [['operation-set-task-definition.mjs', join(here, '../snippets/peer-task-board.mjs')],
      ['peer-conversation.mjs', join(here, '../snippets/peer-conversation.mjs')]] : [['operation-set-definition.mjs', join(here, '../snippets/peer-conversation.mjs')]]),
  ].map(async ([name, path]) => {
    const bytes = await readFile(path), sourcePath = relative(root, path).split(sep).join('/');
    if (!report.source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${report.source.commit}:${sourcePath}`], { cwd: root })), 'Fixture changed after source capture');
    return { name, sourcePath, bytes };
  }));
  if (process.env.OPERATION_SET_HOST_EVIDENCE) {
    report.host = JSON.parse(await readFile(process.env.OPERATION_SET_HOST_EVIDENCE, 'utf8'));
    assert.ok(rtc || relay, 'The hosted qualification requires actual peer transport');
  }
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-operation-set-consumer', private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund',
    artifact, resolve(values.authority), ...(hostSdk ? [resolve(hostSdk)] : [])], {
    cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: join(output, 'empty-npm-cache') },
  });
  const installed = join(consumer, 'node_modules/@chronolog/peer-session');
  const { metadata, provenance, artifact: verifiedArtifact } = await verifyPeerSessionArtifact({
    installed, archive: artifact, allowDirty: values['allow-dirty'],
  });
  assert.deepEqual(metadata.optionalDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, {});
  const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(tree.dependencies).sort(), ['@chronolog/authority', '@chronolog/peer-session', ...(hostSdk ? ['@tendriller/core'] : [])]);
  if (hostSdk) {
    const sdk = report.host.artifacts.find(value => value.name === '@tendriller/core');
    assert.equal(hash(await readFile(resolve(hostSdk))), sdk.sha256, 'The controller must use the exact qualified host SDK');
    assert.equal(tree.dependencies['@tendriller/core'].version, sdk.version);
  }
  for (const [name, version] of Object.entries(metadata.dependencies)) {
    assert.equal(tree.dependencies['@chronolog/peer-session'].dependencies[name]?.version, version, `Installed runtime dependency differs: ${name}`);
  }
  const lockBytes = await readFile(join(consumer, 'package-lock.json'));
  const lock = JSON.parse(lockBytes);
  report.runtime.dependencies = { lockSha256: hash(lockBytes),
    packages: Object.entries(lock.packages).filter(([path]) => path.startsWith('node_modules/') && !['node_modules/@chronolog/peer-session', 'node_modules/@chronolog/authority', 'node_modules/@tendriller/core'].includes(path))
      .map(([path, item]) => ({ path, version: item.version, integrity: item.integrity })) };
  assert.ok(report.runtime.dependencies.packages.every(item => item.integrity), 'Every external runtime dependency needs an exact integrity');

  if (tasks) {
    assert.ok(metadata.exports['./sql'] && metadata.exports['./sql-native'] && metadata.exports['./sql-wasm'], 'The guarded-task gate requires the common SQL composition and native engine capability');
    report.sqlEngine = provenance.nativeEngine;
  }
  report.artifacts.push(verifiedArtifact, await verifyAuthorityArtifact({ installed: join(consumer, 'node_modules/@chronolog/authority'), archive: resolve(values.authority), allowDirty: values['allow-dirty'] }));
  const imports = new Set();
  for (const { name, sourcePath, bytes } of fixtures) {
    report.fixtures.push({ path: sourcePath, sha256: hash(bytes) });
    for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || ['@chronolog/authority', '@chronolog/peer-session', '@chronolog/peer-session/native',
        ...(rtc ? ['@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native'] : []),
        ...(relay ? ['@chronolog/peer-session/websocket'] : []),
        ...(hostSdk ? ['@tendriller/core/peers', '@tendriller/core/authority'] : []),
        ...(tasks ? ['@chronolog/peer-session/sql', '@chronolog/peer-session/sql-native', '@chronolog/peer-session/sql-wasm'] : []),
        './operation-set-authority.mjs', './operation-set-finality.mjs', './operation-set-definition.mjs', './operation-set-scenario.mjs', './operation-set-participation.mjs', './operation-set-host-client.mjs', './operation-set-host-request.mjs', './operation-set-host-document.mjs', './operation-set-websocket-transport.mjs', './operation-set-task-definition.mjs', './peer-conversation.mjs'].includes(specifier), `Non-public consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
    }
    await writeFile(join(consumer, name), bytes, { flag: 'wx' });
  }
  report.publicBoundary = { imports: [...imports].sort(), siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(consumer, entry), reportPath], {
    cwd: consumer, stdio: 'inherit', timeout: rtc || relay ? 300_000 : 180_000,
  });
  if (result.error) throw result.error;
  if (result.signal) throw Error(`Consumer terminated with ${result.signal}`);
  if (result.status !== 0) throw Error(`Consumer failed with exit code ${result.status}`);
  const raw = await readFile(reportPath);
  const summary = (tasks ? validatePeerTaskReport : validateOperationSetReport)(JSON.parse(raw));
  summary.reportSha256 = hash(raw);
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(`Independent operation-set consumer passed. Evidence: ${reportPath}`);
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
