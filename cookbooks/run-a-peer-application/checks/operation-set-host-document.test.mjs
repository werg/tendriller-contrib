import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyServedPublication } from './operation-set-host-document.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = '<!doctype html><title>Signed page</title><p>Public bytes</p>', bytes = Buffer.from(source);
const runtime = { id: 'c'.repeat(64), version: '0.0.0-test', base: `/_tendril/runtime/${'c'.repeat(64)}/`, features: { speech: { model: 'm' } } };
const files = [{ path: 'page-0.html', hash: hash(bytes), size: bytes.length, type: 'text/html' }, { path: 'asset.txt', hash: 'e'.repeat(64), size: 3, type: 'text/plain' }];
const receipt = { version: 3, publication: { id: 'a'.repeat(64), payload: { entry: 'page-0.html', files } } };
const safe = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const tags = (base = '/p/x/') => `<link rel="manifest" href="${base}_tendril/manifest.webmanifest" crossorigin="use-credentials">` +
  `<link rel="icon" href="${base}_tendril/icon.svg" type="image/svg+xml" sizes="any"><link rel="apple-touch-icon" href="/_tendril/brand/icon-180.png" sizes="180x180">` +
  '<meta name="theme-color" content="#2d6a4f"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
function config(change = value => value) {
  return change({ id: 'page', base: '/p/x/', version: 3, documentPath: 'page-0.html', application: { id: 'app' }, features: { shared_by: 'x', speech: { model: 'm' } },
    iconRaster: { key: 'k' }, publication: { id: '3', base: '/p/x/_publications/3/', entry: 'page-0.html',
      assets: files.map(file => ({ path: file.path, sha256: file.hash, type: file.type, size: file.size })).reverse(), runtime: structuredClone(runtime) } });
}
const document = ({ install = tags(), value = config(), script = `${runtime.base}tendril.js`, base = '/p/x/_publications/3/', authored = source, extra = '' } = {}) =>
  ({ status: 200, text: `<base href="${base}">${install}<script>window.__TENDRIL__=${safe(value)};</script><script src="${script}"></script>${extra}${authored}` });
const verify = (served, options = {}) => verifyServedPublication({ served, authored: bytes, receipt, path: 'page-0.html', applicationId: 'app', ...options });

test('verifies exact authored bytes separately from the strict injected document', () => {
  const served = document(), result = verify(served);
  assert.equal(result.authoredSourceDigest, hash(bytes)); assert.equal(result.servedDocumentDigest, hash(Buffer.from(served.text)));
  assert.notEqual(result.servedDocumentDigest, result.authoredSourceDigest);
  assert.deepEqual(result.injection, { verified: true, status: 200, authoredSuffixExact: true, publicationId: '3', documentPath: 'page-0.html', runtimeId: runtime.id,
    runtimeVersion: runtime.version, runtimeBase: runtime.base, runtimeScript: `${runtime.base}tendril.js`, metadata: ['apple-touch-icon', 'icon', 'manifest', 'theme-color', 'viewport'] });
});
test('JSON is parsed as data and script-safe escapes are accepted', () => {
  const served = document({ value: config(value => ({ ...value, id: 'a<b>&"\u2028' })) });
  assert.match(served.text, /\\u003cb\\u003e\\u0026/u); assert.equal(verify(served).injection.verified, true);
});
for (const [name, served, options] of [
  ['non-200', { ...document(), status: 404 }],
  ['altered authored bytes', document({ authored: source.replace('Public', 'Altered') })],
  ['extra authored bytes after source', { ...document(), text: `${document().text}<script>evil()</script>` }],
  ['extra bytes before authored source', document({ extra: '<script>evil()</script>' })],
  ['authored bytes not matching signed hash', document(), { authored: Buffer.from(`${source} `) }],
  ['unrelated pre-runtime script', document({ install: `${tags()}<script src="https://evil.test/x.js"></script>` })],
  ['unrelated metadata', document({ install: `${tags()}<meta http-equiv="refresh" content="0;url=https://evil.test">` })],
  ['duplicate metadata', document({ install: `${tags()}<meta name="theme-color" content="#000">` })],
  ['external manifest', document({ install: tags().replace('/p/x/_tendril/manifest.webmanifest', 'https://evil.test/m.json') })],
  ['unpinned runtime script', document({ script: '/_tendril/runtime/latest/tendril.js' })],
  ['runtime from another origin', document({ script: `https://evil.test${runtime.base}tendril.js` })],
  ['wrong runtime base', document({ value: config(value => { value.publication.runtime.base = '/_tendril/runtime/latest/'; return value; }) })],
  ['malformed runtime id', document({ value: config(value => { value.publication.runtime.id = 'latest'; return value; }) })],
  ['unrelated configuration key', document({ value: config(value => ({ ...value, endpoint: 'https://evil.test' })) })],
  ['unrelated publication key', document({ value: config(value => { value.publication.endpoint = 'x'; return value; }) })],
  ['wrong publication', document({ value: config(value => { value.publication.id = '2'; return value; }) })],
  ['wrong version', document({ value: config(value => ({ ...value, version: 2 })) })],
  ['wrong application', document({ value: config(value => ({ ...value, application: { id: 'other' } })) })],
  ['wrong document path', document({ value: config(value => ({ ...value, documentPath: 'page-1.html' })) })],
  ['altered file hash', document({ value: config(value => { value.publication.assets[1].sha256 = 'f'.repeat(64); return value; }) })],
  ['altered file size', document({ value: config(value => { value.publication.assets[1].size++; return value; }) })],
  ['extra asset', document({ value: config(value => { value.publication.assets.push({ path: 'x.js', sha256: 'f'.repeat(64), type: 'text/javascript', size: 1 }); return value; }) })],
  ['missing asset', document({ value: config(value => { value.publication.assets.pop(); return value; }) })],
  ['wrong entry', document({ value: config(value => { value.publication.entry = 'other.html'; return value; }) })],
  ['wrong base href', document({ base: '/elsewhere/' })],
  ['altered runtime feature', document({ value: config(value => ({ ...value, features: { shared_by: 'x', speech: { model: 'other' } } })) })],
  ['unrelated icon raster shape', document({ value: config(value => ({ ...value, iconRaster: { key: 'k', url: 'x' } })) })],
  ['two injections', { ...document(), text: document().text.replace(source, '') + document().text }],
]) test(`rejects ${name}`, () => assert.throws(() => verify(served, options)));
