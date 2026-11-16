---
id: "coordinate-devices"
title: "Coordinate views and attention across devices"
summary: "Assign useful device purposes while keeping authority, freshness, focus, and completion receipts distinct."
group: "Guide and coordinate work"
tags: ["devices", "attention", "handoff"]
choices: ["Same view or complementary device purposes", "Targeted display versus authorized private access", "Audio focus, freshness, presentation, and completion"]
capabilities: []
evidence: "explained"
related: ["join-across-devices", "collect-private-responses", "resume-across-sessions", "hand-off-responsibility"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/app.js"]
---

# Coordinate views and attention across devices

Use several devices when they contribute different useful capabilities: a phone captures an inspection, a laptop compares evidence, and a shared display shows the reviewed result. If every device needs the same view, ordinary shared state may be sufficient. Each additional device adds connection, attention, and recovery costs; give it a purpose the person can explain.

This guide addresses an ongoing multi-device workspace. Use [joining across devices](../join-across-devices/COOKBOOK.md) for the arrival and transfer experience, and [resuming across sessions](../resume-across-sessions/COOKBOOK.md) for durable task and consumer checkpoints.

## Design the whole working session

Start with a two-device inspection. On the laptop, the person sees the task brief and outstanding evidence requests. On the phone, they see a short capture queue and a large local stop control. Both refer to the same inspection and exact evidence IDs, but their layouts serve different work.

1. **Join and identify.** Confirm the page, signed-in identity, and device label. Let the person choose a useful purpose such as “capture here.” Do not assume a newly joined device replaces the current one.
2. **Orient.** Show a small device roster with purpose, last contact, and relevant readiness. Distinguish “connected” from “camera active” and from “agent available.”
3. **Work.** The phone reviews and sends a particular image; the laptop receives the accepted image and its identity. A local preview remains local until submitted.
4. **Direct attention.** The agent or person can suggest the next useful view. A suggestion should not steal focus from a current edit, start a sensor, or make several devices speak simultaneously.
5. **Acknowledge meaningfully.** Show whether an item is queued, accepted, presented on a chosen device, or intentionally completed. The last two are separate facts.
6. **Continue after loss.** If the phone disappears, keep the accepted evidence and let another authorized device take over future capture. Do not invent missing local drafts or mark the original work complete.
7. **End.** Stop local acquisition/output, clear inappropriate private views, and leave a concise record of unfinished work. Closing the shared display does not necessarily end the inspection.

A three-device workshop uses the same distinctions: participant input, facilitator review, and public projection can have entirely different data access and interaction models.

## Purpose is not authority

| Concept | What it describes | What it must not imply |
| --- | --- | --- |
| Device purpose | Preferred interaction or layout | Permission to read private answers or approve work |
| Authenticated role | Service-authorized operations | That the device is currently attended |
| Presence/freshness | Recent connection or activity evidence | Current sensor availability or completed work |
| Attention/audio focus | A preferred destination for output | Exclusive authority, guaranteed playback, or proof of hearing |
| Presentation receipt | A particular result inserted into a view | Human reading, understanding, or approval |

The server authorizes reads and mutations. A label such as “facilitator” or “projector” cannot establish those rights. A targeted reply may still be shared data; routing is not private storage. A shared projection should fetch only intentionally public information, never obtain private responses and hide them with CSS. Re-read current device/role state after the public runtime reports a change and invalidate in-flight private views when authority changes.

Keep administrative handles and private agent credentials out of page links, device labels, QR codes, and shared state. Use the [public browser contract](https://github.com/werg/tendriller/blob/0c7b2d8e6b625609403bcf797d943f136d740a51/docs/BROWSER_API.md) for actual device and receipt semantics instead of inventing authority in application events.

## Route content to a task, not merely a screen

Bind every evidence request, annotation, and reply to the task and source version it concerns. If the phone captures a new frame while a laptop still displays the prior one, the old annotation remains attached to the prior frame. Show “Result for previous image” with a route back to it rather than overlaying the answer on current content.

Keep authoritative progress, local edit buffers, display selections, stream-view cursors, and agent handled-work cursors separate. Sharing one “current position” across all devices can move a reviewer away from a source or skip unhandled agent work. Synchronize a selection only when joint attention is the intended feature, and provide a local follow/pause control when independent inspection is useful.

For remote navigation, prefer an explicit suggestion such as “Open reviewed image on this device.” If automatic following is appropriate for a display, make the mode visible and interruptible. Keyboard focus should remain with the user's action; a remote update can refresh a result region without focusing it.

## Choose an output policy

One selected speaker avoids duplicate narration, but make the current destination visible and provide a local mute/stop that works without network cooperation. A focus transfer is a request, not a guarantee that the receiving device can play audio. If it is disconnected, muted, or denied playback, retain a readable result and show a useful status.

Decide whether speech interrupted by a handoff restarts, resumes from an application-supported checkpoint, or waits for explicit replay. Do not infer that the unheard remainder was delivered merely because the old device acknowledged the reply's visual presentation. For sensitive text, choose a private authorized view and consider whether spoken output is appropriate in a shared room.

Features such as device nicknames, “find this device,” synchronized selection, or a stale-device filter should reduce confusion. Avoid a control dashboard that requires more attention than the original task. Device names need a way to disambiguate two similar phones without publishing unnecessary personal information.

## Recover without fabricating completion

Freshness indicators should name their basis: last connection, last accepted capture, or last visible heartbeat if the application supplies one. Use a clear stale state after the chosen interval and explain that the interval is an application policy. Do not erase a device immediately during a short disconnect if queued work can still arrive.

Late work keeps its original task/version context. If the task has reset or authority has changed, a rejection needs an explanation and a route to review recoverable local content. Reassigning future work should not silently resubmit another device's private draft. Transfer unsent work only through an explicit authorized path with a receipt.

## Verify with independent devices

| Scenario | Expected observation |
| --- | --- |
| Two devices present the same reply. | Presentation is tracked by its real identity; neither event becomes human completion. |
| The audio-focus device disconnects and reconnects late. | The selected fallback is visible; duplicate speech does not start unexpectedly. |
| A display changes its purpose label to facilitator. | Server private-read and mutation permissions remain unchanged. |
| The phone sends a frame while the laptop has an older frame selected. | Replies and annotations stay attached to their exact sources. |
| A remote navigation arrives during typing. | The draft and keyboard focus remain intact; the suggestion is available separately. |
| One participant loses authority during a private read. | The view clears and delayed success or failure cannot restore private data. |
| One device finishes while another retains queued work. | Shared progress and the outstanding queue are both represented; neither is silently discarded. |

Test at least one narrow touch interface and one keyboard-driven view. These scenarios are adaptation requirements, not a claim that every device combination has been exercised.
