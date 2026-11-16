// Page-owned adaptation: dense exact-value comparison. No mounted component API.
const api = window.tendril;
const limit = 60;
const key = `observatory:${api.identity.page}:${api.device.id}:v1`;
const $ = selector => document.querySelector(selector);
const blank = () => ({ version: 1, cursor: 0, gap: false, discarded: 0, records: [] });
let model = blank(), epoch = 0, authorized = false, started = false;
let painting = false, unsubscribe = () => {};

function valid(saved) {
  return saved?.version === 1 && Number.isSafeInteger(saved.cursor) && saved.cursor >= 0
    && typeof saved.gap === 'boolean' && Number.isSafeInteger(saved.discarded) && saved.discarded >= 0
    && Array.isArray(saved.records) && saved.records.length <= limit && saved.records.every(record =>
      Number.isSafeInteger(record.seq) && record.seq > 0 && record.seq <= saved.cursor
      && Number.isFinite(record.x) && (record.y === null || Number.isFinite(record.y))
      && [record.source, record.run, record.unit].every(value => typeof value === 'string'));
}

function clearView() {
  $('#series').replaceChildren();
  $('#raw').replaceChildren();
  $('#gap').hidden = true;
  $('#budget').textContent = '';
  delete $('#budget').dataset.cursor;
}

function paint(currentEpoch = epoch) {
  if (!authorized || currentEpoch !== epoch) return;
  let persistence = '';
  try { localStorage.setItem(key, JSON.stringify(model)); }
  catch { persistence = ' Persistence unavailable; the previous checkpoint remains.'; }
  const groups = new Map();
  for (const record of model.records) {
    const identity = JSON.stringify([record.source, record.run, record.unit]);
    if (!groups.has(identity)) groups.set(identity, []);
    groups.get(identity).push(record);
  }
  const panels = [];
  for (const records of groups.values()) {
    const first = records[0], x = Number($('#inspect').value), exact = records.findLast(record => record.x === x);
    const panel = document.createElement('article');
    panel.className = 'panel';
    const title = document.createElement('h2');
    title.textContent = `${first.source} / ${first.run}`;
    const value = document.createElement('strong');
    value.textContent = !exact || exact.y === null ? 'Missing' : String(exact.y);
    const note = document.createElement('p');
    note.textContent = `${first.unit} · step ${x}${$('#log').checked && exact && exact.y !== null && exact.y <= 0 ? ' · not plotted on log scale' : ''}`;
    panel.append(title, value, note);
    panels.push(panel);
  }
  $('#series').replaceChildren(...panels);
  $('#raw').replaceChildren(...model.records.map(record => {
    const row = document.createElement('tr');
    for (const value of [`${record.source} / ${record.run}`, record.x, record.y === null ? 'Missing' : record.y, record.unit]) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    }
    return row;
  }));
  $('#gap').hidden = !model.gap;
  $('#budget').textContent = `Cursor ${model.cursor} · ${model.records.length} retained · ${model.discarded} evicted from this display`;
  $('#budget').dataset.cursor = String(model.cursor);
  $('#status').textContent = `Authorized · ${groups.size} source/run series.${persistence}`;
}

function schedule(currentEpoch) {
  if (!authorized || currentEpoch !== epoch || painting) return;
  painting = true;
  requestAnimationFrame(() => {
    if (currentEpoch !== epoch) return;
    painting = false;
    paint(currentEpoch);
  });
}

async function authorize() {
  started = true;
  const currentEpoch = ++epoch;
  authorized = false;
  painting = false;
  unsubscribe();
  unsubscribe = () => {};
  model = blank();
  clearView();
  $('#status').textContent = 'Authorizing current reader…';
  try {
    await api.streams.info('measurements');
    if (currentEpoch !== epoch) return;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const saved = JSON.parse(stored);
        if (!valid(saved)) throw Error('Invalid checkpoint');
        model = saved;
      }
    } catch { model = blank(); }
    authorized = true;
    paint(currentEpoch);
    unsubscribe = api.streams.subscribe('measurements', record => {
      if (!authorized || currentEpoch !== epoch || record.seq <= model.cursor) return;
      const data = record.data;
      if (!data || !Number.isFinite(data.x) || ![data.source, data.run, data.unit].every(value => typeof value === 'string')) {
        $('#status').textContent = 'Unexpected instrument schema; the cursor was not advanced.';
        return;
      }
      model.records.push({ seq: record.seq, x: data.x, y: Number.isFinite(data.y) ? data.y : null, source: data.source, run: data.run, unit: data.unit });
      if (model.records.length > limit) { model.records.shift(); model.discarded++; }
      model.cursor = record.seq;
      schedule(currentEpoch);
    }, {
      after: model.cursor,
      onGap() { if (authorized && currentEpoch === epoch) { model.gap = true; schedule(currentEpoch); } },
      onError(error) {
        if (currentEpoch !== epoch) return;
        if (error.code === 'forbidden') void authorize();
        else $('#status').textContent = error.message;
      },
    });
  } catch (error) {
    if (currentEpoch !== epoch) return;
    try { localStorage.removeItem(key); } catch {}
    clearView();
    $('#status').textContent = `Unavailable: ${error.message}. Private cached readings were cleared.`;
  }
}

$('#inspect').addEventListener('input', () => schedule(epoch));
$('#log').addEventListener('change', () => schedule(epoch));
api.on('role', () => void authorize());
api.on('connect', () => { if (!started) void authorize(); });
if (api.connected) void authorize();
addEventListener('pagehide', () => { if (painting) paint(); authorized = false; epoch++; unsubscribe(); });
