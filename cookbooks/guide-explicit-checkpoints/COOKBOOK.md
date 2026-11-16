---
id: "guide-explicit-checkpoints"
title: "Guide a task with explicit checkpoints"
summary: "Separate task definition from progress, and choose intentional completion, resume, and replanning behavior."
group: "Guide and coordinate work"
tags: ["guidance", "progress", "replanning"]
choices: ["Checklist, focused step, or non-linear dependency view", "Manual completion, observed evidence, or reviewed inference", "Resume and replanning across definition revisions"]
capabilities: []
evidence: "explained"
related: ["choose-voice-interaction", "keep-task-active", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hands-free-guide/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hands-free-guide/index.html"]
---

# Guide a task with explicit checkpoints

Use a guided flow when work has meaningful checkpoints and a person benefits from knowing what to do next. A checklist or single instruction can be enough. Do not turn every task into a forced sequence simply because a complete starter once did so.

## Separate plan and progress

A task definition describes steps and their dependencies; progress records what the person completed under a particular definition. Use stable step IDs and definition revisions. Reordering a display should not move completion to a different task. When the agent replans, decide which completed facts remain valid and ask for review where their meaning changed.

Choose what completion requires. A tap can be the right authoritative statement for a manual action. A sensor observation can support completion but may be uncertain. An agent's inference should not silently become the person's confirmation. Reviewed evidence is useful only where it reduces uncertainty enough to justify the extra interaction.

## Adapt the flow

Show one step at a time for focused mobile work, a full checklist for planning, or a dependency overview for non-linear tasks. Provide pause, back, skip, and stop only where their semantics are defined. Record completion through the appropriate protected command; retries must retain the original step/version context.

On resume, distinguish saved progress, unsent local work, and changed instructions. Never automatically start a microphone, camera, or wake lock because a task was previously active. Offer optional voice as a separate interaction with consent and a typed/manual fallback.

## Verify

Complete a step while another device replans; submit an old offline completion; reorder the list; remove the current step; and resume after a long interruption. Verify that completed work remains attached to the correct definition and that the person can understand conflicts. Test denial of optional evidence input without blocking a task that can still be completed manually.
