// Abrupt process termination after the public submission resolves local durability.
// No graceful session/device close occurs on this deliberate fault path.
import { writeSync } from 'node:fs';
import { recordDigest } from '@chronolog/authority';
import { createApplicationSession } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { conversation } from './operation-set-definition.mjs';
const device=await openNativeDevice({path:process.argv[2]});
const session=await createApplicationSession({device,applicationId:process.argv[3],definition:conversation});
const operation=await session.command('postMessage',{messageId:'native-abrupt-durable',text:'Persisted before native process termination'},
  {operationId:'native-abrupt-durable',authorTimestampMs:700n});
if(!operation.stored)throw Error('SUBMISSION_NOT_DURABLE');
writeSync(1,JSON.stringify({proposalId:operation.id,authorTimestampMs:operation.inspect().authorTimestampMs,
  signedDigest:await recordDigest(session.exportFacts().envelopes.find(value=>value.payload.proposalId===operation.id))}));
process.exit(73);
