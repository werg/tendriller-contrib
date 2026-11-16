// This exact public bundle is supplied to build-pages.mjs; it is not a sibling import.
import { program, emit, sqlStatement } from './public-application.mjs';

export function claimTask(backend, taskId, operationId) {
  return backend.submit(program(
    sqlStatement("SELECT chronolog_assert((SELECT claimed_by IS NULL AND status = 'open' FROM tasks WHERE id = ?), 'task_unavailable')", [taskId]),
    sqlStatement('UPDATE tasks SET claimed_by = lower(hex(chronolog_actor())) WHERE id = ?', [taskId]),
    emit('tasks', { type: 'task.claimed', version: 1, taskId }),
  ), { operationId });
}

export function requestSummary(backend, taskId, jobId, operationId) {
  return backend.submit(program(
    sqlStatement("SELECT chronolog_assert((SELECT claimed_by = lower(hex(chronolog_actor())) FROM tasks WHERE id = ?), 'claim_required')", [taskId]),
    emit('job-requests', { type: 'job.requested', version: 1, taskId, jobId, kind: 'summarize-task' }),
  ), { operationId });
}

export function postMessage(backend, messageId, text, operationId, inReplyTo) {
  return backend.events.publish('conversation', {
    type: 'message.posted', version: 1, messageId, text,
    ...(inReplyTo === undefined ? {} : { inReplyTo }),
  }, { operationId });
}
