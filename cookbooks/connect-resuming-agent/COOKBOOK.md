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

Use this when a page expects an agent to respond after its current turn ends. A running process, HTTP success, or an open WebSocket proves only one transport stage. The person needs the intended conversation to resume, handle their request, and leave a useful outcome. If the host has no dependable wake mechanism, choose scheduled checks and disclose the resulting delay. A dashboard that needs no conversation can avoid this dependency.

## Design the person's delivery experience first

For a maintenance page, a person might send a question, return to their task, and come back when an answer is ready. Separate the states they can reasonably rely on: composing, queued on this device, accepted by the service, awaiting an agent, answered, and unable to deliver. “Sent” must not imply “read” or “finished.” A delayed reply should remain attached to the original request even if the user has moved to another task.

Provide a compact delivery panel with the last verified connection time, unresolved requests, and a recovery action. Keep private host session IDs and credentials out of that panel. When the receiver is unavailable, preserve accepted work and explain whether it will be retried, checked on a schedule, or requires reconnection. Do not make people resubmit because the agent is slow; duplicate requests create uncertainty about intent.

Offer explicit cancellation or supersession only if the application has a defined policy. Hiding a queued request locally does not cancel work already accepted or underway. A “This is no longer needed” message can be a new application event linked to the original request, with an honest pending outcome.

## Choose the host mechanism

| Host capability | Receiver shape | Verify |
| --- | --- | --- |
| Session queue or IPC | Persistent socket/poll receiver submits a count-only notice to an exact conversation ID. | Host admission, identity binding, restart, and acknowledgement after effects. |
| Background task completion | A bounded wait task ends when work is available. | Completion resumes the originating conversation and the agent rearms immediately. |
| Authenticated webhook or routine | Server wake notice routes to a known host session. | Authentication, delivery retries, and whether it starts a new session instead. |
| No idle wake | Scheduled queue checks. | The schedule remains active and the person knows the expected delay. |

Specific host products change. Read [core's bridge reference](https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/tools/AGENT_HOSTS.md) and inspect the actual installed host. Historical host documents explain patterns, not present-day feature availability. A detached watcher that only writes a log cannot arrange a future agent turn by itself.

Choose persistence deliberately. A short task may use a host-managed wait that must be rearmed; an ongoing task may justify a persistent service with a named owner, private installation path, restart policy, and teardown procedure. Do not claim a page is continuously monitored merely because its collector continues reporting measurements.

## Commission the complete path

1. Identify the page, intended host conversation, and authorized owner. Store the administrative handle privately, separate from published source and user-facing URLs.
2. Inspect the service contract and the host's supported admission mechanism. Set up the receiver against the exact conversation; refuse an accidental rebind to another session.
3. Restore the page-bound handled checkpoint or start from a deliberate initial position. A successful connection must also check already pending work, not wait only for a new notice.
4. Send an end-to-end delivery probe. End the current agent turn, confirm that the intended conversation resumes, and acknowledge through the probe's authenticated path.
5. Handle work, rearm or remain listening, and run a second probe. The second round detects one-shot integrations that appeared healthy during setup.
6. Send a real page request, observe the reply in the intended interface, and verify that a new draft typed during delivery survives. Record the tested receiver identity privately and expose a safe readiness summary.

First publication of an interactive page requires established delivery under the public contract. A readiness probe proves the tested path at that moment; it is not a guarantee that the host will never stop. Preserve monitoring and recovery after setup.

## Keep delivered and handled progress separate

Maintain receiver identity, private credentials, read/delivered cursor, and handled cursor separately. Wake notices should contain counts or safe pointers, not private page text. The resumed agent fetches the authorized queue and treats ordinary page events as application data. Only an authenticated owner `instruction` event carries owner-instruction authority; device purpose and payload labels do not promote other events.

Process batches in order under the selected consumer policy. Advance the handled checkpoint only after the corresponding replies, updates, or other required effects succeed. When one event fails, do not skip past it accidentally; use a documented retry, quarantine, or operator-resolution policy that retains its identity. Coalesce wake notices behind pending work while continuing to drain all read pages.

External side effects need their own deduplication or reconciliation. If a worker crashes after an external action but before acknowledgement, first find the action's authoritative result. Blindly repeating it is unsafe, while marking it handled without evidence loses the request. A durable Tendriller receipt does not make another system exactly once. A chart checkpoint is unrelated to this consumer acknowledgement.

Where multiple host processes can consume a queue, use the public named-consumer coordination when appropriate or an explicit single-owner design. Do not let two uncoordinated receivers overwrite one handled cursor. Keep checkpoint files page-bound and validate corruption or mismatch instead of silently resetting to the latest sequence.

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
