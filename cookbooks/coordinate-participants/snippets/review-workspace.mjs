// Domain policy only. Core owns its guarded schema, command vocabulary and clients.
import { createCollaborationDefinition, createCollaborationClient } from '@tendriller/core/collaboration';

export function reviewWorkspace({ administrators }) {
  return createCollaborationDefinition({ id: 'independent-review-workspace', version: '1', administrators,
    limits: { maxSlots: 8, maxActiveClaims: 4, maxResultBytes: 65536 } });
}

export function reviewClient({ session, endpoint, runId }) {
  return createCollaborationClient({ session, endpoint, runId });
}
