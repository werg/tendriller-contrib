---
id: "keep-task-active"
title: "Keep an active task usable"
summary: "Choose foreground wake lock and interruption behavior without promising background execution."
group: "Keep work dependable"
tags: ["foreground", "lifecycle", "wake-lock"]
choices: ["Ordinary screen behavior or explicit active-task wake lock", "Requested versus actual lock state", "Reacquisition, task stop, and background limits"]
capabilities: []
evidence: "explained"
related: ["guide-explicit-checkpoints", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/wakelock.js"]
---

# Keep an active task usable

Use a screen wake lock when someone is actively following instructions or reading an instrument and automatic screen sleep would interrupt the task. A recipe, inspection checklist, or foreground measurement view can benefit. Ordinary screen behavior is a good default for passive browsing or a task that can resume easily. Keeping a display awake consumes resources and does not grant background execution, sensor permission, or durable processing.

The finished experience should let the person choose an active mode, understand whether it is currently supported, stop it immediately, and recover work after normal interruption. A wake-lock toggle alone is not that experience.

## Make active mode a deliberate journey

1. **Offer the benefit.** Use task language such as “Keep these instructions visible while I work.” Explain that the option is for this active session and may increase battery use.
2. **Check availability.** Determine whether the required browser capability is available without presenting a misleading success state. Keep the ordinary task usable when it is absent.
3. **Request.** Acquire a lock only while the page is eligible and visible and the person's active choice still applies. Show a brief requesting state.
4. **Report.** Display the browser-reported result separately from the person's requested preference. A declined or released request should show a useful fallback, not leave an “On” indicator that implies a held lock.
5. **Continue.** Keep task progress and drafts independent of the lock. It helps presentation; it does not become the source of truth for whether an inspection is running or complete.
6. **Pause or leave.** Preserve appropriate work, release active resources according to their own policies, and make return behavior predictable.
7. **Resume.** Reassess visibility, current task identity, and the continuing choice before requesting again. A new session should not silently inherit active sensing or speech.
8. **Stop.** Release the requested lock, cancel pending acquisition intent, and let normal screen behavior resume. Stopping the display mode need not abandon the task.

A compact mobile guide can use one clearly labeled control. A desktop instrument panel may also show why the request became unavailable. Both should remain usable without fullscreen or wake lock.

## Track intent and browser-reported state separately

| State | Meaning for the person | Appropriate next step |
| --- | --- | --- |
| Off | No active request is wanted. | Start only through the chosen explicit control. |
| Requested | The person wants the display to remain active. | Attempt only when eligible; preserve a truthful pending status. |
| Held as reported by browser | A current lock handle has not reported release. | Keep a visible Stop action and listen for release. |
| Released | The browser or application ended the handle. | Explain normal interruption and reassess the continuing intent. |
| Unavailable or denied | This environment did not permit the request. | Offer ordinary-page continuation and an intentional retry if useful. |

The [Screen Wake Lock specification](https://www.w3.org/TR/2026/WD-screen-wake-lock-20261111/) requires visibility for screen locks and releases them when the document becomes hidden. A user agent can release a lock for system reasons; a handle is not a guarantee that the display will remain on against device policy. Implement and test the browser-reported lifecycle instead of promising absolute control of the screen.

A rapid on/off/on sequence can finish out of order. Associate each acquisition attempt with the current active-mode intent. If an old request resolves after Stop or after a different task begins, release that obsolete handle rather than resurrecting the mode. Remove obsolete release listeners and avoid several acquisition loops competing for the same session.

## Choose return and failure policy

Reacquisition on return can be convenient during one explicitly active session. Restrict it to the same still-active task and the person's continuing preference. After completion, cancellation, identity change, or a deliberate Stop, returning to the page should not restart it. Whether a long absence ends the active session is an application decision; define the duration or explicit resume action rather than guessing from a stale flag.

Do not retry in a tight loop after denial or a system release. A manual retry, a new visible-session transition, or another meaningful change can justify a fresh attempt. If the environment provides no useful reason, say that the request is unavailable instead of inventing a battery or permission diagnosis.

Save progress before the expected interruption where possible, and keep a recovery path for abrupt loss. Persistence itself can fail; show that outcome separately. A held display does not make a local draft durable, keep a connection alive, or prove an agent is attentive. On return, distinguish saved progress, unsent local work, and data that must be refreshed.

## Keep other active resources independent

Fullscreen is a separate presentation choice with its own request, denial, and exit behavior. It does not imply a wake lock. Keep an obvious application exit and a usable ordinary-page layout; a platform management link should remain available for recovery. Verify fullscreen behavior in the actual browser instead of coupling it to a successful wake-lock indicator.

Microphone, camera, location, motion, and spoken output need their own deliberate controls and cleanup. Ending active mode should say which of those it stops. If the application offers “Stop all active use,” connect that action to the relevant public sensor/adapter operations as well as the display mode. A wake-lock release event alone should not silently decide whether a recording is complete or whether a server process should be cancelled.

For work that must proceed with the page closed, use a suitable server timer, collector, or other durable mechanism for that part. The visible page can observe its state when it returns. A foreground countdown is a view over a deadline, not an execution engine; a continuously changing chart is a view over observations, not proof that acquisition continued during suspension.

## Useful features without resource surprises

A “Pause display mode” action is useful during a break. A concise session status can show elapsed active time or last saved progress, but should not imply battery measurement or guaranteed runtime. An optional reminder that active mode remains requested may help long sessions; avoid adding another disruptive notification system solely to support the toggle.

Keep labels readable at zoom and controls operable by keyboard and touch. Use text alongside any bright active indicator. Place Stop near the task controls so it remains findable in a focused or fullscreen layout. Preserve reduced-motion and local mute choices; “active” should not mean continuous animation or speech.

A display intended for a shared room should consider what stays visible during inactivity. Keeping a private screen unlocked or readable longer can be inappropriate for the task. Make that decision in the session design and access policy, not through an unexplained timeout default.

## Verify interruption and cleanup

| Scenario | Expected observation |
| --- | --- |
| Capability is missing or a request is declined. | The task remains usable and the status does not claim a held lock. |
| The page becomes hidden and returns. | Release is normal; reacquisition follows the declared continuing-session policy. |
| Stop occurs while acquisition is pending. | A late handle is released and active mode stays off. |
| Rapid toggles finish out of order. | Only the latest valid intent controls the current handle and indicator. |
| The task completes or identity changes. | Active mode ends and a later visibility event does not restart it. |
| Fullscreen fails or is exited. | The ordinary layout and Stop action remain usable; lock state is reported independently. |
| A draft save or network request fails. | The failure is visible despite the display remaining active. |
| A sensor continues after display mode ends. | Its independent active status and stop control remain clear under the chosen policy. |

Check the real target device's lifecycle as well as simulated events. This guide explains a foreground usability policy; it does not establish background execution or a guaranteed screen-on duration.
