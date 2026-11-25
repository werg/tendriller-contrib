// Isolated exact-archive browser qualification: actual Chromium, owning Worker,
// OPFS, authenticated native RTC or actual Workerd relay, and offline reload.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { createApplicationSession, program, emit, sqlStatement, executionManifestArtifacts } from '@chronolog/peer-session';
import { encodeRecord, decodeRecord, bytesToHex, hexToBytes, recordDigest, signMembership } from '@chronolog/authority';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { createNativeSqlEngine } from '@chronolog/peer-session/sql-native';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
import { openFixtureConnection, inspectFixtureConnection } from './operation-set-native-transport.mjs';
import { createFixtureAuthority } from './operation-set-authority.mjs';
import { signalingPair } from './operation-set-participation.mjs';
import { conversation } from './operation-set-definition.mjs';
const path = resolve(process.argv[2]), report = JSON.parse(await readFile(path,'utf8')), directory = dirname(path), assets = join(directory,'assets');
const relay = report.topology.includes('websocket'), hostFixture = relay ? (await import('./operation-set-host-client.mjs')).createHostedFixture(process.env.OPERATION_SET_HOST_BRIDGE) : null;
const hash = value => createHash('sha256').update(value).digest('hex');
const valueHash = value => hash(JSON.stringify(value));
const sessions = [], devices = [], links = [], introductions = new Map();
let browser, context, page, server, host, native, authority, blocked = false, fixtureRequests = 0, nextLink = 0;
const finalityApps = new Map();
const appId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
const deviceName = 'qualified-browser';
const writeReport = async () => writeFile(path,`${JSON.stringify(report,null,2)}\n`);
const checkpoint = async name => { report.stage = name; await writeReport(); };
try {
  await mkdir(assets,{recursive:true}); await mkdir(join(directory,'stores'),{recursive:true});
  const control = await openNativeDevice({ path: join(directory,'stores','control.sqlite'), create:true });
  const root = await openNativeDevice({ path: join(directory,'stores','native.sqlite'), create:true });
  const other = await openNativeDevice({ path: join(directory,'stores','other.sqlite'), create:true }); devices.push(control,root,other);
  authority = await createFixtureAuthority({ applicationId: appId, signer: control.identity, devices:[root,other], epochKey });
  if (hostFixture) { host = await hostFixture.createHost({ bundle:authority, signer:root.identity, devices:[root,other] }); authority = host.bundle; report.host.participant=host.participant; }
  native = await createApplicationSession({ device:root, authority, definition:conversation, epochKeys:new Map([[0,epochKey]]) }); sessions.push(native);
  report.executionManifestDigest = authority.descriptor.payload.executionManifestDigest;
  await build({ entryPoints: { page:'operation-set-browser-page.mjs', worker:'operation-set-browser-worker.mjs', app:'app.mjs', sql:'operation-set-browser-sql.mjs' },
    absWorkingDir:process.cwd(), outdir:assets, bundle:true, splitting:true, format:'esm', platform:'browser', target:'es2022',
    external:['./deployment/bootstrap.mjs'], outExtension:{'.js':'.mjs'}, metafile:true });
  for (const name of ['board.html','compact.html','style.css']) await writeFile(join(assets,name),await readFile(name));
  await mkdir(join(assets,'deployment')); await writeFile(join(assets,'deployment/bootstrap.mjs'),"export { applicationReady } from '../page.mjs';\n");
  await mkdir(join(assets,'wasm'),{recursive:true});
  const sessionRoot=new URL('./',import.meta.resolve('@chronolog/peer-session'));
  for(const name of ['manifest.json','sqlite3.wasm','sqlite3.mjs','sqlite3-opfs-async-proxy.js'])await writeFile(join(assets,'wasm',name),await readFile(new URL(`wasm/${name}`,sessionRoot)));
  const files = await walk(assets), precache = ['/', ...files.map(name => `/${name}`)];
  await writeFile(join(assets,'sw.mjs'), `const CACHE='qualified-immutable-v1';self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(${JSON.stringify(precache)})).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===location.origin&&!u.pathname.startsWith('/fixture/')&&!u.pathname.startsWith('/signaling/'))e.respondWith(caches.match(u.pathname).then(r=>r||fetch(e.request)));});`);
  const body = async req => { const parts=[]; let size=0; for await(const chunk of req){size+=chunk.length;assert.ok(size<=1_048_576);parts.push(chunk);} return size?JSON.parse(Buffer.concat(parts)):{}; };
  server = createServer(async(req,res)=>{
    const json=(status,value)=>res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(value));
    try {
      const url=new URL(req.url,'http://localhost');
      res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
      if(url.pathname.startsWith('/fixture/')){
        fixtureRequests++; const input=await body(req);
        if(blocked) return json(503,{error:{message:'FIXTURE_HOST_UNAVAILABLE'}});
        if(url.pathname==='/fixture/probe')return json(200,{ready:true});
        if(url.pathname==='/fixture/bootstrap'){
          if(input.applicationId !== appId) {
            assert.match(input.applicationId,/^[0-9a-f]{64}$/u);
            const finalDevice=await openNativeDevice({path:join(directory,'stores',`final-${input.applicationId}.sqlite`),create:true});devices.push(finalDevice);
            const finalKey=new Uint8Array(randomBytes(32)),scope=await recordDigest(['scope',input.applicationId]);
            const sqlEngine=input.sql?createNativeSqlEngine():null;
            const digest=sqlEngine?bytesToHex((await executionManifestArtifacts(sqlEngine.executionManifest)).executionManifestDigest):undefined;
            const finalAuthority=await createFixtureAuthority({applicationId:input.applicationId,signer:control.identity,
              devices:input.sql?[{identity:{publicKey:input.publicKey}},finalDevice]:[finalDevice,{identity:{publicKey:input.publicKey}}],epochKey:finalKey,
              ...(digest?{executionManifestDigest:digest}:{}),
              finalityPolicy:input.sql?{kind:'none'}:{kind:'signed-frontier',signer:input.publicKey,scopes:[{id:scope,authorTimeAfterMs:-1n}]}});
            const sender=await createApplicationSession({device:finalDevice,authority:finalAuthority,definition:conversation,epochKeys:new Map([[0,finalKey]]),
              ...(sqlEngine?{createMaterializer:({rootPrincipal})=>createSqlMaterializationRuntime({engine:sqlEngine,rootPrincipal,path:join(directory,'stores',`sql-${input.applicationId}.sqlite`)})}:{})});sessions.push(sender);
            finalityApps.set(input.applicationId,{sender,packages:new Map(),closed:false,sql:input.sql});
            return json(200,{record:bytesToHex(encodeRecord(finalAuthority))});
          }
          if(host){const challenge=await host.challenge(input.publicKey);return json(200,{record:bytesToHex(encodeRecord(authority)),challenge:challenge.challenge});}
          if(!authority.memberships.at(-1).payload.members.some(member=>member.publicKey===input.publicKey)){
            const head=authority.memberships.at(-1), membership=await signMembership({...head.payload,revision:head.payload.revision+1,previous:await recordDigest(head),authorTimeAfterMs:0n,
              members:[...head.payload.members,{publicKey:input.publicKey,reader:true,writer:true,administrator:false,publisher:false,finalizer:false}]},control.identity);
            authority={descriptor:authority.descriptor,memberships:[...authority.memberships,membership]};await native.authority.merge(authority);
          }
          return json(200,{record:bytesToHex(encodeRecord(authority))});
        }
        if(url.pathname==='/fixture/enroll'){authority=await host.enrollDevice(decodeRecord(hexToBytes(input.record)));await native.authority.merge(authority);return json(200,{record:bytesToHex(encodeRecord(authority))});}
        if(url.pathname==='/fixture/provision'){
          const request=decodeRecord(hexToBytes(input.record)),final=finalityApps.get(request.payload.applicationId);
          if(final){let record=final.packages.get(request.payload.requestId);if(!record){record=bytesToHex(encodeRecord(await final.sender.provisioning.exportProvisioning(request)));final.packages.set(request.payload.requestId,record);if(!final.sql){await final.sender.close();final.closed=true;}}return json(200,{record});}
          const transfer=await native.provisioning.exportProvisioning(request);return json(200,{record:bytesToHex(encodeRecord(transfer))});
        }
        return json(404,{error:{message:'UNKNOWN_FIXTURE'}});
      }
      const signal=/^\/signaling\/(\d+)\/(next|send|close)$/u.exec(url.pathname);
      if(signal){const pair=introductions.get(signal[1]);assert.ok(pair);const input=await body(req);if(signal[2]==='next'){const value=await pair.b.messages[Symbol.asyncIterator]().next();return json(200,value.done?null:value.value);}if(signal[2]==='send'){await pair.b.send(input);return json(200,{sent:true});}await pair.b.close();return json(200,{closed:true});}
      const name=url.pathname==='/'?'board.html':url.pathname.slice(1);assert.ok(!name.split('/').includes('..'));
      const bytes=await readFile(join(assets,name));const type=/\.(?:mjs|js)$/u.test(name)?'text/javascript':name.endsWith('.wasm')?'application/wasm':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':'text/html';res.writeHead(200,{'Content-Type':type}).end(bytes);
    }catch(failure){json(500,{error:{message:failure.message}});}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({ headless:true, ...(process.env.OPERATION_SET_CHROMIUM?{executablePath:process.env.OPERATION_SET_CHROMIUM}:{}), args:['--no-sandbox'] });
  context=await browser.newContext({viewport:{width:1280,height:900}}); page=await context.newPage();
  const pageErrors=[];page.on('pageerror',failure=>pageErrors.push(failure.message));
  const address=`${origin}/?${new URLSearchParams({applicationId:appId,name:deviceName,create:'true'})}`;
  await page.goto(address);await page.evaluate(()=>import('/page.mjs').then(module=>module.applicationReady).then(()=>true));await page.waitForFunction(()=>globalThis.application?.status.canAuthor);
  await page.waitForSelector('#empty',{state:'visible'});await page.screenshot({path:join(directory,'empty.png'),fullPage:true});
  const opened=await page.evaluate(()=>fixture.transport('observe'));assert.notEqual(opened.identity,native.identity.publicKey);
  assert.equal(opened.status.connectedPeers,0);
  const browserPost=async(id,time,text=id)=>page.evaluate(input=>fixture.command(input),{operationId:id,time:String(time),text});
  const nativePost=async(id,time,text=id)=>{const operation=await native.command('postMessage',{messageId:id,text},{operationId:id,authorTimestampMs:time});await operation.materialized();return operation;};
  const offlineBrowser=await browserPost('browser-offline',200n);const offlineNative=await nativePost('native-offline',300n);
  assert.equal(offlineBrowser.stored,true);assert.equal(offlineBrowser.outcome.outcome,'accepted');assert.equal((await offlineNative.materialized()).outcome,'accepted');
  report.offline={browserStored:true,browserMaterialized:offlineBrowser.outcome.outcome,nativeMaterialized:(await offlineNative.materialized()).outcome,
    connectedPeers:[opened.status.connectedPeers,native.status.connectedPeers],finality:'none'};
  const connect=async(targetNative=native,targetPage=page,targetIdentity=opened.identity)=>{
    const id=String(++nextLink), pair=signalingPair();introductions.set(id,pair);const bytes={sentBytes:0,receivedBytes:0}, channel=`browser-qualification-${id}`;
    const browserTask=targetPage.evaluate(input=>fixture.transport('connect',input),{id,role:'answerer',peerId:targetNative.identity.publicKey,relayBase:process.env.OPERATION_SET_HOST_BRIDGE,channel});
    const raw=await openFixtureConnection({role:'offerer',signaling:pair.a,localIdentity:targetNative.identity.publicKey,peerIdentity:targetIdentity,
      relayBase:process.env.OPERATION_SET_HOST_BRIDGE,channel,signal:targetNative.signal});
    const link=await targetNative.connectPeer({connection:{signal:raw.signal,live:raw.live,send:async(frame,options)=>{bytes.sentBytes+=frame.length;return raw.send(frame,options);},
      frames:async function*(signal){for await(const frame of raw.frames(signal)){bytes.receivedBytes+=frame.length;yield frame;}},close:()=>raw.close()},peerIdentity:targetIdentity});
    await browserTask;await Promise.all([link.synchronize(),targetPage.evaluate(id=>fixture.transport('synchronize',{id}),id)]);
    const record={id,raw,link,bytes,pair,peers:[targetNative.identity.publicKey,targetIdentity],browser:await targetPage.evaluate(id=>fixture.transport('inspect',{id}),id),route:await inspectFixtureConnection(raw)};links.push(record);return record;
  };
  let link=await connect();
  const nativeSnapshot=async()=>{const view=await native.readView();try{return{revision:view.revision,events:view.readEvents({limit:1000}).events};}finally{view.release();}};
  const synchronize=async()=>{await Promise.all([link.link.synchronize(),page.evaluate(id=>fixture.transport('synchronize',{id}),link.id)]);};
  const snapshot=()=>page.evaluate(()=>fixture.snapshot());
  await synchronize();const converged=await snapshot();assert.deepEqual(converged.events,(await nativeSnapshot()).events);
  await page.waitForFunction(()=>document.querySelector('#message-count').textContent==='2');
  await page.locator('#message').fill('Unsent private draft');await page.locator('#message').focus();
  await page.screenshot({path:join(directory,'desktop-before.png'),fullPage:true});
  await nativePost('late-earlier',100n);await synchronize();await page.waitForFunction(()=>document.querySelector('#message-count').textContent==='3');
  const revised=await snapshot();assert.equal(revised.events[0].operationId,'late-earlier');
  assert.equal(await page.locator('#message').inputValue(),'Unsent private draft');assert.equal(await page.evaluate(()=>document.activeElement.id),'message');
  await page.screenshot({path:join(directory,'desktop-after.png'),fullPage:true});
  report.reactive={before:valueHash(converged.events),after:valueHash(revised.events),earlierFirst:revised.events[0].operationId,
    currentDigest:valueHash(revised.events),peerDigest:valueHash((await nativeSnapshot()).events),draftPreserved:true,focusPreserved:true};
  await page.locator('#conversation a').first().click();const selected=await page.evaluate(()=>location.hash);assert.ok(selected.length>1);
  await page.goBack();assert.equal(await page.evaluate(()=>location.hash),'');await page.goForward();assert.equal(await page.evaluate(()=>location.hash),selected);
  await context.setOffline(true);await browserPost('offline-again',400n);await context.setOffline(false);await synchronize();
  const original=await page.evaluate(async()=>{const operation=await application.operations.get('browser-offline');return{inspection:await operation.inspect(),id:operation.id};});
  const retry=await page.evaluate(async()=>{const operation=await application.command('postMessage',{messageId:'browser-offline',text:'browser-offline'},{operationId:'browser-offline'});return{id:operation.id,inspection:await operation.inspect()};});
  assert.equal(retry.id,original.id);assert.equal(retry.inspection.authorTimestampMs,original.inspection.authorTimestampMs);
  report.retry={originalProposal:original.id,retriedProposal:retry.id,originalTime:original.inspection.authorTimestampMs,retriedTime:retry.inspection.authorTimestampMs};
  await context.setOffline(true);await page.locator('#message').fill('Saved through the domain form offline');
  assert.equal(await page.locator('#send').isEnabled(),true);await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#operations').textContent.includes('Stored locally'));
  await page.waitForFunction(()=>document.querySelector('#message').value==='');
  const uiIntent=await page.locator('#operations li').first().getAttribute('data-operation');
  const uiStored=await page.evaluate(async id=>(await (await application.operations.get(id)).inspect()).stored,uiIntent);assert.equal(uiStored,true);
  await context.setOffline(false);await synchronize();
  blocked=true;await assert.rejects(fetch(`${origin}/fixture/probe`,{method:'POST',body:'{}'}).then(async response=>{if(!response.ok)throw Error('FIXTURE_HOST_UNAVAILABLE');}),/FIXTURE_HOST_UNAVAILABLE/);
  if(host){await host.block(true);await assert.rejects(host.probe(),/HOST_UNAVAILABLE/);}
  const requestsBefore=fixtureRequests,hostBefore=host?await host.traffic():null;
  await browserPost('browser-host-blocked',500n);await nativePost('native-host-blocked',501n);await synchronize();
  assert.equal(fixtureRequests,requestsBefore);report.hostOutage={boundary:host?'tendriller-workerd-http':'fixture-http',blockedProbeRejected:true,commandsMaterialized:2,before:{requests:requestsBefore,...(host?{host:hostBefore}:{})},after:{requests:fixtureRequests,...(host?{host:await host.traffic()}:{})}};blocked=false;if(host)await host.block(false);
  const content=new TextEncoder().encode('private-content-marker'.repeat(8192)).slice(0,131095),reference=await native.content.putBytes(content);
  const transferred=await page.evaluate(async reference=>{const bytes=await application.content.readBytes(reference,{maxBytes:200000});return{bytes:bytes.length,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('')};},reference);
  assert.equal(transferred.sha256,hash(content));report.content={bytes:transferred.bytes,sha256:hash(content),receivedSha256:transferred.sha256,transport:'authenticated-peer-channel'};
  const signalBefore=await recordDigest(native.exportFacts().envelopes), signalAbort=new AbortController();
  const stream=native.signals.subscribe({topics:['typing'],signal:AbortSignal.any([signalAbort.signal,AbortSignal.timeout(10000)])})[Symbol.asyncIterator]();
  const next=stream.next();await page.evaluate(()=>application.signals.send('typing',{typing:true,marker:'private-live-signal-marker'},{ttlMs:2500}));
  assert.equal((await next).value.payload.marker,'private-live-signal-marker');signalAbort.abort();await stream.return?.();assert.equal(await recordDigest(native.exportFacts().envelopes),signalBefore);
  report.live={observed:true,historyBefore:signalBefore,historyAfter:await recordDigest(native.exportFacts().envelopes)};
  // Cache the exact immutable graph, then terminate the owning Worker abruptly.
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.mjs');await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const beforeReload=await snapshot(),beforeRequests=fixtureRequests;
  await page.evaluate(()=>fixture.crash());await link.link.close();
  if(relay)await hostFixture.cutRelays();
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>globalThis.application?.status.canAuthor);
  const reopened=await page.evaluate(()=>fixture.transport('observe'));assert.equal(reopened.identity,opened.identity);assert.equal(fixtureRequests,beforeRequests);
  assert.deepEqual((await snapshot()).events,beforeReload.events);
  const offlineContent=await page.evaluate(async reference=>{const bytes=await application.content.readBytes(reference,{maxBytes:200000});return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');},reference);
  assert.equal(offlineContent,hash(content));report.content.reloadSha256=offlineContent;report.content.localReload=true;
  const reloaded=await browserPost('offline-reload',600n);
  assert.equal(reloaded.outcome.outcome,'accepted');await context.setOffline(false);link=await connect();await synchronize();
  assert.deepEqual((await snapshot()).events,(await nativeSnapshot()).events);
  report.reload={identityBefore:opened.identity,identityAfter:reopened.identity,cachedAuthority:true,offlineReload:true,offlineWrite:true,
    startupHttpRequests:fixtureRequests-beforeRequests,digest:valueHash((await snapshot()).events),peerDigest:valueHash((await nativeSnapshot()).events),abruptWorkerRestart:true};
  const ownershipPage=await context.newPage();await ownershipPage.goto(address);await assert.rejects(ownershipPage.evaluate(()=>import('/page.mjs').then(module=>module.applicationReady)),/BROWSER_STORAGE_IN_USE|BYTES_STORE_IN_USE|BUSY|OPERATION_STORE/);await ownershipPage.screenshot({path:join(directory,'ownership-error.png'),fullPage:true});await ownershipPage.close();
  report.ownership={workerOnly:true,secondOwnerRefused:true,pagePrivateKeys:0,explicitProvisioning:true,storageId:opened.storageId};
  for(const width of [1280,320]){
    await page.setViewportSize({width,height:900});await page.locator('#message').fill('Phone draft retained');await page.screenshot({path:join(directory,`${width}-before.png`),fullPage:true});
    await nativePost(`width-${width}`,700n+BigInt(width),'Long content '.repeat(150));await synchronize();
    await page.waitForFunction(()=>document.querySelector('#conversation').textContent.includes('Long content'));
    assert.equal(await page.locator('#message').inputValue(),'Phone draft retained');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#message').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'send');
    await page.screenshot({path:join(directory,`${width}-after.png`),fullPage:true});
  }
  report.ux={domainSave:true,intentInspector:true,emptyState:true,errorState:true,widths:[1280,320],deepLinks:true,back:true,keyboard:true,longContent:true,draftPreserved:true,noHorizontalScroll:true,
    screenshots:['empty.png','ownership-error.png','desktop-before.png','desktop-after.png','1280-before.png','1280-after.png','320-before.png','320-after.png']};
  // The same signed SQL operations execute in actual browser WASM and native
  // replicas; DDL is an authored transaction, never bootstrap metadata.
  const sqlContext=await browser.newContext(),sqlPage=await sqlContext.newPage(),sqlAppId=randomBytes(32).toString('hex');
  await sqlPage.goto(`${origin}/?${new URLSearchParams({applicationId:sqlAppId,name:'browser-sql',create:'true',sql:'true'})}`);
  await sqlPage.waitForFunction(()=>globalThis.application?.status.canAuthor);
  const sqlIdentity=await sqlPage.evaluate(()=>application.identity.publicKey),sqlNative=finalityApps.get(sqlAppId).sender;
  const sqlCases=await sqlPage.evaluate(async()=>{
    const {program,sqlStatement,emit}=await import('/sql.mjs');
    const submit=async(id,time,steps)=>{const op=await application.submit({operationId:id,authorTimestampMs:BigInt(time),program:program(...steps)});await op.materialized();return op;};
    const insert=await submit('sql-insert',20,[sqlStatement("INSERT INTO notes(id,value) VALUES(1,'ready')")]);const before=await insert.materialized();
    const captured=await application.readView();
    const create=await submit('sql-create',10,[sqlStatement('CREATE TABLE notes(id INTEGER PRIMARY KEY,value TEXT)')]);
    const after=await insert.materialized();let capturedMissing=false;try{await captured.query('SELECT * FROM notes');}catch{capturedMissing=true;}await captured.release();
    const alter=await submit('sql-alter',30,[sqlStatement('ALTER TABLE notes ADD COLUMN extra TEXT'),sqlStatement('CREATE INDEX notes_value ON notes(value)'),sqlStatement('CREATE VIEW notes_view AS SELECT id,value FROM notes'),sqlStatement('CREATE TRIGGER notes_touch AFTER INSERT ON notes BEGIN SELECT 1; END')]);
    const rollback=await submit('sql-rollback',40,[sqlStatement('CREATE TABLE rolled_back(id INTEGER PRIMARY KEY)'),sqlStatement("INSERT INTO notes(id,value) VALUES(2,'bad')"),emit('rollback',{bad:true}),sqlStatement("SELECT chronolog_assert(0,'rollback')")]);
    const view=await application.readView();const rows=(await view.query('SELECT id,value FROM notes ORDER BY id')).rows;
    const leaked=(await view.query("SELECT name FROM sqlite_schema WHERE name='rolled_back'")).rows;
    const events=(await view.readEvents({topics:['rollback']})).events;const revision=view.revision;await view.release();
    return{ids:[insert.id,create.id,alter.id,rollback.id],before:before.outcome,after:after.outcome,alter:(await alter.materialized()).outcome,
      rollback:(await rollback.materialized()).outcome,capturedMissing,rows,leaked:leaked.length,rollbackEvents:events.length,manifest:revision.executionManifestDigest};
  });
  assert.equal(sqlCases.before,'rejected');assert.equal(sqlCases.after,'accepted');assert.equal(sqlCases.alter,'accepted');assert.equal(sqlCases.rollback,'rejected');
  assert.equal(sqlCases.capturedMissing,true);assert.equal(sqlCases.leaked,0);assert.equal(sqlCases.rollbackEvents,0);
  const sqlLink=await connect(sqlNative,sqlPage,sqlIdentity);
  const denied=await sqlNative.submit({operationId:'native-cross-object-drop',authorTimestampMs:50n,program:program(sqlStatement('DROP TABLE notes'))});
  assert.equal((await denied.materialized()).outcome,'rejected');await sqlLink.link.synchronize();
  await sqlPage.evaluate(id=>fixture.transport('synchronize',{id}),sqlLink.id);
  let sqlNativeView=await sqlNative.readView();const nativeRows=sqlNativeView.query('SELECT id,value FROM notes ORDER BY id').rows;const nativeManifest=sqlNativeView.revision.executionManifestDigest;sqlNativeView.release();
  assert.deepEqual(sqlCases.rows,nativeRows);assert.equal(sqlCases.manifest,nativeManifest);
  const browserOutcomes=await sqlPage.evaluate(async ids=>{await application.readView().then(view=>view.release());return Promise.all(ids.map(async id=>(await application.operations.get(id)).inspect().then(value=>[value.proposalId,value.materialized?.outcome,value.materialized?.rejectionCode])));},[...sqlCases.ids,denied.id]);
  const nativeOutcomes=[...sqlCases.ids,denied.id].map(id=>{const value=sqlNative.operations.get(id).inspect();return[value.proposalId,value.materialized?.outcome,value.materialized?.rejectionCode];});assert.deepEqual(browserOutcomes,nativeOutcomes);
  await sqlPage.evaluate(async()=>{await navigator.serviceWorker.register('/sw.mjs');await navigator.serviceWorker.ready;});await sqlPage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await sqlPage.evaluate(()=>fixture.crash());await sqlLink.link.close();await sqlContext.setOffline(true);await sqlPage.reload();await sqlPage.waitForFunction(()=>globalThis.application?.status.canAuthor);
  const sqlReload=await sqlPage.evaluate(async()=>{const view=await application.readView();try{return{identity:application.identity.publicKey,rows:(await view.query('SELECT id,value FROM notes ORDER BY id')).rows};}finally{await view.release();}});
  assert.equal(sqlReload.identity,sqlIdentity);assert.deepEqual(sqlReload.rows,nativeRows);
  report.sqlParity={actualBrowserWasm:true,actualNativeEngine:true,browserManifest:sqlCases.manifest,nativeManifest,
    browserState:valueHash(sqlCases.rows),nativeState:valueHash(nativeRows),browserOutcomes:valueHash(browserOutcomes),nativeOutcomes:valueHash(nativeOutcomes),
    lateDdlBefore:sqlCases.before,lateDdlAfter:sqlCases.after,rollback:sqlCases.rollback,unauthorizedDrop:(await denied.materialized()).outcome,
    capturedSchemaCoherent:sqlCases.capturedMissing,rollbackEvents:sqlCases.rollbackEvents,offlineReload:valueHash(sqlReload.rows)};
  await sqlPage.evaluate(()=>fixture.close());await sqlContext.close();
  // An authorized browser supplies signed-frontier evidence with every native
  // participant for this separate policy scope already closed after provisioning.
  const finalityContext=await browser.newContext(),finalityPage=await finalityContext.newPage();
  const finalityAppId=randomBytes(32).toString('hex');
  await finalityPage.goto(`${origin}/?${new URLSearchParams({applicationId:finalityAppId,name:'browser-finalizer',create:'true'})}`);
  await finalityPage.waitForFunction(()=>globalThis.application?.status.canAuthor);
  assert.equal(finalityApps.get(finalityAppId).closed,true);
  const browserFinality=await finalityPage.evaluate(async()=>{
    const included=await application.command('postMessage',{messageId:'final-included',text:'Browser finality'},{operationId:'final-included',authorTimestampMs:100n});
    await included.materialized();const before=await included.inspect();
    const closure=await application.finality.closeAuthorTime({throughMs:100n});await included.finalized();
    const delayed=await application.command('postMessage',{messageId:'late-excluded',text:'Retain the original offline intent'},{operationId:'late-excluded',authorTimestampMs:50n});
    await application.readView().then(view=>view.release());const excluded=await delayed.inspect();
    const retry=await application.command('postMessage',{messageId:'late-excluded',text:'Retain the original offline intent'},{operationId:'late-excluded'});
    return{identity:application.identity.publicKey,included:included.id,pendingBefore:!before.finalized,finalized:(await included.inspect()).finalized,
      closedThroughMs:String(closure.closedThroughMs),proofs:closure.proofs.length,excluded:excluded.excluded,stored:excluded.stored,
      originalProposal:delayed.id,retriedProposal:retry.id,originalTime:excluded.authorTimestampMs,retainedTime:(await retry.inspect()).authorTimestampMs};
  });
  await finalityPage.evaluate(async()=>{await navigator.serviceWorker.register('/sw.mjs');await navigator.serviceWorker.ready;});
  await finalityPage.waitForFunction(()=>!!navigator.serviceWorker.controller);await finalityPage.evaluate(()=>fixture.crash());
  await finalityContext.setOffline(true);await finalityPage.reload();await finalityPage.waitForFunction(()=>globalThis.application?.status.canAuthor);
  await finalityPage.evaluate(async()=>{const view=await application.readView();await view.release();});
  const finalityReload=await finalityPage.evaluate(async()=>({identity:application.identity.publicKey,
    finalized:(await (await application.operations.get('final-included')).inspect()).finalized,
    excluded:(await (await application.operations.get('late-excluded')).inspect()).excluded}));
  assert.equal(finalityReload.identity,browserFinality.identity);assert.equal(finalityReload.finalized,true);assert.equal(finalityReload.excluded,true);
  report.browserFinality={...browserFinality,policy:'signed-frontier',nativeFinalizers:0,nativeParticipantClosed:finalityApps.get(finalityAppId).closed,reloadFinalized:finalityReload.finalized,reloadExcluded:finalityReload.excluded};
  await finalityPage.evaluate(()=>fixture.close());await finalityContext.close();
  const observation=await page.evaluate(()=>fixture.observations());
  const workerObservation=await page.evaluate(()=>fixture.transport('observe'));assert.ok(workerObservation.resources.opfsRoots>0);assert.equal(observation.page.opfsRoots,0);
  report.browser={implementation:'chromium',version:browser.version(),storage:'OPFS',transportOwner:'owning-worker',resources:workerObservation.resources};
  if(host)report.host.publication=await host.qualifyPublication();
  await page.evaluate(()=>fixture.close());await Promise.all(links.map(value=>value.link.close()));
  if(relay)report.relay={implementation:'browser-websocket',hostRuntime:'workerd',networkBoundary:'loopback-websocket-to-bounded-test-bridge-to-workerd-websocket',
    independentLanes:['reliable','live'],security:'shared-authenticated-peer-channel',controlOutageScope:'control-http-only',forcedDirectFailure:links.every(value=>value.route.directAttempts===1&&value.browser.route.directAttempts===1),
    connections:links.map(value=>({authenticated:true,closed:value.raw.signal.aborted,reliable:value.bytes})),reconnect:{physicalLinksCut:true,reconnected:links.length>=2},traffic:await hostFixture.relayTraffic()};
  else report.rtc={implementation:'werift',version:'0.27.0',candidateSource:'explicit-loopback-only',signalingBoundary:'browser-main-thread-sdp-mailbox',
    connections:links.map(value=>({peers:value.peers,authenticated:true,closed:value.raw.signal.aborted,reliable:value.bytes,
      signaling:value.pair.snapshot(),routes:[value.route,value.browser.route]}))};
  assert.deepEqual(pageErrors,[]);report.passed=true;report.stage='passed';
}catch(failure){report.passed=false;report.error=failure.stack??String(failure);throw failure;}
finally{await Promise.allSettled(links.map(value=>value.link.close()));await page?.evaluate(()=>fixture.close()).catch(()=>{});await browser?.close();
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await Promise.allSettled(sessions.map(session=>session.close()));await Promise.allSettled(devices.map(device=>device.close()));await writeReport();}
async function walk(root,prefix=''){const out=[];for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){const name=prefix?`${prefix}/${entry.name}`:entry.name;if(entry.isDirectory())out.push(...await walk(root,name));else out.push(name);}return out;}
