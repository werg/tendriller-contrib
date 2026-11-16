---
id: "choose-interruptions"
title: "Choose when to interrupt"
summary: "Match quiet telemetry, agent wake, local cues, timers, and notifications to a meaningful decision point."
group: "Guide and coordinate work"
tags: ["notifications", "attention", "timers"]
choices: ["Quiet record, agent wake, local cue, timer, or push", "Coalescing, cooldown, and acknowledgement meaning", "Missed-time grace, time zones, and deduplication"]
capabilities: []
evidence: "explained"
related: ["detect-meaningful-changes", "connect-resuming-agent", "choose-voice-interaction", "plan-time-and-deadlines", "track-habits-and-routines"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/rules.ts", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/DURABILITY.md"]
---

# Choose when to interrupt

Use an interruption when someone has a meaningful next action: review a completed result, respond to a blocked process, or notice a condition before it becomes irrelevant. Continuous telemetry usually belongs in a quiet history. A threshold crossing may merit attention; every sample above the threshold usually does not.

Start with the decision that the interruption should enable. For an experiment monitor, “Temperature exceeded the chosen band; inspect the setup” is actionable. “New data received” may add noise without helping. If no action is required, a changed status or a later digest can be sufficient.

## Design an attention journey

1. **Explain the condition.** Show what will trigger attention, who receives it, and which delivery mechanism is available. Let the person inspect example wording before enabling a disruptive channel.
2. **Choose preferences.** Offer relevant controls such as quiet hours, local mute, notification opt-in, or a digest. A preference on one device does not grant permission on another.
3. **Detect.** Evaluate the condition with its declared baseline, hysteresis, or schedule. Keep enough evidence to explain a trigger without retaining an unnecessary raw history.
4. **Create a notice.** Give the semantic occurrence a stable identity and task context. Coalesce equivalent updates into the notice when appropriate.
5. **Deliver.** Select a local cue, agent wake, durable timer action, or push according to the recipient and whether the page may be closed.
6. **Act.** Open the relevant current record and offer the intended decision. An old notice should explain that the condition has changed instead of encouraging obsolete work.
7. **Resolve or defer.** Acknowledge, snooze, dismiss, and complete mean different things; choose which the application needs and record their scope.
8. **Review.** Keep an accessible notice history or task inbox so missing a transient cue does not lose the work.

A compact instrument page may need one visible alert and local mute. A collaborative task queue may need ownership, escalation, and an audit of unresolved notices. Do not install the latter complexity into every page.

## Choose the recipient and mechanism

| Mechanism | Useful purpose | Boundary |
| --- | --- | --- |
| Quiet state or stream record | Preserve an observation for later inspection. | Recording does not establish that anyone noticed it. |
| Local visual cue | Help someone actively using the page. | It depends on the view being available and must remain understandable without color alone. |
| Local sound or speech | Attract attention during a deliberate active session. | Playback may be muted or unavailable; local Stop must remain effective. |
| Agent wake | Resume the intended connected host conversation for useful work. | A wake notice is not the person's notification or proof that work completed. |
| Durable server timer | Record a scheduled occurrence without a running page tab. | The task still needs an authorized receiver and declared missed-run policy. |
| Web Push | Notify an opted-in owner device while the page may be closed. | Provider acceptance is not guaranteed display or reading. |

The [public notification guide](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PUSH_NOTIFICATIONS.md) distinguishes service readiness, local permission, subscription, and server registration. Check service availability before inviting opt-in, request subscription from a deliberate user action, and offer a test. Keep private payload details out of notification titles and bodies, which can appear on a locked or shared screen.

Keep the underlying task durable where it matters. Push is a delivery channel, not the sole record of a required decision. A notification tap should load current authorized state rather than trusting stale payload text as the action to execute.

## Separate detection, suppression, and resolution

An alert policy might use an entry threshold, a lower reset threshold, a minimum duration, and a cooldown. Those are application choices with units and costs; see [meaningful change detection](../detect-meaningful-changes/COOKBOOK.md). Explain whether cooldown suppresses additional notices, delays them, or produces a summary. Do not silently drop an escalation that changes the required response.

A stable notice identity should represent a semantic occurrence, not merely its display text. Re-delivery of the same occurrence should not create a new task. Conversely, a second real incident with identical wording must not disappear because text matches. Version changed rules deliberately so an old acknowledgement cannot accidentally silence a new policy.

Choose what acknowledgement means. “Dismiss on this device” can be local presentation state. “I will handle this” assigns responsibility under an explicit policy. “Resolved” means the underlying condition or required work is complete. A presentation receipt only establishes that the application inserted a result into a view. Do not turn it into proof of reading or task completion.

## Handle time honestly

The retired foreground rule used twenty-second ticks and a two-minute local-time grace window. Those constants described an approximate active-page policy, not a scheduler guarantee. A page timer can be delayed or suspended; do not promise background execution by keeping a countdown visible.

For real scheduled work, use the [public browser timer API](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md#durable-timers) and inspect its [outbox and receipt policy](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/DURABILITY.md). Call `runtime.timers.create(settings, context)` once for a reviewed reminder. The runtime persists its CID, settings, and generation guards and retries that exact command after an uncertain reply. The server records one accepted timer for that identity. Agent/HTTP callers preserve the equivalent explicit command metadata themselves; a changed intention needs a new CID.

Creation, schedule changes, and notification delivery have different pending states. A mutation result with `status:"queued"` means the local command awaits a service outcome. Show that request through `timers.pending()` and its `timer_queue`/`timer_result` updates. `status:"accepted"` supplies the original receipt in `value`; refresh `timers.list()` for the current schedule. It may have advanced since that command was accepted. `status:"rejected"` calls for an explanation and a deliberate next action, not another click that silently recreates the same intention.

Recorded timer-domain rejections also survive lost replies. Removing an old timer after `quota`, extending lifetime, or changing the schedule after `timer_conflict` does not change the rejected CID's decision. Refresh current information, retain the proposed interruption, and offer a new reviewed call when appropriate; the runtime assigns a new CID. A replayed conflict's revision is historical. Current authorization and failures that prevent a receipt remain separate under the [receipt contract](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/DURABILITY.md#timer-mutation-receipts); a still-queued command has no resolved user-visible outcome yet.

When a due timer runs, core commits its occurrence and notification intent durably, then attempts push separately with bounded retries. `timers.history()` exposes delivery states including pending, sending, sent, failed, cancelled, and unavailable. A sent receipt reflects provider acceptance, and a retry can repeat an uncertain delivery. None of these states resolves the underlying notice or demonstrates a human response.

Choose whether a missed schedule should run late, be skipped, or be summarized according to the supported operation. A local calendar date differs from an absolute instant; specify timezone and daylight-saving behavior when the person's intent is calendar-based. Rescheduling should create a reviewable change to timing and cancel obsolete intent through the actual supported mechanism. An already accepted provider request may still appear after cancellation.

## Make snooze and cancellation dependable

For a one-shot reminder, a snooze can change its `due_at` and keep the same timer identity. Read its current revision, show the proposed return time, and submit `timers.update(id, {due_at: reviewedReturnTime, state: "scheduled"}, {expected_revision})` using the revision the person reviewed. Explicitly setting `state:"scheduled"` rearms a fired one-shot; changing its due time alone leaves it completed. Choose a new future due time, since restarting an already recorded occurrence returns `already_fired`. Cancellation changes `state` to `cancelled`; removal uses `timers.remove(id, {expected_revision})`. Revisions advance on both edits and alarm transitions, so a stale snooze cannot silently overwrite a reminder that ran or was changed on another device.

On `timer_conflict`, keep the person's requested snooze visible beside the refreshed schedule. Explain the difference and request a new decision before sending a new command. Do not refresh the revision automatically inside a retry. If `timer.write` is bound to a task scope, preserve its captured `scope`/`expected_generations` as well. Core checks the revision, generations, timer change, cancellation of outstanding notification intents, and receipt in one transaction; a rejected command leaves the existing reminder intact.

Make a recurring snooze's meaning explicit. Supplying a new next time to a calendar repeat leaves its clock rule to choose later runs; supplying it to an interval repeat shifts the interval anchor. If the person meant only to hide a local notice, use local presentation state instead of changing the schedule.

An offline Stop can silence local sound immediately while a server cancellation remains queued. Label both outcomes: “Muted here; reminder cancellation awaiting service.” Even after an accepted cancellation, an in-flight provider request may still display. Open current authorized task state from that notice and explain its obsolescence. Do not equate removing a timer with recalling a notification or deleting the unresolved task.

## Give people effective control

Place mute, Stop, and channel preferences where the interruption occurs. Local mute/Stop should work without the network or agent. State whether snoozing changes this notice, the condition, or the whole channel. Show the return time or trigger for snooze, and do not imply that hidden items are resolved.

For bursts, show one current actionable summary with an expandable count or timeline. On return from a long absence, summarize still-relevant work instead of replaying obsolete sounds. Keep an explicit route to suppressed history if it helps diagnosis. A simple “3 notices while you were away; 1 still needs review” is often more useful than three popups.

Use concise status text, keyboard-accessible actions, and a calm announcement policy. Reserve assertive announcements for conditions that justify interrupting the current interaction. A decorative flashing indicator should not be the only signal. Respect the person's reduced-motion and audio choices.

## Verify attention rather than just emission

| Scenario | Expected observation |
| --- | --- |
| A signal oscillates around the threshold. | The declared hysteresis/debounce policy avoids a flood while preserving meaningful transitions. |
| A condition remains active through cooldown. | The page explains suppression and whether further action is pending. |
| Push is unavailable, denied, or unsubscribed. | The task remains visible; the UI does not claim notifications are enabled. |
| The host is absent or the page is suspended. | Local cues, agent delivery, and durable work are reported separately. |
| Reminder creation is accepted but its reply is lost. | The original CID is retried, one timer exists, and the restored queue clears when its receipt arrives. |
| A conflict reply is lost, then the reminder changes again. | Replay returns the original rejection and observed revision; current listing guides a newly reviewed snooze with a new CID. |
| A completed one-shot is snoozed. | The reviewed update uses a new due time and `state:"scheduled"`; the same timer becomes scheduled again without rewriting its prior occurrence. |
| Two devices snooze the same reviewed revision differently. | One change wins; `timer_conflict` leaves the other proposal reviewable without cancelling the winner's notification intent. |
| An alarm fires before an open snooze form is submitted. | The timer's new revision prevents an unnoticed overwrite of its advanced schedule. |
| A delayed accepted receipt names a now-cancelled reminder. | The refreshed list controls current status; the old receipt does not re-enable its cue. |
| A notification is delivered twice or after cancellation. | Stable occurrence identity prevents duplicate work and current state explains the obsolete notice. |
| A user dismisses on one device. | The configured local/shared acknowledgement policy is visible and does not imply completion. |
| The clock or timezone changes. | Absolute occurrences and calendar intent follow the declared policy without accidental double firing. |
| Stop is pressed offline. | Local sound/speech stops immediately; queued remote cancellation remains visible until accepted or rejected. |

These are proposed adaptation checks. Actual closed-page push and host-resume claims require testing the deployed service and target devices, not only a browser fixture.
