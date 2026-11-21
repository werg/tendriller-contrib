// Pins have one source: the content-addressed tuple, not this test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { select } from '../distribution/select-companion-release.mjs';
const tuple = JSON.parse(readFileSync(new URL('../distribution/companion-release.json', import.meta.url)));
test('peer-generation consumes the canonical tuple and retains exact checkout checks', () => {
  const selected = select(tuple, 'contrib');
  const text = readFileSync(new URL('../.github/workflows/peer-generation.yml', import.meta.url), 'utf8');
  assert.ok(Object.values(selected).every(value => /^[a-f0-9]{40}$/.test(value)));
  assert.ok(text.includes('node distribution/select-companion-release.mjs contrib'));
  assert.doesNotMatch(text, /inputs\.\w+_ref \|\| '[a-f0-9]{40}'/);
  assert.ok(text.includes('distribution/download-core-release.mjs'));
  assert.equal(text.split("- 'distribution/companion-release.json'").length - 1, 2);
  for (const key of ['CHRONOLOG_REF']) {
    assert.ok(text.includes('ref: \u0024{{ env.' + key + ' }}'));
    assert.ok(text.includes('= "$' + key + '"'));
  }
});
test('collaboration consumes the canonical tuple and retains exact checkout checks', () => {
  const selected = select(tuple, 'contrib');
  const text = readFileSync(new URL('../.github/workflows/collaboration.yml', import.meta.url), 'utf8');
  assert.ok(Object.values(selected).every(value => /^[a-f0-9]{40}$/.test(value)));
  assert.ok(text.includes('node distribution/select-companion-release.mjs contrib'));
  assert.doesNotMatch(text, /inputs\.\w+_ref \|\| '[a-f0-9]{40}'/);
  assert.ok(text.includes('distribution/download-core-release.mjs'));
  assert.equal(text.split("- 'distribution/companion-release.json'").length - 1, 2);
  for (const key of ['CHRONOLOG_REF']) {
    assert.ok(text.includes('ref: \u0024{{ env.' + key + ' }}'));
    assert.ok(text.includes('= "$' + key + '"'));
  }
});
