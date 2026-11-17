---
id: "recover-outdated-work"
title: "Recover from queued, repeated, and outdated work"
summary: "Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action."
group: "Keep work dependable"
tags: ["commands", "generations", "drafts"]
choices: ["Queued, accepted, rejected, and completed are distinct", "Retry original context or deliberately compose new work", "Submitted snapshot separate from current draft"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "review-exact-proposal", "connect-resuming-agent", "work-offline-and-reconnect"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md"]
---

# Recover from queued, repeated, and outdated work

Use this whenever a command can outlive its current connection or reviewed task. A peer may apply work before the requester receives its reply. Exact retry should recover that operation, not create another action or attach old intent to a different question.

## Make pending work understandable

Imagine an inspector sends a note, starts another draft, and later learns that the task changed while the first note waited. Keep both pieces of work, explain the original context, and offer a reviewed path forward. An endless spinner or silent resubmission would hide that meaning.

Use a per-request activity list with a readable snapshot, stable operation ID, original task version, actual outcome and useful next action. It is a view of the session journal, not another delivery queue. Reauthorize before showing sensitive payloads.

| Observation | Honest meaning | Next action |
| --- | --- | --- |
| Saved locally | The signed attempt is durable on this device. | Wait, inspect or retry that operation; do not imply remote execution. |
| Applied accepted | The command executed successfully in the selected history. | Show its receipt and any separately required follow-up. |
| Applied rejected | The definition rejected the original intent. | Preserve the snapshot and review current domain state. |
| Shared coverage | Another peer retained the covered prefix. | Show coverage separately from execution and recovery policy. |
| Abandoned by recovery | The selected history excludes that attempt. | Inspect what was lost and deliberately reapply only after review. |
| External outcome unknown | Another system may have performed an action. | Reconcile its original execution identity before another dispatch. |

Neither `applied()` nor `shared()` is irreversible finality. A Retry button resumes the exact saved attempt. “Use this in the current task” means newly reviewed intent with a new identity. Keep those meanings distinct, and preserve unresolved work when an automatic retry budget ends.

## Use one maintained journal

The owned application session persists command identity, signed inputs and captured application context before delivery. Browser and native applications use that same contract. Restore the operation list through `session.operations`, query an original operation by ID, and use `session.retry(operationId)` after a lost reply. Do not reconstruct a command from whichever form fields are currently visible.

A coherent `session.query` returns an application revision with its value. Retain that revision as `basedOn` and retain the domain versions the command must check. The revision is an ordering prerequisite; mandatory field, version and author checks belong inside the deterministic definition. A read followed by an unguarded mutation cannot protect a reviewed decision. The [concurrent editing guide](../reconcile-concurrent-edits/COOKBOOK.md) shows the common pattern.

A stored rejection retains its meaning. If conditions later change, the person can review a new command; exact retry does not silently rewrite the original inputs. If history recovery abandons an attempt, use deliberate `session.reapply` after current review so the new attempt links to the excluded one. Never refresh a generation, domain version or operation ID merely to make old work pass.

Storage failure before durable admission is a failure to save. Keep any surviving in-memory draft, offer an appropriate export, and explain that it may disappear when the tab closes. An optimistic indicator cannot create durability.

## Keep content and code publication separate from execution

`session.content` stages and retains immutable application bytes. Completing transfer does not mean the domain accepted the evidence reference or that an agent examined it. A semantic command can reject after the content is already retained. Obtain and test the required retention coverage rather than assuming a content ID in JSON is a permanent archive.

A domain file or document is an application record whose command checks its reviewed version and immutable content reference. There is no second hosted shared-file writer. A changed byte snapshot is new intent and needs review; it cannot reuse an earlier digest as proof.

Page code uses the session-owned control participant's publication facet. `control.preparePublication` durably records the exact signed complete graph and predecessor under its operation ID. After a lost publication response, prepare the same intent and retry the same signed publication. A publication-head conflict needs a new review; it does not justify replacing the captured predecessor. The [publication guide](../publish-coherent-updates/COOKBOOK.md) explains that independent revision chain.

## Preserve drafts through recovery

Keep submitted text, evidence and original context separate from later typing. Clear only the acknowledged snapshot when that matches the page policy. A delayed acceptance cannot erase a new draft, and a delayed rejection cannot replace it. Offer comparison, copy, discard or deliberate reapplication according to the task.

Follow the session's recovery notice and reread a coherent selected-history view. Do not combine events from a new generation with an old SQL projection. Preserve adopted identities, inspect abandoned attempts and explain the available retained prefix. A missing coordinator does not authorize a page to invent a new local authority.

An external action needs its own stable execution identity, verified requester authority and reconciliation record. Recovery of ordinary application history must not blindly replay an irreversible effect. Qualify the explicit protected checkpoint or durable action service before offering that capability.

## Verify

Disconnect before delivery and after durable acceptance but before the reply. Reopen the same device and inspect the same operation. Change a domain version while work waits. Recover to an older prefix and inspect adopted and abandoned attempts. Type a new draft before a delayed outcome. Interrupt content transfer and distinguish bytes from accepted evidence. Lose a persisted publication reply and recover its exact signed identity. Crash after an external action and reconcile its real result; an application receipt alone cannot prove exactly-once external execution.
