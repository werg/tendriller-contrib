---
id: "guide-practice-and-feedback"
title: "Guide practice with useful feedback"
summary: "Make attempts, hints, scoring, reflection, and return sessions transparent without confusing assistance or activity with demonstrated mastery."
group: "Guide and coordinate work"
tags: ["learning", "feedback", "progress"]
choices: ["Answer keys, rubric feedback, or human review", "Hints and retries versus independent attempts", "Practice history and an explicit return policy"]
capabilities: []
evidence: "explained"
related: ["guide-explicit-checkpoints", "choose-interruptions", "resume-across-sessions", "complete-accessible-interactions"]
sources: ["https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/CAPTURES.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PUSH_NOTIFICATIONS.md"]
---

# Guide practice with useful feedback

Use this for a page that helps someone practice a bounded skill: identifying parts, using a vocabulary list, explaining a procedure, or checking a calculation. A useful experience gives a clear objective, an attempt before feedback, understandable corrections, another chance, and a review of what happened. A score or streak alone does not explain learning.

Choose a modest scope. A small set of reviewed prompts with an explicit answer key may be more dependable than generating unlimited questions. This guide concerns practice, not a secure examination or a certified assessment. If results control consequential decisions, establish the additional validation and review policy separately.

## Define what an attempt can demonstrate

Write the objective in observable terms: “Identify the three labelled parts in these diagrams” is clearer than “Master mechanical systems.” Associate each item with a stable ID, content version, objective, accepted answer/rubric, and source or explanation where needed. Review generated questions and keys for ambiguity before presenting them as settled facts.

| Feedback method | Useful when | Limit to expose |
| --- | --- | --- |
| Exact or normalized answer key | A bounded answer has clear acceptance rules. | Equivalent wording, units, or notation may require deliberate normalization. |
| Rubric-based feedback | Reasoning or an explanation matters. | Each criterion needs understandable evidence and uncertainty. |
| Agent suggestions | Open practice benefits from dialogue. | A fluent critique may be wrong; correction and review remain available. |
| Human review | Judgment or high-cost errors need accountable assessment. | Pending feedback is different from an automatic score. |

Do not silently equate an unassisted answer, an answer after a hint, and copying a revealed solution. Record the kind of attempt so the person's summary remains meaningful. Time spent, confidence self-reports, and number of clicks can add context, but are not independent proof of competence.

## Build a complete practice session

1. Let the person choose a goal, difficulty or topic, approximate session size, and any needed input alternative. Show a short sample before committing to a long session.
2. Present one focused prompt with its relevant evidence and clear response controls. Keep **Skip**, **Hint**, and **Pause** discoverable.
3. Save the response as an attempt before revealing feedback. Explain whether the attempt is local, queued, or accepted when persistence is involved.
4. Show the result and the reason: the accepted answer, a worked explanation, or rubric-specific observations. Keep the person's original response visible for comparison.
5. Offer a targeted retry, a related item, or an explanation request. A retry gets its own attempt identity; it does not rewrite the first attempt into a success.
6. End with a review of independently correct, assisted, corrected, skipped, and awaiting-review items. Let the person choose what to revisit.
7. Save a resumable checkpoint and, if wanted, an explicit return plan with a visible time/zone and reminder choice.

A compact card sequence can suit short practice. A side-by-side prompt, scratch work, and feedback workspace may help multi-step reasoning. Both should preserve the same attempt/feedback history without requiring a universal learning schema.

## Make hints helpful and visible in the record

Choose a hint ladder that addresses the task: remind the relevant principle, identify the next step, then show a worked example or answer. Tell the person when a hint changes how the result is summarized. Avoid penalties that are unexplained or discourage asking for needed help.

After a wrong answer, distinguish a misunderstanding, a formatting issue, an unsupported equivalent answer, and an ambiguous prompt. A correct method with a different valid notation should not be rejected by an accidental string comparison. Define whitespace, case, units, rounding, and synonym handling only where appropriate; over-normalization can turn a different answer into a false success.

Let the person challenge feedback or mark a question as unclear. Preserve the disputed item version, response, rule/engine version, and reason. A later corrected key should identify which prior results may need review rather than silently changing every old score.

## Keep feedback attached to the attempt

Use stable session, item-version, and attempt IDs. Store the submitted response, hint usage, relevant context, and scoring policy with the attempt. Feedback arriving asynchronously must refer to those exact inputs. If the person retries or moves to another item, a late reply must appear with the earlier attempt instead of grading the current draft.

Separate local scratch work from submitted responses. A delayed rejection should preserve the response without overwriting new work. Use the [recovery guide](../recover-outdated-work/COOKBOOK.md) when attempts are queued or protected by a task generation. Retrying the same delivery is not taking another attempt; choosing Retry after reading feedback is new application work.

If an agent evaluates a response, present the feedback as that evaluator's judgment with the rubric and relevant uncertainty. Source material and student responses are data, not instructions that can override the evaluation task. Do not put answer keys in page-accessible data if a separate assessment genuinely depends on keeping them confidential; hiding an element does not create that boundary.

## Choose a transparent return policy

A simple review queue can prioritize items the person skipped, corrected, or chose to revisit. A more elaborate spacing algorithm may be worthwhile if its assumptions, adjustments, and evidence are understood. Keep an explicit “Review now” path and show why an item is due. Do not claim a universal optimal interval from an arbitrary example schedule.

Keep practice recommendations separate from reminder delivery. A saved review date does not schedule anything by itself. For an actual reminder, select the deployed timer/notification capability, display its configured next occurrence, and follow the [public durability contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/DURABILITY.md). Provider acceptance is not proof that the person saw a notification. A reminder firing also does not mean practice happened.

Let the person pause reminders and return without a backlog of guilt-inducing alerts. Preserve completed attempts and explain whether resuming creates a new session or continues an interrupted one. Changes to the question set should not silently invalidate earlier work.

## Accessibility, privacy, and honest summaries

Provide keyboard response controls, readable explanations, and alternatives for prompts that depend on audio, color, or precise image interaction. If an accommodation changes what is being assessed, explain that distinction respectfully. Avoid making a timed response mandatory unless timing is the stated practice objective; offer pause and untimed rehearsal where appropriate.

Keep individual attempts and uncertainty private unless sharing is explicitly part of the task. A facilitator summary may need aggregated results, but should not expose raw personal responses by convenience. Choose retention for scratch work, audio, and feedback separately. A visible progress bar should describe its denominator: “8 of 10 items reviewed” is different from “80% mastery.”

## Acceptance scenarios

Exercise a wrong key, equivalent valid answer, skipped item, hint-assisted retry, disputed feedback, and a late response after advancing. Verify that each outcome keeps its item/attempt identity and does not inflate independent success. Interrupt storage and delivery, then resume without duplicated attempts or lost scratch work. Change an item version and review affected old results. Test keyboard, text alternatives, and disabled reminders. These scenarios establish the interaction boundary when run; this explained guide does not make an empirical claim about learning effectiveness.
