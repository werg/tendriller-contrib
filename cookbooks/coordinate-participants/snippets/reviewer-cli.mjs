// Attach to a separately enrolled agent's existing native supervisor. This
// process never opens or recreates a signing store when attachment fails.
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { attachNativeSession } from '@tendriller/core/native-owner';
import { connectApplicationOwner } from '@chronolog/peer-session/browser';
import { runReviewer } from './reviewer.mjs';

const { values } = parseArgs({ options: { directory: { type: 'string' }, 'token-file': { type: 'string' },
  'application-id': { type: 'string' }, policy: { type: 'string' } } });
for (const name of ['directory', 'token-file', 'application-id', 'policy']) if (!values[name]) throw Error(`Required --${name}`);
if (!['evidence', 'clarity'].includes(values.policy)) throw Error('Use --policy evidence or --policy clarity');
const lifetime = new AbortController(), stop = () => lifetime.abort();
process.once('SIGINT', stop); process.once('SIGTERM', stop);
const token = (await readFile(values['token-file'], 'utf8')).trim(), runId = crypto.randomUUID();
const owned = await attachNativeSession({ directory: values.directory, token, connect: connectApplicationOwner,
  applicationId: values['application-id'], definitionId: 'independent-review-workspace', definitionVersion: '1',
  context: { runId, documentPath: `native:${values.policy}` }, signal: lifetime.signal });
try {
  const actualRunId = owned.session.endpoint.context.runId ?? runId;
  const emit = value => process.stdout.write(`${JSON.stringify(value)}\n`);
  emit({ status: 'attached', policy: values.policy, signer: owned.session.deviceId, endpoint: owned.session.endpoint, runId: actualRunId });
  await runReviewer({ session: owned.session, runId: actualRunId, policy: values.policy, signal: lifetime.signal,
    onOperation: value => emit({ type: 'operation-reference', ...value }), onResult: value => emit({ type: 'review-result', ...value }) });
} catch (error) { if (!lifetime.signal.aborted) throw error; }
finally { await owned.detach(); process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
