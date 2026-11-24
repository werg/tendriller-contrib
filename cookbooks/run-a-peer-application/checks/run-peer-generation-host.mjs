// Run native RTC peers and an actual workerd host from independently packed APIs.
// A bounded loopback bridge drives public test fixtures; it is not application RPC.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRelayIngress } from './peer-generation-relay-ingress.mjs';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  artifact: { type: 'string' }, artifacts: { type: 'string' }, output: { type: 'string' },
  transport: { type: 'string', default: 'native-rtc' }, browser: { type: 'boolean', default: false },
  'allow-dirty': { type: 'boolean', default: false },
} });
if (!values.artifact || !values.artifacts || !values.output) throw Error('Usage: --artifact /exact/native-rtc-session.tgz --artifacts /exact/tendriller-dist --output /new/evidence');
assert.ok(['native-rtc', 'websocket'].includes(values.transport), 'Choose native-rtc or websocket');
if (values.browser) assert.equal(values.transport, 'websocket', 'Use the direct browser runner for RTC');
const here = dirname(fileURLToPath(import.meta.url)), output = resolve(values.output), artifacts = resolve(values.artifacts);
try { await stat(output); throw Error('Use a new evidence directory'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const hostDirectory = join(output, 'host');
await mkdir(hostDirectory, { recursive: true });
const files = await readdir(artifacts);
const selected = kind => {
  const matches = files.filter(name => new RegExp(`^tendriller-${kind}-.+\\.tgz$`, 'u').test(name));
  assert.equal(matches.length, 1, `Exactly one ${kind} archive is required`);
  return join(artifacts, matches[0]);
};
const sdk = selected('sdk'), engine = selected('engine');
const manifest = JSON.parse(await readFile(join(artifacts, 'provenance.json'), 'utf8'));
assert.equal(manifest.repository, 'werg/tendriller');
assert.match(manifest.source, /^[a-f0-9]{40}$/u); assert.match(manifest.sourceTree, /^[a-f0-9]{40}$/u);
assert.equal(typeof manifest.dirty, 'boolean');
if (!values['allow-dirty']) assert.equal(manifest.dirty, false, 'Host artifacts must come from clean source');
const expectedArchives = new Map(manifest.artifacts.map(value => [value.file, value]));
const hostEvidence = { runtime: 'workerd', identity: 'synthetic authenticated test accounts',
  publicImports: ['@tendriller/core/peers', '@tendriller/engine/testing'],
  fixtureSha256: hash(await readFile(join(here, 'peer-generation-host.scenarios.mjs'))), artifacts: [] };
for (const [name, path] of [['@tendriller/core', sdk], ['@tendriller/engine', engine]]) {
  const sha256 = hash(await readFile(path)), record = expectedArchives.get(path.slice(path.lastIndexOf('/') + 1));
  assert.ok(record, 'Host archive missing from its provenance manifest'); assert.equal(record.sha256, sha256);
  hostEvidence.artifacts.push({ name, version: record.version, sha256, sourceCommit: manifest.source,
    sourceTree: manifest.sourceTree, sourceDirty: manifest.dirty });
}
const write = (path, value) => writeFile(join(hostDirectory, path), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
await write('package.json', { private: true, type: 'module', dependencies: {
  '@tendriller/core': `file:${sdk}`, '@tendriller/engine': `file:${engine}`,
  '@cloudflare/vitest-plugin': '1.8.1', vitest: '4.1.12', typescript: '7.0.2', ws: '8.22.0',
} });
await copyFile(join(here, 'peer-generation-host.scenarios.mjs'), join(hostDirectory, 'host.test.mjs'));
await write('entry.mjs', "export { default, Tendril, Admission } from '@tendriller/engine';\n");
await mkdir(join(hostDirectory, 'assets')); await write('assets/index.txt', 'Independent peer qualification assets');
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: hostDirectory, stdio: 'inherit',
  env: { ...process.env, npm_config_cache: join(output, 'host-npm-cache') } });
const installedEngine = join(hostDirectory, 'node_modules/@tendriller/engine');
const { ratelimits } = JSON.parse(await readFile(join(installedEngine, 'testing-ratelimits.json')));
assert.ok(Array.isArray(ratelimits) && ['PAGE_RATE', 'ACCOUNT_RATE'].every(name => ratelimits.some(binding => binding.name === name)),
  'Public engine must declare its host traffic bindings');
await write('wrangler.jsonc', { name: 'independent-peer-host', main: 'entry.mjs', compatibility_date: '2026-11-01', compatibility_flags: ['nodejs_compat'],
  assets: { directory: './assets', binding: 'ASSETS', run_worker_first: true },
  durable_objects: { bindings: [{ name: 'TENDRIL', class_name: 'Tendril' }, { name: 'ADMISSION', class_name: 'Admission' }] },
  migrations: [{ tag: 'baseline', new_sqlite_classes: ['Tendril', 'Admission'] }],
  d1_databases: [{ binding: 'ACCOUNTS', database_name: 'test', database_id: '00000000-0000-4000-8000-000000000001' }],
  r2_buckets: [{ binding: 'FILES', bucket_name: 'test' }], ratelimits,
  vars: { PUBLIC_BASE: 'https://tendriller.dev', PAGE_BASE_DOMAIN: 'tendriller.site' },
});
const engineProofBytes = await readFile(join(installedEngine, 'provenance.json'));
const engineProof = JSON.parse(engineProofBytes);
for (const key of ['repository', 'source', 'sourceTree', 'dirty']) assert.equal(engineProof[key], manifest[key], `Host provenance mismatch: ${key}`);
assert.ok(Number.isSafeInteger(engineProof.storageSchemaRevision) && engineProof.storageSchemaRevision > 0, 'The engine must record its storage schema');
for (const [name, digest] of Object.entries(engineProof.files)) {
  const path = resolve(installedEngine, name), scoped = relative(installedEngine, path);
  assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`), 'Host provenance path escapes its archive');
  assert.equal(hash(await readFile(path)), digest, `Host artifact content mismatch: ${name}`);
}
const controlBytes = await readFile(join(installedEngine, 'peer-generation-provenance.json'));
const control = JSON.parse(controlBytes);
assert.equal(control.repository, 'werg/chronolog-db'); assert.equal(control.profile, 'peer-generation-v1');
assert.equal(control.dirty, false, 'The embedded verifier must come from clean source');
assert.match(control.source, /^[a-f0-9]{40}$/u); assert.match(control.sourceTree, /^[a-f0-9]{40}$/u);
for (const name of ['control.mjs', 'control.d.ts', 'participant.mjs', 'participant.d.ts']) assert.match(control.sha256[name], /^[a-f0-9]{64}$/u);
hostEvidence.provenance = { sha256: hash(engineProofBytes), files: engineProof.files, storageSchemaRevision: engineProof.storageSchemaRevision,
  embeddedControl: { sha256: hash(controlBytes), repository: control.repository, source: control.source,
    sourceTree: control.sourceTree, dirty: control.dirty, profile: control.profile, files: control.sha256 } };
const lock = await readFile(join(hostDirectory, 'package-lock.json'));
hostEvidence.dependencies = { lockSha256: hash(lock), packages: Object.entries(JSON.parse(lock).packages)
  .filter(([path]) => path.startsWith('node_modules/') && !['node_modules/@tendriller/core', 'node_modules/@tendriller/engine'].includes(path))
  .map(([path, value]) => ({ path, version: value.version, integrity: value.integrity })) };
assert.ok(hostEvidence.dependencies.packages.every(value => value.integrity));
const hostEvidencePath = join(output, 'host-artifacts.json');
await writeFile(hostEvidencePath, `${JSON.stringify(hostEvidence, null, 2)}\n`);

const require = createRequire(join(hostDirectory, 'package.json'));
const { WebSocketServer } = require('ws');
// Resolve the SDK's import-only public export from the isolated installation.
await write('relay-limits.mjs', "export { PEER_RELAY_LIMITS } from '@tendriller/core/peers';\n");
const { PEER_RELAY_LIMITS } = await import(pathToFileURL(join(hostDirectory, 'relay-limits.mjs')).href);
const bridge = await createBridge(WebSocketServer, PEER_RELAY_LIMITS);
await write('vitest.config.mjs', `import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const migrations = await readD1Migrations(dirname(require.resolve('@tendriller/engine/accounts-schema')));
export default defineConfig({plugins:[cloudflareTest({main:new URL('./entry.mjs',import.meta.url).pathname,wrangler:{configPath:new URL('./wrangler.jsonc',import.meta.url).pathname}})],test:{include:['host.test.mjs'],testTimeout:540000,provide:{d1Migrations:migrations,bridge:${JSON.stringify(bridge.url)}}}});
`);
const worker = run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.mjs'], hostDirectory);
try {
  await Promise.race([bridge.ready, worker.done.then(() => { throw Error('Workerd exited before becoming ready'); })]);
  const peer = run(process.execPath, [join(here, values.browser ? 'run-peer-generation-browser.mjs' : 'run-peer-generation.mjs'), '--artifact', resolve(values.artifact),
    '--transport', values.transport, '--output', join(output, 'peers'), ...(values['allow-dirty'] ? ['--allow-dirty'] : [])], dirname(here),
  { PEER_GENERATION_HOST_BRIDGE: bridge.url, PEER_GENERATION_HOST_EVIDENCE: hostEvidencePath, PEER_GENERATION_HOST_SDK: sdk });
  await peer.done;
  await bridge.stop();
  await worker.done;
  console.log(`Independent workerd/${values.transport} qualification passed: ${join(output, 'peers/report.json')}`);
} finally {
  await bridge.close();
  worker.child.kill('SIGTERM');
  await worker.done.catch(() => undefined);
}

function run(command, args, cwd, environment = {}) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', env: { ...process.env, ...environment } });
  const timer = setTimeout(() => child.kill('SIGTERM'), 420_000);
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => { clearTimeout(timer); code === 0 ? resolve() : reject(Error(`Process failed: ${command} (${code ?? signal})`)); });
  });
  void done.catch(() => undefined);
  return { child, done };
}

async function createBridge(WebSocketServer, relayLimits) {
  const queue = [], pending = new Map(), relayTasks = new Set(), bridgeSockets = [];
  let nextId = 0, blocked = false, requests = 0, requestBodyBytes = 0, reader, markReady;
  const ready = new Promise(resolve => { markReady = resolve; });
  const enqueue = job => new Promise((resolve, reject) => {
    assert.ok(pending.size < 32, 'The test bridge is bounded');
    const jobId = `${++nextId}`;
    const timer = setTimeout(() => { pending.delete(jobId); reject(Error('TEST_BRIDGE_TIMEOUT')); }, job.kind.endsWith('.next') ? 120_000 : 45_000);
    pending.set(jobId, { resolve, reject, timer });
    const value = { ...job, jobId };
    if (reader) { const response = reader; reader = undefined; json(response, 200, value); }
    else queue.push(value);
  });
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost'), body = await readBody(req);
      if (url.pathname === '/testing/ready') { markReady(); return json(res, 200, { ready: true }); }
      if (url.pathname === '/testing/next') {
        if (queue.length) return json(res, 200, queue.shift());
        assert.equal(reader, undefined, 'Only one bridge consumer is allowed'); reader = res;
        const timer = setTimeout(() => { if (reader === res) { reader = undefined; res.writeHead(204).end(); } }, 15_000);
        res.once('close', () => { clearTimeout(timer); if (reader === res) reader = undefined; }); return;
      }
      if (url.pathname === '/testing/complete') {
        const item = pending.get(body.id); assert.ok(item, 'Unknown bridge reply'); pending.delete(body.id); clearTimeout(item.timer);
        body.error ? item.reject(Error(body.error)) : item.resolve(body.value); return json(res, 200, { received: true });
      }
      if (url.pathname === '/testing/block') { blocked = body.blocked === true; return json(res, 200, { blocked }); }
      if (url.pathname === '/testing/page') return json(res, 200, await enqueue({ kind: 'page', applicationId: body.applicationId }));
      if (url.pathname === '/testing/asset') return json(res, 200, await enqueue({ kind: 'asset', path: url.searchParams.get('path') ?? '' }));
      if (url.pathname === '/testing/restart') return json(res, 200, await enqueue({ kind: 'restart' }));
      if (url.pathname === '/testing/relay-traffic') return json(res, 200, { ...await enqueue({ kind: 'relay.traffic' }), bridgeSockets });
      if (url.pathname === '/testing/relay-cut') return json(res, 200, await enqueue({ kind: 'relay.cut' }));
      if (url.pathname === '/testing/traffic') return json(res, 200, { requests, requestBodyBytes, applicationBodyBytes: 0, worker: await enqueue({ kind: 'traffic' }) });
      requests++; requestBodyBytes += body === undefined ? 0 : Buffer.byteLength(JSON.stringify(body));
      if (blocked) return json(res, 503, { error: { code: 'control_host_unavailable', message: 'CONTROL_HOST_UNAVAILABLE' } });
      if (url.pathname.startsWith('/api/')) {
        const path = url.pathname.slice(5);
        assert.equal(path, 'peers/participant', 'The host participates through the shared protocol transport');
        const response = await enqueue({ kind: 'api', method: req.method, path, body });
        return json(res, response.status, response.value);
      }
      if (url.pathname === '/rendezvous/open') return json(res, 200, await enqueue({ kind: 'rendezvous.open', ...body }));
      const introduced = /^\/introductions\/(rendezvous|invitations|discovery)\/(open|ready|next|send|close)$/u.exec(url.pathname);
      if (introduced) return json(res, 200, await enqueue({ kind: `introductions.${introduced[1]}.${introduced[2]}`, ...body }));
      const action = /^\/rendezvous\/(\d+)\/(0|1)\/(next|send|close)$/u.exec(url.pathname);
      assert.ok(action, 'Unknown bridge endpoint');
      return json(res, 200, await enqueue({ kind: `rendezvous.${action[3]}`, id: action[1], index: Number(action[2]), body }));
    } catch (error) { json(res, 500, { error: { code: 'test_bridge_failed', message: error instanceof Error ? error.message : String(error) } }); }
  });
  // Native and browser clients use actual WebSocket machinery on this loopback
  // hop. The bounded fixture bridge delivers the unchanged protocol frames to
  // actual authenticated workerd sockets; it does not parse application frames.
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 1_100_000, perMessageDeflate: false });
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/relay') { socket.destroy(); return; }
    sockets.handleUpgrade(request, socket, head, client => {
      const diagnostic = { channel: url.searchParams.get('channel'), peerId: url.searchParams.get('peerId'),
        lane: url.searchParams.get('lane'), pendingSendsHighWater: 0, terminationCause: null };
      bridgeSockets.push(diagnostic);
      const terminate = (cause, error) => {
        diagnostic.terminationCause ??= error === undefined ? cause : `${cause}: ${String(error)}`;
        client.terminate();
      };
      const task = relaySocket(client, url.searchParams, diagnostic, terminate).finally(() => relayTasks.delete(task));
      relayTasks.add(task); void task.catch(error => terminate('FIXTURE_RELAY_TASK_FAILED', error));
    });
  });
  async function relaySocket(client, parameters, diagnostic, terminate) {
    const fields = Object.fromEntries(['channel', 'peerId', 'remotePeerId', 'lane'].map(key => [key, parameters.get(key)]));
    const opened = enqueue({ kind: 'relay.open', ...fields });
    let closed = false;
    const ingress = createRelayIngress(client, { limits: relayLimits, forward: async frame => {
      const { id } = await opened;
      if (!closed) await enqueue({ kind: 'relay.send', id, frame });
    } });
    Object.defineProperties(diagnostic, {
      pendingSendsHighWater: { enumerable: true, get: () => ingress.stats.maxPendingFrames },
      ingress: { enumerable: true, get: () => ingress.stats },
    });
    const close = async () => {
      if (closed) return; closed = true;
      const { id } = await opened;
      await enqueue({ kind: 'relay.close', id });
    };
    client.on('error', error => {
      diagnostic.terminationCause ??= `FIXTURE_RELAY_SOCKET_ERROR: ${String(error)}`;
      void close().catch(() => {});
    });
    client.on('close', () => { void close().catch(() => {}); });
    const { id } = await opened;
    try {
      while (!closed) {
        const event = await enqueue({ kind: 'relay.next', id });
        if (event.type === 'close') {
          if (client.readyState === 1) client.close(1000, 'Fixture relay closed');
          break;
        }
        if (event.type === 'error') throw Error(event.message);
        if (event.type !== 'message') continue;
        assert.ok(client.bufferedAmount <= 1_100_000, 'Fixture relay egress exceeded its bound');
        if (client.readyState !== 1) break;
        client.send(event.binary ? Buffer.from(event.data, 'base64') : event.data, { binary: event.binary });
      }
    } finally { try { await close(); } finally { await ingress.close(); } }
  }
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, ready,
    stop: async () => { await Promise.allSettled([...relayTasks]); return enqueue({ kind: 'stop' }); },
    async close() {
      for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('TEST_BRIDGE_CLOSED')); }
      pending.clear(); reader?.end(); for (const socket of sockets.clients) socket.terminate(); sockets.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    },
  };
}
async function readBody(request) {
  const chunks = []; let length = 0;
  for await (const chunk of request) { length += chunk.length; assert.ok(length <= 1_048_576, 'Test request exceeded bound'); chunks.push(chunk); }
  return length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
}
function json(response, status, value) { response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value)); }
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
