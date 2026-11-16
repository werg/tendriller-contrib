// Explicit public-artifact integration. No sibling implementation imports or hidden page assets.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
const {values}=parseArgs({options:{tools:{type:'string'},playwright:{type:'string'},browser:{type:'string'},output:{type:'string'}}});
if(!values.tools||!values.playwright)throw Error('Usage: node test/pilot-browser.mjs --tools /path/to/public/tools/package --playwright /path/to/playwright/index.mjs [--browser /path/to/chromium] [--output result.json]');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),toolRoot=resolve(values.tools),pkg=JSON.parse(readFileSync(resolve(toolRoot,'package.json'),'utf8'));
assert.equal(pkg.name,'@tendriller/tools');
const {startServer}=await import(pathToFileURL(resolve(toolRoot,pkg.exports['./preview'])));
const {chromium}=await import(pathToFileURL(resolve(values.playwright)));
const browser=await chromium.launch({headless:true,...values.browser?{executablePath:resolve(values.browser)}:{}});
const browserVersion=await browser.version();
const results=[],output=resolve(values.output||resolve(root,'test-results/pilot-evidence.json'));mkdirSync(dirname(output),{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const records=[
 {id:'a0',type:'measurement',data:{source:'meter',run:'a',unit:'V',x:0,y:2}},
 {id:'a2',type:'measurement',data:{source:'meter',run:'a',unit:'V',x:2,y:0}},
 {id:'b0',type:'measurement',data:{source:'meter',run:'b',unit:'V',x:0,y:5}},
 {id:'b1',type:'measurement',data:{source:'meter',run:'b',unit:'V',x:1,y:8}},
 {id:'a3',type:'measurement',data:{source:'meter',run:'a',unit:'V',x:3,y:null}},
 {id:'b3',type:'measurement',data:{source:'meter',run:'b',unit:'V',x:3,y:-1}},
];
const scopes=g=>[{id:'evidence',generation:g,paths:[],operations:['capture']}];
async function check(name, fn) {
 const start = Date.now();
 try {
  await fn();
  results.push({ name, status: 'passed', duration_ms: Date.now() - start });
  console.log('PASS ' + name);
 } catch (error) {
  results.push({ name, status: 'failed', duration_ms: Date.now() - start, error: error.stack || String(error) });
  throw error;
 } finally { writeEvidence(); }
}
const deferred = () => { let resolve; const promise = new Promise(done => resolve = done); return { promise, resolve }; };
const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
function writeEvidence() {
 const evidence = {
  date: new Date().toISOString(), source_commit: process.env.GITHUB_SHA || null,
  core_commit: process.env.CORE_CHECK_REF || null, tool_package: pkg.name, tool_version: pkg.version,
  runtime: pkg.tendriller.runtime, preview_bundle_sha256: hash(resolve(toolRoot, pkg.exports['./preview'])),
  browser: browserVersion, scenarios: results,
  limits: ['Preview fixtures do not establish service authorization or transactions.', 'No live camera, microphone, instrument, or production deployment was exercised.', 'Private policy authority is covered by the separate public-engine host checks.'],
 };
 writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
}
async function withPage(directory,fixture,fn,{path='/',mobile=false,beforeOpen=async()=>{}}={}){
 const server=await startServer(resolve(root,directory),undefined,fixture),origin=`http://127.0.0.1:${server.address().port}`;
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.stack || error.message));
 try{await beforeOpen({server,origin,context,page});await page.goto(origin+path);await page.waitForFunction(()=>window.tendril?.connected);await fn({server,origin,context,page});assert.deepEqual(errors,[],nameFor(directory)+' browser errors');}finally{await context.close();await server.stopPreview();}
}
const nameFor=directory=>directory.split('/').slice(-2).join('/');
const waitCursor=(page,cursor)=>page.waitForFunction(expected=>document.querySelector('#budget')?.dataset.cursor===String(expected),cursor);
const streamFixture=(max_records=400,readers='page')=>({streams:[{name:'measurements',durability:'durable',readers,max_records,max_age_seconds:86400,records}]});
const image={name:'review.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')};
try{
 for(const layout of ['desktop','mobile']){
  const directory=`cookbooks/present-live-measurements/checks/${layout}`,options=layout==='mobile'?{path:'/pages/index.html',mobile:true}:{};
  await check(`${layout}: source/run identity, exact values, burst ingestion and checkpoint`,()=>withPage(directory,streamFixture(),async({page,server})=>{
   await waitCursor(page,6);
   if(layout==='desktop'){
    assert.equal(await page.locator('.panel').count(),2);assert.deepEqual(await page.locator('.panel strong').allTextContents(),['0','Missing']);await page.locator('#log').check();await page.getByText('V · step 2 · not plotted on log scale',{exact:true}).waitFor();
   }else{assert.equal(await page.locator('#run option').count(),2);await page.locator('#run').selectOption({label:'meter / a'});assert.equal(await page.locator('#reading').textContent(),'Missing');assert.ok(await page.locator('link[rel=stylesheet]').evaluate(el=>!!el.sheet),'nested relative stylesheet loaded');}
   server.preview.streams.feed([{name:'measurements',records:Array.from({length:120},(_,i)=>({id:`burst-${i}`,type:'measurement',data:{source:'meter',run:i%2?'a':'b',unit:'V',x:4+i,y:i}}))}]);
   await waitCursor(page,126);const budget=await page.locator('#budget').textContent();assert.match(budget,layout==='desktop'?/60 retained/:/20\/20 displayed/);await page.reload();await waitCursor(page,126);assert.equal(await page.locator('#budget').textContent(),budget);
   assert.equal(await page.locator('[data-tendril-control]').count(),0);assert.ok(!server.preview.messages.some(m=>m.t==='rules'));
   await page.screenshot({path:resolve(dirname(output),`measurements-${layout}.png`),fullPage:true});
  },options));
  await check(`${layout}: retained-history gap survives reload and corrupt checkpoint rebuild`,()=>withPage(directory,streamFixture(3),async({page})=>{
   await waitCursor(page,6);await page.locator('#gap').waitFor({state:'visible'});await page.reload();await waitCursor(page,6);await page.locator('#gap').waitFor({state:'visible'});
   await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('observatory:')||key.startsWith('instrument:'))localStorage.setItem(key,'{"cursor":999}');});await page.reload();await waitCursor(page,6);await page.locator('#gap').waitFor({state:'visible'});
  },options));
  await check(`${layout}: current authorization clears private cached readings`,()=>withPage(directory,streamFixture(400,'owner'),async({page,server})=>{
   await waitCursor(page,6);server.preview.streams.feed([{name:'measurements',records:[{id:'racing-reading',type:'measurement',data:{source:'secret',run:'private',unit:'V',x:7,y:99}}]}]);server.preview.setRole('guest');await page.waitForFunction(()=>document.querySelector('#status').textContent.toLowerCase().includes('private cached readings were cleared'));
   assert.equal(await page.locator(layout==='desktop'?'#raw tr':'#values li').count(),0);await page.reload();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Unavailable:'));assert.equal(await page.locator(layout==='desktop'?'#raw tr':'#values li').count(),0);
  },options));
  const oldInfo = deferred(), oldReady = deferred(), oldDone = deferred(), newInfo = deferred(), newReady = deferred();
  await check(`${layout}: delayed earlier authorization cannot restore a revoked cache`, () => withPage(directory, streamFixture(400, 'owner'), async ({ page, server }) => {
   await waitCursor(page, 6);
   let requests = 0;
   await page.route('**/_tendril/streams/measurements', async route => {
    const response = await route.fetch();
    if (++requests === 1) {
     oldReady.resolve(); await oldInfo.promise; await route.fulfill({ response }); oldDone.resolve();
    } else {
     newReady.resolve(); await newInfo.promise; await route.fulfill({ response });
    }
   });
   await page.reload(); await oldReady.promise;
   server.preview.setRole('guest'); await newReady.promise;
   assert.equal(await page.locator(layout === 'desktop' ? '#raw tr' : '#values li').count(), 0);
   oldInfo.resolve(); await oldDone.promise; await settle(page);
   assert.equal(await page.locator(layout === 'desktop' ? '#raw tr' : '#values li').count(), 0);
   assert.equal(await page.locator('#budget').textContent(), '');
   newInfo.resolve(); await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Unavailable:'));
  }, options));
 }
 for(const layout of ['inline','fullscreen']){
  const directory=`cookbooks/capture-reviewed-evidence/checks/${layout}`,draft=layout==='inline'?'#question':'#description';
  const prepare=async page=>{if(layout==='inline')await page.locator('#file').setInputFiles(image);else{await page.locator('#rectangle').click();await page.locator('#review-button').click();await page.locator('#review').waitFor({state:'visible'});}};
  await check(`${layout}: reviewed snapshot acceptance preserves later typing`,()=>withPage(directory,{scopes:scopes('generation-a')},async({page,server})=>{
   await page.locator(draft).fill('Submitted question');await prepare(page);
   let release;const held=new Promise(resolve=>release=resolve);let uploaded;const arrived=new Promise(resolve=>uploaded=resolve);
   await page.route('**/_tendril/blob',async route=>{uploaded();await held;await route.continue();});
   await page.locator('#send').click();await arrived;await page.locator(draft).fill('New draft while upload is pending');release();await page.locator('[data-status=accepted]').waitFor();
   assert.equal(await page.locator(draft).inputValue(),'New draft while upload is pending');assert.equal(server.preview.events.length,1);assert.equal(server.preview.events[0].data.text,'Submitted question');assert.equal(server.preview.events[0].context.generations.evidence,'generation-a');const receipt=page.locator('[data-status=accepted]');assert.equal(await receipt.getAttribute('data-submission'),server.preview.events[0].data.submission_id);assert.notEqual(await receipt.getAttribute('data-capture'),await receipt.getAttribute('data-submission'));
   await page.reload();assert.equal(await page.locator(draft).inputValue(),'New draft while upload is pending');await page.screenshot({path:resolve(dirname(output),`capture-${layout}.png`),fullPage:true});
  }));
  await check(`${layout}: delayed stale rejection preserves original context and current draft`,()=>withPage(directory,{scopes:scopes('generation-a')},async({page,server})=>{
   await page.locator(draft).fill('Original reviewed evidence');await prepare(page);
   let release;const held=new Promise(resolve=>release=resolve);let uploaded;const arrived=new Promise(resolve=>uploaded=resolve);
   await page.route('**/_tendril/blob',async route=>{uploaded();await held;await route.continue();});await page.locator('#send').click();await arrived;await page.locator(draft).fill('Unrelated new draft');server.preview.setScopes(scopes('generation-b'));release();await page.locator('[data-status=rejected]').waitFor();
   assert.equal(await page.locator(draft).inputValue(),'Unrelated new draft');assert.equal(server.preview.events.length,0);assert.match(await page.locator('[data-status=rejected]').textContent(),/Original reviewed evidence/);const completed=server.preview.messages.find(m=>m.t==='capture_complete');assert.equal(completed.expected_generations.evidence,'generation-a');
   const captureId = await page.locator('[data-status=rejected]').getAttribute('data-capture');
   await page.reload(); await page.getByText('Retry original capture', { exact: true }).waitFor();
   assert.equal(await page.locator('[data-status=rejected]').getAttribute('data-capture'), captureId);
   await page.getByText('Retry original capture', { exact: true }).click();
   await page.waitForFunction(() => document.querySelector('[data-status=rejected]') !== null);
   assert.equal(await page.locator(draft).inputValue(), 'Unrelated new draft');
   const completions = server.preview.messages.filter(message => message.t === 'capture_complete');
   assert.equal(completions.length, 2); assert.deepEqual(completions[1], completions[0]);
  }));
 }
 await check('inline: discarded candidate never becomes a submitted image',()=>withPage('cookbooks/capture-reviewed-evidence/checks/inline',{scopes:scopes('generation-a')},async({page,server})=>{
  await page.locator('#file').setInputFiles(image);await page.locator('#discard').click();await page.locator('#send').click();assert.equal(server.preview.events.length,0);assert.match(await page.locator('#status').textContent(),/Add a question/);
 }));

 const privateModule={id:'private-responses',interface_version:'1',schema_version:'1'};
 const roundScope={id:'private-responses:round',generation:'round-a',paths:[['findings']],operations:['workflow:private-responses:submit','workflow:private-responses:publish']};
 const assignment={id:'assignment-a',round:'round-1',prompt:'What would help you contribute?',response:null};
 const privateBase={service:{workflows:[privateModule]},scopes:[roundScope]};
 await check('participant: explicit capability absence stays usable and makes no private request',()=>withPage('cookbooks/collect-private-responses/checks/participant',{},async({page,server})=>{
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('explicitly installed'));assert.equal(server.mockedHttp.length,0);assert.equal(await page.locator('#form').isVisible(),false);
 }));
 await check('participant: fixture acceptance preserves new draft and only reads authorized projection',()=>withPage('cookbooks/collect-private-responses/checks/participant',{...privateBase,role:'guest',http:[
  {method:'POST',path:'/_tendril/workflows/private-responses/mine',json:{assignments:[assignment]}},
  {method:'POST',path:'/_tendril/workflows/private-responses/submit',expect_body:{data:{assignment:'assignment-a',answer:'First private answer',expected_revision:0}},json:{assignment:'assignment-a',answer:'First private answer',revision:1,submitted_at:1}},
 ]},async({page,server})=>{
  await page.locator('#form').waitFor({state:'visible'});await page.locator('#answer').fill('First private answer');let release;const held=new Promise(resolve=>release=resolve);let arrived;const received=new Promise(resolve=>arrived=resolve);
  await page.route('**/_tendril/workflows/private-responses/submit',async route=>{arrived();await held;await route.continue();});await page.locator('#submit').click();await received;await page.locator('#answer').fill('A new private draft');release();await page.waitForFunction(()=>document.querySelector('#receipt').textContent.startsWith('Accepted'));
  assert.equal(await page.locator('#answer').inputValue(),'A new private draft');assert.equal(server.preview.events.length,0);assert.deepEqual(server.preview.state,{});const submitted=server.mockedHttp.find(row=>row.path.endsWith('/submit'));assert.equal(submitted.body.expected_generations['private-responses:round'],'round-a');
  await page.screenshot({path:resolve(dirname(output),'private-participant.png'),fullPage:true});
 },{mobile:true}));
 await check('participant: conflict retry retains original command without replacing a newer draft',()=>withPage('cookbooks/collect-private-responses/checks/participant',{...privateBase,role:'guest',http:[
  {method:'POST',path:'/_tendril/workflows/private-responses/mine',json:{assignments:[assignment]}},
  {method:'POST',path:'/_tendril/workflows/private-responses/submit',status:409,json:{error:{code:'revision_conflict',message:'Review the current answer before replacing it'}}},
 ]},async({page,server})=>{
  await page.locator('#form').waitFor({state:'visible'});await page.locator('#answer').fill('Original pending answer');await page.locator('#submit').click();await page.locator('#retry').waitFor({state:'visible'});await page.locator('#answer').fill('Later draft');await page.locator('#retry').click();await page.waitForFunction(()=>document.querySelector('#submit').disabled===false);
  const requests=server.mockedHttp.filter(row=>row.path.endsWith('/submit'));assert.equal(requests.length,2);assert.deepEqual(requests[0].body,requests[1].body);assert.equal(await page.locator('#answer').inputValue(),'Later draft');
 }));
 const review={round:{id:'round-1',label:'Team reflection',revision:2},assignments:[{...assignment,participant:'person-a'}],answers:[{assignment:'assignment-a',answer:'Private fixture answer',revision:1}]};
 await check('facilitator: deliberate aggregate is a revisioned operation separate from private answers',()=>withPage('cookbooks/collect-private-responses/checks/facilitator',{...privateBase,http:[
  {method:'POST',path:'/_tendril/workflows/private-responses/review',json:review},
  {method:'POST',path:'/_tendril/workflows/private-responses/publish',expect_body:{data:{summary:'Reviewed aggregate only',expected_revision:2}},json:{summary:{text:'Reviewed aggregate only',source_revision:2,reviewed_at:1},revision:3}},
 ]},async({page,server})=>{
  await page.getByText('Private fixture answer',{exact:true}).waitFor();assert.equal(await page.locator('#summary').inputValue(),'');await page.locator('#summary').fill('Reviewed aggregate only');await page.locator('#publish').click();await page.getByText('Published: Reviewed aggregate only',{exact:true}).waitFor();const publication=server.mockedHttp.find(row=>row.path.endsWith('/publish'));assert.equal(publication.body.data.summary,'Reviewed aggregate only');assert.ok(!JSON.stringify(publication.body).includes('Private fixture answer'));await page.screenshot({path:resolve(dirname(output),'private-facilitator.png'),fullPage:true});
 }));
 const denied = { error: { code: 'forbidden', message: 'Current identity is not authorized' } };
 const privateDirectory = 'cookbooks/collect-private-responses/checks/';
 for (const layout of ['participant', 'facilitator']) {
  await check(`${layout}: denied mutation clears private content before a role notification`, () => withPage(privateDirectory + layout, {
   ...privateBase, role: layout === 'participant' ? 'guest' : 'owner', http: [
    { method: 'POST', path: '/_tendril/workflows/private-responses/mine', json: { assignments: [assignment] } },
    { method: 'POST', path: '/_tendril/workflows/private-responses/review', json: review },
    { method: 'POST', path: '/_tendril/workflows/private-responses/submit', status: 403, json: denied },
    { method: 'POST', path: '/_tendril/workflows/private-responses/publish', status: 403, json: denied },
   ],
  }, async ({ page }) => {
   if (layout === 'participant') {
    await page.locator('#form').waitFor({ state: 'visible' }); await page.locator('#answer').fill('Secret revoked response'); await page.locator('#submit').click();
   } else {
    await page.getByText('Private fixture answer', { exact: true }).waitFor(); await page.locator('#summary').fill('Secret unshared aggregate'); await page.locator('#publish').click();
   }
   await page.waitForFunction(() => document.querySelector('#status').textContent.includes('unavailable for the current identity'));
   if (layout === 'participant') {
    assert.equal(await page.locator('#form').isVisible(), false); assert.equal(await page.locator('#answer').inputValue(), ''); assert.equal(await page.locator('#receipt').textContent(), '');
   } else {
    assert.equal(await page.locator('#answers').textContent(), ''); assert.equal(await page.locator('#round').textContent(), ''); assert.equal(await page.locator('#summary').inputValue(), ''); assert.equal(await page.locator('#published').textContent(), '');
   }
  }));
 }

 {
  const release = deferred(), arrived = deferred(), delivered = deferred(); let first = true;
  await check('participant: old authorized read cannot restore private content after revocation', () => withPage(privateDirectory + 'participant', {
   ...privateBase, role: 'guest', http: [{ method: 'POST', path: '/_tendril/workflows/private-responses/mine', json: { assignments: [assignment] } }],
  }, async ({ page, server }) => {
   await arrived.promise; server.preview.setRole('display');
   await page.waitForFunction(() => document.querySelector('#status').textContent.includes('not authorized'));
   release.resolve(); await delivered.promise; await settle(page);
   assert.equal(await page.locator('#form').isVisible(), false);
   assert.equal(await page.locator('#answer').inputValue(), '');
   assert.equal(await page.locator('#receipt').textContent(), '');
   assert.ok(!(await page.locator('body').textContent()).includes(assignment.prompt));
  }, { beforeOpen: async ({ page }) => page.route('**/_tendril/workflows/private-responses/mine', async route => {
   if (!first) { await route.fulfill({ status: 403, json: denied }); return; }
   first = false; const response = await route.fetch(); arrived.resolve(); await release.promise;
   await route.fulfill({ response }); delivered.resolve();
  }) }));
 }
 {
  const release = deferred(), arrived = deferred(), delivered = deferred();
  await check('participant: a delayed rejection cannot redisplay a revoked private answer', () => withPage(privateDirectory + 'participant', {
   ...privateBase, role: 'guest', http: [
    { method: 'POST', path: '/_tendril/workflows/private-responses/mine', json: { assignments: [assignment] } },
    { method: 'POST', path: '/_tendril/workflows/private-responses/submit', status: 409, json: { error: { code: 'revision_conflict', message: 'Review required' } } },
   ],
  }, async ({ page, server }) => {
   await page.locator('#form').waitFor({ state: 'visible' });
   await page.locator('#answer').fill('Secret original answer');
   await page.route('**/_tendril/workflows/private-responses/mine', route => route.fulfill({ status: 403, json: denied }));
   await page.route('**/_tendril/workflows/private-responses/submit', async route => {
    const response = await route.fetch(); arrived.resolve(); await release.promise; await route.fulfill({ response }); delivered.resolve();
   });
   await page.locator('#submit').click(); await arrived.promise; server.preview.setRole('display');
   await page.waitForFunction(() => document.querySelector('#status').textContent.includes('not authorized'));
   release.resolve(); await delivered.promise; await settle(page);
   assert.equal(await page.locator('#form').isVisible(), false); assert.equal(await page.locator('#answer').inputValue(), '');
   assert.equal(await page.locator('#receipt').textContent(), ''); assert.equal(await page.locator('#retry').isVisible(), false);
  }));
 }
 for (const operation of ['review', 'publish']) {
  const release = deferred(), arrived = deferred(), delivered = deferred();
  await check(`facilitator: delayed ${operation} cannot restore a revoked private view`, () => withPage(privateDirectory + 'facilitator', {
   ...privateBase, http: [
    { method: 'POST', path: '/_tendril/workflows/private-responses/review', json: review },
    { method: 'POST', path: '/_tendril/workflows/private-responses/publish', json: { summary: { text: 'Secret pending aggregate', source_revision: 2 }, revision: 3 } },
   ],
  }, async ({ page, server }) => {
   await page.getByText('Private fixture answer', { exact: true }).waitFor();
   await page.locator('#summary').fill('Secret pending aggregate');
   let first = true;
   await page.route('**/_tendril/workflows/private-responses/review', async route => {
    if (operation !== 'review' || !first) { await route.fulfill({ status: 403, json: denied }); return; }
    first = false; const response = await route.fetch(); arrived.resolve(); await release.promise;
    await route.fulfill({ response }); delivered.resolve();
   });
   if (operation === 'publish') await page.route('**/_tendril/workflows/private-responses/publish', async route => {
    const response = await route.fetch(); arrived.resolve(); await release.promise; await route.fulfill({ response }); delivered.resolve();
   });
   await page.locator(operation === 'review' ? '#refresh' : '#publish').click(); await arrived.promise;
   server.preview.setRole('guest'); await page.waitForFunction(() => document.querySelector('#status').textContent.includes('not authorized'));
   release.resolve(); await delivered.promise; await settle(page);
   assert.equal(await page.locator('#answers').textContent(), ''); assert.equal(await page.locator('#round').textContent(), '');
   assert.equal(await page.locator('#summary').inputValue(), ''); assert.equal(await page.locator('#published').textContent(), '');
   assert.equal(await page.locator('#publish').isDisabled(), true);
  }));
 }
 await check('shared projection: reads only reviewed shared state with no private operation',()=>withPage('cookbooks/collect-private-responses/checks/display',{role:'display',state:{findings:{text:'Reviewed shared finding',source_revision:2}}},async({page,server})=>{
  await page.getByText('Reviewed shared finding',{exact:true}).waitFor();assert.equal(server.mockedHttp.length,0);assert.ok(!server.preview.messages.some(m=>JSON.stringify(m).includes('private-responses')));await page.screenshot({path:resolve(dirname(output),'private-display.png'),fullPage:true});
 }));
 console.log(`Recorded ${results.length} browser scenarios in ${output}`);
 console.log(readFileSync(output, 'utf8'));
}finally{writeEvidence();await browser.close();}
