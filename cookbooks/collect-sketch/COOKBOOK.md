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

Use a sketch when spatial relationships are hard to express in text. A file upload, pointer annotation on an existing image, or typed description can be more accessible. Offer an alternative that communicates the same intent rather than treating a canvas as the only valid input.

## Choose the drawing model

A bitmap is simple to capture and review but difficult to edit semantically. Strokes or vector objects preserve editability and identities but require choices about undo, erasure, ordering, and concurrency. A local draft can become an immutable submitted snapshot; sharing every pointer event is unnecessary unless live collaboration is the task.

Coordinate transforms matter on high-density displays, resize, zoom, and fullscreen. Keep the logical drawing space distinct from CSS pixels and device pixels. When the surface resizes, redraw the existing model rather than clearing it accidentally. Do not move another person's pending annotation by changing an array index.

## Adapt and verify

Separate draft, reviewed candidate, and submitted snapshot. Give Send, Discard, Undo, and Clear intentional meanings. Preserve the current drawing through page updates and late submission outcomes; acceptance of a previous snapshot must not clear new strokes. Associate the sketch with the question/task revision and use the current durable capture interface for bytes if submitting a raster image.

Test resize, rotation, pointer cancellation, keyboard alternatives, empty drawing, discard, reload, and send followed by new strokes. Check a late rejection and changed task generation. Review the captured bitmap before submission so a coordinate or rendering error is visible to the person rather than silently sent.
