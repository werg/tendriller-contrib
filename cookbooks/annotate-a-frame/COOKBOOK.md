---
id: "annotate-a-frame"
title: "Annotate a particular image or frame"
summary: "Keep coordinates, identity, and transforms coherent when evidence is resized or replaced."
group: "Collect evidence"
tags: ["images", "coordinates", "identity"]
choices: ["Normalized coordinates or source pixels", "Paused frame, explicit tracking, or approximate live cue", "Local annotation drafts and shared committed edits"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "reconcile-concurrent-edits"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/overlay.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/photo-inspector/index.html", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Annotate a particular image or frame

Use an annotation when a location in an image matters: a damaged part, a step on a diagram, or a region that needs explanation. A textual reference may be simpler when the feature is unambiguous. An overlay must point to the evidence the agent actually examined, not whatever camera frame is visible now.

## Decide the coordinate model

Normalized coordinates make an annotation independent of display size, but only if you specify the frame's original width, height, orientation, and crop. Pixel coordinates are easier to compare with image processing output but require the exact source dimensions. Neither handles object-fit letterboxing or a rotated preview automatically. Calculate the displayed image rectangle and transform coordinates through it; never scale the overlay from the surrounding container alone.

Keep a stable frame/capture ID and, if needed, a task-step revision with every annotation. A new frame should not inherit old markings merely because it occupies the same DOM node. If evidence is reached through a shared-file path, retain the immutable content ID or exact file revision that was reviewed. The same path may later name another image. Retention and permission must be checked separately from identity. For moving video, choose a paused frame, a tracked object with an explicit tracking policy, or a deliberately approximate live cue. Label uncertainty rather than pretending the annotation tracks itself.

## Adapt and check

Store geometry separately from styling and interaction. Give text labels an accessible textual equivalent. Make deletion, selection, and edit ownership clear if several people annotate. Pointer movement can be local draft state; committing an annotation should use the relevant application concurrency policy.

Test portrait-to-landscape changes, resizing, letterboxing, zoom, a replaced frame, and late replies referencing an older capture. Check that text-only users can understand the target. Keep or explain an old annotated image when its source is no longer current; do not silently move a correct annotation onto unrelated evidence.
