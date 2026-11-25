import test from 'node:test';
import assert from 'node:assert/strict';
import { awaitPhase,framedPair,signalingPair,connectFramedSessions } from './operation-set-participation.mjs';
test('test framing copies bytes and closes both independent endpoints',async()=>{const pair=framedPair(),[a,b]=pair.connections;const iterator=b.frames()[Symbol.asyncIterator]();const next=iterator.next();const frame=new Uint8Array([1,2,3]);await a.send(frame);frame[0]=9;assert.deepEqual((await next).value,new Uint8Array([1,2,3]));assert.deepEqual(pair.inspect(),{sentBytes:3,receivedBytes:3});await a.close();assert.equal(b.signal.aborted,true);await iterator.return();});
test('bounded fixture rejects queued overflow and oversize frames',async()=>{const pair=framedPair();for(let i=0;i<128;i++)await pair.connections[0].send(new Uint8Array([1]));await assert.rejects(pair.connections[0].send(new Uint8Array([1])),/frame bound/);await assert.rejects(pair.connections[1].send(new Uint8Array(1_100_001)));await pair.connections[0].close();});
test('cancellation wakes a blocked fixture reader',async()=>{const pair=framedPair(),controller=new AbortController(),iterator=pair.connections[0].frames(controller.signal)[Symbol.asyncIterator]();const next=iterator.next();controller.abort();assert.equal((await next).done,true);await pair.connections[0].close();});
test('one-off signaling retires after the actual offer and answer',async()=>{const pair=signalingPair(),offer={type:'offer',sdp:'opaque'},answer={type:'answer',sdp:'opaque'};const incoming=pair.b.messages[Symbol.asyncIterator]().next();await pair.a.send(offer);assert.deepEqual((await incoming).value,offer);await pair.b.send(answer);assert.deepEqual((await pair.a.messages[Symbol.asyncIterator]().next()).value,answer);await pair.a.close();assert.equal(pair.snapshot().closed,false);await pair.b.close();assert.equal(pair.snapshot().closed,true);assert.equal(pair.snapshot().sentMessages,2);assert.ok(pair.snapshot().sentBytes>0);});
test('a rejected authenticated endpoint closes both physical transports',async()=>{const pair=framedPair(),a={identity:{publicKey:'a'},connectPeer:async()=>{throw Error('AUTH_FAILED');}},b={identity:{publicKey:'b'},connectPeer:async()=>({peerIdentity:'a'})};await assert.rejects(connectFramedSessions(a,b,pair.connections),/AUTH_FAILED/);assert.ok(pair.connections.every(connection=>connection.signal.aborted));});
test('opt-in live datagrams are copied, bounded, congestion-refused and separate from reliable accounting',async()=>{
  assert.equal(framedPair().connections[0].live,undefined);
  const pair=framedPair({live:true}),[a,b]=pair.connections,iterator=b.live.frames()[Symbol.asyncIterator](),next=iterator.next(),frame=new Uint8Array([4,5]);
  assert.equal(await a.live.trySend(frame,{signal:new AbortController().signal}),true);frame[0]=9;
  assert.deepEqual((await next).value,new Uint8Array([4,5]));
  assert.deepEqual(pair.inspectLive(),{sentBytes:2,receivedBytes:2});assert.deepEqual(pair.inspect(),{sentBytes:0,receivedBytes:0});
  for(let i=0;i<64;i++)assert.equal(await a.live.trySend(new Uint8Array([1])),true);
  assert.equal(await a.live.trySend(new Uint8Array([1])),false);
  await assert.rejects(a.live.trySend(new Uint8Array(20_001)));
  const controller=new AbortController();controller.abort();await assert.rejects(a.live.trySend(new Uint8Array([1]),{signal:controller.signal}),{name:'AbortError'});
  const blocked=framedPair({live:true}).connections[1].live.frames(controller.signal)[Symbol.asyncIterator]();assert.equal((await blocked.next()).done,true);
  await a.close();assert.ok(b.live.signal.aborted);await assert.rejects(a.live.trySend(new Uint8Array([1])));
});
const delay=(milliseconds,value)=>new Promise(resolve=>setTimeout(()=>resolve(value),milliseconds));
const timers=()=>process.getActiveResourcesInfo().filter(name=>name==='Timeout').length;
test('a phase deadline counts only its own wait, so intervening driver work cannot consume the next phase',async()=>{
  const before=timers(),stopped=new AbortController(),options={milliseconds:120,abort:error=>stopped.abort(error)};
  // Phase one completes quickly; unrelated driver work then outlasts a whole phase window.
  assert.equal(await awaitPhase(delay(10,'refused'),{...options,label:'refusal'}),'refused');
  await delay(200);
  assert.equal(stopped.signal.aborted,false);
  // A fresh deadline still has its full duration for the second phase.
  assert.equal(await awaitPhase(delay(60,'completed'),{...options,label:'completion'}),'completed');
  await delay(180);assert.equal(stopped.signal.aborted,false);assert.equal(timers(),before,'settled phases must clear their timers');
});
test('a stalled phase aborts its worker first, fails with a labelled TimeoutError and leaves no timer or unhandled rejection',async()=>{
  const before=timers(),unhandled=[],listener=reason=>unhandled.push(reason);process.on('unhandledRejection',listener);
  try {
    const stopped=new AbortController(),worker=new Promise((_,reject)=>stopped.signal.addEventListener('abort',()=>setTimeout(()=>reject(stopped.signal.reason),5),{once:true}));
    void worker.catch(()=>undefined);
    const state={context:'stage x'};
    await assert.rejects(awaitPhase(worker,{milliseconds:40,label:()=>`reviewer completion (${state.context})`,abort:error=>stopped.abort(error)}),error=>{
      assert.equal(error.name,'TimeoutError');assert.match(error.message,/reviewer completion \(stage x\) exceeded its own 40 ms phase/u);
      assert.equal(error,stopped.signal.reason);return true;
    });
    assert.equal(stopped.signal.aborted,true);
    await delay(60);assert.equal(timers(),before);assert.deepEqual(unhandled,[]);
  } finally { process.off('unhandledRejection',listener); }
});
test('a phase work rejection is the primary error and a late rejection after expiry is still observed',async()=>{
  const before=timers(),unhandled=[],listener=reason=>unhandled.push(reason);process.on('unhandledRejection',listener);
  try {
    const failure=Error('WORKER_FAILED');
    await assert.rejects(awaitPhase(Promise.reject(failure),{milliseconds:500,label:'worker'}),error=>error===failure);
    await assert.rejects(awaitPhase(new Promise((_,reject)=>setTimeout(()=>reject(Error('LATE')),80)),{milliseconds:20,label:'late worker'}),{name:'TimeoutError'});
    await delay(120);assert.equal(timers(),before);assert.deepEqual(unhandled,[]);
    await assert.rejects(async()=>awaitPhase(Promise.resolve(),{milliseconds:0,label:'invalid'}),/positive integer/u);
  } finally { process.off('unhandledRejection',listener); }
});
