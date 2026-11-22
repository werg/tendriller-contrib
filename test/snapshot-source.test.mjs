import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { snapshotSource, finishSnapshotSource } from '../distribution/snapshot-source.mjs';

function checkout(t) {
  const root = mkdtempSync(join(tmpdir(), 'cookbook-source-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--template=', '--quiet');
  writeFileSync(join(root, '.gitignore'), 'dist/\nnode_modules/\ncookbooks/*.local\n');
  writeFileSync(join(root, 'guide.md'), 'Tracked source\n');
  git('add', '.');
  git('-c', 'user.name=Snapshot test', '-c', 'user.email=snapshot@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Initial snapshot');
  return { root, commit: git('rev-parse', 'HEAD'), git };
}

test('clean snapshots bind an asserted source to the actual checkout', t => {
  const { root, commit } = checkout(t);
  assert.deepEqual(snapshotSource(root), { commit, dirty: false });
  assert.deepEqual(snapshotSource(root, commit), { commit, dirty: false });
  assert.throws(() => snapshotSource(root, 'f'.repeat(40)), /differs from the actual checkout/);
  assert.throws(() => snapshotSource(root, 'main'), /full Git commit SHA/);
});

test('untracked authored files cannot be packaged as a clean source', t => {
  const { root, commit } = checkout(t);
  mkdirSync(join(root, 'cookbooks'));
  writeFileSync(join(root, 'cookbooks/new-guide.md'), 'Not in the selected commit\n');
  assert.deepEqual(snapshotSource(root, commit), { commit, dirty: true });
});


test('ignored files inside exported content cannot claim clean provenance', t => {
  const { root, commit } = checkout(t);
  mkdirSync(join(root, 'cookbooks'));
  writeFileSync(join(root, 'cookbooks/private.local'), 'Ignored but included by the snapshot copy\n');
  assert.equal(execFileSync('git', ['check-ignore', 'cookbooks/private.local'], { cwd: root, encoding: 'utf8' }).trim(), 'cookbooks/private.local');
  assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).trim(), '');
  assert.deepEqual(snapshotSource(root, commit), { commit, dirty: true });
});

test('tracked source edits remain dirty while ignored outputs do not', t => {
  const { root, commit } = checkout(t);
  for (const name of ['dist', 'node_modules']) {
    mkdirSync(join(root, name)); writeFileSync(join(root, name, 'generated'), 'Ignored\n');
  }
  assert.deepEqual(snapshotSource(root), { commit, dirty: false });
  writeFileSync(join(root, 'guide.md'), 'Modified source\n');
  assert.deepEqual(snapshotSource(root), { commit, dirty: true });
});

test('a source export without Git stays unverified and cannot assert an immutable source', t => {
  const root = mkdtempSync(join(tmpdir(), 'cookbook-export-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(snapshotSource(root), { commit: null, dirty: true });
  assert.throws(() => snapshotSource(root, 'a'.repeat(40)), /Cannot verify SOURCE_COMMIT/);
});


test('post-copy observation marks an edit included in the copied bytes dirty', t => {
  const { root, commit } = checkout(t), initial = snapshotSource(root, commit);
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'guide.md'), 'Edit after source preflight\n');
  cpSync(join(root, 'guide.md'), join(root, 'dist/guide.md'));
  assert.equal(readFileSync(join(root, 'dist/guide.md'), 'utf8'), 'Edit after source preflight\n');
  assert.deepEqual(finishSnapshotSource(root, initial, commit), { commit, dirty: true });
});

test('a clean new commit during copying cannot relabel the copied snapshot', t => {
  const { root, git } = checkout(t), initial = snapshotSource(root);
  writeFileSync(join(root, 'guide.md'), 'Another clean source revision\n'); git('add', 'guide.md');
  git('-c', 'user.name=Snapshot test', '-c', 'user.email=snapshot@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'New revision');
  assert.equal(snapshotSource(root).dirty, false);
  assert.throws(() => finishSnapshotSource(root, initial), /Source revision changed during snapshot copy/);
});

test('a dirty preflight stays unverified even if the source is restored before the final observation', t => {
  const { root, commit, git } = checkout(t);
  writeFileSync(join(root, 'guide.md'), 'Copied intermediate edit\n');
  const initial = snapshotSource(root, commit);
  mkdirSync(join(root, 'dist')); cpSync(join(root, 'guide.md'), join(root, 'dist/guide.md'));
  git('checkout', '--', 'guide.md'); assert.equal(snapshotSource(root).dirty, false);
  assert.deepEqual(finishSnapshotSource(root, initial, commit), { commit, dirty: true });
});
