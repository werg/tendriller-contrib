// Independent browser/native qualification from exact archives and declared
// testing dependencies, with no package alias back into a Chronolog checkout.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateBrowserPeerReport } from './operation-set-browser-report.mjs';
import { verifyAuthorityArtifact, verifyPeerSessionArtifact } from './peer-session-artifact.mjs';

const { values } = parseArgs({ options: { artifact: { type: 'string' }, authority: { type: 'string' }, output: { type: 'string' },
  chromium: { type: 'string' }, transport: { type: 'string', default: 'native-rtc' }, 'allow-dirty': { type: 'boolean', default: false } } });
if (!values.artifact || !values.authority || !values.output) throw Error('Usage: --artifact /exact/session-with-native-and-browser-sql.tgz --authority /exact/chronolog-authority.tgz --output /new/evidence-directory [--chromium /path/to/chromium]');
assert.ok(['native-rtc', 'websocket'].includes(values.transport));
const relay = values.transport === 'websocket', hostSdk = process.env.OPERATION_SET_HOST_SDK;
if (relay) assert.ok(hostSdk && process.env.OPERATION_SET_HOST_BRIDGE && process.env.OPERATION_SET_HOST_EVIDENCE, 'Browser WebSocket qualification requires the actual hosted relay');
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../../..');
const artifact = resolve(values.artifact), output = resolve(values.output), consumer = join(output, 'consumer');
try { await stat(output); throw Error('Use a new evidence directory; earlier evidence must remain unchanged'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const source = { repository: 'werg/tendriller-contrib', commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  dirty: git('status', '--porcelain', '--untracked-files=all').length > 0 };
const fixtures = await Promise.all([
  ['operation-set-browser-consumer.mjs', join(here, 'operation-set-browser-consumer.mjs')],
  ['operation-set-browser-page.mjs', join(here, 'operation-set-browser-page.mjs')],
  ['operation-set-browser-worker.mjs', join(here, 'operation-set-browser-worker.mjs')],
  ['operation-set-browser-sql.mjs', join(here, 'operation-set-browser-sql.mjs')],
  ['operation-set-browser-resources.mjs', join(here, 'operation-set-browser-resources.mjs')],
  ['operation-set-browser-transport.mjs', join(here, relay ? 'operation-set-websocket-transport.mjs' : 'operation-set-browser-rtc-transport.mjs')],
  ['operation-set-native-transport.mjs', join(here, relay ? 'operation-set-websocket-transport.mjs' : 'operation-set-native-rtc-transport.mjs')],
  ['operation-set-definition.mjs', join(here, '../snippets/peer-conversation.mjs')],
  ...['board.html', 'compact.html', 'style.css', 'app.mjs'].map(name => [name, join(here, 'peer-ui', name)]),
  ['operation-set-authority.mjs', join(here, 'operation-set-authority.mjs')],
    ...(relay ? [['operation-set-host-request.mjs', join(here, 'operation-set-host-request.mjs')]] : []),
  ['operation-set-participation.mjs', join(here, 'operation-set-participation.mjs')],
  ...(relay ? [['operation-set-host-client.mjs', join(here, 'operation-set-host-client.mjs')]] : []),
].map(async ([name, path]) => {
  const bytes = await readFile(path), relativePath = relative(root, path).split(sep).join('/');
  if (!source.dirty) assert.equal(hash(bytes), hash(execFileSync('git', ['show', `${source.commit}:${relativePath}`], { cwd: root })), 'Fixture changed after source capture');
  return { name, path: relativePath, bytes };
}));
await mkdir(consumer, { recursive: true });
const reportPath = join(output, 'report.json');
const report = { format: 'operation-set-browser/v1', protocol: 'chronolog-crdt-v1', mode: 'runtime',
  topology: relay ? 'browser-worker-opfs-websocket' : 'browser-worker-opfs-native-rtc', passed: false, source, artifacts: [], fixtures: [], error: null,
  runtime: { node: process.version, platform: process.platform, architecture: process.arch, npmCache: process.env.OPERATION_SET_NPM_CACHE ? 'reused-public-integrity-cache' : 'isolated' } };
try {
  if (relay) report.host = JSON.parse(await readFile(process.env.OPERATION_SET_HOST_EVIDENCE, 'utf8'));
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'independent-browser-peer-consumer', private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', artifact, resolve(values.authority),
    ...(relay ? [resolve(hostSdk)] : []), 'playwright@1.65.0', 'esbuild@0.28.2'], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: process.env.OPERATION_SET_NPM_CACHE ? resolve(process.env.OPERATION_SET_NPM_CACHE) : join(output, 'empty-npm-cache') } });
  const installed = join(consumer, 'node_modules/@chronolog/peer-session');
  const { metadata, provenance, artifact: verifiedArtifact } = await verifyPeerSessionArtifact({
    installed, archive: artifact, allowDirty: values['allow-dirty'],
  });
  assert.ok(metadata.exports['./sql-browser'] && metadata.exports['./sql-native'], 'Browser qualification requires actual browser WASM and native SQL capabilities');
  report.sqlEngine = provenance.nativeEngine; report.wasmEngine = provenance.wasmEngine;
  assert.deepEqual(metadata.optionalDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, {});
  report.artifacts.push(verifiedArtifact, await verifyAuthorityArtifact({ installed: join(consumer, 'node_modules/@chronolog/authority'), archive: resolve(values.authority), allowDirty: values['allow-dirty'] }));
  const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json'], { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(Object.keys(tree.dependencies).sort(), ['@chronolog/authority', '@chronolog/peer-session', ...(relay ? ['@tendriller/core'] : []), 'esbuild', 'playwright']);
  for (const [name, version] of Object.entries({ playwright: '1.65.0', esbuild: '0.28.2' })) assert.equal(tree.dependencies[name].version, version);
  for (const [name, version] of Object.entries(metadata.dependencies)) {
    assert.equal(tree.dependencies['@chronolog/peer-session'].dependencies[name]?.version, version, `Installed runtime dependency differs: ${name}`);
  }
  if (relay) {
    const sdk = report.host.artifacts.find(value => value.name === '@tendriller/core');
    assert.equal(hash(await readFile(resolve(hostSdk))), sdk.sha256);
    assert.equal(tree.dependencies['@tendriller/core'].version, sdk.version);
  }
  const lockBytes = await readFile(join(consumer, 'package-lock.json')), lock = JSON.parse(lockBytes);
  report.runtime.dependencies = { lockSha256: hash(lockBytes),
    packages: Object.entries(lock.packages).filter(([name]) => name.startsWith('node_modules/') && !['node_modules/@chronolog/peer-session', 'node_modules/@chronolog/authority', 'node_modules/@tendriller/core'].includes(name))
      .map(([path, item]) => ({ path, version: item.version, integrity: item.integrity })) };
  assert.ok(report.runtime.dependencies.packages.every(item => item.integrity));
  const imports = new Set(), tools = new Set();
  for (const fixture of fixtures) {
    report.fixtures.push({ path: fixture.path, sha256: hash(fixture.bytes) });
    for (const match of fixture.bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('node:') || ['@chronolog/authority', '@chronolog/peer-session', '@chronolog/peer-session/native',
        '@chronolog/peer-session/sql', '@chronolog/peer-session/sql-browser', '@chronolog/peer-session/sql-native', '@chronolog/peer-session/browser', '@chronolog/peer-session/worker', '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native',
        ...(relay ? ['@chronolog/peer-session/websocket', '@tendriller/core/peers', '@tendriller/core/authority'] : []),
        './operation-set-authority.mjs', './operation-set-browser-sql.mjs', '/sql.mjs', '/page.mjs', './operation-set-participation.mjs', './operation-set-host-client.mjs', './operation-set-host-request.mjs', './operation-set-definition.mjs', './operation-set-browser-transport.mjs', './operation-set-native-transport.mjs', './operation-set-browser-resources.mjs', './deployment/bootstrap.mjs', '../page.mjs',
        './typing.mjs', 'playwright', 'esbuild'].includes(specifier), `Non-public consumer import: ${specifier}`);
      if (specifier.startsWith('@')) imports.add(specifier);
      if (['playwright', 'esbuild'].includes(specifier)) tools.add(specifier);
    }
    await writeFile(join(consumer, fixture.name), fixture.bytes, { flag: 'wx' });
  }
  report.publicBoundary = { imports: [...imports].sort(), testTools: [...tools].sort(), siblingSourceImports: 0,
    applicationRpcMaps: 0, applicationRetryQueues: 0, residentRequired: false };
  if (values.chromium) report.runtime.browserExecutableSha256 = hash(await readFile(resolve(values.chromium)));
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(consumer, 'operation-set-browser-consumer.mjs'), reportPath], {
    cwd: consumer, stdio: 'inherit', timeout: 420_000,
    env: { ...process.env, ...(values.chromium ? { OPERATION_SET_CHROMIUM: resolve(values.chromium) } : {}) },
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
