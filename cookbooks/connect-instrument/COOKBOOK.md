---
id: "connect-instrument"
title: "Connect an instrument and interpret its protocol"
summary: "Separate permission, packet framing, command policy, and bounded telemetry from a task-specific hardware interface."
group: "Choose inputs and algorithms"
tags: ["hardware", "protocols", "telemetry"]
choices: ["Direct device, remote collector, or uploaded/simulated data", "Packet framing and bounded carry buffers", "Read-only access versus explicit physical commands"]
capabilities: []
evidence: "explained"
related: ["run-measurement-experiment", "ingest-bounded-telemetry", "discover-capabilities"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/serial.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/bluetooth.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/connectors.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/hardware-lab.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hardware-experiment/model.mjs"]
---

# Connect an instrument and interpret its protocol

Use a direct device connection when an instrument provides measurements or controls the task genuinely needs. For a bench temperature experiment, the useful experience is a verified source, a short calibration check, a live reading with units and freshness, an intentional run, and an exportable summary. A transport console alone leaves the person to guess whether the data is meaningful.

A recorded log, manual readings, simulated source, or remote collector can serve the task when direct browser access is unsuitable. Choose simulation for rehearsal and parser development, but label it throughout the run and export. Never merge simulated samples into an actual run merely because they have the same fields.

## Choose the connection and authority

Web Serial, Bluetooth GATT, HID, USB, MIDI, and other connectors differ in device protocols and permission constraints. Inspect the actual environment; API presence is only an initial signal. Request the relevant chooser from the person's gesture, identify the expected device/service, and verify its protocol before sending control bytes. Keep driver or collector setup explicit.

| Path | Good fit | Tradeoff to expose |
| --- | --- | --- |
| Direct browser connection | The person and instrument are together during foreground use. | Device/browser support and interruption cleanup. |
| Remote collector | Acquisition must run independently of the page. | Separate deployment, producer credentials, bounded spool, and actual collector health. |
| Uploaded recording | Repeatable analysis or unsupported live hardware. | Historical data and original time/units, not a live source. |
| Manual or simulated data | Rehearsal, accessibility, or a small number of readings. | Distinct provenance and no implied physical measurement. |

Read-only access is a useful default for an observation task. Connecting a device does not imply consent to actuate it. If writes are needed, name the supported commands, required operator role, permitted values, acknowledgement semantics, and physical consequences. A stopped page or disconnected cable is not proof that a motor, heater, or other device stopped.

## Walk through setup, run, and closeout

1. Explain the expected instrument and connection. Offer a sample log so the person can inspect the workflow before permission is needed.
2. Connect and display the device identity and protocol version when the instrument exposes them. A chooser label alone is insufficient if devices can be confused. Let the person disconnect and choose again.
3. Show a short diagnostic sample: raw frame, parsed value, unit, and a plain-language quality result. Use a known reference or operator check where calibration matters. Avoid automatically recalibrating against an unknown environment.
4. Create a run with its own ID, chosen channel, units, calibration revision, acquisition policy, and start time. Show **Start run**, **Pause collection**, and **End run** independently from **Disconnect**.
5. During collection, show current value, sample age, connection state, admitted/rejected sample counts, and a bounded history. A frozen last reading must visibly become stale rather than looking live forever.
6. End with a summary of observed intervals, gaps, parser failures, manual corrections, and export range. Offer a new run after deliberate review of the retained settings.

A compact mobile meter and a desktop diagnostics workspace can share this behavior without sharing layout. Keep advanced protocol details behind an explicit diagnostic view while ordinary status explains the next useful action.

## A stream chunk is not a packet

Define framing from the actual protocol: newline-delimited records, length prefixes, escaped delimiters, or a documented binary structure. A transport read can contain part of one packet or many packets. Use a bounded carry buffer, a maximum frame length, and a recovery policy for malformed input. A missing delimiter must not grow memory without limit.

Separate transport, framing, decoding, validation, and interpretation. Preserve raw diagnostic bytes only within a stated retention budget. Reject impossible lengths and invalid encodings before allocating or interpreting a payload. Decide whether one invalid frame is skipped, the parser seeks a documented resynchronization marker, or the connection stops for review. Do not guess a new binary layout from plausible-looking numbers.

For command/reply protocols, correlate responses by protocol IDs or serialize requests if IDs are unavailable. A time-out can mean the command was applied but its reply was lost. Retrying a measurement read and retrying an actuator command need different policies. Use instrument-supported idempotency or status interrogation where available; otherwise require an operator check before repeating a potentially duplicate physical effect.

## Keep samples and commands interpretable

An example sample record can contain run ID, source identity, channel, sequence, device time if available, receive time, numeric value, unit, quality, and calibration revision. These are application choices. Distinguish device time from reception time and detect reset or wraparound before using a device counter as a universal ordering key. Preserve original units alongside deliberate conversions.

Bound the in-memory model and render cadence separately from acquisition. A chart need not redraw for every accepted sample. Apply the [bounded telemetry guide](../ingest-bounded-telemetry/COOKBOOK.md) when the producer or network cannot keep up. Report lost or rejected samples and gaps rather than interpolating them into observations. Quiet telemetry should not wake an agent unless a task-specific intervention is useful.

Use the [public collector guidance](https://github.com/werg/tendriller/blob/7c6e61529e8878a1dc3585f2eb4d9cc8945f734d/docs/tools/COLLECTOR.md) for an independently running producer. Browser connection success, collector process health, service admission, and agent handling are distinct states. Keep producer/admin credentials out of page-owned public files and exports.

## Interruption and accessibility

Disconnect should close readers and writers, release locks, cancel polling, detach listeners, and invalidate late callbacks. A callback from an old connection must not append to a newly selected instrument's run. Reconnection verifies source identity and current task policy before collecting or writing again. Keep old runs inspectable; do not silently relabel their data with the new source.

Provide text values and units alongside charts, keyboard access to run controls, and readable connection/error status. Avoid color-only alarm states. If an instrument fails, manual entry can preserve the workflow, but mark those entries as manual and keep their timestamps/provenance distinct. Device serial numbers may be sensitive; include only the identity needed for traceability and deliberate sharing.

## Verify against protocol fixtures and the instrument

| Scenario | Expected observation |
| --- | --- |
| Split each valid packet at every byte boundary; combine packets | The parser yields the same complete records exactly once. |
| Malformed, oversized, or delimiter-free input | Memory stays bounded; rejection and recovery are visible. |
| Disconnect mid-read or receive a delayed old callback | The run shows a gap and accepts no samples from the disposed connection. |
| Reconnect a different device | The identity change requires a new source/run decision. |
| Time out after a control write | The UI reports an uncertain physical outcome and follows the documented retry policy. |
| Denial, unsupported transport, or no hardware | The recorded/manual route remains usable with distinct provenance. |
| End the run while collection is active | No later frame changes the completed summary without an explicit new revision. |

Recorded fixtures establish parser behavior; only controlled testing with the real instrument establishes the physical command policy. Keep those evidence claims separate.
