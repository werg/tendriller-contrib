// Domain-only events application. The public session owns storage, retry and recovery.
import { defineApplication, defineCommand, defineQuery, emit, program } from '@chronolog/peer-session';

const noArguments = { type: 'object', properties: {}, required: [], additionalProperties: false };

export const conversation = defineApplication({
  id: 'peer-conversation',
  version: '1',
  commands: {
    postMessage: defineCommand({
      description: 'Record one message in the currently selected conversation history.',
      input: {
        type: 'object',
        properties: {
          messageId: { type: 'string', minLength: 1, maxLength: 128 },
          text: { type: 'string', minLength: 1, maxLength: 4096 },
        },
        required: ['messageId', 'text'], additionalProperties: false,
      },
      prepare: ({ messageId, text }) => program(emit('conversation', {
        type: 'message.posted', version: 1, messageId, text,
      })),
    }),
  },
  queries: {
    conversation: defineQuery({
      description: 'Read messages and their authenticated authors from one captured revision.',
      input: noArguments,
      read(view) {
        const messages = [];
        let cursor;
        for (;;) {
          const batch = view.readEvents({ topics: ['conversation'], limit: 128, ...(cursor === undefined ? {} : { cursor }) });
          for (const event of batch.events) {
            const value = event.payload;
            if (value?.type !== 'message.posted' || value.version !== 1 ||
                typeof value.messageId !== 'string' || typeof value.text !== 'string') continue;
            // Keep verified author/operation metadata separate from payload claims.
            messages.push({ messageId: value.messageId, text: value.text,
              author: event.author, operationId: event.operationId, attemptId: event.attemptId });
          }
          if (!batch.hasMore) return { messages };
          if (cursor === batch.cursor) throw Error('CONVERSATION_CURSOR_STALLED');
          cursor = batch.cursor;
        }
      },
    }),
  },
});
