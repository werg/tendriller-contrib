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

The page uses the public runtime's installed application backend, backed by its
owned Chronolog session. Commands, coherent queries, events, content and live
signals share that application identity. The page chooses its DOM, navigation
and conversation layout. See the [public core entry](https://github.com/werg/tendriller/blob/master/agent.md)
and [session CLI](https://github.com/werg/tendriller/blob/master/docs/tools/CLI.md)
for the actual operations. Historical `sources` above preserve provenance; they
are not current executable fixtures.

Inspect the service contract before creating the page. Save the returned
administrative handle in private host storage and give the person the page URL.
The intended human owner visibly signs in and claims the page. Explain its
lifetime and any remaining claim step. The application bootstrap explicitly
creates or resumes the signing device, establishes authorized membership and
keys, and opens the same application definition used by other peers. Page
ownership, a host token and application signing authority are distinct roles.

For a page promising agent responses, connect the agent's own session and test a
real command through its accepted result and correlated reply. End the agent's
turn, submit another request, and verify the deployment's actual wake/resume
mechanism. A published graph, open transport or accepted command does not prove
that a receiver will run. A dashboard can state its producer freshness without
claiming conversational readiness. Publication is a signed code operation; it
does not wait for an agent listener or manufacture a browser-health receipt.

Verify original signer provenance and application permissions before invoking
private tools. Text such as `role: "owner"` grants no authority. Keep host tokens,
signing keys, receiver state and private credentials out of HTML, shared history
and diagnostics.

## Publish the files you actually authored

1. Build the useful interaction locally, including empty, pending, result, and error states. Separate local drafts from submitted snapshots and bind protected work to its original command context.
2. Enumerate the actual file graph and entry point. Include every authored CSS file, image, module, lazy import, and worker that the page needs. Missing files are errors; a catalog does not fill them in.
3. Pack and preview those exact files. A live preview supplies its real application bootstrap through the public [preview tool](https://github.com/werg/tendriller/blob/master/docs/tools/PREVIEW.md). Check narrow and wide layouts, keyboard use, rejected commands, recovery and unavailable capabilities.
4. Read the current publication head, then use the session control participant to `preparePublication` and `publish` the complete signed graph. The session saves the exact signed intent under its operation ID. Retry that identity after a lost reply; a changed graph or stale predecessor requires a new reviewed publication.
5. Open the intended page as its actual role. Verify the selected authored assets and complete a real application action. Test login, receiver readiness and deployed connectivity separately from the publication receipt.
6. Give the person a brief handoff: the page URL, what it can do, how pending work behaves, and any setup still required. Keep management and stop/recovery routes reachable.

Relative files resolve within the publication's actual directory. Nested HTML can be useful, but inspect framework-generated absolute paths and routing assumptions. The signed manifest names the complete authored graph. The host may inject its separately released runtime into served HTML; verify authored content hashes and the runtime identity at their respective boundaries. Historical snippets are not the bytes of the adapted page.

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
| Page is published but never opened | The selected publication is known; browser execution and receiver readiness remain unobserved. |

Record what was actually verified. Rendering a useful interface and proving delivery are complementary checks, and both belong in the first implementation when the page promises an agent response.
