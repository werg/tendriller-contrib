---
id: "run-a-peer-application"
title: "Build a peer application with explicit recovery"
summary: "Use replaceable coordinating peers, coherent views and exact attempts for shared conversation and guarded work, with explicit recovery and deliberate reapplication."
group: "Keep work dependable"
tags: ["peers", "events", "sql", "agent", "recovery"]
choices: ["Signals, events or SQL/events", "Applied outcomes or protected actions", "Recover a selected prefix and review abandoned intent"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "reconcile-concurrent-edits", "recover-outdated-work", "resume-across-sessions", "observe-long-running-process", "manage-sensitive-data", "publish-coherent-updates"]
sources: ["https://github.com/werg/chronolog-db/blob/b6e3f2774bb82d52755359df3a415133f3018f07/packages/peer-session/README.md"]
---

# Build a peer application with explicit recovery

This recipe uses one `@chronolog/peer-session` composition for browser and native
peers. The session owns encrypted history, exact operation retry, replication,
discovery and recovery policy. The [qualification note](notes/peer-generation-qualification.md)
records the exact native, SQL, hosted and browser checkpoints and the independent
agent business workflow. Local runtime results do not establish deployed-network
readiness. Earlier implementations retain their original
[historical evidence](notes/finalized-resident-recipe.md).

`operation.applied()` returns execution in the selected generation.
`operation.shared()` separately observes retained coverage on another peer.
Either observation can later become abandoned during permitted recovery.
The session exposes no `final()` wait or automatic irreversible-effect dispatch.

Use this approach for shared applications that can lose a recent unreplicated
tail when peers disappear. A temporary coordinating peer orders commands; other
peers retain signed history and independently execute the selected sequence.
The creator and an optional native agent have no permanent special role.

The authenticated application history distinguishes **applied**,
**shared** and **abandoned** work. Current-generation commands, reads, signals and
replication run over established peer connections without a host append,
certificate or backup acknowledgement. Cloudflare supplies publication,
discovery, enrollment and occasional authenticated generation selection.

The [primitive and role guide](../../guides/application-primitives.md) explains
the guarantees. Chronolog's [authority ADR](https://github.com/werg/chronolog-db/blob/b6e3f2774bb82d52755359df3a415133f3018f07/docs/peer-generation-v1.md)
owns the wire rules; this cookbook does not implement a second authority policy.
The [qualification note](notes/peer-generation-qualification.md) separates the
independent packed session exercise from real browser/RTC and deployed evidence.
The [historical resident archive](notes/finalized-resident-recipe.md) preserves the
older immutable-prefix evidence and the original scope of its reports.

## Choose one of three entry paths

| Application | Start here | What must be configured |
| --- | --- | --- |
| Disposable typing, cursors, progress or previews | [Standalone live signals](../share-live-signals/COOKBOOK.md) | An authenticated scope, topic policy and live transport; no history, database or finality. |
| Conversation and recorded observations | [Events-only conversation definition](snippets/peer-conversation.mjs) with the public session | Explicit device creation/enrollment, signed application descriptor, current controls and authorized keys. No SQL/WASM. |
| Board, reservations or guarded domain changes | [Shared task-board definition](snippets/peer-task-board.mjs) with the pinned SQL/event runtime | Signed schema and collective ownership, deterministic assertions, compatible native/WASM engine artifacts. |

An agent can use any path. Its presence does not require a durable transaction
for every preview or a fixed native authority for ordinary collaboration.
Use the same application session and backend for every participant. Unavailable peers
never select a second command API or journal. Stronger guarantees are explicit
capabilities on the same session contract.

The [owned Worker page recipe](notes/peer-session-pages.md) provides two layouts
using domain commands, coherent queries and explicit recovery notices. Its build
requires a public session package and complete real deployment assets.

## Follow conversation through a lost peer

1. **Create or resume a device explicitly.** Enrollment establishes its grants and
   supplies authorized keys. Opening a missing or busy store must not silently
   create a replacement identity. Browser tabs can share the stable protocol
   identity without opening application storage. The first data request acquires
   its exclusive storage lock; another durable owner receives an explicit busy error.
2. **Join the selected generation.** The session verifies cached authority and
   authenticates peers. A route advertisement is a discovery hint, not a grant.
   Control, publication and live signals can operate while `status.database` is
   `idle`.
3. **Read coherently.** The first conversation query loads the durable component
   and returns its messages with one coherent revision. Concurrent first queries
   share initialization. Keep that revision with any intent based on the displayed state.
4. **Post.** Submit one schema-validated domain command with a stable operation
   ID. The session persists the exact signed attempt before sending it. Applied
   accepted means that the selected sequence executed it; it does not promise
   survival across explicit recovery.
5. **Lose a reply.** Look up or retry the original operation. Do not allocate a
   replacement ID merely because a waiter timed out.
6. **Lose the coordinator.** The owned participation controller waits reconnect
   grace and selects an eligible successor using verified complete history. An
   older or unknown-freshness recovery requires approval of its displayed
   proposal. Recent unretained work may disappear from the selected view. The
   session publishes one recovery notice.
7. **Return with old work.** The old peer follows the selected ancestry and keeps
   its excluded suffix for inspection. Nothing from that suffix silently merges.
8. **Review and reapply.** Read the new view, inspect the abandoned intent, and
   deliberately create a linked new attempt with current input and guards.

Five minutes is the initial measured freshness objective with a second suitable
peer available. It is not a universal loss bound. A long partition or a lone
copy can expose more work. If no usable prefix survives, report unavailable;
never replace the application with an empty history without an explicit action.

## Keep application code about the domain

The [conversation module](snippets/peer-conversation.mjs) defines the input schema,
command preparation and coherent query in one application definition. Its
`postMessage` command emits one ordinary conversation event. The query keeps the
verified author and operation identity separate from payload fields.

Device enrollment and verified deployment inputs are explicit setup. With those
inputs, a native application uses the public package:

```js
import { openNativeDevice, openNativeApplication } from '@chronolog/peer-session/native';
import { openWebRtcConnection } from '@chronolog/peer-session/webrtc';
import { openWebSocketConnection } from '@chronolog/peer-session/websocket';
import { createNativePeerConnection } from '@chronolog/peer-session/webrtc-native';
import { createPeerIntroductions } from '@tendriller/core/peers';
import { conversation } from './peer-conversation.mjs';

// Use { create: true } only for explicit first-time device creation.
const device = await openNativeDevice({ path: './device.sqlite' });
const session = await openNativeApplication({
  device,
  definition: conversation,
  authority,  // The published signed descriptor, controls and selected generations.
  epochKeys,  // Keys delivered to this enrolled device.
});
const control = session.connectControlParticipant({ exchange: peers.exchange });
session.participate({
  control,
  ...createPeerIntroductions({
    peers, // The deployment's authenticated public Tendriller peer client.
    identity: session.deviceId,
    openDirectConnection: options => openWebRtcConnection({ ...options, createPeerConnection: createNativePeerConnection }),
    openRelayConnection: ({ relay, signal }) => openWebSocketConnection(relay, { ready: relay.ready, signal }),
  }),
});

try {
  const view = await session.query('conversation', {});
  const operation = await session.command('postMessage', {
    messageId, text,
  }, { operationId, basedOn: view.revision });

  const applied = await operation.applied({ signal: waitLifetime.signal });
  if (applied.outcome === 'accepted') showApplied(applied);
  else showRejection(applied.rejectionCode);
} finally {
  await session.close();
}
```

The application keeps draft text and any operation reference needed by its UI.
Chronolog owns the attempt journal, exact retry, ordering, peer replication,
discovery scheduling, coordinator selection and view recovery. The Tendriller
adapter tries the direct connection, then the host's WebSocket relay within the same owned opening. Both carry the same authenticated encrypted peer channel. It does not create another application or retry owner. A timeout cancels the wait; it does not cancel the command or
establish a rejection. `session.operations.get(operationId)` recovers its current
state, and `session.retry(operationId)` resends only the original saved attempt.

The public package is supplied as a source-pinned archive during prerelease
qualification. The independent consumer below installs it offline in an empty
directory. It does not import a private Worker fixture or a sibling checkout.
A native package exercise does not establish browser or deployed readiness.

## Handle a recovery in one place

Refresh the complete displayed view on a recovery notification and keep local
interaction state separate:

```js
const stop = session.onRecovery(notice => {
  showRecovery({ adopted: notice.adopted, abandoned: notice.abandoned,
    unknownLoss: notice.unknownLoss });
});

try {
  for await (const change of session.changes({ signal: lifetime.signal })) {
    const view = await session.query('conversation', {});
    render(view.value, view.revision, change.kind);
  }
} finally { stop(); }
```

The change stream coalesces UI invalidations. It is not a durable consumer cursor
and must not acknowledge external work. Query results bind events, SQL where
selected, and operation outcomes to one captured history. A stale event cursor
from an excluded generation requires an explicit reset/reread.

If the host is unavailable while the current coordinator remains reachable,
ordinary work continues. If both disappear, keep the saved attempt and show a
waiting state. A client must not mint a competing current generation locally.
Observe `session.participation.onStatus` for connection/recovery progress. When
it presents `approval-required`, display the exact proposal and its unknown or
observed age, then call `approveRecovery(proposal.id)` only after explicit review.
The [shared page layouts](notes/peer-session-pages.md) implement that presentation
without adding a second recovery policy.

## Reuse a derived view

Use `session.project` for a reusable local reduction over the same verified
events. The [conversation module](snippets/peer-conversation.mjs) exports a pure
`conversationCounts` definition alongside its commands and query:

```js
import { conversationCounts } from './peer-conversation.mjs';

const counts = session.project(conversationCounts);
try {
  renderCounts(await counts.read());
  for await (const snapshot of counts.changes({ signal: lifetime.signal })) {
    renderCounts(snapshot); // { state, revision, reset }
  }
} finally { await counts.close(); }
```

The session persists the reducer state with its verified cursor and revision.
Unchanged reads and durable reopen reuse that checkpoint. A selected recovery
that excludes its cursor rebuilds from the selected history and reports
`reset.reason: 'recovery'` with the previous revision. Changing the definition's
version reports `reset.reason: 'definition'` and rebuilds the derived state.
Use a stable ID and increment the version when reducer semantics change.

Keep reducers pure: recovery can replay them. A projection is a local derived
view, not a second command journal or an acknowledgement that external work
completed. Render its explicit reset with the new coherent state, and retain
user drafts separately. The same session lifetime owns projection handles and
their bounded pending work.

## Inspect and deliberately reapply

Use the retained operation and signed attempt when explaining what was excluded:

```js
const original = await session.operations.inspect(operationId);
if (original?.state.status === 'abandoned' || original?.state.status === 'needsReapply') {
  const current = await session.query('conversation', {});
  // The user or agent reviews the original intent against this current view.
  const replacement = await session.reapply(operationId, 'postMessage', {
    messageId: newMessageId, text: reviewedText,
  }, { operationId: newOperationId, basedOn: current.revision });
  showApplied(await replacement.applied());
}
```

Reapplication creates a new signed attempt linked to the original. It does not
retimestamp an old envelope, update an old guard or impersonate another author.
An authorized peer can inspect another author's retained work through the
explicit author option; reapplication still records the real current signer.

An adopted operation retains its original identity and outcome. An abandoned
operation is not a normal rejected transaction. Show both cases accurately.
Cancelling a waiter never authorizes erasing the underlying journal entry.

## Add SQL for guarded work

A board claim is one deterministic program: assert the task remains available,
update its owner/status, and emit `task.claimed`. All three steps either apply
together or reject together. Keep the guard in the program even when the user
just read the task; another command may execute before the claim.

Use the same application definition and session with the pinned SQL/event
materializer. Schema, ownership and permission changes belong to protected
administrative setup/transitions, not ordinary lossy edits. A recovery must never
restore broader access through an old SQL snapshot.

The events-only package check does not prove SQL replay or native/WASM
conformance. The SQL path needs its own exact engine/manifest/artifact evidence.
The [independent guarded-task gate](checks/README.md#sql-and-guarded-domain-commands)
uses that public session and a packed native engine. Native SQL evidence does
not qualify browser/WASM execution; each exact engine artifact needs its own
conformance result.

## Keep live signals and external work separate

Typing uses `session.signals`, expires independently of history, and has no retry
outbox. A lost live message does not become a queued application command. Large
content lives outside command envelopes and needs authorized peer/provider reads;
a content reference does not guarantee every peer still retains the bytes.

Irreversible work needs an explicitly configured durable external-action service
or protected checkpoint covering its complete prerequisite program. An ordinary
applied event cannot supply that guarantee. Retain authorization, stable effect
identity, provider idempotency and reconciliation of uncertain outcomes;
generation changes must not repeat completed work. Provider idempotency prevents
some duplicates but cannot preserve a precondition that recovery abandons.
Reversible computations and replaceable caches can follow an explicit rerun
policy without adding a stronger boundary to ordinary collaboration.

## Exercise the public composition

Run the independent public consumer against one emitted session archive:

```sh
npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --output /new/peer-generation-evidence
```

The runner creates a fresh offline installation with lifecycle scripts disabled.
It uses separate durable native stores, the public definition above, real signed
attempts and the event materializer. It records a lost reply, host-control outage,
older-prefix takeover, fresh peer, returning old branch, third-generation
exclusion, deliberate reapplication and identity-preserving reopen.

The report's `independent-packed-peers` topology uses the maintained in-process
peer link. Host counters describe the portable control port. It does not claim
physical RTC routing, browser storage ownership, Tendriller HTTP endpoints,
production authentication or provider cost. Those remain separate gates in the
[qualification note](notes/peer-generation-qualification.md). Preserve raw reports,
source trees, dirty flags and archive digests; do not promote a build or synthetic
validator test to runtime evidence.
