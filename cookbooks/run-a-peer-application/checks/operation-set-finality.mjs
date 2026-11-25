// Real session proof APIs; finality certifies inclusion/closure, never ordering.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { createApplicationSession } from '@chronolog/peer-session';
import { recordDigest } from '@chronolog/authority';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { createFixtureAuthority } from './operation-set-authority.mjs';
import { conversation } from './operation-set-definition.mjs';
export async function qualifyFinality(directory) {
  const results=[];
  for(const kind of ['signed-frontier','fixed-validator']) {
    const devices=[],sessions=[];
    try {
      for(const name of ['a','b','offline','observer'])devices.push(await openNativeDevice({path:join(directory,`${kind}-${name}.sqlite`),create:true}));
      const applicationId=randomBytes(32).toString('hex'),epochKey=new Uint8Array(randomBytes(32)),scope=await recordDigest(['scope',applicationId]);
      const finalityPolicy=kind==='signed-frontier'?{kind,signer:devices[0].identity.publicKey,scopes:[{id:scope,authorTimeAfterMs:-1n}]}:
        {kind,validators:devices.slice(0,2).map(device=>device.identity.publicKey),threshold:2,scopes:[{id:scope,authorTimeAfterMs:-1n}]};
      const authority=await createFixtureAuthority({applicationId,signer:devices[0].identity,devices,epochKey,finalityPolicy});
      for(const device of devices)sessions.push(await createApplicationSession({device,definition:conversation,authority,epochKeys:new Map([[0,epochKey]])}));
      const [a,b,offline,observer]=sessions;
      const post=async(session,operationId,time)=>{const operation=await session.command('postMessage',{messageId:operationId,text:operationId},{operationId,authorTimestampMs:time});await operation.materialized();return operation;};
      const admitted=await post(a,'included',100n),delayed=await post(offline,'delayed-offline',50n);
      assert.equal(admitted.inspect().finalized,false);assert.equal(delayed.inspect().stored,true);
      const originalEnvelope=offline.exportFacts().envelopes.find(value=>value.payload.proposalId===delayed.id),originalDigest=await recordDigest(originalEnvelope);
      await b.mergeFacts(a.exportFacts());await b.readView().then(view=>view.release());
      let proofs;
      if(kind==='signed-frontier')proofs=(await a.finality.closeAuthorTime({throughMs:100n})).proofs;
      else {
        await assert.rejects(a.finality.closeAuthorTime({throughMs:100n}),/FINALITY_QUORUM_REQUIRED/);
        const [votesA,votesB]=await Promise.all([a.finality.voteAuthorTime({throughMs:100n}),b.finality.voteAuthorTime({throughMs:100n})]);
        proofs=await Promise.all(votesA.map(async vote=>{const matching=await Promise.all(votesB.map(async other=>({other,same:await recordDigest(other.payload)===await recordDigest(vote.payload)})));const other=matching.find(value=>value.same)?.other;assert.ok(other);return{statement:vote.payload,signatures:[vote,other]};}));
        const insufficient=proofs.map(proof=>({...proof,signatures:proof.signatures.slice(0,1)}));await assert.rejects(a.finality.submitProofs(insufficient),/FINALITY_THRESHOLD_MISSING/);
        await a.finality.submitProofs(proofs);
      }
      assert.equal((await admitted.finalized()).outcome,'accepted');
      // Verified proofs without bodies cannot publish a final read.
      await observer.finality.submitProofs(proofs);await assert.rejects(observer.readView({view:'final'}),/FINAL_READ_UNAVAILABLE/);
      await observer.mergeFacts(a.exportFacts());const finalView=await observer.readView({view:'final'});assert.equal(finalView.readEvents().events.length,1);finalView.release();
      await a.mergeFacts(offline.exportFacts());await a.readView().then(view=>view.release());
      const excluded=a.operation(delayed.id).inspect();assert.equal(excluded.stored,true);assert.equal(excluded.excluded,true);assert.equal(excluded.authorTimestampMs,'50');
      assert.equal(await recordDigest(a.exportFacts().envelopes.find(value=>value.payload.proposalId===delayed.id)),originalDigest);
      const retry=await offline.command('postMessage',{messageId:'delayed-offline',text:'delayed-offline'},{operationId:'delayed-offline'});assert.equal(retry.id,delayed.id);
      const identity=a.identity.publicKey;await a.close();
      const device=await openNativeDevice({path:join(directory,`${kind}-a.sqlite`)});devices.push(device);
      const reopened=await createApplicationSession({device,applicationId,definition:conversation});sessions.push(reopened);
      assert.equal(reopened.identity.publicKey,identity);assert.equal((await reopened.operation('included').finalized()).outcome,'accepted');
      const retained=reopened.operation(delayed.id).inspect();assert.equal(retained.excluded,true);
      results.push({policy:kind,unavailableProviderLocalAuthoring:true,proofs:proofs.length,threshold:kind==='fixed-validator'?2:1,
        included:admitted.id,finalized:true,missingBodyBlockedFinalRead:true,lateExcluded:true,lateProposal:delayed.id,
        originalSignedDigest:originalDigest,retainedSignedDigest:await recordDigest(reopened.exportFacts().envelopes.find(value=>value.payload.proposalId===delayed.id)),
        originalTime:'50',retainedTime:retained.authorTimestampMs,reloadFinality:true});
    }finally{await Promise.allSettled(sessions.map(session=>session.close()));await Promise.allSettled(devices.map(device=>device.close()));}
  }
  return results;
}
