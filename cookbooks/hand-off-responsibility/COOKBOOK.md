---
id: "hand-off-responsibility"
title: "Hand off responsibility with a clear acceptance"
summary: "Transfer task context and unresolved work through an explicit offer and acceptance without confusing assignment, access, or completion."
group: "Guide and coordinate work"
tags: ["handoff", "ownership", "context"]
choices: ["Informational handoff or accepted responsibility transfer", "Whole task or explicitly scoped partial transfer", "Atomic ownership change or visible coordination limits"]
capabilities: []
evidence: "explained"
related: ["coordinate-devices", "resume-across-sessions", "guide-explicit-checkpoints", "triage-incoming-work"]
sources: ["https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PROTOCOL.md"]
---

# Hand off responsibility with a clear acceptance

Use a responsibility handoff when another person or agent should take over meaningful unfinished work: a shift change, a project review, or an investigation that needs different expertise. The outcome is a shared understanding of who owns which next action and what context they accepted. Sending a link is sufficient for an informational update, but does not establish accepted responsibility.

This differs from [moving a view across devices](../coordinate-devices/COOKBOOK.md). A person can use a new device without changing responsibility; a new responsible person may use the same shared workstation. It also differs from an agent's handled-event checkpoint, which records processing progress rather than human acceptance of a task.

## Prepare a useful handoff packet

For an unfinished equipment investigation, the outgoing person should identify the equipment, observed symptoms, evidence already collected, decisions made, current hypothesis, unresolved questions, and the next useful action. Include constraints and upcoming deadlines that could change the receiver's decision. A transcript dump is rarely a good first view; use a concise brief with links to exact supporting records.

Separate established facts, interpretations, proposed next steps, and unknowns. Record the task and brief revision used in the offer. A later change should be visible to the receiver rather than silently altering the handoff they are about to accept. Do not include unrelated private drafts or information the intended recipient cannot access.

## Build the offer-to-accept journey

1. **Choose scope.** The sender selects a whole task or named parts, and states which responsibilities remain with them. “Help review” should not silently become “own all delivery.”
2. **Prepare context.** Build the brief from current accepted records and unresolved work. Let the sender correct the summary and inspect its source links.
3. **Offer.** Create a stable offer with intended recipient identity or an explicit eligible-role policy, task revision, scope, and any response deadline. Distinguish sending a notice from successfully recording the offer.
4. **Orient the receiver.** Show what they are being asked to own, why, the current deadline, and whether they have access to necessary evidence and actions.
5. **Accept, decline, or request clarification.** Make these separate actions. A receiver can explain missing capacity or context without pretending to accept.
6. **Confirm both sides.** The accepted receipt names the exact scope, responsible party, and effective point. Keep the sender informed of unresolved or declined parts.
7. **Resume work.** The receiver opens the relevant checkpoint and sees queued or uncertain effects separately from completed facts.
8. **Close the transition.** Release only the responsibilities actually transferred. Retain a useful history and a way to correct a mistaken acceptance or propose another handoff.

A compact mobile acceptance card can work well when the scope is small. A complex incident handoff may need a side-by-side brief and evidence view. Both need the same meaningful receipt.

## Define states and ownership independently

| Handoff state | Meaning | Responsibility consequence |
| --- | --- | --- |
| Draft | Context is being prepared. | Existing owner remains responsible. |
| Offered | A particular scope/version awaits a response. | Ownership changes only if the declared policy says so; do not imply acceptance. |
| Clarification requested | The recipient needs more information. | The offer remains unresolved or is revised explicitly. |
| Accepted | The authorized recipient accepted the exact scope. | Apply the declared effective transfer atomically where required. |
| Declined or expired | No valid acceptance occurred. | Keep a visible route to continued ownership, reassignment, or escalation. |
| Withdrawn or superseded | A newer decision replaced the offer. | Old delayed responses cannot revive it silently. |

These are application-owned concepts. Tendriller does not install a responsibility-transfer workflow when this guide is read. Choose the smallest model that fits the task and enforce its transitions through suitable authorized operations.

A display label such as “on duty” or an assignment in shared state does not grant permission. The server's current identity and role decide who may read records and perform operations. If access must be provisioned separately, show the unresolved access dependency and use the service's actual authorized management path. Never put credentials into the handoff packet as a shortcut.

## Decide what acceptance must make atomic

For a planning list, the acceptance should mark the exact offer accepted and change the named task's owner together. Core's conditional `state.apply` supplies this atomic state change; no custom trusted transaction is needed just to compare an offer and update several paths. Use `state.snapshot()` while connected to prepare the receiver's review from a matching state, revision, and scope set. Keep that reviewed version until the receiver responds; a fresh read at submission must not silently substitute a changed brief.

For this cooperative planning model, an offer has `status`, `taskId`, `to`, `taskRevision`, and its reviewed brief/scope fields. Task edits advance an application revision. The page first validates that the offer awaits acceptance, belongs to the displayed recipient, and still concerns the displayed task; these UI checks guide the person. The conditions close races after that review:

```js
const reviewed = await tendril.state.snapshot();
const offer = reviewed.state.offers[offerId];
const task = reviewed.state.tasks[offer.taskId];
if (offer.status !== "offered" || task.revision !== offer.taskRevision) {
  throw new Error("Review the changed handoff before accepting it");
}

// After the receiver reviews this exact offer:
const result = await tendril.state.apply([
  {op: "set", path: ["offers", offerId, "status"], value: "accepted"},
  {op: "set", path: ["tasks", offer.taskId, "owner"], value: offer.to},
  {op: "set", path: ["tasks", offer.taskId, "revision"], value: task.revision + 1},
], {
  expected_generations: Object.fromEntries(
    reviewed.scopes.map(scope => [scope.id, scope.generation]),
  ),
  conditions: [
    {path: ["offers", offerId], equals: offer},
    {path: ["tasks", offer.taskId, "revision"], equals: offer.taskRevision},
    {path: ["tasks", offer.taskId, "owner"], equals: task.owner},
  ],
});
```

Guarding the whole offer binds all its reviewed fields, including recipient and brief identity; object key order does not matter. Missing or withdrawn offers cannot match it. `exists:false` is useful when creating a previously unused offer ID, while an existing null field needs `equals:null`. Use `expected_revision:reviewed.rev` instead of selective comparisons when every shared-state change should invalidate the review; it also catches unrelated writes and change-and-change-back. Per-task revisions require participating edits to advance them consistently.

This example gives cooperating authorized writers atomic consistency. It does not make `offer.to` a credential or prevent an otherwise authorized writer from omitting predicates. Mandatory recipient eligibility, access provisioning, approval rules, and server-time expiry belong in an authorized trusted operation. An expiration field compared with `equals` only proves the field is unchanged; it does not compare the current server clock. An advisory “someone is accepting” indication can reduce collisions but is not permission or a lease. Do not reuse an agent event-consumer lease as a human assignment.

Capture acceptance intent before asynchronous work. Core retains the original predicates and generations on delivery retries. A lost reply is reconciled through the same command; a stored `state_conflict` remains rejected even if an offer later looks acceptable again. A withdrawn or reset offer needs a new deliberate review, not freshly stamped guards on the old command.

Show “Acceptance pending” while `queued`; the conditional operation does not change optimistic ownership. Only `accepted` confirms the whole transfer. Admitted results carry `cid`, and `state_result` includes that CID, original operations, and context. After reload, use `state.pending()` and `state_queue` to recover this device's unsettled handoffs: here an operation beginning `["offers",offerId]` identifies the offer. Keep the sender's accepted responsibility visible while that command remains pending. A late outcome updates its original offer, not whichever task the receiver has opened since. The [browser API](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md) provides these surfaces without an application outbox.

## Handle partial, changed, and uncertain work

A partial transfer needs an explicit list of included tasks and exclusions, with each remaining responsibility visible. Avoid a single “accepted” badge on a packet that contains both accepted and unassigned work. If task definitions changed between offer and response, show a concise difference and let the receiver accept a new version deliberately.

Pending commands and external effects need special care. “I sent the request” is not the same as “the request completed.” Include relevant operation identities, known receipts, and uncertainty so the receiver can reconcile rather than repeat an external effect. Keep private administrative tokens in host storage; share only authorized context and outcome identifiers suitable for the recipient.

Local unsent drafts remain separate. The sender can choose an authorized transfer of a specific draft snapshot where needed, but acceptance should not delete newer text written afterward. If the source device disappears, acknowledge which local material is unavailable and continue from the authoritative record. A handoff summary should never fabricate evidence it cannot recover.

## Useful controls and considerate communication

A readiness checklist can surface missing access, evidence, or deadlines before an offer. Keep it short and task-specific. An optional receiver note can clarify what they accepted and the first intended action. A visible response deadline is useful when ownership gaps matter; an expired offer needs a named fallback rather than disappearing from the list.

Notifications should state that a handoff needs review and link to current authorized context. Their delivery or presentation is not acceptance. Avoid repeatedly interrupting someone who has declined or asked for clarification. If escalation is required, define the eligible recipient and scope before enabling it.

Use readable summaries, keyboard-operable decisions, clear focus after a response, and an accessible history of revisions. The sender should see whether the offer is waiting, blocked by access, declined, or accepted without interpreting a last-seen indicator as willingness.

## Verify the responsibility boundary

| Scenario | Expected observation |
| --- | --- |
| The receiver opens or reads the handoff. | Responsibility remains governed by explicit acceptance, not inferred from presentation. |
| Two people conditionally accept the same offer simultaneously. | One complete offer/owner/revision transition succeeds; the competing batch conflicts without partial ownership. |
| A recipient lacks access to essential evidence. | The dependency is visible; no secret is copied to bypass authorization. |
| The task or offer changes while a response is pending. | The old response cannot accept a different scope. |
| The receiver declines or the offer expires. | Existing responsibility and the fallback action remain visible. |
| Only part of a packet is accepted. | Accepted and unassigned responsibilities are reported separately. |
| An external request has an uncertain outcome. | The receiver reconciles its original identity before repeating an effect. |
| The acceptance reply is lost and retried. | One transfer and its original outcome remain, without duplicated assignments. |
| A queued acceptance survives reload. | Its original offer and CID are inspectable through `state.pending()`; ownership stays unconfirmed until its receipt. |
| A withdrawn offer is recreated after an old acceptance was rejected. | Delivery of the old command retains its rejection; a newly reviewed offer produces new intent. |
| An offer's deadline passes without changing its fields. | A value condition is not misrepresented as server-time expiry enforcement. |

This guide is explained application design. Actual exclusive ownership, private context, and atomic transfer claims require service-boundary checks of the chosen implementation.
