// The selected server policy owns privacy; this form renders only its projection.
const runtime = window.tendril, $ = selector => document.querySelector(selector);
let assignment = null, pending = null, draftRevision = 0, authEpoch = 0, started = false, key = '';
const read = () => runtime.request('workflows/private-responses/mine', {
  method: 'POST', body: { cid: crypto.randomUUID(), expected_generations: {}, data: {} },
});

function save() {
  if (!key) return;
  try { localStorage.setItem(key, JSON.stringify({ text: $('#answer').value, pending })); }
  catch { $('#status').textContent = 'Draft storage unavailable; keep this page open until an outcome.'; }
}

function clearSensitive() {
  assignment = null;
  pending = null;
  key = '';
  $('#form').hidden = true;
  $('#answer').value = '';
  $('#receipt').textContent = '';
  $('#receipt').hidden = true;
  $('#retry').hidden = true;
  $('#review-current').hidden = true;
  $('#submit').disabled = false;
  $('#prompt').textContent = 'Checking your assignment…';
}

async function authorize() {
  started = true;
  const epoch = ++authEpoch;
  clearSensitive();
  $('#status').textContent = 'Authorizing the current identity…';
  if (!runtime.service?.workflows.some(workflow => workflow.id === 'private-responses')) {
    $('#status').textContent = 'This task requires an explicitly installed private-response capability.';
    return;
  }
  try {
    const result = await read();
    if (epoch !== authEpoch) return;
    assignment = result.assignments[0];
    if (!assignment) {
      $('#prompt').textContent = 'No current question';
      $('#status').textContent = 'No current assignment is available to this identity.';
      return;
    }
    $('#prompt').textContent = assignment.prompt;
    key = `private-answer:${runtime.identity.page}:${runtime.device.id}:${assignment.id}`;
    // The current authorized projection must supply the ID before this cache is read.
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved) {
        $('#answer').value = String(saved.text || '');
        pending = saved.pending?.body?.data?.assignment === assignment.id ? saved.pending : null;
      }
    } catch {}
    draftRevision++;
    $('#form').hidden = false;
    $('#retry').hidden = !pending;
    $('#review-current').hidden = !pending;
    $('#status').textContent = pending ? 'A previous response needs its original retry or deliberate review.' : 'Ready for your private answer.';
  } catch (error) {
    if (epoch !== authEpoch) return;
    clearSensitive();
    $('#prompt').textContent = 'Response unavailable';
    $('#status').textContent = error.message;
  }
}

async function send() {
  if (!pending || !assignment) return;
  const sent = pending, epoch = authEpoch, id = assignment.id;
  const current = () => epoch === authEpoch && assignment?.id === id;
  $('#submit').disabled = true;
  try {
    const result = await runtime.request('workflows/private-responses/submit', { method: 'POST', body: sent.body });
    if (!current()) return;
    assignment.response = result;
    $('#receipt').hidden = false;
    $('#receipt').textContent = `Accepted revision ${result.revision}: ${sent.body.data.answer}`;
    if (draftRevision === sent.draftRevision && $('#answer').value === sent.body.data.answer) $('#answer').value = '';
    pending = null;
    $('#retry').hidden = true;
    $('#review-current').hidden = true;
    $('#status').textContent = 'Response accepted. New typing is a separate draft.';
    save();
  } catch (error) {
    if (!current()) return;
    if (error.code === 'forbidden' || error.status === 401 || error.status === 403) {
      authEpoch++;
      clearSensitive();
      $('#status').textContent = 'Private response unavailable for the current identity. Reopen after authorization changes.';
      return;
    }
    $('#receipt').hidden = false;
    $('#receipt').textContent = `Original response retained: ${sent.body.data.answer}`;
    $('#status').textContent = `Not accepted: ${error.message}. Retry keeps the original command and generation.`;
    $('#retry').hidden = false;
    $('#review-current').hidden = false;
    save();
  } finally { if (current()) $('#submit').disabled = false; }
}

$('#answer').addEventListener('input', () => { draftRevision++; save(); });
$('#form').addEventListener('submit', event => {
  event.preventDefault();
  if (!assignment || pending) return;
  const answer = $('#answer').value.trim();
  if (!answer) return;
  pending = {
    draftRevision,
    body: { cid: crypto.randomUUID(), ...runtime.scopes.capture('private-responses:round'), data: { assignment: assignment.id, answer, expected_revision: assignment.response?.revision || 0 } },
  };
  save();
  void send();
});
$('#retry').addEventListener('click', () => void send());
$('#review-current').addEventListener('click', () => { pending = null; save(); void authorize(); });
runtime.on('role', () => void authorize());
runtime.on('connect', () => { if (!started) void authorize(); });
if (runtime.connected) void authorize();
addEventListener('pagehide', () => { save(); authEpoch++; clearSensitive(); });
