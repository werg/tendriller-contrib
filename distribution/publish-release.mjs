import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
const tag = process.argv[2];
if (tag !== `v${manifest.version}`) throw new Error('The release tag must match the built manifest version.');
const files = [...manifest.artifacts.map(artifact => artifact.file), 'manifest.json'];
if (new Set(files).size !== files.length) throw new Error('Release asset names must be unique.');
for (const artifact of manifest.artifacts) {
  if (artifact.file !== basename(artifact.file) || !/^[a-zA-Z0-9._-]+$/.test(artifact.file)) {
    throw new Error(`Invalid release asset name: ${artifact.file}`);
  }
  const bytes = readFileSync(join(dist, artifact.file));
  if (bytes.length !== artifact.size || createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) {
    throw new Error(`Built release asset does not match manifest: ${artifact.file}`);
  }
}

const view = () => spawnSync('gh', ['release', 'view', tag, '--json', 'tagName,assets'], { encoding: 'utf8' });
let release = view();
if (release.status !== 0) {
  execFileSync('gh', ['release', 'create', tag, '--verify-tag', '--generate-notes', '--prerelease'], { stdio: 'inherit' });
  release = view();
}
if (release.status !== 0) throw new Error(release.stderr || 'Unable to inspect release.');
const remote = JSON.parse(release.stdout);
if (remote.tagName !== tag) throw new Error('The inspected release does not match the requested tag.');
const existing = new Set(remote.assets.map(asset => asset.name));
const temporary = mkdtempSync(join(tmpdir(), 'tendriller-release-'));
try {
  // Check every existing name before uploading anything. Published bytes are immutable.
  for (const file of files.filter(file => existing.has(file))) {
    execFileSync('gh', ['release', 'download', tag, '--pattern', file, '--dir', temporary], { stdio: 'inherit' });
    const comparison = spawnSync('cmp', ['--', join(dist, file), join(temporary, file)], { stdio: 'ignore' });
    if (comparison.status !== 0) throw new Error(`Published release asset differs from the build: ${file}`);
  }
  // Publish the manifest last so discovery follows successful upload of its complete graph.
  for (const file of files.filter(file => !existing.has(file))) {
    execFileSync('gh', ['release', 'upload', tag, join(dist, file)], { stdio: 'inherit' });
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
console.log(`Verified immutable release ${tag}: ${files.length} assets.`);
