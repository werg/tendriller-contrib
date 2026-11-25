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

## Plan verification around a user promise

For a reviewed-photo page, the promise might be: “You can inspect what will be sent, keep a new draft while it is pending, and recover if the task changes.” Turn that into observable outcomes before choosing a test runner. The review image must match the submitted bytes, delayed acceptance must not erase new typing, and stale rejection must preserve a recoverable snapshot. A passing screenshot of the initial screen covers none of these transitions.

Write a small acceptance matrix with the starting identity and state, action, injected failure or timing, expected visible outcome, and authoritative record to inspect. Include the happy path and the few failures that could lose work, change intent, leak information, or mislead a decision. Select evidence proportionate to the claim; do not create a huge suite that merely repeats the markup structure.

| User promise | Representative acceptance scenario | Evidence boundary |
| --- | --- | --- |
| A draft survives submission | Type new text while the earlier send is awaiting acceptance and rejection. | Browser continuity; service receipts require a separate real-boundary check. |
| A result is trustworthy | Inspect exact raw values, units, missing data, and a known numerical reference case. | Interpretation and rendering, not originating sensor accuracy. |
| A workflow is private | Access records using distinct real roles, then revoke access during an outstanding read. | Actual trusted host for authority; browser fixture for late-render suppression. |
| An update is coherent | Load nested assets, defer with a draft, then apply a complete publication. | Exact publication/runtime files plus live publication behavior when claimed. |
| A task resumes | Restart after effect success but before acknowledgement and reconcile the same event. | Actual receiver/effect policy, not a simulated connected indicator. |

## Exercise the whole interaction, including access needs

Test fresh arrival, useful empty states, representative work, completion, return, and recovery. A form that works only with prefilled fixtures has no verified onboarding path. Use keyboard-only operation, meaningful labels, visible focus, narrow layouts, and readable error/status text. Check that live updates do not steal focus or read every telemetry sample aloud. Automated accessibility checks can reveal specific defects; task-based inspection remains necessary for whether the interaction makes sense.

Use realistic record sizes and deliberately small resource limits to expose boundaries quickly. Test one representative burst, one full queue, and one retention gap when those are consequential. Do not infer production capacity from a synthetic benchmark without its environment and load assumptions. Review exported data as well as on-screen output so an incomplete view cannot become a falsely complete artifact.

A staged test should leave a recoverable environment. Identify which identities, streams, publications, or private records it creates, use fresh test state, and clean up through normal authorized operations. Do not repurpose a real person's pending work as fixture data. Preserve only the evidence needed to reproduce the result, with credentials and unnecessary private content removed.

## Choose the smallest meaningful layer

| Concern | Useful check |
| --- | --- |
| Numerical interpretation | Deterministic records with known expected values, gaps, and boundaries. |
| Draft/capture lifecycle | Browser interaction with delayed acceptance, rejection, reload, and cancellation. |
| Publication files | Exact directory, target runtime, nested paths, lazy imports, and an intentionally missing dependency. |
| Authorization/transactions | Fresh identities and storage against the actual service/trusted host. |
| Device behavior | Actual permission/engine/device checks plus denied/unavailable fallbacks. |

Fixtures should identify simulated data and capabilities explicitly. A missing capability must fail or show the chosen fallback; do not infer it from an obsolete workflow manifest or silently install support. Preview should use the production runtime and public support primitives, not a second permissive server implementation.

## Exercise connected flows locally before the owner's final handoff

Choose the route according to the claim. `tendril-preview` serves authored files
for layout inspection; an explicit synthetic bootstrap can exercise UI states
but does not prove owner sign-in, key provisioning or persistence. The starter's origin
guard intentionally keeps an unrelated localhost preview disconnected.

For connected desktop/phone flows before production sign-in, use the
[verified local release host](https://github.com/werg/tendriller/blob/master/docs/LOCAL_HOST.md)
with the same exact package composition. Create a separate local test project,
synthetic owner and fresh device storage. Create, prepare, publish, sign in as the
owner, explicitly provision a second device key and exercise that application's real command/read path on localhost.
Keep production handles, signing profiles and journals out of that fixture;
never bridge a layout preview to a production owner merely to remove a gate.

Walk the important empty, editing, save/Undo and error paths at desktop and
390 × 844 phone widths and retain before/after captures of observed friction.
Then verify the delivered application's actual signed publication, authorized
connection, remote read and persistence. Local synthetic authentication does
not qualify live OAuth, account-linked MCP, Internet NAT traversal or physical
phone behavior. A screenshot alone does not establish those results.

Use the available real browser for interactive checks, or the documented
Playwright setup for headless checks. A missing runner is a tooling prerequisite,
not a reason to add another preview server or report an unexecuted test as passed.

## Adapt the checks

Choose scenarios from the consequential decisions in the cookbook. Two different pilot layouts can prove that reasoning transfers without a common root element, CSS vocabulary, or state namespace. They do not need pixel equality. Keep a custom page with no contrib metadata and at least one nested or fullscreen/canvas adaptation.

Test both success and the failure that could lose meaning: delayed rejection, a late earlier operation that revises the outcome, revoked access, expired history, quota failure, or a stopped sensor's late callback. Record exact artifacts/revisions, commands, and observed limits. Keep “explained,” “exercised,” and “used in a real adaptation” distinct.

## Browser suspension and cached restoration

A browser may restore a document from the back/forward cache without re-running
its scripts or initializing a new page. Test that path separately from a reload:
a `pagehide` / persisted `pageshow` pair must not leave capability listeners,
active-sensor indicators, or stop controls permanently detached. Resubscribe on
restoration, refresh current status, and discard permission or device reports
that arrive after the observer is stopped or superseded by a newer read.

Sensitive views have a stronger requirement: clear the visible projection when
the page is hidden and reauthorize the current identity before restoring drafts
or records. Increment an authorization epoch on revocation/suspension so that
late successful reads *and late error handlers* cannot repaint data from a prior
identity. Retrying a durable submission must still use its original captured
command, not an implicitly reconstructed one.

Synthetic persisted page-transition events can exercise lifecycle handlers
deterministically; they do **not** prove that an actual browser admitted the
document to BFCache. When that guarantee matters, add real back/forward
navigation on the intended browsers and separately test denied permissions,
foreground suspension, and stop actions.

## Avoid false confidence

Do not run a full deployment for every prose edit; validate metadata, links, and changed reasoning. Do not use a fixture screenshot as evidence that private records cannot leak. Remove tests that only protect the shape of a retired product. Preserve tests of target guarantees and rewrite their setup from fresh target state.

## Record a result that another maintainer can assess

Keep the command, exact authored-file identity, public core artifact/revision, fixture declarations, scenario scope, observed result, and known limits together. A failed scenario should state the expected and actual behavior and the recovery used. Do not erase a failure by weakening the claim to whatever happened to pass.

After a change, rerun the checks that cover the affected guarantee and its integration boundary. Broaden only for a concrete remaining risk or required gate. Prose edits need metadata/link validation and reasoning review; changed arithmetic needs reference cases; changed authority requires actual host checks. Preserve the distinction between a proposed scenario and an executed one, and retain earlier pilot evidence under the exact conditions it established.
