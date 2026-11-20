---
id: "connect-resuming-agent"
title: "Connect an agent that actually resumes"
summary: "Choose and verify a host receiver that wakes the intended conversation and acknowledges only handled work."
group: "Keep work dependable"
tags: ["agents", "delivery", "recovery"]
choices: ["Socket/IPC, wait task, webhook, or scheduled check", "Exact receiver identity and count-only wake notices", "Delivered versus handled checkpoints and rearming"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "resume-across-sessions", "choose-interruptions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/bridges/test/pending-events.test.mjs"]
---

# Connect an agent that actually resumes

Use this when a page expects an agent to respond after its current turn ends. A running process, HTTP success, or an open WebSocket proves only one transport stage. The person needs the intended conversation to resume, handle their request, and leave a useful outcome. If the host has no dependable wake mechanism, use an explicitly supported schedule with its disclosed delay, or let the person invoke the connected chat. A dashboard that needs no conversation can avoid this dependency.

An ordinary request to connect a page can use on-demand tools without this
background requirement. Start with [connected-app setup](../../guides/connected-app-setup.md)
and [assistant route choices](../connect-chatgpt/COOKBOOK.md). This cookbook's
automatic-delivery checks apply only when that capability is promised; opening
a native participant does not add a wake API to the surrounding chat host.

## Design the person's delivery experience first

For a maintenance page, a person might send a question, return to their task, and come back when an answer is ready. Separate the states they can reasonably rely on: composing, queued on this device, applied in the selected application history, awaiting an agent, answered, and unable to deliver. “Sent” must not imply “read” or “finished.” A delayed reply should remain attached to the original request even if the user has moved to another task.

Provide a compact delivery panel with the last verified connection time, unresolved requests, and a recovery action. Keep private host session IDs and credentials out of that panel. When the receiver is unavailable, preserve accepted work and explain whether it will be retried, checked on a schedule, or requires reconnection. Do not make people resubmit because the agent is slow; duplicate requests create uncertainty about intent.

Offer explicit cancellation or supersession only if the application has a defined policy. Hiding a queued request locally does not cancel work already accepted or underway. A “This is no longer needed” message can be a new application event linked to the original request, with an honest pending outcome.

## Choose the host mechanism

| Host capability | Receiver shape | Verify |
| --- | --- | --- |
| Session queue or IPC | Persistent WebSocket receiver submits a count-only notice to an exact conversation ID. | Host admission, identity binding, restart, and acknowledgement after effects. |
| Background task completion | A bounded WebSocket wait task ends when work is available. | Completion resumes the originating conversation and the agent rearms immediately. |
| Authenticated webhook or routine | Server wake notice routes to a known host session. | Authentication, delivery retries, and whether it starts a new session instead. |
| No idle wake, but supported scheduled execution | Explicitly configured queue checks. | The schedule remains active and the person knows the expected delay. |
| Neither idle wake nor scheduled execution | The person invokes on-demand tools or hands off the retained request. | The page shows the pending request and required manual action; it promises no unattended response. |

The agent is an application participant using the same owned session as browsers and other native peers. It reads coherent queries/events and observes session changes. A host adapter may turn a safe pending-work notice into an actual conversation wake, but it does not define another application event log, cursor HTTP service or WebSocket command protocol.

The [native session CLI](https://github.com/werg/tendriller/blob/ecf3851957d8089075fa95ff19c4eb3b08941363/docs/tools/CLI.md) loads an explicit module that opens the actual session. Use its query, events, watch and operation inspection commands for that application. A watcher that prints a line cannot itself arrange a future agent turn; inspect and test the actual host's admission mechanism.

Choose process ownership deliberately. A bounded task must be rearmed when it finishes; an ongoing participant needs durable device storage, a named owner, restart policy and teardown. Device identity and the command journal belong to the session. A measurement process continuing to run does not prove an agent conversation can resume.

## Commission the complete path

1. Identify the page, intended host conversation, and authorized owner. Store the administrative handle privately, separate from published source and user-facing URLs.
2. Inspect the service contract and the host's supported admission mechanism. Set up the receiver against the exact conversation; refuse an accidental rebind to another session.
3. Restore the page-bound handled checkpoint or start from a deliberate initial position. A successful connection must also check already pending work, not wait only for a new notice.
4. Submit a harmless probe command declared by the actual application through its ordinary session. End the current agent turn, confirm that the intended conversation resumes, reads the verified request and records its handling through the maintained journal.
5. Handle work, rearm or remain listening, and run a second probe. The second round detects one-shot integrations that appeared healthy during setup.
6. Send a real page request, observe the reply in the intended interface, and verify that a new draft typed during delivery survives. Record the tested receiver identity privately and expose a safe readiness summary.

Signed code publication and application-agent readiness are separate. Before promising an agent response, complete the actual two-probe rehearsal. A readiness result describes that tested moment; preserve monitoring and recovery afterward.

## Keep delivered and handled progress separate

Maintain receiver identity, private credentials, read/delivered cursor, and handled cursor separately. Wake notices should contain counts or safe pointers, not private page text. The resumed agent reads authorized application events and retains their verified signer provenance. The definition and explicit action policy decide which requests carry authority; topic names, device purpose and payload role labels do not promote ordinary data into instructions.

Process batches in order under the selected consumer policy. Advance the handled checkpoint only after the corresponding replies, updates, or other required effects succeed. When one event fails, do not skip past it accidentally; use a documented retry, quarantine, or operator-resolution policy that retains its identity. Coalesce wake notices behind pending work while continuing to drain all read pages.

External side effects need their own deduplication or reconciliation. If a worker crashes after an external action but before acknowledgement, first find the action's authoritative result. Blindly repeating it is unsafe, while marking it handled without evidence loses the request. A durable Tendriller receipt does not make another system exactly once. A chart checkpoint is unrelated to this consumer acknowledgement.

Use the maintained application/effect journal and actual device ownership rules for concurrent or restarted agents. Do not let multiple uncoordinated processes overwrite a handled position or invent a second checkpoint file beside the session. Recovery notices can abandon applied events: reversible computation may follow a declared rerun policy, while irreversible work requires an explicit protected checkpoint or independently durable action capability. The pinned sources record historical origins, not an alternate active bridge implementation.

## Recover and retire visibly

Distinguish temporary network loss from refused admission, expired authority, a replaced conversation, and corrupt local state. Use bounded retry/backoff for transient failures. Persistent refusal should produce an actionable status rather than an endless “Connecting” spinner. On session replacement, transfer the task brief and handled position, attach the new receiver, and repeat the two-probe check before promising responsiveness.

On deliberate teardown, stop the owned receiver, remove its binding, and describe what happens to pending requests. Rotate or revoke credentials only under the service's normal authorization policy. Leave useful task context and outcomes where their authorized readers can find them. Accessible status updates should announce major delivery changes without reading every retry or moving keyboard focus.

## Verify end to end

| Fault or transition | Expected observation |
| --- | --- |
| First probe succeeds, then the agent turn ends | A second probe still resumes the intended conversation after rearming. |
| Receiver restarts with old delivered state | Reads resume from handled progress; pending work remains visible. |
| Duplicate wake notices or more than one read page | Every event is handled under its identity; coalescing does not discard a page. |
| Host refuses admission | Handled progress does not advance; the delivery panel explains the blocked stage. |
| Crash after reply but before acknowledgement | Recovery reconciles stable outcomes and avoids a second unintended effect. |
| New draft while an old request is pending | Reply and receipt attach to the original request; current typing survives. |
| Credential revocation or wrong page checkpoint | Connection fails explicitly without exposing secrets or skipping work. |

Record the host, artifact revision, probe results, and remaining limits. Do not label a transport-only test as verified conversational delivery.
