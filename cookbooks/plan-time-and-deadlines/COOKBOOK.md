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
sources: ["https://github.com/werg/tendriller/blob/a9f310442e143258339781813bbd60adbbf7fd38/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/a9f310442e143258339781813bbd60adbbf7fd38/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md", "https://github.com/werg/tendriller/blob/a9f310442e143258339781813bbd60adbbf7fd38/contract/v3.json"]
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

Core has real server timers. The [public timer guide](https://github.com/werg/tendriller/blob/feat/core-cookbook-dx/docs/EXPERIENCES.md#timers-that-survive-a-closed-page) documents durable, guarded commands through the agent and owner-page interfaces. The owner must claim the page, and the page lifetime must cover the schedule. A timer does not keep an expired ad-hoc page alive. Inspect the deployed limits and lifetime before offering a long-lived reminder.

With the initialized public browser `runtime`, call [the timer API](https://github.com/werg/tendriller/blob/feat/core-cookbook-dx/docs/BROWSER_API.md#durable-timers) once when the person confirms a reviewed reminder. This example expresses a weekday review in Berlin and asks core to calculate its first occurrence:

```js
const result = await runtime.timers.create({
  title: "Review unresolved work",
  timezone: "Europe/Berlin",
  repeat: { at: "09:00", days: [1, 2, 3, 4, 5] },
  missed: "fire_once",
  notify: true,
});
```

The runtime owns and persists the command ID and retries the exact command after a lost response. `result.status` is `queued`, `accepted`, or `rejected`, with `cid` identifying this intention. For `accepted`, `result.value` is the timer receipt, including its ID and revision. For `queued`, show “Reminder request saved; awaiting service” rather than an enabled reminder. On return, `runtime.timers.pending()` restores the outstanding intents; `timer_queue` and `timer_result` keep that view current. Do not call `create` again to retry an already queued intention.

Use `runtime.timers.list()` to read the current schedule and lifetime, and `history()` for occurrences and delivery. An accepted receipt describes the original command: the timer may already have fired, advanced, or been removed when a delayed reply arrives. Refresh the list before presenting a recovered receipt as current scheduling status.

Core also retains valid commands rejected with `quota`, `lifetime_required`, `unclaimed`, `timer_conflict`, `not_found`, `already_fired`, or a semantic `bad_request`. Their exact retries return the original decision, even after a slot opens or the page lifetime changes. Error details describe that earlier decision, including its observed revision or expiration. Refresh the schedule, address the cause, and review a new intent before calling the browser method again; the runtime then creates its new CID. Current authorization, malformed-command, generation, transport, and receipt-storage failures have different [receipt boundaries](https://github.com/werg/tendriller/blob/feat/core-cookbook-dx/docs/DURABILITY.md#timer-mutation-receipts). Keep unresolved `queued` work visible until the runtime resolves it.

Omit `repeat` for a one-shot timer with the intended `due_at`; interval recurrence uses `every_minutes`. Calendar days use Sunday as zero. The public contract does not advertise arbitrary cron expressions, monthly recurrences, or holiday calendars; choose an additional explicit policy when those are needed.

Core's calendar policy skips nonexistent spring-transition wall times and uses the first occurrence of a repeated autumn wall time once on that date. An explicit first `due_at` overrides the initially computed occurrence; the calendar rule controls later runs. Preview upcoming occurrences when the rule could surprise the person, and explain this behavior instead of implying all local-time intentions have the same interpretation.

## Choose lateness and reminder policy

Core's `missed:"fire_once"` coalesces missed repeating occurrences into one run before advancing to a future occurrence. `missed:"skip"` records an occurrence as skipped when it is more than two minutes late. Choose according to the task: an overdue review can still be useful, while a reminder for a concluded meeting may no longer help. Neither policy means the application can ignore the unresolved task itself.

Timer occurrence, agent processing, push delivery, and human completion remain separate records. The [durability contract](https://github.com/werg/tendriller/blob/feat/core-cookbook-dx/docs/DURABILITY.md) records the occurrence/event/notification intent atomically, then delivers push through bounded retries. Its history reports delivery states and errors. Provider acceptance does not prove display or reading, and retries after uncertain outcomes can repeat delivery.

Use the stable timer run ID for retry-safe downstream work where the receiving service supports it. A timer event is ordinary page data; it does not automatically authorize an external action or make that action exactly-once. For notifications, verify service readiness and an eligible owner-device subscription through the [public notification contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md). Keep the underlying task visible if notification delivery is unavailable.

## Reschedule without creating conflicting intent

Keep the task's deadline, reminder policy, actual timer ID, and scheduling receipt distinct. Moving a deadline may require a timer update, but should not silently change an already completed task or unrelated recurrence. Show old and new interpretations before saving changes that affect collaborators or downstream actions.

Each timer's `revision` starts at 1 and advances on edits and alarm transitions. Preserve the revision that the person reviewed, including while they edit a form. For an existing `reviewedTimer`, cancellation is:

```js
const result = await runtime.timers.update(
  reviewedTimer.id,
  { state: "cancelled" },
  { expected_revision: reviewedTimer.revision },
);
```

Removal uses `runtime.timers.remove(id, { expected_revision })` and returns an accepted deletion receipt in `value`. A second editor or an alarm may have changed the revision first. `timer_conflict` then rejects the stale command atomically; show the current schedule beside the retained proposal and let the person decide again. Do not automatically substitute a newer revision. Competing clients use these core preconditions without a single scheduling writer.

When a task scope protects `timer.write`, capture its original generations with the reviewed intention and pass `scope`/`expected_generations` in the browser context. Stale generations require renewed review too. Agent SDK and HTTP callers supply `cid`, `expected_generations`, and the reviewed revision explicitly; retain that complete command for exact retries. Reusing a CID for different work returns `command_conflict`.

An accepted edit or deletion cancels outstanding notification retries in the same transaction. A queued cancellation has not yet stopped server work, and an already accepted provider request cannot be recalled. Local mute remains immediately available. A stale notice opens current task state and explains the changed schedule; cancellation does not erase occurrence history.

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
| A creation commits but its reply is lost, then the page reloads. | The persisted pending command keeps its CID and exact body; replay returns one timer, and the UI refreshes the current schedule. |
| A timer-slot or lifetime rejection is lost, then capacity or lifetime improves. | The original CID recovers the original rejection; only a newly reviewed command can schedule the reminder. |
| A queued cancellation is shown while offline. | It is labelled awaiting service; local mute works, and the UI does not claim the server timer stopped. |
| A deadline is moved after a push request was accepted. | Current task state is authoritative and any stale notice is understandable. |
| Two editors submit changes from the same timer revision. | One revision wins; the stale command is rejected without changing the winner or cancelling its pending notifications. |
| An alarm advances while an edit form is open. | The old revision is rejected; the page explains the new occurrence and retains the person's unsent proposal for review. |
| An accepted creation receipt arrives after its timer fired or was removed. | Historical acceptance is shown separately from the current list; the UI does not resurrect the old scheduled state. |
| A notification is accepted by its provider. | The page does not call it read, acknowledged, or task-completed. |

These are proposed adaptation checks grounded in the cited target contract. This guide remains explained reasoning; inspect the deployed artifacts and exercise actual service/device delivery before claiming that a particular planning page or notification path was tested.
