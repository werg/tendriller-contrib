import { signals } from './deployment/bootstrap.mjs';
import { claimTask, postMessage, requestSummary } from './actions.mjs';
import { operationLabel, readBoard, TOPICS } from './projection.mjs';
import { clearSubmittedText, newDrafts, retainReference, validateDrafts } from './drafts.mjs';

const $ = selector => document.querySelector(selector);
const api = window.tendril;
const lifecycle = new AbortController();
let backend, drafts = newDrafts(), storageKey, painting = false, dirty = false, currentView, currentRead, submittingMessage = false;
let lastTyping = 0;
const outcomes = new Map();
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
  $('#operations').replaceChildren(...drafts.operations.slice().reverse().map(reference => {
    const operation = outcomes.get(reference.operationId);
    const row = element('li');
    row.dataset.operation = reference.operationId;
    row.dataset.status = operation?.status ?? 'unknown';
    row.append(element('strong', reference.text || reference.domainId), element('p', operationLabel(operation)));
    const copy = element('button', reference.kind === 'message' ? 'Copy to editor' : 'Keep for review');
    copy.type = 'button';
    copy.disabled = reference.kind !== 'message';
    copy.dataset.operation = reference.operationId;
    copy.onclick = () => {
      try { saveDrafts({ ...drafts, message: reference.text }); $('#message').value = drafts.message; $('#message').focus(); }
      catch (error) { status(`Draft could not be saved: ${error.message}`, true); }
    };
    row.append(copy);
    if (operation && ['final', 'rejected'].includes(operation.status)) {
      const remove = element('button', 'Remove this receipt');
      remove.type = 'button';
      remove.onclick = () => {
        try { saveDrafts({ ...drafts, operations: drafts.operations.filter(value => value.operationId !== reference.operationId) }); paintOperations(); }
        catch (error) { status(error.message, true); }
      };
      row.append(remove);
    }
    return row;
  }));
  if (active) [...$('#operations').querySelectorAll('button')].find(button => button.dataset.operation === active)?.focus({ preventScroll: true });
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
  currentView = view;
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

async function submit(kind, domainId, submittedText) {
  if (kind === 'message' && submittingMessage) return;
  if (kind === 'message') { submittingMessage = true; $('#send').disabled = true; }
  const operationId = crypto.randomUUID();
  const messageId = kind === 'message' ? crypto.randomUUID() : domainId;
  const jobId = kind === 'job' ? crypto.randomUUID() : undefined;
  const reference = { operationId, kind, domainId: jobId ?? messageId, text: submittedText };
  try {
    saveDrafts(retainReference(drafts, reference));
    paintOperations();
    status('Preparing the original operation…');
    const result = kind === 'message' ? await postMessage(backend, messageId, submittedText, operationId)
      : kind === 'claim' ? await claimTask(backend, domainId, operationId)
        : await requestSummary(backend, domainId, jobId, operationId);
    outcomes.set(operationId, result);
    if (kind === 'message') { saveDrafts(clearSubmittedText(drafts, submittedText)); $('#message').value = drafts.message; }
    paintOperations();
    status(operationLabel(result), result.status === 'rejected');
    await refresh();
  } catch (error) {
    try { const operation = await backend.operations.get(operationId); if (operation) outcomes.set(operationId, operation); }
    catch { /* Keep the reference; delivery/reconciliation still belongs to the backend. */ }
    paintOperations();
    status(`Submission needs review: ${error.message}. Its original draft and operation reference are retained.`, true);
  } finally { if (kind === 'message') { submittingMessage = false; $('#send').disabled = false; } }
}

async function watchEvents() {
  // This is only a wake-up stream for replacement views, not a worker checkpoint.
  // Durable consumers must commit processed state/cursor atomically in their store.
  try {
    for await (const batch of backend.events.subscribe({ topics: TOPICS, limit: 32, ...(currentView ? { cursor: currentView.cursor } : {}), signal: lifecycle.signal })) {
      void batch;
      await refresh();
    }
  } catch (error) { if (!lifecycle.signal.aborted) status(`Live history paused: ${error.message}. Refresh to read durable history.`, true); }
}

async function watchOperations() {
  try {
    for await (const operation of backend.operations.subscribe({ signal: lifecycle.signal })) {
      if (drafts.operations.some(value => value.operationId === operation.operationId)) outcomes.set(operation.operationId, operation);
      paintOperations();
      // Status-only changes also trigger a coherent replacement, even with equal rows.
      await refresh();
    }
  } catch (error) { if (!lifecycle.signal.aborted) status(`Operation updates paused: ${error.message}`, true); }
}

async function watchTyping() {
  if (!signals) { $('#typing').textContent = 'Typing indicators are unavailable on this connection.'; return; }
  let expiry;
  try {
    for await (const event of signals.subscribe({ topics: ['typing'], signal: lifecycle.signal })) {
      if (event.payload?.typing !== true) continue;
      $('#typing').textContent = 'Someone is typing…';
      clearTimeout(expiry);
      expiry = setTimeout(() => { $('#typing').textContent = ''; }, 2500);
    }
  } catch (error) { if (!lifecycle.signal.aborted) $('#typing').textContent = `Typing unavailable: ${error.message}`; }
  finally { clearTimeout(expiry); }
}

$('#message-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#message').value.trim();
  if (!text || !backend) return;
  void submit('message', '', text);
});
$('#message').addEventListener('input', () => {
  try { saveDrafts({ ...drafts, message: $('#message').value }); }
  catch (error) { status(`Draft storage unavailable: ${error.message}. Copy your text before leaving.`, true); }
  if (signals && Date.now() - lastTyping > 1000) {
    lastTyping = Date.now();
    void signals.publish('typing', { typing: true }, { ttlMs: 2500 }).catch(() => { $('#typing').textContent = 'Typing indicator could not be sent.'; });
  }
});
$('#refresh').addEventListener('click', () => void refresh());
$('#include-pending').addEventListener('change', () => { currentRead?.abort(); void refresh(); });
addEventListener('pagehide', () => { lifecycle.abort(); currentRead?.abort(); });

try {
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
  void watchEvents(); void watchOperations(); void watchTyping();
} catch (error) { status(`Application unavailable: ${error.message}`, true); }
