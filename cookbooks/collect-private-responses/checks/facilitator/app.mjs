const api = window.tendril, $ = selector => document.querySelector(selector);
let current = null, edits = 0, pending = null, started = false, authEpoch = 0, readVersion = 0;

function clearSensitive() {
  current = null;
  pending = null;
  $('#answers').replaceChildren();
  $('#summary').value = '';
  $('#published').textContent = '';
  $('#round').textContent = '';
  $('#publish').disabled = true;
  $('#retry').hidden = true;
  $('#review-current').hidden = true;
}

async function load(epoch = authEpoch) {
  const requestVersion = ++readVersion;
  const valid = () => epoch === authEpoch && requestVersion === readVersion;
  if (!api.service?.workflows.some(workflow => workflow.id === 'private-responses')) {
    $('#status').textContent = 'An explicitly installed private-response capability is required.';
    return;
  }
  try {
    const result = await api.request('workflows/private-responses/review', { method: 'POST', body: { cid: crypto.randomUUID(), expected_generations: {}, data: {} } });
    if (!valid()) return;
    current = result;
    $('#round').textContent = `${current.round.label} · reviewed revision ${current.round.revision}`;
    $('#answers').replaceChildren(...current.assignments.map(assignment => {
      const article = document.createElement('article'), title = document.createElement('h3'), answer = document.createElement('p');
      title.textContent = assignment.prompt;
      answer.textContent = current.answers.find(row => row.assignment === assignment.id)?.answer || 'No submitted answer';
      article.append(title, answer);
      return article;
    }));
    $('#publish').disabled = !!pending;
    $('#status').textContent = 'Authorized private view. Review the aggregate before publishing.';
  } catch (error) {
    if (!valid()) return;
    authEpoch++;
    clearSensitive();
    $('#status').textContent = `Private review unavailable: ${error.message}`;
  }
}

function authorize() {
  started = true;
  const epoch = ++authEpoch;
  clearSensitive();
  $('#status').textContent = 'Checking current authority…';
  void load(epoch);
}

async function publish() {
  if (!pending) return;
  const snapshot = pending, epoch = authEpoch;
  $('#publish').disabled = true;
  $('#retry').hidden = true;
  $('#review-current').hidden = true;
  try {
    const result = await api.request('workflows/private-responses/publish', { method: 'POST', body: snapshot.body });
    if (epoch !== authEpoch) return;
    $('#published').textContent = `Published: ${result.summary.text}`;
    if (edits === snapshot.edits && $('#summary').value === snapshot.body.data.summary) $('#summary').value = '';
    pending = null;
    $('#retry').hidden = true;
    await load(epoch);
  } catch (error) {
    if (epoch !== authEpoch) return;
    if (error.code === 'forbidden' || error.status === 401 || error.status === 403) {
      authEpoch++;
      clearSensitive();
      $('#status').textContent = 'Private review unavailable for the current identity. Refresh to reauthorize.';
      return;
    }
    $('#status').textContent = `Publication not accepted: ${error.message}. The original reviewed revision is retained.`;
    $('#retry').hidden = false;
    $('#review-current').hidden = false;
  }
}

$('#summary').addEventListener('input', () => edits++);
$('#refresh').addEventListener('click', () => void load());
$('#publish').addEventListener('click', () => {
  if (!current || pending || !$('#summary').value.trim()) return;
  let context;
  try { context = api.scopes.capture('private-responses:round'); }
  catch { $('#status').textContent = 'This review has no active submission context. Refresh the round before publishing.'; return; }
  pending = {
    edits,
    body: { cid: crypto.randomUUID(), ...context, data: { summary: $('#summary').value, expected_revision: current.round.revision } },
  };
  void publish();
});
$('#retry').addEventListener('click', () => void publish());
$('#review-current').addEventListener('click', () => {
  pending = null;
  current = null;
  $('#publish').disabled = true;
  $('#retry').hidden = true;
  $('#review-current').hidden = true;
  $('#status').textContent = 'Checking the current revision before a new publication…';
  void load();
});
api.on('role', authorize);
api.on('connect', () => { if (!started) authorize(); });
if (api.connected) authorize();
addEventListener('pagehide', () => { authEpoch++; clearSensitive(); });
