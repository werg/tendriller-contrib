import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const here = import.meta.dirname;
// Every local module the hosted fixture imports (transitively) must be copied into the
// packed consumer by exactly the runners that load it, and be an allowlisted public import.
const localImports = async name => [...(await readFile(join(here, name), 'utf8')).matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"](\.\/[^'"]+)['"]/gu)].map(match => match[1].slice(2));
async function closure(entry) {
  const seen = new Set(), pending = [entry];
  while (pending.length) { const name = pending.pop(); if (!seen.has(name)) { seen.add(name); pending.push(...await localImports(name)); } }
  seen.delete(entry); return [...seen].sort();
}
for (const [runner, condition] of [['run-operation-set.mjs', 'hostSdk'], ['run-operation-set-browser.mjs', 'relay']]) {
  test(`${runner} copies and allowlists every hosted-fixture helper under ${condition}`, async () => {
    const source = await readFile(join(here, runner), 'utf8'), helpers = await closure('operation-set-host-client.mjs');
    assert.ok(helpers.includes('operation-set-host-request.mjs') && helpers.includes('operation-set-host-document.mjs'));
    for (const name of ['operation-set-host-client.mjs', ...helpers]) {
      const copy = source.split('\n').filter(line => line.includes(`['${name}', join(here, '${name}')]`));
      assert.equal(copy.length, 1, `${runner} must copy ${name} exactly once`);
      assert.match(copy[0], new RegExp(`\\.\\.\\.\\(${condition} \\?`, 'u'), `${runner} must copy ${name} only under ${condition}`);
      assert.equal(source.split(`'./${name}'`).length - 1, name === 'operation-set-host-client.mjs' ? 1 : 1, `${runner} must allowlist ./${name} once`);
    }
  });
}
