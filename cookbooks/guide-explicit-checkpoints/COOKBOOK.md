---
id: "guide-explicit-checkpoints"
title: "Guide a task with explicit checkpoints"
summary: "Separate task definition from progress, and choose intentional completion, resume, and replanning behavior."
group: "Guide and coordinate work"
tags: ["guidance", "progress", "replanning"]
choices: ["Checklist, focused step, or non-linear dependency view", "Manual completion, observed evidence, or reviewed inference", "Resume and replanning across definition revisions"]
capabilities: []
evidence: "explained"
related: ["choose-voice-interaction", "keep-task-active", "resume-across-sessions", "guide-practice-and-feedback"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hands-free-guide/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hands-free-guide/index.html"]
---

# Guide a task with explicit checkpoints

Use a guided flow when work has meaningful milestones and a person benefits from knowing what to do next: inspecting equipment, preparing an event, or completing a setup process. A checklist or one instruction may be enough. The goal is to make progress understandable and recoverable; a forced sequence should be justified by real dependencies.

For example, a field inspection might include identifying the item, recording an observation, taking optional evidence, and reviewing the result. Some steps depend on earlier facts, while others can be completed in any order. A useful guide explains that structure and lets the person pause without pretending unfinished work is complete.

## Design the first run and the return visit

1. **Orient.** Show the task, expected outcome, prerequisites, and a brief overview. Make required equipment or permissions discoverable before the person reaches a blocked step.
2. **Start deliberately.** Offer the next available step. Optional voice, sensing, fullscreen, or wake lock have their own explicit controls and useful manual alternatives.
3. **Do the work.** Show the instruction, why it matters, and the completion criterion together. Keep supporting detail available without burying the primary action.
4. **Record progress.** Capture the step ID and definition revision with the chosen evidence or confirmation. Distinguish a local draft, queued completion, accepted completion, and rejected outdated work.
5. **Choose what follows.** Offer the next dependency-ready step or a return to the overview. A blocked step should explain the missing condition and a useful alternative.
6. **Pause.** Preserve accepted progress and eligible local drafts. Show what remains and stop active acquisition/output according to the person's choice.
7. **Resume.** Present what was saved, what is still pending on this device, and what changed in the instructions. Do not restart sensors because they were active before.
8. **Finish.** Review skipped, unresolved, and completed items separately. A final receipt should describe the actual outcome rather than treating reaching the last screen as success.

A focused phone view can show one step and large controls. A desktop checklist can reveal dependencies and supporting evidence. Both can share semantics without requiring a universal workflow renderer.

## Separate the plan from progress

A definition describes steps, dependencies, completion rules, and its revision. Progress records what a person completed under that definition. Keep stable step IDs independent of display order or text. Reordering a checklist must not move a completion mark to a different action.

A progress fact can include the step identity, definition revision, completion basis, evidence reference if any, and accepted outcome. View position, expanded help, and a local draft belong elsewhere. A shared “current step” may be useful for a facilitator-led session; for independent work, separate each person's view position from authoritative task progress.

Definition revision and server concurrency generation solve different problems. A revision explains the instructions the person saw; a generation guards protected work against an authoritative reset or rebinding. Preserve the original command and guards when retrying. A replan must not silently stamp current context onto an old offline completion.

## Decide what counts as complete

| Completion basis | Appropriate use | Limit to expose |
| --- | --- | --- |
| Intentional manual confirmation | The person can reliably attest that an action is done. | A button press is their statement, not independent measurement. |
| Structured required input | A result needs fields or evidence before review. | Valid fields do not prove the underlying action happened. |
| Sensor observation | A meaningful measured condition supports progress. | Uncertainty, false positives, and unavailable sensors need explicit handling. |
| Reviewed agent inference | An agent proposes that available evidence meets a criterion. | Keep the proposal distinct from required human confirmation. |
| Trusted external receipt | Another system authoritatively completed a particular operation. | Bind the receipt to the exact task; transport success alone is insufficient. |

Choose the least burdensome basis that fits the task. Asking for a photograph at every step can create busywork and unnecessary retention. Conversely, a mere checkbox cannot stand in for an external action whose outcome must be verified. A proposed sensor match can enable “Review completion” without automatically advancing the person.

Define Back, Skip, Undo completion, and Stop separately. Back normally changes the view. Skip records a reason and may leave a prerequisite unmet. Undo completion is a new intentional correction, not deletion of all history. Stop ends the active session without necessarily abandoning the task. Labels and receipts should reflect those meanings.

## Handle replanning as a reviewable change

When instructions change, classify the impact. A spelling correction may preserve completion. A new optional step can appear without invalidating previous work. A changed requirement, replaced item, or altered dependency may need review. Show a concise difference and the affected progress rather than resetting every checkbox.

If a completed step is removed, retain its historical fact where the task's retention policy warrants it. If a step is split into two, do not infer that both new steps are complete merely because the old one was. Ask whether the prior evidence satisfies each new criterion. A reusable plan template is distinct from the record of one run; updating the template should not rewrite finished runs.

Allow the person to decline or defer a replan when continued work would otherwise lose context. Where an authoritative reset makes old work invalid, explain that boundary and preserve recoverable drafts for a deliberate new submission. Review source evidence before carrying facts into the new run.

## Keep the active experience usable

Show progress in meaningful terms: “3 of 5 required checks accepted; 1 optional check skipped” is more honest than a percentage that hides unresolved items. Do not include unavailable optional steps in a misleading completion denominator. Keep long instructions readable at zoom and offer keyboard-operable controls with clear names.

Avoid focus jumps when a remote update adds a step. For a deliberate Next action, move focus predictably to the next instruction. Spoken prompts need repeat, mute, and stop; they should not be the sole access to a requirement. If hands are occupied, a large manual control may be a better fallback than an unreliable always-listening mode.

Provide an overview, “Why am I blocked?”, and a way to report that an instruction cannot be followed. A person should not need to lie by marking a step complete just to escape a dead end. Help and escalation should preserve the current draft and task context.

## Verify progress under change

| Scenario | Expected observation |
| --- | --- |
| Reorder steps while a completion is pending. | Its stable ID keeps the command attached to the intended action. |
| Another device changes the definition before a submission arrives. | The original version remains visible; invalid work is rejected or explicitly reviewed. |
| Resume after a long interruption. | Saved progress, local pending work, and changed instructions are distinguished. |
| Deny an optional camera or microphone. | A valid manual path remains available when the task permits it. |
| A sensor briefly suggests completion incorrectly. | The chosen confirmation policy prevents an unexplained irreversible advance. |
| Remove or split the current completed step. | Historical facts remain attributable and new requirements are not auto-completed. |
| Skip a prerequisite and reach the end. | The final review reports unresolved work instead of claiming full completion. |
| Retry after an acknowledgement is lost. | The original outcome is recovered; progress is not counted twice. |

Use these scenarios to evaluate the chosen task policy. They are not evidence that a particular inspection, training, or safety procedure has been validated.
