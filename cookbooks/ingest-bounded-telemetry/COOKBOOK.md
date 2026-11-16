---
id: "ingest-bounded-telemetry"
title: "Ingest telemetry with a bounded budget"
summary: "Choose acquisition and spool behavior while making backpressure, retention, and data loss explicit."
group: "Keep work dependable"
tags: ["telemetry", "spool", "retention"]
choices: ["File tail, snapshot command, or remote source", "Scoped producer identity and stable retry records", "Bounded spool, backpressure, and explicit loss"]
capabilities: []
evidence: "explained"
related: ["turn-records-into-signals", "present-live-measurements", "observe-long-running-process"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/collector/lib/stream-collector.mjs"]
---

# Ingest telemetry with a bounded budget

Use an independent collector when data arrives while an agent is absent or a browser is closed. A browser-only connection may serve a short attended experiment. The collector owns acquisition and delivery reliability; the page owns interpretation and display. If only an occasional report is needed, a reviewed snapshot avoids an unnecessary always-running process.

## Start with an operator journey

Imagine a remote training job that writes numeric records overnight. The operator needs to set up a source, confirm that the expected run is arriving, leave it running, identify a stalled or lossy feed, and close it without losing admitted records. A useful collector experience therefore includes setup validation, a first-record preview, delivery status, backlog inspection, and an explicit stop/drain choice.

Before collecting a large backlog, claim the page and inspect effective stream limits. Choose its ongoing lifetime deliberately; producer activity neither claims a page nor proves that an agent is available. Keep the collector's scoped producer credential apart from the administrative handle. Show its safe source name and allowed streams in status views, never the credential.

During setup, compare one original record with its proposed output: source, run, time, units, selected fields, and approximate size. Do not launch a command source while merely previewing configuration. Treat partial provisioning as recoverable partial work: created streams or a received credential may exist even if a later step fails. Follow [core's collector reference](https://github.com/werg/tendriller/blob/7c6e61529e8878a1dc3585f2eb4d9cc8945f734d/docs/tools/COLLECTOR.md) for exact commands and recovery files rather than retrying setup with assumptions of rollback.

## Choose acquisition and its failure meaning

| Source | Useful when | Decision to make before starting |
| --- | --- | --- |
| Durable append-only log | The process already records complete observations. | File identity, rotation/truncation handling, partial trailing lines, and checkpoint recovery. |
| Snapshot command | A bounded current table is authoritative. | Timeout, overlap policy, environment, and whether an older snapshot may be replaced. |
| Remote source | Another system owns acquisition and authentication. | Polling budget, credentials, source cursor, outages, and rate-limit behavior. |
| Browser acquisition | A person is present and operating a device. | Suspension, explicit permission, stop behavior, and what is lost when the page closes. |

A snapshot is not an append-only history. A file-tail offset is not proof of delivery. A command source executes a deliberately configured command with an explicit environment; telemetry contents must never become arbitrary commands. Preserve malformed input as a diagnostic or quarantine reference, within its own byte and privacy budget, rather than coercing it into a zero measurement.

Grant only the intended stream-append authority. If the task requires intervention, design a separate authorized control path; an append credential is not an administrative control channel. Label source-provided run metadata separately from server-assigned producer identity.

## Budget every layer

Set maximum line/frame size, output record size, spool bytes, pending records, retry/backoff, and stream retention independently. Estimate a starting spool from admitted byte rate multiplied by tolerated outage duration, then allow for serialized envelope and filesystem overhead. For example, an illustrative 20 records/second at 500 admitted bytes for a ten-minute outage is about 6 MB before overhead. Measure the actual source, choose a margin, and state what happens when that budget is insufficient.

| At capacity | Consequence | Suitable only when |
| --- | --- | --- |
| Apply backpressure | Acquisition slows or pauses. | The upstream can tolerate waiting without harming its own task. |
| Drop newest | Earlier admitted history survives; fresh readings are missing. | Preserving the original interval is more important than recency. |
| Drop oldest | Current conditions remain visible; earlier context is lost. | A latest-state view is the declared product. |
| Stop acquisition | Loss is bounded and explicit. | An operator can repair the cause before proceeding. |

These are policy alternatives, not promises that every collector exposes each mode. Verify the selected implementation's actual behavior. A nonblocking tail of an existing durable log can leave unread data upstream; a live source may have no recoverable history. Report which boundary lost data and whether replay is possible.

Keep stable record identities through retry and durable spool recovery. Advance a file-tail checkpoint only when the bytes are safely represented under the spool policy. Upload acknowledgement and local dequeue must survive a crash without either skipping data or inventing a new observation. A bounded chart buffer is a separate presentation decision and cannot conceal collector loss.

## Make status actionable

Distinguish “source connected,” “last record acquired,” “last server acceptance,” and “last page update.” A process can be alive while its input stalls, and a page can be online while the collector is disconnected. Show the age of each meaningful timestamp, pending records/bytes, oldest queued age, rejected-record count, and known gaps. When exact counts are unavailable, label them as estimates.

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
| Display evicts old points | Operator status still exposes upstream loss and server retention separately. |
| Stop occurs during a backlog | The interface distinguishes acquisition stopped, draining, drained, and discarded work. |

These checks establish ingestion behavior for the chosen source and implementation. They do not establish measurement accuracy or agent attentiveness.
