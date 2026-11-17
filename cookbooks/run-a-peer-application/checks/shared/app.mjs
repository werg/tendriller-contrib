import { applicationReady } from './deployment/bootstrap.mjs';
import { claimTask, postMessage, requestSummary } from './actions.mjs';
import { mergeOperation, operationLabel, readBoard } from './projection.mjs';
import { canRemoveReference, captureMessageDraft, clearSubmittedText, newDrafts, removeReviewedReference, retainReference, validateDrafts } from './drafts.mjs';
import { observeTyping } from './typing.mjs';

const $ = selector => document.querySelector(selector);
const api = window.tendril;
const lifecycle = new AbortController();
let backend, drafts = newDrafts(), storageKey, painting = false, dirty = false, currentRead, submittingMessage = false;
let lastTyping = 0, typingActive = false;
let viewWatcher;
const outcomes = new Map();
const operationWatchers = new Map();
const submissions = new Set();
const rowNodes = new Map();

function status(text, failure = false) {
  $('#status').textContent = text;
  $('#status').dataset.failure = String(failure);
}

function saveDrafts(next) {
  const checked = validateDrafts(next);
  localStorage.setItem(storageKey, JSON.stringify(checked));
  drafts = checked;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function paintOperations() {
  const active = document.activeElement?.dataset.operation;
  const activeAction = document.activeElement?.dataset.action;
  $('#operations').replaceChildren(...drafts.operations.slice().reverse().map(reference => {
    const operation = outcomes.get(reference.operationId);
    const row = element('li');
    row.dataset.operation = reference.operationId;
    row.dataset.status = operation?.status ?? 'unknown';
    if (operation?.outcome) row.dataset.outcome = operation.outcome;
    row.append(element('strong', reference.text || reference.domainId), element('p', operationLabel(operation)));
    const copy = element('button', reference.kind === 'message' ? 'Copy to editor' : 'Keep for review');
    copy.type = 'button';
    copy.disabled = reference.kind !== 'message';
    copy.dataset.operation = reference.operationId;
    copy.dataset.action = 'copy';
    copy.onclick = () => {
      try { saveDrafts({ ...drafts, message: reference.text }); $('#message').value = drafts.message; $('#message').focus(); }
      catch (error) { status(`Draft could not be saved: ${error.message}`, true); }
    };
    row.append(copy);
    if (!submissions.has(reference.operationId) && operation?.status !== 'final') {
      const recheck = element('button', 'Check original status');
      recheck.type = 'button';
      recheck.dataset.operation = reference.operationId;
      recheck.dataset.action = 'check-status';
      recheck.onclick = async () => {
        recheck.disabled = true;
        try {
          const observed = await backend.operations.get(reference.operationId);
          if (!drafts.operations.some(value => value.operationId === reference.operationId)) return;
          outcomes.set(reference.operationId, mergeOperation(outcomes.get(reference.operationId), observed));
          paintOperations();
          void watchOperation(reference.operationId);
        } catch (error) { status(`Original status is unavailable: ${error.message}. The saved reference is retained.`, true); }
        finally { recheck.disabled = false; }
      };
      row.append(recheck);
    }
    if (canRemoveReference(operation, { submitting: submissions.has(reference.operationId) })) {
      const remove = element('button', operation === null ? 'Remove saved reference' : 'Remove this receipt');
      remove.type = 'button';
      remove.onclick = () => {
        try {
          saveDrafts(removeReviewedReference(drafts, reference.operationId, outcomes.get(reference.operationId),
            { submitting: submissions.has(reference.operationId) }));
          operationWatchers.get(reference.operationId)?.abort();
          outcomes.delete(reference.operationId);
          paintOperations();
        }
        catch (error) { status(error.message, true); }
      };
      row.append(remove);
    }
    return row;
  }));
  if (active) [...$('#operations').querySelectorAll('button')].find(button => button.dataset.operation === active && button.dataset.action === activeAction)?.focus({ preventScroll: true });
}

function taskRow(task) {
  let row = rowNodes.get(task.id);
  if (!row) {
    row = element('li'); row.className = 'task'; row.dataset.task = task.id;
    const title = element('h3'), note = element('p'), claim = element('button', 'Claim task'), job = element('button', 'Ask agent to summarize');
    claim.type = job.type = 'button';
    claim.dataset.action = 'claim'; job.dataset.action = 'job';
    claim.onclick = () => void submit('claim', task.id, title.textContent);
    job.onclick = () => void submit('job', task.id, title.textContent);
    row.append(title, note, claim, job); rowNodes.set(task.id, row);
  }
  row.querySelector('h3').textContent = task.title;
  row.querySelector('p').textContent = task.claimant ? `Claimed by ${task.claimant.slice(0, 12)} · ${task.status}` : 'Available';
  row.querySelector('[data-action=claim]').disabled = task.claimant !== null || task.status !== 'open';
  row.querySelector('[data-action=job]').disabled = task.claimant === null;
  return row;
}

function paint(view) {
  const tasks = $('#tasks');
  const live = new Set(view.tasks.map(task => task.id));
  for (const [id, row] of rowNodes) if (!live.has(id)) { row.remove(); rowNodes.delete(id); }
  for (let index = 0; index < view.tasks.length; index++) {
    const row = taskRow(view.tasks[index]);
    if (tasks.children[index] !== row) tasks.insertBefore(row, tasks.children[index] ?? null);
  }
  $('#task-empty').hidden = view.tasks.length !== 0;
  $('#conversation').replaceChildren(...view.messages.map(message => {
    const row = element('li'); row.dataset.message = message.messageId;
    if (message.inReplyTo) row.append(element('small', `Reply to ${message.inReplyTo}`));
    row.append(element('p', message.text)); return row;
  }));
  $('#chat-empty').hidden = view.messages.length !== 0;
  $('#jobs').replaceChildren(...view.jobs.map(job => {
    const row = element('li'); row.dataset.job = job.jobId;
    row.append(element('strong', `${job.status} · ${job.taskId ?? job.jobId}`));
    if (job.text) row.append(element('p', job.text)); return row;
  }));
  $('#revision').textContent = `${view.view === 'final' ? 'Confirmed' : 'Including provisional changes'} · ${view.eventCount} visible-topic events scanned`;
  if (view.omittedEventCount) $('#revision').textContent += ` · ${view.omittedEventCount} message or job records could not be displayed`;
  $('#revision').dataset.revision = view.revision;
}

async function refresh() {
  dirty = true;
  if (painting || !backend) return;
  painting = true;
  try {
    while (dirty && !lifecycle.signal.aborted) {
      dirty = false;
      currentRead = new AbortController();
      const view = await readBoard(backend, { view: $('#include-pending').checked ? 'local' : 'final', signal: AbortSignal.any([lifecycle.signal, currentRead.signal]) });
      if (lifecycle.signal.aborted || currentRead.signal.aborted) continue;
      paint(view);
      status('Ready. Submitted work is labeled until confirmed.');
    }
  } catch (error) {
    if (!lifecycle.signal.aborted && !currentRead?.signal.aborted) status(`Current view unavailable: ${error.message}. The previous coherent view is retained.`, true);
  } finally {
    painting = false;
    if (dirty && !lifecycle.signal.aborted) queueMicrotask(() => void refresh());
  }
}

async function submit(kind, domainId, submittedText, editorSnapshot = submittedText) {
  if (kind === 'message' && submittingMessage) return;
  if (kind === 'message') { submittingMessage = true; $('#send').disabled = true; sendTyping(false); }
  const operationId = crypto.randomUUID();
  const messageId = kind === 'message' ? crypto.randomUUID() : domainId;
  const jobId = kind === 'job' ? crypto.randomUUID() : undefined;
  const reference = { operationId, kind, domainId: jobId ?? messageId, text: submittedText };
  try {
    saveDrafts(retainReference(drafts, reference));
    submissions.add(operationId);
    paintOperations();
    void watchOperation(operationId);
    status('Preparing the original operation…');
    const result = kind === 'message' ? await postMessage(backend, messageId, submittedText, operationId)
      : kind === 'claim' ? await claimTask(backend, domainId, operationId)
        : await requestSummary(backend, domainId, jobId, operationId);
    outcomes.set(operationId, mergeOperation(outcomes.get(operationId), result));
    if (kind === 'message') {
      saveDrafts(clearSubmittedText(drafts, editorSnapshot)); $('#message').value = drafts.message;
      if (!drafts.message) sendTyping(false);
    }
    paintOperations();
    const observed = outcomes.get(operationId);
    status(operationLabel(observed), observed.status === 'final' && observed.outcome === 'rejected');
    await refresh();
  } catch (error) {
    try { const operation = await backend.operations.get(operationId); outcomes.set(operationId, mergeOperation(outcomes.get(operationId), operation)); }
    catch { /* Keep the reference; delivery/reconciliation still belongs to the backend. */ }
    paintOperations();
    status(`Submission needs review: ${error.message}. Its original draft and operation reference are retained.`, true);
  } finally {
    submissions.delete(operationId);
    paintOperations();
    if (kind === 'message') { submittingMessage = false; $('#send').disabled = false; }
  }
}

async function watchViews() {
  viewWatcher?.abort();
  const controller = new AbortController();
  viewWatcher = controller;
  const signal = AbortSignal.any([lifecycle.signal, controller.signal]);
  const view = $('#include-pending').checked ? 'local' : 'final';
  // View invalidation includes provisional replay, SQL-only and finality changes.
  // It deliberately has no processed cursor or promise to deliver every revision.
  try {
    for await (const change of backend.changes({ view, signal })) {
      void change;
      await refresh();
    }
  } catch (error) { if (!signal.aborted) status(`View updates paused: ${error.message}. Refresh to read durable history.`, true); }
  finally {
    controller.abort();
    if (viewWatcher === controller) viewWatcher = undefined;
  }
}

async function watchOperation(operationId) {
  if (operationWatchers.has(operationId) || outcomes.get(operationId)?.status === 'final') return;
  const controller = new AbortController();
  operationWatchers.set(operationId, controller);
  const signal = AbortSignal.any([lifecycle.signal, controller.signal]);
  try {
    for await (const operation of backend.operations.subscribe({ operationId, signal })) {
      if (!drafts.operations.some(value => value.operationId === operationId)) break;
      outcomes.set(operationId, mergeOperation(outcomes.get(operationId), operation));
      paintOperations();
      // Status-only changes also trigger a coherent replacement, even with equal rows.
      await refresh();
      if (operation.status === 'final') break;
    }
  } catch (error) { if (!signal.aborted) status(`Operation updates paused: ${error.message}`, true); }
  finally {
    controller.abort();
    if (operationWatchers.get(operationId) === controller) operationWatchers.delete(operationId);
  }
}

async function watchTyping() {
  if (!api?.signals?.available) { $('#typing').textContent = 'Typing indicators are unavailable on this connection.'; return; }
  try {
    await observeTyping(api.signals, { signal: lifecycle.signal,
      onChange: ({ count }) => { $('#typing').textContent = count ? 'Someone is typing…' : ''; } });
  } catch (error) { if (!lifecycle.signal.aborted) $('#typing').textContent = `Typing unavailable: ${error.message}`; }
}

function sendTyping(active) {
  if (!api?.signals?.available || (!active && !typingActive)) return;
  const now = Date.now();
  if (active && typingActive && now - lastTyping < 1000) return;
  typingActive = active;
  lastTyping = now;
  // This optional live indication never changes a durable submission's outcome.
  void api.signals.send('typing', { typing: active }, { ttlMs: 2500 }).catch(() => { typingActive = false; });
}

$('#message-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const snapshot = captureMessageDraft($('#message').value);
    if (!snapshot || !backend) return;
    void submit('message', '', snapshot.text, snapshot.editorText);
  } catch (error) { status(`Draft could not be submitted: ${error.message}`, true); }
});
$('#message').addEventListener('input', () => {
  try { saveDrafts({ ...drafts, message: $('#message').value }); }
  catch (error) { status(`Draft storage unavailable: ${error.message}. Copy your text before leaving.`, true); }
  sendTyping($('#message').value.length > 0);
});
$('#refresh').addEventListener('click', () => void refresh());
$('#include-pending').addEventListener('change', () => { currentRead?.abort(); if (backend) void watchViews(); });
addEventListener('pagehide', () => { sendTyping(false); lifecycle.abort(); currentRead?.abort(); });

// Live observation has its own lifetime and never waits for durable readiness.
void watchTyping();

try {
  await applicationReady;
  if (!api?.application) throw new Error('This page requires a peer-selected Tendriller application');
  backend = await api.application.ready();
  if (!backend.capabilities.includes('events') || !backend.capabilities.includes('revision-views')) throw new Error('The selected backend lacks the required event and coherent-view capabilities');
  storageKey = `peer-board-drafts:${JSON.stringify([api.identity.page, api.device.id, backend.id])}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) drafts = validateDrafts(JSON.parse(saved));
  $('#message').value = drafts.message;
  $('#task-section').hidden = !backend.capabilities.includes('sql');
  for (const reference of drafts.operations) outcomes.set(reference.operationId, await backend.operations.get(reference.operationId));
  paintOperations();
  await refresh();
  $('#message').disabled = $('#send').disabled = false;
  void watchViews();
  for (const reference of drafts.operations) void watchOperation(reference.operationId);
} catch (error) { status(`Application unavailable: ${error.message}`, true); }
