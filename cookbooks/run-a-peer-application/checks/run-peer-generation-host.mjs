// Run native RTC peers and an actual workerd host from independently packed APIs.
// A bounded loopback bridge drives public test fixtures; it is not application RPC.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  artifact: { type: 'string' }, artifacts: { type: 'string' }, output: { type: 'string' },
  'allow-dirty': { type: 'boolean', default: false },
} });
if (!values.artifact || !values.artifacts || !values.output) throw Error('Usage: --artifact /exact/native-rtc-session.tgz --artifacts /exact/tendriller-dist --output /new/evidence');
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
  '@cloudflare/vitest-plugin': '1.8.1', vitest: '4.1.12', typescript: '7.0.2',
} });
await copyFile(join(here, 'peer-generation-host.scenarios.mjs'), join(hostDirectory, 'host.test.mjs'));
await write('entry.mjs', "export { default, Tendril, Admission } from '@tendriller/engine';\n");
await mkdir(join(hostDirectory, 'assets')); await write('assets/index.txt', 'Independent peer qualification assets');
await write('wrangler.jsonc', { name: 'independent-peer-host', main: 'entry.mjs', compatibility_date: '2026-11-01', compatibility_flags: ['nodejs_compat'],
  assets: { directory: './assets', binding: 'ASSETS', run_worker_first: true },
  durable_objects: { bindings: [{ name: 'TENDRIL', class_name: 'Tendril' }, { name: 'ADMISSION', class_name: 'Admission' }] },
  migrations: [{ tag: 'baseline', new_sqlite_classes: ['Tendril', 'Admission'] }],
  d1_databases: [{ binding: 'ACCOUNTS', database_name: 'test', database_id: '00000000-0000-4000-8000-000000000001' }],
  r2_buckets: [{ binding: 'FILES', bucket_name: 'test' }], vars: { PUBLIC_BASE: 'https://tendriller.dev', PAGE_BASE_DOMAIN: 'tendriller.site' },
});
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: hostDirectory, stdio: 'inherit',
  env: { ...process.env, npm_config_cache: join(output, 'host-npm-cache') } });
const lock = await readFile(join(hostDirectory, 'package-lock.json'));
hostEvidence.dependencies = { lockSha256: hash(lock), packages: Object.entries(JSON.parse(lock).packages)
  .filter(([path]) => path.startsWith('node_modules/') && !['node_modules/@tendriller/core', 'node_modules/@tendriller/engine'].includes(path))
  .map(([path, value]) => ({ path, version: value.version, integrity: value.integrity })) };
assert.ok(hostEvidence.dependencies.packages.every(value => value.integrity));
const hostEvidencePath = join(output, 'host-artifacts.json');
await writeFile(hostEvidencePath, `${JSON.stringify(hostEvidence, null, 2)}\n`);

const bridge = await createBridge();
await write('vitest.config.mjs', `import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const migrations = await readD1Migrations(dirname(require.resolve('@tendriller/engine/accounts-schema')));
export default defineConfig({plugins:[cloudflareTest({main:new URL('./entry.mjs',import.meta.url).pathname,wrangler:{configPath:new URL('./wrangler.jsonc',import.meta.url).pathname}})],test:{include:['host.test.mjs'],testTimeout:360000,provide:{d1Migrations:migrations,bridge:${JSON.stringify(bridge.url)}}}});
`);
const worker = run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.mjs'], hostDirectory);
try {
  await Promise.race([bridge.ready, worker.done.then(() => { throw Error('Workerd exited before becoming ready'); })]);
  const peer = run(process.execPath, [join(here, 'run-peer-generation.mjs'), '--artifact', resolve(values.artifact),
    '--transport', 'native-rtc', '--output', join(output, 'peers'), ...(values['allow-dirty'] ? ['--allow-dirty'] : [])], dirname(here),
  { PEER_GENERATION_HOST_BRIDGE: bridge.url, PEER_GENERATION_HOST_EVIDENCE: hostEvidencePath });
  await peer.done;
  await bridge.stop();
  await worker.done;
  console.log(`Independent workerd/native RTC qualification passed: ${join(output, 'peers/report.json')}`);
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

async function createBridge() {
  const queue = [], pending = new Map();
  let nextId = 0, blocked = false, requests = 0, requestBodyBytes = 0, reader, markReady;
  const ready = new Promise(resolve => { markReady = resolve; });
  const enqueue = job => new Promise((resolve, reject) => {
    assert.ok(pending.size < 32, 'The test bridge is bounded');
    const jobId = `${++nextId}`;
    const timer = setTimeout(() => { pending.delete(jobId); reject(Error('TEST_BRIDGE_TIMEOUT')); }, 45_000);
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
      const action = /^\/rendezvous\/(\d+)\/(0|1)\/(next|send|close)$/u.exec(url.pathname);
      assert.ok(action, 'Unknown bridge endpoint');
      return json(res, 200, await enqueue({ kind: `rendezvous.${action[3]}`, id: action[1], index: Number(action[2]), body }));
    } catch (error) { json(res, 500, { error: { code: 'test_bridge_failed', message: error instanceof Error ? error.message : String(error) } }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, ready,
    stop: () => enqueue({ kind: 'stop' }),
    async close() {
      for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('TEST_BRIDGE_CLOSED')); }
      pending.clear(); reader?.end(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
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
