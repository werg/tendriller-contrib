import { createServer } from 'node:https';
import { Readable } from 'node:stream';
import { createWebRtcOfferHandler } from '@chronolog/transport-webrtc';
import { createNativePeerConnection } from '@chronolog/transport-webrtc/native';

/**
 * Add this task to a native AgentApplication. The service starts independently
 * of browser visits and model turns. Deployment owns TLS, reachability, allowed
 * page origins and coarse introduction admission; Chronolog owns read grants.
 */
export function createResidentWebRtcTask({ context, endpoint, listen, tls, authorize, allowedOrigins,
  configuration, nativeOptions, signals, maxPending, maxConnections, timeoutMs, onError }) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) {
    throw new TypeError('The resident endpoint must be an explicit HTTPS URL without credentials, query or fragment');
  }
  if (!listen || typeof listen.host !== 'string' || !listen.host || !Number.isInteger(listen.port) || listen.port < 1 || listen.port > 65535) {
    throw new TypeError('An explicit resident HTTPS listen host and port are required');
  }
  if (!tls?.key || !tls?.cert) throw new TypeError('The resident HTTPS listener requires its deployment TLS key and certificate');
  const observe = error => {
    try { void Promise.resolve(onError?.(error)).catch(() => {}); }
    catch { /* Observability must not retain a failed request. */ }
  };
  let service, running = false;
  return {
    id: 'resident-webrtc',
    get stats() { return service?.stats ?? null; },
    async run(signal) {
      if (running) throw new Error('Resident WebRTC task is already running');
      signal.throwIfAborted();
      service = createWebRtcOfferHandler({ configuration, maxPending, maxConnections, timeoutMs, onError: observe, authorize, allowedOrigins,
        createPeerConnection: rtcConfiguration => createNativePeerConnection(rtcConfiguration, nativeOptions),
        accept: connection => context.connectPeer({ connection, ...(signals === undefined ? {} : { signals }) }) });
      running = true;
      const listening = new AbortController();
      let server, stop;
      try {
        server = createServer({ ...tls, maxHeaderSize: 16 * 1024 }, (request, response) => {
          if (request.url !== url.pathname) {
            response.writeHead(404, { Connection: 'close' }); response.end(); return;
          }
          const controller = new AbortController();
          const aborted = () => controller.abort(new Error('Resident introduction HTTP request disconnected'));
          const responseClosed = () => { if (!response.writableFinished) aborted(); };
          request.once('aborted', aborted); response.once('close', responseClosed);
          const run = async () => {
            const headers = new Headers();
            for (let index = 0; index < request.rawHeaders.length; index += 2) headers.append(request.rawHeaders[index], request.rawHeaders[index + 1]);
            const method = request.method ?? 'GET';
            const input = new Request(url, { method, headers, signal: controller.signal,
              ...(method === 'GET' || method === 'HEAD' ? {} : { body: Readable.toWeb(request), duplex: 'half' }) });
            const result = await service.fetch(input);
            response.writeHead(result.status, { ...Object.fromEntries(result.headers), ...(result.status >= 400 ? { Connection: 'close' } : {}) });
            response.end(Buffer.from(await result.arrayBuffer()));
          };
          void run().catch(error => {
            observe(error);
            if (response.headersSent) response.destroy();
            else { response.writeHead(500, { Connection: 'close' }); response.end(); }
          }).finally(() => {
            request.removeListener('aborted', aborted); response.removeListener('close', responseClosed);
          });
        });
        server.headersTimeout = 10_000;
        server.requestTimeout = timeoutMs ?? 30_000;
        server.keepAliveTimeout = 5_000;
        server.maxConnections = 64;
        await new Promise((resolve, reject) => {
          stop = () => { listening.abort(); server.closeAllConnections(); resolve(); };
          signal.addEventListener('abort', stop, { once: true });
          server.once('error', reject);
          server.once('close', resolve);
          // Node's listener abort also cancels an in-flight bind/hostname lookup.
          server.listen({ ...listen, signal: listening.signal });
          if (signal.aborted) stop();
        });
      } finally {
        // Stopping this resident task ends its peer lifetimes too. Merely
        // retiring each HTTP introduction never calls service.close().
        if (stop) signal.removeEventListener('abort', stop);
        listening.abort();
        server?.closeAllConnections();
        if (server?.listening) await new Promise(resolve => server.close(resolve));
        await service.close();
        running = false;
      }
    },
  };
}
