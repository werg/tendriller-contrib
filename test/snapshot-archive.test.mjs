import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { packSnapshot } from '../distribution/snapshot-archive.mjs';

function readEntries(bytes) {
  const tar = gunzipSync(bytes), entries = [];
  const field = (header, a, b) => header.subarray(a, b).toString('utf8').replace(/\0.*$/s, '');
  let offset = 0;
  while (tar[offset]) {
    const header = tar.subarray(offset, offset + 512);
    const checksum = Number.parseInt(field(header, 148, 154), 8);
    const checked = Buffer.from(header); checked.fill(32, 148, 156);
    assert.equal(checksum, checked.reduce((total, byte) => total + byte, 0));
    assert.equal(field(header, 136, 148), '00000000000');
    const prefix = field(header, 345, 500), name = field(header, 0, 100);
    const size = Number.parseInt(field(header, 124, 136), 8);
    entries.push({ name: prefix ? prefix + '/' + name : name, data: tar.subarray(offset + 512, offset + 512 + size).toString() });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert.deepEqual(tar.subarray(offset), Buffer.alloc(1024)); return entries;
}

test('UTF-8 paths round-trip across byte-width boundary with valid header checksums', () => {
  const root = mkdtempSync(join(tmpdir(), 'cookbook-tar-'));
  try {
    const dir = 'é'.repeat(40), name = 'é'.repeat(30) + '.md';
    mkdirSync(join(root, dir)); writeFileSync(join(root, dir, name), 'unicode content');
    assert.deepEqual(readEntries(packSnapshot(root)), [{ name: dir + '/' + name, data: 'unicode content' }]);
    writeFileSync(join(root, 'é'.repeat(51)), 'too long');
    assert.throws(() => packSnapshot(root), /USTAR byte limits/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('repeated packages preserve bytes, stable file order and platform-independent data modes', () => {
  const root = mkdtempSync(join(tmpdir(), 'cookbook-tar-'));
  try {
    writeFileSync(join(root, 'b.txt'), 'second'); writeFileSync(join(root, 'a.txt'), 'first');
    const first = packSnapshot(root); chmodSync(join(root, 'a.txt'), 0o755);
    assert.deepEqual(packSnapshot(root), first);
    assert.deepEqual(readEntries(first).map(entry => entry.name), ['a.txt', 'b.txt']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a linked file cannot export bytes outside the authored snapshot', { skip: process.platform === 'win32' }, () => {
  const root = mkdtempSync(join(tmpdir(), 'cookbook-tar-'));
  try { symlinkSync('/etc/hosts', join(root, 'outside')); assert.throws(() => packSnapshot(root), /regular files/); }
  finally { rmSync(root, { recursive: true, force: true }); }
});
