---
id: "write-with-versioned-feedback"
title: "Write and review a document across revisions"
summary: "Keep drafts, anchored feedback, suggested changes, reviewer decisions, and publication tied to the document versions they concern."
group: "Design everyday interactions"
tags: ["writing", "review", "versions"]
choices: ["Plain text and snapshots or a richer collaborative editor", "Version-bound comments and explicit re-anchoring", "Accepted edits versus deliberate publication"]
capabilities: []
evidence: "explained"
related: ["adapt-without-losing-work", "reconcile-concurrent-edits", "review-exact-proposal", "separate-evidence-interpretation"]
sources: ["https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/agent.md"]
---

# Write and review a document across revisions

Use this when a person and an agent or several reviewers develop a document over time: a project brief, research summary, proposal, or operating note. The useful outcome is a coherent draft whose feedback can be understood in context and whose publication is deliberate. For a short paragraph, a plain textarea with saved snapshots may be enough. A rich editor, live coauthoring model, or complex review workflow should earn its cost through the actual task.

The central distinction is between the current draft, a particular reviewed revision, suggested changes, and the published version. A comment on yesterday's sentence should not silently appear to approve today's different claim.

## Build the drafting-to-publication journey

1. **Frame.** Show the document's purpose, audience, owner, and current status. Keep source material and writing instructions distinguishable from the document body.
2. **Draft.** Preserve local edits and indicate whether they are unsaved, queued, accepted, or rejected. An incoming agent suggestion must not replace text being composed.
3. **Save a revision.** Capture a stable document/revision identity and its exact content or authorized immutable reference. A label such as “latest” is useful for navigation, not for binding feedback.
4. **Request review.** Select the revision and the questions reviewers should answer. Show who may read the document and whether comments are shared or private under the actual storage policy.
5. **Review in context.** Open comments beside their referenced text or block, with a clear revision label. Let the reviewer propose a change, ask a question, or note an issue without directly publishing it.
6. **Resolve deliberately.** Accept, reject, or revise a suggestion against the relevant current context. Keep a reason or resolution note where it helps subsequent review.
7. **Compare.** Show what changed since the reviewed revision, including meaningful content differences and unresolved feedback.
8. **Publish or hand off.** Select the exact version, destination, and access scope. A saved edit or resolved comment does not itself authorize external publication.

A phone review surface can focus on one comment and its excerpt, while a desktop editor supports side-by-side revisions. Both should make the reviewed version unambiguous.

## Choose a document and revision model

| Model | Useful when | Responsibility it adds |
| --- | --- | --- |
| Plain text with immutable snapshots | Formatting is modest and explicit saves/reviews are acceptable. | Compare revisions and preserve unsaved drafts. |
| Structured blocks with stable IDs | Comments and edits attach naturally to headings, paragraphs, or sections. | Define moves, splits, joins, and deleted-block behavior. |
| Rich text editor | Formatting and selection interactions materially improve writing. | Preserve semantic content, accessibility, clipboard behavior, and export fidelity. |
| Live collaborative model | Simultaneous editing is common enough to justify it. | Select and verify conflict/ordering behavior, history, and permission enforcement. |

Core provides transport and storage primitives, not a built-in rich-text editor or universal collaborative document model. Choose ordinary page-owned source and an appropriate editing library where useful. A plain state replacement on each keystroke is not automatically a safe collaborative merge.

Keep the domain document, local edit buffer, pending save snapshot, review records, and view state separate. Stable document and block IDs survive sorting or relabeling. A document revision records meaningful content; publication identity and runtime version describe the served application and are separate concepts. Updating the editor application must preserve the draft through the [adaptive-interface lifecycle](../adapt-without-losing-work/COOKBOOK.md).

## Anchor feedback to the text actually reviewed

A feedback record should identify the document revision and an anchor that can be interpreted against it. For plain text, an exact quote plus a bounded range and nearby context may be useful. Structured documents can use a stable block ID with a range or semantic target. Offsets alone become unreliable after edits; identical quotes can occur more than once.

When applying old feedback to a new revision, attempt a clearly defined match and expose uncertainty. If the anchor is deleted, changed materially, or ambiguous, show the original excerpt in an “outdated context” view and ask for re-anchoring or closure. Never silently attach criticism of one sentence to a different claim because it occupies the same character position.

General feedback can target a section or the whole revision without a text range. Keep a source quote as evidence of what was reviewed, subject to the document's privacy and retention policy. An edited comment or resolution should preserve enough history for participants to understand which concern was answered.

## Treat suggested changes as proposals

An agent suggestion should include the target revision/anchor, proposed replacement or change, and the reason. A person can preview the resulting diff before accepting. Applying a suggestion creates a new document revision; it does not rewrite the reviewed snapshot. For shared-state document records, use core's conditional `state.apply` to check the reviewed content and update the document plus feedback status in one transaction. Shared-file documents use their own path revision guard. If the base text changed, retain the suggestion for a deliberate merge or regenerate it against the new context; do not weaken a rejected guard automatically. See [concurrent editing](../reconcile-concurrent-edits/COOKBOOK.md) for a concrete snapshot-and-condition flow.

Distinguish “applied” from “resolved.” Applying one wording change may not address the reviewer's underlying concern. A reviewer can confirm resolution, or the owner can close it under an explicit policy with an explanation. Do not imply that every reviewer approved the final document merely because their comments were marked resolved.

For two suggestions touching the same passage, show the overlap and choose an order or merged proposal. Applying the second against stale offsets can damage unrelated text. Preserve the person's current draft if a save or application fails, and reconcile the original command outcome before creating a new intent.

## Make review and publication scope clear

A review request should name the revision, deadline if relevant, and expected decision: factual check, wording suggestions, or approval of an exact release. These are different commitments. If exact approval is needed, use a deliberate [proposal policy](../review-exact-proposal/COOKBOOK.md) rather than interpreting a casual comment as permission.

Show unresolved comments, outdated anchors, and unreviewed changes before publication. The person may choose to publish with known issues if authorized and appropriate; record that choice rather than hiding warnings behind a “clean” badge. A publication receipt should name the actual version and destination. Copying text, exporting a file, saving shared state, and sending to an external audience are distinct actions.

Private reviewer notes need an appropriate server-authorized projection. Hidden comments or targeted conversation messages are not a private storage boundary. Recheck access before displaying cached text or old review snapshots and invalidate in-flight reads when identity changes. Keep document content out of notification previews when it could expose private information.

## Support ordinary writing behavior

Preserve caret, selection, input composition, undo history where the chosen editor supports it, and scroll position during remote updates. Use clear save status without interrupting each keystroke. Offer meaningful keyboard navigation through comments and a predictable return to the text anchor. A visible marker should not rely on color alone; a comment list should remain useful without a precise pointer.

Useful additions include compare-to-reviewed-version, comment filters, a revision timeline, and a compact export with source/version information. Avoid promising full formatting fidelity before testing the chosen export path. If exporting only current text, say that comments and history are excluded; if exporting review history, preserve its access and redaction rules.

## Verify context and authorship under change

| Scenario | Expected observation |
| --- | --- |
| The same quoted phrase appears twice. | A comment stays on its exact reviewed anchor or asks for clarification. |
| A passage is moved, split, or deleted. | Feedback remains attributable; ambiguous re-anchoring is not silently accepted. |
| An agent suggestion arrives while the person types. | The current draft and composition survive; the suggestion remains separately reviewable. |
| Two suggestions overlap. | Their conflict is visible before applying a stale replacement. |
| A save reply is lost, then the person edits again. | The pending snapshot and new draft remain distinct and recoverable. |
| A reviewer resolves a comment on an older revision. | The resolution does not automatically approve later unreviewed changes. |
| Access is revoked during a comment/document fetch. | A late response cannot restore private content. |
| Publish or export after further edits. | The output identifies and contains the exact intentionally selected revision. |

This guide remains explained. Record editor interaction, serialization/export, and actual authorization checks for the chosen implementation before claiming reliable coauthoring or review enforcement.
