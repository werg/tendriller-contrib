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

Use this when a page expects an agent to respond after its current turn ends. A running process, an HTTP 200, or an open WebSocket is not evidence that the right conversation will resume. If the host has no dependable wake mechanism, use scheduled checks and state the resulting response delay.

## Choose the host mechanism

| Host capability | Receiver shape | Verify |
| --- | --- | --- |
| Session queue or IPC | Persistent WebSocket receiver submits a count-only notice to an exact conversation ID. | Host admission, identity binding, restart, and acknowledgement after effects. |
| Background task completion | A bounded WebSocket wait task ends when work is available. | Completion resumes the originating conversation and the agent rearms immediately. |
| Authenticated webhook or routine | Server wake notice routes to a known host session. | Authentication, delivery retries, and whether it starts a new session instead. |
| No idle wake | Scheduled queue checks. | The schedule remains active and the person knows the delay. |

Tendriller no longer offers HTTP long polling. `GET /events?after=<cursor>` is a nonblocking replay read, and `wait` (including `wait=0`) is rejected. Receive asynchronous wakes through the agent WebSocket, an authenticated webhook or an MCP Events subscription, then read the pending batch and acknowledge only after the work succeeds. The core `tendril-wait.mjs` and CLI `tendril wait` now use WebSockets; the shell long-poll helper was removed.

Specific host products change. Read the current core bridge reference and verify the actual installed host; historical host docs are evidence for the delivery pattern, not a current feature-support promise.

## Preserve delivered versus handled

Keep receiver identity, private credentials, read/delivered cursor, and handled cursor separately. A notice means work is available; it should contain a count or pointer, not raw private page content. The resumed agent reads the authorized queue, performs the intended effects, and advances the handled checkpoint only after those effects succeed. Reconnect from handled state and tolerate repeated notices. Coalesce notifications behind pending work without skipping unread events.

An external side effect still needs its own deduplication. Do not advance the handled cursor before a reply/update succeeds, and do not redo an uncertain irreversible effect blindly. A chart checkpoint is unrelated to this consumer acknowledgement.

## Verify end to end

Run a delivery probe through the actual server-to-host-to-conversation path, end the agent turn, and confirm the intended conversation resumes and acknowledges the probe. Repeat to prove rearming. Then try a real page event. Exercise admission failure, receiver restart, duplicate notices, a burst larger than one read page, network loss, and a crash after effects but before acknowledgement. Keep tokens out of URLs, logs, copied prompts, and browser code.
