import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const fakeGh = `#!/usr/bin/env node
import {copyFileSync,existsSync,readFileSync,readdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {basename,join} from 'node:path';
const args=process.argv.slice(2),root=process.env.TEST_RELEASE_ROOT;
appendFileSync(join(root,'commands.jsonl'),JSON.stringify(args)+'\\n');
const tag=join(root,'tag'),assets=join(root,'assets');
if(args[1]==='view'){
 if(!existsSync(tag))process.exit(1);
 console.log(JSON.stringify({tagName:readFileSync(tag,'utf8'),assets:readdirSync(assets).map(name=>({name}))}));
}else if(args[1]==='create'){
 if(existsSync(tag))process.exit(1);writeFileSync(tag,args[2]);
}else if(args[1]==='download'){
 const name=args[args.indexOf('--pattern')+1],directory=args[args.indexOf('--dir')+1];
 copyFileSync(join(assets,name),join(directory,name));
}else if(args[1]==='upload'){
 const destination=join(assets,basename(args[3]));if(existsSync(destination))process.exit(1);
 copyFileSync(args[3],destination);
}else process.exit(2);
`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'contrib-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['bin', 'dist', 'distribution', 'remote/assets']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(new URL('../publish-release.mjs', import.meta.url), join(root, 'distribution/publish-release.mjs'));
  writeFileSync(join(root, 'bin/gh'), fakeGh); chmodSync(join(root, 'bin/gh'), 0o755);
  writeFileSync(join(root, 'bin/package.json'), '{"type":"module"}');
  const bytes = Buffer.from('immutable release bytes\n');
  writeFileSync(join(root, 'dist/tool.mjs'), bytes);
  writeFileSync(join(root, 'dist/manifest.json'), JSON.stringify({ version: '1.2.3', artifacts: [{ file: 'tool.mjs', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }] }));
  return {
    root,
    publish: () => spawnSync(process.execPath, [join(root, 'distribution/publish-release.mjs'), 'v1.2.3'], { encoding: 'utf8', env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, TEST_RELEASE_ROOT: join(root, 'remote') } }),
    commands: () => existsSync(join(root, 'remote/commands.jsonl')) ? readFileSync(join(root, 'remote/commands.jsonl'), 'utf8').trim().split('\n').map(JSON.parse) : [],
  };
}

test('release publication creates an absent release and uploads the manifest last', t => {
  const f = fixture(t), result = f.publish();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(f.commands().some(command => command[1] === 'create' && command.includes('--verify-tag')));
  const uploads = f.commands().filter(command => command[1] === 'upload');
  assert.deepEqual(uploads.map(command => command[3].split('/').at(-1)), ['tool.mjs', 'manifest.json']);
});

test('release publication verifies existing assets and uploads only missing names', t => {
  const f = fixture(t);
  writeFileSync(join(f.root, 'remote/tag'), 'v1.2.3');
  copyFileSync(join(f.root, 'dist/tool.mjs'), join(f.root, 'remote/assets/tool.mjs'));
  const result = f.publish();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.commands().filter(command => command[1] === 'download').length, 1);
  assert.deepEqual(f.commands().filter(command => command[1] === 'upload').map(command => command[3].split('/').at(-1)), ['manifest.json']);
  writeFileSync(join(f.root, 'remote/commands.jsonl'), '');
  assert.equal(f.publish().status, 0);
  assert.equal(f.commands().filter(command => command[1] === 'upload').length, 0);
});

test('release publication rejects mismatched published bytes before any upload', t => {
  const f = fixture(t);
  writeFileSync(join(f.root, 'remote/tag'), 'v1.2.3');
  writeFileSync(join(f.root, 'remote/assets/tool.mjs'), 'different bytes');
  const result = f.publish();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Published release asset differs/);
  assert.equal(f.commands().filter(command => command[1] === 'upload').length, 0);
});

test('release publication rejects corrupt local artifacts before invoking the release API', t => {
  const f = fixture(t);
  writeFileSync(join(f.root, 'dist/tool.mjs'), 'corrupt local bytes');
  const result = f.publish();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match manifest/);
  assert.deepEqual(f.commands(), []);
});
