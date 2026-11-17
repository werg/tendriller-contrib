// Only domain calls and UI drafts live here; the public Worker session owns work.
import { applicationReady } from './deployment/bootstrap.mjs';
import { observeTyping } from './typing.mjs';

const $ = selector => document.querySelector(selector);
const lifetime = new AbortController();
let session, definition, read, storageKey, draft = '', references = [], painting = false, pending = false, submitting = false;
let lastSignal = 0;
const outcomes = new Map();
const text = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
const status = (message, failure = false) => { $('#status').textContent = message; $('#status').dataset.failure = String(failure); };
const canAuthor = () => session && !['awaiting-keys', 'recovering', 'closed'].includes(session.status.phase);
const save = () => localStorage.setItem(storageKey, JSON.stringify({ draft, references }));
const describeOutcome = value => value === null ? 'No saved attempt was found; the draft is still available.'
  : value === undefined ? 'Checking the original attempt…'
    : value.status === 'applied' ? `Applied · ${value.outcome}`
      : value.status === 'abandoned' || value.status === 'needsReapply' ? 'Excluded from the selected history · review required'
        : 'Saved on this device · waiting for the coordinating peer';

function paintOperations() {
  $('#operations').replaceChildren(...references.slice().reverse().map(reference => {
    const value = outcomes.get(reference.operationId), row = text('li', '');
    row.dataset.operation = reference.operationId; row.dataset.status = value?.status ?? 'unknown';
    row.append(text('strong', reference.label), text('p', describeOutcome(value)));
    const check = text('button', 'Check original'); check.type = 'button';
    check.onclick = async () => {
      try { outcomes.set(reference.operationId, await session.operations.get(reference.operationId)); paintOperations(); }
      catch (error) { status(`Original status unavailable: ${error.message}`, true); }
    };
    row.append(check);
    if (reference.command === 'postMessage') {
      const copy = text('button', 'Copy to editor'); copy.type = 'button';
      copy.onclick = () => { draft = reference.input.text; $('#message').value = draft; save(); $('#message').focus(); };
      row.append(copy);
    }
    if (value?.status === 'saved') {
      const retry = text('button', 'Retry same attempt'); retry.type = 'button';
      retry.onclick = () => void session.retry(reference.operationId).then(refresh, error => status(error.message, true));
      row.append(retry);
    }
    if (value?.status === 'abandoned' || value?.status === 'needsReapply') {
      const reapply = text('button', 'Review and reapply'); reapply.type = 'button'; reapply.dataset.action = 'reapply';
      reapply.onclick = async () => {
        reapply.disabled = true;
        try {
          // This retained draft is used only for a deliberate new command. The
          // original signed attempt and its retry state stay in the owned journal.
          const current = await session.query(definition.queries.some(value => value.name === 'board') ? 'board' : 'conversation', {});
          paint(current);
          if (!window.confirm(`Create a new attempt for “${reference.label}” using the current history?`)) return;
          await submit(reference.command, reference.input, reference.label, reference.operationId);
        } catch (error) { status(`Reapplication needs review: ${error.message}`, true); }
        finally { reapply.disabled = false; }
      };
      row.append(reapply);
    }
    if (value === null || value?.status === 'applied' || value?.status === 'abandoned' || value?.status === 'needsReapply') {
      const forget = text('button', 'Remove reviewed reference'); forget.type = 'button';
      forget.onclick = () => {
        references = references.filter(item => item.operationId !== reference.operationId);
        outcomes.delete(reference.operationId); save(); paintOperations();
      };
      row.append(forget);
    }
    return row;
  }));
}

function paint(result) {
  read = result;
  $('#revision').textContent = `Generation ${result.revision.generation.slice(0, 12)} · position ${result.revision.point.sequence}`;
  $('#conversation').replaceChildren(...result.value.messages.slice(-200).map(message => {
    const row = text('li', ''); row.dataset.operation = message.operationId;
    row.append(text('p', message.text), text('small', `Author ${message.author.slice(0, 12)}`)); return row;
  }));
  if (result.value.tasks) $('#tasks').replaceChildren(...result.value.tasks.map(task => {
    const row = text('li', ''); row.dataset.task = task.id;
    row.append(text('strong', task.title), text('p', task.claimedBy ? `${task.status} · claimed by ${task.claimedBy.slice(0, 12)}` : 'Open for a claim'));
    const button = text('button', task.claimedBy ? 'Finish task' : 'Claim task'); button.type = 'button';
    button.disabled = task.status !== 'open' || Boolean(task.claimedBy && task.claimedBy !== session.deviceId);
    button.onclick = () => void submit(task.claimedBy ? 'finishTask' : 'claimTask', { taskId: task.id }, `${task.claimedBy ? 'Finish' : 'Claim'}: ${task.title}`).catch(() => undefined);
    row.append(button); return row;
  }));
}

async function refresh() {
  pending = true;
  if (painting || !session) return;
  painting = true;
  try {
    while (pending && !lifetime.signal.aborted) {
      pending = false;
      const result = await session.query(definition.queries.some(value => value.name === 'board') ? 'board' : 'conversation', {});
      const observed = await Promise.all(references.map(async value => [value.operationId, await session.operations.get(value.operationId)]));
      if (lifetime.signal.aborted) return;
      for (const [id, value] of observed) outcomes.set(id, value);
      paint(result); paintOperations();
    }
  } catch (error) { status(`Current view unavailable: ${error.message}. Your draft is retained.`, true); }
  finally { painting = false; }
}

async function submit(command, input, label, original) {
  if (references.length >= 100) throw Error('This device has 100 saved attempt references; review them before submitting more.');
  const operationId = crypto.randomUUID(), reference = { operationId, command, input: structuredClone(input), label };
  references.push(reference); save(); paintOperations();
  try {
    const options = { operationId, ...(read ? { basedOn: read.revision } : {}) };
    const operation = original ? await session.reapply(original, command, input, options) : await session.command(command, input, options);
    outcomes.set(operationId, await operation.get()); paintOperations();
    void operation.applied({ signal: lifetime.signal }).then(value => {
      outcomes.set(operationId, value); paintOperations(); status(describeOutcome(value), value.outcome === 'rejected'); return refresh();
    }, error => { if (!lifetime.signal.aborted) { status(`Attempt needs review: ${error.message}`, true); void refresh(); } });
    return operation;
  } catch (error) { status(`Attempt could not be prepared: ${error.message}. Its review reference is retained.`, true); throw error; }
}

$('#message-form').onsubmit = async event => {
  event.preventDefault(); if (submitting || !draft.trim()) return;
  submitting = true; $('#send').disabled = true;
  const snapshot = draft;
  try {
    await submit('postMessage', { messageId: crypto.randomUUID(), text: snapshot.trim() }, snapshot.trim());
    if (draft === snapshot) { draft = ''; $('#message').value = ''; save(); }
  } catch { /* Keep the user's current draft and original review reference. */ }
  finally { submitting = false; $('#send').disabled = !canAuthor(); }
};
$('#task-form').onsubmit = async event => {
  event.preventDefault(); const title = $('#task-title').value.trim(); if (!title) return;
  try { await submit('addTask', { taskId: crypto.randomUUID(), title }, `Add: ${title}`); if ($('#task-title').value.trim() === title) $('#task-title').value = ''; }
  catch { /* Current task title remains reviewable. */ }
};
$('#message').oninput = () => {
  draft = $('#message').value;
  try { save(); } catch (error) { status(`Draft storage failed: ${error.message}`, true); }
  if (session && performance.now() - lastSignal > 750) {
    lastSignal = performance.now(); void session.signals.send('typing', { typing: Boolean(draft) }, { ttlMs: 2500 }).catch(() => undefined);
  }
};
window.addEventListener('pagehide', () => { lifetime.abort(); void session?.close(); }, { once: true });

try {
  session = await applicationReady;
  definition = await session.describe();
  storageKey = `peer-page/${session.applicationId}/${session.deviceId}`;
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  if (stored && typeof stored.draft === 'string' && stored.draft.length <= 4096 && Array.isArray(stored.references) && stored.references.length <= 100 &&
      stored.references.every(value => value && typeof value.operationId === 'string' && typeof value.command === 'string' && typeof value.label === 'string' && value.input && typeof value.input === 'object')) {
    draft = stored.draft; references = stored.references;
  }
  $('#message').value = draft;
  session.onStatus(value => {
    $('#message').disabled = !canAuthor(); $('#send').disabled = !canAuthor() || submitting;
    if (value.phase === 'awaiting-keys') status('Waiting for an authorized peer to share this history’s keys. Your draft is retained.');
    else if (value.phase === 'recovering') status('Restoring the selected history. Your draft is retained.');
    else if (value.phase === 'closed') status('This device session is closed. Your draft is retained.');
  });
  $('#tasks-section').hidden = !definition.commands.some(value => value.name === 'claimTask');
  await refresh(); if (canAuthor()) status('Ready. Attempts and recovery remain visible below.');
  const notices = await session.inspectRecovery();
  if (notices.length) {
    const latest = notices[notices.length - 1];
    $('#recovery').hidden = false;
    $('#recovery-message').textContent = `This device retains a recovery notice for ${latest.abandoned.length} excluded attempts. Additional lost work may be unknown.`;
  }
  void (async () => {
    for await (const change of session.changes({ signal: lifetime.signal })) {
      if (change.kind === 'recovery') {
        $('#recovery').hidden = false;
        $('#recovery-message').textContent = `A new history was selected. ${change.recovery?.abandoned.length ?? 0} retained attempts were excluded; additional lost work may be unknown.`;
      }
      await refresh();
    }
  })().catch(error => { if (!lifetime.signal.aborted) status(`Live view paused: ${error.message}`, true); });
  void observeTyping(session.signals, { signal: lifetime.signal,
    onChange: ({ count }) => { $('#typing').textContent = count ? `${count} ${count === 1 ? 'person is' : 'people are'} typing…` : ''; },
  }).catch(() => { $('#typing').textContent = ''; });
} catch (error) { status(`Application unavailable: ${error.message}`, true); }
