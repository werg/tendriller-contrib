// Application policy for two deliberately small, deterministic specialist agents.
// The maintained module owns claims/results; this file owns only review choices.
import { createCollaborationClient } from '@tendriller/core/collaboration';

const policies = {
  evidence(task) {
    const text = typeof task.input?.text === 'string' ? task.input.text : JSON.stringify(task.input);
    const findings = [];
    if (!text.trim()) findings.push('The request contains no evidence.');
    if (!task.context || Object.keys(task.context).length === 0) findings.push('Add an explicit source context.');
    if (/\b(?:tbd|todo|unknown|unverified)\b/iu.test(text)) findings.push('The evidence marks unresolved information; keep it visible in the synthesis.');
    return { policy: 'evidence', text: findings.length ? findings.join(' ') : 'The request includes evidence and source context. Verify the source before relying on its factual accuracy.',
      findings, inputContext: task.context };
  },
  clarity(task) {
    const text = typeof task.input?.text === 'string' ? task.input.text : JSON.stringify(task.input);
    const words = text.trim().split(/\s+/u).filter(Boolean).length;
    const findings = words > 180 ? ['Separate the observations from the requested decision to make the review easier to follow.'] : [];
    return { policy: 'clarity', text: findings.length ? findings.join(' ') : 'The request is compact enough for a focused review. Keep the final decision linked to its accepted contributions.',
      findings, words, title: task.title };
  },
};

function sameFence(a, b) {
  return !!a && !!b && ['claimant', 'runId', 'endpointIncarnation', 'generation', 'claimEpoch'].every(key => a[key] === b[key]);
}

/** Reversible local computation only. Provider calls require a separate effect
 * journal and dispatch/reconciliation policy, not replacement of these functions. */
export async function reviewAssignedTask({ session, endpoint = session.endpoint, runId, taskId, slotId,
  policy, signal, onOperation = () => undefined }) {
  if (!Object.hasOwn(policies, policy)) throw Error('Choose the evidence or clarity reference policy');
  if (!endpoint?.endpointId || !endpoint.endpointIncarnation || !runId) throw Error('A retained signer, allocated endpoint and run are required');
  const client = createCollaborationClient({ session, endpoint, runId });
  const submit = async (method, input, operationId) => {
    onOperation({ method, reference: { applicationId: session.applicationId, author: session.deviceId, operationId } });
    const operation = await client[method](input, { operationId }); return operation.applied({ signal });
  };
  signal?.throwIfAborted();
  const before = (await client.inspect(taskId)).value;
  const slot = before.task?.slots.find(value => value.slotId === slotId), previous = before.claims.find(value => value.slotId === slotId);
  if (!slot || before.task.status !== 'open' || !(!previous && slot.eligibleSigners.includes(session.deviceId)
      || previous?.status === 'offered' && previous.claimant === session.deviceId)) return { status: 'not-eligible' };
  const claimId = crypto.randomUUID();
  const admission = await submit('claim', { taskId, slotId, claimId, expectedEpoch: previous?.claimEpoch ?? 0, taskVersion: 1 }, `${claimId}:claim`);
  if (admission.outcome !== 'accepted') return { status: 'claim-conflict', operation: admission };
  const claimed = (await client.inspect(taskId)).value, fence = claimed.claims.find(value => value.slotId === slotId);
  if (claimed.task.status !== 'open' || fence?.status !== 'active' || fence.claimant !== session.deviceId ||
      fence.runId !== runId || fence.endpointIncarnation !== endpoint.endpointIncarnation || fence.generation !== session.status.generation)
    return { status: 'needs-review', claim: fence };
  signal?.throwIfAborted();
  const stream = { streamId: runId, endpointId: endpoint.endpointId, endpointIncarnation: endpoint.endpointIncarnation };
  // Disposable progress cannot block or fail a durable contribution.
  await session.signals.send('progress', { runId, completed: 0, total: 1 }, { stream, ttlMs: 5000, signal }).catch(() => undefined);
  const content = policies[policy](claimed.task);
  signal?.throwIfAborted();
  const current = (await client.inspect(taskId)).value, latest = current.claims.find(value => value.slotId === slotId);
  if (!sameFence(fence, latest) || latest.generation !== session.status.generation) return { status: 'superseded', claim: latest };
  if (current.task.status === 'cancelRequested') {
    const stopped = await submit('acknowledgeCancel', { taskId, slotId, actionId: `${claimId}:stopped`, claimEpoch: fence.claimEpoch,
      generation: fence.generation, runId: fence.runId, endpointIncarnation: fence.endpointIncarnation }, `${claimId}:ack`);
    return { status: stopped.outcome === 'accepted' ? 'cancelled' : 'needs-review', operation: stopped };
  }
  if (current.task.status !== 'open' || latest.status !== 'active') return { status: 'needs-review', claim: latest };
  const resultId = `${claimId}:result`;
  const operation = await submit('result', { taskId, slotId, resultId, claimEpoch: fence.claimEpoch, taskVersion: 1,
    generation: fence.generation, runId: fence.runId, endpointIncarnation: fence.endpointIncarnation, outcome: 'succeeded', content }, `${claimId}:result`);
  const result = (await client.inspect(taskId)).value.results.find(value => value.resultId === resultId);
  await session.signals.send('progress', { runId, completed: 1, total: 1 }, { stream, ttlMs: 5000, signal }).catch(() => undefined);
  return { status: result?.disposition ?? 'needs-review', result, operation };
}

/** Observe shared work; claim only slots explicitly assigned to this signer.
 * This loop holds no retry queue and never adopts an old run's active claim. */
export async function runReviewer({ session, endpoint = session.endpoint, runId, policy, signal, onOperation, onResult = () => undefined }) {
  if (!Object.hasOwn(policies, policy)) throw Error('Choose the evidence or clarity reference policy');
  const client = createCollaborationClient({ session, endpoint, runId }), changes = session.changes({ signal })[Symbol.asyncIterator]();
  let changed = changes.next();
  const attempted = new Set();
  const drain = async () => {
    for (;;) {
      signal?.throwIfAborted();
      const current = await client.snapshot(); let selected;
      const eligible = new Set();
      for (const task of current.value.tasks.filter(value => value.status === 'open')) for (const slot of task.slots) {
        const claim = current.value.claims.find(value => value.taskId === task.taskId && value.slotId === slot.slotId);
        if (!(!claim && slot.eligibleSigners.includes(session.deviceId) || claim?.status === 'offered' && claim.claimant === session.deviceId)) continue;
        const key = JSON.stringify([task.taskId, slot.slotId, claim?.claimEpoch ?? 0, current.revision.generation]);
        eligible.add(key); if (!selected && !attempted.has(key)) selected = { taskId: task.taskId, slotId: slot.slotId, key };
      }
      for (const key of attempted) if (!eligible.has(key)) attempted.delete(key);
      if (!selected) return;
      attempted.add(selected.key);
      const result = await reviewAssignedTask({ session, endpoint, runId, policy, taskId: selected.taskId, slotId: selected.slotId, signal, onOperation });
      onResult({ taskId: selected.taskId, slotId: selected.slotId, ...result });
    }
  };
  try {
    await drain();
    while (!signal?.aborted) {
      const next = await changed; if (next.done) break; changed = changes.next(); await drain();
    }
  } finally { await changes.return(); await changed.catch(() => undefined); }
}
