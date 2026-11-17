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
sources: ["https://github.com/werg/chronolog-db/blob/fe752b7f6fd7095b6f45c61a176e34b6f37d0674/packages/peer-session/README.md"]
---

# Build a peer application with explicit recovery

**Current implementation:** The public `@chronolog/peer-session` package owns
bootstrap, saved attempts, generation recovery, peer connections and browser
Worker storage. Independent clean reports cover native RTC, actual Tendriller
control routes, browser/Worker/OPFS events, and native guarded SQL at their
[recorded revisions](notes/peer-generation-qualification.md). Each result has its
own artifact pairing and scope. Internet, TURN, deployed cost and a recovery-age
bound remain unqualified.

The implemented waits are `applied()` and `shared()`. Applied means executed in
the selected generation; shared reports independently retained complete coverage.
Neither prevents explicit recovery from abandoning a recent suffix. This recipe
adds no `local()` or `final()` alias. The older immutable-prefix implementation
retains its [historical evidence](notes/finalized-resident-recipe.md).

Use this approach for shared applications that can lose a recent unreplicated
tail when peers disappear. A temporary coordinating peer orders commands; other
peers retain signed history and independently execute the selected sequence.
The creator and an optional native agent have no permanent special role.

The authenticated `peer-generation-v1` profile distinguishes **applied**,
**shared** and **abandoned** work. Current-generation commands, reads, signals and
replication run over established peer connections without a host append,
certificate or backup acknowledgement. Cloudflare supplies publication,
discovery, enrollment and occasional authenticated generation selection.

The [primitive and role guide](../../guides/application-primitives.md) explains
the guarantees. Chronolog's [authority ADR](https://github.com/werg/chronolog-db/blob/fe752b7f6fd7095b6f45c61a176e34b6f37d0674/docs/peer-generation-v1.md)
owns the wire rules; this cookbook does not implement a second authority policy.
The [qualification note](notes/peer-generation-qualification.md) separates the
independent packed session exercise from real browser/RTC and deployed evidence.
The [retained resident recipe](notes/finalized-resident-recipe.md) preserves the
older immutable-prefix implementation and the original scope of its reports.

## Choose one of three entry paths

| Application | Start here | What must be configured |
| --- | --- | --- |
| Disposable typing, cursors, progress or previews | [Standalone live signals](../share-live-signals/COOKBOOK.md) | An authenticated scope, topic policy and live transport; no history, database or finality. |
| Conversation and recorded observations | [Events-only conversation definition](snippets/peer-conversation.mjs) with the public session | Explicit device creation/enrollment, application ID and public host port. The session owns signed bootstrap and key delivery. No SQL/WASM. |
| Board, reservations or guarded domain changes | [Shared task-board definition](snippets/peer-task-board.mjs) with the pinned SQL/event runtime | The SQL session publishes the signed schema; domain commands choose shared ownership and deterministic guards. Supply compatible native/WASM artifacts. |

An agent can use any path. Its presence does not require a durable transaction
for every preview or a fixed native authority for ordinary collaboration.
Choose one application backend and one authenticated profile. Unavailable peers
never trigger an automatic switch to hosted JSON state or a stronger profile.

The [owned Worker page recipe](notes/peer-session-pages.md) provides two layouts
using domain commands, coherent queries and explicit recovery notices. Its build
requires a public session package and complete real deployment assets.

## Follow conversation through a lost peer

1. **Create or resume a device explicitly.** Enrollment establishes its grants and
   supplies authorized keys. Opening a missing or busy store must not silently
   create a replacement identity. A second tab or process either reuses a
   qualified storage owner or shows an explicit busy/handoff state.
2. **Join the selected generation.** The session verifies cached authority and
   authenticates peers. A route advertisement is a discovery hint, not a grant.
   Wait for a complete usable view before treating the application as ready.
3. **Read coherently.** The conversation query returns its messages and one
   revision. Keep that revision with any intent based on the displayed state.
4. **Post.** Submit one schema-validated domain command with a stable operation
   ID. The session persists the exact signed attempt before sending it. Applied
   accepted means that the selected sequence executed it; it does not promise
   survival across explicit recovery.
5. **Lose a reply.** Look up or retry the original operation. Do not allocate a
   replacement ID merely because a waiter timed out.
6. **Lose the coordinator.** An eligible survivor may select a successor from its
   complete older prefix through the control service. Recent unretained work may
   disappear from the selected view. The session publishes one recovery notice.
7. **Return with old work.** The old peer follows the selected ancestry and keeps
   its excluded suffix for inspection. Nothing from that suffix silently merges.
8. **Review and reapply.** Read the new view, inspect the abandoned intent, and
   deliberately create a linked new attempt with current input and guards.

Five minutes is an initial qualification objective with a second suitable peer
available. These short scenarios have not measured it; it is not a loss bound. A long partition or a lone
copy can expose more work. If no usable prefix survives, report unavailable;
never replace the application with an empty history without an explicit action.

## Keep application code about the domain

The [conversation module](snippets/peer-conversation.mjs) defines the input schema,
command preparation and coherent query in one application definition. Its
`postMessage` command emits one ordinary conversation event. The query keeps the
verified author and operation identity separate from payload fields.

Use the public host client with the owned session. This example performs explicit
first device and application creation; normal reopening omits both `create`
options. Joining an existing application also omits application `create` and
requires an administrator to grant the device's public key.

```js
import { createClient } from '@tendriller/core';
import { openApplicationSession } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { maintainNativeApplicationWebRtc } from '@chronolog/peer-session/webrtc-native';
import { conversation } from './peer-conversation.mjs';

const host = createClient({ api, token }).peers;
const device = await openNativeDevice({ path: './device.sqlite', create: true });
const session = await openApplicationSession({
  device, definition: conversation, applicationId, host, create: {},
});
const network = maintainNativeApplicationWebRtc(session, { host });
try {
  await network.ready;
  const view = await session.query('conversation', {});
  const operation = await session.command('postMessage', {
    messageId, text,
  }, { operationId, basedOn: view.revision });
  const applied = await operation.applied({ signal: waitLifetime.signal });
  if (applied.outcome === 'accepted') showApplied(applied);
  else showRejection(applied.rejectionCode);
} finally {
  await network.close();
  await session.close();
}
```

`openApplicationSession` saves the bootstrap configuration, initial key and
selection identity durably before sending them. A lost hosted reply reuses those
records after reopening. A newly granted reader receives wrapped keys through
authenticated peer connections; the host receives public metadata and key
commitments. Cached reopening can omit `host` when the device already has a
verified binding. The network owner handles discovery, coarse availability
renewals, invitations, reconnect and eligible takeover. Ordinary commands use
established peer channels.

The application keeps draft text and any operation reference needed by its UI.
Chronolog owns the attempt journal, exact retry, ordering, peer replication and
view recovery. A timeout cancels the wait; it does not cancel the command or
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

Use `openNativeSqlSession` from `@chronolog/peer-session/sql-native` with the
same device, definition, application ID and host, plus `databasePath`. In the
owning browser Worker, use `openBrowserSqlSession` from `/sql-browser` and the
URL of the packaged `browser-engine/` assets. First creation signs and publishes
`definition.schema`; join/reopen uses its published or cached authenticated
binding. Domain code does not build schema signatures or generation requests.

The [task-board definition](snippets/peer-task-board.mjs) uses
`OWNER_FOR_KEY_SQL` with `APPLICATION_COLLECTIVE_ID` for shared rows. An explicit
shared owner lets another currently authorized member finish work after its
creator leaves. Private author-owned rows remain private. Schema, ownership and
permission changes belong to protected
administrative setup/transitions, not ordinary lossy edits. A recovery must never
restore broader access through an old SQL snapshot.

The [native guarded-task report](notes/peer-task-qualification.md) records the
SQL path separately. Browser SQL needs its own actual Worker/OPFS run and matching
engine identity; an events-only result cannot supply that evidence.

## Give an agent the same application

The [native agent entry](snippets/run-peer-agent.mjs) opens the same owned session
and maintained peer network, then serves the public local MCP adapter. Tool
schemas come from the application definition. Commands, queries, operation
inspection, exact retry, waiting and explicit reapplication use that session's
identity and journal. The agent does not need a second inbox, hosted command
proxy or privileged coordinator role. Closing its input closes its network and
store; resuming opens the original device.

## Keep live signals and external work separate

Typing uses `session.signals`, expires independently of history, and has no retry
outbox. A lost live message does not become a queued application command. Large
content lives outside command envelopes and needs authorized peer/provider reads;
a content reference does not guarantee every peer still retains the bytes.

Ordinary effects need authorization, stable intent identity, a reset-aware
dispatch journal and reconciliation of uncertain outcomes. Recovery must not
repeat completed work merely because its intent left the selected history.
Provider idempotency prevents some duplicates but cannot preserve a precondition
that recovery abandons. Protect the complete prerequisite program only when the
application requires it to survive recovery; this does not require a second
default architecture. Reversible computations and replaceable caches can follow
an explicit rerun policy.

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
