const api = window.tendril, $ = selector => document.querySelector(selector);
const cacheKey = `inline-evidence:${api.identity.page}:${api.device.id}`;
const submissions = new Map();
let candidate = null, draftRevision = crypto.randomUUID(), durableIds = new Set();

try {
  const saved = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  if (saved) {
    $('#question').value = String(saved.text || '');
    if (typeof saved.revision === 'string') draftRevision = saved.revision;
    for (const row of saved.submissions || []) {
      if (row && typeof row.submissionId === 'string' && typeof row.text === 'string') submissions.set(row.submissionId, row);
    }
  }
} catch {}

function save() {
  try { localStorage.setItem(cacheKey, JSON.stringify({ text: $('#question').value, revision: draftRevision, submissions: [...submissions.values()].slice(-12) })); }
  catch { $('#status').textContent = 'Local draft storage is unavailable.'; }
}

function show() {
  $('#receipts').replaceChildren(...[...submissions.values()].map(row => {
    const article = document.createElement('article');
    article.className = 'receipt';
    article.dataset.status = row.status;
    article.dataset.submission = row.submissionId;
    if (row.captureId) article.dataset.capture = row.captureId;
    const heading = document.createElement('strong'), text = document.createElement('p'), message = document.createElement('p');
    heading.textContent = row.status;
    text.textContent = row.text;
    message.textContent = row.message || '';
    article.append(heading, text, message);
    if (durableIds.has(row.captureId) && ['queued', 'rejected'].includes(row.status)) {
      const retry = document.createElement('button'), discard = document.createElement('button');
      retry.type = discard.type = 'button';
      retry.textContent = 'Retry original capture';
      discard.textContent = 'Discard from device queue';
      retry.addEventListener('click', async () => {
        retry.disabled = true;
        try { received(await api.retryCapture(row.captureId), row); }
        catch (error) { $('#status').textContent = error.message; }
        finally { retry.disabled = false; }
      });
      discard.addEventListener('click', async () => {
        try {
          await api.discardCapture(row.captureId);
          // Removing a local queue entry cannot undo acceptance that already happened.
          if (row.status !== 'accepted') row.status = 'discarded';
          save(); show();
        } catch (error) { $('#status').textContent = error.message; }
      });
      article.append(retry, discard);
    }
    return article;
  }));
}

function discardCandidate() {
  if (candidate) URL.revokeObjectURL(candidate.url);
  candidate = null;
  $('#file').value = '';
  $('#image').removeAttribute('src');
  $('#review').hidden = true;
}

$('#file').addEventListener('change', () => {
  const file = $('#file').files[0];
  if (!file) return;
  discardCandidate();
  candidate = { file, url: URL.createObjectURL(file) };
  $('#image').src = candidate.url;
  $('#filename').textContent = file.name;
  $('#review').hidden = false;
  $('#status').textContent = 'Review the image. Retake by choosing another file, or discard.';
});
$('#discard').addEventListener('click', discardCandidate);
$('#question').addEventListener('input', () => { draftRevision = crypto.randomUUID(); save(); });

function received(result, submitted) {
  // The queue normally provides this mapping first. A storage rejection has no
  // queue entry, so the awaiting caller supplies its own submitted snapshot.
  const row = submitted || [...submissions.values()].find(item => item.captureId === result.capture_id);
  if (!row) return;
  row.captureId = result.capture_id;
  row.status = result.error === 'discarded' ? 'discarded' : result.status;
  row.message = result.message || result.error || '';
  if (result.status === 'accepted' && draftRevision === row.draftRevision && $('#question').value === row.text) {
    $('#question').value = '';
    draftRevision = crypto.randomUUID();
  }
  save(); show();
  $('#status').textContent = result.status === 'accepted' ? 'Accepted by the service; agent action is separate.'
    : result.status === 'queued' ? 'Queued on this device. Original context is retained.'
    : row.status === 'discarded' ? 'Removed from this device queue. A remote acceptance cannot be undone here.'
    : 'Rejected. Submitted evidence and your current draft remain separate.';
}

function reconcileQueue(queue) {
  durableIds = new Set(queue.map(item => item.capture_id));
  for (const capture of queue) {
    const data = capture.data;
    if (data?.kind !== 'reviewed_evidence' || typeof data.submission_id !== 'string') continue;
    let row = submissions.get(data.submission_id);
    if (!row) {
      row = { submissionId: data.submission_id, text: String(data.text || ''), draftRevision: null, name: capture.name };
      submissions.set(row.submissionId, row);
    }
    Object.assign(row, {
      captureId: capture.capture_id, status: capture.status,
      context: { scope: capture.scope, expected_generations: capture.expected_generations },
      message: capture.message || capture.error || '',
    });
  }
  save(); show();
}

$('#form').addEventListener('submit', async event => {
  event.preventDefault();
  const text = $('#question').value;
  if (!text.trim() && !candidate) { $('#status').textContent = 'Add a question or select evidence.'; return; }
  let context;
  try { context = api.scopes.capture('evidence'); }
  catch { $('#status').textContent = 'This evidence question has no active submission context. Review the current task before sending.'; return; }
  const submissionId = crypto.randomUUID(), file = candidate?.file;
  const row = { submissionId, captureId: null, text, draftRevision, status: 'sending', context, name: file?.name || 'question.txt' };
  submissions.set(submissionId, row);
  save(); show(); discardCandidate();
  try {
    const blob = file || new Blob([text], { type: 'text/plain' });
    received(await api.uploadEvent(blob, {
      name: row.name, data: { kind: 'reviewed_evidence', submission_id: submissionId, question: 'inspection-1', text },
      dataPath: ['evidence'], ...context,
    }), row);
  } catch (error) {
    row.status = 'error'; row.message = error.message;
    save(); show();
    $('#status').textContent = 'Submission could not start; the question remains a draft.';
  }
});

// Subscribe before taking the snapshot: IndexedDB initialization can finish later.
api.on('capture_queue', reconcileQueue);
api.on('upload_event', received);
reconcileQueue(api.captures());
api.on('connect', () => { $('#status').textContent = 'Ready. Review evidence before sending.'; });
if (api.connected) $('#status').textContent = 'Ready. Review evidence before sending.';
addEventListener('pagehide', () => { if (candidate) URL.revokeObjectURL(candidate.url); save(); });
