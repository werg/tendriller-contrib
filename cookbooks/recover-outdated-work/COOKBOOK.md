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
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Recover from queued, repeated, and outdated work

Use this whenever a command can outlive the current connection or task revision. Network loss often happens after the server accepted work but before the browser saw its acknowledgement. Retrying should ask for the original result, not silently create a second action or rebind old intent to new state.

## Name the outcomes

Queued means the client has pending work, not that the server accepted it. Accepted means the server committed the command under its contract, not that an agent or external service completed every resulting effect. Rejected can arrive immediately or later after reconnect. A page should preserve enough context to explain each state.

**Platform invariant:** record the operation identity and relevant generations before sending protected work, and retain both for every retry. High-level capture owns its command IDs in the runtime; page-owned correlation IDs remain ordinary data. Reading the newest generation and attaching it to an old payload changes its meaning. After stale rejection, a person or agent may deliberately compose a new command from reviewed current state, with a new ID and context.

## Distinguish transfer from application acceptance

A byte upload has its own durable session and receipt. Completing that transfer does not mean a capture event, shared-file write, or publication switch was accepted. Preserve each operation's original identity across its own retries and show the application outcome that the person cares about. A successfully uploaded object may remain unattached when the later semantic command is rejected.

For a shared file, preserve the reviewed path revision. For a publication, preserve the reviewed publication-head revision. Preserve any relevant task generations as well. A reference conflict asks for a fresh review; it is not a transient upload error and must not trigger an automatic overwrite with newly fetched guards.

Bind a single-file task through the generic scope registry, using the complete canonical path as one path segment:

```js
{
  paths: [["files", "reports/field-notes.txt"]],
  operations: []
}
```

Path and operation bindings select commands independently. Adding `operations: ["file.write"]` also protects writes to every other shared file; it does not narrow the binding to that one path. Keep the file's revision guard and the selected scope generations in the original command. File metadata does not declare its own authoritative scope.

Retiring a scope invalidates commands that captured its old generation. It does not create a permanent access restriction or freeze the file. A newly reviewed deletion uses the current file revision and any remaining active guards through the ordinary file operation. Use the authorization model for access policy, and the scope registry for detecting outdated intent.

If a resume record represents specific bytes, changing those bytes creates new work. Keep the earlier result or failure available for reconciliation. The user may intentionally resubmit the edited content, but reusing the old command identity for it breaks receipt meaning.

## Keep drafts separate

Snapshot submitted text, evidence, and task identity. New typing belongs to a new draft while the original snapshot is pending. Clear only the submitted snapshot that was accepted; a delayed acceptance must not erase later typing. A delayed rejection should preserve rejected work without replacing the current draft. Recovery can offer comparison, copy, discard, or explicit resubmission according to the task.

Choose local persistence according to sensitivity and durability needs. An atomic record containing the complete pending command avoids partial recovery. Validate current-system persisted data; corrupt or unavailable storage should have visible behavior. No old-system migration is part of this design.

## Verify

Disconnect before send, after acceptance but before acknowledgement, and during evidence upload. Reset a protected scope while work is pending. Reconnect several times and verify stable IDs and original generations. Type a new draft before delayed acceptance/rejection. Crash after an external effect and use its explicit deduplication/reconciliation policy; a durable command receipt alone cannot prove exactly-once external execution.
