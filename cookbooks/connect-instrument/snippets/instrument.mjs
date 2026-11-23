// Editable read-only adapters. Instrument commands/actuation are deliberately
// absent; adapt framing and validation to the actual documented device protocol.
const trusted = event => { if (event?.isTrusted !== true) throw Error('Connect from a trusted local action.'); };

export function createLineFramer(onLine, { maxFrameBytes = 2048, onReject = () => {} } = {}) {
  if (!Number.isSafeInteger(maxFrameBytes) || maxFrameBytes < 1 || maxFrameBytes > 65536) throw RangeError('Invalid frame budget.');
  const carry = new Uint8Array(maxFrameBytes), decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0, dropping = false;
  return {
    get bufferedBytes() { return size; },
    reset() { size = 0; dropping = false; },
    push(chunk) {
      if (!(chunk instanceof Uint8Array)) throw TypeError('Supply bytes, not decoded stream chunks.');
      for (const byte of chunk) {
        if (byte === 10) {
          if (!dropping && size) {
            const end = carry[size - 1] === 13 ? size - 1 : size;
            let line;
            try { line = decoder.decode(carry.subarray(0, end)); }
            catch { onReject('invalid-utf8'); }
            if (line !== undefined) onLine(line);
          }
          size = 0; dropping = false;
        } else if (!dropping) {
          if (size === maxFrameBytes) { size = 0; dropping = true; onReject('oversized-frame'); }
          else carry[size++] = byte;
        }
      }
    },
  };
}

/** An example line payload; this is the bench app's schema, not a core envelope. */
export function parseReading(line) {
  let value; try { value = JSON.parse(line); } catch { throw TypeError('Malformed reading JSON.'); }
  if (!value || typeof value !== 'object' || !Number.isFinite(value.value)
    || typeof value.unit !== 'string' || !value.unit.length || value.unit.length > 16) throw TypeError('Invalid value or unit.');
  return { value: value.value, unit: value.unit };
}

export function createSerialReader({ tendril, serial = globalThis.navigator?.serial, document = globalThis.document,
  filters = [], baudRate = 9600, onFrame, onReject = () => {}, onStatus = () => {} }) {
  if (!Number.isSafeInteger(baudRate) || baudRate < 1 || baudRate > 4_000_000) throw RangeError('Invalid baud rate.');
  let handle = null, closing = false, disposed = false;
  const stop = () => handle?.unregister();
  const hidden = () => { if (document?.visibilityState !== 'visible') stop(); };
  document?.addEventListener('visibilitychange', hidden);
  return {
    async start(event) {
      trusted(event);
      if (disposed || handle || closing) throw Error('Disconnect the current instrument before another connection.');
      if (document?.visibilityState !== 'visible' || !serial?.requestPort) throw Error('Serial is unavailable here. Use a recorded log.');
      let port, reader, opening, readTask, opened = false, failure = null;
      const framer = createLineFramer(onFrame, { onReject });
      const current = tendril.sensors.register({ kind: 'serial', label: 'Read-only serial instrument', state: 'pending', async stop() {
        closing = true; if (handle === current) handle = null; onStatus('stopping');
        try {
          await opening?.catch(() => {});
          if (reader) await reader.cancel();
          await readTask;
          if (opened) { opened = false; await port.close(); }
          onStatus(failure ? 'failed' : 'stopped');
        } finally { closing = false; framer.reset(); }
      } });
      handle = current; onStatus('requesting');
      try {
        // requestPort is invoked in the gesture stack, before the first await.
        port = await serial.requestPort({ filters });
        current.signal.throwIfAborted();
        opening = port.open({ baudRate }).then(() => { opened = true; });
        await opening; current.signal.throwIfAborted();
        if (!port.readable) throw Error('The instrument has no readable stream.');
        reader = port.readable.getReader(); current.setState('active'); onStatus('active');
        readTask = (async () => {
          try {
            while (!current.signal.aborted) {
              const result = await reader.read();
              if (current.signal.aborted || result.done) break;
              framer.push(result.value);
            }
          } catch (error) { if (!current.signal.aborted) failure = error; }
          finally {
            reader.releaseLock(); reader = null;
            current.unregister(); // Idempotent; never await cleanup from its own read loop.
          }
        })();
      } catch (error) {
        if (!current.signal.aborted) failure = error;
        current.unregister();
        throw error;
      }
    },
    stop,
    dispose() { if (disposed) return; stop(); disposed = true; document?.removeEventListener('visibilitychange', hidden); },
  };
}

export function createBluetoothReader({ tendril, bluetooth = globalThis.navigator?.bluetooth, document = globalThis.document,
  service, characteristic, onFrame, onReject = () => {}, onStatus = () => {} }) {
  if (!service || !characteristic) throw TypeError('Declare the instrument service and characteristic.');
  let handle = null, closing = false, disposed = false;
  const stop = () => handle?.unregister();
  const hidden = () => { if (document?.visibilityState !== 'visible') stop(); };
  document?.addEventListener('visibilitychange', hidden);
  return {
    async start(event) {
      trusted(event);
      if (disposed || handle || closing) throw Error('Disconnect the current instrument before another connection.');
      if (document?.visibilityState !== 'visible' || !bluetooth?.requestDevice) throw Error('Bluetooth is unavailable here. Use a recorded log.');
      let device, connecting, notifications, value, failure = null;
      const framer = createLineFramer(onFrame, { onReject });
      const changed = event => {
        if (current.signal.aborted) return;
        const data = event.target?.value;
        if (data instanceof DataView) {
          try { framer.push(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)); }
          catch (error) { failure = error; current.unregister(); }
        }
      };
      const disconnected = () => { if (!current.signal.aborted) { failure = Error('Instrument disconnected.'); current.unregister(); } };
      const current = tendril.sensors.register({ kind: 'bluetooth', label: 'Read-only Bluetooth instrument', state: 'pending', async stop() {
        closing = true; if (handle === current) handle = null; onStatus('stopping');
        try {
          await connecting?.catch(() => {});
          await notifications?.catch(() => {});
          value?.removeEventListener('characteristicvaluechanged', changed);
          device?.removeEventListener('gattserverdisconnected', disconnected);
          try { if (value && device?.gatt?.connected) await value.stopNotifications(); }
          finally { device?.gatt?.disconnect(); }
          onStatus(failure ? 'failed' : 'stopped');
        } finally { closing = false; framer.reset(); }
      } });
      handle = current; onStatus('requesting');
      try {
        device = await bluetooth.requestDevice({ filters: [{ services: [service] }] });
        if (current.signal.aborted) { device.gatt?.disconnect(); current.signal.throwIfAborted(); }
        device.addEventListener('gattserverdisconnected', disconnected);
        connecting = device.gatt.connect();
        const server = await connecting; current.signal.throwIfAborted();
        const selected = await server.getPrimaryService(service); current.signal.throwIfAborted();
        value = await selected.getCharacteristic(characteristic); current.signal.throwIfAborted();
        value.addEventListener('characteristicvaluechanged', changed);
        notifications = value.startNotifications(); await notifications; current.signal.throwIfAborted();
        current.setState('active'); onStatus('active');
      } catch (error) {
        if (!current.signal.aborted) failure = error;
        current.unregister();
        // A characteristic lookup may resolve after cleanup. It has no listener
        // until the abort check above and the already-owned GATT server is closed.
        throw error;
      }
    },
    stop,
    dispose() { if (disposed) return; stop(); disposed = true; document?.removeEventListener('visibilitychange', hidden); },
  };
}
