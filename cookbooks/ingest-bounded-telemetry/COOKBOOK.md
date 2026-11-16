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

Use an independent collector when data arrives while an agent is absent or a browser is closed. A browser-only connection can be enough for an interactive short experiment. The collector owns acquisition and delivery reliability; the page owns interpretation and display.

## Choose acquisition

Tail a durable append-only log when the source already writes one. Use a snapshot command when a bounded current table is the source of truth. Use a remote fetch when another system owns acquisition and authentication. A command source has execution, timeout, and environment implications; do not run arbitrary text received from telemetry as a command.

Grant a scoped producer credential that can append only to intended streams. Keep the administrative page handle elsewhere. Collector liveness does not prove an agent conversation is available, nor does it claim or extend a page's lifetime by itself.

## Budget every layer

Set maximum line/frame size, record size, spool bytes, pending records, retry/backoff, and stream retention separately. Calculate a starting spool size from admitted byte rate times the tolerated outage, then choose the action when that budget is exhausted. Blocking, dropping newest, dropping oldest, or stopping acquisition have different meanings. Make any loss explicit with counters/gap records; never silently pretend the retained record is complete.

Keep stable record IDs through retries and durable spool recovery. A file-tail checkpoint should not advance beyond data that is safely represented in the spool under the collector's policy. A snapshot source may intentionally replace older current values, but that is not a full history. Preserve source/run identity and report malformed records without coercing arbitrary strings into measurements.

## Verify

Fill the spool, revoke the producer, interrupt upload acknowledgement, rotate/truncate a tailed file, emit an oversized line, and restart while records are pending. Verify the selected loss/backpressure policy and that credentials do not appear in logs. Compare retained server history with the display buffer so a bounded chart cannot hide collector loss. Read exact commands and limits in [core's collector reference](https://github.com/werg/tendriller/tree/master/tools/collector).
