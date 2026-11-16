---
id: "review-exact-proposal"
title: "Review an exact proposal before acting"
summary: "Bind approval to immutable content and an explicit version, expiry, and execution policy."
group: "Decide and act"
tags: ["approval", "versions", "authority"]
choices: ["Approval or a simpler authorized progress receipt", "Response-time and execution-time expiry", "Downstream idempotency and uncertain outcomes"]
capabilities: ["explicit trusted extension"]
evidence: "explained"
related: ["recover-outdated-work", "observe-long-running-process"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/approval-remote/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/server.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs"]
---

# Review an exact proposal before acting

Use approval when an agent should prepare an action but a person must review its exact meaning before execution. A general “looks good” message or button next to mutable shared state is insufficient. If the action is low-impact and already authorized, a progress receipt may be the better interaction.

## Define what approval means

A proposal contains immutable approved content, a stable ID, a version, the authorized approver, and an expiry policy. Show the consequential details clearly: target, scope, effects, and any unresolved assumptions. If content changes, create a new version; do not keep an old approval attached to a silently edited payload.

Choose expiry at response time, execution time, or both. Checking only the time when a person presses Approve permits later execution unless another rule forbids it. That may be right for a queued job, but it must be explicit. A browser clock cannot authoritatively decide approval validity. The selected server capability enforces identity, version, and expiry.

External effects need a separate deduplication policy. A stored approval does not make a third-party API exactly-once. Use the downstream service's idempotency key when available. When a request times out after possible execution, record an uncertain outcome and reconcile it; do not blindly execute again merely because the page has no success receipt.

## Adapt the plan

1. Decide whether approval is necessary and what information the person must inspect.
2. Store a proposal snapshot and its version in a deliberately installed trusted extension. The [reference module](snippets/approval.mjs) is application policy to review and adapt, not a default core feature.
3. Build any suitable review surface: a dense desktop comparison, a short mobile decision, or a side-by-side revision view. UI presence is not authority.
4. Send a protected response with the original proposal/version and concurrency context. On rejection, preserve the person's response for explanation and deliberate re-review.
5. Execute only the authorized immutable payload under the selected execution-time policy. Record queued, running, uncertain, failed, and completed states distinctly where they can occur.
6. Make revision and cancellation semantics explicit. A cancellation request racing with external execution may not undo an effect.

## Verify

Attempt approval from an unauthorized identity, against an old version, after response expiry, and after execution expiry. Modify the displayed proposal between render and click; the server must not approve different content. Retry an accepted response after acknowledgement loss. Simulate a downstream timeout after effect, duplicate execution requests, and completion arriving after a cancellation request. Check that the UI describes uncertainty rather than inventing success or rollback.

The reference's [checks](checks/) exercise its selected policies through the public host. Customize record names and page layout freely, while preserving the authority and version boundary.
