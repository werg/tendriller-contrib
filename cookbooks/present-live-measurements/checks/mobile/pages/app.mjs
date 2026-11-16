// Independently authored mobile model: one reading and twenty raw observations.
const runtime = window.tendril;
const storageKey = `instrument:${runtime.identity.page}:${runtime.device.id}:v1`;
const output = document.querySelector('#reading'), select = document.querySelector('#run');
const empty = () => ({ schema: 1, after: 0, incomplete: false, observations: [], removed: 0 });
const text = (selector, value) => { document.querySelector(selector).textContent = value; };
let checkpoint = empty(), authEpoch = 0, permitted = false, started = false;
let painting = false, unsubscribe = () => {};

function valid(saved) {
  return saved?.schema === 1 && Number.isSafeInteger(saved.after) && saved.after >= 0
    && typeof saved.incomplete === 'boolean' && Number.isSafeInteger(saved.removed) && saved.removed >= 0
    && Array.isArray(saved.observations) && saved.observations.length <= 20 && saved.observations.every(record =>
      Number.isSafeInteger(record.seq) && record.seq > 0 && record.seq <= saved.after
      && Number.isFinite(record.x) && (record.y === null || Number.isFinite(record.y))
      && [record.source, record.run, record.unit].every(value => typeof value === 'string'));
}

function clearReading() {
  output.textContent = '—';
  select.replaceChildren();
  document.querySelector('#values').replaceChildren();
  document.querySelector('#gap').hidden = true;
  for (const selector of ['#units', '#freshness', '#budget']) text(selector, '');
  delete document.querySelector('#budget').dataset.cursor;
}

function draw(version = authEpoch) {
  if (!permitted || version !== authEpoch) return;
  const identities = [...new Set(checkpoint.observations.map(record => JSON.stringify([record.source, record.run, record.unit])))];
  const chosen = select.value;
  select.replaceChildren(...identities.map(identity => {
    const option = document.createElement('option'), [source, run] = JSON.parse(identity);
    option.value = identity;
    option.textContent = `${source} / ${run}`;
    return option;
  }));
  if (identities.includes(chosen)) select.value = chosen;
  const selected = checkpoint.observations.filter(record => JSON.stringify([record.source, record.run, record.unit]) === select.value);
  const latest = selected.at(-1);
  output.textContent = latest ? latest.y === null ? 'Missing' : String(latest.y) : '—';
  text('#units', latest?.unit || '');
  text('#freshness', latest ? `Observed at step ${latest.x}` : 'Waiting for an observation');
  document.querySelector('#values').replaceChildren(...selected.map(record => {
    const item = document.createElement('li');
    item.textContent = `Step ${record.x}: ${record.y === null ? 'Missing' : record.y} ${record.unit}`;
    return item;
  }));
  document.querySelector('#gap').hidden = !checkpoint.incomplete;
  text('#budget', `Cursor ${checkpoint.after}; ${checkpoint.observations.length}/20 displayed, ${checkpoint.removed} evicted`);
  document.querySelector('#budget').dataset.cursor = String(checkpoint.after);
  try { localStorage.setItem(storageKey, JSON.stringify(checkpoint)); text('#status', 'Authorized reading. Display and cursor saved together.'); }
  catch { text('#status', 'Persistence unavailable. Current reading remains visible.'); }
}

function queue(version) {
  if (!permitted || version !== authEpoch || painting) return;
  painting = true;
  requestAnimationFrame(() => {
    if (version !== authEpoch) return;
    painting = false;
    draw(version);
  });
}

async function authorize() {
  started = true;
  const version = ++authEpoch;
  permitted = false;
  painting = false;
  unsubscribe();
  unsubscribe = () => {};
  checkpoint = empty();
  clearReading();
  text('#status', 'Checking current access…');
  try {
    await runtime.streams.info('measurements');
    if (version !== authEpoch) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved) { if (!valid(saved)) throw Error('Invalid instrument checkpoint'); checkpoint = saved; }
    } catch { checkpoint = empty(); }
    permitted = true;
    draw(version);
    unsubscribe = runtime.streams.subscribe('measurements', record => {
      if (!permitted || version !== authEpoch || record.seq <= checkpoint.after) return;
      const data = record.data;
      if (!data || !Number.isFinite(data.x) || ![data.source, data.run, data.unit].every(value => typeof value === 'string')) {
        text('#status', 'Invalid observation; the cursor was not advanced.');
        return;
      }
      checkpoint.observations.push({ seq: record.seq, x: data.x, y: Number.isFinite(data.y) ? data.y : null, source: data.source, run: data.run, unit: data.unit });
      if (checkpoint.observations.length > 20) { checkpoint.observations.shift(); checkpoint.removed++; }
      checkpoint.after = record.seq;
      queue(version);
    }, {
      after: checkpoint.after,
      onGap() { if (permitted && version === authEpoch) { checkpoint.incomplete = true; queue(version); } },
      onError(error) {
        if (version !== authEpoch) return;
        if (error.code === 'forbidden') void authorize();
        else text('#status', error.message);
      },
    });
  } catch (error) {
    if (version !== authEpoch) return;
    try { localStorage.removeItem(storageKey); } catch {}
    clearReading();
    text('#status', `Unavailable: ${error.message}. Private cached readings were cleared.`);
  }
}

select.addEventListener('change', () => draw());
runtime.on('role', () => void authorize());
runtime.on('connect', () => { if (!started) void authorize(); });
if (runtime.connected) void authorize();
addEventListener('pagehide', () => { if (painting) draw(); permitted = false; authEpoch++; unsubscribe(); });
