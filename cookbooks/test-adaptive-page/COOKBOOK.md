---
id: "test-adaptive-page"
title: "Test an adaptive page honestly"
summary: "Use exact authored files and explicit fixtures, then verify authority and transactions at the real service boundary."
group: "Keep work dependable"
tags: ["testing", "fixtures", "evidence"]
choices: ["Numerical, browser, publication, or actual-service evidence", "Explicit fixture capability and missing-capability cases", "Behavioral freedom without pixel or component identity"]
capabilities: []
evidence: "explained"
related: ["publish-coherent-updates", "capture-reviewed-evidence", "collect-private-responses"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/PREVIEW.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/test/portable/flows.spec.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/preview/test/preview-http.test.mjs"]
---

# Test an adaptive page honestly

Use this to decide what a test result actually establishes. A screenshot can reveal clipping or a missing control, but not privacy. A simulated accepted command can exercise the UI, but not prove the server's idempotency. Match the check to the guarantee.

## Choose the smallest meaningful layer

| Concern | Useful check |
| --- | --- |
| Numerical interpretation | Deterministic records with known expected values, gaps, and boundaries. |
| Draft/capture lifecycle | Browser interaction with delayed acceptance, rejection, reload, and cancellation. |
| Publication files | Exact directory, target runtime, nested paths, lazy imports, and an intentionally missing dependency. |
| Authorization/transactions | Fresh identities and storage against the actual service/trusted host. |
| Device behavior | Actual permission/engine/device checks plus denied/unavailable fallbacks. |

Fixtures should identify simulated data and capabilities explicitly. A missing capability must fail or show the chosen fallback; do not infer it from an obsolete workflow manifest or silently install support. Preview should use the production runtime and public support primitives, not a second permissive server implementation.

## Adapt the checks

Choose scenarios from the consequential decisions in the cookbook. Two different pilot layouts can prove that reasoning transfers without a common root element, CSS vocabulary, or state namespace. They do not need pixel equality. Keep a custom page with no contrib metadata and at least one nested or fullscreen/canvas adaptation.

Test both success and the failure that could lose meaning: delayed rejection, changed generation, revoked access, expired history, quota failure, or a stopped sensor's late callback. Record exact artifacts/revisions, commands, and observed limits. Keep “explained,” “exercised,” and “used in a real adaptation” distinct.

## Avoid false confidence

Do not run a full deployment for every prose edit; validate metadata, links, and changed reasoning. Do not use a fixture screenshot as evidence that private records cannot leak. Remove tests that only protect the shape of a retired product. Preserve tests of target guarantees and rewrite their setup from fresh target state.
