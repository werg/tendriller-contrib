import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { WebSocket } from 'ws';
const run=promisify(execFile), root=fileURLToPath(new URL('../../',import.meta.url)), dist=join(root,'dist');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function workspace(t){const dir=await mkdtemp(join(tmpdir(),'contrib-install-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}

test('installable tools run outside both repositories and every starter resolves its complete asset set',async t=>{
 const dir=await workspace(t),installed=join(dir,'installed');await mkdir(installed);
 await run('tar',['-xzf',join(dist,'tendriller-tools-0.2.0-rc.2.tgz'),'-C',installed]);
 const npmPrefix=join(dir,'npm-install');
 await run('npm',['install','--prefix',npmPrefix,'--offline','--ignore-scripts','--no-audit','--no-fund',join(dist,'tendriller-tools-0.2.0-rc.2.tgz')],{cwd:dir});
 assert.match(await readFile(join(installed,'tools/cli/README.md'),'utf8'),/tendril CLI/);
 assert.ok((await readFile(join(dist,'tendril.mjs'))).length > 10000);
 const cli=join(npmPrefix,'node_modules/@tendriller/contrib/tools/cli/bin/tendril.mjs');
 const {stdout}=await run(process.execPath,[cli,'recipes'],{cwd:dir});
 const recipes=JSON.parse(stdout).recipes;
 assert.ok(recipes.length>=6);
 for(const recipe of recipes){
  const target=join(dir,recipe.id);await run(process.execPath,[cli,'scaffold',recipe.id,target],{cwd:dir});
  const lock=JSON.parse(await readFile(join(target,'tendril.assets.json'),'utf8'));
  assert.equal(lock.requires.contract,2);
  for(const file of lock.files)assert.equal(digest(await readFile(join(target,file.path))),file.sha256,file.path);
  const html=await readFile(join(target,'index.html'),'utf8');assert.doesNotMatch(html,/_tendril\/snippets|github\.com\/.+\.js/);
  for(const source of [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match=>match[1]))if(!/^https?:/.test(source))assert.ok((await readFile(join(target,source))).length,source);
 }
});

test('standalone preview embeds the production runtime, public fixture transport, and declared component closure',async t=>{
 const dir=await workspace(t),script=join(dir,'preview.mjs'),page=join(dir,'page');await cp(join(dist,'tendril-preview.mjs'),script);await mkdir(page);
 await writeFile(join(page,'index.html'),'<!doctype html><head><title>Fixture</title></head><script src="assets/components/input-kit.js"></script><script src="app.js"></script>');
 await writeFile(join(page,'app.js'),'window.fixtureVersion=1;');
 await writeFile(join(page,'tendril.json'),JSON.stringify({components:['input-kit']}));
 const child=spawn(process.execPath,[script,page],{cwd:dir,stdio:['ignore','pipe','pipe']});let output='',errors='';child.stderr.on('data',value=>errors+=value);child.stdout.on('data',value=>output+=value);
 t.after(()=>child.kill('SIGKILL'));
 const deadline=Date.now()+10000;while(!output.includes('\n')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));
 assert.ok(output.includes('\n'),errors);const {url}=JSON.parse(output.split('\n')[0]);
 const html=await(await fetch(url)).text();const config=JSON.parse(html.match(/window\.__TENDRIL__=(.*?);<\/script>/)[1]);
 assert.equal(config.preview,true);assert.equal(config.features.speech,null);assert.ok(config.publication.runtime.id);
 await writeFile(join(page,'app.js'),'window.fixtureVersion=2;');
 const nextHTML=await(await fetch(url)).text(),next=JSON.parse(nextHTML.match(/window\.__TENDRIL__=(.*?);<\/script>/)[1]);
 assert.notEqual(next.publication.id,config.publication.id);
 assert.equal(await(await fetch(new URL(config.publication.base+'app.js',url))).text(),'window.fixtureVersion=1;');
 assert.equal(await(await fetch(new URL(next.publication.base+'app.js',url))).text(),'window.fixtureVersion=2;');
 const runtime=await(await fetch(new URL(config.publication.runtime.base+'tendril.js',url))).text();assert.ok(runtime.length>10000);
 const manifest=await(await fetch(new URL(config.publication.runtime.base+'manifest.json',url))).json();
 assert.equal(digest(Buffer.from(runtime)),manifest.assets.find(item=>item.path==='tendril.js').sha256);
 for(const name of ['input-kit','camera','motion'])assert.equal((await fetch(new URL(`assets/components/${name}.js`,url))).status,200);
 assert.equal((await fetch(new URL('_tendril/snippets/input-kit.js',url))).status,404);
 const socket=new WebSocket(url.replace('http:','ws:')+'_tendril/ws');await once(socket,'open');
 socket.send(JSON.stringify({t:'hello',device_id:'fixture-device'}));const [welcome]=await once(socket,'message');assert.equal(JSON.parse(String(welcome)).t,'welcome');
 const received=once(socket,'message');await fetch(new URL('_preview/events',url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event:'fixture:sample',data:{value:1}})});
 assert.deepEqual(JSON.parse(String((await received)[0])),{t:'fixture_event',event:'fixture:sample',data:{value:1}});socket.close();
 const exited=once(child,'exit');child.kill('SIGTERM');assert.equal((await exited)[0],0);
});

test('release manifest identifies exact bytes and workflows never depend on Node tools',async()=>{
 const manifest=JSON.parse(await readFile(join(dist,'manifest.json'),'utf8'));assert.equal(manifest.requires.contract,2);
 for(const artifact of manifest.artifacts){assert.equal(digest(await readFile(join(dist,artifact.file))),artifact.sha256);assert.ok(new URL(artifact.url).pathname.includes(`/releases/download/v${manifest.version}/`));}
 const workflow=await readFile(join(dist,'workflows/index.mjs'),'utf8');assert.doesNotMatch(workflow,/(?:from|import)\s*\(?["'](?:node:|ws|playwright)|tools\//);
});
