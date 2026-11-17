import {
  APPLICATION_COLLECTIVE_ID,
  OWNER_FOR_KEY_SQL,
  defineApplication,
  defineCommand,
  defineQuery,
  emit,
  program,
  sqlStatement,
} from '@chronolog/peer-session';

const taskId = { type: 'string', minLength: 1, maxLength: 80 };

export const definition = defineApplication({
  id: 'fresh-guarded-task-board',
  version: '1',
  schema: program(`CREATE TABLE tasks (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
    state TEXT NOT NULL CHECK(state IN ('open', 'done')),
    version INTEGER NOT NULL CHECK(version > 0)
  )`),
  commands: {
    createTask: defineCommand({
      description: 'Create a shared open task with an unused ID',
      input: {
        type: 'object',
        properties: { id: taskId, title: { type: 'string', minLength: 1, maxLength: 120 } },
        required: ['id', 'title'],
        additionalProperties: false,
      },
      prepare: ({ id, title }) => program(
        sqlStatement("SELECT chronolog_assert(NOT EXISTS(SELECT 1 FROM tasks WHERE id = ?), 'task_exists')", [id]),
        sqlStatement(`INSERT INTO tasks (id, title, state, version, chronolog_owner)
          VALUES (?, ?, 'open', 1, ${OWNER_FOR_KEY_SQL})`, [id, title, APPLICATION_COLLECTIVE_ID]),
        emit('task.created', { id, title }),
      ),
    }),
    completeTask: defineCommand({
      description: 'Complete a shared task only while it is open at the expected version',
      input: {
        type: 'object',
        properties: { id: taskId, expectedVersion: { type: 'integer', minimum: 1 } },
        required: ['id', 'expectedVersion'],
        additionalProperties: false,
      },
      prepare: ({ id, expectedVersion }) => program(
        sqlStatement(`SELECT chronolog_assert(EXISTS(
          SELECT 1 FROM tasks WHERE id = ? AND version = ? AND state = 'open'
        ), 'task_not_open_at_version')`, [id, expectedVersion]),
        sqlStatement("UPDATE tasks SET state = 'done', version = version + 1 WHERE id = ?", [id]),
        emit('task.completed', { id, expectedVersion }),
      ),
    }),
  },
  queries: {
    tasks: defineQuery({
      description: 'List the coherent shared task board',
      input: { type: 'null' },
      read: view => view.query('SELECT id, title, state, version FROM tasks ORDER BY id'),
    }),
    taskEvents: defineQuery({
      description: 'Read task events and the generation-bound event cursor',
      input: { type: 'null' },
      read: view => view.readEvents({ topics: ['task.created', 'task.completed'] }),
    }),
  },
});
