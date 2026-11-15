/* Optional session workflows. All concurrency information stays outside app data. */
(() => {
  function create(t) {
    if (!t?.scopes || !t?.request) throw new Error('Session workflows require core contract 2.');
    const id = name => `sessions:${name}`;
    const scope = name => t.scopes.capture(id(name));
    const generation = name => t.scopes.list().find(item => item.id === id(name))?.generation ?? null;
    const assertService = async () => {
      const service = t.service ?? await t.request('service');
      const module = service?.workflows?.find(item => item.id === 'sessions');
      if (service?.contract !== 2 || !module || module.interface_version !== '1' || module.schema_version !== '1')
        throw new Error('This service does not provide sessions interface 1/schema 1 on core contract 2.');
      return service;
    };
    const call = (operation, data = {}, metadata = {}) => {
      const command = structuredClone({ cid: metadata.cid ?? crypto.randomUUID(), expected_generations: {}, ...metadata, data });
      return assertService().then(() => t.request(`workflows/sessions/${encodeURIComponent(operation)}`, { method: 'POST', body: command }));
    };
    return Object.freeze({ scope, generation, call, assertService,
      send: (name, data, options = {}) => {
        const command = structuredClone({ cid: options.cid ?? crypto.randomUUID(), ...scope(name), ...options });
        const value = structuredClone(data);
        return assertService().then(() => t.send(value, command));
      },
      capture: (name, blob, options = {}) => {
        const command = structuredClone({ cid: options.cid ?? crypto.randomUUID(), ...scope(name), ...options });
        return assertService().then(() => t.uploadEvent(blob, command));
      },
    });
  }
  window.TendrilWorkflows = Object.freeze({ create });
})();
