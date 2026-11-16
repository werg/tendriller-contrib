---
id: "capture-rendered-evidence"
title: "Capture rendered evidence"
summary: "Choose between DOM rendering, browser capture, and underlying source data, and review what the capture leaves out."
group: "Collect evidence"
tags: ["capture", "rendering", "provenance"]
choices: ["Rendered appearance or source/data export", "DOM reconstruction or browser/screen capture", "Explicit readiness and reviewed disclosure"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "publish-coherent-updates"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/screenshot.js"]
---

# Capture rendered evidence

Use a rendered capture when appearance itself matters, such as discussing a visual defect or preserving a reviewed diagram. If exact values or editability matter, exporting the underlying data or source may be more useful than a screenshot.

## Choose what the capture proves

DOM-to-image libraries reconstruct supported page content; they do not necessarily capture what the browser painted. Cross-origin images, media, canvases, fonts, and unsupported CSS can be missing or different. Browser/screen capture can include more of the actual display, but its permission gesture, selected surface, privacy implications, and browser support differ. Neither should silently claim a complete record.

Wait for an explicit readiness condition rather than an arbitrary delay when reproducibility matters. Decide whether animations are frozen, lazy content is loaded, and the desired frame is stable. Associate the result with the page/publication and task state at capture time. A late screenshot of an updated page cannot serve as evidence for an earlier decision.

## Adapt and check

Give the person a preview and a chance to discard sensitive or incomplete content before submission. Label the capture method and any known omissions. Use the durable reviewed-evidence flow for upload and command status. If a third-party capture library is deliberately bundled, retain its notices and exact dependency identity; adapted application code needs no upstream byte lock.

Check cross-origin media, canvas/video, custom fonts, scrolling, hidden content, dynamic updates, and capture cancellation. Verify that a failed or blank capture is not sent as success. When exact evidence is required, compare the capture with the real browser and retain the underlying source where appropriate.
