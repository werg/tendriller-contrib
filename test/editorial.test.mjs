import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseCookbook, agentPrompt, readingCatalog, validateLocalLinks } from '../distribution/catalog.mjs';
import { gallery } from '../distribution/gallery.mjs';
const minimal='---\nid: useful-task\ntitle: A useful task\nsummary: Choose an approach.\n---\n\nA free-form guide with no prescribed headings.';
test('minimum metadata leaves body and optional organization free',()=>{
 const value=parseCookbook(minimal);assert.equal(value.metadata.id,'useful-task');assert.match(value.body,/free-form/);
 assert.deepEqual(parseCookbook(minimal.replace('summary: Choose an approach.','summary: Choose an approach.\ntags: [drafts, recovery]')).metadata.tags,['drafts','recovery']);
});
test('ambiguous or invalid metadata fails at the source',()=>{
 for(const source of [minimal.replace('id: useful-task','id: ../task'),minimal.replace('title: A useful task','title: ""'),minimal.replace('summary:','id: duplicate\nsummary:'),minimal.replace('summary: Choose an approach.','summary: Choose an approach.\nrelated: other-guide')])assert.throws(()=>parseCookbook(source));
});
test('reading catalog and prompts never create an install graph',()=>{
 const entry={...parseCookbook(minimal).metadata,path:'cookbooks/useful-task/COOKBOOK.md',body:'private body'};
 const catalog=readingCatalog([entry]);assert.equal(catalog.format,'tendriller-cookbooks');assert.ok(!('body' in catalog.cookbooks[0]));
 assert.match(readingCatalog([entry], 'https://example.test/exact-revision').cookbooks[0].prompt, /^Read https:\/\/example.test\/exact-revision\//);
 assert.match(agentPrompt(entry),/Reading this cookbook does not install software/);assert.doesNotMatch(agentPrompt(entry),/scaffold|sessions\.activate|tendrilSnippets/);
});
test('gallery treats author-controlled metadata and prompts as text',()=>{
 const entry={id:'test',title:'</h2><script>alert(1)</script>',summary:'" onmouseover="alert(1)',path:'cookbooks/test/COOKBOOK.md',group:'<unsafe>',choices:['<img src=x onerror=alert(1)>'],tags:['<b>'],evidence:'explained'};
 const html=gallery([entry]);assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;img'));assert.match(html,/Read the approach/);assert.match(html,/Use with my agent/);
});
test('local links reject missing, escaping, and executable targets',()=>{
 const temporary=new URL('../test-results/',import.meta.url);mkdirSync(temporary,{recursive:true});
 const root=mkdtempSync(join(temporary.pathname,'cookbook-links-'));
 try{mkdirSync(join(root,'guide'));writeFileSync(join(root,'guide','COOKBOOK.md'),'[missing](no.md) [escape](../../outside) [code](javascript:alert) [remote](https://example.test/a)');
 const errors=validateLocalLinks(root,[join(root,'guide','COOKBOOK.md')]);assert.equal(errors.length,3);assert.ok(errors.some(e=>e.includes('escapes')));assert.ok(errors.some(e=>e.includes('unsupported')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
