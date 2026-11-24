---
id: "report-page-diagnostics"
title: "Report live page errors and diagnostics to your agent"
summary: "Capture boot-to-runtime browser errors in a redacted ring buffer and stream live diagnostics over ephemeral signals."
group: "Keep work dependable"
tags: ["diagnostics", "errors", "telemetry", "debugging"]
choices: ["Redacted local error ring buffer", "Ephemeral dev/telemetry signal stream", "Rate-limited console forwarding and copyable report"]
capabilities: ["signals"]
evidence: "exercised"
related: ["share-live-signals", "ingest-bounded-telemetry"]
sources: []
---

# Report live page errors and diagnostics to your agent

When a person uses a Tendriller page on a phone or tablet away from your desk, browser DevTools are not open. Without structured client-to-agent feedback, an unhandled rejection, module boot error, or mobile layout failure stays invisible to the agent maintaining the page.

## Capture early, redact secrets, never burn journal quota

1. **Buffer from boot (`tendril.errors`):** The Tendriller runtime records `error` and `unhandledrejection` events from startup in a bounded 30-entry ring buffer persisted in `sessionStorage` per page, redacting query tokens and Bearer headers. **Page options → Diagnostics** lets the user copy a complete diagnostic bundle in one tap even while offline.
2. **Stream ephemerally when connected (`dev/telemetry`):** Forward buffered and live errors plus connectivity transitions over `session.signals.send('dev/telemetry', ...)`. Rate-limit and deduplicate so an error loop never floods signals, and write **zero durable Chronolog records**.
3. **Tail live from the agent terminal:** Run `tendril --session ./session.mjs --mode attach logs` (or `npm run logs` in the starter) to receive NDJSON error and health events straight from the user's device while hot-publishing fixes with `npm run deploy`.

## Runnable snippet and check

- [Bounded error buffer and signal forwarder](snippets/page-diagnostics.mjs)
- [Executable check](checks/page-diagnostics.test.mjs)

## Verify the failure cases

| Scenario | Expected observation |
| --- | --- |
| Error occurs before session connects | Buffered locally and flushed once connected; still copyable offline. |
| URL or error contains `?token=...` or `Bearer ...` | Secret is replaced with `[redacted]` before storage or signal emission. |
| Repeated errors in a tight render loop | Deduplicated and rate-limited without flooding signals or writing durable journal records. |
