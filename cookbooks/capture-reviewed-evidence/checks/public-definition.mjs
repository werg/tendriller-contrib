// A small declared application for the public-package qualification only.
export function sensingDefinition({ defineApplication, defineCommand, defineQuery, program, emit }) {
  return defineApplication({ id: 'cookbook-sensing-check', version: '1', commands: {
    retainEvidence: defineCommand({ description: 'Keep the reviewed response.',
      input: { type: 'object', properties: {
        requestId: { type: 'string' }, recipient: { type: 'string' }, operationId: { type: 'string' }, text: { type: 'string' },
        reference: { anyOf: [{ type: 'null' }, { type: 'object', properties: {
          profile: { type: 'string' }, applicationId: { type: 'string' }, historyId: { type: 'string' }, id: { type: 'string' },
          epoch: { type: 'integer' }, bytes: { type: 'integer' }, mediaType: { type: 'string' },
        }, required: ['profile', 'applicationId', 'historyId', 'id', 'epoch', 'bytes', 'mediaType'], additionalProperties: false }] }, observedAt: { anyOf: [{ type: 'null' }, { type: 'number' }] },
      }, required: ['requestId', 'recipient', 'operationId', 'text', 'reference', 'observedAt'], additionalProperties: false },
      prepare(input) { return program(emit('retained-evidence', input)); },
    }),
  }, queries: {
    evidence: defineQuery({ description: 'Read retained evidence.', input: { type: 'null' },
      read(view) { return view.readEvents({ topics: ['retained-evidence'], limit: 128 }).events.map(event => event.payload); },
    }),
  } });
}
