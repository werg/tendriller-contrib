---
id: "ingest-bounded-telemetry"
title: "Ingest telemetry with a bounded budget"
summary: "Choose acquisition and spool behavior while making backpressure, retention, and data loss explicit."
group: "Keep work dependable"
tags: ["telemetry", "spool", "retention"]
choices: ["File tail, snapshot command, or remote source", "Scoped producer identity and stable retry records", "Bounded spool, backpressure, and explicit loss"]
capabilities: []
evidence: "exercised"
related: ["turn-records-into-signals", "present-live-measurements", "observe-long-running-process"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/collector/lib/stream-collector.mjs"]
---

# Ingest telemetry with a bounded budget

Use an independent collector when data arrives while an agent is absent or a browser is closed. A browser-only connection may serve a short attended experiment. The collector owns acquisition and delivery reliability; the page owns interpretation and display. If only an occasional report is needed, a reviewed snapshot avoids an unnecessary always-running process.

Choose whether the task needs retained observations before introducing a spool.
A current-value instrument can send [ephemeral signals](../share-live-signals/COOKBOOK.md)
and consume `latest`, with source identity and a visible freshness deadline. It
needs neither a durable application log nor finality. Selected samples, required
alarms and final summaries can be retained separately. The spooling and receipt
guidance below applies when admitted observations must survive an outage; an
ephemeral channel deliberately does not replay a backlog on reconnect.

## Start with an operator journey

Imagine a remote training job that writes numeric records overnight. The operator needs to set up a source, confirm that the expected run is arriving, leave it running, identify a stalled or lossy feed, and close it without losing admitted records. A useful collector experience therefore includes setup validation, a first-record preview, delivery status, backlog inspection, and an explicit stop/drain choice.

Prepare and publish the ready signed UI before asking the owner to claim the
page. The selected service's `/api/service` advertises publication capacity,
currently **8 MiB per authored file and 25 MiB per page, including retained
control bytes**. Claim does not increase that capacity. An unclaimed page expires
after **24 hours**; producer activity neither claims it nor establishes an agent's
availability. Follow the [current setup guide](https://github.com/werg/tendriller/blob/9e24deea741f828890feb7ea26d62b292df19518/docs/BUILD_AN_APP.md)
for the selected service origin.

These host publication limits and the unclaimed-page expiry are independent of
the application's observation retention and source spool. Define their byte,
record and age budgets in the application and acquisition process; do not use
host capacity as a telemetry allowance or assume claim creates a retention policy.

An independently running producer opens the same owned Chronolog application
session. Review its device enrollment and grant only the required data role and
control rights. Enforce allowed observation commands and signal topics in
application policy; source labels and topic names are not grants. Declare stable source/run identities, use ephemeral
signals for transient readings, and submit retained observations through domain
commands. Keep parsing, calibration and a bounded source spool separate from the
maintained command retry journal. The [session tooling](https://github.com/werg/tendriller/blob/9e24deea741f828890feb7ea26d62b292df19518/docs/tools/CLI.md)
exposes this session; there is no second hosted stream/collector data endpoint.
Keep the producer's private device storage and credentials apart from the
administrative host handle and out of authored pages and exports. Show its safe
source name and allowed operations, never its credential.

The source-pinned collector documents and code in this recipe's `sources` are
historical provenance for acquisition and spool reasoning, not a current
installation path. Acquisition health, stored commands, materialized observations,
retained coverage and agent handling remain distinct.

## Choose acquisition and its failure meaning

| Source | Useful when | Decision to make before starting |
| --- | --- | --- |
| Durable append-only log | The process already records complete observations. | File identity, rotation/truncation handling, partial trailing lines, and checkpoint recovery. |
| Snapshot command | A bounded current table is authoritative. | Timeout, overlap policy, environment, and whether an older snapshot may be replaced. |
| Remote source | Another system owns acquisition and authentication. | Polling budget, credentials, source cursor, outages, and rate-limit behavior. |
| Browser acquisition | A person is present and operating a device. | Suspension, explicit permission, stop behavior, and what is lost when the page closes. |

A snapshot is not an append-only history. A file-tail offset is not proof of delivery. A command source executes a deliberately configured command with an explicit environment; telemetry contents must never become arbitrary commands. Preserve malformed input as a diagnostic or quarantine reference, within its own byte and privacy budget, rather than coercing it into a zero measurement.

Grant only the intended observation commands and signal topics. If the task requires intervention, design a separately authorized control path; permission to submit observations is not administrative authority. Label source-provided run metadata separately from the authenticated session producer identity.

## Budget every layer

Set maximum line/frame size, output record size, spool bytes, pending records, retry/backoff, and application observation retention independently. Estimate a starting spool from admitted byte rate multiplied by tolerated outage duration, then allow for serialized envelope and filesystem overhead. For example, an illustrative 20 records/second at 500 admitted bytes for a ten-minute outage is about 6 MB before overhead. Measure the actual source, choose a margin, and state what happens when that budget is insufficient.

| At capacity | Consequence | Suitable only when |
| --- | --- | --- |
| Apply backpressure | Acquisition slows or pauses. | The upstream can tolerate waiting without harming its own task. |
| Drop newest | Earlier admitted history survives; fresh readings are missing. | Preserving the original interval is more important than recency. |
| Drop oldest | Current conditions remain visible; earlier context is lost. | A latest-state view is the declared product. |
| Stop acquisition | Loss is bounded and explicit. | An operator can repair the cause before proceeding. |

These are policy alternatives, not promises that every collector exposes each mode. Verify the selected implementation's actual behavior. A nonblocking tail of an existing durable log can leave unread data upstream; a live source may have no recoverable history. Report which boundary lost data and whether replay is possible.

Keep stable record identities through retry and durable spool recovery. Advance a file-tail checkpoint only when the bytes are safely represented under the spool policy. Command recording, materialization receipts and local dequeue must survive a crash without either skipping data or inventing a new observation. A bounded chart buffer is a separate presentation decision and cannot conceal collector loss.

If the acquisition source reports unified GPU memory, verify its hardware and
field semantics before displaying a combined budget. Missing `nvidia-smi`
framebuffer counters alone do not establish unified memory. Keep unsupported
models explicitly unknown, and do not add shared GPU RAM to the host RAM total.

## Make status actionable

Distinguish “source connected,” “last record acquired,” “last command recorded,” “last observation materialized,” and “last page update.” A process can be alive while its input stalls, and a page can be online while the collector is disconnected. Show the age of each meaningful timestamp, pending records/bytes, oldest queued age, rejected-record count, and known gaps. When exact counts are unavailable, label them as estimates.

Choose thresholds from the source cadence rather than a universal stale timeout. A once-per-minute snapshot should not appear broken after ten seconds. Provide plain-language actions for common faults: inspect input format, recover a credential file, free spool space, reconnect a source, or review retention. Use text and icons together; a color-only health lamp is insufficient. Avoid live-announcing every sample to assistive technology; announce transitions into or out of a degraded state.

Prefer a compact operator summary with an expandable diagnostic view over exposing raw logs by default. Diagnostic exports should redact credentials, source paths that reveal sensitive information, and raw records not required for troubleshooting. Bounded storage still needs an owner and deletion policy.

## Stop and recover deliberately

Separate stopping new acquisition from draining already admitted records. Show whether a drain can finish and how long the remaining backlog is expected to remain locally. If the operator chooses to discard pending data, report the range/count when known and preserve a loss marker under the task's policy. Restart from a validated checkpoint and verify the same source/run identity; changing a source definition may require a new interpretation or run.

For revocation, repeated permanent rejection, or an invalid source, stop futile retries and retain recoverable state according to its sensitivity. A recovered configuration must preserve the original scoped credential and pending record identities. Never silently substitute an administrative token to make ingestion succeed.

## Verify the chosen policy

| Scenario | Expected observation |
| --- | --- |
| Outage fills the spool | The declared backpressure/loss/stop policy occurs, with visible accounting. |
| Upload is accepted but its reply is lost | Retry retains record identity; recovery does not create a new logical observation. |
| Source file rotates, truncates, or ends in a partial line | The chosen source-identity policy handles it without joining unrelated records. |
| Producer is revoked | Delivery becomes explicitly blocked and credentials remain absent from logs. |
| One oversized or malformed record arrives | It is rejected or quarantined visibly; later valid input follows the stated policy. |
| Process restarts with pending work | The spool and checkpoint reconstruct one coherent backlog. |
| Display evicts old points | Operator status still exposes upstream loss and application retention separately. |
| Stop occurs during a backlog | The interface distinguishes acquisition stopped, draining, drained, and discarded work. |

For native-hosted private or local API feeds where credentials must stay strictly on the native host and zero durable Chronolog records are needed, see the [runnable private-API feed snippet](snippets/private-api-feed.mjs) and its [executable check](checks/private-api-feed.test.mjs) (paired with `helpers/data-feed.mjs` in the starter).

These checks establish ingestion behavior for the chosen source and implementation. They do not establish measurement accuracy or agent attentiveness.
