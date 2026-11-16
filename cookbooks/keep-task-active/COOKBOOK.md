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

Use screen wake lock when a person is actively following instructions or reading an instrument and automatic screen sleep would interrupt them. Do not keep the display awake simply because a page exists. A lock consumes resources and is not permission for background sensing or durable work.

## Choose the lifetime

Tie wake lock to an explicit task mode, such as “keep this guide visible while I work.” Acquire it only while the document is eligible and visible. Treat release as normal: the browser, system, battery policy, or a visibility change can revoke it. Reacquire on return only if the person's active choice still applies; do not turn a previous session's preference into silent new activity.

Fullscreen is a separate presentation choice. It may need its own gesture, can fail, and does not imply a wake lock. Give an obvious exit and a usable ordinary-page layout. The platform launcher or recovery route is not a substitute for an accessible application exit.

## Adapt and verify

Track requested state and actual lock state separately. Release on task end, cancel, or the chosen background policy. Avoid repeated acquisition loops after denial. Preserve the task's draft/progress before possible interruption and explain which work can continue on the server while the page is suspended.

Test denial, automatic release, visibility changes, task completion, and rapid toggles. Verify the display may sleep after Stop and that no sensor or timer is accidentally kept running by the wake-lock state. If work must run with the page closed, choose a server timer, collector, or other durable mechanism for that part.
