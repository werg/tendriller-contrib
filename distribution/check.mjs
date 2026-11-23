import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { readCookbooks, validateLocalLinks, walk } from './catalog.mjs';
import { publicSourceViolations } from './public-boundaries.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const entries=readCookbooks(root);
const paths=[...walk(resolve(root,'cookbooks')),...walk(resolve(root,'guides')),resolve(root,'README.md'),resolve(root,'PROVENANCE.md'),resolve(root,'agent.md')];
const errors=validateLocalLinks(root,paths.filter(path=>path.endsWith('.md')));
assert.deepEqual(errors,[],errors.join('\n'));
for(const path of ['components','recipes','examples','tools','workflows','core.lock.json','vendor'])assert.ok(!existsSync(resolve(root,path)),`Retired product surface remains: ${path}`);
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
assert.ok(!pkg.bin&&!pkg.exports,'Cookbook collection must not advertise executable package exports');
for(const entry of entries){assert.ok(!(entry.dependencies||entry.requires),'Reading catalog must not define an install graph');for(const source of entry.sources||[])assert.match(source,/^https:\/\/github\.com\/werg\/(?:tendriller|tendriller-contrib|chronolog-db)\/(?:blob|tree)\/[a-f0-9]{40}\//,'Sources should pin reviewed revision');}
for (const path of paths.filter(path => /\.(?:m?js|ts|html|md)$/.test(path))) {
  const violations = publicSourceViolations(readFileSync(path, 'utf8'), { markdown: path.endsWith('.md') });
  assert.deepEqual(violations, [], `${relative(root, path)}: ${violations.join('; ')}`);
}
console.log(`Validated ${entries.length} guides, local reading links, and public boundaries.`);
