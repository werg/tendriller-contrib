---
id: "capture-reviewed-evidence"
title: "Capture, review, and send evidence"
summary: "Design permission, review, durable submission, and recovery around evidence the person actually intends to send."
group: "Collect evidence"
tags: ["capture", "privacy", "drafts"]
choices: ["File or typed fallback versus a live sensor", "Inline review versus a separate capture route", "Local draft lifetime and late rejection behavior"]
capabilities: ["application content", "durable commands"]
evidence: "exercised"
related: ["discover-capabilities", "annotate-a-frame", "recover-outdated-work", "document-a-field-inspection"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/camera.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/input-kit.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/photo-inspector/index.html", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Capture, review, and send evidence

## Runnable current API observation card

The current [observation.mjs](snippets/observation.mjs), [card.mjs](snippets/card.mjs),
and [capture.mjs](snippets/capture.mjs) form a runnable agent-requested observation
flow on the page's existing public runtime/session. A signed, addressed, bounded
request renders a card; it never opens a sensor. The card presents typed/file
fallbacks, optional screen-frame/audio capture, preview, Discard, Send, and an
optional application-declared retention choice.

```js
import { observeRequests } from './snippets/observation.mjs';
import { mountObservationCard } from './snippets/card.mjs';
const lifetime = new AbortController();
let card;
void observeRequests({
  session, requester: nativeDeviceId, signal: lifetime.signal,
  onRequest(request) {
    if (card) return; // One visible request; later requests may expire.
    card = mountObservationCard({ container: document.querySelector('#evidence'), tendril, session, request });
  },
});
```

`nativeDeviceId` is the application's deliberately authorized peer, not a value
accepted from the incoming payload. Requests use `evidence/request` with
`{ requestId, recipient, question, expiresAt }`; responses on
`evidence/response` carry the same request ID, original requester, operation ID,
reviewed text, immutable content reference and nullable observation time. Imported
files leave their original observation time unknown; fresh screen/audio routes
record capture completion, and Send never replaces that timestamp. This is an
editable example schema, not a required platform protocol. Signal audiences are
application members; a recipient field is routing metadata.

Screen capture uses a trusted `getDisplayMedia` gesture, bounds dimensions and
encoded bytes, and stops tracks before encoding/review. Audio capture uses
`MediaRecorder`, limits time to 15 seconds by default (30 seconds maximum), caps
evidence at 8 MiB, and supports WebM/MP4/Ogg/WAV when the browser can record that
type. Finish creates a candidate; Stop sensors, hiding, or Discard cancels it.
A late media grant is closed. Capturing or previewing never uploads bytes.

Send stages at most 64 KiB per write through `session.content` and transmits only
after trusted review. Uncertain sends keep their operation identity. An optional
`retainEvidence(response)` callback must submit the application's declared
command and inspect its applied accepted/rejected result. The card does not
invent a durable command in an existing definition. On receiving a confirmed
read receipt, `card.review.releaseAfterReceipt()` can prune unretained local bytes
when the installed session exposes `content.prune`; pruning is not remote erasure.
Before dispatch, discarded stages use `upload.discard()` when available.

Call `lifetime.abort()` and `card?.dispose()` on route teardown. Keep a rejected or
uncertain dispatched operation available for application recovery; do not
automatically send a new identity. The [checks](checks/README.md) include
deterministic cancellation/bounds cases and an actual Chromium-to-native public
session run with synthetic microphone audio, encrypted content, correlated
response and an explicitly declared retention command.

Use this when a camera, microphone, file, sketch, or location adds evidence to a task. First ask what the agent needs to know and whether typed input or a file is enough. Opening a sensor, capturing a candidate, uploading bytes, and sending a command are separate decisions. A single button may coordinate them, but the person still needs an intelligible opportunity to review or discard sensitive material.

## Adapt the current application source

Core's [reviewed media guide](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
provides the concrete camera/file → optional inference → editable review →
declared command flow in its [first-app source](https://github.com/werg/tendriller/tree/master/docs/tutorial).
This route depends on [core PR #60](https://github.com/werg/tendriller/pull/60)
and a matching released host/package composition; its source is not a claim of
deployed availability or an extension of this cookbook's historical test evidence.

Use the supplied `media/panel.mjs` composition and import or adapt
`media/camera.mjs`, `media/voice.mjs` and `helpers/reviewed-input.mjs` for the task.
The [application patterns](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md)
keep coherent views and uncertain operation identity attached to the same session.
Optional inference uses `media/inference-client.mjs` and a deliberately enabled
native peer with provider disclosure, device allowlisting and a request budget;
provider credentials stay in that process and its result is only a suggestion.
The person separately reviews and submits the declared command.

Follow [Build an app](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md)
to deliver and verify the connected hosted flow, then exercise the task-specific
failure cases below. The retired specimens later in this guide remain historical
interaction evidence, not the implementation to install.

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

Capture the task or question with one coherent `session.query` before asynchronous recording or processing. Retain its domain version and application revision with the draft. A submitted operation keeps its original signed attempt and domain inputs across retry. If the question changed while bytes were prepared, the definition's guard rejects the stale meaning instead of silently binding old evidence to a new question.

Use `session.content.stage` for a bounded immutable content upload, complete it to obtain the content reference, and retain the required bytes with the session content API. Submit that exact reference and the reviewed task version through a command declared by the application definition. Use the same owned session for content, command delivery and observation; do not create a second host upload or capture queue.

Keep a page-owned draft/submission ID for the person's reviewed snapshot and a stable `operationId` for its durable command. Inspect `session.operations` after reopening and use `session.retry(operationId)` to resume the same saved intent. `applied()` reports accepted or rejected execution in the selected history. `shared()` separately observes retained coverage; it does not make the submission irreversible. If recovery abandons the attempt, preserve the draft and offer deliberate reapplication under a new operation ID after reviewing the current question.

The captured `basedOn` revision is an ordering prerequisite, not a substitute for a task-version guard inside the definition. Retain both the reviewed domain values and the immutable bytes until the outcome is known. If storage rejects staging or command persistence, the current tab may still hold the original bytes; offer an explicit save or review action and describe that limited lifetime. Do not promise reload recovery without a durable copy.

**Example choice:** whether sending clears the text immediately or leaves it editable is a product decision. A safe starting point is to snapshot the submitted text and evidence, keep new typing in a separate draft, and clear only the acknowledged snapshot. A delayed rejection must restore or retain the rejected work without overwriting text entered in the meantime.

## Separate verified bytes from accepted evidence

The session separates content transfer from the semantic evidence command. A completed content stage identifies exact bytes; retention establishes the retained copy described by that receipt. An applied accepted command means the application's guards admitted the reference and context in the selected history. Neither says an agent has examined it. Keep locally saved, content retained, applied, rejected and abandoned meanings distinct even when the interface shows only one concise status at a time.

Use the immutable content reference when analysis or annotations must refer to the reviewed bytes. A display URL alone does not establish access or permanent retention. An application event does not retain bytes forever: choose the retention policy, obtain the required actual copies, and test missing or partially transferred content. Replication and encryption follow application membership; placing a reference in a filtered query does not make media private from other authorized readers. The [private-response guide](../collect-private-responses/COOKBOOK.md) explains this separate boundary.

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

The [inline specimen](https://github.com/werg/tendriller-contrib/blob/646ceca52c1cd4c164ef3af7c9bddeba3e3df90f/cookbooks/capture-reviewed-evidence/checks/inline/index.html) uses an ordinary file input, text area, local review, and explicit send. The [fullscreen sketch specimen](https://github.com/werg/tendriller-contrib/blob/646ceca52c1cd4c164ef3af7c9bddeba3e3df90f/cookbooks/capture-reviewed-evidence/checks/fullscreen/index.html) uses a canvas capture route and a separate review step. Neither mounts a shared input component or assumes a universal event vocabulary. Both retained an immutable submitted snapshot and distinguished pending outcomes from new drafts. They are archived interaction evidence for a retired capture transport; current durable content and submission use the common application session.

The additional evidence-tray, crop/redaction, and accessible review choices above
are adaptation guidance; they are not added claims about the recorded pilot scope.

Nine historical browser scenarios across these specimens passed, including local-storage failure, snapshot recovery, stale rejection, and new typing while acceptance was pending. Those retired transport fixtures do not qualify current content retention or command execution. The [common browser session gate](../run-a-peer-application/checks/README.md) separately exercises actual encrypted content, interrupted transfer, durable reopening and recovery; an adapted capture UI still needs its own interaction checks.

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
