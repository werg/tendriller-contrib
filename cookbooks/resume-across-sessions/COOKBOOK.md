---
id: "resume-across-sessions"
title: "Resume across devices and agent sessions"
summary: "Keep task context, consumer progress, view checkpoints, and device focus separate so a handoff does not skip work."
group: "Keep work dependable"
tags: ["handoff", "resume", "context"]
choices: ["Task brief, handled cursor, view checkpoint, or local draft", "Authorized cross-device state versus private unsent work", "Receiver identity and local consent after handoff"]
capabilities: []
evidence: "explained"
related: ["connect-resuming-agent", "coordinate-devices", "recover-outdated-work", "run-a-peer-application"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/AGENT_HOSTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/control/experiences.ts"]
---

# Resume across devices and agent sessions

Use this when a task moves between devices or an agent conversation resumes after interruption. Resume can mean recovering intent, continuing an event consumer, reconstructing a chart, or returning to an unfinished draft. One generic cursor or session object cannot safely represent all of these. For a disposable read-only page, reloading current authorized state may be sufficient.

## Design the return experience

Consider a field inspection started on a phone and reviewed later on a laptop. The returning person needs to recognize the task, understand what changed while they were away, see which observations were accepted, and decide what to do with unsent work. A replacement agent needs the agreed goal and unresolved decisions, then must read actual pending work under its own verified receiver.

A useful “Continue work” view summarizes the task's current version, last accepted milestone, unresolved submissions, and the next decision. Label device-local drafts explicitly. Offer to resume, inspect differences, or start a separate task; do not immediately replay old actions merely because a saved object exists. Keep a read-only overview available while authority or freshness is being checked, provided it exposes no data the current reader is unauthorized to see.

Make stale or incomplete recovery understandable. “This device has a draft from before the plan changed” is actionable; a generic “Sync error” is not. Show both the draft's origin context and current agreed context, with explicit copy, compare, discard, or newly reviewed resubmission actions.

## Keep the right state in the right place

| Record | What it answers | What it must not stand in for |
| --- | --- | --- |
| Task brief | What are we trying to do, and which decisions remain? | An authoritative proof that every mentioned action happened. |
| Domain progress | Which milestones and outcomes were accepted? | A page's scroll position or a consumer acknowledgement. |
| Handled event checkpoint | Through which event have the required effects succeeded? | Delivered/read progress or chart ingestion progress. |
| Stream-view checkpoint | Which model and cursor were saved together? | A complete archive when retention has gaps. |
| Local draft | What has this device not submitted? | Cross-device durability or current authorization. |
| Device focus | Where should presentation or attention occur? | Permission to read or change the task. |
| Pending command | Which original intent still needs reconciliation? | A template that can be rebound to current generations. |

Save each under its appropriate authority and concurrency guard. A task brief should carry enough revision identity to detect an intervening edit. Do not overwrite current decisions with an older agent summary. Use stable task, run, evidence, and request identities rather than names that may be edited or reused.

Keep the brief short enough to review: purpose, constraints, accepted decisions, evidence references, known failures, pending commands, and the next action. Link detailed logs rather than copying private history into a broader shared summary. Facts reported by a previous session should remain distinguishable from newly verified observations.

## Choose the handoff mode

A second authorized reader can often load current state and rebuild a small view from retained history. A device transfer may additionally move an explicitly selected draft. A replacement agent needs the brief, handled checkpoint, and pending-effect reconciliation. These are different operations and deserve different controls.

Default to leaving unsent drafts on their original device unless the person deliberately sends them to an authorized destination. Explain whether that transfer copies or moves the draft and what remains locally. If the platform offers no suitable private transfer, provide a reviewed manual export or another task-appropriate path rather than storing it in generally readable state.

A new device must reestablish its own permissions and presentation preferences. Do not restart camera, microphone, location, speech, or wake-lock behavior because the previous device used them. Recheck local capabilities without prompting, then request access from an intentional action. Device purpose is useful for layout and routing, but it grants no authority.

## Reconstruct in a safe order

1. Establish the current page/task identity and authorized reader before restoring private content. Clear or segregate caches on identity changes; late reads must not repaint a prior reader's data.
2. Fetch current authoritative task state and relevant revisions. Compare the saved brief and drafts against it rather than trusting their timestamps alone.
3. Reconcile pending commands using their original identities, payloads, and generations. Preserve accepted, rejected, and uncertain outcomes separately from new work.
4. Restore a view and its cursor atomically, or rebuild both from retained history. Validate interpretation/model versions and preserve any incomplete-history marker.
5. Present a concise changes-since-return summary and unresolved decisions. Let the person choose what to resume; preserve focus when the summary updates.
6. Attach and verify the receiving agent's exact conversation, then drain work from the handled checkpoint. Probe once after attachment and again after handling/rearming before promising responsiveness.

Use an event's validated generation context for protected results, not an application-provided session label. A known historical intent remains historical after a task reset. If it is still useful, compose new work deliberately against the reviewed current state.

## Manage overlap and uncertain effects

For a [peer application](../run-a-peer-application/COOKBOOK.md), keep the
owned device session independent of the model conversation. Reopening
the UI restores the session's original operation identities and queries their current
outcomes. The page may keep a reference to an operation beside its local draft;
that reference is not another delivery queue. A new LLM conversation consumes
the session's recorded work with its applied, shared or abandoned status.

The durable event continuation belongs to a group/history and filter version.
Changing a topic filter requires an explicit cursor decision. Empty matching
batches can advance scanned progress, while unresolved execution cannot. Commit
the derived state and its processed cursor together, and bind cache checkpoints
to the reducer version. Rebuilding a view never dispatches an external effect.

An unavailable control host leaves established peer commands, signals and
replication useful. Losing the coordinating peer requires an eligible survivor
to select a complete retained prefix at an explicit recovery boundary. Publish
the resulting recovery notice, preserve abandoned attempts for inspection, and
review current preconditions before deliberate reapplication. Restoring a stale
control store must not silently undo a newer selection. Show retained coverage
and recovery uncertainty separately from the applied result a user saw.

Two devices may remain active during handoff. Define whether one is authoritative for a particular activity or whether both may edit under conflict detection. A “Continue here” control should explain what changes on the old device; presentation focus does not automatically stop its sensor or revoke its access. Show active-device context when it prevents confusion without exposing private identities unnecessarily.

Two receivers must not race a shared handled cursor without explicit coordination. Use a suitable public named-consumer policy or a single receiver owner, and verify lease/acknowledgement behavior in the actual service when chosen. A crash after an external effect requires reconciliation against that external system before retrying. Neither a brief nor a checkpoint proves exactly-once execution elsewhere.

When records have expired, restore the current truth and expose missing history. Do not reconstruct a convincing narrative from partial summaries. A bounded view can remain useful with a clear gap and a link to an intentional archive, if one exists.

## Finish the handoff

Let the receiving side acknowledge that it can continue, then retire the old receiver or clear local drafts according to the chosen copy/move policy. Do not delete the last recoverable draft merely because a transfer request was accepted. Preserve an outcome receipt and the user's recovery route. A handoff can be complete for presentation while an unrelated pending command still requires resolution; say so.

## Verify continuity through failures

| Scenario | Expected observation |
| --- | --- |
| Reload with a corrupt checkpoint | Rebuild both model and cursor or show an explicit recovery failure. |
| Laptop resumes an old brief after a phone edit | The newer decision is preserved and the discrepancy is reviewable. |
| Old device has an unsent draft | It remains private under the stated policy and is not silently published. |
| Task reset while a command is queued | Original generations remain attached and stale work is rejected visibly. |
| Agent conversation is replaced | New receiver passes both probes and resumes handled progress, not only delivered progress. |
| Access is revoked while restoration is pending | Late success or failure handlers cannot repopulate private content. |
| Two devices remain open | Their writes, focus, and local permissions follow the documented overlap policy. |
| Crash after an external action | Reconciliation determines its outcome before effects are repeated or acknowledged. |

The success criterion is that the person can explain what continued, what stayed local, what remains uncertain, and what action is now safe to take.
