---
id: "select-local-perception"
title: "Add local perception with an explicit engine"
summary: "Choose model assets, confidence rules, coordinate conventions, and evaluation for optional pose, object, or text recognition."
group: "Choose inputs and algorithms"
tags: ["perception", "experimental", "models"]
choices: ["Manual interpretation versus a selected model", "Engine assets, provenance, and processing location", "Confidence, frame identity, and bounded inference"]
capabilities: []
evidence: "explained"
related: ["annotate-a-frame", "capture-reviewed-evidence", "discover-capabilities"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/pose.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/objects.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/text.js"]
---

# Add local perception with an explicit engine

Use local perception only when a specific recognition task makes it useful. A person selecting a region or typing a label may be cheaper, faster, and more reliable. The extracted pose, object, and text adapters were experimental. Their existence is not evidence that a particular model performs well on the user's task.

## Select the engine deliberately

Document model/engine identity, executable and model asset provenance, licenses, size, processing location, supported input, and lifecycle. An API named “detect” does not establish local processing. Keep resource installation explicit and pinned when executable identity matters. Do not download an unreviewed model or worker from a hidden default URL.

A confidence score is model-specific and is not automatically a probability of correctness. Choose thresholds using representative failures, including ambiguous text, occlusion, different lighting, and unrepresented cases. For text recognition, preserve the original image and allow correction. For pose, low-confidence joints should not produce a confident angle or repetition. For objects, distinguish an absent detection from a claim that the object is absent.

## Adapt the implementation

Define input orientation, crop, scaling, and output coordinate system before drawing results. Keep every result bound to the exact frame and engine version. Limit sampling and concurrent inference; stale results should be dropped or shown as stale when the camera or task changed. Do not let a slower model build an unbounded queue behind live capture.

Select a worker or appropriate execution context if inference would block interaction. Provide visible loading, missing-assets, failed-engine, and stopped states. Stop frames, workers, and GPU/device resources according to the engine's lifecycle. Keep a manual/file alternative that finishes the same task.

## Verify and qualify

Evaluate a representative labelled sample and record conditions, versions, error types, and limits. Exercise unavailable model assets, cancelled startup, orientation changes, a result arriving after stop, and repeated load/unload. Verify that annotations remain attached to the correct frame. Until those checks establish more, describe the integration as experimental and its output as an aid requiring review.
