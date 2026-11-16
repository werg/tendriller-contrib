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

Use local perception when a specific recognition task materially helps a person: reading a part label, suggesting objects to count, or locating a feature in an image. For a parts inventory, a useful flow lets the person select an image, crop the label, run recognition, correct uncertain text, and confirm a reviewed item. A model overlay is only one step in that experience.

Manual entry, a selected image region, or an uploaded document may be cheaper and more reliable. Keep that route available during engine preparation and failures. The extracted pose, object, and text adapters were experimental; their existence does not establish accuracy for any particular model, language, device, or task.

## Define the job before selecting a model

Name the input, expected output, tolerated errors, and the human decision it supports. “Read this serial number” differs from “recognize every object on this bench.” Exact text may need character-level correction; object suggestions may need add/remove controls; pose landmarks may require rejecting an entire frame when essential points are uncertain.

| Approach | Useful starting point | Reason to choose something else |
| --- | --- | --- |
| Manual label/region selection | Small volume or costly recognition mistakes. | Repeated work makes assisted entry worthwhile. |
| Narrow local recognition | A bounded input and understood vocabulary. | Unsupported script, image quality, or device budget. |
| Broader selected model | More varied inputs justify the cost. | Model size, errors, latency, and maintenance exceed the benefit. |
| Explicit remote interpretation | A separately approved service better fits the task. | Disclosure, network dependence, or policy makes it unsuitable. |

Processing location is a deliberate choice. An API named `detect` does not establish that inputs remain on the device. Verify the entire selected path, including workers, assets, telemetry, and fallback behavior. Do not silently send an image to a remote service when local processing fails.

## Give preparation its own experience

Document engine/model identity, reviewed executable and model asset provenance, licenses, expected resource size, supported inputs, and lifecycle. Pin assets when executable identity matters and keep notices with deliberately bundled dependencies. Do not hide a model or worker download behind an unrelated page-load action.

Show a preparation screen or inline status with the selected engine, resource requirement, progress if available, cancel, and manual entry. Distinguish unavailable assets, incompatible execution backend, failed initialization, and a valid engine that found no usable result. A cached model may avoid another download but does not authorize a new camera session.

Use an execution context that preserves interaction where the selected engine supports it. Test actual device responsiveness, memory, and startup latency rather than assuming a worker or accelerator solves every performance problem. Record the chosen backend as part of evidence when it materially changes results.

## Build the reviewed recognition loop

1. Select or capture the source and retain its immutable identity. Explain whether raw inputs or only reviewed results will be saved.
2. Let the person crop or orient the image, with a clear original preview. Bind the transformed input to the source and transformation revision.
3. Run one bounded inference and show progress plus Cancel. If a live stream is needed, use an explicit sampling policy and maximum in-flight work.
4. Present candidates beside the exact input. For OCR, offer editable text with uncertain regions highlighted in a non-color-only way. For objects, offer rename, add missed object, and remove false detection.
5. Review the resulting application record, including units or field meaning where appropriate. Recognition should not silently create a trusted inventory item or external action.
6. Save the reviewed result with the model/version and source reference, distinguishing model output from human correction.
7. Offer another input as a fresh action. Stop and release resources when the session ends.

For pose, define which landmarks and coordinate convention support the intended calculation. A low-confidence or missing joint should not produce a confident angle or repetition. For objects, no detection means the model did not produce a qualifying detection; it does not prove the object is absent. For text, preserve punctuation, leading zeros, and the original crop while the person corrects likely ambiguities.

## Confidence, geometry, and stale results

A confidence score is model-specific, not automatically a probability of correctness. Choose thresholds using representative examples and failure costs. Keep an “uncertain/review required” outcome instead of forcing every input into an apparently certain label. A threshold tuned on clean printed labels may fail on glare, handwriting, another script, or an unfamiliar part.

Define input dimensions, orientation, crop, resizing, and output coordinate system before drawing boxes or landmarks. Bind every result to its exact frame, engine version, and transformation. Use [annotation guidance](../annotate-a-frame/COOKBOOK.md) to map results to the displayed image. A late box from a prior frame must not float over whichever camera image is currently visible.

Bound concurrency. If inference is slower than capture, keep a latest pending frame or skip work according to the task rather than enqueueing every frame. Persist a page-owned attempt ID and task/source revision. Cancel or invalidate results after Stop, source replacement, language/model change, and task reset. Dispose of image buffers, worker sessions, and GPU/device resources through the engine's documented lifecycle.

## Review, accessibility, and retention

A results list should convey the same content as visual overlays: source, candidate label/text, relevant location, uncertainty, and correction controls. Make crop selection possible without a precision drag where feasible, and allow manual entry to complete the task. Avoid announcing every changing box from a live camera; announce stable results and meaningful state changes.

Decide separately whether to retain raw images, transformed crops, unreviewed predictions, and corrected application records. Saving all four indefinitely is rarely necessary. If source bytes need to remain inspectable, use an authorized retained reference and verify retention; an ID in application JSON is not an archive. Keep sensitive media out of shared state when its audience differs from the page's ordinary readers. See the [data-model guide](../choose-data-model/COOKBOOK.md) for the authority boundary.

## Evaluate and qualify the result

Use a labelled sample representing the actual task, including difficult and out-of-scope cases. Keep tuning examples separate from the final check, and report error types: missed items, false labels, text substitutions, unsupported inputs, and latency. Preserve the sample conditions, engine/model revision, preprocessing, thresholds, and known limits. A polished interface cannot substitute for that record.

Exercise missing assets, cancellation during preparation, no usable detections, repeated load/unload, orientation change, a new frame while inference is pending, and a result after Stop. Expected outcomes are retained manual work, no late submission, bounded resources, and correctly correlated results. Until evaluation demonstrates more, describe the output as an experimental aid requiring review. This explained guide adds acceptance criteria, not a new empirical accuracy claim.
