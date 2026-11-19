// Editable application UI. The maintained owner and collaboration module own
// session lifetime, operation persistence and guarded state transitions.
import { createCollaborationClient, createViewStore, mountParticipantPanel, receiptModel } from '@tendriller/core/collaboration';
import { createLiveRun } from './domain/live-run.mjs';

const $ = selector => document.querySelector(selector);
const node = (tag, text, className) => { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; };
const action = (label, callback, disabled = false) => {
  const button = node('button', label); button.type = 'button'; button.disabled = disabled;
  button.addEventListener('click', () => { button.disabled = true; void callback().catch(report).finally(() => { button.disabled = disabled; }); });
  return button;
};
const freshId = () => crypto.randomUUID();
let session, client, store, snapshot, participantPanel, deployment, entries = [], selectedTask, submitting = false, runId;
let detachView = async () => session?.detach(), suspendView = async () => session?.suspend(), resumeView = async () => session?.resumeAttachment();
let observation = new AbortController(), dirty = false, refreshing = false;
let runSubscription, runScopeKey = '', runTimer, liveRuns = new Map();
const statuses = new Map();
const waiters = new Map();
const report = error => { $('#status').textContent = error.message ?? String(error); $('#status').dataset.state = 'error'; };
const say = text => { $('#status').textContent = text; $('#status').dataset.state = 'ready'; };
const canWrite = () => entries.some(entry => entry.deviceId === session.deviceId && entry.authorized && !entry.revoked);
const canManage = task => canWrite() && (task.creator === session.deviceId || entries.some(entry => entry.deviceId === session.deviceId && entry.applicationAdministrator === true));
const label = signer => entries.find(entry => entry.deviceId === signer)?.label ?? `Participant ${signer.slice(0, 8)}`;
const originLabel = source => {
  const path = typeof source?.documentPath === 'string' ? source.documentPath : '';
  const view = path.endsWith('discussion.html') ? 'Discussion view' : path.endsWith('board.html') ? 'Board view'
    : path.startsWith('native:') ? 'Native participant' : path || 'Participant endpoint';
  return `${view} · ${source?.contextEvidence === 'owner-validated' ? 'verified live view context' : 'signer-reported context'}`;
};
const diagnostics = (title, value) => { const details = node('details', ''); details.append(node('summary', title), node('pre', JSON.stringify(value, null, 2))); return details; };

function retainDraft() {
  store.writeDraft({ title: $('#request-title').value, input: $('#request-input').value, message: $('#message').value,
    recipient: $('#recipient').value, policy: $('#response-policy').value, selectedTask: selectedTask ?? null });
}
function restoreDraft() {
  const draft = store.readDraft();
  if (!draft) return;
  $('#request-title').value = draft.title ?? ''; $('#request-input').value = draft.input ?? '';
  $('#message').value = draft.message ?? ''; $('#recipient').value = draft.recipient ?? '';
  $('#response-policy').value = draft.policy ?? 'one'; selectedTask = draft.selectedTask;
}
async function submit(method, input, title, options = {}) {
  if (!canWrite()) throw Error('This participant currently has read-only access.');
  const operationId = options.operationId ?? freshId();
  const reference = { applicationId: session.applicationId, author: session.deviceId, operationId };
  // Retain identity and original intent before the first uncertain call. This
  // local record is a pointer; it never resubmits or replaces the session journal.
  store.retainOperation(reference, { method, input, title });
  paintOperations();
  const operation = await client[method](input, { operationId, ...(snapshot ? { basedOn: snapshot.revision } : {}) });
  store.retainOperation(operation.reference ?? reference, { method, input, title });
  const waiter = new AbortController(); waiters.set(operationId, waiter);
  statuses.set(operationId, await operation.get()); paintOperations();
  void operation.applied({ signal: AbortSignal.any([observation.signal, waiter.signal]) }).then(async value => {
    statuses.set(operationId, value); paintOperations();
    say(value.outcome === 'rejected' ? `${title} was rejected. Review its original operation.` : `${title} applied to the shared workspace.`);
    await refresh();
  }).catch(error => { if (!observation.signal.aborted && !waiter.signal.aborted) report(error); })
    .finally(() => { if (waiters.get(operationId) === waiter) waiters.delete(operationId); paintOperations(); });
  return operation;
}

function paintOperations() {
  const references = store.pending();
  $('#operations').replaceChildren(...references.slice().reverse().map(({ reference, context }) => {
    const state = statuses.get(reference.operationId), row = node('li', '', 'operation');
    row.append(node('strong', context.title ?? context.method ?? 'Retained operation'));
    const receipt = receiptModel(state ?? { status: 'uncertain' });
    row.append(node('p', receipt.label ?? receipt.message ?? (state ? `${state.status}${state.outcome ? ` · ${state.outcome}` : ''}` : 'Checking the original operation…')));
    row.append(action('Inspect original', async () => {
      statuses.set(reference.operationId, await session.operations.get(reference.operationId, { author: reference.author })); paintOperations();
    }));
    if (waiters.has(reference.operationId)) row.append(action('Stop waiting here', async () => {
      waiters.get(reference.operationId)?.abort(); waiters.delete(reference.operationId); paintOperations();
      say('Stopped waiting in this view. The original operation remains inspectable; shared work was not cancelled.');
    }));
    if (state?.status === 'saved') row.append(action('Retry same signed attempt', async () => { await session.retry(reference.operationId); await refresh(); }));
    if (['abandoned', 'needsReapply'].includes(state?.status)) {
      row.append(node('p', 'This attempt is outside the selected history. Review the current request and create a new explicit action if still needed.', 'review-note'));
      if (context.method === 'request') row.append(action('Copy request into draft', async () => {
        $('#request-title').value = context.input.title; $('#request-input').value = context.input.input?.text ?? '';
        retainDraft(); $('#request-title').focus();
      }));
    }
    if (state === null || ['applied', 'abandoned', 'needsReapply'].includes(state?.status)) {
      row.append(action('Remove this view’s reference', async () => { store.removeOperation(reference); paintOperations(); }));
    }
    const details = node('details', ''), summary = node('summary', 'Operation details');
    details.append(summary, node('pre', JSON.stringify({ reference, state }, null, 2))); row.append(details);
    return row;
  }));
  $('#operations-empty').hidden = references.length > 0;
}

function paintTasks(value) {
  // A remote update may replace a card but must not interrupt a local edit.
  const focused = document.activeElement;
  const retainedFocus = focused?.dataset.localDraft ? { draft: focused.dataset.localDraft,
    start: focused.selectionStart, end: focused.selectionEnd, direction: focused.selectionDirection } : null;
  $('#tasks').replaceChildren(...value.tasks.map(task => {
    const card = node('article', '', `task${task.taskId === selectedTask ? ' selected' : ''}`);
    card.dataset.taskId = task.taskId;
    card.append(node('p', `${task.status === 'needsReview' ? 'Review required' : task.status} · ${task.responsePolicy}`, 'eyebrow'));
    card.append(node('h3', task.title), node('p', typeof task.input?.text === 'string' ? task.input.text : JSON.stringify(task.input)));
    card.append(node('p', `${label(task.creator)} · ${originLabel(task.source)}`, 'muted'));
    card.append(diagnostics('Request origin and operation', { taskId: task.taskId, author: task.creator,
      source: task.source, operation: task.operation ?? null, context: task.context }));
    card.append(action(task.taskId === selectedTask ? 'Selected conversation' : 'Open conversation', async () => {
      selectedTask = task.taskId; retainDraft(); paint(snapshot.value); $('#message').focus();
    }));
    const slots = node('ul', '', 'slots');
    for (const slot of task.slots) {
      const claim = value.claims.find(item => item.taskId === task.taskId && item.slotId === slot.slotId);
      const results = value.results.filter(item => item.taskId === task.taskId && item.slotId === slot.slotId);
      const acceptedResult = results.find(item => item.disposition === 'accepted');
      const row = node('li', ''); row.append(node('strong', slot.label ?? slot.slotId));
      row.append(node('p', claim ? `${label(claim.claimant)} · ${claim.status}${claim.runId ? ` · ${claim.runId}` : ''}` : 'Awaiting an eligible participant'));
      if (acceptedResult) {
        row.append(node('p', acceptedResult.outcome === 'failed' ? 'Contributor reported a failure' : 'Contribution accepted', 'receipt'));
        row.append(node('p', acceptedResult.content?.text ?? JSON.stringify(acceptedResult.content)));
        row.append(diagnostics('Contribution origin', { resultId: acceptedResult.resultId, author: acceptedResult.author,
          runId: acceptedResult.runId, claimEpoch: acceptedResult.claimEpoch, generation: acceptedResult.generation,
          operation: acceptedResult.operation ?? null }));
      }
      if (results.some(item => item.disposition !== 'accepted')) {
        const details = node('details', ''); details.append(node('summary', 'Late or superseded evidence'));
        for (const result of results.filter(item => item.disposition !== 'accepted')) details.append(node('p', `${label(result.author)} · ${result.disposition} · ${result.content?.text ?? JSON.stringify(result.content)}`));
        row.append(details);
      }
      const eligible = !claim ? slot.eligibleSigners.includes(session.deviceId) : claim.status === 'offered' && claim.claimant === session.deviceId;
      if (task.status === 'open' && eligible && canWrite()) row.append(action('Claim this contribution', () => submit('claim', {
        taskId: task.taskId, slotId: slot.slotId, claimId: freshId(), expectedEpoch: claim?.claimEpoch ?? 0, taskVersion: 1,
      }, `Claim ${slot.label ?? slot.slotId}`)));
      if (claim?.claimant === session.deviceId && canWrite()) {
        const currentEndpoint = claim.endpointIncarnation === session.endpoint.endpointIncarnation && claim.runId === runId;
        if (claim.status === 'needsReview') row.append(action('Revalidate this claim', () => submit('rebind', {
          taskId: task.taskId, slotId: slot.slotId, claimId: freshId(), expectedEpoch: claim.claimEpoch, taskVersion: 1,
        }, `Revalidate ${slot.label ?? slot.slotId}`)));
        if (claim.status === 'active' && !currentEndpoint) {
          row.append(node('p', 'This claim belongs to another view or an earlier run. Review its draft and explicitly transfer responsibility before continuing.', 'review-note'));
          row.append(action('Restart this claim on this view', async () => {
            const operation = await submit('handoff', { taskId: task.taskId, slotId: slot.slotId, actionId: freshId(),
              expectedEpoch: claim.claimEpoch, assignee: session.deviceId, reason: 'Explicit continuation from another endpoint incarnation' }, 'Transfer to this view');
            await operation.applied({ signal: observation.signal }); await refresh();
          }));
        }
        if (claim.status === 'active' && currentEndpoint) {
          const form = node('form', '', 'contribution-form'), labelElement = node('label', 'Your contribution');
          const input = node('textarea', ''); input.required = true; input.maxLength = 4000; input.rows = 3;
          const draftId = `result:${task.taskId}:${slot.slotId}`;
          input.dataset.localDraft = draftId;
          input.value = store.readDraft(draftId)?.text ?? '';
          input.oninput = () => { try { store.writeDraft({ text: input.value }, draftId); } catch (error) { report(error); } };
          labelElement.append(input); form.append(labelElement);
          const button = node('button', 'Submit reviewed result'); button.type = 'submit'; form.append(button);
          form.onsubmit = event => {
            event.preventDefault(); if (!input.value.trim()) return; button.disabled = true;
            void submit('result', { taskId: task.taskId, slotId: slot.slotId, resultId: freshId(),
              claimEpoch: claim.claimEpoch, taskVersion: 1, generation: claim.generation,
              runId: claim.runId, endpointIncarnation: claim.endpointIncarnation, outcome: 'succeeded',
              content: { text: input.value.trim() } }, `Contribute to ${task.title}`).catch(report).finally(() => { button.disabled = false; });
          };
          row.append(form);
        }
        if (claim.status === 'cancelRequested' && currentEndpoint) row.append(action('Acknowledge stopped work', () => submit('acknowledgeCancel', {
          taskId: task.taskId, slotId: slot.slotId, actionId: freshId(), claimEpoch: claim.claimEpoch,
          generation: claim.generation, runId: claim.runId, endpointIncarnation: claim.endpointIncarnation,
        }, 'Acknowledge cancellation')));
      }
      if (claim && !['completed', 'cancelled'].includes(claim.status) && task.status === 'open' && canWrite() && (canManage(task) || claim.claimant === session.deviceId)) {
        const target = node('select', ''); target.setAttribute('aria-label', `Transfer ${slot.label ?? slot.slotId} to`);
        for (const entry of entries.filter(item => item.authorized && !item.revoked && item.deviceId !== claim.claimant)) {
          const option = node('option', entry.label ?? label(entry.deviceId)); option.value = entry.deviceId; target.append(option);
        }
        row.append(target, action('Transfer responsibility', () => submit('handoff', { taskId: task.taskId, slotId: slot.slotId,
          actionId: freshId(), expectedEpoch: claim.claimEpoch, assignee: target.value, reason: 'Explicit transfer from this view' }, 'Transfer responsibility'), !target.options.length));
      }
      slots.append(row);
    }
    card.append(slots);
    if (task.aggregate) card.append(node('p', `${task.aggregate.disposition === 'partial' ? 'Partial synthesis' : 'Accepted synthesis'} · ${label(task.aggregate.author)}`, 'receipt'),
      node('p', task.aggregate.content?.text ?? JSON.stringify(task.aggregate.content)));
    else if (canManage(task) && task.status === 'open') {
      card.append(action('Request cancellation', () => submit('cancel', { taskId: task.taskId, actionId: freshId(),
        expectedVersion: task.version, reason: 'Cancelled by the task owner' }, `Cancel ${task.title}`)));
      const acceptedResults = value.results.filter(item => item.taskId === task.taskId && item.disposition === 'accepted');
      const ready = ['one', 'firstAccepted'].includes(task.responsePolicy) ? acceptedResults.length > 0
        : task.responsePolicy === 'manual' ? acceptedResults.length > 0 : acceptedResults.length === task.slots.length;
      if (ready) {
        const form = node('form', '', 'synthesis-form'), labelElement = node('label', 'Reviewed synthesis');
        const input = node('textarea', ''); input.required = true; input.rows = 3; input.maxLength = 4000;
        const draftId = `synthesis:${task.taskId}`;
        input.dataset.localDraft = draftId;
        input.value = store.readDraft(draftId)?.text ?? '';
        input.oninput = () => { try { store.writeDraft({ text: input.value }, draftId); } catch (error) { report(error); } };
        labelElement.append(input); form.append(labelElement);
        const button = node('button', acceptedResults.length < task.slots.length ? 'Accept partial synthesis' : 'Accept synthesis');
        button.type = 'submit'; form.append(button);
        form.onsubmit = event => {
          event.preventDefault(); if (!input.value.trim()) return; button.disabled = true;
          const selected = ['one', 'firstAccepted'].includes(task.responsePolicy) ? acceptedResults.slice(0, 1) : acceptedResults;
          void submit('finalize', { taskId: task.taskId, actionId: freshId(), expectedVersion: task.version,
            resultIds: selected.map(item => item.resultId), content: { text: input.value.trim() },
            allowPartial: selected.length < task.slots.length }, `Finalize ${task.title}`).catch(report).finally(() => { button.disabled = false; });
        };
        card.append(form);
      }
    }
    return card;
  }));
  $('#tasks-empty').hidden = value.tasks.length > 0;
  if (retainedFocus) {
    const replacement = [...$('#tasks').querySelectorAll('textarea[data-local-draft]')]
      .find(element => element.dataset.localDraft === retainedFocus.draft);
    if (replacement) { replacement.focus({ preventScroll: true }); replacement.setSelectionRange(retainedFocus.start, retainedFocus.end, retainedFocus.direction); }
  }
}

function paintRuns() {
  clearTimeout(runTimer);
  let expiresAt = Infinity;
  $('#runs').replaceChildren(...[...liveRuns.values()].map(({ claim, model }) => {
    const value = model.snapshot(Date.now()), row = node('li', '');
    row.append(node('strong', label(claim.claimant)), node('p', `${claim.status} · ${claim.slotId}`, 'muted'));
    if (value.progress) row.append(node('p', value.progress.total === null
      ? `${value.progress.completed} steps reported` : `${value.progress.completed} of ${value.progress.total} steps reported`));
    else row.append(node('p', 'No fresh progress report. The claim remains recorded.'));
    if (value.preview) row.append(node('p', value.preview.text, 'live-preview'));
    if (value.expiresAtMs !== null) expiresAt = Math.min(expiresAt, value.expiresAtMs);
    const details = node('details', ''); details.append(node('summary', 'Run identity'), node('pre', JSON.stringify({
      signer: claim.claimant, runId: claim.runId, endpointIncarnation: claim.endpointIncarnation,
      claimEpoch: claim.claimEpoch, generation: claim.generation }, null, 2))); row.append(details);
    return row;
  }));
  $('#runs-empty').hidden = liveRuns.size > 0;
  if (expiresAt < Infinity && !observation.signal.aborted) runTimer = setTimeout(paintRuns, Math.max(0, expiresAt - Date.now()));
}
function observeRuns(value) {
  const claims = value.claims.filter(claim => claim.taskId === selectedTask && ['active', 'cancelRequested'].includes(claim.status));
  const key = JSON.stringify(claims.map(claim => [claim.claimant, claim.runId, claim.endpointIncarnation, claim.claimEpoch, claim.status]));
  if (key === runScopeKey && !runSubscription?.signal.aborted) return;
  runScopeKey = key; runSubscription?.abort(); clearTimeout(runTimer); runSubscription = new AbortController();
  const controller = runSubscription, lifetime = AbortSignal.any([observation.signal, controller.signal]);
  liveRuns = new Map(claims.map(claim => [JSON.stringify([claim.claimant, claim.runId, claim.endpointIncarnation]),
    { claim, model: createLiveRun({ publisher: claim.claimant, runId: claim.runId, endpointIncarnation: claim.endpointIncarnation }) }]));
  paintRuns(); if (!claims.length) return;
  void (async () => {
    try {
      for await (const event of session.signals.subscribe({ topics: ['progress', 'preview'], mode: 'latest',
        streams: claims.map(claim => ({ authorId: claim.claimant, streamId: claim.runId, endpointIncarnation: claim.endpointIncarnation })), signal: lifetime })) {
        if (lifetime.aborted) break;
        liveRuns.get(JSON.stringify([event.authorId, event.stream?.streamId, event.stream?.endpointIncarnation]))?.model.update(event, Date.now());
        paintRuns();
      }
    } catch (error) { if (!lifetime.aborted) report(error); }
    finally { if (runSubscription === controller) { for (const value of liveRuns.values()) value.model.clear(); paintRuns(); } }
  })();
}

async function refreshParticipants() {
  const current = await deployment.readParticipants(session);
  if (!Array.isArray(current)) throw Error('The deployment must provide authenticated participant bindings.');
  entries = current;
  participantPanel?.update(entries);
  const selected = $('#recipient').value;
  const eligible = [...new Map(entries.filter(entry => entry.authorized && !entry.revoked).map(entry => [entry.deviceId, entry])).values()];
  $('#recipient').replaceChildren(...eligible.map(entry => {
    const option = node('option', entry.label ?? label(entry.deviceId)); option.value = entry.deviceId; return option;
  }));
  if (eligible.some(entry => entry.deviceId === selected)) $('#recipient').value = selected;
  const self = entries.find(entry => entry.deviceId === session.deviceId && !entry.revoked);
  if (!self || !(self.canRead || self.authorized)) {
    snapshot = undefined; $('#tasks').replaceChildren(); $('#messages').replaceChildren(); runSubscription?.abort();
    $('#request-submit').disabled = true; $('#message-submit').disabled = true;
    throw Error('This signing profile no longer has workspace access. Shared content has been cleared.');
  }
  $('#request-submit').disabled = !self.authorized || submitting; $('#message-submit').disabled = !self.authorized;
}

function paint(value) {
  paintTasks(value);
  const task = value.tasks.find(item => item.taskId === selectedTask);
  $('#thread-title').textContent = task ? task.title : 'Workspace conversation';
  const threadId = selectedTask ?? 'workspace';
  $('#messages').replaceChildren(...value.messages.filter(item => item.threadId === threadId).map(message => {
    const row = node('li', ''); row.append(node('p', message.text), node('small', `${label(message.author)} · ${originLabel(message.source)}`)); return row;
  }));
  $('#recovery').hidden = !value.tasks.some(item => item.status === 'needsReview');
  observeRuns(value);
  paintOperations();
}
async function refresh() {
  dirty = true; if (refreshing || observation.signal.aborted) return;
  refreshing = true;
  try {
    while (dirty && !observation.signal.aborted) {
      dirty = false; await refreshParticipants(); const current = await client.snapshot();
      const pending = await Promise.all(store.pending().map(async ({ reference }) => [reference.operationId,
        await session.operations.get(reference.operationId, { author: reference.author })]));
      if (observation.signal.aborted) return;
      snapshot = current; for (const [id, state] of pending) statuses.set(id, state);
      $('#revision').textContent = `Selected history ${current.revision.generation.slice(0, 10)}`; paint(current.value);
    }
  } finally { refreshing = false; }
}
async function observe() {
  try { for await (const change of session.changes({ signal: observation.signal })) {
    if (change.kind === 'recovery') say('History changed. Retained attempts and active claims need review.');
    await refresh();
  } } catch (error) { if (!observation.signal.aborted) report(error); }
}

$('#request-form').onsubmit = async event => {
  event.preventDefault(); if (!client || submitting) return;
  const title = $('#request-title').value.trim(), text = $('#request-input').value.trim(); if (!title || !text) return;
  const policy = $('#response-policy').value;
  const signers = policy === 'one' ? [$('#recipient').value]
    : [...new Set(entries.filter(entry => entry.authorized && !entry.revoked && entry.kind === 'agent').map(entry => entry.deviceId))];
  if (!signers.length || !signers[0]) { say('Choose an authorized recipient before creating work.'); return; }
  if (signers.length > 8) { say('Choose at most eight specialists for this reference workflow.'); return; }
  const interactionId = freshId(); submitting = true; $('#request-submit').disabled = true;
  try {
    await submit('request', { interactionId, kind: 'reviewEvidence', title, input: { text }, context: { source: 'reviewed-text' },
      target: policy === 'one' ? { kind: 'signer', deviceId: signers[0] } : { kind: 'workerGroup', groupId: 'specialists' },
      responsePolicy: policy, slots: signers.map((signer, index) => ({ slotId: `review-${index + 1}`, eligibleSigners: [signer], label: label(signer) })) }, `Request ${title}`);
    selectedTask = interactionId; $('#request-title').value = ''; $('#request-input').value = ''; retainDraft();
  } catch (error) { report(error); }
  finally { submitting = false; $('#request-submit').disabled = false; }
};
$('#message-form').onsubmit = async event => {
  event.preventDefault(); const text = $('#message').value.trim(); if (!client || !text) return;
  try { await submit('message', { threadId: selectedTask ?? 'workspace', messageId: freshId(), text }, 'Post message');
    $('#message').value = ''; retainDraft(); } catch (error) { report(error); }
};
for (const id of ['request-title', 'request-input', 'message', 'recipient', 'response-policy']) $( `#${id}`).addEventListener('input', () => {
  try { if (store) retainDraft(); } catch (error) { report(error); }
});

window.addEventListener('pagehide', event => {
  observation.abort(); runSubscription?.abort(); clearTimeout(runTimer);
  if (event.persisted) void suspendView().catch(report);
  else { participantPanel?.close?.(); void detachView().catch(() => undefined); }
});
window.addEventListener('pageshow', event => {
  if (!event.persisted || !session) return;
  void resumeView().then(() => { observation = new AbortController(); void observe(); return refresh(); },
    () => say('This view’s owner was replaced. Reload to reattach, then inspect original operations.'));
});
$('#refresh-participants').onclick = () => { if (session) void refreshParticipants().catch(report); };

try {
  deployment = await import('./deployment/bootstrap.mjs');
  detachView = deployment.detachView ?? detachView; suspendView = deployment.suspendView ?? suspendView; resumeView = deployment.resumeView ?? resumeView;
  session = await deployment.applicationReady;
  if (!session.endpoint) throw Error('This reference needs a shared session-owner attachment. Open the matching deployment bootstrap.');
  const viewId = session.endpoint.context.viewId;
  if (!viewId) throw Error('The owner did not allocate an independent view.');
  store = createViewStore({ storage: localStorage, applicationId: session.applicationId, profileId: session.deviceId, viewId });
  runId = `view-${session.endpoint.endpointIncarnation}`;
  client = createCollaborationClient({ session, endpoint: session.endpoint, runId });
  await refreshParticipants();
  participantPanel = mountParticipantPanel({ container: $('#participants'), participants: entries,
    selfEndpoint: { ...session.endpoint, deviceId: session.deviceId }, onSelect: entry => { $('#recipient').value = entry.deviceId; retainDraft(); } });
  restoreDraft();
  $('#view-label').textContent = `This ${document.body.classList.contains('discussion') ? 'discussion' : 'board'} view · independent draft`;
  await refresh(); void observe(); say('Ready. Choose a recipient and create shared work.');
} catch (error) {
  report(error);
  if (error.code === 'APPLICATION_DEVICE_NOT_FOUND' && typeof deployment?.createProfile === 'function') {
    const setup = node('section', '', 'panel'); setup.append(node('h2', 'Set up this browser'),
      node('p', 'Create a retained signing profile, then ask the application owner to enroll its public key.'));
    setup.append(action('Create this browser profile', async () => {
      const publicKey = await deployment.createProfile();
      const key = node('input', ''); key.readOnly = true; key.value = publicKey; key.setAttribute('aria-label', 'Public signing key to enroll');
      setup.replaceChildren(node('h2', 'Profile created'), node('p', 'Ask the owner to enroll this exact public key, then reload this view.'), key,
        action('Copy public key', () => navigator.clipboard.writeText(publicKey)), action('Reload after enrollment', async () => location.reload()));
    }));
    document.querySelector('main').prepend(setup);
  }
}
