// Domain declarations only; initializeTaskBoard is a separate ordinary authored transaction.
import { GROUP_COLLECTIVE_ID, defineApplication, defineCommand, defineQuery,
  emit, program, sqlStatement } from '@chronolog/peer-session';
import { conversation } from './peer-conversation.mjs';

const input = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const id = { type: 'string', minLength: 1, maxLength: 128 };
const taskInput = input({ taskId: id });

export const initializeTaskBoard = program(sqlStatement("CREATE TABLE tasks(id TEXT PRIMARY KEY, title TEXT NOT NULL, claimed_by TEXT, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')))"));
export const taskBoard = defineApplication({
  id: 'shared-peer-task-board', version: '1',
  commands: {
    ...conversation.commands,
    addTask: defineCommand({ description: 'Create one task owned by the verified shared application collective.',
      input: input({ taskId: id, title: { type: 'string', minLength: 1, maxLength: 512 } }),
      prepare: ({ taskId, title }) => program(sqlStatement(
        'INSERT INTO tasks(id,title,chronolog_owner) VALUES(?,?,(SELECT id FROM chronolog_principals WHERE key=?))',
        [taskId, title, GROUP_COLLECTIVE_ID]), emit('tasks', { type: 'task.created', version: 1, taskId })),
    }),
    claimTask: defineCommand({ description: 'Claim an open unclaimed task, rechecking the condition at execution.', input: taskInput,
      prepare: ({ taskId }) => program(
        sqlStatement("SELECT chronolog_assert((SELECT claimed_by IS NULL AND status='open' FROM tasks WHERE id=?),'task_unavailable')", [taskId]),
        sqlStatement('UPDATE tasks SET claimed_by=lower(hex(chronolog_actor())) WHERE id=?', [taskId]),
        emit('tasks', { type: 'task.claimed', version: 1, taskId })),
    }),
    finishTask: defineCommand({ description: 'Complete a task still claimed by this authenticated author.', input: taskInput,
      prepare: ({ taskId }) => program(
        sqlStatement("SELECT chronolog_assert((SELECT claimed_by=lower(hex(chronolog_actor())) AND status='open' FROM tasks WHERE id=?),'claim_required')", [taskId]),
        sqlStatement("UPDATE tasks SET status='done' WHERE id=?", [taskId]),
        emit('tasks', { type: 'task.completed', version: 1, taskId })),
    }),
  },
  queries: {
    board: defineQuery({ description: 'Read tasks and conversation from one coherent operation-set revision.', input: input({}),
      read(view) {
        const tasks = view.query('SELECT id,title,claimed_by,status FROM tasks ORDER BY id LIMIT 200').rows
          .map(([id, title, claimedBy, status]) => ({ id, title, claimedBy, status }));
        return { tasks, ...conversation.queries.conversation.read(view, {}) };
      },
    }),
  },
});
