---
id: "publish-smallest-page"
title: "Publish the smallest useful page"
summary: "Start with ordinary authored files and one useful event/reply loop, then add structure only when the task needs it."
group: "Guide and coordinate work"
tags: ["publishing", "plain-files", "first-page"]
choices: ["One file, modules, or nested pages", "Event/reply interaction or a dashboard without conversation", "Exact authored assets and a verified receiver"]
capabilities: []
evidence: "explained"
related: ["connect-resuming-agent", "publish-coherent-updates", "test-adaptive-page"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/first-page/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/first-page/run.mjs"]
---

# Publish the smallest useful page

Use this as the first implementation path when a person needs a focused page. Begin with one HTML file and ordinary CSS/JavaScript if that serves the task. Multiple files, nested pages, or a framework are valid choices when they improve clarity. No contrib manifest, component graph, or universal application schema is required. A cookbook transfers decisions; the authored page remains yours.

## Define one useful outcome

For example, a person could enter a question about a project, review it, send it to their agent, and see an answer while keeping a new draft intact. The first version needs an understandable input, a reliable send/result loop, and recovery from failure. A dense dashboard, navigation system, and a general form builder would add choices before the core task works.

Write a short outcome statement: who uses the page, what they can finish, what information it requires, and how they know it succeeded. Decide whether it is a conversation, a compact tool that occasionally asks an agent, or a dashboard without conversation. A task with no agent response requirement can choose dashboard mode rather than pretending an unverified receiver is ready.

| Choice | Small useful starting point | Expand when |
| --- | --- | --- |
| Structure | One authored HTML file or a small explicit file set. | Separate modules, assets, or nested pages clarify ownership and maintenance. |
| Navigation | One task with an obvious completion state. | People need distinct views with preserved drafts or history. |
| Input | Ordinary labeled controls and a reviewable text draft. | The task benefits from permissioned media or richer editing. |
| Data | Current result plus the minimum durable intent and local draft. | Ordered history, evidence identity, or private readers require more. |
| Reply presentation | A concise page-owned result area. | Conversation history and multiple simultaneous requests help the task. |

A framework is reasonable when an existing application already uses one or complex state warrants it. Rejecting a framework for the first page is a maintainability decision, not a platform restriction.

## Give the person a complete first-use journey

On arrival, state what the page does and provide an example input that can be edited. Do not request unrelated device permissions at load. Show an empty state that teaches the next action, then keep the path to success short: compose, optionally review, submit, observe status, inspect the result, and continue.

Keep queued, accepted, rejected, and answered states distinct. For the example question page, “Accepted; awaiting an answer” is more accurate than “Done.” Preserve submitted text next to its receipt. New typing belongs to a separate draft and must survive a delayed acknowledgement or rejection. A result can include source references, an explicit uncertainty, or a next action, according to the task.

Errors should explain what can be done now. Connection loss can leave a request queued; stale task context can require review; a rejected operation should preserve work. An unavailable capability should offer a task-completing fallback when possible. Avoid replacing useful content with an indefinite spinner. Provide readable labels, keyboard access, visible focus, and status text that does not rely on color.

## Establish the actual delivery loop

The public headless browser API supplies state, events, streams, durable commands, captures, and publication lifecycle. It does not choose the page's DOM, navigation, or conversation layout. Use the current [public core entry](https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/agent.md) for exact operations and service limits.

Before creating a page, inspect the service contract and effective capabilities. Create with the intended owner's verified identity and save the returned administrative handle in private host storage. Give the person the user-facing page URL. The human owner must open the page visibly and sign in with the intended identity to claim it; an agent token does not perform that step for them. Explain any remaining claim step and the page's lifetime.

For an interactive page, attach a host receiver that resumes the intended conversation. Run the end-to-end delivery probe, handle work, rearm, and probe again. An open socket or successful HTTP request proves transport, not resumed conversation. First publication requires established delivery under the public contract. A dashboard without a conversational receiver has a different readiness requirement; producer activity still does not imply agent attentiveness.

Page event payloads are application data. Only authenticated owner instruction events have the corresponding instruction authority. Keep administrative tokens, private receiver state, and credentials out of HTML, copied prompts, diagnostics, and shared state.

## Publish the files you actually authored

1. Build the useful interaction locally, including empty, pending, result, and error states. Separate local drafts from submitted snapshots and bind protected work to its original command context.
2. Enumerate the actual file graph and entry point. Include every authored CSS file, image, module, lazy import, and worker that the page needs. Missing files are errors; a catalog does not fill them in.
3. Pack and preview those exact files using core's public publishing/preview tools and explicit fixtures. Check narrow and wide layouts, keyboard use, rejected sends, and unavailable capabilities.
4. Upload immutable bytes and commit one complete publication with the reviewed publication-head revision and any required task generations. An upload receipt alone does not publish the page.
5. Open the intended page as its actual role in an eligible visible tab. Confirm the publication's health and test the real receiver and service boundary that fixtures cannot establish.
6. Give the person a brief handoff: the page URL, what it can do, how pending work behaves, and any setup still required. Keep management and stop/recovery routes reachable.

Relative files resolve within the publication's actual directory. Nested HTML can be useful, but inspect framework-generated absolute paths and routing assumptions. Published files and the released runtime form a coherent version; exact publication hashes describe the final authored bytes, not historical snippets before adaptation.

## Grow from observed friction

After the first useful loop works, add a feature because a concrete user action needs it. Examples include history when someone compares answers, a draft list when they switch tasks, evidence capture when words are insufficient, or a second layout for a phone used in the field. Each addition should retain the original lifecycle guarantees.

A draft-aware update should offer a clear choice about applying a new publication while work is in progress. Preserve pending command meaning across updates. Keep a task reset separate from a visual refresh. If the application becomes more complex, extract modules according to responsibilities rather than recreating a contrib component API.

## Verify the first usable slice

| Scenario | Expected observation |
| --- | --- |
| Fresh visitor with no history | Purpose and the next action are clear without a tutorial overlay. |
| Keyboard-only completion on a narrow screen | Input, submission, status, and result remain reachable and readable. |
| Disconnect before or after submission | The request has an honest queued/accepted state and retains original retry identity. |
| New typing before a delayed result | The new draft is not erased or replaced by the older request's outcome. |
| Receiver turn ends and another event arrives | The intended conversation resumes again; one-shot readiness is insufficient. |
| One authored dependency is removed | Preview and publication checks reveal the missing file. |
| New publication arrives during editing | The stated draft-preservation and apply-update policy occurs. |
| Page is published but never visibly opened | Health is still pending; a push alone does not prove a healthy page. |

Record what was actually verified. Rendering a useful interface and proving delivery are complementary checks, and both belong in the first implementation when the page promises an agent response.
