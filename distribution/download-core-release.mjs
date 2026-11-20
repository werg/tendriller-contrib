// Consume the immutable published core graph, never rebuild qualified core bytes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = /^[a-f0-9]{40}$/, digest = /^[a-f0-9]{64}$/;
export async function downloadCoreRelease({ source, chronologSource, output }, { fetcher = globalThis.fetch } = {}) {
  assert(sha.test(source) && sha.test(chronologSource), 'Select full immutable core and Chronolog commits');
  assert(typeof output === 'string' && output.length > 0, 'Provide an artifact output directory');
  assert(!existsSync(output), 'Use a new core artifact directory');
  const base = `https://github.com/werg/tendriller/releases/download/source-${source}`;
  const signal = AbortSignal.timeout(120_000);
  const saved = new Map();
  let total = 0;
  async function download(file, record, metadata = false) {
    const initial = new URL(`${base}/${file}`), limit = metadata ? 1024 * 1024 : 64 * 1024 * 1024;
    let url = initial, response;
    for (let redirects = 0; ; redirects++) {
      response = await fetcher(url.href, { signal, redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      await response.body?.cancel();
      assert(redirects < 3, 'Too many release redirects');
      const location = response.headers.get('location'); assert(location, 'Missing release redirect');
      url = new URL(location, url);
      assert(url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash &&
        (url.hostname === 'release-assets.githubusercontent.com' ||
         url.hostname === 'github.com' && url.pathname === initial.pathname && !url.search), 'Forbidden release redirect');
    }
    if (response.status !== 200) await response.body?.cancel();
    assert.equal(response.status, 200, `Published source asset unavailable: ${file}`);
    const length = response.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) {
      await response.body?.cancel(); throw Error('Release size limit');
    }
    let size = 0;
    const chunks = [];
    for await (const chunk of response.body ?? []) {
      size += chunk.byteLength; total += chunk.byteLength;
      assert(size <= limit && total <= 256 * 1024 * 1024 && (!record || size <= record.size), 'Release size limit');
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    if (record) { assert.equal(size, record.size, `Asset size mismatch: ${file}`); assert.equal(hash(bytes), record.sha256, `Asset digest mismatch: ${file}`); }
    saved.set(file, bytes);
    return metadata ? JSON.parse(bytes) : bytes;
  }
  const manifest = await download('manifest.json', undefined, true);
  assert.equal(manifest.format, 'tendriller-core-release');
  assert.equal(manifest.source_commit, source); assert(sha.test(manifest.source_tree));
  assert(digest.test(manifest.runtime) && digest.test(manifest.composition?.id));
  assert(Array.isArray(manifest.artifacts) && manifest.artifacts.length <= 32);
  const names = new Set(), roles = new Map();
  let declared = 0;
  for (const item of manifest.artifacts) {
    assert(item && typeof item.file === 'string' && item.file !== 'manifest.json' && typeof item.role === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(item.file) && !names.has(item.file) && !roles.has(item.role));
    assert(digest.test(item.sha256) && Number.isSafeInteger(item.size) && item.size > 0 && item.size <= 64 * 1024 * 1024);
    assert.equal(item.url, `${base}/${item.file}`, 'Release URLs must select the same immutable source');
    declared += item.size; assert(declared <= 256 * 1024 * 1024, 'Declared release size limit');
    names.add(item.file); roles.set(item.role, item);
  }
  for (const role of ['sdk', 'engine', 'core-provenance', 'composition']) assert(roles.has(role), `Missing ${role}`);
  assert.equal(manifest.composition.file, 'composition.json');
  assert.equal(roles.get('composition').file, 'composition.json');
  assert.equal(roles.get('core-provenance').file, 'provenance.json');
  const composition = await download('composition.json', roles.get('composition'), true);
  const { id, ...body } = composition;
  assert.equal(id, hash(JSON.stringify(body))); assert.equal(id, manifest.composition.id);
  assert.equal(composition.format, 'tendriller-release-composition-v1');
  assert.equal(composition.version, manifest.version); assert.equal(composition.contract, manifest.contract);
  assert.equal(composition.runtime, manifest.runtime);
  assert.equal(composition.core.repository, 'werg/tendriller');
  assert.equal(composition.core.source, source); assert.equal(composition.core.sourceTree, manifest.source_tree);
  assert.equal(composition.core.dirty, false);
  assert.equal(composition.chronolog.session.repository, 'werg/chronolog-db');
  assert.equal(composition.chronolog.session.dirty, false); assert(sha.test(composition.chronolog.session.sourceTree));
  assert.equal(composition.chronolog.session.source, chronologSource, 'Companion source differs from the promoted graph');
  const provenance = await download('provenance.json', roles.get('core-provenance'), true);
  assert.equal(provenance.repository, 'werg/tendriller'); assert.equal(provenance.source, source);
  assert.equal(provenance.sourceTree, manifest.source_tree); assert.equal(provenance.dirty, false);
  assert(Array.isArray(composition.components) && composition.components.length <= 32);
  assert(Array.isArray(provenance.artifacts) && provenance.artifacts.length <= 32);
  for (const role of ['sdk', 'engine']) {
    const artifact = roles.get(role);
    assert.equal(artifact.file, `tendriller-${role}-${manifest.version}.tgz`);
    const component = composition.components.filter(item => item.role === role);
    const proof = provenance.artifacts.filter(item => item.file === artifact.file);
    assert.equal(component.length, 1); assert.equal(proof.length, 1);
    for (const key of ['file', 'sha256', 'size']) {
      assert.equal(component[0][key], artifact[key], `Composition ${role} mismatch`);
      if (key !== 'size' || proof[0].size !== undefined) assert.equal(proof[0][key], artifact[key], `Provenance ${role} mismatch`);
    }
    await download(artifact.file, artifact);
  }
  // Retain the original manifest last. Only SDK/engine and their complete
  // composition/provenance proofs are needed by these independent consumers.
  mkdirSync(output, { recursive: true });
  for (const [file, bytes] of saved) if (file !== 'manifest.json') writeFileSync(join(output, file), bytes);
  writeFileSync(join(output, 'manifest.json'), saved.get('manifest.json'));
  return { source, chronologSource, compositionId: id, manifestSha256: hash(saved.get('manifest.json')) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: 'string' }, 'chronolog-source': { type: 'string' }, output: { type: 'string' } } });
  assert(values.output, 'Provide --output');
  console.log(JSON.stringify(await downloadCoreRelease({ source: values.source, chronologSource: values['chronolog-source'], output: resolve(values.output) })));
}
