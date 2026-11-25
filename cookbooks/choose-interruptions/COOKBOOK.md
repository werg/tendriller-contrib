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
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/rules.ts", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/EXPERIENCES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
---

# Choose when to interrupt

Use an interruption when someone has a meaningful next action: review a completed result, respond to a blocked process, or notice a condition before it becomes irrelevant. Continuous telemetry can use quiet live signals when only current conditions matter, or retained history when later inspection matters. A threshold crossing may merit attention; every sample above the threshold usually does not.

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
| Ephemeral signal | Update a live display or deliver a disposable attention cue. | No offline replay, retained task, durable acknowledgement or finality; use expiry and a bounded consumer. |
| Quiet state or stream record | Preserve an observation for later inspection. | Recording does not establish that anyone noticed it. |
| Local visual cue | Help someone actively using the page. | It depends on the view being available and must remain understandable without color alone. |
| Local sound or speech | Attract attention during a deliberate active session. | Playback may be muted or unavailable; local Stop must remain effective. |
| Agent wake | Resume the intended connected host conversation for useful work. | A wake notice is not the person's notification or proof that work completed. |
| Durable server timer | Record a scheduled occurrence without a running page tab. | The task still needs an authorized receiver and declared missed-run policy. |
| Web Push | Notify an opted-in owner device while the page may be closed. | Provider acceptance is not guaranteed display or reading. |

The [public notification guide](https://github.com/werg/tendriller/blob/master/docs/PUSH_NOTIFICATIONS.md) distinguishes service readiness, local permission, subscription, and server registration. Check service availability before inviting opt-in, request subscription from a deliberate user action, and offer a test. Keep private payload details out of notification titles and bodies, which can appear on a locked or shared screen.

Keep the underlying task durable where it matters. Push is a delivery channel, not the sole record of a required decision. A notification tap should load current authorized state rather than trusting stale payload text as the action to execute.

Use the [live-signals guide](../share-live-signals/COOKBOOK.md) for presence,
progress, typing or a temporary “look here” cue. The durable server timer and Web
Push paths described below belong to the hosted application backend. A peer
application records required timer intent in its own history and uses a
designated final-intent worker; it does not start the hosted application writer
to deliver an optional live cue.

## Separate detection, suppression, and resolution

An alert policy might use an entry threshold, a lower reset threshold, a minimum duration, and a cooldown. Those are application choices with units and costs; see [meaningful change detection](../detect-meaningful-changes/COOKBOOK.md). Explain whether cooldown suppresses additional notices, delays them, or produces a summary. Do not silently drop an escalation that changes the required response.

A stable notice identity should represent a semantic occurrence, not merely its display text. Re-delivery of the same occurrence should not create a new task. Conversely, a second real incident with identical wording must not disappear because text matches. Version changed rules deliberately so an old acknowledgement cannot accidentally silence a new policy.

Choose what acknowledgement means. “Dismiss on this device” can be local presentation state. “I will handle this” assigns responsibility under an explicit policy. “Resolved” means the underlying condition or required work is complete. A presentation receipt only establishes that the application inserted a result into a view. Do not turn it into proof of reading or task completion.

## Handle time honestly

A foreground timer can change attention while the page is active; it cannot promise a future interruption after the page closes. For durable reminders, declare scheduling intent through common application commands and configure an actual scheduling participant or external service. The selective host provides no default application timer or push executor.

Choose the clock, time zone, recurrence and missed-occurrence policy explicitly. Record a stable occurrence identity, the relevant schedule version, the scheduler's observed outcome and external delivery separately. A service acknowledgement does not prove a notification was displayed or read. Keep unresolved work visible when delivery is unavailable.

Application scheduling state is revisable like other domain data: an earlier arriving operation can change it and a configured closed frontier can exclude delayed offline work. A rederived projection must not dispatch an irreversible notification or external action blindly. Use an explicitly qualified protected or durable action boundary for that effect, including original requester authority and deduplication.

## Make snooze and cancellation dependable

Decide whether snooze changes a local notice, the domain reminder or a provider schedule. Show the reviewed return time and scope. A guarded command must check the original schedule version and author authority; exact retry preserves its operation identity. If the domain changed, keep the requested snooze beside the current schedule for a new decision.

When a separate scheduler must be updated, show that outcome independently from saving application intent. Local mute remains immediate without network access. “Muted here; schedule change pending” is honest when the remote outcome is unknown. A provider request already in flight may still arrive; cancellation is not a recall guarantee or task completion.

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
| Two devices snooze the same reviewed revision differently. | One change wins; a schedule-version conflict leaves the other proposal reviewable without cancelling the winner's notification intent. |
| An alarm fires before an open snooze form is submitted. | The timer's new revision prevents an unnoticed overwrite of its advanced schedule. |
| A delayed accepted receipt names a now-cancelled reminder. | The refreshed list controls current status; the old receipt does not re-enable its cue. |
| A notification is delivered twice or after cancellation. | Stable occurrence identity prevents duplicate work and current state explains the obsolete notice. |
| A user dismisses on one device. | The configured local/shared acknowledgement policy is visible and does not imply completion. |
| The clock or timezone changes. | Absolute occurrences and calendar intent follow the declared policy without accidental double firing. |
| Stop is pressed offline. | Local sound/speech stops immediately; queued remote cancellation remains visible until accepted or rejected. |

These are proposed adaptation checks. Actual closed-page push and host-resume claims require testing the deployed service and target devices, not only a browser fixture.
