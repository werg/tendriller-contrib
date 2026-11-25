---
id: "choose-data-model"
title: "Choose the right home for application data"
summary: "Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state."
group: "Keep work dependable"
tags: ["data-model", "authority", "retention"]
choices: ["Current value versus ordered history", "Authority, privacy, and record lifetime", "View checkpoints versus handled-agent-work checkpoints"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "collect-private-responses", "reconcile-concurrent-edits", "export-and-restore-work", "run-a-peer-application"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/EXPERIENCES.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/stream-view.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md"]
---

# Choose the right home for application data

Start with authority, lifetime, ordering, privacy and recovery. A draft, a live cursor, an accepted task claim, immutable evidence and signed page code have different meanings even when all can be represented as JSON. Use the same application/session contract for durable meaning and choose explicit facets and capabilities for the different exchanges.

## Work backward from the person's journey

For an inspection, distinguish the editable local note, the exact submitted snapshot, a retained photograph, the applied observation, an agent's interpretation and a reviewed decision. A global “Saved” badge hides which of those facts actually exists. Ask who can read each item, which version a decision reviewed, what must survive interruption, and whether explicit recovery may abandon it.

Keep display choices such as filters and expanded panels separate from shared domain state. A shared selection should be intentional; another person's chart zoom should not rewrite a task decision. Give records stable IDs independent of labels, row position and current filters.

## Match the facet to the guarantee

| Information | Mechanism | Boundary |
| --- | --- | --- |
| Unsubmitted draft | Page-owned state with an explicit local persistence policy. | Storage failure and shared-device privacy remain visible. |
| Typing, cursor or replaceable live reading | Session live signals with bounded expiry. | No durable replay, history or completion guarantee. |
| Commands, conversation and retained events | One application definition and owned session journal. | Applied outcomes belong to selected recoverable history. |
| Relational guards and queries | The same definition/session with an explicit SQL engine capability. | Actual deterministic execution and schema binding must be qualified. |
| Immutable application bytes | Session content staging, transfer and retention. | A reference in JSON does not itself retain another usable copy. |
| Membership and recovery authority | Signed controls exchanged with the selective host participant. | Host availability is needed for those lifecycle changes, not every command. |
| Authored page code | Signed publication through the same participant envelope. | Independent predecessor chain and exact file hashes; no application-data rollback. |
| Irreversible external action | An explicit protected checkpoint or durable action capability. | Ordinary applied/shared outcomes cannot authorize irreversible replay. |

Event-only applications avoid an unnecessary SQL engine. SQL adds transactional guards and relational projections without adding another command API, retry queue or backend selection. Browser and native transports own different storage and networking resources; they expose the same commands, queries, events and operation inspection. The host is a participant with narrower rules, not a second hosted data implementation.

## Declare the transaction in the definition

Use a coherent `session.query` or captured read view for review. Retain its application revision and any domain versions or values that influenced the decision. Submit a stable operation ID with `basedOn` for the application ordering prerequisite. The definition must still check the authenticated author, domain predicates and allowed transition inside actual execution.

A field-value guard permits unrelated edits and may permit change-and-change-back. A record version can reject every relevant intervening mutation if the definition advances it consistently. Choose the domain policy deliberately. The [editing guide](../reconcile-concurrent-edits/COOKBOOK.md) and [guarded SQL definition](../run-a-peer-application/snippets/peer-task-board.mjs) show that common boundary.

A command can assert prerequisites, change SQL and emit its domain event atomically. An event-only definition can make its chosen deterministic transition through the same command contract. Independent commands, membership changes, content retention and external effects are not automatically one transaction. Model an explicit intermediate state and recovery when a decision crosses those boundaries.

## Make saving and recovery legible

Distinguish a local draft, a stored signed intent, a revisable materialized accepted/rejected result, peer retention and a separately completed effect. Inspect original operations after reopening. Exact retry preserves the signed attempt; a new decision needs new reviewed input. Do not build another mutation outbox merely to display pending work.

Merge authenticated operation sets and derive one coherent snapshot. Late earlier operations can change current results, events and schema. Keep signed proposal identities and original intent inspectable while rederiving views. Stored, materialized and retained do not imply optional finality; sealed-time exclusion is a separate explicit policy with visible original intent.

New typing remains a different draft. A delayed result updates its original submitted snapshot and cannot clear newer work. A view replacement should preserve useful focus, selection and explanatory context while removing claims that no longer hold at the current materialized revision.

## Keep privacy in the reader boundary

All readers authorized for an application history may obtain its replicated plaintext. Topic names, query filters and hidden panels are not private collections. Use separate application membership and keys when audiences differ, with explicit cross-application aggregate publication if needed. See [private responses](../collect-private-responses/COOKBOOK.md).

Verified authorship, permission to submit, finality eligibility, publication authority, page ownership and external-tool credentials are separate roles. A payload field called `owner` cannot grant authority. Preserve verified requester provenance through agent work and recheck required rights at the actual action boundary. Revocation limits future authorized access; it cannot erase plaintext already obtained.

## Preserve content and cursor identity

An annotation or proposal should name the immutable bytes it reviewed. A mutable domain document reference can advance only through its guarded command. Page code has its own signed publication head. Neither a display URL nor a copied content ID supplies permanent retention or new read authority.

An event cursor, a materialized view checkpoint, an agent's handled position and retained replication coverage answer different questions. Keep them with their actual owner and generation. Persist a derived view with its matching cursor and coverage, or rebuild it; restoring a cursor without its model silently skips data. A live signal has no replay position.

Bound records, retained bytes, pending work and diagnostic payloads. Show missing history or unavailable content honestly. Export only the authorized domain data and provenance the task needs; credentials and private device journals are not a portable application format.

## Verify through user outcomes

Race independent sessions on the same guarded record. Lose a reply and reopen the original operation. Reopen an older retained checkpoint and inspect consistent SQL, events and uncertain attempts. Interrupt content transfer and verify actual retained bytes. Remove reader authority and test direct access, not only rendering. Publish signed code without changing application state. Exercise optional capabilities independently and name their actual runtime and storage evidence.
