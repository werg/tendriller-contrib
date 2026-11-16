---
id: "work-offline-and-reconnect"
title: "Keep a task useful offline and reconnect deliberately"
summary: "Prepare the exact page for offline use, preserve local drafts and pending intent, and reconcile current authority and task context on return."
group: "Keep work dependable"
tags: ["offline", "drafts", "recovery"]
choices: ["Saved publication versus unsaved optional capabilities", "Local work versus accepted server outcomes", "Original retries versus reviewed reconciliation"]
related: ["recover-outdated-work", "publish-coherent-updates", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md"]
capabilities: []
evidence: "explained"
---

# Keep a task useful offline and reconnect deliberately

Use this when a task must remain useful through weak connectivity: a field checklist, reviewed observation form, or reference page used away from a network. Start by deciding which actions are valuable locally and which require a current server decision. If offline work would create more uncertainty than value, a readable saved reference and an explicit “Reconnect to submit” state may be sufficient.

## Promise a specific offline task

For a field inspection, the person may need the procedure, previously authorized context, an unsent note, and a reviewed photograph while disconnected. They cannot assume that a new reservation, private authorization, remote agent response, or live stream append will succeed. Write that boundary into the interface before departure.

Separate five states: the page's exact publication is saved, the application has the required local data, a draft is persisted, a command is queued, and the server has accepted it. A single “Offline ready” badge should not imply all five. Show which optional features need a connection, which evidence remains only on this device, and when the last server reconciliation occurred.

| Offline need | Useful approach | Limitation to expose |
| --- | --- | --- |
| Read the authored procedure | Save the exact publication through the public lifecycle. | Saving one version does not establish readiness of another. |
| Continue a local draft | Persist the minimum draft and evidence under a disclosed policy. | Browser storage can fail or be cleared; this is not a remote backup. |
| Submit an ordinary durable event/state intent | Use the runtime's documented durable operation and inspect its result. | Queued is not accepted, and stale work may later be rejected. |
| Append live stream records | Use a deliberately designed bounded spool or wait for connection. | Browser stream publish rejects offline; it is not a hidden durable queue. |
| Use optional speech or a model | Prepare and verify that specific dependency and capability. | Publication readiness does not imply an unused model was downloaded. |
| Read private records | Follow the application's current authorization and cache policy. | A cached record does not itself grant permission to display it. |

## Prepare while connected

Ask the person to choose “Prepare for offline use” rather than silently starting large downloads. The public browser API provides `tendril.publication.saveOffline()`. Its fulfilled result identifies the exact publication and reports readiness only after the controlling service worker acknowledges the required graph and metadata. Handle unsupported, timeout, and failed-save outcomes. Seeing assets in a cache or successfully rendering the page is insufficient.

Keep a preparation checklist small and concrete: current publication saved, required authored pages available, selected task context available under its policy, draft storage usable, optional capabilities tested, and storage budget sufficient. If an item is unavailable, say which part of the task will be limited. Do not fetch or cache private content merely to make a badge green.

Test navigation to each required nested HTML file. A missing offline route must not silently show a different entry page. Verify the intended cold-start path in the target browser and identity context; an already-open tab surviving network loss does not prove a later fresh navigation will work. Do not promise indefinite offline access or background execution.

Read exact behavior in the [reviewed browser contract](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md), then check the actual deployed environment and current public docs when implementing.

## Keep local work and the outbox understandable

Snapshot each submitted intent separately from the editable draft. Preserve application identity, evidence identity, original task generations, and the original command context supplied by the runtime. Show a readable outbox entry such as “Observation queued on this phone” with its timestamp and task. Keep administrative credentials out of local application records.

Use documented results and lifecycle events for the specific operation. Ordinary events, actual state commands, and timer mutations distinguish accepted, queued, and rejected work. An empty unconditional state change returns `unchanged` without implying a service receipt. Capture work has its own queue and retry/discard controls; those controls do not apply to every command type. Cancelling a local preview does not undo accepted work.

Use the [core browser queues](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md) to restore submitted work: `state.pending()` and `timers.pending()` expose the original durable commands, while `state_queue`/`timer_queue` and `state_result`/`timer_result` report changes and correlated outcomes. Keep the page's editable drafts and selection context separate, but do not duplicate core's mutation queue. A queued conditional state claim must not appear accepted, and a queued timer cancellation has not stopped the server schedule. The original operations, settings, checks, and generations survive a reload without being refreshed to current values.

Bound draft bytes, attachment count, and pending items. When storage fails or a budget is reached, preserve the last coherent draft and explain what cannot be retained. Offer a reviewed export or a smaller submission only when appropriate for the data. Never silently evict the oldest unsent observation to make room for a new one unless that is an explicit, visible policy.

A connectivity indicator should report transport separately from service authority and feature readiness. It can explain that the connection returned while the task is still reconciling. Keep status updates readable and accessible without stealing focus or repeatedly announcing each reconnect attempt.

## Reconnect without changing historical intent

1. Establish the current page identity, reader authority, service capabilities, and task context. Reauthorize before restoring sensitive projections when required.
2. Reconcile original pending commands using their captured identities and generations. Runtime retry must preserve their original meaning; do not attach a newly fetched generation to an old payload.
3. Show accepted, rejected, and uncertain outcomes per item. A stale rejection should offer comparison with current task state and an explicit new submission action.
4. Use `state.snapshot()` for a coherent accepted state/revision/scope observation when connected, and replay retained streams with visible gap handling. The snapshot does not flush pending work or replace the optimistic view. Use `timers.list()` for the current schedule; an old accepted timer receipt may describe a timer that later advanced or was removed.
5. Apply a new publication only under the page's draft-aware policy. Offline readiness for the previous version must not be relabeled as readiness for the update.
6. Reestablish optional sensors or voice through intentional local action. Reconnection does not authorize restarting hardware or speech.

For conflicts, keep both the original snapshot and current draft. Explain whether an action is a retry, a new reviewed submission, or a discard. A person should be able to tell which observations reached the server without opening technical logs.

## Verify the boundaries you promise

| Scenario | Expected observation |
| --- | --- |
| Save-offline request fails after some assets download | Readiness remains incomplete with a retry action; partial cache contents do not count as success. |
| A new tab starts offline | Required saved routes load only under the tested browser conditions; unsupported cold start is disclosed. |
| An unused optional model is requested offline | The feature is unavailable or follows its explicit fallback without false readiness. |
| Draft storage is exhausted | Existing coherent work remains recoverable and new persistence failure is visible. |
| Stream publish occurs offline | It rejects under the public contract; the application does not pretend it joined the runtime outbox. |
| Task resets while an observation is queued | Original intent remains stale and can only be resubmitted through deliberate current review. |
| Connection returns after a new draft is typed | Older receipts cannot erase or overwrite the new draft. |
| Two conditional row edits survive a reload | Core's pending commands and original-operation receipts identify each row; the page does not reconstruct or resubmit commands from visible values. |
| A timer result was saved but removing its queue entry failed | Reload settles that saved outcome locally, without issuing another timer mutation. |
| Access changes while private restoration is pending | Late callbacks cannot repaint content from the previous authority context. |

This guide proposes an offline experience. Actual offline readiness, storage behavior, service rejection, and device capability need separate checks in the chosen adaptation.
