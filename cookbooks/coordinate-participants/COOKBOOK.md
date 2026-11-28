---
id: coordinate-participants
title: Coordinate people, views and independent agents
summary: "Use one session owner per signing profile, explicitly addressed interactions and guarded contribution slots to coordinate several people, devices, views and agent runs."
group: Coordinate people and tools
tags: ["collaboration", "agents", "claims", "finality", "participants"]
choices: ["Shared local owner or independently enrolled signer", "One executor or frozen contribution slots", "Durable outcome or disposable progress"]
capabilities: ["Chronolog application session", "Tendriller collaboration module"]
related: ["run-a-peer-application", "share-live-signals", "connect-chatgpt", "coordinate-devices", "observe-long-running-process"]
evidence: explained
---

# Coordinate people, views and independent agents

A reviewer opens a board on a laptop and an inspection view on a phone. Two
specialist agents review the same evidence independently. A second laptop tab
opens the discussion without taking over its draft or signing store. The person
can see who was asked, who is working, what each specialist contributed, and which
results informed the final decision. Closing the discussion does not cancel work.

The optional `@tendriller/core/collaboration` module provides the application
definition, guarded commands and client helpers. Chronolog owns every signed
proposal, coherent projection, replica and optional finality proof. This cookbook adds the
review policy and editable example UI; it adds no session owner or retry queue.
Use the exact compatible public archives identified by the qualification report.
A current source checkout does not establish what a deployed host supports.

The [independent qualification runners](checks/README.md) require a fresh public
operation-set session, standalone authority, matching SDK and rebuilt SQL engine.
Their authored-operation report formats reject historical reports. **This source
port is not yet a qualified new-protocol native/browser composition.** Retain new
raw reports, exact archive hashes and separate deployed-device/provider evidence.

## Choose identities deliberately

| Choice | Use it when | Consequence |
| --- | --- | --- |
| Attach another page or tool to the existing local owner | The clients intentionally use the same signing authority | Each attachment has a distinct endpoint/incarnation and independent waits; the signer and operation journal are shared |
| Enroll an independent agent profile | An agent needs separate authority, revocation or retention | The agent keeps its own signing identity, store, grants and process |
| Add a companion device | A person wants to continue from another device | Share application state through its own enrolled signer; choose draft copying and task handoff explicitly |

An endpoint is a routing and attribution boundary. Same-origin code using the
same signer is still in one trust boundary. A logical agent label does not grant
authority; use an authenticated binding or display it as unverified context.
Recipient addressing does not hide data from authorized history readers. A public
display needs a separately authorized projection or history.

The owner supplies endpoint identity from the attached port. The originating
document and publication are useful context with a declared evidence level. A
reply references its original interaction and contribution slot; it cannot become
a fresh request merely because an observer received it. The public task, claim,
result and message records expose their authenticated `operation` reference from
Chronolog's reserved transaction evidence. Application JSON cannot substitute
another proposal or signer. References bind the authenticated application, actor,
operation handle and stable `opId`, while projection revisions bind the
current derived operation set and execution/policy context. Historical document labels remain signer assertions.

## Keep the first complete journey small

1. Attach the board and discussion to the same profile owner. Preserve a different
   view ID and draft for each document. Restore a draft deliberately after a new
   endpoint incarnation rather than reusing a live endpoint identity.
2. Choose one eligible recipient for an ordinary request. Show that recipient
   beside the send control and retain the operation reference before waiting.
3. For independent reviews, create one parent with a frozen set of contribution
   slots. Choose `allSlots`, `firstAccepted` or explicit `manual` synthesis.
4. Each assigned agent obtains a provisional guarded claim before reversible local computation.
   It reports disposable progress using a signed stream ID for its run.
5. Accept a result only under the current claim fence and captured context. Keep
   late and superseded evidence attributed without replacing accepted work.
6. Finalize against the current parent version and record the exact accepted
   contribution identities. Show failed and missing contributors visibly.
7. Reopen a view, inspect the same original operations and continue from the
   current projection. A late earlier proposal can revise guards and results;
   retain the original intent rather than silently creating another operation.

A claim describes one currently derived owner in a captured projection, **not
exclusive offline execution authority**. Two disconnected authors can both observe
accepted claims; after union and authored-time replay, one outcome may reject.
An earlier proposal can also remove a previously shown result. Render coherent
snapshots plus independent local drafts, never append arrivals into a second UI
state database. Ordinary Save waits only for durable local signing/storage.

History admission defaults to `open`: local materialization continues without any agent or
finalizer, and explicit finality waits fail as unsupported. Irreversible effects
require separately verified configured finality plus provider-idempotency and
receipt reconciliation. An unavailable finalizer may delay those effects, not
ordinary browser writes. `collab.finalize` means a domain synthesis, not a proof.

`reviewWorkspace({administrators, members})` returns `{definition,
initializationProgram}`. The root principal submits that ordinary DDL and explicit
per-signer INSERT grants once, with a retained operation ID. Crypto enrollment is
not a SQL grant. Later DDL and grant/revoke edits use ordinary authorized programs;
there is no signed initializer/schema-freezing channel or publication requirement.

## Separate shared work from local presentation

The shared application holds requests, claims, contributions and final decisions.
The view store holds an unsent draft and indexed references to journaled work.
Each pending reference includes the application, actor, operation handle and stable `opId` identity;
one view removing a reviewed reference cannot remove another view's reference.
The operation journal remains the source of signed proposals.

Keep retained history usable as it grows. The maintained
`captureCollaborationReader(session)` holds one coherent public read view. Read
task cards, conversation messages and result evidence through its bounded pages;
close the reader when refreshing, suspending or detaching. A continuation belongs
to that exact projection revision and query scope. Reusing it with different filters
or a newer capture raises `CURSOR_RESET_REQUIRED`, so offer an explicit refresh.

The reference shows eight task cards and sixteen messages or results per page.
The first page follows shared updates. While someone browses a continuation,
the view holds that revision and shows a refresh notice when new work arrives.
The selected task remains visible even when it is outside the task page. Local
drafts and the focused contribution control survive refresh. Complete accepted
result summaries keep every slot's identity available for synthesis; visible
evidence pages never redefine the accepted set or the frozen denominator.

The participant surface groups people, signing devices, endpoints and agent runs.
Use labels such as “This view”, “Awaiting a claim” and “Saved on this device”. Show
the actual agent route: native loop, on-demand tool caller, event subscriber or
mounted inbox. An available socket does not prove that a model is running or that
an existing chat can be awakened. Technical references belong in expandable
details and copyable diagnostics.

Camera, microphone, speech, focus and navigation remain local. Other devices may
show a quiet shared update. Never translate one shared message into a broadcast
sensor or attention command. Local Stop means stop waiting unless the user
explicitly requests durable cancellation; cancellation requested and acknowledged
are distinct facts.

## Adapt the supplied reference

The [reference checks](checks/README.md) consume packed public artifacts in a new
directory. Their native fixture uses separately retained signers and a
test-only authenticated star topology (no ordering role); local attachments exercise the same owner API used
by browser pages. This establishes native and attachment semantics, not physical
phone, browser suspension, deployed relay or conversational resumption claims.

The reference deliberately uses reviewed evidence and independent review slots.
Adapt the domain inputs, recipient selection and synthesis policy to the task.
Keep the owner, signed operation journal, guarded command boundary and current
authenticated proposal/actor and captured-revision checks in the maintained public modules.

The editable [board](page/board.html) and [discussion](page/discussion.html) layouts
share [one page module](page/app.mjs). Each view keeps its request, conversation,
contribution and synthesis drafts under its owner-allocated view ID. Saved-operation
references remain individually inspectable after an uncertain response. The UI
offers explicit handoff and cancellation acknowledgment; it never takes a second
claim on behalf of an observer. Follow the build instructions above to supply the
real authenticated owner/bootstrap graph and browser SQL engine. For a new
application, adapt the current service starter's owner-facing `connection.mjs`
and explicit recipient-bound provisioning controls around that bootstrap. The reference bootstrap expects a
retained, enrolled profile; `createProfile()` alone does not grant membership.
Keep the service review and return flow instead of building another enrollment
or idle polling loop.

The supplied [native reviewers](snippets/reviewer-cli.mjs) attach to separately
enrolled supervisors and run the [evidence and clarity policies](snippets/reviewer.mjs).
They claim only work addressed through an eligible fixed slot. Their deliberately
small local checks exercise independent agents without implying provider or model
verification. The page shows their current run identities and expiring progress
separately from accepted contributions. A reload restores an unsent contribution
draft but requires explicit transfer before a new endpoint continues the claim.
The reviewer discovers eligible open work across captured task pages, releases
its read view before claiming, and suppresses duplicate failed claims until the
shared task projection changes. A newly freed claim quota can then admit work;
an unrelated rejected proposal cannot create a hot retry loop.

The unqualified replacement scale fixture targets eight distinct retained signers and 32
simultaneous views, with endpoint quotas that leave a sibling usable. Its report
includes timing distributions, memory, CPU and exact grants. Treat those measured
local results as a bounded composition profile; physical devices, public Internet routes
and provider quotas require their own observations and limits.

## Rehearse interruption before claiming completion

| Starting condition and action | Required observation |
| --- | --- |
| Two views submit the same action name | Different endpoint/source contexts; replies remain tied to their own interaction |
| One attachment detaches or sends malformed RPC | Its own waits stop; the sibling still queries and submits |
| Disconnected agents race for one slot | Both can provisionally accept; merge revises the loser. Neither infers global exclusivity or finality |
| Two runs share signer, topic and channel | Both signed stream scopes survive filtering and coalescing |
| An old worker completes after handoff | Its fence is superseded; the new claim remains the only accepted owner |
| A result is retried with the same ID | Same content is idempotent; changed content conflicts |
| A new agent joins during collection | The existing slot set and denominator do not change |
| A request is cancelled while an effect is in flight | Request, acknowledgment and uncertain external outcome stay distinct |
| An earlier claim arrives late | Current guard/results and counts rederive; old captures stay coherent and unsent drafts survive |
| A tab reloads after a timeout | Its original full operation reference can be inspected; no automatic resubmission |
| Another view writes while someone browses a continuation | Existing pages remain coherent; explicit refresh shows the newer revision without changing local drafts |
| A named-query-only or events-only attachment requests raw SQL | The maintained owner rejects the request and releases the denied capture without closing siblings |
| One agent binding is revoked | That binding stops; unrelated consumers and signing grants remain intact |

Record exact source commits, archive hashes, engine identity, actual topology and
failure injections in the report. Preserve physical-device and provider evidence
separately. A passing native fixture must not silently qualify a later source
tuple or claim real-world latency and availability.
