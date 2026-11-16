import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { readCookbooks, validateLocalLinks, walk } from './catalog.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const entries=readCookbooks(root);
const paths=[...walk(resolve(root,'cookbooks')),...walk(resolve(root,'guides')),resolve(root,'README.md'),resolve(root,'PROVENANCE.md'),resolve(root,'agent.md')];
const errors=validateLocalLinks(root,paths.filter(path=>path.endsWith('.md')));
assert.deepEqual(errors,[],errors.join('\n'));
for(const path of ['components','recipes','examples','tools','workflows','core.lock.json','vendor'])assert.ok(!existsSync(resolve(root,path)),`Retired product surface remains: ${path}`);
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
assert.ok(!pkg.bin&&!pkg.exports,'Cookbook collection must not advertise executable package exports');
for(const entry of entries){assert.ok(!(entry.dependencies||entry.requires),'Reading catalog must not define an install graph');for(const source of entry.sources||[])assert.match(source,/^https:\/\/github\.com\/werg\/(?:tendriller|tendriller-contrib)\/(?:blob|tree)\/[a-f0-9]{40}\//,'Sources should pin reviewed revision');}
for(const path of walk(resolve(root,'cookbooks')).filter(path=>/\.(?:m?js|ts|html)$/.test(path))){const s=readFileSync(path,'utf8');assert.ok(!/tendrilSnippets|TendrilWorkflows|sessions\.activate|tendril\.control\b/.test(s),`${relative(root,path)} retains a retired API`);assert.ok(!/(?:\.\.\/)+tendriller\/(?:server|runtime|contract)\//.test(s),`${relative(root,path)} imports private sibling source`);}
const inventory=JSON.parse(readFileSync(resolve(root,'guides/source-inventory.json'),'utf8'));
assert.equal(new Set(inventory.files.map(file=>file.source)).size,inventory.files.length,'Source inventory must account for each old path once');
assert.equal(inventory.files.length,237,'Source inventory must account for the reviewed baseline');
for(const file of inventory.files)for(const id of file.destinations)if(!id.startsWith('https:'))assert.ok(entries.some(entry=>entry.id===id),`Unknown inventory destination ${id}`);
console.log(`Validated ${entries.length} guides, local reading links, public boundaries, and ${inventory.files.length} source decisions.`);
