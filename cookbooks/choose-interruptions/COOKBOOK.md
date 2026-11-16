---
id: "choose-interruptions"
title: "Choose when to interrupt"
summary: "Match quiet telemetry, agent wake, local cues, timers, and notifications to a meaningful decision point."
group: "Guide and coordinate work"
tags: ["notifications", "attention", "timers"]
choices: ["Quiet record, agent wake, local cue, timer, or push", "Coalescing, cooldown, and acknowledgement meaning", "Missed-time grace, time zones, and deduplication"]
capabilities: []
evidence: "explained"
related: ["detect-meaningful-changes", "connect-resuming-agent", "choose-voice-interaction"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/rules.ts", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/docs/EXPERIENCES.md"]
---

# Choose when to interrupt

Use an interruption when someone needs to act or notice something in time. Continuous telemetry generally should accumulate quietly. A threshold crossed once, a completed task, an explicit request, or an actionable failure may deserve attention. An interruption without a useful next action creates noise.

## Choose the recipient and mechanism

A page event, agent wake, local visual cue, local speech, durable server timer, and Web Push reach different recipients under different conditions. A foreground timer stops being dependable when the page is suspended. A server timer can persist independently but still needs an authorized recipient and delivery policy. Notification permission belongs to the device and must be requested intentionally; another device's preference does not grant it.

Separate detection from delivery. Coalesce repeated equivalent events behind a pending notice, choose a cooldown or hysteresis policy, and preserve enough state to explain what happened during suppression. Acknowledgement may mean delivered to a host, presented by a page, or intentionally acted on; name which one you have. Presentation is not proof of reading.

## Time and deduplication

The retired foreground rule used twenty-second ticks and a two-minute local-time grace window. Those constants described an approximate active-page policy, not a scheduler guarantee. Decide what happens after a missed time, a time-zone/DST change, and repeated reload. A local-date dedupe key differs from a UTC instant. If a change in rule content should rearm a one-shot action, include the semantic version/content identity deliberately. Do not retain an opaque browser rule language merely to encode this policy.

## Verify

Simulate bursts, prolonged threshold crossings, return below threshold, missing permission, device mute, background suspension, host absence, clock changes, and duplicate delivery. Check that the person sees current actionable information rather than a backlog of obsolete alerts. Local Stop and mute must work without network or agent cooperation.
