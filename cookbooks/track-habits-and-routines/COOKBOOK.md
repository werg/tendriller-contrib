---
id: "track-habits-and-routines"
title: "Track routines without misleading progress"
summary: "Separate recurring intentions from observed completion, skips, corrections, reminders, and explicit day-boundary rules."
group: "Guide and coordinate work"
tags: ["routines", "scheduling", "progress"]
choices: ["Calendar-based occurrences or elapsed intervals", "Observed, skipped, unknown, and corrected outcomes", "Optional reminders with honest delivery state"]
capabilities: []
evidence: "explained"
related: ["guide-explicit-checkpoints", "choose-interruptions", "plan-time-and-deadlines", "resume-across-sessions", "localize-an-interaction"]
sources: ["https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/contract/v3.json", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PUSH_NOTIFICATIONS.md"]
---

# Track routines without misleading progress

Use this when a person wants to remember and review recurring intentions: a weekly equipment check, a language-practice session, or a household routine. The useful outcome is a clear view of what was planned, what the person reports doing, and what they want to adjust. A streak should not become an unexamined claim about effort, reliability, or wellbeing.

Begin with a small routine and a deliberate completion action. A calendar reminder or plain checklist may be sufficient. A richer tracker is useful when exceptions, partial work, schedule changes, history, and reflection make repeated work easier to manage.

## Create an intention the person can recognize

Ask what the routine means, when it is relevant, and what counts as completion. “Practice three examples” is more observable than “Be productive.” Let the person choose a modest target, optional note, and a flexible or timed window where useful. Avoid requiring personal details that do not serve the task.

Show the next few planned occurrences before saving. Make the time zone and day boundary explicit when they affect credit or reminders. A routine that belongs to a person's local day differs from an equipment check tied to a fixed site time zone.

| Recurrence choice | Useful when | Decision to expose |
| --- | --- | --- |
| Local calendar days/times | “On weekdays at 18:00” expresses the intention. | Time zone, travel, daylight-saving changes, and missed occurrences. |
| Elapsed interval | A duration since a previous anchor matters. | Whether the anchor is scheduled time or actual completion. |
| Flexible weekly target | Any chosen days can meet the goal. | Denominator, partial progress, and the review period. |
| Manual next occurrence | The person wants intentional planning. | No hidden automatic recurrence or reminder promise. |

A daily intention is not automatically “every 24 hours.” Choose the policy before generating occurrence IDs and summaries. When the person changes it, preview the future effect and retain earlier history under the policy that created it.

## Separate definition, occurrence, observation, and reminder

Use a stable routine ID with a definition revision. Each planned occurrence needs an identity independent of its position in a calendar. An observation records what the person reported for that occurrence, when it happened if supplied, when it was recorded, and any note or correction. Reminder runs have their own identities and delivery receipts.

| Status | Meaning in an example application |
| --- | --- |
| Planned | An occurrence exists and has no reviewed outcome yet. |
| Done | The person or an authorized source explicitly reported completion. |
| Partial | The chosen task supports a meaningful incomplete amount. |
| Skipped | The person deliberately chose not to do this occurrence. |
| Unknown | No reliable observation establishes an outcome. |
| Paused | The definition intentionally generates no ordinary expectation for that interval. |

These are page-owned labels, not core status enums. Do not infer completion from opening the page, dismissing a notification, sensor proximity, or an agent response. Likewise, no recorded completion is not proof the person failed to do the task. Late logging should identify the intended occurrence and preserve the difference between occurrence time and recording time.

## Make daily use lightweight and reversible

Show today's or the current window's intentions with **Done**, **Skip**, **Add note**, and an appropriate partial action. Provide a visible undo/correction route after accidental taps. A completion confirmation should name the routine and date/window so rapid actions cannot silently credit the wrong day.

A simple mobile list may be best during use; a weekly review can show history and schedule changes. Keep the entry interaction short, with detail available when needed. Let the person end a session or leave the page without losing a pending observation, and show whether it is only local, queued, or accepted.

When two devices edit the same occurrence, choose a revision or conflict policy. Repeating delivery of one completion must not create two completed occurrences. A conflicting Done and Skip should be reviewable rather than resolved by an unexplained last response. Preserve the original command identity and captured task context across retries using the [recovery guide](../recover-outdated-work/COOKBOOK.md).

## Treat reminders as an optional service

Offer reminders after the routine itself is useful. Explain the chosen time, device/audience, quiet behavior, and how to pause or stop. A reminder is an invitation to act, not evidence that action occurred. Keep notification text discreet where it might appear on a locked screen.

Tendriller's [public timer contract](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/EXPERIENCES.md#timers-that-survive-a-closed-page) distinguishes interval repeats from local clock-time repeats and exposes time zone and missed-run policy. Inspect the actual next occurrence and page lifetime before promising a schedule. The owner must claim the page. An application field containing a date does not create a service timer by itself; more elaborate recurrence rules need an explicit additional scheduling policy.

Use the [browser timer API](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md#durable-timers) once for each reviewed reminder choice. For example, with an initialized public `runtime`, this asks for a weekday equipment-check reminder in the site's zone:

```js
const result = await runtime.timers.create({
  title: "Review the equipment checklist",
  timezone: "Europe/Berlin",
  repeat: { at: "18:00", days: [1, 2, 3, 4, 5] },
  missed: "skip",
  notify: true,
});
```

The runtime creates and persists the CID and retries the exact command after a lost reply. Calling `create` again is a new intention, so do not use repeated calls as a retry loop. A `queued` result means “Routine saved; reminder request awaiting service.” Restore that pending view with `timers.pending()` and follow `timer_queue`/`timer_result`. An `accepted` result supplies the original timer receipt in `value`; keep its ID with the routine's reminder setting. A `rejected` result needs an actionable explanation. Routine persistence and reminder scheduling are separate outcomes.

Core retains timer-domain decisions such as `unclaimed`, `lifetime_required`, `quota`, and `timer_conflict`. Claiming the page, extending its lifetime, or changing its schedule cannot turn the same rejected CID into an accepted reminder. After resolving the cause, show current information and let the person review a new reminder call; the runtime creates its new CID. A replayed conflict describes the original rejection, not today's schedule. Current authorization and failures outside that receipt boundary remain distinct; use the runtime's pending/result status rather than assuming every HTTP failure was a saved timer decision.

Read `timers.list()` for current timer revisions and next occurrences, and `timers.history()` for runs. An accepted creation receipt may arrive after the timer already fired or was removed; it should not restore an obsolete scheduled indicator. When a scope binds `timer.write`, retain the reviewed `scope` and `expected_generations` in the timer operation's context. Agent/HTTP callers supply their stable CID and guards explicitly and retry the unchanged command.

The [durability contract](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/DURABILITY.md) persists timer occurrences and bounded notification intents, while delivery remains at least once. Use stable run identity when processing repeated notices; do not credit a duplicate notification as another completed routine. Provider acceptance is not a human read receipt or a device-display guarantee.

For push, verify service readiness and have each eligible owner device opt in through the [public notification flow](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PUSH_NOTIFICATIONS.md). Keep agent credentials private. Do not make foreground browser timers carry a promise that must survive a closed tab. Show unavailable, failed, or cancelled delivery separately from the routine's task state.

## Handle exceptions and changes humanely

Let the person pause a routine, skip a day, reduce a target, or retire it without erasing useful history. A routine's definition revision and its timer's revision describe different records. Use the timer revision that the person reviewed when changing a reminder:

```js
const result = await runtime.timers.update(
  reviewedTimer.id,
  { state: "cancelled" },
  { expected_revision: reviewedTimer.revision },
);
```

The same guard is required by `timers.remove(id, {expected_revision})` when retiring a reminder. Alarm advancement also increments timer revisions. If another device edits the schedule or an alarm fires first, `timer_conflict` leaves the current timer unchanged. Refresh the schedule, retain the proposed pause or revision, and ask the person to review what should happen next. Do not overwrite the new revision automatically or treat a conflict as a completed routine.

A pause should explain which future expectations stop and when they resume. If the routine is paused locally while its timer cancellation is queued, show both states and keep local mute available. Only an accepted timer edit cancels its outstanding notification intents; an already accepted provider request cannot be recalled. Cancellation and deletion leave useful occurrence history within its normal retention bounds, and neither erases recorded completion observations.

If a missed-run policy emits one catch-up notification, that does not mean all missed occurrences happened. Offer a compact review of unknowns instead of an automatic burst of overdue alerts. When travelling, changing a time zone, or crossing a daylight-saving boundary, show the next planned times and choose how existing occurrence identities are retained. A date correction is deliberate new work, not a retry silently moved into today's window.

## Present progress with an honest denominator

Show counts such as “3 reported complete of 4 planned this week, 1 intentionally skipped,” with the period and relevant policy. If a streak is useful, define how skips, pauses, unknowns, partial completions, and backdated corrections affect it. Recompute derived summaries from the recorded observations and policy; do not store a free-floating counter that can drift from history.

Offer a reflection prompt that helps adjust the routine: whether the time, size, or trigger fits the person's day. Avoid shame-based copy and default public rankings. A person's private routine history may reveal sensitive habits; choose retention and sharing deliberately, and allow an understandable export or deletion policy appropriate to the application.

## Acceptance scenarios

| Scenario | Expected observation |
| --- | --- |
| Midnight, travel, or a daylight-saving transition changes the displayed day. | The declared occurrence and day-boundary policy determines credit; reminder formatting does not move an observation silently. |
| Reminder creation commits but its reply is lost before a reload. | The restored command retains its CID and guards, yields one timer, and leaves completion counts unchanged. |
| A reminder is rejected before claim or lifetime extension, and its reply is lost. | Retrying that CID recovers the original rejection; a new reviewed reminder is needed, and routine completion history stays unchanged. |
| Two devices change the same reminder revision. | One change wins; the rejected proposal remains reviewable and does not cancel the winner's notification intents. |
| A reminder runs while its pause form is open. | The alarm's newer revision rejects an obsolete cancellation; a fresh review decides whether to cancel the current schedule. |
| Pause is requested offline, or a provider accepts a push before cancellation. | Local mute works; pending server cancellation and possible late notification remain clear; the task is not marked done. |
| A delayed accepted receipt arrives after removal. | Current `timers.list()` status stays authoritative; the routine does not show its old reminder as active. |
| A completion is replayed, corrected, or changed from Done to Skip on another device. | The observation's own identity and conflict policy prevent duplicate credit or an unexplained lost correction. |
| No observations exist for the review period. | The summary says unknown or unreported, with an honest denominator and accessible date labels. |

Also test keyboard completion, late logging, paused intervals, and unavailable push. These remain proposed adaptation checks under explained evidence; no activity metric in this guide establishes a health or learning outcome.
