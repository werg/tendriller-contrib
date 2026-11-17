// Shared intent is application data. A separately authorized worker performs work.
import {
  applicationTimerCancellationSchema, applicationTimerOccurrenceSchema, applicationTimerScheduleSchema,
  createApplicationTimerPrograms, defineApplication, defineCommand, defineQuery, emit, hexToBytes, program, sqlStatement,
} from '@chronolog/peer-session';

const text = (maxLength = 4096) => ({ type: 'string', minLength: 1, maxLength });
const input = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const notification = input({ message: text() });
const timers = createApplicationTimerPrograms({ configurationTopic: 'schedules', tablePrefix: 'notification' });

export const notifications = defineApplication({
  id: 'peer-notifications', version: '1',
  schema: timers.schema,
  commands: {
    recordNote: defineCommand({
      description: 'Record a note in the selected application history.',
      input: input({ noteId: text(128), text: text() }),
      prepare: ({ noteId, text: value }) => program(emit('notes', { type: 'note.recorded', version: 1, noteId, text: value })),
    }),
    requestNotification: defineCommand({
      description: 'Record one logical notification intent; the worker independently authorizes dispatch.',
      input: input({ intentId: text(128), message: text(), requestedByLabel: text(128) }),
      prepare: value => program(emit('notifications', { type: 'notification.requested', version: 1, ...value })),
    }),
    recordNotificationResult: defineCommand({
      description: 'Record an observed external receipt; reapplication restores the fact without repeating its provider action.',
      input: input({ effectId: text(128), receipt: text(128) }),
      prepare: value => program(emit('notification-results', { type: 'notification.completed', version: 1, ...value })),
    }),
    scheduleNotification: defineCommand({
      description: 'Record a notification deadline. An unavailable scheduler can run it late.',
      input: applicationTimerScheduleSchema(notification),
      prepare: timers.schedule,
    }),
    cancelNotification: defineCommand({
      description: 'Cancel a selected pending schedule. This cannot undo an external notification.',
      input: applicationTimerCancellationSchema,
      prepare: timers.cancel,
    }),
    fireNotification: defineCommand({
      description: 'The schedule author guards and records one due occurrence; observed time belongs to this participant.',
      input: applicationTimerOccurrenceSchema(notification),
      prepare: occurrence => program(
        sqlStatement("SELECT chronolog_assert(chronolog_actor() = ?, 'notification_scheduler_unauthorized')", [hexToBytes(occurrence.configuration.author)]),
        ...timers.fire(occurrence).steps,
        emit('notifications', { type: 'notification.requested', version: 1, intentId: occurrence.occurrenceId,
          message: occurrence.payload.message, requestedByLabel: 'Timer' }),
      ),
    }),
  },
  queries: {
    notes: defineQuery({
      description: 'Read selected notes and their verified event origin.',
      input: input({}),
      read(view) {
        let state = initialNotes(), cursor;
        for (;;) {
          const page = view.readEvents({ topics: ['notes'], limit: 128, ...(cursor === undefined ? {} : { cursor }) });
          for (const event of page.events) state = reduceNotes(state, event);
          if (!page.hasMore) return state;
          if (cursor === page.cursor) throw Error('NOTES_CURSOR_STALLED');
          cursor = page.cursor;
        }
      },
    }),
  },
});

export function initialNotes() { return { notes: [] }; }
export function reduceNotes(state, event) {
  const value = event.payload;
  if (event.topic !== 'notes' || value.type !== 'note.recorded' || value.version !== 1) return state;
  return { notes: [...state.notes, { noteId: value.noteId, text: value.text,
    author: event.author, operationId: event.operationId, attemptId: event.attemptId }] };
}
