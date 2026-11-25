// Fresh-origin qualification only. Production enrollment uses explicit owner proof
// and recipient-bound key provisioning in snippets/bootstrap-authority.mjs.
import { createApplicationSession, executionManifestArtifacts, bytesToHex } from '@chronolog/peer-session';
import { createSigningIdentity, encodeRecord, decodeRecord } from '@chronolog/authority';
import { openBrowserDevice } from '@chronolog/peer-session/worker';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
import { createBrowserSqlEngine, loadBrowserEngine } from '@chronolog/peer-session/sql-browser';
import { serveBrowserOwner } from '@tendriller/core/worker-owner';
import { createFixtureAuthority } from './operation-set-authority.mjs';
import { reviewWorkspace } from '../domain/review-workspace.mjs';

const profileId=new URL(import.meta.url).searchParams.get('profile');
if(!/^[a-z0-9-]{1,80}$/u.test(profileId??''))throw Error('Qualification profile is required');
const applicationId='81'.repeat(32);
serveBrowserOwner({profileId,async openSession({signal}){
  let device,session,pool;
  try{
    device=await openBrowserDevice({name:profileId,create:true});
    const {definition,initializationProgram}=reviewWorkspace({administrators:[device.identity.publicKey]});
    const loaded=await loadBrowserEngine(new URL('./engine/',import.meta.url));signal.throwIfAborted();
    pool=await loaded.module.installOpfsSAHPoolVfs({name:`qualification-${profileId}`,directory:`qualification-${profileId}`,initialCapacity:48});
    const engine=createBrowserSqlEngine({...loaded,vfs:pool.vfsName});
    let authority=await device.store.get('fixture/authority'),key=await device.store.get('fixture/epoch');
    if(authority===null){
      if(key!==null)throw Error('Incomplete retained setup; do not replace its intent');
      const signer=await createSigningIdentity();key=crypto.getRandomValues(new Uint8Array(32));
      const manifest=await executionManifestArtifacts(engine.executionManifest);
      authority=encodeRecord(await createFixtureAuthority({applicationId,signer,devices:[device],epochKey:key,executionManifestDigest:bytesToHex(manifest.executionManifestDigest)}));
      // Retain the original key before publishing authority. This fresh fixture
      // has no uncertain host boundary; production bootstrap persists its intent.
      await device.store.put('fixture/epoch',key);await device.store.put('fixture/authority',authority);
    }
    if(key===null)throw Error('Original fixture epoch key is missing; do not regenerate it');
    session=await createApplicationSession({device,definition,authority:decodeRecord(authority),epochKeys:new Map([[0,key]]),
      createMaterializer:({rootPrincipal})=>createSqlMaterializationRuntime({engine,path:'/qualification.sqlite',rootPrincipal})});
    let initialized=await session.operations.get('ordinary-collaboration-initialization');
    if(initialized===null)initialized=await session.submit({program:initializationProgram,operationId:'ordinary-collaboration-initialization'});
    if((await initialized.materialized()).outcome!=='accepted')throw Error('Ordinary initialization program was rejected');
    return{session,close:async()=>pool?.pauseVfs()};
  }catch(error){try{if(session)await session.close();else await device?.close();}finally{await pool?.pauseVfs();}throw error;}
}});
