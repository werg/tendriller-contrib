/** Agent workflow adapter. Metadata must be captured before composing a command. */
export const WORKFLOW_REQUIREMENT = Object.freeze({ id: 'sessions', interface_version: '1', schema_version: '1' });
export function createWorkflows(client) {
  const assertService = async () => {
    const service = await client.service();
    const module = service?.workflows?.find(item => item.id === WORKFLOW_REQUIREMENT.id);
    if (service?.contract !== 2 || !module || module.interface_version !== WORKFLOW_REQUIREMENT.interface_version || module.schema_version !== WORKFLOW_REQUIREMENT.schema_version)
      throw new Error('Service does not provide sessions interface 1/schema 1 on core contract 2');
    return service;
  };
  return Object.freeze({
    assertService,
    async capture(name) {
      await assertService();
      const id = `sessions:${name}`;
      const { scopes } = await client.scopes();
      const current = scopes.find(item => item.id === id);
      if (!current) throw new Error(`Activate workflow scope ${name} before composing work`);
      return { scope: id, expected_generations: { [id]: current.generation } };
    },
    call(operation, data = {}, metadata = {}) {
      const command = structuredClone({ cid: metadata.cid ?? crypto.randomUUID(), expected_generations: {}, ...metadata, data });
      return assertService().then(() => client.workflow('sessions', operation, command));
    },
  });
}
