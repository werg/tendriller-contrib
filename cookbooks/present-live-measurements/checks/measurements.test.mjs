import test from 'node:test';
import assert from 'node:assert/strict';
import { ema, exactAtX, seriesKey, saveCheckpoint, loadCheckpoint } from '../snippets/measurements.mjs';
const points=[{x:0,y:2},{x:1,y:4},{x:2,y:null},{x:3,y:10},{x:4,y:0},{x:5,y:-2},{x:6,y:8}];
test('EMA preserves raw data and restarts across log gaps in original units',()=>{
 assert.deepEqual(ema(points,.5,{log:true}).map(p=>p.smoothed),[2,3,null,10,null,null,8]);
 assert.deepEqual(ema(points,.5).map(p=>p.smoothed),[2,3,null,10,5,1.5,4.75]);
 assert.deepEqual(points.map(p=>p.y),[2,4,null,10,0,-2,8]);
});
test('fixed-alpha EMA weights samples rather than elapsed time',()=>{
 assert.deepEqual(ema([{x:0,y:0},{x:1,y:10},{x:1000,y:10}],.5).map(p=>p.smoothed),[0,5,7.5]);
 assert.throws(()=>ema(points,0),RangeError);assert.throws(()=>ema([{x:NaN,y:1}],.2),TypeError);
});
test('exact shared-x inspection does not interpolate sparse runs',()=>{
 assert.equal(exactAtX([{x:0,y:4},{x:10,y:8}],5),null);
 assert.equal(exactAtX([{x:5,y:1},{x:5,y:7}],5),7);
 assert.notEqual(seriesKey({source:'meter',run:'a',unit:'C'}),seriesKey({source:'meter',run:'b',unit:'C'}));
});
test('atomic checkpoint restores model, cursor, and known gap together',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const checkpoint={modelVersion:1,cursor:12,historyIncomplete:true,records:[{seq:12,x:5,y:null,source:'s',run:'r',unit:'V'}]};
 saveCheckpoint(storage,'page:reader:stream:model',checkpoint);assert.deepEqual(loadCheckpoint(storage,'page:reader:stream:model'),checkpoint);
 const before=values.get('page:reader:stream:model');
 assert.throws(()=>saveCheckpoint(storage,'page:reader:stream:model',{...checkpoint,cursor:13},{maxBytes:4}),RangeError);
 assert.equal(values.get('page:reader:stream:model'),before);
 assert.throws(()=>saveCheckpoint({...storage,setItem(){throw Error('quota');}},'page:reader:stream:model',{...checkpoint,cursor:13}),/quota/);
 assert.deepEqual(loadCheckpoint(storage,'page:reader:stream:model'),checkpoint);
});
test('corrupt, wrong-model, and cursor-only checkpoints require a full rebuild',()=>{
 for(const value of ['{',JSON.stringify({modelVersion:2,cursor:1,records:[],historyIncomplete:false}),JSON.stringify({modelVersion:1,cursor:1}),JSON.stringify({modelVersion:1,cursor:1,records:[{seq:2,x:1,y:2,source:'s',run:'r',unit:'u'}],historyIncomplete:false})]) assert.throws(()=>loadCheckpoint({getItem:()=>value},'key'));
 assert.equal(loadCheckpoint({getItem:()=>null},'key'),null);
});
