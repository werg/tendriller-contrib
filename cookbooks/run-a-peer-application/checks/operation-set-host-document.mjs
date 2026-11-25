// Public-consumer verification of a served authored HTML document. The host
// serves the immutable signed source bytes behind its own injected runtime
// prefix (base, install metadata, JSON configuration, pinned runtime script).
// Only JSON is parsed here; no served script is ever executed.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const unescapeAttribute = value => value.replace(/&lt;/gu, '<').replace(/&quot;/gu, '"').replace(/&amp;/gu, '&');
const PREFIX = /^<base href="([^"<>]*)">((?:<(?:link|meta)\b[^<>]*>)*)<script>window\.__TENDRIL__=([^<>]*);<\/script><script src="([^"<>]*)"><\/script>$/u;
const VIEWPORT = 'width=device-width,initial-scale=1,viewport-fit=cover';

function attributes(tag) {
  const match = /^<(link|meta)((?: [a-z-]+="[^"<>]*")+)>$/u.exec(tag);
  assert.ok(match, `Unexpected injected tag ${tag}`);
  return { name: match[1], pairs: [...match[2].matchAll(/ ([a-z-]+)="([^"<>]*)"/gu)].map(pair => [pair[1], unescapeAttribute(pair[2])]) };
}
const sameKeys = (pairs, keys) => pairs.length === keys.length && pairs.every(([key], index) => key === keys[index]);
const href = value => /^(?:\/(?!\/)|data:image\/|https:\/\/)/u.test(value);
// Exactly the install defaults the host may add to a document that authored none.
function installTags(markup, base) {
  const seen = new Set(), tags = markup.match(/<(?:link|meta)\b[^<>]*>/gu) ?? [];
  assert.equal(tags.join(''), markup, 'Injected install metadata must be only link and meta tags');
  for (const tag of tags) {
    const { name, pairs } = attributes(tag), map = new Map(pairs);
    let kind;
    if (name === 'link' && map.get('rel') === 'manifest') {
      kind = 'manifest'; assert.ok(sameKeys(pairs, ['rel', 'href', 'crossorigin'])); assert.equal(map.get('crossorigin'), 'use-credentials');
      assert.equal(map.get('href'), `${base}_tendril/manifest.webmanifest`);
    } else if (name === 'link' && map.get('rel') === 'icon') {
      kind = 'icon'; assert.ok(sameKeys(pairs, ['rel', 'href', 'type', 'sizes']) || sameKeys(pairs, ['rel', 'href', 'sizes']) || sameKeys(pairs, ['rel', 'href', 'type']));
      assert.ok(href(map.get('href'))); if (map.has('sizes')) assert.equal(map.get('sizes'), 'any'); if (map.has('type')) assert.match(map.get('type'), /^image\/[a-z0-9.+-]+$/u);
    } else if (name === 'link' && map.get('rel') === 'apple-touch-icon') {
      kind = 'apple-touch-icon'; assert.ok(sameKeys(pairs, ['rel', 'href']) || sameKeys(pairs, ['rel', 'href', 'sizes'])); assert.ok(href(map.get('href')));
      if (map.has('sizes')) assert.match(map.get('sizes'), /^[0-9]+x[0-9]+$/u);
    } else if (name === 'meta' && map.get('name') === 'theme-color') {
      kind = 'theme-color'; assert.ok(sameKeys(pairs, ['name', 'content'])); assert.match(map.get('content'), /^#[0-9a-f]{3,8}$/iu);
    } else if (name === 'meta' && map.get('name') === 'apple-mobile-web-app-title') {
      kind = 'apple-mobile-web-app-title'; assert.ok(sameKeys(pairs, ['name', 'content']));
    } else if (name === 'meta' && map.get('name') === 'viewport') {
      kind = 'viewport'; assert.ok(sameKeys(pairs, ['name', 'content'])); assert.equal(map.get('content'), VIEWPORT);
    } else assert.fail(`Unrelated injected metadata ${tag}`);
    assert.ok(!seen.has(kind), `Duplicate injected ${kind}`); seen.add(kind);
  }
  return [...seen].sort();
}

/**
 * Verifies that `served` is exactly the host's strict runtime injection followed
 * by the exact authored bytes of one signed publication file.
 * `receipt` is the host's {publication, version}; `authored` the original bytes.
 */
export function verifyServedPublication({ served, authored, receipt, path, applicationId }) {
  assert.equal(served?.status, 200, 'The served publication document must be HTTP 200'); assert.equal(typeof served.text, 'string');
  const signed = receipt.publication.payload, file = signed.files.find(value => value.path === path);
  assert.ok(file, `Signed publication does not contain ${path}`); assert.match(file.type, /^text\/html(?:;|$)/u);
  const source = Buffer.from(authored), sourceText = source.toString('utf8');
  assert.equal(Buffer.from(sourceText, 'utf8').equals(source), true, 'Authored source must be valid UTF-8');
  assert.equal(hash(source), file.hash, 'Authored bytes must match the signed file hash'); assert.equal(source.length, file.size);
  assert.ok(served.text.endsWith(sourceText), 'Served document must end with the exact authored bytes');
  const prefix = served.text.slice(0, served.text.length - sourceText.length), match = PREFIX.exec(prefix);
  assert.ok(match, 'Served document must begin with exactly one strict runtime injection');
  const [, baseHref, install, json, script] = match;
  const config = JSON.parse(json);
  assert.ok(plain(config)); const allowed = ['id', 'base', 'version', 'documentPath', 'application', 'peerBootstrap', 'iconRaster', 'features', 'publication'];
  assert.deepEqual(Object.keys(config).filter(key => !allowed.includes(key)), [], 'Unrelated injected configuration');
  for (const key of ['id', 'base', 'version', 'documentPath', 'application', 'features', 'publication']) assert.ok(key in config, `Missing injected ${key}`);
  assert.equal(typeof config.id, 'string'); assert.ok(config.id.length > 0);
  assert.match(config.base, /^\/(?:[^/?#"<>]+\/)*$/u);
  assert.equal(config.version, receipt.version); assert.equal(config.documentPath, path);
  assert.deepEqual(config.application, { id: applicationId });
  if ('iconRaster' in config) assert.ok(plain(config.iconRaster) && Object.keys(config.iconRaster).join() === 'key' && typeof config.iconRaster.key === 'string');
  if ('peerBootstrap' in config) assert.ok(plain(config.peerBootstrap) && config.peerBootstrap.version === 2 && Array.isArray(config.peerBootstrap.endpoints));
  assert.ok(plain(config.features));
  const publication = config.publication;
  assert.ok(plain(publication)); assert.deepEqual(Object.keys(publication).sort(), ['assets', 'base', 'entry', 'id', 'runtime']);
  assert.equal(publication.id, String(receipt.version), 'Injected publication must be the signed publication version');
  assert.equal(publication.base, `${config.base}_publications/${receipt.version}/`);
  assert.equal(publication.entry, signed.entry);
  const byPath = (a, b) => a.path.localeCompare(b.path);
  assert.deepEqual([...publication.assets].sort(byPath), signed.files.map(value => ({ path: value.path, sha256: value.hash, type: value.type, size: value.size })).sort(byPath),
    'Injected asset table must equal the signed file table');
  const directory = path.slice(0, path.lastIndexOf('/') + 1);
  assert.equal(unescapeAttribute(baseHref), publication.base + directory.split('/').map(encodeURIComponent).join('/'));
  const runtime = publication.runtime;
  assert.ok(plain(runtime)); assert.deepEqual(Object.keys(runtime).sort(), ['base', 'features', 'id', 'version']);
  assert.ok(hex(runtime.id), 'Runtime identity must be a SHA-256 release id'); assert.equal(typeof runtime.version, 'string'); assert.ok(runtime.version.length > 0);
  assert.equal(runtime.base, `/_tendril/runtime/${runtime.id}/`); assert.ok(plain(runtime.features));
  assert.equal(unescapeAttribute(script), `${runtime.base}tendril.js`, 'Runtime script must be the pinned release');
  for (const [key, value] of Object.entries(runtime.features)) assert.deepEqual(config.features[key], value, `Pinned runtime feature ${key}`);
  const metadata = installTags(install, config.base);
  return { authoredSourceDigest: hash(source), servedDocumentDigest: hash(Buffer.from(served.text, 'utf8')),
    injection: { verified: true, status: 200, authoredSuffixExact: true, publicationId: publication.id, documentPath: path,
      runtimeId: runtime.id, runtimeVersion: runtime.version, runtimeBase: runtime.base, runtimeScript: `${runtime.base}tendril.js`, metadata } };
}
