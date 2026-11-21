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

Use this when a task must remain useful through weak connectivity: a field checklist, reviewed observation form, or reference page used away from a network. Start by deciding which actions are valuable locally and which require current application authority or an explicit external capability. If offline work would create more uncertainty than value, a readable saved reference and an explicit “Reconnect to submit” state may be sufficient.

## Promise a specific offline task

For a field inspection, the person may need the procedure, previously authorized context, an unsent note, and a reviewed photograph while disconnected. They cannot assume that a new reservation, private authorization, remote agent response, or live stream append will succeed. Write that boundary into the interface before departure.

Separate five states: the page's exact publication is saved, the application has the required local data, a draft is persisted, a command is saved, and the selected application history has applied it. A single “Offline ready” badge should not imply all five. Show which optional features need a connection, which evidence remains only on this device, and which application revision was last observed.

| Offline need | Useful approach | Limitation to expose |
| --- | --- | --- |
| Read the authored procedure | Save the exact publication through the public lifecycle. | Saving one version does not establish readiness of another. |
| Continue a local draft | Persist the minimum draft and evidence under a disclosed policy. | Browser storage can fail or be cleared; this is not a remote backup. |
| Submit durable application intent | Use the common session command and inspect its original operation. | Locally saved is not applied; stale domain work may reject and recovery may abandon it. |
| Send transient readings | Use the session signal channel with a declared expiry. | Signals have no offline queue or durable replay. |
| Use optional speech or a model | Prepare and verify that specific dependency and capability. | Publication readiness does not imply an unused model was downloaded. |
| Read private records | Follow the application's current authorization and cache policy. | A cached record does not itself grant permission to display it. |

## Prepare while connected

Ask the person to choose “Prepare for offline use” rather than silently starting large downloads. The public browser API provides `tendril.publication.saveOffline()`. Its fulfilled result identifies the exact publication and reports readiness only after the controlling service worker acknowledges the required graph and metadata. Handle unsupported, timeout, and failed-save outcomes. Seeing assets in a cache or successfully rendering the page is insufficient.

Keep a preparation checklist small and concrete: current publication saved, required authored pages available, selected task context available under its policy, draft storage usable, optional capabilities tested, and storage budget sufficient. If an item is unavailable, say which part of the task will be limited. Do not fetch or cache private content merely to make a badge green.

Test navigation to each required nested HTML file. A missing offline route must not silently show a different entry page. Verify the intended cold-start path in the target browser and identity context; an already-open tab surviving network loss does not prove a later fresh navigation will work. Do not promise indefinite offline access or background execution.

Use the [current owned-session page composition](../run-a-peer-application/COOKBOOK.md) and qualify the actual target browser and publication graph.

## Keep local work and the journal understandable

Snapshot each submitted intent separately from the editable draft. Preserve application identity, immutable evidence references, the reviewed domain versions and the session's original signed attempt. An activity card can say “Saved on this phone” while still waiting for an eligible coordinator. Administrative credentials do not belong in those application records.

Use the common session for all commands. `session.operations` restores original attempts after reopening, `session.retry` resumes exact delivery, and `applied()` distinguishes accepted from rejected execution in the selected history. `shared()` separately observes retained coverage. Keep editable drafts outside the immutable submitted snapshot, but do not duplicate the session's command queue.

A disconnected peer can retain useful data and saved intent, but availability depends on the selected coordinator and actual connectivity. Application recovery can abandon a suffix that was previously applied. Reread the selected history after a recovery notice and offer deliberate linked reapplication for excluded work. Do not change signed inputs, operation IDs or domain guards during retry.

Transient signals expire and have no durable replay. For telemetry that must survive interruption, use a bounded acquisition spool feeding declared application commands with stable domain IDs and expose any rejected or discarded samples. The spool manages source acquisition; it must not become a second command retry journal. Content retention also needs its own actual copy/coverage checks.

Bound draft bytes, attachment counts and pending operations. On quota failure, keep the last coherent draft and explain what cannot be saved. A draft left only in the open tab is not reload-safe. Never silently evict unsent evidence unless that is an explicit visible policy.

A connectivity indicator reports transport separately from authority, execution and feature readiness. Returning connectivity can coexist with missing keys, stale authority or recovery in progress. Keep meaningful status accessible without repeatedly interrupting typing.

## Reconnect without changing historical intent

1. Establish the current page identity, reader authority, service capabilities, and task context. Reauthorize before restoring sensitive projections when required.
2. Reconcile original pending commands using their captured identities and generations. Runtime retry must preserve their original meaning; do not attach a newly fetched generation to an old payload.
3. Show accepted, rejected, and uncertain outcomes per item. A stale rejection should offer comparison with current task state and an explicit new submission action.
4. Read a coherent `session.query` or captured read view, retaining its revision. Inspect current domain records and retained event coverage; an old receipt does not describe every later change. A separate scheduling capability has its own actual current-state query.
5. Apply a new publication only under the page's draft-aware policy. Offline readiness for the previous version must not be relabeled as readiness for the update.
6. Reestablish optional sensors or voice through intentional local action. Reconnection does not authorize restarting hardware or speech.

For conflicts, keep both the original snapshot and current draft. Explain whether an action is a retry, a new reviewed submission, or a discard. A person should be able to tell which observations were applied and retained without opening technical logs.

## Verify the boundaries you promise

| Scenario | Expected observation |
| --- | --- |
| Save-offline request fails after some assets download | Readiness remains incomplete with a retry action; partial cache contents do not count as success. |
| A new tab starts offline | Required saved routes load only under the tested browser conditions; unsupported cold start is disclosed. |
| An unused optional model is requested offline | The feature is unavailable or follows its explicit fallback without false readiness. |
| Draft storage is exhausted | Existing coherent work remains recoverable and new persistence failure is visible. |
| A live signal is sent while peers are unreachable | Its actual delivery/expiry is shown; no durable history or offline replay is invented. |
| Task resets while an observation is queued | Original intent remains stale and can only be resubmitted through deliberate current review. |
| Connection returns after a new draft is typed | Older receipts cannot erase or overwrite the new draft. |
| Two conditional row edits survive a reload | The session journal and original-operation receipts identify each row; the page does not reconstruct commands from visible values. |
| Recovery excludes a previously applied observation | Its abandoned identity remains inspectable and reapplication requires current review. |
| Access changes while private restoration is pending | Late callbacks cannot repaint content from the previous authority context. |

This guide proposes an offline experience. Actual offline readiness, storage behavior, service rejection, and device capability need separate checks in the chosen adaptation.
