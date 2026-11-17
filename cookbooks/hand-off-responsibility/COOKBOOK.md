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
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md"]
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

A display label such as “on duty” or an assignment in shared state does not grant permission. Actual application membership and keys decide who may read history; the definition checks the authenticated author of every guarded operation. If access must be provisioned separately, show the unresolved access dependency and use the service's actual authorized management path. Never put credentials into the handoff packet as a shortcut.

## Decide what acceptance must make atomic

In a planning application, acceptance should mark the exact offer accepted and change the task owner together. Implement that transition in one domain command. Capture the offer, task version and owner in a coherent query before review, then retain that snapshot until the receiver responds. A new read at submission must not silently substitute a different brief.

For illustration, your definition can declare a `handoff` query and `acceptHandoff` command:

```js
const reviewed = await session.query('handoff', { offerId });
const { offer, task } = reviewed.value;
if (offer.status !== 'offered' || task.version !== offer.taskVersion) {
  throw new Error('Review the changed handoff before accepting it');
}
const operation = await session.command('acceptHandoff', {
  offerId,
  expectedOfferVersion: offer.version,
  expectedTaskVersion: task.version,
  expectedOwner: task.owner,
}, { operationId: crypto.randomUUID(), basedOn: reviewed.revision });
const receipt = await operation.applied();
```

The command must verify that its authenticated author is the eligible receiver, the exact offer is still open, the brief/version and task owner still match, and the transition is permitted. It then updates offer status, ownership and domain versions atomically. The UI check is advisory; `basedOn` is an ordering prerequisite, not a replacement for those guards. A task or offer version must advance whenever its relevant meaning changes.

Keep access provisioning separate. An `offer.to` value does not grant membership, private keys or external credentials. Real-time expiry needs an explicit capability with an authoritative time policy; replaying a stored timestamp or rendering a countdown cannot establish it. A live “reviewing” signal can reduce collisions but is not permission or a lease.

Retain the acceptance operation ID. Exact retry after a lost reply preserves the same signed attempt and inputs; a rejected or abandoned offer cannot be revived by stamping a newer version onto that operation. Show locally saved and applied outcomes separately, and restore pending cards from the maintained session journal. A late outcome updates its original offer, not whichever task is now open.

An applied transfer belongs to the selected application history and can be abandoned by explicit recovery. Show the recovery notice and reconcile responsibility under the application's declared policy. If that responsibility authorizes an irreversible external action, qualify an explicit protected boundary before dispatch; a displayed owner field or ordinary applied result is insufficient.

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
| A queued acceptance survives reload. | Its original offer and operation ID are inspectable through the session journal; ownership follows the actual applied outcome. |
| A withdrawn offer is recreated after an old acceptance was rejected. | Delivery of the old command retains its rejection; a newly reviewed offer produces new intent. |
| An offer's deadline passes without changing its fields. | A value condition is not misrepresented as server-time expiry enforcement. |

This guide is explained application design. Actual exclusive ownership, private context, and atomic transfer claims require service-boundary checks of the chosen implementation.
