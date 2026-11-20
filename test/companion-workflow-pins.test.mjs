import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Selected immutable companion pair; qualification results are recorded separately.
const chronolog = 'e8bb116a72b5a3d2119729e263f1a1a62dabfa73';
const core = 'c74cad4d9ecde5831a7bc5d71d5e9e13813fae11';
for (const name of ['peer-generation', 'collaboration']) {
  test(`${name} manual defaults and ordinary CI select the same immutable companion pair`, () => {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
    const defaults = [...workflow.matchAll(/default: '([a-f0-9]{40})'/g)].map(match => match[1]);
    const ordinary = [...workflow.matchAll(/inputs\.\w+_ref \|\| '([a-f0-9]{40})'/g)].map(match => match[1]);
    assert.deepEqual(defaults, [chronolog, core]);
    assert.deepEqual(ordinary, defaults);
  });
}

test('companion consumers reuse the published core graph without checking out or rebuilding core', () => {
  for (const name of ['peer-generation', 'collaboration']) {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
    assert.equal(workflow.split("- 'distribution/download-core-release.mjs'").length - 1, 2, 'Both push and PR qualification must observe downloader changes');
    assert.match(workflow, /node distribution\/download-core-release.mjs/);
    assert.match(workflow, /--chronolog-source "\$CHRONOLOG_REF"/);
    assert.match(workflow, /\.tendriller-build\/dist\/manifest.json/);
    assert.match(workflow, /\.tendriller-build\/dist\/composition.json/);
    assert.doesNotMatch(workflow, /repository: werg\/tendriller\n|working-directory: \.tendriller-build|npm run build\n/);
  }
});
