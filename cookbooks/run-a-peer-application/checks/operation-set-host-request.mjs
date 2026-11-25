// Test-only HTTP bridge adapter. Protocol records are verified by packed APIs.
export function createHostRequester(base, fetcher = globalThis.fetch) {
  return async (path, { method = 'GET', body, signal } = {}) => {
    const response = await fetcher(new URL(path, base), { method, signal: signal ?? AbortSignal.timeout(30_000),
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(Error(typeof result?.error?.message === 'string' ? result.error.message : `HTTP_${response.status}`),
      { code: typeof result?.error?.code === 'string' ? result.error.code : 'invalid_host_error', status: response.status });
    return result;
  };
}
