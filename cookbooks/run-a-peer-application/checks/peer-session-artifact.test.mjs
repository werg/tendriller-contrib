import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { verifyPeerSessionArtifact } from './peer-session-artifact.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Synthetic installed bytes test report identity, not runtime qualification.
test('independent native and browser installations preserve the same complete package evidence', async () => {
  const temporary = new URL('../../../test-results/', import.meta.url);
  await mkdir(temporary, { recursive: true });
  const root = await mkdtemp(join(fileURLToPath(temporary), 'peer-artifact-'));
  try {
    const archive = join(root, 'session.tgz'), archiveBytes = Buffer.from('exact synthetic archive');
    const metadata = { name: '@chronolog/peer-session', version: '0.0.0-test', dependencies: { 'better-sqlite3': '13.2.0', werift: '0.27.0' }, exports: { './webrtc-native': './index.mjs' } };
    const entry = 'export const protocol = true;\n', data = 'export const database = true;\n';
    const provenance = { source: 'd'.repeat(40), sourceTree: 'e'.repeat(40), dirty: false,
      profile: 'peer-generation-v1', nativeRtc: true, sqlEngines: [],
      sha256: { 'index.mjs': hash(entry), 'data.mjs': hash(data) },
      runtimeModules: {
        'index.mjs': { inputs: ['packages/peer-session/src/session.ts'], imports: [{ path: 'data.mjs', kind: 'dynamic-import', external: false }] },
        'data.mjs': { inputs: ['packages/peer-session/src/application-data.ts'], imports: [] },
      } };
    const provenanceBytes = Buffer.from(JSON.stringify(provenance));
    await writeFile(archive, archiveBytes);
    const installations = await Promise.all(['native', 'browser'].map(async name => {
      const installed = join(root, name); await mkdir(installed);
      await Promise.all(Object.entries({ 'package.json': JSON.stringify(metadata), 'provenance.json': provenanceBytes,
        'index.mjs': entry, 'data.mjs': data }).map(([path, bytes]) => writeFile(join(installed, path), bytes)));
      return { installed, evidence: await verifyPeerSessionArtifact({ installed, archive }) };
    }));
    const [native, browser] = installations.map(value => value.evidence.artifact);
    assert.deepEqual(native, browser, 'The same archive must have one identity in every gate');
    assert.deepEqual(native.provenance.runtimeModules, provenance.runtimeModules, 'Native evidence must retain the browser lazy-load proof');
    assert.deepEqual(native.provenance.files, provenance.sha256);
    assert.equal(native.provenance.sha256, hash(provenanceBytes));
    assert.equal(native.sha256, hash(archiveBytes));
    for (const bad of [
      { ...metadata, dependencies: {} },
      { ...metadata, dependencies: { werift: '0.27.0' } },
      { ...metadata, dependencies: { 'better-sqlite3': '13.2.0' } },
      { ...metadata, dependencies: { ...metadata.dependencies, 'better-sqlite3': '^13.2.0' } },
      { ...metadata, dependencies: { ...metadata.dependencies, werift: '^0.27.0' } },
      { ...metadata, dependencies: { ...metadata.dependencies, unexpected: '1.0.0' } },
      { ...metadata, peerDependencies: { werift: '0.27.0' } },
      { ...metadata, optionalDependencies: { werift: '0.27.0' } },
      { ...metadata, exports: {} },
    ]) {
      await writeFile(join(installations[0].installed, 'package.json'), JSON.stringify(bad));
      await assert.rejects(verifyPeerSessionArtifact({ installed: installations[0].installed, archive }));
    }
    await writeFile(join(installations[1].installed, 'data.mjs'), 'changed installed bytes');
    await assert.rejects(verifyPeerSessionArtifact({ installed: installations[1].installed, archive }), /Package content digest mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
