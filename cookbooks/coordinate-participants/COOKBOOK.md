---
id: coordinate-participants
title: Coordinate people, views and independent agents
summary: "Use one session owner per signing profile, explicitly addressed interactions and guarded contribution slots to coordinate several people, devices, views and agent runs."
group: Coordinate people and tools
tags: ["collaboration", "agents", "claims", "recovery", "participants"]
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
attempt, materialized view, replica and recovery decision. This cookbook adds the
review policy and editable example UI; it adds no session owner or retry queue.
Use the exact compatible public archives identified by the qualification report.
A current source checkout does not establish what a deployed host supports.

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
a fresh request merely because an observer received it.

## Keep the first complete journey small

1. Attach the board and discussion to the same profile owner. Preserve a different
   view ID and draft for each document. Restore a draft deliberately after a new
   endpoint incarnation rather than reusing a live endpoint identity.
2. Choose one eligible recipient for an ordinary request. Show that recipient
   beside the send control and retain the operation reference before waiting.
3. For independent reviews, create one parent with a frozen set of contribution
   slots. Choose `allSlots`, `firstAccepted` or explicit `manual` synthesis.
4. Each assigned agent obtains a guarded claim before starting consequential work.
   It reports disposable progress using a signed stream ID for its run.
5. Accept a result only under the current claim fence and captured context. Keep
   late and superseded evidence attributed without replacing accepted work.
6. Finalize against the current parent version and record the exact accepted
   contribution identities. Show failed and missing contributors visibly.
7. Reopen a view, inspect the same original operations and continue from the
   selected history. Recovery requires explicit revalidation or reassignment.

A claim guarantees at most one currently accepted owner in selected history. It
cannot stop an old disconnected process from using CPU or complete an external
request that was already dispatched. The application's external-effect boundary
needs its own retained idempotency identity and reconciliation. Never replay an
external effect because a recovered suffix no longer includes its receipt.

## Separate shared work from local presentation

The shared application holds requests, claims, contributions and final decisions.
The view store holds an unsent draft and indexed references to journaled work.
Each pending reference includes the application, signer and operation identity;
one view removing a reviewed reference cannot remove another view's reference.
The operation journal remains the source of signed attempts.

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
coordinator-centered topology; local attachments exercise the same owner API used
by browser pages. This establishes native and attachment semantics, not physical
phone, browser suspension, deployed relay or conversational resumption claims.

The reference deliberately uses reviewed evidence and independent review slots.
Adapt the domain inputs, recipient selection and synthesis policy to the task.
Keep the owner, signed operation journal, guarded command boundary and current
generation checks in the maintained public modules.

## Rehearse interruption before claiming completion

| Starting condition and action | Required observation |
| --- | --- |
| Two views submit the same action name | Different endpoint/source contexts; replies remain tied to their own interaction |
| One attachment detaches or sends malformed RPC | Its own waits stop; the sibling still queries and submits |
| Two agents race for one exclusive slot | One accepted claim; the other sees a conflict and performs no effect |
| Two runs share signer, topic and channel | Both signed stream scopes survive filtering and coalescing |
| An old worker completes after handoff | Its fence is superseded; the new claim remains the only accepted owner |
| A result is retried with the same ID | Same content is idempotent; changed content conflicts |
| A new agent joins during collection | The existing slot set and denominator do not change |
| A request is cancelled while an effect is in flight | Request, acknowledgment and uncertain external outcome stay distinct |
| Recovery adopts an active claim | Old fence is rejected until guarded rebind or reassignment |
| A tab reloads after a timeout | Its original full operation reference can be inspected; no automatic resubmission |
| One agent binding is revoked | That binding stops; unrelated consumers and signing grants remain intact |

Record exact source commits, archive hashes, engine identity, actual topology and
failure injections in the report. Preserve physical-device and provider evidence
separately. A passing native fixture must not silently qualify a later source
tuple or claim real-world latency and availability.
