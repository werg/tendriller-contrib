import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';

export const snapshotContentPaths = Object.freeze(['cookbooks', 'guides', 'README.md', 'PROVENANCE.md',
  'catalog.json', 'index.html', 'agent.md', 'llms.txt', 'distribution/source-map.json']);

// A requested source label must describe this checkout, never supply identity
// for bytes that Git cannot identify. Ignored build/dependency outputs are fine;
// untracked authored files still make a snapshot dirty.
export function snapshotSource(root, requested) {
  if (requested !== undefined) assert.match(requested, /^[a-f0-9]{40}$/, 'SOURCE_COMMIT must be a full Git commit SHA');
  const git = args => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  let commit, dirty;
  try {
    commit = git(['rev-parse', 'HEAD']);
    dirty = Boolean(git(['status', '--porcelain', '--untracked-files=all'])) ||
      Boolean(git(['ls-files', '--others', '--ignored', '--exclude-standard', '--', ...snapshotContentPaths]));
  } catch {
    assert.equal(requested, undefined, 'Cannot verify SOURCE_COMMIT without a Git checkout');
    return { commit: null, dirty: true };
  }
  assert.match(commit, /^[a-f0-9]{40}$/);
  if (requested !== undefined) assert.equal(requested, commit, 'SOURCE_COMMIT differs from the actual checkout');
  return { commit, dirty };
}


// Preserve preflight label validation, then observe again after content copying.
// A clean tree at a different revision cannot identify a mixed copied snapshot.
export function finishSnapshotSource(root, initial, requested, copiedRoot) {
  const final = snapshotSource(root, requested);
  assert.equal(final.commit, initial.commit, 'Source revision changed during snapshot copy');
  assert.equal(typeof copiedRoot, 'string', 'Copied snapshot directory is required');
  return { commit: final.commit, dirty: initial.dirty || final.dirty || !copiedSnapshotMatches(root, final.commit, copiedRoot) };
}

// Compare the actual copied bytes with the selected Git tree, even if an edit
// was restored between the two source observations. No filters may normalize
// altered bytes into an apparently clean blob.
function copiedSnapshotMatches(root, commit, copiedRoot) {
  if (!commit) return false;
  const git = (args, input) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', input, timeout: 10000, maxBuffer: 16 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const expected = new Map(git(['ls-tree', '-r', '-z', commit, '--', ...snapshotContentPaths])
    .split('\0').filter(Boolean).map(row => {
      const tab = row.indexOf('\t'), [mode, type, oid] = row.slice(0, tab).split(' ');
      assert.equal(type, 'blob', 'Snapshot content must be regular Git files');
      assert(['100644', '100755'].includes(mode), 'Snapshot content must not contain symlinks');
      return [row.slice(tab + 1), oid];
    }));
  const files = [];
  const visit = directory => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name), stat = lstatSync(path);
      if (stat.isDirectory()) visit(path);
      else { assert(stat.isFile(), 'Copied snapshot must contain only regular files'); files.push(path); }
    }
  };
  visit(copiedRoot);
  if (files.length !== expected.size) return false;
  const hashes = files.length ? git(['hash-object', '--no-filters', '--stdin-paths'], files.map(path => JSON.stringify(path)).join('\n') + '\n').trim().split('\n') : [];
  return files.every((path, index) => expected.get(relative(copiedRoot, path).replaceAll('\\', '/')) === hashes[index]);
}
