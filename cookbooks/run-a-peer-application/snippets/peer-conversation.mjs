// Domain data derives from a captured authored-operation-set snapshot.
import { defineApplication, defineCommand, defineQuery, emit, program } from '@chronolog/peer-session';
const noArguments = { type: 'object', properties: {}, required: [], additionalProperties: false };
export function readConversation(view) {
  const messages = []; let cursor;
  for (;;) {
    const batch = view.readEvents({ topics: ['conversation'], limit: 128, ...(cursor === undefined ? {} : { cursor }) });
    for (const event of batch.events) {
      const value = event.payload;
      if (value?.type === 'message.posted' && value.version === 1) messages.push({ messageId: value.messageId,
        text: value.text, author: event.author, operationId: event.operationId, proposalId: event.proposalId,
        authorTimestampMs: event.authorTimestampMs });
    }
    if (!batch.hasMore) return { messages };
    if (cursor === batch.cursor) throw Error('CONVERSATION_CURSOR_STALLED');
    cursor = batch.cursor;
  }
}
export const conversation = defineApplication({ id: 'peer-conversation', version: '1', commands: {
  postMessage: defineCommand({ description: 'Durably author a provisional message, including while disconnected.',
    input: { type: 'object', properties: { messageId: { type: 'string', minLength: 1, maxLength: 128 },
      text: { type: 'string', minLength: 1, maxLength: 4096 } }, required: ['messageId', 'text'], additionalProperties: false },
    prepare: ({ messageId, text }) => program(emit('conversation', { type: 'message.posted', version: 1, messageId, text })) }),
}, queries: { conversation: defineQuery({ description: 'Read authenticated messages from one coherent snapshot.', input: noArguments, read: readConversation }) } });
export const conversationCounts = { name: 'conversation-counts', version: '1',
  derive: view => ({ messages: readConversation(view).messages.length }) };
