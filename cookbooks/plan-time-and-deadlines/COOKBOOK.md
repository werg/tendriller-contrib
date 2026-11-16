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
sources: ["https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/contract/v3.json"]
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

## Use the actual durable timer contract

Core has real server timers; they are not browser `setTimeout` callbacks. The [public timer guide](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/EXPERIENCES.md) documents agent operations under `A/timers` and owner-page operations under `_tendril/timers`. The owner must claim the page, and the page lifetime must cover the schedule. A timer does not keep an expired ad-hoc page alive. Inspect the deployed limits and lifetime before offering a long-lived reminder.

For example, this documented calendar-timer shape expresses a weekday review in Berlin and asks core to calculate its first occurrence:

```json
{
  "title": "Review unresolved work",
  "timezone": "Europe/Berlin",
  "repeat": { "at": "09:00", "days": [1, 2, 3, 4, 5] },
  "missed": "fire_once",
  "notify": true
}
```

This is an example input to a supported timer operation, not a task schema or an assertion that a reminder has been created. Verify the returned timer ID and next occurrence. Omit `repeat` for a one-shot timer with the intended `due_at`; interval recurrence uses `every_minutes`. Calendar days use Sunday as zero. The public contract does not advertise arbitrary cron expressions, monthly recurrences, or holiday calendars; implement additional policies deliberately or choose a simpler supported schedule.

Core's calendar policy skips nonexistent spring-transition wall times and uses the first occurrence of a repeated autumn wall time once on that date. An explicit first `due_at` overrides the initially computed occurrence; the calendar rule controls later runs. Preview upcoming occurrences when the rule could surprise the person, and explain this behavior instead of implying all local-time intentions have the same interpretation.

## Choose lateness and reminder policy

Core's `missed:"fire_once"` coalesces missed repeating occurrences into one run before advancing to a future occurrence. `missed:"skip"` records an occurrence as skipped when it is more than two minutes late. Choose according to the task: an overdue review can still be useful, while a reminder for a concluded meeting may no longer help. Neither policy means the application can ignore the unresolved task itself.

Timer occurrence, agent processing, push delivery, and human completion remain separate records. The [durability contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md) records the occurrence/event/notification intent atomically, then delivers push through bounded retries. Its history reports delivery states and errors. Provider acceptance does not prove display or reading, and retries after uncertain outcomes can repeat delivery.

Use the stable timer run ID for retry-safe downstream work where the receiving service supports it. A timer event is ordinary page data; it does not automatically authorize an external action or make that action exactly-once. For notifications, verify service readiness and an eligible owner-device subscription through the [public notification contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md). Keep the underlying task visible if notification delivery is unavailable.

## Reschedule without creating conflicting intent

Keep the task's deadline, reminder policy, actual timer ID, and scheduling receipt distinct. Moving a deadline may require a timer update, but should not silently change an already completed task or unrelated recurrence. Show old and new interpretations before saving changes that affect collaborators or downstream actions.

Use the documented timer update/cancel operation for the known timer identity. Editing or removing a timer cancels its pending notification retries, but an already accepted provider request cannot be recalled. A stale notification should open current task state and explain the changed schedule. Cancellation does not erase occurrence history.

Do not assume timer creation or updates support arbitrary application revision guards or caller-supplied idempotency fields. Use the actual wire contract. If a creation reply is lost, reconcile existing authoritative timers before blindly creating another. For competing schedule editors, choose a single authoritative scheduling writer or deliberately implement the needed coordination; a browser read followed by a write is not atomic exclusion.

A foreground countdown should derive remaining time from the intended deadline, then refresh after suspension. Decrementing a local counter on every tick drifts when callbacks are delayed. The countdown can aid an active task, but durable execution belongs to the selected server mechanism.

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
| A timer creation reply is lost. | Reconciliation avoids an accidental duplicate timer. |
| A deadline is moved after a push request was accepted. | Current task state is authoritative and any stale notice is understandable. |
| Two people edit the schedule or a task is already complete. | The chosen coordination and completion policy prevents unexplained changes. |
| A notification is accepted by its provider. | The page does not call it read, acknowledged, or task-completed. |

This guide is explained reasoning grounded in the pinned public timer contract. Check the deployed descriptor and actual service/device delivery before claiming that a particular schedule or notification path was exercised.
