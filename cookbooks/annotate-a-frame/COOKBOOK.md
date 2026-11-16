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

Use annotations when position within evidence matters: a damaged hinge, a confusing step on a diagram, or a region in a photograph that needs explanation. For an inspection image, the complete task is to select the right evidence, identify a region, write an understandable note, review the combined result, and preserve it for later discussion. If a textual reference already identifies the feature unambiguously, an overlay may add unnecessary interaction.

An annotation belongs to the image the person or agent actually examined. It must not migrate onto a newer photo merely because the same DOM element now displays it. Decide whether the task needs a paused frame, a tracked object with an evaluated tracking policy, or a deliberately approximate live cue. A simple overlay does not track moving video by itself.

## Establish evidence and coordinate identity

Keep a stable frame/capture ID and the source's original dimensions, orientation, crop, and task revision. If reached through a shared-file path, retain the immutable content ID or exact file revision that was reviewed: the path can later name another image. Permission and byte retention remain separate from identity. A correct reference is not useful if the intended reader cannot access its source.

| Geometry choice | Useful when | Required context |
| --- | --- | --- |
| Source pixels | Comparing with image-processing output or exact crops. | Source width, height, orientation, and coordinate origin. |
| Normalized coordinates | Display size changes frequently. | The exact reference rectangle and transform convention. |
| Domain geometry | A diagram has semantic objects or calibrated axes. | Stable object IDs or the reviewed domain-to-image mapping. |

For normalized geometry, define whether `(0,0)` is the top-left of the upright decoded source or of a selected crop. Do not leave “normalized” ambiguous. A point `(0.25,0.5)` only has meaning within that chosen coordinate space. Store geometry independently from color, stroke width, selection state, and label placement.

## Map through the actual displayed image

A container may include letterboxing, cropping, zoom, pan, or rotation. Calculate the displayed image rectangle and its transform; never scale an overlay from the surrounding container alone. For a simple uncropped, upright image, subtract the image rectangle's left/top from a pointer location and divide by its displayed width/height to get normalized coordinates. Reject a pointer outside the image instead of clamping a click in the letterbox onto its edge.

That simple mapping does not cover `object-fit: cover`, mirrored camera previews, rotations, or a cropped source. Represent those transforms explicitly and apply their inverse when recording a pointer. Render stored source geometry through the forward transform. Choose one place to apply device-pixel scaling so a canvas overlay is neither offset nor scaled twice on a high-density display.

For rectangles or polygons, define clipping and minimum meaningful size. Clipping an off-screen annotation for display should not silently delete its stored geometry. If the application cannot map an old transform reliably, keep its original image/overlay view or mark it as requiring review rather than guessing new coordinates.

## Build the inspection workflow

1. Open the exact image with its source label and acquisition time. Keep a text description available when the image is unavailable or difficult to interpret.
2. Choose a simple tool suited to the task: numbered point, rectangle, polygon, or freehand mark. Prefer a point plus text when a complex shape adds no meaning.
3. Create a local draft marker and enter its note. Offer Cancel before committing; pointer movement should not produce a network mutation for every pixel.
4. Review the marker against the full image, zoomed context, and a list of notes. Let the person move, resize, rename, or delete it through explicit controls.
5. Save a coherent annotation revision bound to the source. If sending it to an agent, snapshot the selected annotations and question so later edits do not change the submitted request.
6. Present replies with the annotation/source IDs they address. A late answer should reopen or link its earlier evidence instead of appearing on the current retake.
7. Export or share a reviewed view with a legend and source reference. Retain editable geometry separately if future correction matters.

A flattened annotated image is convenient for sharing appearance. It loses some editability and may obscure original pixels. Preserve the unmodified source and geometry when the task requires audit or later interpretation; label the flattened export as a derived view.

## Make edits and collaboration deliberate

Use stable annotation IDs, not array indexes or mutable note text. Keep local drag/resize state apart from committed geometry. If several people can edit, decide whether a marker has one editor, whether changes use an exact revision check, and how conflicts are shown. A delayed save should not silently overwrite another person's corrected location.

Deletion can be represented as a revision/tombstone where history matters. Undo should restore the logical annotation through the chosen concurrency policy, not blindly replay a stale whole-image snapshot. Distinguish withdrawing an interpretation from deleting the original evidence. The [shared-editing guide](../reconcile-concurrent-edits/COOKBOOK.md) explains why those operations need stable identity and conflict behavior.

If a source image is replaced, keep the old annotations associated with it. Offer deliberate migration only when a person reviews the new source and transformation. “Copy to new image” creates new reviewed work; it is not a retry of an old command. Retain rejected drafts and current edits separately when a protected task generation changes.

## Accessibility and understandable review

Provide a numbered text list with each marker's note and a meaningful location description, such as “upper hinge beside the mounting screw.” Use labels as well as colors, sufficient visual contrast, and controls large enough to select without precision. Allow keyboard selection, delete, and positional adjustment; announce the selected marker and saved/rejected state without narrating every drag sample.

Keep focus predictable when deleting a marker or opening its note editor. Zoom and orientation changes should preserve the selected annotation and draft text. A screen reader user should be able to ask about the same region using the list and source description, even if they do not manipulate the overlay directly. Do not invent a confident spatial description when the source lacks that information; ask for a useful label.

## Acceptance scenarios

| Scenario | Expected observation |
| --- | --- |
| Resize, rotate, zoom, pan, or letterbox | The marker still targets the same source feature. |
| Click outside the image rectangle | No misleading edge marker is created. |
| Replace the image while a reply is pending | Old geometry and reply remain bound to the old source. |
| Save during concurrent edit or task reset | Conflict/rejection preserves the user's draft for review. |
| Delete and undo with a selected marker | Stable identity and focus behavior remain coherent. |
| Export a flattened view | Labels, source identity, and any omitted/editable context are explicit. |
| Source expires or access changes | An unavailable-source state replaces a misleading blank overlay. |

Test transforms against known points in the original image, including corners and crop boundaries. These checks verify geometry and continuity; they do not prove that the interpretation attached to a marker is correct.
