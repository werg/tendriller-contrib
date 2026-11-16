---
id: "collect-sketch"
title: "Collect and discuss a sketch"
summary: "Choose a drawing model, preserve local work, and submit a reviewed snapshot with meaningful context."
group: "Collect evidence"
tags: ["canvas", "drafts", "review"]
choices: ["Bitmap snapshot or editable stroke/object model", "Local drawing versus live shared editing", "Resize, review, and pending-snapshot continuity"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "annotate-a-frame", "adapt-without-losing-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/collaborative-canvas/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/input-kit.js"]
---

# Collect and discuss a sketch

Use a sketch when spatial relationships are difficult to express in text: arranging a work area, showing how two parts connect, or proposing a room layout. The useful experience is to explain an idea, revise it without losing work, review what another person will see, and discuss an identifiable version. A blank canvas alone leaves too much of that workflow implicit.

Offer a file, an annotation on an existing image, or a typed description when that communicates the same intent more accessibly. Drawing must not be the only accepted form of input. If exact dimensions or geometric constraints matter, choose an appropriate structured model instead of pretending a freehand sketch is measured evidence.

## Choose the smallest drawing model that serves the task

| Model | Useful when | Additional decisions |
| --- | --- | --- |
| Bitmap | A quick illustration will be reviewed as an image. | Resolution, quality, resizing, and limited semantic editing. |
| Stroke model | Freehand editing and reliable redraw matter. | Stroke identity, erasing, undo grouping, and storage budget. |
| Vector objects | Labels, shapes, connectors, or dimensions matter. | Selection, constraints, ordering, and object-level edits. |
| Shared live model | Simultaneous drawing is central to the task. | Ownership, conflicts, presence, and coordinated undo. |

A local editable draft that becomes an immutable submitted snapshot is often sufficient. Sending every pointer movement is unnecessary when another person only needs the reviewed result. Live collaboration should be a deliberate feature with a conflict policy, not an accidental consequence of putting the drawing array in shared state.

For a workspace layout, simple labelled rectangles and arrows may be easier to revise and describe than freehand strokes. A loose concept sketch may benefit from pen, eraser, and text labels. Avoid adding tool palettes that obscure the central task on a small display.

## Build a complete drawing and discussion flow

1. Show the task/question, a modest initial drawing area, and a text alternative. Let the person add an optional reference image with its own identity and disclosure choice.
2. Provide a few clearly labelled tools: draw or shape, text, select, undo, and clear. Make the active tool visible without relying on color alone.
3. Preserve the editable model as the person works. Show whether it is saved locally, saved to an authorized server draft, or present only in the current tab.
4. Offer **Review sketch**. Create a candidate rendering and show the note, task context, and source dimensions that will accompany it.
5. Let the person return to editing, discard the candidate, or send the reviewed version. Returning to edit should not clear the drawing.
6. During delivery, keep the submitted snapshot separate from the current draft. The person may continue drawing without changing what was already sent.
7. Present replies alongside their sketch revision. Offer **Revise from this version** or **Ask about this area** as explicit continuations.

Send, Undo, Clear, and Discard need distinct meanings. Undo reverses a local logical edit; Clear removes the current drawing through a recoverable action where feasible; Discard candidate abandons a prepared snapshot; discarding a sent card does not undo a server-accepted submission.

## Keep coordinate spaces coherent

Separate logical drawing coordinates from CSS display size and device pixels. Record the logical canvas dimensions, orientation, and any crop/transform for snapshots. Pointer coordinates must map through the actual drawing rectangle, including zoom and pan. A high-density display may use more backing pixels without changing the logical geometry.

When the surface resizes, redraw from the preserved model or an intentionally rescaled bitmap. Do not accidentally clear the drawing by recreating its backing store. Decide whether resizing changes only the viewport or the document size. If the document changes, show how content is fitted or clipped and allow the person to review it.

Keep strokes/objects identified independently of their array position. A late annotation should refer to a stable object or snapshot, not “the third rectangle” after another object has been inserted. Follow [frame annotation](../annotate-a-frame/COOKBOOK.md) when attaching agent-generated geometry to a captured sketch.

## Drawing, editing, and undo

Group a pointer gesture into one logical stroke or edit so a single Undo does something understandable. Handle pointer cancellation and lost capture: choose whether the partial stroke is retained for review or discarded, and avoid connecting the next gesture to its last point. Pressure and tilt can enhance drawing where available, but a simple pointer must produce a useful line.

For an eraser, decide whether it removes whole strokes/objects or modifies bitmap regions. Explain that difference through predictable behavior rather than a hidden implementation detail. Bound undo history by meaningful operations or storage size and explain when old history is no longer available. A Clear action can be undoable without retaining every intermediate rendered bitmap.

In a shared model, undo needs an ownership and concurrency policy. Reversing a user's own object edit with an exact revision check is different from restoring an old whole-canvas snapshot over someone else's changes. Use the [shared-editing guide](../reconcile-concurrent-edits/COOKBOOK.md) when simultaneous editing is necessary. For simpler tasks, individual drafts plus reviewed submissions avoid that complexity.

## Persistence and durable submission

Keep draft, reviewed candidate, and submitted snapshot distinct, each with its task revision. The snapshot should include the exact raster bytes or chosen serialized document, the accompanying explanation, and enough dimensions/context for interpretation. Do not read the current mutable canvas again while retrying an earlier submission.

Use the current public capture interface for submitted raster bytes. In a protected task, capture the relevant scope context when the action begins and retain it through rendering and upload. A task reset while encoding is pending should produce an explicitly outdated candidate or rejection, not a sketch silently attached to the new task. The [reviewed-evidence guide](../capture-reviewed-evidence/COOKBOOK.md) covers command outcomes and runtime capture identity.

A local storage failure must leave the current drawing available in memory with an honest status and a save/download route. Do not promise reload recovery when no durable copy exists. Revoke temporary object URLs and release discarded buffers when leaving the flow. If raw reference images or annotations are sensitive, decide their retention and audience separately from the final sketch.

## Accessibility and review quality

Provide text labels for objects, an optional overall description, and keyboard controls for selection, movement, ordering, and deletion where the drawing model supports them. A fully equivalent freehand keyboard experience may be impractical; the typed/file alternative must still communicate the intended task. Keep visible focus and adequate contrast for controls and marks.

Before submission, show the actual generated image, including its background and boundaries. Transparent areas, clipped labels, tiny text, or wrong scaling should be visible in review. Let the person add an explanatory note and identify which details are approximate. An agent should not infer precise lengths from a sketch that carries no scale.

## Acceptance scenarios

Test resize, rotation, zoom, high-density rendering, pointer cancellation, keyboard alternatives, empty drawing, and clear/undo. Send a snapshot, then draw new strokes before acceptance and rejection: neither outcome may erase the new draft. Reload with and without working draft storage and describe recovery honestly. Change task generation during rendering and keep the original context. Review exports for clipped or missing content and verify that replies still address the submitted version. These are proposed interaction checks, not a claim that every drawing engine has been exercised.
