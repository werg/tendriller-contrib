# Optional generation applications with explicit recovery

Tendriller's default peer integration is the timestamp-ordered live profile in
[the resident application recipe](../cookbooks/run-a-peer-application/COOKBOOK.md).
This optional guide uses the separate `peer-generation-v1` runtime for applications
that choose explicit selected-history recovery without finality. It exposes
`operation.applied()` and revisable results at observed revisions. It has no
`local()`/`final()` operation pair, closed author-time frontier or final-intent
worker. General branch merging is not implemented.

The standalone session, framed transport, RTC composition and hosted generation
controls are implemented. Their source-pinned tests and development reports have
different scopes. A successful native loopback RTC run does not establish browser
storage behavior, deployed login, Internet reachability or a recovery-loss bound.
The [qualification note](../cookbooks/run-a-peer-application/notes/peer-generation-qualification.md)
keeps those boundaries explicit.

Use this approach for shared applications that can lose a recent unreplicated
tail when peers disappear. A replaceable coordinator issues inclusion receipts; other peers retain signed
history and independently replay the selected proposal set by signed author
timestamp, signing key and stable proposal identity. Receipt sequence selects
ancestry, not execution order. A later receipt can introduce earlier authored
work and revise an accepted or rejected result within one generation.
The creator and an optional native agent have no permanent special role.

The authenticated `peer-generation-v1` profile distinguishes **applied**,
**shared** and **abandoned** work. Current-generation commands, reads, signals and
replication run over established peer connections without a host append,
certificate or backup acknowledgement. Cloudflare supplies publication,
discovery, enrollment and occasional authenticated generation selection.

The [primitive and role guide](application-primitives.md) explains
the guarantees. Chronolog's [authority ADR](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/docs/peer-generation-v1.md)
owns the wire rules; this cookbook does not implement a second authority policy.
The [qualification note](../cookbooks/run-a-peer-application/notes/peer-generation-qualification.md) separates the
independent packed session exercise from real browser/RTC and deployed evidence.
The [live resident recipe](../cookbooks/run-a-peer-application/COOKBOOK.md) remains
the default integration and has its own immutable-final-prefix contract. Its
reports retain their original scope and do not qualify generation recovery.

## Choose one of three entry paths

| Application | Start here | What must be configured |
| --- | --- | --- |
| Disposable typing, cursors, progress or previews | [Standalone live signals](../cookbooks/share-live-signals/COOKBOOK.md) | An authenticated scope, topic policy and live transport; no history, database or finality. |
| Conversation and recorded observations | [Events-only conversation definition](../cookbooks/run-a-peer-application/snippets/peer-conversation.mjs) with the public session | Explicit device creation/enrollment, signed application descriptor, current controls and authorized keys. No SQL/WASM. |
| Board, reservations or guarded domain changes | The same session with the pinned SQL/event execution runtime | Schema and ownership setup, deterministic assertions and updates, compatible native/WASM engine artifacts. |

An agent can use any path. Its presence does not require a durable transaction
for every preview or a fixed native authority for ordinary collaboration.
Choose one application backend and one authenticated profile. Unavailable peers
never trigger an automatic switch to hosted JSON state or a stronger profile.

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
   accepted means that the program succeeded at the observed revision. Later
   replay can change that outcome, with or without a generation transition.
5. **Lose a reply.** Look up or retry the original operation. Do not allocate a
   replacement ID merely because a waiter timed out.
6. **Lose the coordinator.** An eligible survivor may select a successor from its
   complete older prefix through the control service. Recent unretained work may
   disappear from the selected view. The session publishes one recovery notice.
7. **Return with old work.** The old peer follows the selected ancestry and keeps
   its excluded suffix for inspection. Nothing from that suffix silently merges.
8. **Review and reapply.** Read the new view, inspect the abandoned intent, and
   deliberately create a linked new attempt with current input and guards.

Measure recovery freshness under a declared workload with another suitable peer
available. No universal loss bound is established. A long partition or a lone
copy can expose more work. If no usable prefix survives, report unavailable;
never replace the application with an empty history without an explicit action.

## Keep application code about the domain

The [conversation module](../cookbooks/run-a-peer-application/snippets/peer-conversation.mjs) defines the input schema,
command preparation and coherent query in one application definition. Its
`postMessage` command emits one ordinary conversation event. The query keeps the
verified author and operation identity separate from payload fields.

The definition is shared developer tooling and schema, not an authorization
boundary. Its digest covers the declared description and schema; it does not hash
the JavaScript `prepare` or `read` callbacks. Change the semantic version when
those callbacks change. A permitted writer can author an allowed raw program;
command names or versions never grant access to a private tool. Enroll explicit
reader, writer, coordinator, recovery, administrator and SQL `dataRole` rights.
For hosted setup each member supplies `{ grant, accountId? }`, without implicit
privileged roles.

Device enrollment and verified deployment inputs are explicit setup. With those
inputs, a native application uses the public package:

```js
import { openNativeDevice, openNativeApplication } from '@chronolog/peer-session/native';
import { conversation } from './peer-conversation.mjs';

// Use { create: true } only for explicit first-time device creation.
const device = await openNativeDevice({ path: './device.sqlite' });
const session = await openNativeApplication({
  device,
  definition: conversation,
  authority,  // The published signed descriptor, controls and selected generations.
  epochKeys,  // Keys delivered to this enrolled device.
});

try {
  const view = await session.query('conversation', {});
  const operation = await session.command('postMessage', {
    messageId, text,
  }, { operationId, observedRevision: view.revision });

  const applied = await operation.applied({ signal: waitLifetime.signal });
  if (applied.outcome === 'accepted') showApplied(applied);
  else showRejection(applied.rejectionCode);
} finally {
  await session.close();
}
```

The application keeps draft text and any operation reference needed by its UI.
Chronolog owns the attempt journal, exact retry, ordering, peer replication and
view recovery. A timeout cancels the wait; it does not cancel the command or
establish a rejection. `session.operations.get(operationId)` recovers its current
state, and `session.retry(operationId)` resends only the original saved attempt.
`session.operations.subscribe({ operationId, signal })` continues reporting
coalesced observations after the operation first applies. Use the captured
`applied.revision` to explain which view produced its result. An
`observedRevision` binds the reviewed ancestry; it is not a compare-and-swap
guard. Put business preconditions in the deterministic program.

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
from another captured revision requires an explicit rebuild/reread.

If the host is unavailable while the current coordinator remains reachable,
ordinary work continues. If both disappear, keep the saved attempt and show a
waiting state. A client must not mint a competing current generation locally.
The session reports `recovering` while selected bodies are missing, `waiting`
when a materialized follower lacks a coordinator connection, and `ready` when
the selected view and a coordinator route are usable.

## Inspect and deliberately reapply

Use the retained operation and signed attempt when explaining what was excluded:

```js
const original = await session.operations.inspect(operationId);
if (original?.state.status === 'abandoned' || original?.state.status === 'needsReapply') {
  const current = await session.query('conversation', {});
  // The user or agent reviews the original intent against this current view.
  const replacement = await session.reapply(operationId, 'postMessage', {
    messageId: newMessageId, text: reviewedText,
  }, { operationId: newOperationId, observedRevision: current.revision });
  showApplied(await replacement.applied());
}
```

Reapplication creates a new signed attempt linked to the original. It does not
retimestamp an old envelope, update an old guard or impersonate another author.
An authorized peer can inspect another author's retained work through the
explicit author option; reapplication still records the real current signer.

An adopted operation retains its signed identity, while its outcome can change
when the selected proposal set replays. An abandoned operation is distinct from
an executed rejected result. Show both cases accurately.
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
conformance. The SQL path needs its own exact engine/profile/artifact evidence.
The earlier [board/chat specimen](../cookbooks/run-a-peer-application/checks/README.md) remains a regression for the
default live implementation; relabeling its outcomes would not qualify SQL under
`peer-generation-v1`.

## Keep live signals and external work separate

Typing uses `session.signals`, expires independently of history, and has no retry
outbox. A lost live message does not become a queued application command. Large
content lives outside command envelopes and needs authorized peer/provider reads;
a content reference does not guarantee every peer still retains the bytes.

External effects require an application-specific authorization and reconciliation
policy, stable intent identity and a dispatch journal independent of a revisable
projection. Recovery must not repeat completed work merely because its intent
left the selected history. Provider idempotency prevents some duplicates; it
cannot preserve an abandoned business precondition. A protected ancestry floor
keeps selected evidence, but does not make its execution outcome immutable when
earlier authored work is later included. This profile supplies no final-intent
worker. Use the live profile when the application requires an immutable accepted
intent before dispatch. Reversible computations and replaceable caches can follow
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
[qualification note](../cookbooks/run-a-peer-application/notes/peer-generation-qualification.md). Preserve raw reports,
source trees, dirty flags and archive digests; do not promote a build or synthetic
validator test to runtime evidence.
