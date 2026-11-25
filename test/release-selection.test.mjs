import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectRelease, inspectRelease, profileBytes, ReleaseSelectionError, CURRENT_PROFILES } from '../distribution/release-selection.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const CORE = 'a'.repeat(40), CORE_TREE = 'b'.repeat(40), KERNEL = 'c'.repeat(40), KERNEL_TREE = 'd'.repeat(40), VERSION = '1.2.3-rc.4';
const files = {
  sdk: `tendriller-sdk-${VERSION}.tgz`, runtime: `tendriller-runtime-${VERSION}.tgz`, tools: `tendriller-tools-${VERSION}.tgz`,
  authority: `chronolog-authority-${KERNEL}.tgz`, session: `chronolog-peer-session-${KERNEL}.tgz`,
  'session-sql-browser': `chronolog-peer-session-${KERNEL}-sql-browser.tgz`,
};

// Build a complete synthetic release directory; `mutate` edits the documents before the composition id is sealed.
function release(mutate = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'release-selection-'));
  const components = Object.entries(files).map(([role, file]) => {
    const bytes = Buffer.from(`archive:${role}`);
    writeFileSync(join(dir, file), bytes);
    return { role, file, sha256: sha(bytes), size: bytes.length };
  });
  const source = { repository: 'werg/chronolog-db', source: KERNEL, sourceTree: KERNEL_TREE, dirty: false };
  const body = {
    format: 'tendriller-release-composition-v1', version: VERSION, contract: 3, core: { repository: 'werg/tendriller', source: CORE, sourceTree: CORE_TREE, dirty: false },
    runtime: 'e'.repeat(64), chronolog: { session: source, authority: source, 'session-sql-browser': source },
    profiles: structuredClone(CURRENT_PROFILES), components,
  };
  const manifest = {
    format: 'tendriller-core-release', version: VERSION, contract: 3, source_commit: CORE, source_tree: CORE_TREE, runtime: 'e'.repeat(64),
    artifacts: components.map(item => ({ ...item, url: `https://github.com/werg/tendriller/releases/download/source-${CORE}/${item.file}` })),
  };
  mutate({ body, manifest, dir });
  const id = sha(JSON.stringify(body));
  manifest.composition = { id, file: 'composition.json' };
  writeFileSync(join(dir, 'composition.json'), JSON.stringify({ ...body, id }));
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}
const expectCode = (dir, code) => assert.throws(() => selectRelease(dir), error => error instanceof ReleaseSelectionError && error.code === code, code);
const cleanup = dir => rmSync(dir, { recursive: true, force: true });

test('a complete current release selects exact, hash-verified archives and profile totals', () => {
  const dir = release();
  try {
    const selected = selectRelease(dir);
    assert.deepEqual(Object.keys(selected.components), ['sdk', 'runtime', 'tools', 'authority', 'session', 'session-sql-browser']);
    assert.equal(selected.version, VERSION);
    assert.equal(selected.source.chronolog.source, KERNEL);
    assert.equal(profileBytes(selected, 'events'), ['sdk', 'tools', 'authority', 'session'].reduce((n, r) => n + `archive:${r}`.length, 0));
    assert.equal(inspectRelease(dir).status, 'verified');
  } finally { cleanup(dir); }
});

test('selection is by exact name, so obsolete or extra archives never participate', () => {
  const dir = release();
  try {
    for (const name of ['chronolog-peer-generation-control-deadbeef.tgz', 'chronolog-peer-session-deadbeef.tgz', `tendriller-sdk-0.3.0-rc.17.tgz`,
      `chronolog-peer-session-${'f'.repeat(40)}.tgz`, `tendriller-tools-${VERSION}-old.tgz`]) writeFileSync(join(dir, name), 'stale');
    const selected = selectRelease(dir);
    assert.equal(selected.components.sdk.file, files.sdk);
    assert.equal(selected.components.session.file, files.session);
  } finally { cleanup(dir); }
});

test('the version is read from the release, never hardcoded', () => {
  const dir = release();
  try { assert.match(selectRelease(dir).components.tools.file, /1\.2\.3-rc\.4/); } finally { cleanup(dir); }
});

test('a duplicated or missing role is ambiguous and rejected', () => {
  for (const mutate of [
    ({ manifest }) => manifest.artifacts.push({ ...manifest.artifacts.find(item => item.role === 'sdk') }),
    ({ body }) => body.components.push({ ...body.components.find(item => item.role === 'session') }),
    ({ body }) => { body.components = body.components.filter(item => item.role !== 'authority'); },
  ]) { const dir = release(mutate); try { expectCode(dir, 'ROLE_AMBIGUOUS'); } finally { cleanup(dir); } }
});

test('changed, truncated or missing archive bytes are rejected', () => {
  let dir = release();
  try { writeFileSync(join(dir, files.tools), 'tampered'); expectCode(dir, 'ARCHIVE_DIGEST'); } finally { cleanup(dir); }
  dir = release(({ dir: d }) => rmSync(join(d, files.runtime)));
  try { expectCode(dir, 'ARCHIVE_MISSING'); } finally { cleanup(dir); }
});

test('manifest and composition must agree on every selected archive', () => {
  const dir = release(({ manifest }) => { manifest.artifacts.find(item => item.role === 'sdk').sha256 = '0'.repeat(64); });
  try { expectCode(dir, 'ROLE_RECORD'); } finally { cleanup(dir); }
});

test('dirty or mixed sources and non-current profiles are rejected', () => {
  let dir = release(({ body }) => { body.chronolog.session.dirty = true; });
  try { expectCode(dir, 'SOURCE_NOT_CLEAN'); } finally { cleanup(dir); }
  dir = release(({ body }) => { body.chronolog['session-sql-browser'] = { ...body.chronolog['session-sql-browser'], source: 'f'.repeat(40) }; });
  try { expectCode(dir, 'SOURCE_MISMATCH'); } finally { cleanup(dir); }
  dir = release(({ body }) => { body.profiles = { events: { session: 'session', packages: ['sdk', 'tools', 'authority', 'session', 'control'] }, sql: body.profiles.sql }; });
  try { expectCode(dir, 'PROFILES'); } finally { cleanup(dir); }
  dir = release(({ body }) => { body.core.source = 'f'.repeat(40); });
  try { expectCode(dir, 'SOURCE_MISMATCH'); } finally { cleanup(dir); }
});

test('a tampered composition document fails its identity', () => {
  const dir = release();
  try {
    const path = join(dir, 'composition.json'), value = JSON.parse(readFileSync(path, 'utf8'));
    value.contract = 4; writeFileSync(path, JSON.stringify(value));
    expectCode(dir, 'COMPOSITION_IDENTITY');
  } finally { cleanup(dir); }
});

test('malformed document shapes and incomplete source chains are blocked without crashing', () => {
  for (const document of [null, [], false, 'manifest']) {
    const dir = release();
    try {
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify(document));
      assert.equal(inspectRelease(dir).status, 'blocked');
      expectCode(dir, 'MANIFEST_FORMAT');
    } finally { cleanup(dir); }
  }
  for (const [mutate, code] of [
    [({ body }) => { delete body.chronolog.authority; }, 'SOURCE_NOT_CLEAN'],
    [({ body }) => { body.components = {}; }, 'ROLE_RECORD'],
    [({ manifest }) => { manifest.artifacts = {}; }, 'ROLE_RECORD'],
    [({ body }) => { body.components = [null]; }, 'ROLE_AMBIGUOUS'],
  ]) {
    const dir = release(mutate);
    try { expectCode(dir, code); assert.equal(inspectRelease(dir).status, 'blocked'); }
    finally { cleanup(dir); }
  }
  assert.equal(inspectRelease(null).status, 'blocked');
});

test('an absent or blocked release is reported, not hidden or passed', () => {
  const empty = mkdtempSync(join(tmpdir(), 'release-selection-empty-'));
  try {
    assert.equal(inspectRelease(join(empty, 'dist')).status, 'absent');
    mkdirSync(join(empty, 'dist'));
    assert.equal(inspectRelease(join(empty, 'dist')).status, 'absent');
    writeFileSync(join(empty, 'dist/manifest.json'), '{"format":"old-release"}');
    const blocked = inspectRelease(join(empty, 'dist'));
    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.code, 'MANIFEST_FORMAT');
  } finally { cleanup(empty); }
});
