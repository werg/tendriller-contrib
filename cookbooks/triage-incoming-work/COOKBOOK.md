---
id: "triage-incoming-work"
title: "Triage an incoming queue without losing work"
summary: "Turn incoming items into owned, prioritized work with explicit duplicate, snooze, escalation, and resolution policies."
group: "Guide and coordinate work"
tags: ["triage", "queues", "ownership"]
choices: ["Shared inbox or an authoritative claim policy", "Priority, due time, and escalation as separate decisions", "Snoozed or filtered work versus completed work"]
capabilities: []
evidence: "explained"
related: ["search-and-filter-collections", "reconcile-concurrent-edits", "observe-long-running-process"]
sources: ["https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/EXPERIENCES.md"]
---

# Triage an incoming queue without losing work

Use a triage workspace when incoming requests, findings, or exceptions need a decision before they become ordinary work. The outcome is a visible disposition: accepted, assigned, waiting, duplicate, declined, or resolved according to the task. A simple shared list is enough when volume is small and one person handles it. Claims, escalation rules, and automation become useful only when they reduce a real coordination problem.

For example, a team receives equipment issues from several inspection devices. Some require follow-up, some repeat an existing issue, and some need more evidence. Marking every incoming record “done” after reading it would hide unfinished work; treating every duplicate delivery as a new issue would inflate the queue.

## Walk one item through the experience

1. **Receive.** Create a stable intake identity, preserve source context and arrival time, and show whether ingestion is current. Treat submitted text and attachments as data, not instructions that can assign authority to themselves.
2. **Inspect.** Show the problem, affected object, evidence, and relevant uncertainty together. A reviewer should not need to open several opaque IDs to understand the request.
3. **Classify.** Apply a small useful category set and record what evidence is missing. An agent can suggest classification; make confidence and corrections visible when the suggestion matters.
4. **Prioritize.** Distinguish impact, urgency, due time, and queue order. A high score should not hide why a person needs to act.
5. **Own.** Assign responsibility or let an eligible person claim the item under the chosen authoritative policy. An assignment label alone does not grant access or prove acceptance.
6. **Act or defer.** Start work, request information, link an existing issue, decline with a reason, or snooze until a specified condition/time.
7. **Resolve.** Record the actual outcome and supporting receipt. Reading, hiding, or exporting an item does not resolve it.
8. **Reopen if needed.** New evidence can reopen a prior item with a visible reason and history, rather than silently creating an unrelated duplicate.

Offer an overview with actionable counts and a focused item view. Preserve the selected item and draft response when the queue changes, and let keyboard users move to the next eligible item deliberately.

## Define a small state model

| State or attribute | Question it answers | Typical transition |
| --- | --- | --- |
| Untriaged | Has someone made an intake decision? | Classify, decline, or link as duplicate. |
| Ready | Is useful action possible now? | Assign or begin work. |
| In progress | Is a responsible actor actively handling it under the chosen policy? | Complete, release, or mark blocked. |
| Waiting/blocked | What dependency prevents progress? | Resume when evidence or a prerequisite arrives. |
| Snoozed | Until when or what condition is attention deferred? | Return to the actionable view without inventing completion. |
| Resolved/declined | What final disposition was recorded? | Reopen through a deliberate change if new facts justify it. |

These are example concepts. A support inbox and an inspection queue may need different states; do not install a universal ticket schema. Keep status separate from priority, owner, visibility, and due time. A low-priority item can be overdue; a hidden item can remain unowned; a claimed item can be blocked.

Use stable item IDs and explicit record revisions or appropriate protected operations. Comments and attachments should retain their source identities. Store local response drafts separately from accepted changes and pending submissions. A queue row leaving the current filter after an action needs a clear receipt and route back to the item.

## Choose ownership and concurrency policy

For one reviewer, a simple accepted owner field may suffice. For a team, decide whether assignment means a suggestion, an accepted responsibility, or exclusive processing. If exclusion matters, implement an atomic claim, expiry/release policy, and checks at the authority that accepts work. A disabled button in another browser is not a lock.

Tendriller's [named event consumers](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md) coordinate host processing of an event log. They do not automatically implement human ticket ownership or make a page's arbitrary `assigned_to` field exclusive. Select or implement the application policy deliberately and keep its claim identity separate from the agent's handled-event checkpoint.

When two people claim the same item, the losing request should see the current authoritative owner and retain any private draft. If a holder disappears, a documented timeout or explicit release allows recovery. Do not silently steal responsibility based only on a last-seen timestamp. A new owner needs the task context and unresolved work, while private drafts require an explicit authorized transfer path.

## Handle duplicates without losing evidence

Deduplicate repeated delivery using its original intake or command identity. That differs from deciding that two independent reports describe the same real-world issue. The latter is a semantic judgment with possible errors.

For suspected duplicates, show the candidate existing item and matching reasons, then link or merge under a declared policy. Preserve original reporter context, evidence, and arrival times when needed. A merge should not erase a unique observation, silently change priority, or expose another reporter's private data. Offer a way to undo an incorrect association through a new reviewed correction.

If the same issue returns after resolution, choose between reopening the original item and creating a related new occurrence. Repeated text alone cannot decide: a recurring fault is not necessarily a replay. An agent suggestion should expose its basis rather than permanently suppressing the new report.

## Defer and escalate predictably

Snooze should name its scope and return condition: this reviewer's view, the whole team queue, a date/time, or a missing response. Keep deferred items discoverable with a visible count. A foreground timeout is insufficient if the item must return while the page is closed; use the actual durable timer or another supported server mechanism and observe its receipt.

Escalation requires a reason, recipient policy, and authority. Age alone may identify forgotten work, while severity can require immediate review. Record which rule and item revision caused an escalation so repeated evaluations do not spam recipients. Do not infer an external message channel exists or send private issue details through a general notification. A durable unresolved queue is still needed when notifications are unavailable.

When a due time changes, preserve the old value in relevant history and update outstanding reminders according to the supported service operations. Show “overdue” as a derived time state rather than automatically declaring failure or completion. The person needs a useful next action: reassess, reassign, request information, or deliberately decline.

## Keep the queue humane and inspectable

Show separate counts for untriaged, actionable, blocked, and deferred work. Explain filters and loaded/retained coverage. Sorting should be stable, and remote arrivals should not move an imminent click target unexpectedly. A “New items available” notice is often preferable while a reviewer is editing.

Bulk actions need exact scope and a review of consequential effects. “Resolve all” should not accidentally include items arriving after selection. Provide a text equivalent for color-coded priority and explicit labels for ownership and state. Preserve focus after an action and offer undo only where its actual semantics are defined.

Measure useful outcomes such as unresolved age or time to an acknowledged disposition, with definitions. A count of button clicks or items hidden from view is not throughput. Keep metrics bounded by the same access and retention policies as the queue itself.

## Verify triage under pressure

| Scenario | Expected observation |
| --- | --- |
| Two reviewers claim the same item. | The authoritative policy produces a clear winner/conflict; local drafts survive. |
| The same intake delivery is retried. | One intended item remains with the original receipt. |
| Two similar reports include distinct evidence. | Duplicate review preserves unique facts and can be corrected. |
| A reviewer snoozes or filters an item. | It remains unresolved and discoverable under the declared scope. |
| A claimed reviewer disappears. | Recovery follows the explicit release/expiry policy without fabricated completion. |
| A due time changes after an escalation was queued. | Current item state and notification history explain any stale reminder. |
| New items arrive during a bulk action. | Only the reviewed selection is affected. |
| A host restarts after handling an event but before acknowledgement. | Retry-safe processing preserves the result without duplicating external effects. |

This guide describes an application-owned triage policy. Actual claims, transitions, and authorization need verification at their service boundary; a responsive queue mockup does not establish those guarantees.
