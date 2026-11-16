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
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/ARTIFACTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/PREVIEW.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/cli/lib/pack.mjs"]
---

# Publish coherent page updates

Use this when a page has several files, lazy imports, nested HTML, or updates while someone is working. A plain single file remains a good option. There is one target runtime baseline; this guide concerns coherent current-system publications, not compatibility with old runtimes or data formats.

## Separate three identities

Cookbook provenance records where reasoning or copied snippets came from; adapted source belongs to the application. A deliberate unchanged executable dependency may need an exact version and integrity lock. A publication identifies the final authored bytes and exact target runtime. Do not confuse provenance with a requirement that a modified snippet match upstream hashes.

Pack the exact authored directory. Relative assets and lazy imports must resolve under the publication's actual serving contract, including nested HTML. An absolute application path can bypass a publication base, so inspect generated framework asset paths and routing assumptions. A client-side route fallback is a serving choice, not an automatic consequence of using a framework.

## Adapt update behavior

Use the public publication lifecycle to observe a new version, preserve or deliberately discard drafts, and apply it when the page is ready. Decide what should happen to active capture and pending work. A new file version does not authorize rebinding a protected command to a new task generation. A user-facing health state should distinguish serving failure, unavailable dependency, pending update, and stale page.

Preview must use the target runtime and the exact same page files. A missing authored asset remains missing; the preview must not fetch components from a catalog to complete the page. Explicit fixtures can simulate responses but cannot prove publication authorization or service transactions.

## Verify

Publish nested HTML with relative CSS, images, and lazy modules. Update during typing and while a command is pending. Break one authored dependency and confirm both preview and serving reveal it. Check manifest/runtime identity and offline recovery with fresh target-system state. Measure the minimal runtime graph and bytes separately from optional speech or application assets; count optional downloads only when actually selected.
