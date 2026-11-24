---
id: "manage-sensitive-data"
title: "Give people control over sensitive information"
summary: "Minimize collection, keep private and shared representations distinct, and make redaction, export, retention, and deletion reflect actual authority."
group: "Keep work dependable"
tags: ["privacy", "retention", "redaction"]
choices: ["Minimum necessary data and reader boundaries", "Original evidence versus reviewed redacted derivatives", "Local removal versus reference removal versus actual retention"]
related: ["collect-private-responses", "separate-evidence-interpretation", "choose-data-model"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
capabilities: []
evidence: "explained"
---

# Give people control over sensitive information

Use this when a page handles information whose audience or lifetime matters: private feedback, personal notes, identity details, confidential documents, or images that may include bystanders. Start with the task's actual need. Often the best feature is a smaller input, a local-only draft, or a reviewed summary that avoids collecting unnecessary detail.

## Make the data journey visible

Consider a facilitator collecting private workshop comments and publishing a reviewed aggregate. A participant needs to know what is collected, who can read it, whether their name is attached, and what happens after submission. The facilitator needs a protected review path and a shared result that cannot accidentally expose individual responses. A generic privacy banner cannot replace those concrete explanations.

At the point of collection, explain the purpose, required and optional fields, intended readers, and practical retention/deletion controls. Use plain labels such as “Only you and the facilitator can read this response” only when the actual service policy enforces that claim. A field hidden from other page layouts is not private storage.

Provide a review step for sensitive uploads or disclosures: what will leave this device, which derived version is selected, and which audience will receive it. Keep the unsent original separate from the submitted snapshot. Do not copy private text into a broader shared activity feed, notification preview, diagnostic log, or agent wake notice merely for convenience.

## Map each representation to a reader and lifetime

| Representation | Useful policy question | Common mistake to avoid |
| --- | --- | --- |
| Local draft | May this device persist it, for how long, and after which identity changes? | Assuming local storage remains authorized forever. |
| Original evidence | Which authorized people need the unmodified bytes? | Publishing the original while only the UI shows a redacted preview. |
| Private submitted record | Which service operation enforces readers and edits? | Using shared state with an obscure key. |
| Redacted derivative | What information and metadata were actually removed? | Treating a visual overlay as permanent redaction. |
| Shared aggregate | Can small groups or quoted text reveal a person? | Calling an aggregate anonymous without a justified disclosure policy. |
| Export or diagnostic bundle | Who receives the file, and what hidden context does it contain? | Including credentials, private paths, or raw failed records. |
| Retained history/reference | What keeps the underlying content available? | Claiming that removing one visible row erased every copy. |

Use a trusted application policy when ordinary core access rules cannot enforce the required reader separation. The default workflow registry is empty; [public protocol discovery](https://github.com/werg/tendriller/blob/master/docs/PROTOCOL.md) does not install a private-record capability. Verify the selected implementation and actual host authorization with distinct identities.

## Minimize before storing or sharing

Ask whether the task needs an exact location, full name, raw image, complete conversation, or merely a coarse answer or derived measurement. Make optional inputs genuinely optional. Where a source includes more data than the task requires, project relevant fields before downstream storage when practical. Hiding columns after ingestion does not reduce what was collected.

Separate contact or identity details from task content when the policy benefits, with explicit authorized joins. Avoid placing secrets in URLs or editable application fields. Use safe correlation IDs for troubleshooting instead of copying entire private records. Bound diagnostic retention and let the operator inspect what a support export contains.

For shared summaries, define the publication unit and review rule. Small-group aggregates, unique phrases, and repeated releases can reveal information even when names are removed. Choose a disclosure policy appropriate to the task and describe its limits; do not promise anonymity based solely on stripping names. A facilitator review should inspect the exact version to be published.

## Make redaction a reviewed transformation

Preserve a clear relationship between original evidence and its derivative without exposing the original to the derivative's audience. For an image, the reviewed export must contain the intended redacted pixels, not merely a browser overlay. For documents, consider embedded text, comments, metadata, thumbnails, attachments, and revision history relevant to the format. Verify the actual delivered artifact using an appropriate reader.

Give the person a side-by-side or stepwise review with accessible descriptions and an explicit chosen output. Name what is removed and what remains. Redaction may destroy information needed for later analysis; retain the original only under an intentional authorized policy rather than keeping it by default.

Treat a changed redaction as a new evidence revision. Existing approvals, annotations, and published summaries must identify which version they used. A later correction should not silently replace the bytes behind an earlier review. If the system cannot provide a trustworthy redaction path for a format, offer a smaller manually prepared input or decline that sharing path.

## Handle suspension, identity change, and cached content

Clear sensitive visible projections when the chosen policy requires it, stop subscriptions, and reauthorize before restoring private drafts or records. Guard delayed successful reads, error handlers, scheduled paints, and back/forward restoration with the current authorization epoch. A late callback from an old identity must not repopulate the screen.

A privacy screen is a useful local display feature, but it is not revocation or deletion. Describe its scope. Likewise, closing a tab does not retract an exported file or a notification already accepted by a provider. Design previews and notifications to contain the smallest useful information in the first place.

Keep recovery usable. When access is lost, explain that private content is unavailable and offer an authorized sign-in or management route. Do not display cached text while waiting to discover whether the reader may still see it.

## Explain retention and deletion precisely

Offer controls at the right scope: discard an unsent local draft, remove a shared reference, unpin an object, delete an authorized private record, or request a broader lifecycle action. State what each operation removes, what other references may retain, and whether undo is possible. Use actual service receipts for completion.

Core immutable bytes can be retained by current files, retained history, publications, pins, or other recognized roots. An arbitrary blob ID in application state is not a retention root, and removing one name is not proof that all references disappeared. Follow returned retention metadata and the current service policy. Never promise immediate physical erasure across backups, other recipients, or downloaded copies without a real supported guarantee.

A deletion that races with a changed record should follow the selected guarded policy. Preserve enough non-sensitive receipt information to explain the outcome without retaining the deleted sensitive payload as a troubleshooting convenience. Separate “request received” from “completed” where the actual lifecycle is asynchronous.

## Verify the actual audience boundary

| Scenario | Expected observation |
| --- | --- |
| Participant opens another participant's record | The actual service denies access, independent of hidden controls. |
| A redacted file is downloaded and independently inspected | Removed content is absent from the delivered representation, including relevant metadata. |
| An aggregate contains one distinctive response | Publication follows the reviewed disclosure policy rather than automatic release. |
| Access is revoked during an outstanding read | No late callback or cached restoration reveals the old content. |
| A diagnostic export is requested | Its preview excludes secrets and unnecessary raw private data. |
| One retained reference is deleted | The UI accurately reports remaining retention and does not claim universal erasure. |
| A private submission fails after a new draft is typed | Both the failure and the new draft remain understandable without widening the audience. |
| A public result is revised | Readers can identify the reviewed version and its evidence relationship. |

These are application design and verification requirements, not a claim of legal compliance. Promote evidence only after the named real-host and artifact-inspection scenarios have been exercised.
