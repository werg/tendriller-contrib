import test from 'node:test';
import assert from 'node:assert/strict';
import { sessions } from '../server.ts';

function fixture() {
  let saved = { state: {}, rev: 0, records: new Map(), scopes: new Map(), events: [], notices: [], pins: [] };
  let identity = { kind: 'agent', actor: 'agent:main', accountId: null, role: null };
  const host = {
    get identity() { return identity; }, context: { generations: {}, workflow: 'sessions' },
    now: () => 1000, id: () => crypto.randomUUID(), fail(status, code, message) { throw Object.assign(new Error(message), { status, code }); },
    records: {
      get: (collection,key) => structuredClone(saved.records.get(collection)?.get(key) ?? null),
      list: collection => [...(saved.records.get(collection) ?? new Map())].map(([key,value])=>({key,value:structuredClone(value)})),
      put(collection,key,value) { if(!saved.records.has(collection))saved.records.set(collection,new Map());saved.records.get(collection).set(key,structuredClone(value)); },
      delete: (collection,key) => saved.records.get(collection)?.delete(key), clear: collection => saved.records.delete(collection),
    },
    state: { get:()=>({state:structuredClone(saved.state),rev:saved.rev}), apply(ops){ for(const op of ops){ if(op.op==='set')saved.state[op.path[0]]=structuredClone(op.value);else delete saved.state[op.path[0]]; }return ++saved.rev; } },
    scopes: { get:id=>saved.scopes.get(id)??null, register(id,bindings){const item={id,...bindings,generation:crypto.randomUUID()};saved.scopes.set(id,item);return item;},rotate(id){const item={...saved.scopes.get(id),generation:crypto.randomUUID()};saved.scopes.set(id,item);return item;},retire:id=>saved.scopes.delete(id)},
    participants:()=>[{id:'owner',role:'owner'},{id:'alice',role:'guest'},{id:'bob',role:'guest'}],
    pinBlobs:value=>saved.pins.push(structuredClone(value)),emit:value=>saved.events.push(structuredClone(value)),notify:topic=>saved.notices.push(topic),afterCommit:fn=>fn(),
  };
  function call(operation,data={}) { const before=structuredClone(saved);try{return sessions.operations[operation].run(host,data);}catch(error){saved=before;throw error;} }
  return {call,host,get saved(){return saved;},as(accountId,role='guest'){identity={kind:'page',actor:`page:${accountId}`,accountId,role};},activate:scope=>call('activate',{scope})};
}

test('private assignments and responses expose only the current participant records',()=>{
 const f=fixture();f.activate('facilitation');
 const task=f.call('assignmentCreate',{participant:'alice',title:'Private title',prompt:'Secret task'});
 f.as('bob');assert.equal(f.call('assignments').assignments.length,0);
 assert.throws(()=>f.call('responseSubmit',{prompt_id:task.prompt_id,answer:'Stolen',expected_assignment_revision:task.revision}),{code:'not_found'});
 f.as('alice');assert.equal(f.call('assignments').assignments[0].prompt,'Secret task');
 const response=f.call('responseSubmit',{prompt_id:task.prompt_id,answer:'Private answer',expected_assignment_revision:task.revision});
 assert.equal(response.revision,1);assert.equal(f.call('responses').responses.length,1);
 f.as('bob');assert.equal(f.call('responses').responses.length,0);
 const publicContent=JSON.stringify([f.saved.state,f.saved.events,f.saved.notices]);
 for(const privateText of ['Private answer','Secret task','Private title','alice'])assert.ok(!publicContent.includes(privateText));
 assert.throws(()=>f.call('assignmentUpdate',{id:task.id,expected_revision:9,feedback:'Wrong'}),{code:'version_conflict'});
});

test('decision execution requires owner approval and preserves approved proposal immutability',()=>{
 const f=fixture();f.activate('decisions');
 const proposal=f.call('decisionCreate',{title:'Review',summary:'Concrete proposal',expires_at:2000});
 assert.throws(()=>f.call('decisionUpdate',{id:proposal.id,expected_version:1,status:'completed'}),{code:'invalid_transition'});
 assert.equal(sessions.operations.decisionRespond.access,'owner');
 f.as('owner','owner');const approved=f.call('decisionRespond',{id:proposal.id,expected_version:1,decision:'approve'});
 assert.equal(approved.status,'approved');
 assert.throws(()=>f.call('decisionRespond',{id:proposal.id,expected_version:1,decision:'reject'}),{code:'version_conflict'});
 assert.throws(()=>f.call('decisionUpdate',{id:proposal.id,expected_version:2,status:'working',summary:'Changed work'}),{code:'proposal_immutable'});
 const done=f.call('decisionUpdate',{id:proposal.id,expected_version:2,status:'completed',result:'Finished'});
 assert.equal(done.status,'completed');assert.equal(done.summary,'Concrete proposal');
});

test('archive preserves private records and blobs, resets only its scope, and rotates generation',()=>{
 const f=fixture();const activated=f.activate('facilitation');
 f.saved.state={facilitation:{prompt:{id:'question'},summary:'Aggregate'},unrelated:{value:1}};
 const assignment=f.call('assignmentCreate',{participant:'alice',title:'Task',prompt:'Private prompt'});
 const stale=f.call('archivePreview',{scope:'facilitation'});
 f.as('alice');f.call('responseSubmit',{prompt_id:assignment.prompt_id,answer:'Private answer',expected_assignment_revision:1});
 assert.throws(()=>f.call('archive',{scope:'facilitation',expected_state_revision:stale.state_revision,expected_interaction_revision:stale.interaction_revision}),{code:'version_conflict'});
 const current=f.call('archivePreview',{scope:'facilitation'});
 const result=f.call('archive',{scope:'facilitation',expected_state_revision:current.state_revision,expected_interaction_revision:current.interaction_revision});
 assert.equal(result.archive.responses[0].answer,'Private answer');assert.equal(result.archive.assignments[0].prompt,'Private prompt');
 assert.notEqual(result.scope.generation,activated.scope.generation);assert.equal(f.call('responsesAll').responses.length,0);assert.equal(f.call('assignmentsAll').assignments.length,0);
 assert.deepEqual(f.saved.state.unrelated,{value:1});assert.equal(f.saved.state.facilitation.stage,'collect');assert.equal(f.saved.state.facilitation.session_id,undefined);assert.equal(f.saved.pins.length,1);
 assert.equal(sessions.operations.archive.access,'controller');assert.equal(sessions.operations.archiveGet.access,'controller');
});

test('guide archive preserves its definition and archive quota failure preserves current work',()=>{
 const f=fixture();f.activate('guide');f.saved.state={guide:{steps:[{id:'first'}]},guide_progress:{completed:{first:true}}};
 let current=f.call('archivePreview',{scope:'guide'});
 f.call('archive',{scope:'guide',expected_state_revision:current.state_revision,expected_interaction_revision:current.interaction_revision});
 assert.deepEqual(f.saved.state.guide.steps,[{id:'first'}]);assert.deepEqual(f.saved.state.guide_progress,{});
 for(let i=1;i<20;i++)f.host.records.put('archives',String(i),{id:String(i),bytes:1});
 current=f.call('archivePreview',{scope:'guide'});const before=structuredClone(f.saved);
 assert.throws(()=>f.call('archive',{scope:'guide',expected_state_revision:current.state_revision,expected_interaction_revision:current.interaction_revision}),{code:'archive_quota'});
 assert.deepEqual(f.saved,before);
});
