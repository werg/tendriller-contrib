---
id: "discover-capabilities"
title: "Discover capabilities and design around them"
summary: "Distinguish API presence from usable permission and offer a task-completing alternative before requesting access."
group: "Choose inputs and algorithms"
tags: ["capabilities", "permissions", "fallbacks"]
choices: ["No-prompt observation versus a relevant permission request", "API presence, permission, hardware, and actual operation", "Fallbacks that complete the same task"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "choose-voice-interaction", "connect-instrument", "complete-accessible-interactions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/probe.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/playground.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/INPUTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/explore-device/index.html", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
---

# Discover capabilities and design around them

Use capability discovery when a page can accept information in several ways: a repair report may use a camera, an uploaded image, or a typed description. The person wants to finish that report. Discovery should reveal the best available route without turning first use into a tour of permission prompts.

Start with an interaction that works without optional access, then offer relevant enhancements. A device explorer can deliberately show a wider inventory, but a task page should surface only capabilities that change its next useful action. A missing sensor should disable that route, not the whole task.

## Model four different questions

| Question | What an observation can establish | What remains unknown |
| --- | --- | --- |
| Is an API present? | The browser exposes a relevant entry point. | Hardware, permission, context restrictions, and useful output. |
| What permission is known? | A queryable permission state at that moment. | Whether an operation will succeed or continue working. |
| Can the requested resource start? | A particular device/chooser operation succeeded. | Format suitability, measurement quality, or future availability. |
| Does it serve this task? | A reviewed sample is usable for the chosen purpose. | General support across devices or environments. |

The [public browser API](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md) exposes `tendril.capabilities()` for no-prompt observation and separate sensor lifecycle operations. Its report does not replace a real operation. Device capabilities also differ from installed service workflows: inspect the service descriptor before relying on a trusted server capability. A camera does not imply a private-record policy exists.

## Design the first-use journey

For a repair report, show **Describe the issue**, **Choose an image**, and optional **Take a photo**. Beside the camera action, say what the photo will help establish and that it can be reviewed before sending. Do not ask for microphone or location simply because they may be useful someday.

After a person chooses the camera, show a request-in-progress state without moving keyboard focus unexpectedly. If a chooser is cancelled, return to the same intact draft. If access is denied, explain the available file/text route and provide a deliberate retry action. Do not repeatedly prompt on rerender, reconnect, or a timer. If the hardware starts but the frame is unusable, offer camera selection, another attempt, or the fallback rather than reporting “supported” as success.

Let the person remember a preferred input route where appropriate, while keeping that preference separate from active-use consent. On the next visit, a preference may emphasize the photo button; it must not start capture. Explain changes in task language: “This camera is no longer available. Your note is still saved in this tab.” Avoid raw exception strings as the only recovery guidance.

## Use states that support a next action

A page-owned state model might distinguish `unknown`, `available-to-try`, `requesting`, `active`, `interrupted`, and `unavailable`, with a separate reason and observation timestamp. These are example application labels, not core enum values. Preserve permission state separately; an unavailable device is not necessarily a denied permission.

| State visible to the person | Useful next action |
| --- | --- |
| Availability not checked | Use the basic route or run a no-prompt check. |
| Available to try | Start the specific input from a deliberate gesture. |
| Waiting for selection or permission | Abandon the local attempt and keep the draft; the browser's chooser may still need its own cancellation. |
| Active | Complete the input, switch source, or stop. |
| Interrupted | Preserve any candidate and offer restart or an equivalent fallback. |
| Unavailable here | Explain the limitation and keep a task-completing route prominent. |

Keep active resource handles separate from this UI state. A remembered permission or requested state must never drive the active indicator. Observe actual tracks, watches, connections, and engine state; a resource can end after successful startup. Stop and release owned resources on cancellation, route exit, and the selected inactive-page policy.

Use `tendril.sensors.status()` for one coherent `{active, pending}` snapshot. `tendril.sensors.on(listener)` and the `sensors` event deliver snapshots of that shape when either set changes. Both fields contain sensor kinds, and one kind can appear in both when a resource is active and another acquisition is waiting. Keep **Stop sensors** available while either array is nonempty, including throughout an unanswered permission request. Reading or subscribing requests no permission.

`active` describes observed resources and registered watches/listeners; for a one-shot location read, a recent successful fix can appear there. `pending` includes wrapped media acquisitions and one-shot location reads awaiting a native result. An unanswered one-shot read remains pending until a result or Stop; invoking it alone is not active location use. A registered location watch or motion listener still does not establish permission or a usable measurement. Keep the task's candidate quality and permission observations separate from these status fields.

For a page-wide **Stop sensors** action, use core's [sensor cancellation boundary](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md): `tendril.sensors.stopAll()` stops tracked resources and immediately rejects pending wrapped camera/microphone/screen requests with `AbortError`. A browser-owned permission chooser may remain open; core stops any stream it grants afterward, including known captured track and stream clones. Pending one-shot location callbacks are abandoned without claiming the operating system cancelled its acquisition. A later deliberate acquisition is a new attempt.

Keep a task's draft identity and cancellation UI in the application, but do not rebuild that global acquisition-race protection in every page. Handle the aborted promise as a cancelled attempt without losing the draft. Stop all sensors only when that is the intended scope: cancelling one of several independent inputs should release that input's owned resources. Optional adapters and resources created outside the tracked browser APIs still need their own cleanup; instrumentation is not a security boundary or a way to dismiss native browser UI.

## Keep observations current across interruptions

Capability queries are asynchronous. Tag each refresh with a page-owned generation and discard results from superseded refreshes, identity changes, or disposed views. Otherwise a slow “available” result can overwrite a newer failure and invite an operation that cannot work.

Handle restoration of an existing page as well as fresh startup. On a persisted `pageshow`, reattach needed listeners and request a fresh no-prompt report; a restored JavaScript realm does not rerun startup. Detach listeners while suspended according to the page lifecycle. Refresh after a relevant failure or deliberate retry, rather than polling every capability continuously. Reobserving availability must not restart a camera, microphone, geolocation watch, or wake lock.

If a person changes input route, preserve the report/question and explicitly handle an in-progress candidate. Switching from camera to file should not discard a typed explanation. Decide whether an already captured candidate can be kept for review after the live device stops; resource shutdown and draft deletion are separate operations.

## Choose useful fallbacks

Match the alternative to the information needed. A file upload can replace live camera capture when appearance matters. A typed serial number may replace OCR. A manual “Arrived” checkpoint may replace uncertain location when the task only needs self-reported progress. If the fallback cannot establish the same fact, label that difference: a manually entered temperature is a person's report, not an instrument reading.

Use accessible control labels, visible focus, and text status so keyboard and assistive-technology users can finish the same task. Do not rely on a hover tooltip, vibration, or an icon to explain an unavailable route. Repeated state announcements should be limited to meaningful changes. Keep cancellation and basic input available while optional engine/model preparation runs.

Share diagnostics only when they help resolve a problem. Browser/device details and permission observations can reveal information about the person; avoid storing a comprehensive capability fingerprint in ordinary task records. Record the capability and failure relevant to the chosen route with a bounded lifetime.

## Acceptance scenarios

- Load and reload the page. No optional permission request or resource start occurs; the basic task is usable immediately.
- Remove the API, cancel a chooser, deny permission, and start without hardware. Each state offers a clear fallback and preserves existing work.
- Leave a media or one-shot location request unanswered. Its kind remains in `pending`, Stop stays available, and a request alone is not displayed as a successful acquisition. Another active sensor does not hide the pending request.
- Abandon a pending attempt, then grant its permission. Any late resource is immediately released, the active indicator stays off, and no candidate appears in the new task.
- Start successfully, then unplug the device or end its stream. The active indicator changes and a captured candidate remains reviewable if the chosen policy retains it.
- Resolve an old query after a newer failure or identity change. The old response cannot replace current state.
- Restore from browser history, switch routes, and retry with keyboard only. No duplicate listeners, silent capture restart, or lost draft appears.
- Provide an incompatible file or sensor format. The page distinguishes acquisition success from usable evidence and explains what to change.

Record actual browser/device conditions before claiming exercised support. Method presence and a mocked result remain narrower evidence than a successful task on the person's device.
