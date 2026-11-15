import test from 'node:test';
import assert from 'node:assert/strict';
import {assertService,checkService} from '../../tools/cli/lib/service.mjs';
import { componentAssets } from '../../tools/cli/lib/assets.mjs';
test('a chart-only contrib release accepts the same deployed workflow interface',()=>{
 const descriptor={contract:2,core_release:'independent-service-release',workflows:[{id:'sessions',interface_version:'1',schema_version:'1'}]};
 assert.equal(assertService(descriptor,{contract:2,workflows:{sessions:{interface_version:'1',schema_version:'1'}}}),descriptor);
 assert.throws(()=>assertService({...descriptor,contract:1}),/requires core contract 2/);
 assert.throws(()=>assertService(descriptor,{contract:2,workflows:{sessions:{interface_version:'2',schema_version:'1'}}}),/requires interface 2/);
});
test('descriptor fetch never sends a page credential',async()=>{
 let seen;await checkService('https://service.test/api/t/page',{fetch:async(url,options)=>{seen={url,options};return Response.json({contract:2,workflows:[]});}});
 assert.equal(seen.url,'https://service.test/api/service');assert.equal(seen.options.headers,undefined);
});
test('component closure includes lazy siblings and rejects undeclared experimental assets',()=>{
 const files=componentAssets(['ui']).map(file=>file.path);
 for(const name of ['ui','input-kit','camera','motion','connectors','hardware-lab','serial','bluetooth'])assert.ok(files.includes(`assets/components/${name}.js`),name);
 assert.throws(()=>componentAssets(['pose']),/not in the supported catalog/);
});
