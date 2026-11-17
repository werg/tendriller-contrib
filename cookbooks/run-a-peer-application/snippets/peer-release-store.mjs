// Signed public controls only. Web Locks give this small page store one owner;
// Chronolog owns trust, monotonicity, verification and the journal schema.
export async function openPageReleaseStore(applicationId) {
  const prefix = `peer-release-controls:${applicationId}:`;
  let opened, failed, release, closed = false;
  const ready = new Promise((resolve, reject) => { opened = resolve; failed = reject; });
  const held = new Promise(resolve => { release = resolve; });
  const assertOpen = () => { if (closed) throw Error('PAGE_RELEASE_STORE_CLOSED'); };
  const owner = navigator.locks.request(prefix, { ifAvailable: true }, async lock => {
    if (lock === null) throw Error('PAGE_RELEASE_STORE_IN_USE');
    opened({
      async get(key) {
        assertOpen(); const value = localStorage.getItem(prefix + key);
        return value === null ? null : Uint8Array.from(atob(value), character => character.charCodeAt(0));
      },
      async put(key, bytes) {
        assertOpen(); if (bytes.length > 4 * 1024 * 1024) throw Error('PAGE_RELEASE_STORE_LIMIT');
        const parts = [];
        for (let offset = 0; offset < bytes.length; offset += 32_768) parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 32_768)));
        localStorage.setItem(prefix + key, btoa(parts.join('')));
      },
      async delete(key) { assertOpen(); localStorage.removeItem(prefix + key); },
      async list(keyPrefix) {
        assertOpen(); return Object.keys(localStorage).filter(key => key.startsWith(prefix + keyPrefix)).map(key => key.slice(prefix.length)).sort();
      },
      async close() { closed = true; release(); await owner; },
    });
    await held;
  });
  void owner.catch(failed);
  return ready;
}
