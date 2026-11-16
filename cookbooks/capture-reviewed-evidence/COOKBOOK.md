---
id: "capture-reviewed-evidence"
title: "Capture, review, and send evidence"
summary: "Design permission, review, durable submission, and recovery around evidence the person actually intends to send."
group: "Collect evidence"
tags: ["capture", "privacy", "drafts"]
choices: ["File or typed fallback versus a live sensor", "Inline review versus a separate capture route", "Local draft lifetime and late rejection behavior"]
capabilities: ["captures", "durable commands"]
evidence: "exercised"
related: ["discover-capabilities", "annotate-a-frame", "recover-outdated-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/camera.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/input-kit.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/photo-inspector/index.html", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Capture, review, and send evidence

Use this when a camera, microphone, file, sketch, or location adds evidence to a task. First ask what the agent needs to know and whether typed input or a file is enough. Opening a sensor, capturing a candidate, uploading bytes, and sending a command are separate decisions. A single button may coordinate them, but the person still needs an intelligible opportunity to review or discard sensitive material.

## Choose the capture flow

| Choice | Start here | Change it when |
| --- | --- | --- |
| Input | A user-selected file or explicit capture gesture. | Continuous sensing is central to the task and its cadence, stop path, and budget are agreed. |
| Review | Preview the candidate with retake, discard, and send actions. | An informed user explicitly chooses automatic bounded collection; still show active use and stop. |
| Context | Bind evidence to a stable question, frame, or task revision at capture time. | The task intentionally permits rebinding, through a new user-reviewed command. |
| Persistence | Keep the draft and candidate locally until an authoritative outcome. | Local persistence is unsuitable for sensitive data; explain the interruption tradeoff and use authorized server draft storage if needed. |
| Layout | An inline form for occasional evidence. | A focused capture/review route or fullscreen canvas reduces mistakes for the task. |

Permission must be requested by the relevant user gesture. API presence does not prove permission, hardware, device support, or successful capture. A denial is a normal branch with a file or text fallback. Stop tracks, animation loops, object URLs, listeners, and device connections when the flow ends; merely hiding the preview is not stopping capture.

## Walk through a complete evidence request

For a repair question, begin with the explanation the person is trying to obtain:
“What should I show so the loose part is identifiable?” Offer a typed description,
an existing file, or a fresh photo. Keep the question visible while choosing input,
so a permission prompt does not feel detached from the task.

After capture, show the actual candidate rather than only a filename or success
icon. Let the person inspect sharpness, framing, orientation, and whether the image
contains unrelated people or information. Provide retake, discard, a caption, and
optional crop or redaction where useful. A crop or redaction creates a derived
candidate; review its actual outgoing bytes, and do not upload the unredacted
original as an unnoticed companion. Preserve original evidence only when the
chosen task and audience require it.

If several items are needed, use an evidence tray with stable item IDs and a clear
included/excluded state. Allow reordering or removal without changing the identity
of pending items. Each item may have its own upload and acceptance outcome; do not
show an entire set as submitted merely because its first item succeeded. If the
task requires an all-or-nothing finalization, that is an explicit application or
trusted-policy decision to verify, not a property supplied by several independent
uploads. A simple task can instead show “2 accepted, 1 needs review.”

Before Send, summarize the question, selected items, intended context, and any
retention choice the current role can make. After Send, show a concise card for the
snapshot while leaving a new draft available. A useful status progression is
“Saved on this device, waiting to send,” then “Accepted, waiting for a reply,” with
specific recovery actions for rejection. Do not promise local saving when the
storage transaction failed, and do not imply an agent has examined accepted bytes.

Offer an accessible text description and keyboard access to all review actions.
Move focus deliberately when a capture route closes, retain captions through
retakes, and announce meaningful status transitions without interrupting new
editing. A text/file fallback must be able to finish the same question; it should
not be a dead end that asks the person to enable the sensor again.

## Preserve the meaning of pending work

**Platform invariant:** a protected submission keeps its original command ID and captured concurrency generation across retry. If the task changed while upload was pending, do not silently bind the old evidence to the new question. Explain the rejection and let the person compose a new submission deliberately.

**Conditional requirement:** use the current public capture/blob interface for durable bytes and the public command interface for submission. Do not expose raw device handles or private transport. Use the exact current core contract for operations and byte limits; this guide intentionally specifies behavior rather than preserving an obsolete capture wire format.

For the current browser API, `uploadEvent` creates a new durable operation and returns its runtime-owned `capture_id`. Give the reviewed snapshot a separate page-owned `submission_id` inside `data`; use `capture_queue` to associate that ID with the runtime operation, then correlate `upload_event` results by `capture_id`. Subscribe before reading `captures()` so initialization or reload cannot hide a pending item. Also associate the awaited result with its original snapshot: a local-storage rejection may never enter the queue. Use `retryCapture(capture_id)` for the original operation; calling `uploadEvent` again creates another submission. If local storage rejects the work before it becomes durable, retain the original bytes in memory and offer an explicit save or review action. Label that snapshot as present only in the open tab; do not promise interruption recovery when no durable copy exists.

For a protected capture, obtain `tendril.scopes.capture(scopeId)` when the person
begins that action, before asynchronous recording, processing, or rendering. Pass
its returned `scope` and `expected_generations` to the durable submission and keep
them unchanged. Capturing a fresh generation only after a long recording could
silently attach old evidence to a reset task. The
[public capture contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/CAPTURES.md)
defines that boundary and the separate upload, pin, and semantic-event phases.

**Example choice:** whether sending clears the text immediately or leaves it editable is a product decision. A safe starting point is to snapshot the submitted text and evidence, keep new typing in a separate draft, and clear only the acknowledged snapshot. A delayed rejection must restore or retain the rejected work without overwriting text entered in the meantime.

## Separate verified bytes from accepted evidence

The runtime coordinates the immutable upload and the later semantic capture command. A completed upload receipt means the service verified those bytes. The capture's accepted result means its original task context was admitted. Neither says the agent has completed its work. Keep queued, uploaded, accepted, and rejected meanings distinct even when the interface shows only one concise status at a time.

Use the returned immutable content identity when later analysis or annotations must refer to the reviewed bytes. A mutable shared-file path can point to a newer object; a display URL alone does not grant authority or permanent retention. An accepted application event also does not automatically retain the bytes forever. If the task needs an archive, choose and verify the appropriate retained reference or pin; copying a blob ID into application JSON is insufficient. Do not infer participant-private media from an upload or a retained reference. The [private-response guide](../collect-private-responses/COOKBOOK.md) deliberately keeps that separate boundary explicit.

## Adapt the plan

1. Inspect the task and choose the least demanding input that provides useful evidence. Name the permission and active-use disclosure.
2. Keep candidate evidence separate from submitted evidence. Give candidates stable local IDs and attach the task/question revision before asynchronous work.
3. Record a reviewed snapshot of text, media, and context when Send is chosen. Do not read mutable form values again during retries.
4. Persist the work through the platform's current durable API, observing queued, accepted, and rejected outcomes. Upload success alone does not mean the agent received or acted on the evidence.
5. If a durable operation fails transiently, retry the same command and original context. If rejected as stale or unauthorized, preserve the draft for explicit review instead of relabeling it as new work.
6. Correlate the agent's reply to the submitted evidence ID. If the person retakes a photo, an old reply must not appear as a judgment of the new photo.
7. Stop device use on cancel, completion, route changes, and background transitions according to the chosen policy. A stopped flow never resumes listening silently after reload.
8. Keep original bytes and interpreted conclusions distinct. Annotation coordinates belong to a specific frame and transform, not whichever preview is currently visible.

## Different applications, same guarantees

The [inline specimen](checks/inline/index.html) uses an ordinary file input, text area, local review, and explicit send. The [fullscreen sketch specimen](checks/fullscreen/index.html) uses a canvas capture route and a separate review step. Neither mounts a shared input component or assumes a universal event vocabulary. Both retain an immutable submitted snapshot and distinguish pending outcomes from new drafts.

The additional evidence-tray, crop/redaction, and accessible review choices above
are adaptation guidance; they are not added claims about the recorded pilot scope.

Nine browser scenarios across these specimens passed, including local-storage failure, snapshot recovery, stale rejection, and new typing while acceptance is pending. The [pilot record](../../guides/pilot-evidence.json) names exact source and public artifacts. These recorded checks use deterministic fixture transport for UI failure cases and name their exact core baseline; repeat them when the underlying upload contract changes. Real authorization, durable byte retention, and transaction boundaries require the core service tests and an installed target service. Fixture success is not a claim about those guarantees.

## Verify the flow

- Deny permission or remove the device. The page remains useful through text/file input and explains what is unavailable.
- Retake and discard. Discarded evidence is not subsequently submitted by a pending callback.
- Send, then type new text before acceptance. Acceptance clears only the submitted snapshot.
- Disconnect after acceptance but before its acknowledgement. Retrying produces the original result, not duplicate evidence.
- Reset the task while upload is pending. The old command is rejected with its original context; the page offers deliberate review.
- Delay a rejection until after a second draft exists. Both pieces of work remain recoverable without one overwriting the other.
- Reload mid-flight. Restore the current-system pending record or visibly explain why a nonpersistent draft could not survive.
- Leave capture or background the page. The visible active-use state and actual tracks agree; restarting requires the chosen gesture.

Use [image annotation](../annotate-a-frame/COOKBOOK.md) for coordinate identity and [recovery](../recover-outdated-work/COOKBOOK.md) for command outcomes. Avoid assuming a photo is needed when a short description answers the question.
