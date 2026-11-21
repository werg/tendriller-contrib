import { lstatSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { walk } from './catalog.mjs';

// USTAR widths count UTF-8 bytes, not JavaScript UTF-16 code units.
function splitPath(path) {
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' };
  for (let slash = path.lastIndexOf('/'); slash >= 0; slash = path.lastIndexOf('/', slash - 1)) {
    const prefix = path.slice(0, slash), name = path.slice(slash + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) return { prefix, name };
    if (slash === 0) break;
  }
  throw Error(`Archive path exceeds USTAR byte limits: ${path}`);
}

export function packSnapshot(sourceDir) {
  const files = walk(sourceDir).map(abs => ({ abs, rel: relative(sourceDir, abs).replaceAll('\\', '/') }))
    .sort((a, b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
  const chunks = [];
  for (const { abs, rel } of files) {
    const stat = lstatSync(abs);
    if (!stat.isFile()) throw Error(`Snapshot requires regular files: ${rel}`);
    const data = readFileSync(abs), { name, prefix } = splitPath(rel);
    const header = Buffer.alloc(512);
    header.write(name, 0, 100, 'utf8');
    // Content-only cookbook files are data, independent of platform mode bits.
    header.write('0000644\0', 100, 8, 'ascii');
    header.write('0000000\0', 108, 8, 'ascii'); header.write('0000000\0', 116, 8, 'ascii');
    const size = data.byteLength.toString(8);
    if (size.length > 11) throw Error(`Snapshot file exceeds USTAR size limits: ${rel}`);
    header.write(size.padStart(11, '0') + '\0', 124, 12, 'ascii');
    header.write('00000000000\0', 136, 12, 'ascii');
    header.fill(0x20, 148, 156); header.write('0', 156, 1, 'ascii');
    header.write('ustar\0', 257, 6, 'ascii'); header.write('00', 263, 2, 'ascii');
    header.write(prefix, 345, 155, 'utf8');
    const sum = header.reduce((total, byte) => total + byte, 0);
    header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
    chunks.push(header, data);
    if (data.byteLength % 512) chunks.push(Buffer.alloc(512 - data.byteLength % 512));
  }
  chunks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(chunks), { level: 9 });
}
