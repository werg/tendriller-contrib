import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Native and browser gates verify and record one installed public artifact. */
export async function verifyPeerSessionArtifact({ installed, archive, allowDirty = false }) {
  const metadata = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
  assert.equal(metadata.name, '@chronolog/peer-session');
  const provenanceBytes = await readFile(join(installed, 'provenance.json'));
  const provenance = JSON.parse(provenanceBytes);
  assert.deepEqual(metadata.dependencies, { 'better-sqlite3': '13.2.0', werift: '0.27.0' });
  assert.deepEqual(metadata.optionalDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependenciesMeta ?? {}, {});
  assert.ok(metadata.exports?.['./webrtc-native'], 'The standard package must expose its native factory');
  assert.equal(provenance.nativeRtc, true, 'The standard package must include native RTC');
  assert.match(provenance.source, /^[a-f0-9]{40}$/u);
  assert.match(provenance.sourceTree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof provenance.dirty, 'boolean');
  if (!allowDirty) assert.equal(provenance.dirty, false, 'Qualification requires a clean-source artifact');
  assert.ok(Object.keys(provenance.sha256 ?? {}).length > 0, 'Package must record content digests');
  assert.ok(Object.keys(provenance.runtimeModules ?? {}).length > 0, 'Package must record its runtime module graph');
  for (const [name, digest] of Object.entries(provenance.sha256)) {
    const path = resolve(installed, name), scoped = relative(installed, path);
    assert.ok(scoped && !isAbsolute(scoped) && scoped !== '..' && !scoped.startsWith(`..${sep}`), 'Package hash path escapes its archive');
    assert.equal(hash(await readFile(path)), digest, `Package content digest mismatch: ${name}`);
  }
  return { metadata, provenance, artifact: {
    name: metadata.name, version: metadata.version, sha256: hash(await readFile(archive)),
    sourceCommit: provenance.source, sourceTree: provenance.sourceTree, sourceDirty: provenance.dirty,
    provenance: { sha256: hash(provenanceBytes), profile: provenance.profile, nativeRtc: provenance.nativeRtc,
      sqlEngines: provenance.sqlEngines, runtimeModules: provenance.runtimeModules, files: provenance.sha256 },
  } };
}
