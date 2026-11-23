// Usage: node checks/run-public-sensing.mjs /path/to/tendriller [report.json]
// The core checkout must have built public dist/runtime and installed dependencies.
// No imports from core implementation modules or host endpoints are used.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { publicTransport } from './public-transport.mjs';
import { sensingDefinition } from './public-definition.mjs';
const coreRoot = process.argv[2] && resolve(process.argv[2]);
if (!coreRoot) throw Error('Supply the explicitly selected core checkout with built public artifacts.');
const reportPath = process.argv[3] && resolve(process.argv[3]), requireCore = createRequire(join(coreRoot, 'package.json'));
const { build } = await import(pathToFileURL(requireCore.resolve('esbuild')));
const playwright = await import(pathToFileURL(requireCore.resolve('@playwright/test')));
const chromium = playwright.chromium ?? playwright.default.chromium;
const sessionRoot = join(coreRoot, 'node_modules/@chronolog/peer-session');
const selectedSession = JSON.parse(await readFile(join(sessionRoot, 'package.json'), 'utf8'));
assert.equal(selectedSession.name, '@chronolog/peer-session');
const sessionEntry = resolve(sessionRoot, selectedSession.exports['.'].import), peer = await import(pathToFileURL(sessionEntry));
const runtimeRoot = join(coreRoot, 'dist/runtime'), runtimePackage = JSON.parse(await readFile(join(runtimeRoot, 'package.json'), 'utf8'));
assert.equal(runtimePackage.name, '@tendriller/runtime');
const runtimeEntry = resolve(runtimeRoot, runtimePackage.exports['./kernel'].import);
const contribRoot = fileURLToPath(new URL('../../../', import.meta.url)), here = dirname(fileURLToPath(import.meta.url));
const snippets = {
  capabilities: resolve(here, '../../discover-capabilities/snippets/capabilities.mjs'),
  location: resolve(here, '../../follow-location-progress/snippets/location.mjs'),
  observation: resolve(here, '../snippets/observation.mjs'), card: resolve(here, '../snippets/card.mjs'), capture: resolve(here, '../snippets/capture.mjs'),
};
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const provenancePath = join(sessionRoot, 'provenance.json'), provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
for (const [file, expected] of Object.entries(provenance.sha256)) {
  const path = resolve(sessionRoot, file);
  assert(!relative(sessionRoot, path).startsWith('..'), 'Provenance path must stay in the public package.');
  assert.equal(await digest(path), expected, 'Installed public package digest: ' + file);
}
const before = new Map(await Promise.all([runtimeEntry, sessionEntry, provenancePath, ...Object.values(snippets)].map(async path => [path, await digest(path)])));
const quoted = value => JSON.stringify(value);
const bundle = await build({ stdin: { contents: `
  import * as peer from '@chronolog/peer-session';
  import { startRuntime } from '@tendriller/runtime/kernel';
  import { publicTransport } from ${quoted(resolve(here, 'public-transport.mjs'))};
  import { sensingDefinition } from ${quoted(resolve(here, 'public-definition.mjs'))};
  import { inspectInputs } from ${quoted(snippets.capabilities)};
  import { createLocationController, createFixPublisher } from ${quoted(snippets.location)};
  import { observeRequests } from ${quoted(snippets.observation)};
  import { mountObservationCard } from ${quoted(snippets.card)};
  const definition = sensingDefinition(peer);
  const device = await peer.openApplicationDevice({store:new peer.MemoryBytesStore(),create:true});
  window.identity = device.identity.publicKey;
  window.transport = publicTransport((lane,bytes)=>window.toNative(lane,bytes));
  window.setup = async ({authority,key,nativeId}) => {
    const session = window.session = await peer.openPeerApplication({device,definition,authority,epochKeys:new Map([[0,new Uint8Array(key)]])});
    await session.connectPeer({connection:transport.connection,peerIdentity:nativeId});
    const runtime = window.tendril = startRuntime({id:'sensing-check',base:'/',version:0,documentPath:null,application:{id:session.applicationId}});
    if (typeof runtime.sensors.register !== 'function') throw Error('Rebuild the runtime containing cooperative registration.');
    window.summary = await inspectInputs(runtime,['location','microphone']);
    const publisher = createFixPublisher(session,{streamId:'cookbook-route',intervalMs:100});
    const location = window.locationController = createLocationController({tendril:runtime,onFix:fix=>publisher.offer(fix),onState:value=> {
      window.locationState=value; if(value.state==='stopped') publisher.stop();
    }});
    document.querySelector('#location-start').addEventListener('click',event=>location.start(event));
    document.querySelector('#location-stop').addEventListener('click',()=>runtime.sensors.stopAll());
    const owner = window.observationOwner = new AbortController();
    window.observing = observeRequests({session,requester:nativeId,signal:owner.signal,onRequest:request=>{
      if(window.card) return;
      window.card=mountObservationCard({container:document.querySelector('main'),tendril:runtime,session,request,
        retainEvidence:async response=>{
          const operation=await session.command('retainEvidence',response,{operationId:response.operationId});
          const outcome=await operation.applied();
          if(outcome.status !== 'applied' || outcome.outcome !== 'accepted') throw Error('Evidence command was not accepted.');
        }});
    }}).catch(error=>{if(!owner.signal.aborted) throw error;});
  };
  window.ready=true;
`, resolveDir: coreRoot, sourcefile: 'cookbook-sensing-browser.mjs' }, bundle: true, write: false,
  format: 'esm', platform: 'browser', target: 'es2022', alias: { '@tendriller/runtime/kernel': runtimeEntry } });
const cleanup = [], errors = [], seen = [];
try {
  const server = createServer((request,response)=>{
    response.setHeader('Cache-Control','no-store'); response.setHeader('Content-Type',request.url==='/app.mjs'?'text/javascript':'text/html');
    response.end(request.url==='/app.mjs'?bundle.outputFiles[0].text:'<!doctype html><meta charset="utf-8"><title>Cookbook sensing check</title><button id="location-start">Start location</button><button id="location-stop">Stop sensors</button><main></main><script type="module" src="/app.mjs"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); cleanup.push(()=>new Promise(resolve=>server.close(resolve)));
  const browser = await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  cleanup.push(()=>browser.close());
  const context = await browser.newContext({permissions:['geolocation','microphone'],geolocation:{latitude:52.52,longitude:13.405,accuracy:3}});
  const page = await context.newPage(); page.on('pageerror',error=>{errors.push(error.message); console.error('Browser error:',error.message);});
  const transport = publicTransport((lane,bytes)=>page.evaluate(({lane,bytes})=>window.transport.deliver(lane,bytes),{lane,bytes}));
  cleanup.push(()=>transport.close()); await page.exposeFunction('toNative',(lane,bytes)=>transport.deliver(lane,bytes));
  await page.goto('http://127.0.0.1:'+server.address().port); await page.waitForFunction(()=>window.ready);
  const browserId = await page.evaluate(()=>window.identity), device = await peer.openApplicationDevice({store:new peer.MemoryBytesStore(),create:true});
  const signer = await peer.createPeerIdentity(), key = crypto.getRandomValues(new Uint8Array(32)), definition = sensingDefinition(peer);
  const manifest = await peer.executionManifestArtifacts(await peer.eventExecutionManifest());
  const descriptor = await peer.signApplicationDescriptor({applicationId:'d4'.repeat(32),historyId:'cookbook-sensing',profile:'peer-generation-v1',policy:'eligible-members-v1',
    controlPublicKey:signer.publicKey,schemaAdministrator:device.identity.publicKey,executionManifestDigest:peer.bytesToHex(manifest.executionManifestDigest),
    definitionDigest:await peer.applicationDefinitionDigest(definition),schemaDigest:null},signer);
  const control = await peer.signControlRevision({applicationId:descriptor.payload.applicationId,profile:descriptor.payload.profile,policy:descriptor.payload.policy,
    revision:0,previous:null,epoch:0,keyDigest:await peer.bytesDigest(key),recoveryFloor:null,
    grants:[peer.participantGrant(device.identity.publicKey,{administrator:true}),peer.participantGrant(browserId)]},signer);
  const registry = await peer.createGenerationRegistry({store:new peer.MemoryBytesStore(),descriptor,controls:[control],signer});
  await registry.select(await peer.signTransitionRequest({applicationId:descriptor.payload.applicationId,profile:descriptor.payload.profile,policy:descriptor.payload.policy,
    transitionId:'initial',expectedGeneration:null,requester:device.identity.publicKey,coordinator:device.identity.publicKey,controlRevision:0,reason:'create',base:null},device.identity));
  const authority = await registry.read(), session = await peer.openPeerApplication({device,definition,authority,epochKeys:new Map([[0,key]])});
  cleanup.push(()=>session.close());
  const owner = new AbortController(); cleanup.push(async()=>owner.abort());
  const observing = (async()=>{for await(const event of session.signals.subscribe({topics:['location/fix','evidence/response'],mode:'all',signal:owner.signal}))seen.push(event);})();
  observing.catch(()=>{});
  const browserSetup = page.evaluate(value=>window.setup(value),{authority,key:[...key],nativeId:session.deviceId});
  await session.connectPeer({connection:transport.connection,peerIdentity:browserId}); await browserSetup;
  const until = async predicate => { const end=Date.now()+15_000; while(!await predicate()){
    if(Date.now()>=end) console.error('Browser state:',await page.evaluate(()=>({status:document.querySelector('[role=status]')?.textContent,phase:window.card?.review.snapshot().phase,location:window.locationState})));
    assert(Date.now()<end,'Public sensing condition timed out');await new Promise(resolve=>setTimeout(resolve,20));} };
  assert.equal(await page.evaluate(()=>window.summary.capabilities.location.available),true);
  await context.setGeolocation({latitude:52.5201,longitude:13.4051,accuracy:3}); await page.click('#location-start');
  await until(()=>seen.some(event=>event.topic==='location/fix')); const fix=seen.find(event=>event.topic==='location/fix');
  assert.equal(fix.authorId,browserId);assert.equal(fix.stream.streamId,'cookbook-route');assert.equal(fix.payload.accuracyM,3);
  await page.click('#location-stop');assert.equal(await page.evaluate(()=>window.locationState.state),'stopped');
  await session.signals.send('evidence/request',{requestId:'agent-clip',recipient:browserId,question:'Please review a short synthetic test clip.',expiresAt:Date.now()+30_000},{ttlMs:30_000});
  await page.waitForFunction(()=>window.card);
  assert.deepEqual(await page.evaluate(()=>window.tendril.sensors.status().pending),[]);
  assert.deepEqual(await page.evaluate(()=>window.tendril.sensors.status().active),[]);
  assert.equal(seen.filter(event=>event.topic==='evidence/response').length,0);
  await page.getByRole('button',{name:'Start audio clip',exact:true}).click();
  await page.waitForFunction(()=>window.tendril.sensors.status().active.includes('microphone'));
  await new Promise(resolve=>setTimeout(resolve,550)); await page.getByRole('button',{name:'Finish clip',exact:true}).click();
  await page.waitForFunction(()=>window.card.review.snapshot().candidate!==null);
  const expected=await page.evaluate(async()=>{const blob=window.card.review.snapshot().candidate;return {bytes:blob.size,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('')};});
  assert(expected.bytes>0);assert.equal(seen.filter(event=>event.topic==='evidence/response').length,0);
  await page.getByRole('textbox').fill('Reviewed synthetic audio.');await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Send reviewed response',exact:true}).click();
  await until(()=>seen.some(event=>event.topic==='evidence/response'));
  const response=seen.find(event=>event.topic==='evidence/response').payload;
  assert.equal(response.requestId,'agent-clip');assert.equal(response.recipient,session.deviceId);
  const chunks=[];for await(const chunk of session.content.read(response.reference))chunks.push(chunk);
  const received=Buffer.concat(chunks);assert.equal(received.length,expected.bytes);assert.equal(createHash('sha256').update(received).digest('hex'),expected.hash);
  assert.equal((await session.query('evidence',null)).value.length,1);assert.deepEqual(errors,[]);
  await page.evaluate(async()=>{window.observationOwner.abort();window.locationController.dispose();window.card.dispose();await window.session.close();});
  for (const [path, expected] of before) assert.equal(await digest(path), expected, 'Source changed during qualification: ' + path);
  const sessionPackage=JSON.parse(await readFile(join(dirname(sessionEntry),'package.json'),'utf8'));
  const report={scope:'public-runtime-browser-native-session',verifiedAt:new Date().toISOString(),
    runtime:{version:runtimePackage.version,id:runtimePackage.tendriller.runtime,kernelSha256:await digest(runtimeEntry)},
    session:{version:sessionPackage.version,entrySha256:await digest(sessionEntry),source:provenance.source,dirty:provenance.dirty,provenanceSha256:await digest(provenancePath)},
    snippets:Object.fromEntries(await Promise.all(Object.values(snippets).map(async path=>[relative(contribRoot,path),await digest(path)]))),
    checks:['filtered no-prompt discovery','trusted geolocation to signed native signal','Stop sensors invalidation','remote request only renders','trusted synthetic audio capture and local review','64 KiB encrypted content transport','correlated response','explicit declared retention command'],
    limits:['Synthetic Chromium audio and injected geolocation; no physical devices or chooser UX qualified.','Test bridge replaces network transport; public peer cryptography, content and command execution are real.']};
  if(reportPath)await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} finally { for(const close of cleanup.reverse())await close().catch(()=>{}); }
