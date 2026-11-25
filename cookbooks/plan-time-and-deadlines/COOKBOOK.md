---
id: "plan-time-and-deadlines"
title: "Plan work across time zones and deadlines"
summary: "Distinguish dates, timed commitments, and recurring intent while making overdue work, rescheduling, and real reminder delivery understandable."
group: "Guide and coordinate work"
tags: ["planning", "time", "deadlines", "reminders"]
choices: ["Date-only task, absolute instant, or local calendar recurrence", "Task deadline versus reminder and delivery receipt", "Missed-run, daylight-saving, and rescheduling policy"]
capabilities: []
evidence: "explained"
related: ["choose-interruptions", "guide-explicit-checkpoints", "triage-incoming-work", "review-exact-proposal"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PUSH_NOTIFICATIONS.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/contract/v3.json", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
---

# Plan work across time zones and deadlines

Use a planning page when a person needs to arrange tasks, appointments, or recurring reviews and understand what happens as time passes. The useful result is a plan whose dates mean what the person intended and whose reminders have honest delivery status. A dated checklist is enough when no timed action is needed. Add scheduling and notifications only when they improve the work.

Consider a project reviewed by collaborators in different regions. “Finish the draft on Friday,” “Meet at 15:00 Berlin time,” and “Review the queue every weekday at 09:00 in Berlin” are three different intentions. Storing all three as a bare timestamp or a free-text label creates avoidable ambiguity.

## Model the person's time intent

| Kind | Preserve | Display and behavior |
| --- | --- | --- |
| Date-only task | Calendar date and the policy defining its planning context | Keep the date stable across viewers; do not invent midnight as an appointment. |
| Timed commitment | Absolute instant plus the intended timezone/context | Show the relevant local view and an explicit reference zone when collaborators differ. |
| Local calendar recurrence | Local time, IANA timezone, recurrence rule, and exceptions if supported | Recompute occurrences under the declared calendar/DST policy. |
| Elapsed interval | Start/reference instant and duration | Distinguish elapsed time from “same local time tomorrow.” |
| Deadline | Due intent plus completion policy | Derive upcoming/overdue state without implying the task was completed or cancelled. |
| Reminder | A separate scheduled occurrence and destination policy | Track scheduling and delivery independently of task completion. |

A timezone label is not a fixed offset. Keep the intended IANA zone for calendar rules and distinguish it from the device's current display zone. A date-only task may need a team planning zone to decide when it becomes overdue, but that policy should be stated rather than hidden in a conversion.

## Build the planning journey

1. **Capture.** Ask for task, duration or effort if useful, dependencies, and whether the person means a date or an exact time. Avoid requiring precise times for flexible work.
2. **Clarify.** For a timed commitment, show the timezone and a readable interpretation. If a local time is ambiguous or unavailable, apply the chosen documented policy visibly before saving.
3. **Arrange.** Show an agenda, timeline, or grouped task list appropriate to the work. Conflicts and dependencies should be understandable without dragging blocks on a calendar.
4. **Review.** Present the proposed schedule, consequential changes, and actual reminder settings. A due date does not automatically mean a reminder has been created.
5. **Save.** Record the task version and schedule intent. Report a scheduling failure separately from successful task persistence.
6. **Act.** Let the person complete, defer, cancel, or reschedule deliberately. A reminder firing is not evidence that the task happened.
7. **Return.** Show overdue work, missed or failed reminders, and changed commitments. Do not flood the person with obsolete notifications when a concise catch-up view is more useful.
8. **Replan.** Preview the effect of shifting dependent tasks and obtain any required review before changing consequential commitments.

An agenda often works better than a full calendar on a phone. A team schedule may need simultaneous reference-zone and local-zone views. Both should preserve the same underlying intent.

## Use an explicit scheduling capability

A date in application data does not install a durable timer. The light host participant does not run application schedules, notifications or workflows. Store deadline and reminder intent through ordinary guarded commands, and connect an explicitly configured scheduling participant or external service when work must occur after tabs close.

The scheduler uses the same application query, command and operation model. It observes a declared time policy, uses stable occurrence identities, and submits a guarded occurrence command that checks the current schedule version and duplicate status. A durable record of schedule intent, actual scheduler enrollment, a due occurrence, an external notification receipt and human completion are separate observations.

Choose calendar semantics in the domain: a named time zone, interval versus wall-clock recurrence, ambiguous or nonexistent local times, missed occurrences and bounded expansion. Do not infer a universal cron, holiday or daylight-saving policy from the session API. Preview the actual next occurrences and expose unsupported rules.

## Choose lateness and delivery policy

A late reminder may still be useful, may coalesce several missed occurrences or may be skipped. Define the policy and record what happened without treating missing observation as task completion. A foreground timeout is suitable only when the promise explicitly ends with the active page.

Provider acceptance does not prove display or reading. Notifications can repeat after uncertain delivery, and unavailable delivery must leave the underlying task discoverable. Preserve the external action's stable identity and use its actual reconciliation support. An ordinary materialized occurrence is revisable when an earlier operation arrives, and a configured closed frontier can exclude late offline work; irreversible external work requires the selected protected boundary rather than automatic replay.

## Reschedule without conflicting intent

Capture the current schedule domain version with a coherent query. A schedule-change command validates the authenticated author, reviewed version and proposed rule before updating the domain record. The captured revision records what was reviewed and is not an order input; it does not replace the schedule guard. Use a stable operation ID, exact retry and journal inspection after a lost reply.

If the actual scheduler has separate state, confirm its accepted update and current schedule before claiming a reminder changed. Show partial progress explicitly. A rejected old operation cannot become a newly reviewed schedule merely because a quota, date or version changed. A future correction needs a new operation after review.

Local mute can stop sound immediately while a remote cancellation remains unresolved. An already dispatched provider request may still arrive after cancellation. Opening that notice should read current authorized task state and explain obsolete work; it must not restore an old schedule from a historical receipt.

## Make time usable and accessible

Show explicit dates near relative labels such as “tomorrow” or “in two hours,” especially in exports and handoffs. Make the reference zone visible where it matters. Provide keyboard-accessible date/time controls, a text agenda, and alternatives to drag-based rescheduling. Announce important deadline changes without reading a countdown every second.

Use distinct states for no deadline, scheduled, overdue, completed late, cancelled, and waiting on a dependency. Let the person record why a deadline moved if that context helps planning. Do not disguise overdue work by merely hiding it from today's view. A planning export should preserve date-only versus timed meaning, timezone, recurrence policy, and coverage of reminder history.

## Verify intent across clocks and interruptions

| Scenario | Expected observation |
| --- | --- |
| A date-only task is opened in another timezone. | Its calendar date remains intact under the declared planning context. |
| A calendar recurrence crosses spring or autumn clock changes. | Preview and execution follow the documented skip/first-occurrence policy. |
| The browser sleeps through several countdown ticks. | The displayed remainder is recomputed; no browser execution guarantee is invented. |
| A repeat is missed during service unavailability. | The selected `fire_once` or `skip` policy and history explain the result. |
| Task saving succeeds but reminder creation fails. | The UI reports both outcomes and offers a deliberate scheduling recovery. |
| A creation commits but its reply is lost, then the page reloads. | The persisted pending command keeps its CID and exact body; replay returns one timer, and the UI refreshes the current schedule. |
| A timer-slot or lifetime rejection is lost, then capacity or lifetime improves. | The original CID resumes the original proposal and its current outcome; only a newly reviewed command can schedule the reminder. |
| A queued cancellation is shown while offline. | It is labelled awaiting service; local mute works, and the UI does not claim the server timer stopped. |
| A deadline is moved after a push request was accepted. | Current task state is authoritative and any stale notice is understandable. |
| Two editors submit changes from the same timer revision. | One revision wins; the stale command is rejected without changing the winner or cancelling its pending notifications. |
| An alarm advances while an edit form is open. | The old revision is rejected; the page explains the new occurrence and retains the person's unsent proposal for review. |
| An accepted creation receipt arrives after its timer fired or was removed. | Historical acceptance is shown separately from the current list; the UI does not resurrect the old scheduled state. |
| A notification is accepted by its provider. | The page does not call it read, acknowledged, or task-completed. |

These are proposed adaptation checks grounded in the cited target contract. This guide remains explained reasoning; inspect the deployed artifacts and exercise actual service/device delivery before claiming that a particular planning page or notification path was tested.
