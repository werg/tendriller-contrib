import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Public source pair exercised by the hosted discovery consumer qualification.
const chronolog = '1e4e8406499f3aff0da988046103d0900ca2bd42';
const core = '722d6725fc5d659f77f844642f523125f1ef271c';
for (const name of ['peer-generation', 'collaboration']) {
  test(`${name} manual defaults and ordinary CI select the same immutable companion pair`, () => {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
    const defaults = [...workflow.matchAll(/default: '([a-f0-9]{40})'/g)].map(match => match[1]);
    const ordinary = [...workflow.matchAll(/inputs\.\w+_ref \|\| '([a-f0-9]{40})'/g)].map(match => match[1]);
    assert.deepEqual(defaults, [chronolog, core]);
    assert.deepEqual(ordinary, defaults);
  });
}
