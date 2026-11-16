---
id: "coordinate-devices"
title: "Coordinate views and attention across devices"
summary: "Assign useful device purposes while keeping authority, freshness, focus, and completion receipts distinct."
group: "Guide and coordinate work"
tags: ["devices", "attention", "handoff"]
choices: ["Same view or complementary device purposes", "Targeted display versus authorized private access", "Audio focus, freshness, presentation, and completion"]
capabilities: []
evidence: "explained"
related: ["join-across-devices", "collect-private-responses", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/app.js"]
---

# Coordinate views and attention across devices

Use multiple devices when they perform different useful roles: a phone collecting evidence, a laptop reviewing it, and a shared display showing an approved result. If every device needs the same view, ordinary shared state may be sufficient. More devices add coordination costs; do not create roles without a task need.

## Separate purpose from authority

Device purpose and display targeting are routing hints. Authentication and server authorization determine who may read private records or mutate protected state. A message targeted to one device can still be shared data; do not use targeting as private storage. A public projection must fetch only the intended public aggregate.

Audio focus can avoid several devices speaking the same reply. It does not prove that a person heard it, nor grant the focus owner extra permissions. Choose whether a reply appears everywhere, speaks on one selected device, or waits for explicit playback. A local mute and stop remain available even when another device controls focus.

## Design handoff and completion

Show last-seen/freshness with device labels so a stale phone is not mistaken for an active camera. Bind annotations and replies to exact frame/task IDs. Distinguish a command sent, accepted by the server, presented by a device, and intentionally completed by the person. A semantic presented acknowledgement is useful for delivery state but is not a read receipt.

When handing off work, preserve the task brief and authoritative progress separately from local drafts, stream checkpoints, and event-consumer cursors. Transfer private unsent work only through an explicit authorized path. Provide a way to continue when a device disappears.

## Verify

Disconnect the focus device; reconnect it late; change a device purpose; target a reply to a stale frame; and render the same result on two devices. Try a display reading raw private responses. Check that permission does not follow labels, that speech does not duplicate unexpectedly, and that completion remains meaningful across retries and handoff.
