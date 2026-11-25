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
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/contract/v3.json", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PUSH_NOTIFICATIONS.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
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

The common session stores routine definitions and guarded observations. Durable reminders require an explicitly configured scheduling participant or external service; the light host does not run an application timer executor. Qualify the actual scheduler before offering a reminder that survives a closed page.

Keep routine identity, definition version, intended occurrence, reminder request and actual delivery receipt separate. The scheduling integration should use stable occurrence IDs and the same application command journal for domain observations. A delayed notification or its duplicate does not establish another completed routine. Read current schedule state at its actual authority before displaying an old receipt as an active reminder.

Preview time-zone and recurrence interpretation, including daylight-saving boundaries and missed-run policy. Unsupported calendar rules remain unsupported. Show unavailable, pending, failed and cancelled delivery independently from whether the routine was completed. Provider acceptance is not proof of display or a human response.

## Handle exceptions and changes humanely

Let the person pause, skip, reduce or retire a routine without erasing useful history. A guarded command checks the reviewed routine version and author, then records that domain decision. Exact retry retains the original operation; a changed definition requires new review. A scheduling service may need a separate accepted change, so show partial progress when that boundary is unresolved.

Local mute should work immediately while a remote cancellation waits. An in-flight provider request may still display. A late accepted receipt must not resurrect a schedule that was subsequently replaced. Read the current routine and actual scheduling state before showing the outcome.

A late earlier operation can revise a recent observation or scheduling outcome, and a configured closed frontier can exclude delayed offline work. Keep the original intent inspectable, rederive from a coherent snapshot and offer a deliberate new reviewed operation if still wanted; never retimestamp the old one. External effects follow their qualified action journal and protected boundary; do not blindly repeat them when a view rebuilds. Travel, illness or a changed goal should remain a meaningful domain adjustment, not a hidden failure or fictional completed day.

## Present progress with an honest denominator

Show counts such as “3 reported complete of 4 planned this week, 1 intentionally skipped,” with the period and relevant policy. If a streak is useful, define how skips, pauses, unknowns, partial completions, and backdated corrections affect it. Recompute derived summaries from the recorded observations and policy; do not store a free-floating counter that can drift from history.

Offer a reflection prompt that helps adjust the routine: whether the time, size, or trigger fits the person's day. Avoid shame-based copy and default public rankings. A person's private routine history may reveal sensitive habits; choose retention and sharing deliberately, and allow an understandable export or deletion policy appropriate to the application.

## Acceptance scenarios

| Scenario | Expected observation |
| --- | --- |
| Midnight, travel, or a daylight-saving transition changes the displayed day. | The declared occurrence and day-boundary policy determines credit; reminder formatting does not move an observation silently. |
| Reminder creation commits but its reply is lost before a reload. | The restored command retains its CID and guards, yields one timer, and leaves completion counts unchanged. |
| A reminder is rejected before claim or lifetime extension, and its reply is lost. | Retrying that CID resumes the original proposal and its current outcome; a new reviewed reminder is needed, and routine completion history stays unchanged. |
| Two devices change the same reminder revision. | One change wins; the rejected proposal remains reviewable and does not cancel the winner's notification intents. |
| A reminder runs while its pause form is open. | The alarm's newer revision rejects an obsolete cancellation; a fresh review decides whether to cancel the current schedule. |
| Pause is requested offline, or a provider accepts a push before cancellation. | Local mute works; pending server cancellation and possible late notification remain clear; the task is not marked done. |
| A delayed accepted receipt arrives after removal. | The actual current scheduling state stays authoritative; the routine does not show its old reminder as active. |
| A completion is replayed, corrected, or changed from Done to Skip on another device. | The observation's own identity and conflict policy prevent duplicate credit or an unexplained lost correction. |
| No observations exist for the review period. | The summary says unknown or unreported, with an honest denominator and accessible date labels. |

Also test keyboard completion, late logging, paused intervals, and unavailable push. These remain proposed adaptation checks under explained evidence; no activity metric in this guide establishes a health or learning outcome.
