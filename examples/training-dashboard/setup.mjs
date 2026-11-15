// Example composition: generic page publication plus generic collector provisioning.
import { mkdir, readFile, writeFile, rename, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPage } from '@tendriller/core';
import { checkService } from '../../tools/cli/lib/service.mjs';
import { request } from '../../tools/cli/lib/api.mjs';
import { initializeCollector } from '../../tools/collector/lib/stream-init.mjs';
import { componentAssets, assetLock } from '../../tools/cli/lib/assets.mjs';
import { readResource } from '../../tools/cli/lib/resources.mjs';
const service=(process.env.TENDRILLER_SERVICE_BASE||'https://tendriller.dev').replace(/\/$/,'');
const owner=process.env.TENDRILLER_OWNER;
const directory=resolve(process.env.TENDRILLER_DASHBOARD_DIR||'./tendriller-training');
if(!owner)throw Error('Set TENDRILLER_OWNER to your verified owner email.');
await checkService(service);
await mkdir(directory,{recursive:true,mode:0o700});
const pageFile=join(directory,'page.json'),configFile=join(directory,'collector.json'),specFile=join(directory,'streams.json');
async function load(path){try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;return null;}}
async function save(path,value){const temporary=path+'.'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600});await rename(temporary,path);await chmod(path,0o600);}
let page=await load(pageFile);
if(!page){page=await createPage(service,{owner,name:'Training observatory',mode:'dashboard'});page.owner = owner; await save(pageFile,page);}
if(page.owner !== owner)throw Error('The saved page belongs to another owner; choose another dashboard directory.');
if(new URL(page.api).origin!==new URL(service).origin)throw Error('The saved page belongs to another service; choose another dashboard directory.');
if(!await load(configFile)){
 let spec=await load(specFile);
 if(!spec){
  spec={producer:'training-'+randomUUID().slice(0,8),spool_dir:'./spool',streams:[
   {name:'machine.utilization',durability:'ephemeral',readers:'owner'},
   {name:'training.metrics',durability:'durable',readers:'owner',max_records:10000,max_age_seconds:86400},
   {name:'training.logs',durability:'durable',readers:'owner',max_records:10000,max_age_seconds:86400},
  ],sources:[
   {id:'local-machine',type:'host',stream:'machine.utilization',interval_ms:5000,gpu:true},
   {id:'training-metrics',type:'jsonl',stream:'training.metrics',run:process.env.TRAINING_RUN||'training',path:resolve(process.env.TRAINING_METRICS||'./metrics.jsonl')},
   {id:'training-logs',type:'log',stream:'training.logs',run:process.env.TRAINING_RUN||'training',path:resolve(process.env.TRAINING_LOG||'./training.log')},
  ]};await save(specFile,spec);
 }
 await initializeCollector({page:pageFile,streams:specFile,out:configFile});
}
const files={};
for(const name of ['index.html','app.js','model.mjs','tendril.json'])files[name]=readResource('examples/training-dashboard/'+name).toString('utf8');
const declaration=JSON.parse(files['tendril.json']);
const assets=componentAssets(declaration.components);
for(const asset of assets)files[asset.path]={base64:asset.bytes.toString('base64'),type:'text/javascript'};
files['tendril.assets.json']=JSON.stringify(assetLock(declaration,assets));
await request(page.api+'/files',{method:'POST',token:page.token,json:{files,replace:true,message:'Training observatory'}});
console.log(`Dashboard: ${page.page_url}`);
console.log(`Collector configuration: ${configFile}`);
console.log('Open the dashboard and sign in to claim it, then run the released tendril-stream command with collector.json.');
console.log('Keep page.json and collector.json private. Inspect /api/service and stream metadata for effective resource limits.');
