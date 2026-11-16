---
id: "track-habits-and-routines"
title: "Track routines without misleading progress"
summary: "Separate recurring intentions from observed completion, skips, corrections, reminders, and explicit day-boundary rules."
group: "Guide and coordinate work"
tags: ["routines", "scheduling", "progress"]
choices: ["Calendar-based occurrences or elapsed intervals", "Observed, skipped, unknown, and corrected outcomes", "Optional reminders with honest delivery state"]
capabilities: []
evidence: "explained"
related: ["guide-explicit-checkpoints", "choose-interruptions", "resume-across-sessions", "localize-an-interaction"]
sources: ["https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/contract/v3.json", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md"]
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

Tendriller's reviewed [public schema](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/contract/v3.json) distinguishes interval repeats from local clock-time repeats and exposes time zone and missed-run policy. Inspect the deployed contract and actual next occurrence before promising a schedule. An application field containing a date does not create a service timer by itself. More elaborate recurrence rules may require application scheduling or a deliberately selected external scheduler.

The [durability contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md) persists timer occurrences and bounded notification intents, while delivery remains at least once. Use stable run identity when processing repeated notices; do not credit a duplicate notification as another completed routine. Provider acceptance is not a human read receipt or a device-display guarantee.

For push, verify service readiness and have each eligible owner device opt in through the [public notification flow](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md). Keep agent credentials private. Do not make foreground browser timers carry a promise that must survive a closed tab. Show unavailable, failed, or cancelled delivery separately from the routine's task state.

## Handle exceptions and changes humanely

Let the person pause a routine, skip a day, reduce a target, or retire it without erasing useful history. A pause should explain whether future occurrences and reminders are suspended and when they resume. Editing a timer cancels its outstanding notification intents under the public contract, but cannot recall a provider request already accepted.

If a missed-run policy emits one catch-up notification, that does not mean all missed occurrences happened. Offer a compact review of unknowns instead of an automatic burst of overdue alerts. When travelling, changing a time zone, or crossing a daylight-saving boundary, show the next planned times and choose how existing occurrence identities are retained. A date correction is deliberate new work, not a retry silently moved into today's window.

## Present progress with an honest denominator

Show counts such as “3 reported complete of 4 planned this week, 1 intentionally skipped,” with the period and relevant policy. If a streak is useful, define how skips, pauses, unknowns, partial completions, and backdated corrections affect it. Recompute derived summaries from the recorded observations and policy; do not store a free-floating counter that can drift from history.

Offer a reflection prompt that helps adjust the routine: whether the time, size, or trigger fits the person's day. Avoid shame-based copy and default public rankings. A person's private routine history may reveal sensitive habits; choose retention and sharing deliberately, and allow an understandable export or deletion policy appropriate to the application.

## Acceptance scenarios

Test midnight boundaries, travel/time-zone change, daylight-saving transitions, late logging, paused periods, and schedule edits. Verify which occurrence each observation addresses. Repeat a queued completion and conflicting two-device edits: no duplicate credit or lost correction should appear. Deny push, cancel a reminder during delivery, and close the page: status must distinguish persisted schedule, provider outcome, and unknown human action. Test keyboard use, clear date labels, and a week with no observations. These are proposed checks, and no activity metric in this guide establishes a health or learning outcome.
