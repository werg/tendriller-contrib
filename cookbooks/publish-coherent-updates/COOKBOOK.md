---
id: "publish-coherent-updates"
title: "Publish coherent page updates"
summary: "Keep authored assets, runtime identity, nested paths, and draft-aware updates consistent within one target system."
group: "Keep work dependable"
tags: ["publication", "integrity", "updates"]
choices: ["Provenance, deliberate dependency, and final publication identity", "Nested relative files and explicit routing assumptions", "Draft-aware publication readiness and update behavior"]
capabilities: []
evidence: "explained"
related: ["publish-smallest-page", "adapt-without-losing-work", "test-adaptive-page"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/ARTIFACTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/PREVIEW.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/cli/lib/pack.mjs", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Publish coherent page updates

Use this when a page has several files, lazy imports, nested HTML, or updates while someone is working. A plain single file remains a good option. There is one target runtime baseline; this guide concerns coherent current-system publications, not compatibility with old runtimes or data formats.

## Separate three identities

Cookbook provenance records where reasoning or copied snippets came from; adapted source belongs to the application. A deliberate unchanged executable dependency may need an exact version and integrity lock. A publication identifies the final authored bytes and exact target runtime. Do not confuse provenance with a requirement that a modified snippet match upstream hashes.

Pack the exact authored directory. Relative assets and lazy imports must resolve under the publication's actual serving contract, including nested HTML. An absolute application path can bypass a publication base, so inspect generated framework asset paths and routing assumptions. A client-side route fallback is a serving choice, not an automatic consequence of using a framework.

## Separate transfer from publication

Upload immutable bytes first, then commit their use. An upload completion confirms one verified byte object; it does not advance a shared-file reference or the published page. Keep the upload session identity separate from the command that commits a named file or publication. A lost response should resume the same original intent, including its byte digest and concurrency guards.

A shared-file write compares the previous revision of that path. A publication compares the current publication-head revision and commits a complete file manifest with an existing entry point. These are distinct guards. If either conflicts, review the current state before making a new command; do not fetch a newer revision merely to make the old request pass. Reusing already verified bytes does not authorize overwriting a newer reference. The publication head changes for every switch, including rollback and a portable-copy import. A version number can return to an earlier value; a captured head revision must still detect the intervening change.

Enumerate, hash, and review the exact source snapshot before transfer. Reject missing files, duplicate or noncanonical paths, and a missing entry. If local bytes change during a resumable operation, choose a new operation after review. A saved upload receipt for an earlier digest cannot stand in for the newly edited file. An intentional merge still ends in one explicit complete manifest; do not silently discover extra files while committing it.

Retained byte objects can have several reasons to remain available, such as an active file reference or a retained publication. Unreferenced page and agent uploads expire; their returned metadata states that expiry. Removing one name or pin is not proof that all references were removed, and retaining bytes grants no new read authority. Follow the current core retention and access contract rather than deriving lifetime from a UI label.

## Review an independent copy

A portable copy should preserve the actual authored entry and complete file graph. Decide explicitly whether it includes current application state, context, media, and active shared-file heads. Credentials, device identities, scope bindings, private workflow records, receiver checkpoints, and file revision history are separate authority or history concerns; their omission must be visible to the receiving application.

Stage the copy for review before switching the destination. Capture the destination publication head and each imported shared path's revision before asynchronous transfer. Publication, imported file heads, and restored state must commit together under the same current authority checks as ordinary writes. An intervening edit rejects the complete import, so a partially restored page cannot appear current. Review the conflict before issuing a new command.

Copying the same code repeatedly should not accumulate it as duplicate application media. Preserve exact referenced evidence where it is used, bound the encoded portable payload independently of physical deduplication, and verify the bytes again before publication. A successful current-format copy establishes no guarantee about a historical format or private-media authorization.

## Adapt update behavior

Use the public publication lifecycle to observe a new version, preserve or deliberately discard drafts, and apply it when the page is ready. Decide what should happen to active capture and pending work. A new file version does not authorize rebinding a protected command to a new task generation. A user-facing health state should distinguish serving failure, unavailable dependency, pending update, and stale page.

Preview must use the target runtime and the exact same page files. A missing authored asset remains missing; the preview must not fetch components from a catalog to complete the page. Explicit fixtures can simulate responses but cannot prove publication authorization or service transactions.

## Verify

Publish nested HTML with relative CSS, images, and lazy modules. Interrupt between upload completion and the publication commit; the old page remains coherent. Race two writers against the same publication head and review the conflict. Publish a new version, roll back to the earlier one, and verify an old head guard still fails. Import a reviewed copy while another writer changes a destination shared file; confirm the page, files, and application state remain unchanged after the rejected import. Resume after changing local bytes and confirm the old operation is not silently repurposed. Update during typing and while a command is pending. Break one authored dependency and confirm both preview and serving reveal it. Check manifest/runtime identity and offline recovery with fresh target-system state. Measure the minimal runtime graph and bytes separately from optional speech or application assets; count optional downloads only when actually selected.
