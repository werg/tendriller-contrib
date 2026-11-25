// One maintained physical owner, ordinary SQL projection, optional background sync.
import { serveBrowserOwner } from '@tendriller/core/worker-owner';
import { participateApplication } from '@tendriller/core/participation';
import { createApplicationSession } from '@chronolog/peer-session';
import { openBrowserDevice } from '@chronolog/peer-session/worker';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
import { reviewWorkspace } from './review-workspace.mjs';
import { bootstrapCollaborationAuthority } from './bootstrap-authority.mjs';

serveBrowserOwner({scope:self,async load({signal}){
  const response=await fetch(new URL('./configuration.json',import.meta.url),{signal,cache:'no-store'});
  if(!response.ok)throw Error('Signed application configuration is unavailable');
  const configuration=await response.json();
  if(new URL(configuration.page_url).origin!==self.location.origin)throw Error('Open this Worker at its enrolled publication origin');
  const {definition,initializationProgram}=reviewWorkspace({administrators:configuration.administrators,members:configuration.members??[]});
  return{profileId:configuration.profileId,
    async createIdentity(){const device=await openBrowserDevice({name:configuration.profileId,create:true});try{return device.identity.publicKey;}finally{await device.close();}},
    async openSession({signal}){
      let device,session,pool,participation;
      try{
        device=await openBrowserDevice({name:configuration.profileId});
        const {authority,peers}=await bootstrapCollaborationAuthority({configuration,device,signal});
        session=await createApplicationSession({device,definition,authority,
          createMaterializer:async({rootPrincipal})=>{
            const {loadBrowserEngine,createBrowserSqlEngine}=await import('@chronolog/peer-session/sql-browser');
            const loaded=await loadBrowserEngine(new URL(configuration.engineBaseUrl,import.meta.url));
            if(typeof loaded.module.installOpfsSAHPoolVfs!=='function')throw Error('This engine cannot retain the SQL profile');
            pool=await loaded.module.installOpfsSAHPoolVfs({name:`review-${configuration.profileId}`,directory:`review-${configuration.profileId}`,initialCapacity:32});
            return createSqlMaterializationRuntime({engine:createBrowserSqlEngine({...loaded,vfs:pool.vfsName}),path:'/review-workspace.sqlite',rootPrincipal});
          }});
        if(authority.descriptor.rootPrincipal===device.identity.publicKey&&await session.operations.get('ordinary-collaboration-initialization')===null)
          await session.submit({program:initializationProgram,operationId:'ordinary-collaboration-initialization'});
        // Background discovery cannot delay cached opening or durable local writes.
        // This example chooses Worker-native relay; direct RTC is an optional adapter.
        participation=participateApplication(session,{peers,openDirectConnection:async()=>{throw Error('DIRECT_ROUTE_NOT_CONFIGURED');}});
        return{session,close:async()=>{await participation?.close();await pool?.pauseVfs();}};
      }catch(error){try{await participation?.close();if(session)await session.close();else await device?.close();}finally{await pool?.pauseVfs();}throw error;}
    }};
}});
