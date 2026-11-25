// Materialized snapshots plus separate local drafts/selection. Never append
// network arrivals to a second mutable application database.
import { applicationReady } from './deployment/bootstrap.mjs';
import { createLiveView } from '@chronolog/peer-session/browser';
const $ = selector => document.querySelector(selector), nodes = new Map();
let session, live, snapshot, draft = '', references = [], submitting = false, selected = location.hash.slice(1);
const storageKey = 'peer-workspace-view-v1';
try { const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}'); draft = saved.draft ?? ''; references = saved.references ?? []; } catch { /* View conveniences are optional. */ }
const saveView = () => { try { localStorage.setItem(storageKey, JSON.stringify({ draft, references })); } catch { /* Never gate durable authoring. */ } };
const error = failure => { $('#error').hidden = !failure; $('#error').textContent = failure?.message ?? ''; };
const element = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
async function derive(view) {
  const messages = []; let cursor;
  for (;;) {
    const batch = await view.readEvents({ topics: ['conversation'], limit: 128, ...(cursor === undefined ? {} : { cursor }) });
    for (const event of batch.events) if (event.payload?.type === 'message.posted') messages.push({ ...event.payload,
      author: event.author, operationId: event.operationId, proposalId: event.proposalId, authorTimestampMs: event.authorTimestampMs });
    if (!batch.hasMore) break; cursor = batch.cursor;
  }
  let tasks = null;
  if (session.describe().queries.some(value => value.name === 'board')) tasks = (await view.query('SELECT id,title,claimed_by,status FROM tasks ORDER BY id LIMIT 200')).rows;
  return { messages, tasks };
}
function detail() {
  const row = snapshot?.value.messages.find(value => value.proposalId === selected);
  $('#detail-empty').hidden = !!row; $('#message-detail').replaceChildren();
  if (!row) { $('#detail-empty').textContent = selected ? 'This message is not effective in the current snapshot. Its signed intent is not rewritten.' : 'Choose a message to inspect its authenticated author and signed intent.'; return; }
  for (const [label, value] of [['Message', row.text], ['Authenticated author', row.author], ['Proposal ID', row.proposalId], ['Operation ID', row.operationId], ['Signed author time', row.authorTimestampMs]]) $('#message-detail').append(element('dt', label), element('dd', value));
}
async function inspect() {
  const inspected = await Promise.all(references.map(async reference => ({ reference, state: await (await session.operations.get(reference.operationId))?.inspect() })));
  $('#operations').replaceChildren(...inspected.reverse().map(({ reference, state }) => {
    const row = element('li', ''); row.dataset.operation = reference.operationId; row.dataset.excluded = String(state?.excluded ?? false);
    row.append(element('strong', reference.input.text ?? reference.operationId), element('p', !state ? 'Intent unavailable on this device.' :
      `${state.stored ? 'Stored locally' : 'Not stored'} · ${state.materialized ? `materialized ${state.materialized.outcome}` : 'materialization pending'} · retained by ${state.retained.length} peer(s) · ${state.finalized ? 'finalized' : 'not finalized'}${state.excluded ? ' · excluded under the configured policy' : ''}`));
    const check = element('button', 'Retry exact intent'); check.type = 'button'; check.onclick = async () => {
      try { const retried = await session.command(reference.name, reference.input, { operationId: reference.operationId }); await retried.materialized(); await inspect(); } catch (failure) { error(failure); }
    }; row.append(check); return row;
  }));
}
function paint(value) {
  snapshot = value; error(null);
  const ids = new Set(value.value.messages.map(row => row.proposalId));
  for (const [id, node] of nodes) if (!ids.has(id)) { node.remove(); nodes.delete(id); }
  for (const row of value.value.messages) {
    let node = nodes.get(row.proposalId);
    if (!node) { node = element('li', ''); node.append(element('a', '')); nodes.set(row.proposalId, node); }
    const link = node.firstChild; link.textContent = row.text; link.href = `#${row.proposalId}`;
    link.setAttribute('aria-current', String(selected === row.proposalId)); $('#conversation').append(node);
  }
  $('#message-count').textContent = String(value.value.messages.length); $('#empty').hidden = value.value.messages.length > 0;
  $('#revision').textContent = `Coherent local revision ${value.revision.digest.slice(0, 16)}`;
  $('#tasks-section').hidden = value.value.tasks === null;
  if (value.value.tasks) $('#tasks').replaceChildren(...value.value.tasks.map(([id,title,claimed,status]) => {
    const row = element('li', `${title} · ${status}${claimed ? ' · provisionally claimed' : ''}`);
    const claim = element('button', claimed ? 'Complete task' : 'Claim task'); claim.type = 'button';
    claim.onclick = () => submit(claimed ? 'finishTask' : 'claimTask', { taskId: id }); row.append(claim); return row;
  }));
  detail(); void inspect().catch(error);
}
async function submit(name, input) {
  if (submitting) return; submitting = true; updateStatus(session.status);
  const reference = { name, input, operationId: crypto.randomUUID() };
  try {
    const operation = await session.command(name, input, { operationId: reference.operationId });
    references.push(reference); if (name === 'postMessage') { draft = ''; $('#message').value = ''; }
    saveView(); await inspect(); await operation.materialized(); await live.refresh();
  } catch (failure) { error(failure); }
  finally { submitting = false; updateStatus(session.status); }
}
function updateStatus(status) {
  $('#status').textContent = `${status.canAuthor ? 'Local signing and storage ready' : 'Local signing unavailable'} · ${status.connectedPeers} connected peer(s) · local saving does not wait for finality`;
  $('#message').disabled = !status.canAuthor; $('#send').disabled = !status.canAuthor || submitting;
}
$('#message').value = draft;
$('#message').addEventListener('input', () => { draft = $('#message').value; saveView(); });
$('#message-form').addEventListener('submit', event => { event.preventDefault(); if (draft.trim()) void submit('postMessage', { messageId: crypto.randomUUID(), text: draft }); });
$('#task-form').addEventListener('submit', event => { event.preventDefault(); void submit('addTask', { taskId: crypto.randomUUID(), title: $('#task-title').value }); });
addEventListener('hashchange', () => { selected = location.hash.slice(1); if (snapshot) paint(snapshot); });
try { session = await applicationReady; session.onStatus(updateStatus); live = createLiveView(session, derive, { onError: error }); live.subscribe(paint); await live.ready(); }
catch (failure) { error(failure); $('#status').textContent = 'Local application unavailable; draft retained.'; }
