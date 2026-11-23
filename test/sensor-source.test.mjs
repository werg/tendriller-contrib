import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
const names = ['discover-capabilities', 'follow-location-progress', 'interpret-motion', 'connect-instrument', 'capture-reviewed-evidence'];
test('all sensor snippets parse and import without acquiring browser resources', async () => {
  let modules = 0;
  for (const name of names) {
    const directory = new URL('../cookbooks/' + name + '/snippets/', import.meta.url);
    for (const file of await readdir(directory)) if (file.endsWith('.mjs')) {
      await import(new URL(file, directory)); modules++;
    }
  }
  assert.ok(modules >= 8);
});
