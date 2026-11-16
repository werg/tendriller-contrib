---
id: "recover-outdated-work"
title: "Recover from queued, repeated, and outdated work"
summary: "Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action."
group: "Keep work dependable"
tags: ["commands", "generations", "drafts"]
choices: ["Queued, accepted, rejected, and completed are distinct", "Retry original context or deliberately compose new work", "Submitted snapshot separate from current draft"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "review-exact-proposal", "connect-resuming-agent"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md"]
---

# Recover from queued, repeated, and outdated work

Use this whenever a command can outlive the current connection or task revision. Network loss often happens after the server accepted work but before the browser saw its acknowledgement. Retrying should ask for the original result, not silently create a second action or rebind old intent to new state.

## Name the outcomes

Queued means the client has pending work, not that the server accepted it. Accepted means the server committed the command under its contract, not that an agent or external service completed every resulting effect. Rejected can arrive immediately or later after reconnect. A page should preserve enough context to explain each state.

**Platform invariant:** capture the command ID and relevant generations before starting protected work, and retain both for every retry. Reading the newest generation and attaching it to an old payload changes its meaning. After stale rejection, a person or agent may deliberately compose a new command from reviewed current state, with a new ID and context.

## Keep drafts separate

Snapshot submitted text, evidence, and task identity. New typing belongs to a new draft while the original snapshot is pending. Clear only the submitted snapshot that was accepted; a delayed acceptance must not erase later typing. A delayed rejection should preserve rejected work without replacing the current draft. Recovery can offer comparison, copy, discard, or explicit resubmission according to the task.

Choose local persistence according to sensitivity and durability needs. An atomic record containing the complete pending command avoids partial recovery. Validate current-system persisted data; corrupt or unavailable storage should have visible behavior. No old-system migration is part of this design.

## Verify

Disconnect before send, after acceptance but before acknowledgement, and during evidence upload. Reset a protected scope while work is pending. Reconnect several times and verify stable IDs and original generations. Type a new draft before delayed acceptance/rejection. Crash after an external effect and use its explicit deduplication/reconciliation policy; a durable command receipt alone cannot prove exactly-once external execution.
