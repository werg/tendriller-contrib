---
id: "recover-outdated-work"
title: "Recover from queued, repeated, and outdated work"
summary: "Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action."
group: "Keep work dependable"
tags: ["commands", "operations", "drafts"]
choices: ["Queued, accepted, rejected, and completed are distinct", "Retry original context or deliberately compose new work", "Submitted snapshot separate from current draft"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "review-exact-proposal", "connect-resuming-agent", "work-offline-and-reconnect"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md"]
---

# Recover from repeated and outdated work

Use this when a signed operation can outlive its connection or reviewed task. A
reply may be lost after local durable storage, peer retention or materialization.
Exact retry resumes that same proposal, never a new action with a fresh time.

## Make pending work understandable

An inspector submits a note, starts another draft, then receives an updated
outcome for the first note. Keep both snapshots. Show a per-request activity view
with readable original intent, application/author/operation/proposal identities,
reviewed domain version and current result. This is a view of the session journal,
not another delivery queue. Reauthorize sensitive display as required.

| Observation | Honest meaning | Next action |
| --- | --- | --- |
| Stored locally | Exact signed intent is durable on this device. | Inspect or retry it; local materialization does not need a remote peer. |
| Materialized accepted/rejected | Current coherent replay has this result at its revision. | Show the result and subscribe to revisions; earlier facts can change it. |
| Dependency pending | A body, key, authority predecessor or working engine is missing. | Preserve intent and name the dependency; do not fabricate rejection. |
| Retained by a named peer | Authenticated evidence identifies an independent holder. | Show retention separately; it is not finality or permanent archival. |
| Finalized | Configured admission/closed-time proof and complete final replay cover it. | Use only the policy's actual guarantees; no-finality mode is explicitly unsupported. |
| Excluded by sealed time | First eligible inclusion is behind a configured closed frontier. | Keep original intent visible; a new reviewed submission is explicit, never automatic. |
| External outcome unknown | Another system may already have performed an effect. | Reconcile its original effect identity before any new dispatch. |

## Use one maintained journal

The owning session persists signed bytes before acknowledging storage. Restore
references through `session.operations.get(id)` and call
`session.operations.retry(id)` to wake exact delivery/dependency/replay work. Do
not rebuild commands from today's form fields. Timeout or cancelled waiting does
not prove that storage or execution failed.

A named `session.query` returns `{applicationId, revision, value}` from a coherent
capture. The revision identifies reviewed state; it is not another order input or
an atomic domain guard. Check expected field values, domain versions and authors
inside the signed transaction. See the
[editing guide](../reconcile-concurrent-edits/COOKBOOK.md).

The immutable fact is the signed intent, **not its provisional SQL result**. A
late earlier operation can change whether the original guard succeeds. A later-
in-author-time change cannot move the original operation forward. Exact retry
never rewrites a predicate, timestamp, ID or program to make it pass. A different
reviewed decision is a new authored proposal, with an explicit domain link when
useful. There is no history takeover or reapplication API.

If storage fails before durability, keep surviving draft text, offer export and
explain its lifetime. Do not clear the draft or claim it saved. If an engine fails
operationally, show a projection error separately from the already-stored intent.

## Separate bytes, domain acceptance and publication

`session.content` stages immutable encrypted bytes with bounded, resumable
transfer. Byte completion does not mean a domain transaction accepted its
reference, an independent peer retained it or an agent examined it. Measure those
facts separately. A document correction uses a new immutable byte reference and
a guarded domain transaction.

Page code has independent publication authorization and a signed predecessor
chain. Use the supplied publication helper to persist the exact signed manifest
and graph before sending. After an uncertain reply reconcile and resend those
same bytes. A publication-head conflict needs explicit new review, not silent
predecessor replacement. Publishing does not require data-root ownership or
select application history. See the
[publication guide](../publish-coherent-updates/COOKBOOK.md).

## Preserve drafts through rederivation

Render materialized snapshots plus separate local draft/view state. Notifications
invalidate a capture; re-read schema, data, events and outcomes coherently rather
than combining old SQL with newly arrived events. An earlier operation can move
or remove rows or revise schema and guard results. Preserve stable-ID selection,
focus and newer typing. A delayed outcome updates only its original submitted
snapshot.

An irreversible external effect additionally needs verified final prerequisites
under a chosen supported policy and an idempotent external-effect protocol.
Revisable local acceptance, replication or provider availability is not permission
to blindly replay an effect.

## Verify

Disconnect before storage and after storage but before the reply. Reload the
same identity and inspect/retry the same proposal. Deliver an earlier operation
that flips an outcome or schema. Verify that later domain changes do not silently
retimestamp old work. Type a newer draft before a delayed result. Test missing
keys, stopped finalizer, actual sealed-time exclusion, interrupted content resume
and uncertain signed publication. Reconcile an actual external effect after
process failure; an application receipt alone cannot prove exactly-once dispatch.
