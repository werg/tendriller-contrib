const platform = window.tendril, $ = selector => document.querySelector(selector);
const canvas = $('canvas'), ctx = canvas.getContext('2d'), description = $('#description');
const cacheKey = `sketch:${platform.identity.page}:${platform.device.id}:v1`, submissions = new Map();
let editVersion = 0, reviewed = null, drawing = false, last = null, durableIds = new Set(), restoringImage = null, restoringVersion = -1;
const say = text => { $('#status').textContent = text; };

function persist() {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ text: description.value, image: restoringImage && editVersion === restoringVersion ? restoringImage : canvas.toDataURL(), editVersion, submissions: [...submissions.values()].slice(-10) }));
  } catch { say('Sketch storage is unavailable; pending captures still use platform durability.'); }
}
function blank() { ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
blank();
try {
  const saved = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  if (saved) {
    description.value = String(saved.text || '');
    editVersion = Number.isSafeInteger(saved.editVersion) ? saved.editVersion : 0;
    for (const row of saved.submissions || []) if (row && typeof row.submissionId === 'string' && typeof row.text === 'string') submissions.set(row.submissionId, row);
    if (typeof saved.image === 'string' && saved.image.startsWith('data:image/png;base64,')) {
      const image = new Image();
      restoringVersion = editVersion;
      restoringImage = saved.image;
      image.onload = () => {
        if (editVersion === restoringVersion) ctx.drawImage(image, 0, 0);
        restoringImage = null;
        persist();
      };
      image.onerror = () => { restoringImage = null; say('The saved sketch image could not be restored; its text remains.'); };
      image.src = saved.image;
    }
  }
} catch { say('Unusable sketch draft; starting a fresh canvas.'); }

const point = event => {
  const box = canvas.getBoundingClientRect();
  return { x: (event.clientX - box.left) * canvas.width / box.width, y: (event.clientY - box.top) * canvas.height / box.height };
};
canvas.addEventListener('pointerdown', event => { drawing = true; last = point(event); canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => {
  if (!drawing) return;
  const p = point(event);
  ctx.strokeStyle = '#433355'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  last = p; editVersion++;
});
for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { drawing = false; persist(); });
$('#rectangle').addEventListener('click', () => { ctx.strokeStyle = '#433355'; ctx.lineWidth = 4; ctx.strokeRect(120 + editVersion % 5 * 25, 90, 260, 160); editVersion++; persist(); });
$('#clear').addEventListener('click', () => { blank(); editVersion++; persist(); });
description.addEventListener('input', () => { editVersion++; persist(); });
$('#fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { say('Fullscreen is unavailable; the ordinary drawing page still works.'); }
});

function closeReview() {
  if (reviewed) URL.revokeObjectURL(reviewed.url);
  reviewed = null;
  $('#snapshot').removeAttribute('src');
  $('#drawing').hidden = false; $('#review').hidden = true;
}
$('#review-button').addEventListener('click', () => {
  const version = editVersion, context = platform.scopes.capture('evidence');
  canvas.toBlob(blob => {
    if (!blob) { say('Could not capture the canvas. Keep your text description.'); return; }
    if (editVersion !== version) { say('Drawing changed during capture; review a fresh snapshot.'); return; }
    closeReview();
    reviewed = { blob, url: URL.createObjectURL(blob), context, version };
    $('#snapshot').src = reviewed.url;
    $('#drawing').hidden = true; $('#review').hidden = false;
    say('Review this snapshot and description before sending.');
  }, 'image/png');
});
$('#retake').addEventListener('click', closeReview);

function render() {
  $('#outcomes').replaceChildren(...[...submissions.values()].map(row => {
    const article = document.createElement('article');
    article.className = 'outcome'; article.dataset.status = row.status; article.dataset.submission = row.submissionId;
    if (row.captureId) article.dataset.capture = row.captureId;
    const title = document.createElement('h2'), text = document.createElement('p'), message = document.createElement('p');
    title.textContent = row.status; text.textContent = row.text; message.textContent = row.message || '';
    article.append(title, text, message);
    if (durableIds.has(row.captureId) && ['queued', 'rejected'].includes(row.status)) {
      const retry = document.createElement('button'), discard = document.createElement('button');
      retry.textContent = 'Retry original capture'; discard.textContent = 'Discard from device queue';
      retry.addEventListener('click', async () => {
        retry.disabled = true;
        try { received(await platform.retryCapture(row.captureId), row); }
        catch (error) { say(error.message); }
        finally { retry.disabled = false; }
      });
      discard.addEventListener('click', async () => {
        try {
          await platform.discardCapture(row.captureId);
          if (row.status !== 'accepted') row.status = 'discarded';
          persist(); render();
        } catch (error) { say(error.message); }
      });
      article.append(retry, discard);
    }
    return article;
  }));
}

function received(result, submitted) {
  const row = submitted || [...submissions.values()].find(item => item.captureId === result.capture_id);
  if (!row) return;
  row.captureId = result.capture_id;
  row.status = result.error === 'discarded' ? 'discarded' : result.status;
  row.message = result.message || result.error || '';
  if (result.status === 'accepted' && editVersion === row.version && description.value === row.text) {
    description.value = ''; blank(); editVersion++;
  }
  persist(); render();
  say(result.status === 'accepted' ? 'Snapshot accepted. New edits are untouched.'
    : result.status === 'queued' ? 'Snapshot queued with its original context.'
    : row.status === 'discarded' ? 'Removed from the device queue. This cannot undo remote acceptance.'
    : 'Snapshot rejected; the submitted description remains below and your current draft is intact.');
}

function reconcileQueue(queue) {
  durableIds = new Set(queue.map(item => item.capture_id));
  for (const capture of queue) {
    const data = capture.data;
    if (data?.kind !== 'reviewed_sketch' || typeof data.submission_id !== 'string') continue;
    let row = submissions.get(data.submission_id);
    if (!row) {
      row = { submissionId: data.submission_id, text: String(data.text || ''), version: -1 };
      submissions.set(row.submissionId, row);
    }
    Object.assign(row, { captureId: capture.capture_id, status: capture.status, message: capture.message || capture.error || '' });
  }
  persist(); render();
}

$('#send').addEventListener('click', async () => {
  if (!reviewed) return;
  const { blob, context } = reviewed, submissionId = crypto.randomUUID();
  const row = { submissionId, captureId: null, text: description.value, version: editVersion, status: 'sending' };
  submissions.set(submissionId, row);
  persist(); render(); closeReview();
  try {
    received(await platform.uploadEvent(blob, {
      name: 'reviewed-sketch.png', data: { kind: 'reviewed_sketch', submission_id: submissionId, question: 'layout-1', text: row.text },
      dataPath: ['evidence'], ...context,
    }), row);
  } catch (error) {
    row.status = 'error'; row.message = error.message;
    persist(); render(); say('Snapshot could not start; your draft remains.');
  }
});

platform.on('capture_queue', reconcileQueue);
platform.on('upload_event', received);
reconcileQueue(platform.captures());
platform.on('connect', () => say('Ready. Review a snapshot when your drawing is useful.'));
if (platform.connected) say('Ready. Review a snapshot when your drawing is useful.');
addEventListener('pagehide', () => { persist(); if (reviewed) URL.revokeObjectURL(reviewed.url); });
