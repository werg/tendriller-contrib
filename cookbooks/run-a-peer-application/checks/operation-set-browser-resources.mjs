// The same diagnostic runs in the Window and the one existing protocol Worker.
// It observes real platform calls without substituting a storage implementation.
export function observeBrowserResources() {
  const observed = { indexedDbOpens: 0, opfsRoots: 0, writableFiles: 0, syncHandles: 0, lockRequests: 0, lockNames: [] };
  const wrap = (owner, name, called) => {
    if (typeof owner?.[name] !== 'function') return;
    const original = owner[name];
    Object.defineProperty(owner, name, { configurable: true, value(...args) {
      called(args); return Reflect.apply(original, this, args);
    } });
  };
  wrap(globalThis.indexedDB, 'open', () => observed.indexedDbOpens++);
  wrap(navigator.storage, 'getDirectory', () => observed.opfsRoots++);
  wrap(navigator.locks, 'request', ([name]) => {
    observed.lockRequests++;
    if (!observed.lockNames.includes(name)) {
      if (observed.lockNames.length >= 16) throw Error('FIXTURE_STORAGE_LOCK_LIMIT');
      observed.lockNames.push(name);
    }
  });
  wrap(globalThis.FileSystemFileHandle?.prototype, 'createWritable', () => observed.writableFiles++);
  wrap(globalThis.FileSystemFileHandle?.prototype, 'createSyncAccessHandle', () => observed.syncHandles++);
  globalThis.fixtureResources = observed;
  return observed;
}
