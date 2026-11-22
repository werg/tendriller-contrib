// Editable application UI. The maintained owner and collaboration module own
// session lifetime, operation persistence and guarded state transitions.
import { captureCollaborationReader, createCollaborationClient, mountParticipantPanel, operationReference, receiptModel } from '@tendriller/core/collaboration';
import { createViewStore } from '@chronolog/peer-session';
import { createLiveRun } from './domain/live-run.mjs';

const $ = selector => document.querySelector(selector);
const node = (tag, text, className) => { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; };
const action = (label, callback, disabled = false) => {
  const button = node('button', label); button.type = 'button'; button.disabled = disabled;
  button.addEventListener('click', () => { button.disabled = true; void callback().catch(report).finally(() => { button.disabled = disabled; syncPagingControls(); }); });
  return button;
};
const freshId = () => crypto.randomUUID();
let session, client, store, snapshot, participantPanel, deployment, entries = [], selectedTask, submitting = false, messageSubmitting = false, runId;
let detachView = async () => session?.detach(), suspendView = async () => session?.suspend(), resumeView = async () => session?.resumeAttachment();
let observation = new AbortController(), dirty = false, refreshing = false, conversationReady = false;
let reader, newerChanges = false, forceRefresh = false, pendingTaskSelection;
const taskPages = { cursors: [undefined] }, threadPages = { cursors: [undefined] }, resultPages = { cursors: [undefined] };
const browsingHistory = () => [taskPages, threadPages, resultPages].some(pager => pager.cursors.length > 1);
const resetPages = () => { for (const pager of [taskPages, threadPages, resultPages]) pager.cursors = [undefined]; };
let runSubscription, runScopeKey = '', runTimer, participantTimer, liveRuns = new Map();
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
  const reference = operationReference(session, operationId);
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
    await refresh({ force: true });
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
    if (state?.status === 'saved') row.append(action('Retry same signed attempt', async () => { await client.retry(reference); await refresh(); }));
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

function paintTasks(value, taskId = selectedTask) {
  // A remote update may replace a card but must not interrupt a local edit.
  const focused = document.activeElement;
  const retainedFocus = focused?.dataset.localDraft ? { draft: focused.dataset.localDraft,
    start: focused.selectionStart, end: focused.selectionEnd, direction: focused.selectionDirection } : null;
  $('#tasks').replaceChildren(...value.tasks.map(task => {
    const card = node('article', '', `task${task.taskId === taskId ? ' selected' : ''}`);
    card.dataset.taskId = task.taskId;
    card.append(node('p', `${task.status === 'needsReview' ? 'Review required' : task.status} · ${task.responsePolicy}`, 'eyebrow'));
    card.append(node('h3', task.title), node('p', typeof task.input?.text === 'string' ? task.input.text : JSON.stringify(task.input)));
    card.append(node('p', `${label(task.creator)} · ${originLabel(task.source)}`, 'muted'));
    card.append(diagnostics('Request origin and operation', { taskId: task.taskId, author: task.creator,
      source: task.source, operation: task.operation ?? null, context: task.context }));
    const open = action(task.taskId === taskId ? 'Selected conversation' : 'Open conversation', async () => {
      await selectTask(task.taskId); $('#message').focus();
    }); open.dataset.selectTask = task.taskId; card.append(open);
    const slots = node('ul', '', 'slots');
    for (const slot of task.slots) {
      const claim = value.claims.find(item => item.taskId === task.taskId && item.slotId === slot.slotId);
      const results = value.results.filter(item => item.taskId === task.taskId && item.slotId === slot.slotId);
      const acceptedResult = value.acceptedResults.find(item => item.taskId === task.taskId && item.slotId === slot.slotId);
      const row = node('li', ''); row.append(node('strong', slot.label ?? slot.slotId));
      row.append(node('p', claim ? `${label(claim.claimant)} · ${claim.status}${claim.runId ? ` · ${claim.runId}` : ''}` : 'Awaiting an eligible participant'));
      if (acceptedResult) {
        row.append(node('p', acceptedResult.outcome === 'failed' ? 'Contributor reported a failure' : 'Contribution accepted', 'receipt'));
        const loaded = results.find(item => item.resultId === acceptedResult.resultId);
        if (loaded) row.append(node('p', loaded.content?.text ?? JSON.stringify(loaded.content)));
        else row.append(node('p', task.taskId === taskId
          ? 'This accepted contribution is retained. Browse the evidence pages below to read its content.'
          : 'Open this conversation to read its accepted contributions.', 'muted'));
        row.append(diagnostics('Contribution origin', { resultId: acceptedResult.resultId, author: acceptedResult.author,
          runId: acceptedResult.runId, claimEpoch: acceptedResult.claimEpoch, generation: acceptedResult.generation,
          operation: acceptedResult.operation ?? null }));
      }
      const eligible = !claim ? slot.eligibleSigners.includes(session.deviceId) : claim.status === 'offered' && claim.claimant === session.deviceId;
      if (task.status === 'open' && eligible && canWrite()) row.append(action('Claim this contribution', () => submit('claim', {
        taskId: task.taskId, slotId: slot.slotId, claimId: freshId(), expectedEpoch: claim?.claimEpoch ?? 0, taskVersion: 1,
      }, `Claim ${slot.label ?? slot.slotId}`)));
      if (claim?.claimant === session.deviceId && canWrite()) {
        const currentEndpoint = claim.endpointIncarnation === session.endpoint.endpointIncarnation && claim.runId === runId;
        const staleGeneration = claim.generation !== session.status.generation;
        if (claim.status === 'needsReview' || claim.status === 'cancelRequested' && staleGeneration) row.append(action('Revalidate this claim', () => submit('rebind', {
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
        const oldEndpointPresent = entries.some(entry => entry.endpoint?.endpointIncarnation === claim.endpointIncarnation);
        if (claim.status === 'cancelRequested' && !staleGeneration && (currentEndpoint || !oldEndpointPresent)) {
          if (!currentEndpoint) row.append(node('p', 'The original local endpoint is gone. Acknowledge only after confirming its work has stopped.', 'review-note'));
          row.append(action('Acknowledge stopped work', () => submit('acknowledgeCancel', {
          taskId: task.taskId, slotId: slot.slotId, actionId: freshId(), claimEpoch: claim.claimEpoch,
          generation: claim.generation, runId: claim.runId, endpointIncarnation: claim.endpointIncarnation,
        }, 'Acknowledge cancellation')));
        }
      }
      if (claim && !['completed', 'cancelled'].includes(claim.status) && ['open', 'needsReview'].includes(task.status) && canWrite() && (canManage(task) || claim.claimant === session.deviceId)) {
        const form = node('form', '', 'transfer-form'), target = node('select', '');
        const draftId = `transfer:${task.taskId}:${slot.slotId}`;
        target.required = true; target.dataset.localDraft = draftId;
        target.setAttribute('aria-label', `Transfer ${slot.label ?? slot.slotId} to`);
        const prompt = node('option', 'Choose the next responsible participant'); prompt.value = ''; target.append(prompt);
        const eligible = [...new Map(entries.filter(item => item.authorized && !item.revoked && item.deviceId !== claim.claimant)
          .map(item => [item.deviceId, item])).values()];
        for (const entry of eligible) {
          const option = node('option', entry.label ?? label(entry.deviceId)); option.value = entry.deviceId; target.append(option);
        }
        const retained = store.readDraft(draftId)?.assignee;
        target.value = eligible.some(entry => entry.deviceId === retained) ? retained : '';
        target.onchange = () => { try { store.writeDraft({ assignee: target.value }, draftId); } catch (error) { report(error); } };
        const button = node('button', 'Transfer responsibility'); button.type = 'submit'; form.append(target, button);
        form.onsubmit = event => {
          event.preventDefault(); if (!target.value) return; button.disabled = true;
          void submit('handoff', { taskId: task.taskId, slotId: slot.slotId, actionId: freshId(),
            expectedEpoch: claim.claimEpoch, assignee: target.value, reason: 'Explicit transfer from this view' }, 'Transfer responsibility')
            .catch(report).finally(() => { button.disabled = false; });
        };
        row.append(form);
      }
      slots.append(row);
    }
    card.append(slots);
    if (task.taskId === taskId) {
      const evidence = node('div', '', 'evidence-pages');
      evidence.append(node('h4', 'Contribution evidence'), node('p', pageLabel(value.pages.results, resultPages, 'results'), 'muted'));
      for (const result of value.results) evidence.append(diagnostics(
        `${label(result.author)} · ${result.slotId} · ${result.disposition}`,
        { resultId: result.resultId, content: result.content, disposition: result.disposition,
          author: result.author, operation: result.operation, claimEpoch: result.claimEpoch, generation: result.generation }));
      const previous = action('Previous evidence page', () => navigate(resultPages, 'previous'));
      const next = action('Next evidence page', () => navigate(resultPages, 'next'));
      previous.dataset.resultPage = 'previous'; next.dataset.resultPage = 'next'; evidence.append(previous, next);
      card.append(evidence);
    }
    if (task.aggregate) card.append(node('p', `${task.aggregate.disposition === 'partial' ? 'Partial synthesis' : 'Accepted synthesis'} · ${label(task.aggregate.author)}`, 'receipt'),
      node('p', task.aggregate.content?.text ?? JSON.stringify(task.aggregate.content)));
    else if (canManage(task) && ['open', 'needsReview'].includes(task.status)) {
      card.append(action('Request cancellation', () => submit('cancel', { taskId: task.taskId, actionId: freshId(),
        expectedVersion: task.version, reason: 'Cancelled by the task owner' }, `Cancel ${task.title}`)));
      // The maintained projection includes all accepted slots even when only one
      // evidence page is visible. Paging must never shrink the synthesis inputs.
      const acceptedResults = value.acceptedResults.filter(item => item.taskId === task.taskId);
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
    const replacement = [...$('#tasks').querySelectorAll('[data-local-draft]')]
      .find(element => element.dataset.localDraft === retainedFocus.draft);
    if (replacement) { replacement.focus({ preventScroll: true }); if (typeof replacement.setSelectionRange === 'function') replacement.setSelectionRange(retainedFocus.start, retainedFocus.end, retainedFocus.direction); }
  }
  syncPagingControls();
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
function observeRuns(value, taskId = selectedTask) {
  const claims = value.claims.filter(claim => claim.taskId === taskId && ['active', 'cancelRequested'].includes(claim.status));
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
  if (observation.signal.aborted) return;
  if (!Array.isArray(current)) throw Error('The deployment must provide authenticated participant bindings.');
  entries = current;
  participantPanel?.update(entries);
  const selected = $('#recipient').value;
  const eligible = [...new Map(entries.filter(entry => entry.authorized && !entry.revoked).map(entry => [entry.deviceId, entry])).values()];
  const optionsKey = JSON.stringify(eligible.map(entry => [entry.deviceId, entry.label]));
  if ($('#recipient').dataset.optionsKey !== optionsKey) {
    const prompt = node('option', 'Choose an authorized recipient'); prompt.value = '';
    $('#recipient').replaceChildren(prompt, ...eligible.map(entry => {
      const option = node('option', entry.label ?? label(entry.deviceId)); option.value = entry.deviceId; return option;
    }));
    $('#recipient').dataset.optionsKey = optionsKey;
  }
  $('#recipient').value = eligible.some(entry => entry.deviceId === selected) ? selected : '';
  const self = entries.find(entry => entry.deviceId === session.deviceId && !entry.revoked);
  if (!self || !(self.canRead || self.authorized)) {
    snapshot = undefined; $('#tasks').replaceChildren(); $('#messages').replaceChildren(); runSubscription?.abort();
    await reader?.close(); reader = undefined;
    $('#request-submit').disabled = true; $('#message-submit').disabled = true;
    throw Error('This signing profile no longer has workspace access. Shared content has been cleared.');
  }
  $('#request-submit').disabled = !self.authorized || submitting; $('#message-submit').disabled = !self.authorized || messageSubmitting || !conversationReady;
}

const eligibilityKey = () => JSON.stringify(entries.map(entry => [entry.deviceId, entry.authorized, entry.revoked,
  entry.applicationAdministrator, entry.label, entry.endpoint?.endpointIncarnation, entry.endpoint?.state]));
function scheduleParticipants() {
  clearTimeout(participantTimer);
  if (observation.signal.aborted) return;
  participantTimer = setTimeout(() => {
    const previous = eligibilityKey();
    void refreshParticipants().then(() => {
      if (!observation.signal.aborted && snapshot && previous !== eligibilityKey()) paintTasks(snapshot.value);
    }).catch(error => {
      if (!observation.signal.aborted) { participantPanel?.update(entries); report(error); }
    }).finally(scheduleParticipants);
  }, 10_000);
}

function paint(value, taskId = selectedTask) {
  paintTasks(value, taskId);
  const task = value.tasks.find(item => item.taskId === taskId);
  $('#thread-title').textContent = task ? task.title : 'Workspace conversation';
  const threadId = taskId ?? 'workspace';
  $('#messages').replaceChildren(...value.messages.filter(item => item.threadId === threadId).map(message => {
    const row = node('li', ''); row.append(node('p', message.text), node('small', `${label(message.author)} · ${originLabel(message.source)}`),
      diagnostics('Message origin and operation', { messageId: message.messageId, source: message.source, operation: message.operation })); return row;
  }));
  $('#task-page').textContent = `${pageLabel(value.pages.tasks, taskPages, 'requests')}${value.selectedOutsidePage ? ' · Selected request shown separately.' : ''}`;
  $('#thread-page').textContent = pageLabel(value.pages.messages, threadPages, 'messages');
  syncPagingControls();
  $('#shared-updates').hidden = !newerChanges;
  $('#recovery').hidden = !value.tasks.some(item => item.status === 'needsReview');
  observeRuns(value, taskId);
  paintOperations();
}
function pageLabel(page, pager, noun) {
  return page ? `Page ${pager.cursors.length} · ${page.returned} of ${page.total} ${noun} in this captured history${page.hasMore ? ' · More available' : ''}` : `No ${noun} yet`;
}
function syncPagingControls() {
  const busy = refreshing || !reader || observation.signal.aborted;
  $('#refresh-workspace').disabled = busy; $('#workspace-conversation').disabled = busy;
  for (const [name, pager, page] of [['tasks', taskPages, snapshot?.value.pages.tasks], ['thread', threadPages, snapshot?.value.pages.messages]]) {
    $(`#${name}-previous`).disabled = busy || pager.cursors.length === 1;
    $(`#${name}-next`).disabled = busy || !page?.hasMore;
  }
  for (const button of document.querySelectorAll('[data-select-task]')) button.disabled = busy;
  for (const button of document.querySelectorAll('[data-result-page]')) button.disabled = busy || (button.dataset.resultPage === 'previous'
    ? resultPages.cursors.length === 1 : !snapshot?.value.pages.results?.hasMore);
}
async function readPages(captured, taskId = selectedTask) {
  const tasks = await captured.tasks({ limit: 8, cursor: taskPages.cursors.at(-1) });
  const detail = taskId ? (await captured.inspect(taskId)).value : null;
  const results = taskId && detail?.task
    ? resultPages.cursors.length === 1 ? { results: detail.results, page: detail.resultsPage }
      : (await captured.results({ taskId: taskId, limit: 16, cursor: resultPages.cursors.at(-1) })).value
    : { results: [], page: null };
  const thread = await captured.thread({ threadId: taskId ?? 'workspace', limit: 16, cursor: threadPages.cursors.at(-1) });
  const selectedOutsidePage = !!detail?.task && !tasks.value.tasks.some(task => task.taskId === taskId);
  return { revision: tasks.revision, value: {
    tasks: selectedOutsidePage ? [detail.task, ...tasks.value.tasks] : tasks.value.tasks,
    claims: selectedOutsidePage ? [...detail.claims, ...tasks.value.claims] : tasks.value.claims,
    acceptedResults: selectedOutsidePage ? [...detail.acceptedResults, ...tasks.value.acceptedResults] : tasks.value.acceptedResults,
    results: results.results, messages: thread.value.messages, selectedOutsidePage,
    pages: { tasks: tasks.value.page, results: results.page, messages: thread.value.page },
  } };
}
async function renderCaptured(taskId = selectedTask) {
  const current = await readPages(reader, taskId);
  if (observation.signal.aborted) return false;
  // A newly created operation may be saved before its conversation exists.
  // Do not enable posting into a conversation that the current view cannot show.
  if (taskId !== selectedTask && taskId && !current.value.tasks.some(task => task.taskId === taskId)) return false;
  // Paint against the candidate without changing the post target. A paint
  // failure (including local draft storage errors) must not retarget a message.
  const previous = snapshot;
  const previousThreadTitle = $('#thread-title').textContent;
  const previousMessages = [...$('#messages').childNodes];
  snapshot = current;
  try {
    $('#revision').textContent = `Selected history ${current.revision.generation.slice(0, 10)}`;
    paint(current.value, taskId);
  } catch (error) {
    snapshot = previous;
    $('#thread-title').textContent = previousThreadTitle;
    $('#messages').replaceChildren(...previousMessages);
    conversationReady = false;
    $('#message-submit').disabled = true;
    throw error;
  }
  // Synchronous rendering succeeded, so the displayed heading and message
  // destination become authoritative together.
  selectedTask = taskId;
  conversationReady = true;
  $('#message-submit').disabled = !canWrite() || messageSubmitting;
  return true;
}
async function selectTask(taskId) {
  if (refreshing || !reader) return false;
  refreshing = true; syncPagingControls();
  conversationReady = false;
  $('#message-submit').disabled = true;
  // An explicit user navigation supersedes a not-yet-visible new request.
  pendingTaskSelection = undefined;
  const previousThread = threadPages.cursors.slice(), previousResults = resultPages.cursors.slice();
  retainDraft();
  try {
    threadPages.cursors = [undefined]; resultPages.cursors = [undefined];
    if (!await renderCaptured(taskId)) {
      threadPages.cursors = previousThread; resultPages.cursors = previousResults;
      return false;
    }
    retainDraft();
    return true;
  } catch (error) {
    threadPages.cursors = previousThread; resultPages.cursors = previousResults;
    throw error;
  } finally { refreshing = false; syncPagingControls(); if (dirty) await refresh(); }
}
async function navigate(pager, direction) {
  if (refreshing || !reader || !snapshot) return;
  const page = pager === taskPages ? snapshot.value.pages.tasks : pager === threadPages ? snapshot.value.pages.messages : snapshot.value.pages.results;
  if (direction === 'next' && !page?.nextCursor || direction === 'previous' && pager.cursors.length === 1) return;
  refreshing = true; syncPagingControls();
  const previous = pager.cursors.slice();
  try {
    if (direction === 'next') pager.cursors.push(page.nextCursor); else pager.cursors.pop();
    await renderCaptured();
  } catch (error) { pager.cursors = previous; throw error; }
  finally { refreshing = false; syncPagingControls(); if (dirty) await refresh(); }
}
async function refresh({ force = false } = {}) {
  forceRefresh ||= force;
  dirty = true; if (refreshing || observation.signal.aborted) return;
  if (!forceRefresh && reader && browsingHistory()) {
    newerChanges = true; $('#shared-updates').hidden = false; return;
  }
  refreshing = true; syncPagingControls();
  try {
    while (dirty && !observation.signal.aborted) {
      dirty = false; forceRefresh = false; await refreshParticipants();
      const previous = reader, captured = await captureCollaborationReader(session, { signal: observation.signal });
      try {
        resetPages(); reader = captured;
        // A saved request becomes a conversation only once its signed write is
        // visible in a newly captured history. Retain the intended selection
        // across intermediate refreshes rather than retargeting an unseen thread.
        const awaitingTask = pendingTaskSelection;
        const displayed = await renderCaptured(awaitingTask ?? selectedTask);
        if (!displayed && awaitingTask) await renderCaptured();
        else if (displayed && awaitingTask && selectedTask === awaitingTask) {
          pendingTaskSelection = undefined;
          retainDraft();
        }
      } catch (error) { reader = previous; await captured.close(); throw error; }
      await previous?.close();
      newerChanges = false; $('#shared-updates').hidden = true;
      const pending = await Promise.all(store.pending().map(async ({ reference, context }) => {
        const state = await session.operations.get(reference.operationId, { author: reference.author });
        // An uncertain submission may have retained only its semantic identity.
        // Reopening enriches that same reference with the original signed attempt.
        if (state) store.retainOperation(operationReference(session, reference.operationId, state), context);
        return [reference.operationId, state];
      }));
      if (observation.signal.aborted) return;
      for (const [id, state] of pending) statuses.set(id, state);
      paintOperations();
    }
  } finally { refreshing = false; syncPagingControls(); }
}
async function observe() {
  try { for await (const change of session.changes({ signal: observation.signal })) {
    if (change.kind === 'recovery') say('History changed. Retained attempts and active claims need review.');
    try { await refresh({ force: change.kind === 'recovery' }); }
    catch (error) {
      if (observation.signal.aborted) return;
      // A failed view read must not abandon the live change iterator.
      report(error);
    }
  } } catch (error) { if (!observation.signal.aborted) report(error); }
}

$('#request-form').onsubmit = async event => {
  event.preventDefault(); if (!client || submitting) return;
  const submittedTitle = $('#request-title').value, submittedInput = $('#request-input').value;
  const title = submittedTitle.trim(), text = submittedInput.trim(); if (!title || !text) return;
  const policy = $('#response-policy').value;
  const signers = policy === 'one' ? [$('#recipient').value]
    : [...new Set(entries.filter(entry => entry.authorized && !entry.revoked && entry.kind === 'agent').map(entry => entry.deviceId))];
  if (!signers.length || !signers[0]) { say('Choose an authorized recipient before creating work.'); return; }
  if (signers.length > 8) { say('Choose at most eight specialists for this reference workflow.'); return; }
  const interactionId = freshId(); submitting = true; pendingTaskSelection = interactionId;
  $('#request-submit').disabled = true;
  try {
    await submit('request', { interactionId, kind: 'reviewEvidence', title, input: { text }, context: { source: 'reviewed-text' },
      target: policy === 'one' ? { kind: 'signer', deviceId: signers[0] } : { kind: 'workerGroup', groupId: 'specialists' },
      responsePolicy: policy, slots: signers.map((signer, index) => ({ slotId: `review-${index + 1}`, eligibleSigners: [signer], label: label(signer) })) }, `Request ${title}`);
    // An admission may precede the signed write. Refresh now if possible;
    // the retained intent is committed by the next captured applied history.
    await refresh({ force: true });
    if ($('#request-title').value === submittedTitle && $('#request-input').value === submittedInput) {
      $('#request-title').value = ''; $('#request-input').value = '';
    }
    retainDraft();
  } catch (error) { report(error); }
  finally { submitting = false; $('#request-submit').disabled = !canWrite(); }
};
$('#message-form').onsubmit = async event => {
  event.preventDefault();
  const submittedMessage = $('#message').value, text = submittedMessage.trim();
  if (!client || !text || messageSubmitting || !conversationReady) return;
  const threadId = selectedTask ?? 'workspace';
  messageSubmitting = true; $('#message-submit').disabled = true;
  try {
    await submit('message', { threadId, messageId: freshId(), text }, 'Post message');
    if ($('#message').value === submittedMessage) $('#message').value = '';
    retainDraft();
  } catch (error) { report(error); }
  finally { messageSubmitting = false; $('#message-submit').disabled = !canWrite() || !conversationReady; }
};
for (const id of ['request-title', 'request-input', 'message', 'recipient', 'response-policy']) $( `#${id}`).addEventListener('input', () => {
  try { if (store) retainDraft(); } catch (error) { report(error); }
});

window.addEventListener('pagehide', event => {
  observation.abort(); runSubscription?.abort(); clearTimeout(runTimer); clearTimeout(participantTimer);
  void reader?.close().catch(() => undefined); reader = undefined;
  if (event.persisted) void suspendView().catch(report);
  else { participantPanel?.close?.(); void detachView().catch(() => undefined); }
});
window.addEventListener('pageshow', event => {
  if (!event.persisted || !session) return;
  void resumeView().then(() => { observation = new AbortController(); void observe(); scheduleParticipants(); return refresh(); },
    () => say('This view’s owner was replaced. Reload to reattach, then inspect original operations.'));
});
$('#refresh-participants').onclick = () => { if (session) void refreshParticipants().catch(report); };
$('#refresh-workspace').onclick = () => { if (session) void refresh({ force: true }).catch(report); };
$('#workspace-conversation').onclick = () => { if (session) void selectTask(null).catch(report); };
for (const [name, pager] of [['tasks', taskPages], ['thread', threadPages]]) {
  for (const direction of ['previous', 'next']) $(`#${name}-${direction}`).onclick = () => { void navigate(pager, direction).catch(report); };
}

try {
  deployment = await import('./deployment/bootstrap.mjs');
  detachView = deployment.detachView ?? detachView; suspendView = deployment.suspendView ?? suspendView; resumeView = deployment.resumeView ?? resumeView;
  session = await deployment.applicationReady;
  if (!session.endpoint) throw Error('This reference needs a shared session-owner attachment. Open the matching deployment bootstrap.');
  const viewId = session.endpoint.context.viewId;
  if (!viewId) throw Error('The owner did not allocate an independent view.');
  store = createViewStore({ storage: localStorage, applicationId: session.applicationId, historyId: session.historyId, profileId: session.deviceId, viewId });
  runId = `view-${session.endpoint.endpointIncarnation}`;
  client = createCollaborationClient({ session, endpoint: session.endpoint, runId });
  await refreshParticipants();
  participantPanel = mountParticipantPanel({ container: $('#participants'), participants: entries,
    selfEndpoint: { ...session.endpoint, deviceId: session.deviceId }, onSelect: entry => { $('#recipient').value = entry.deviceId; retainDraft(); } });
  restoreDraft();
  $('#view-label').textContent = `This ${document.body.classList.contains('discussion') ? 'discussion' : 'board'} view · independent draft`;
  await refresh(); void observe(); scheduleParticipants(); say('Ready. Choose a recipient and create shared work.');
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
