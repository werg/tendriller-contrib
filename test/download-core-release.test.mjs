import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { downloadCoreRelease } from '../distribution/download-core-release.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => Buffer.from(JSON.stringify(value));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'contrib-core-graph-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = 'a'.repeat(40), chronologSource = 'b'.repeat(40), tree = 'c'.repeat(40), runtime = 'd'.repeat(64);
  const base = `https://github.com/werg/tendriller/releases/download/source-${source}`;
  const bytes = new Map(), calls = [];
  const asset = (role, file, content) => {
    const data = Buffer.isBuffer(content) ? content : json(content); bytes.set(file, data);
    return { role, file, sha256: hash(data), size: data.length, url: `${base}/${file}` };
  };
  const components = ['sdk', 'engine'].map(role => asset(role, `tendriller-${role}-1.2.3.tgz`, Buffer.from(role + ' public bytes')));
  const core = { repository: 'werg/tendriller', source, sourceTree: tree, dirty: false };
  const body = { format: 'tendriller-release-composition-v1', version: '1.2.3', contract: 3, runtime, core,
    chronolog: { session: { repository: 'werg/chronolog-db', source: chronologSource, sourceTree: 'e'.repeat(40), dirty: false } }, components };
  const composition = { ...body, id: hash(JSON.stringify(body)) };
  const manifest = { format: 'tendriller-core-release', version: '1.2.3', contract: 3,
    source_commit: source, source_tree: tree, runtime, composition: { id: composition.id, file: 'composition.json' },
    artifacts: [...components, asset('composition', 'composition.json', composition), asset('core-provenance', 'provenance.json', { ...core, artifacts: components })] };
  const save = () => bytes.set('manifest.json', json(manifest)); save();
  const output = join(root, 'dist');
  let override;
  const fetcher = async (url, options) => {
    calls.push(url); assert.equal(options.redirect, 'manual'); assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer'); assert(options.signal instanceof AbortSignal);
    if (override) return override(url);
    const data = bytes.get(new URL(url).pathname.split('/').at(-1));
    return data ? new Response(data) : new Response(null, { status: 404 });
  };
  return { source, chronologSource, output, base, bytes, manifest, components, calls, save,
    override: value => { override = value; }, run: () => downloadCoreRelease({ source, chronologSource, output }, { fetcher }) };
}

test('public graph acquisition retains exact SDK/engine and original source/composition proofs', async t => {
  const f = fixture(t), result = await f.run();
  assert.equal(result.source, f.source); assert.equal(result.compositionId, f.manifest.composition.id);
  assert.equal(result.manifestSha256, hash(f.bytes.get('manifest.json')));
  for (const [file, bytes] of f.bytes) assert.deepEqual(readFileSync(join(f.output, file)), bytes);
  assert.equal(f.calls.length, 5); assert(f.calls.every(url => url.startsWith(f.base + '/')));
  await assert.rejects(f.run(), /new core artifact directory/);
});

test('wrong or unpublished source cannot fall back to a branch or version URL', async t => {
  const f = fixture(t); f.bytes.delete('manifest.json');
  await assert.rejects(f.run(), /unavailable/); assert.deepEqual(f.calls, [f.base + '/manifest.json']);
  const wrong = fixture(t); wrong.manifest.source_commit = 'e'.repeat(40); wrong.save();
  await assert.rejects(wrong.run()); assert.equal(existsSync(wrong.output), false);
});

test('cross-source artifact URLs, path traversal and duplicate roles fail before acquisition', async t => {
  for (const mutate of [a => { a.url = 'https://example.test/sdk.tgz'; }, a => { a.file = '../sdk.tgz'; }, a => { a.role = 'engine'; }]) {
    const f = fixture(t); mutate(f.manifest.artifacts[0]); f.save();
    await assert.rejects(f.run()); assert.equal(f.calls.length, 1); assert.equal(existsSync(f.output), false);
  }
});

test('changed package bytes and inconsistent composition fail without publishing a local graph', async t => {
  const f = fixture(t); f.bytes.set(f.components[0].file, Buffer.from('bad'));
  await assert.rejects(f.run(), /mismatch/); assert.equal(existsSync(f.output), false);
  const other = fixture(t), comp = JSON.parse(other.bytes.get('composition.json'));
  comp.chronolog.session.source = 'e'.repeat(40);
  const { id: old, ...body } = comp; comp.id = hash(JSON.stringify(body));
  const data = json(comp); other.bytes.set('composition.json', data);
  Object.assign(other.manifest.artifacts.find(item => item.role === 'composition'), { sha256: hash(data), size: data.length });
  other.manifest.composition.id = comp.id; other.save();
  await assert.rejects(other.run(), /Companion source/); assert.equal(existsSync(other.output), false);
});

test('bootstrap rejects insecure and cross-source redirects and oversized metadata', async t => {
  for (const location of ['http://release-assets.githubusercontent.com/file', 'https://example.test/file',
    'https://github.com/werg/tendriller/releases/download/v1/manifest.json']) {
    const f = fixture(t); f.override(() => new Response(null, { status: 302, headers: { location } }));
    await assert.rejects(f.run(), /Forbidden release redirect/); assert.equal(f.calls.length, 1);
  }
  const large = fixture(t); large.override(() => new Response(new Uint8Array(1024 * 1024 + 1)));
  await assert.rejects(large.run(), /size limit/); assert.equal(existsSync(large.output), false);
});
