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

Use a direct device connection when a real instrument adds useful measurements or controls. A simulated source, uploaded log, or remote collector can be a better choice when browser support or physical access is limited. A demo panel is an illustration; design the controls around this instrument's task.

## Choose the transport and protocol

Web Serial, Bluetooth GATT, HID, USB, MIDI, and other connectors have different permission, browser, and device constraints. API presence is only an initial signal. Request a chooser from the user's gesture, identify the expected device/service, and verify the actual protocol before sending control bytes.

A stream chunk is not a packet. Define framing: newline-delimited records, length prefixes, delimiters with escaping, or a documented binary format. Handle partial packets, multiple packets per read, malformed bytes, and a maximum frame size. Bound the carry buffer so a missing delimiter cannot exhaust memory. For command/reply devices, correlate a response with the request or serialize requests when the protocol has no IDs.

Choose read-only versus control permissions explicitly. A connection does not imply consent to actuate equipment. Timeouts and retries can repeat a physical effect; use the instrument's idempotency or an explicit operator check when it lacks it. A disconnected device may have continued running.

## Adapt the workflow

Start with a small parser tested against recorded protocol fixtures. Keep transport lifecycle separate from interpretation and rendering. Label units, calibration, source identity, and simulation provenance. Ingest every admitted record into a bounded model, aggregate deliberately, and emit quiet telemetry unless an intervention threshold warrants attention.

Provide disconnect/stop behavior that closes readers/writers, releases locks, cancels timers, and prevents late callbacks from sending. Reconnection should verify device identity and task state before resuming writes. Preserve a file/manual/simulated path where useful, with simulation visibly identified.

## Verify

Split a packet at every byte boundary; combine packets; send malformed/oversized input; disconnect mid-read and mid-command; reconnect a different device. Test denial and unavailable transport. Confirm no fabricated samples appear during gaps, and that retrying a timed-out control command follows the documented physical-effect policy.
