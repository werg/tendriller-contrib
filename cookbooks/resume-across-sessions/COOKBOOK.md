---
id: "resume-across-sessions"
title: "Resume across devices and agent sessions"
summary: "Keep task context, consumer progress, view checkpoints, and device focus separate so a handoff does not skip work."
group: "Keep work dependable"
tags: ["handoff", "resume", "context"]
choices: ["Task brief, handled cursor, view checkpoint, or local draft", "Authorized cross-device state versus private unsent work", "Receiver identity and local consent after handoff"]
capabilities: []
evidence: "explained"
related: ["connect-resuming-agent", "coordinate-devices", "recover-outdated-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/control/experiences.ts"]
---

# Resume across devices and agent sessions

Use this when a task moves between devices or an agent conversation resumes after interruption. “Resume” can mean several different things; storing one generic cursor or session object rarely captures them all.

## Keep the right state in the right place

The task brief explains intent and current decisions. Authoritative progress records completed domain work. An event consumer's handled cursor records effects successfully performed. A stream-view checkpoint stores a materialized model with its cursor. Local drafts contain unsent work. Device focus chooses where presentation happens. None of these is a substitute for another.

Save context with the appropriate concurrency guard. If another agent or device updated the brief, review the new version before replacing it; an old saved summary should not overwrite current task decisions. Treat an event's validated generation context as authority for protected results, not an application-provided session label.

## Adapt the handoff

Choose what the receiving device needs. A new reader may need current authorized state and a fresh view rebuild, while the original device retains its private unsent draft. A replacement agent needs the task brief and handled checkpoint, then must attach and verify its own receiver identity. Do not assume a process attached to a departed conversation still wakes the new one.

Make incomplete history and unresolved pending commands visible. Do not resume sensors or speech automatically because another session once used them. Reestablish local consent, stop controls, and presentation focus on the active device.

## Verify

Crash before and after effect acknowledgement, resume with a stale task brief, reconnect a second device with an old draft, and replace the host conversation. Check that old protected commands remain stale rather than being rebound, that private cached records require current authorization, and that two receivers do not race one shared handled cursor without an explicit coordination design.
