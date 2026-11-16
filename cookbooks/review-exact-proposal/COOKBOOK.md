---
id: "review-exact-proposal"
title: "Review an exact proposal before acting"
summary: "Bind approval to immutable content and an explicit version, expiry, and execution policy."
group: "Decide and act"
tags: ["approval", "versions", "authority"]
choices: ["Approval or a simpler authorized progress receipt", "Response-time and execution-time expiry", "Downstream idempotency and uncertain outcomes"]
capabilities: ["explicit trusted extension"]
evidence: "exercised"
related: ["recover-outdated-work", "observe-long-running-process"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/approval-remote/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/server.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs"]
---

# Review an exact proposal before acting

Use approval when an agent should prepare an action but a person must inspect its exact meaning before execution: sending a finalized document, changing a consequential configuration, or committing a reviewed plan. A general “looks good” message beside mutable state is insufficient. For low-impact work already authorized, a clear progress receipt may be the better experience; do not add a review gate merely because a button is available.

The desired outcome is an informed decision attached to a particular immutable proposal, followed by an honest execution record. Approval, service acceptance, external execution, and human understanding are different facts.

## Give the reviewer a complete journey

1. **Prepare.** Assemble the exact target, payload, scope, material effects, and unresolved assumptions. If the action refers to files or records, capture their reviewed versions rather than mutable names alone.
2. **Orient.** Show why a decision is needed, who may make it, and when it expires. Give a concise summary with access to the consequential detail.
3. **Inspect.** Let the person compare changes, open referenced evidence, and ask a question. A clarification should not silently mutate the proposal already on screen.
4. **Decide.** Offer explicit approve and reject actions; “Request revision” can be a separate application conversation. Avoid a preselected approval or an ambiguous “Continue” for a consequential action.
5. **Acknowledge.** Report queued, accepted, or rejected response status. Disabling a button locally helps usability but is not the authority boundary.
6. **Execute.** Run only the exact approved payload under the declared execution policy. Show waiting, running, and the actual known result.
7. **Resolve uncertainty.** If an external request may have succeeded but its reply was lost, explain that outcome uncertainty and reconcile before another attempt.
8. **Retain the record.** Keep proposal identity/version, decision, execution identity, and outcome under the application's access and retention rules.

A desktop review can show a diff and source evidence; a phone can show a concise decision with expandable details. Both must bind the action to the same immutable content and authorized identity.

## Define the proposal boundary

A proposal needs a stable ID, version, immutable payload, authorized approver policy, and expiry policy. The exact storage shape belongs to the application. If content changes before a decision, create a new version and make the changed meaning visible. After a decision, a new action requires a new proposal under the selected policy; editing an approved payload in place would detach permission from what was reviewed.

Show quantities, destinations, recipients, affected records, or other meaningful effects in ordinary language. Do not hide material details only in an opaque hash or a collapsed technical object. A digest can help identify bytes, but cannot by itself make a payload understandable. Rendering a malicious document or instruction-bearing source as data must not turn it into authority to approve itself.

Keep the viewer's local decision draft separate from the immutable proposal. Capture the proposal/version before asynchronous work. If a newer version arrives before the click reaches the service, reject the outdated response and show the revision difference. Preserve any note the person wrote so they can deliberately review again.

## Choose expiry and execution policy explicitly

| Policy question | Useful choice | Consequence |
| --- | --- | --- |
| Response expiry | Accept a decision only before the server's deadline. | An old page cannot approve by relying on a slow local clock. |
| Execution-start expiry | Require execution to begin while approval remains valid. | An approved queued action may still need re-review if it waits too long. |
| Completion after start | Permit an already claimed action to finish after expiry. | Expiry does not imply cancellation of an external effect already underway. |
| Revision | Replace only undecided content with a new version. | Decided proposals need a new action rather than silent amendment. |
| Cancellation | Implement an explicit state/policy if the task requires it. | A request racing an external effect may arrive too late to undo it. |

The selected server capability enforces identity, version, and time; the browser clock can display a countdown but cannot authoritatively validate approval. Generation guards preserve the task context across reset and retry; they do not replace the proposal's semantic version.

## Understand the selected reference

The [reference module](snippets/approval.mjs) is an application policy to review and deliberately install through the public trusted host. Reading this guide does not activate it. It restricts responses to the owner, permits revision only while pending, checks expiry both for a response and when claiming execution, and provides a stable execution key. A claimed execution can finish after expiry.

The reference records pending, approved/rejected, executing, and completed/failed outcomes. It does not supply a cancellation operation, multi-approver policy, downstream executor, or dedicated uncertain-outcome state. If the application needs those features, extend and verify the trusted policy deliberately. Do not display a working Cancel button or promise escalation merely because this guide discusses the design choice.

Its controller read boundary and projections also need to suit the actual page. Expose the review information through an authorized path without placing secrets into shared state. A UI that hides Approve from guests is not sufficient; test direct unauthorized requests at the service boundary.

## Keep external effects recoverable

Stored approval does not make a third-party API exactly-once. Use the downstream service's idempotency mechanism with a stable execution identity where it exists. Record the execution claim before dispatch and the resulting receipt before marking completion. If the service supports status lookup, use it to reconcile an ambiguous timeout.

A lost approval response can be retried with its original command and context. A lost execution response needs the original execution identity; generating a new key can duplicate the effect. If the downstream system cannot deduplicate or query outcomes, stop for a deliberate recovery decision and describe what is unknown. Never map “no success receipt” automatically to “safe to run again.”

For supported cancellation, distinguish requested, accepted before dispatch, too late, and compensation available. Compensation is a new action with its own effects and authorization; it may not restore the exact previous state. Preserve completed outcomes that arrive after a cancellation request instead of suppressing them to match the user's hoped-for result.

## Make the decision accessible

Provide a readable summary, meaningful labels, keyboard access, and a clear explanation when controls are unavailable. Avoid making color the only difference between approval and rejection. Warn about impending expiry without trapping the person in a rapidly changing countdown. If the proposal changes during inspection, preserve their reading position and clearly offer a fresh review.

A reason field can help the agent revise a rejected proposal, but should not be mandatory unless the task needs it. Keep sensitive rationale in the appropriate authorized storage. A notification should identify the need to review without exposing the full private payload on a shared screen.

## Verify authority, versions, and outcomes

| Scenario | Expected observation |
| --- | --- |
| An unauthorized identity calls the response operation directly. | The server rejects it regardless of visible controls. |
| The proposal changes between render and click. | The old version cannot approve different content; the reviewer can inspect the difference. |
| The local clock is wrong or response expiry passes. | The server's policy determines validity and the UI explains the rejection. |
| Approval is accepted but execution starts after expiry. | The selected execution-start policy is enforced. |
| An accepted response loses its acknowledgement. | Its original result is recoverable without another decision. |
| A downstream timeout occurs after a possible effect. | Uncertainty is recorded and reconciled; no blind duplicate execution occurs. |
| Completion arrives after cancellation was requested. | The actual result is shown with the cancellation race explained. |
| A referenced file is replaced. | Execution still uses the approved immutable content or refuses an invalid dependency. |

The reference's [checks](checks/) exercise its selected policies through the public host. Their recorded scope covers exact version, owner authority, response/execution expiry, immutable payload, and stable downstream identity. It does not establish downstream exactly-once effects or the additional application features described here.
