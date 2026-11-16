---
id: "join-across-devices"
title: "Join or transfer a page across devices"
summary: "Choose role-aware links and a usable transfer method without turning device purpose into authority."
group: "Guide and coordinate work"
tags: ["devices", "links", "roles"]
choices: ["QR, typed link, or explicit device handoff", "Same page, participant view, or shared projection", "Authentication and draft-transfer policy"]
capabilities: []
evidence: "explained"
related: ["coordinate-devices", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/qr.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md"]
---

# Join or transfer a page across devices

Use a QR code or transfer link when moving a task from a large display to a phone, joining a workshop, or continuing a page elsewhere. A short typed link may work better when the camera is unavailable or scanning would disclose the screen to bystanders.

## Separate the link from authority

A QR encoder is an ordinary deliberate dependency; the resulting panel is application design. Use the service's intended viewer/join URL, not an administrative token or private agent handle. Understand what the target link grants, how authentication works, and whether copying it changes access. A device label such as “projector” or “camera” describes purpose and does not grant private-record access.

Choose the destination experience deliberately. A new device may need the same page, a participant form, or a read-only shared projection. The receiving page must obtain current authorized state; a handoff URL does not prove that a previous user's local draft belongs to the new identity. Keep private unsent drafts local unless the person chooses an authorized transfer.

## Adapt and verify

Provide a clear destination label, visible text link, and scanning instructions suitable for the actual screen. Use adequate contrast and quiet space around the code. Test at the real display size and distance. If scanning requires a browser API, check capability without prompting and request camera access only when the user starts scanning.

Try the link in a signed-out browser, a different account, a revoked role, and a device with no camera. Verify that no secret appears in QR contents, logs, screenshots, or copied instructions. Test expired/replaced publication behavior and explain how to resume when the original device disappears.
