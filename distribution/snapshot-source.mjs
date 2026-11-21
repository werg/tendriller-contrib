import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

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
