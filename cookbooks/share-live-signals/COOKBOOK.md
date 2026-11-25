---
id: "share-live-signals"
title: "Share live signals without recording history"
summary: "Send typing, presence, cursors, progress and transient messages through a bounded live channel with explicit expiry and delivery policy."
group: "Guide and coordinate work"
tags: ["signals", "presence", "ephemeral", "progress"]
choices: ["Live signal or durable event", "Every transient message or latest value", "Standalone authorization or database membership"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "coordinate-devices", "observe-long-running-process", "present-live-measurements", "run-a-peer-application"]
sources: ["https://github.com/werg/chronolog-db/blob/4efa3546f930734328879bdca3984282bd19156b/packages/signals/src/index.ts"]
---

# Share live signals without recording history

Use a signal when its value is useful now and losing it does not lose work that
must be recovered. A cursor position, typing indicator, live reading or token
preview should not need a database transaction, an inclusion receipt or a
finality service. The next observation can replace a missed one; an expired
observation disappears.

The public signal channel is independent of durable application storage. Tendriller
pages and native participants use the same owned Chronolog session's `signals`
port, with its authenticated peer transport and topic policy. The browser runtime
exposes that explicitly installed port through `tendril.signals`. Installation is
independent of durable application readiness: `available` reports installation,
not connectivity or delivery, and an unconfigured send fails immediately.
Signal-only applications do not need to open a SQL database. The host handles
control, publication and introductions; it does not supply a separate live-data
channel through the page's control socket.

## Choose what may be lost

| Use case | Delivery policy | Durable companion, when needed |
| --- | --- | --- |
| Typing, cursor, drag preview, presence | `latest` with short expiry | The submitted message, committed edit or explicit join/leave decision |
| Current sensor reading or progress percentage | `latest` with source/run identity | Selected observations, milestones or the final result |
| Distinct live reactions or transient UI notices | Default `all` | A retained acknowledgement if the workflow requires one |
| Token chunks, incremental previews | Default `all`, with request ID and chunk index | The complete final text or artifact |
| Live follow-selection or navigation suggestion | `latest`, with local follow/pause control | A required assignment or reviewed workflow transition |

`all` preserves the queued order of distinct received messages until the bounded
consumer overflows or its channel ends. It is not an offline queue and does not
promise every sent message arrives. In the current public peer-session API,
`latest` deliberately coalesces pending values only within the same authenticated
author, session, topic and signed stream scope. The scope includes the stream ID,
endpoint incarnation and optional target. It ignores reordered older values even
after the newest value has been consumed. Give independent runs distinct
`streamId` values and select `streams` in the subscription: selection happens
before coalescing. A payload's `runId` alone cannot establish this identity.

The default peer signal policy reaches connected neighbors. A bootstrap may
explicitly select bounded application delivery for multi-hop peers; that policy
does not change the channel into a durable log. The current
[multi-participant consumer](../coordinate-participants/checks/README.md) exercises
two same-topic runs over that authenticated application route. Earlier standalone
signal evidence retains the scope of its pinned package.

For chunked previews, a missing chunk means the preview is incomplete. Include a
stream/request ID and chunk index, detect gaps, and replace the preview from the
complete durable result. Do not manufacture a complete answer by concatenating
whichever chunks happened to arrive. A complete replaceable preview can instead
use `latest` if it stays within the frame budget.

## Send and observe through the public surface

The application sends JSON payloads. Authorization and envelope verification
belong to the channel; the application still validates its payload schema.

Start from the [connected-app setup](../../guides/connected-app-setup.md) and
reuse its enrolled browser and native sessions. The first-app browser bootstrap
already installs `session.signals`. A custom bootstrap installs the same port once:

```js
// session is the existing enrolled browser Worker facade.
tendril.signals.install(session.signals);
```

Do not install a second channel when the starter has already done this.
Installation is separate from `tendril.application.install()`. If composition is
asynchronous, explicitly await `tendril.signals.ready()`; `send()` itself never
queues work while waiting for installation. The current [core signal guide](https://github.com/werg/tendriller/blob/master/docs/APPLICATION_SIGNALS.md)
describes session reach, local echo and transport limits.

The session verifies the signal's scope, author, sequence and signed stream context
and enforces its current topic policy. Account sign-in alone does not authorize a
participant to send application signals. A native agent explicitly subscribes to
its own enrolled session when it needs live interaction. Receiving a signal does
not arrange a future turn in a conversational host.

```js
await tendril.signals.send('typing', { typing: true }, { ttlMs: 2500 });

const lifetime = new AbortController();
for await (const event of tendril.signals.subscribe({
  topics: ['typing'], mode: 'latest', signal: lifetime.signal,
})) {
  if (typeof event.payload?.typing !== 'boolean') continue;
  // Track the author/session separately and remove its indication at expiry.
  // typing:false clears only that sender. Cancellation clears the whole view.
  updateTyping(event.authorId, event.sessionId,
    event.payload.typing, event.expiresAtMs);
}
```

Stop the subscription when leaving the task. Send a best-effort `typing: false`
when the editor becomes empty or a message is submitted, and retain the expiry
fallback because a close notification can be lost. Track concurrent senders
independently: one person's short-lived indication must not erase another
person's still-live indication. Expire the display even if no later packet
arrives, and clear it immediately when the subscription ends.

`send()` resolving means a configured live route, or enabled local echo, accepted
local dispatch. It is not a remote delivery receipt, durable acceptance or completed
action. Keep a transient send failure separate from a durable submission result.
Never queue yesterday's typing or preview to be resent after reconnect.

For a live sensor reading, the browser sends through that same installed port.
Here `reading` is a page-owned sample acquired under the person's selected sensor
policy, and `runId` identifies this observation run:

```js
const lifetime = new AbortController();
await tendril.signals.send('reading', {
  value: reading.value, unit: reading.unit, observedAtMs: reading.observedAtMs,
}, { stream: { streamId: runId }, ttlMs: 3000, signal: lifetime.signal });
```

The native participant subscribes through its existing session. Select the
source device's verified author ID and run before coalescing; a payload label
cannot establish either identity. The example accepts a finite numeric reading with an
explicit unit and observation timestamp; adapt that schema to the sensor:

```js
const lifetime = new AbortController();
for await (const event of session.signals.subscribe({
  topics: ['reading'],
  streams: [{ authorId: sourceDeviceKey, streamId: runId }],
  mode: 'latest', signal: lifetime.signal,
})) {
  const sample = event.payload;
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) continue;
  if (typeof sample.value !== 'number' || !Number.isFinite(sample.value)
      || typeof sample.unit !== 'string'
      || typeof sample.observedAtMs !== 'number'
      || !Number.isFinite(sample.observedAtMs)) continue;
  showReading(sample, event.expiresAtMs);
}
```

`showReading` must expire its displayed value even if no later packet arrives;
clear it when the subscription ends. Aborting this subscription does not close the
owned session or stop the browser's sensor. Keep the source's local Stop effective,
and stop its watch/tracks separately. Reconnection publishes fresh observations;
there is no signal replay outbox. Save required observations through the
application's declared command and content APIs.

### Standalone channel composition

A standalone channel is a lower-level option for an explicitly selected transport
and authorization policy. It is not a required extra step for an existing
Tendriller session.

For a standalone application, import `SignalChannel` from
`@chronolog/signals`. Configure an explicit scope, signing identity, sender
authorization callback, bounded frame transport and optional credential. Attach
each connection with `channel.attachRoute({ trySend, close })`, pass its incoming
frames to the returned route's `receive(frame)`, and close that route when the
connection ends. `trySend` resolves `true` after local dispatch or `false` when
busy before accepting bytes. Actual failures throw. A refused attempt is never
queued or retried, and an application send fails with `SIGNAL_BACKPRESSURE` when
all routes refuse. This transport contract needs no Chronolog error class.
Set `relay: true` only when the channel should forward verified
original frames to its other routes; standalone relay is disabled by default.
No group history, reader grant,
SQL engine, durable proposal or finality provider is required by the standalone
channel. A Chronolog integration can supply a membership-backed policy instead
of implementing capability checks in application code.

The standalone package is supplied as a dependency-free archive built from an
exact Chronolog checkout; it is not yet published to npm. Follow the
[package build and isolated-consumer instructions](https://github.com/werg/chronolog-db/blob/4efa3546f930734328879bdca3984282bd19156b/packages/signals/README.md#build-and-consume-the-standalone-package)
and install that archive into the consuming application. Construct
`new SignalChannel({ scope, identity, authorize })`; `generateSignalIdentity()`
can create a fresh standalone identity. Keeping an identity across restarts is
an explicit application choice.

The application session owns routes for browser and native participants.
Applications attach a transport with `session.connectPeer(...)`; the same owned
session carries commands, replication, content and live signals according to the
participant's verified permissions. A control host has a separate transport
policy and does not receive live typing or progress frames.
Expired frames and valid signed frames denied by current writer/topic policy
are dropped without closing a still-authorized reader's durable peer connection.
Reader admission is checked separately; invalid signatures, malformed frames
and physical failures still end the owning session.

The [executable standalone composition](checks/README.md) creates two public
channels from an explicitly supplied `@chronolog/signals` build. It combines
replaceable instrument readings with ordered token previews, deliberately loses
a chunk, refuses an unauthorized topic, recovers from congestion, disconnects and
sends a fresh reading after reconnect. Its transport is an in-process route so the check isolates
these primitives without opening a database or starting finality. Replace that
route with the chosen live transport; keep its access, confidentiality and
lifecycle policy explicit.

Each channel is constructed with `{ scope, identity, authorize }`. Its explicit
`attachRoute({ trySend(frame, { signal }) })` returns a route with `receive(frame)`
and `close()`. Receive verifies the sender and, when relay is enabled, forwards
the original frame to other live routes without rewriting the signature,
identity or expiry. Closing a route cancels its pending sends. Closing the channel ends
subscriptions; an unattached send fails immediately. The module provides no
database, proposal, capability-log or finality dependency to configure.

Publish fresh observations when capacity returns; never keep a durable retry
queue for discarded signals.

An agent can participate in the same way as another live endpoint. A disposable
preview request, attention cue or immediate local Stop can be governed by its
live topic policy. Give any required final answer a durable companion, and
publish irreversible work as final durable intent before dispatch. An agent's
presence alone does not turn every live interaction into a transaction.

The standard governed adapter uses an active publisher capability, represented
by a writer-kind grant with explicit signal topics. For a participant who may
send typing but no durable changes, its program rights can be
`{ sql: false, topics: [], signals: ['typing'] }`. That grants no SQL or durable
event publication. An ordinary read grant alone does not authorize sending.
The database peer connection also requires its reader capability to exchange
group data. These are choices of the group adapter, not requirements of a
standalone signal channel.

## Use the same primitive for progress, previews and attention

The small [live-run specimen](snippets/live-run.mjs) consumes only the public
`Signals` port. It has no durable backend, database, transaction or finality
request. `observeLiveRun` shows independently expiring progress and complete
preview snapshots for one run and selected publisher. Use a run ID that identifies
one execution attempt, and choose the publisher from the application's known
identity policy; a payload cannot name itself the authorized publisher.

```js
const lifetime = new AbortController();
const observing = observeLiveRun(tendril.signals, {
  runId: selectedRun.id,
  publisher: selectedRun.publisher,
  signal: lifetime.signal,
  onChange: ({ progress, preview }) => {
    showProgress(progress); // null means current progress is unknown.
    showPreview(preview?.text ?? '');
  },
});

// The authorized producer sends independent live observations.
await signals.send('progress', { runId, completed: 300, total: 500 }, {
  stream: { streamId: runId }, ttlMs: 3000,
});
await signals.send('preview', { runId, text: completeCurrentPreview }, {
  stream: { streamId: runId }, ttlMs: 3000,
});
```

The run is a signed stream scope, not only a payload label. The helper selects
`streams: [{ authorId: publisher, streamId: runId }]` before coalescing. Two runs
from the same signing device can then use the same progress topic independently.
An attached session owner supplies its endpoint ID and incarnation; applications
must not claim another endpoint by filling those fields themselves. Optional
endpoint selection prevents stale output from a previous attachment appearing in
the current view. This specimen requires the stream-aware public signal contract;
use the exact compatible package from the qualification manifest.

Complete preview snapshots use `latest`; losing an intermediate snapshot does
not create a hidden gap in concatenated text. The specimen bounds text to 8,192
characters and expires progress and preview separately. If bandwidth calls for
chunked previews instead, use `all`, chunk indexes and explicit incomplete-state
handling as described above. A required final result is recorded through the
application's durable path and replaces the disposable preview.

`observeAttention` uses the same channel with `mode: 'all'` for distinct harmless
highlight suggestions. It accepts only the selected publisher, active run and a
local allowlist of targets, and respects the receiving person's follow/pause
choice before highlighting. It does not invoke tools or grant authority. This
supports live walkthroughs and collaborative focus without recording every
attention change as a transaction. If a transition requires acknowledgement or
must be recovered, use a durable operation instead.

Start these observers independently of durable application readiness. In the
[peer specimen](../run-a-peer-application/checks/README.md), live subscription
starts as soon as the same Chronolog participant is available, before the page's
first durable query. `applicationReady` means the participant is available;
Chronolog opens the database only when a data operation needs it. No second
signal client or application lifecycle is needed. The page lifetime cancels
observation when the person leaves.

The [focused checks](checks/live-run.test.mjs) exercise payload selection,
independent expiry, replaceable previews and local attention policy. They establish
page-owned behavior, not network delivery or deployed authorization.

## Keep access and lifetime explicit

The scope separates applications; topics describe payloads. Neither is a secret
nor a permission. The session or standalone channel establishes the sender through
a verified signature and enforces its topic policy, session/sequence bounds and
expiry. A payload cannot replace that identity.
The transport must provide the required confidentiality and connection access.
Do not assume a signed signal is encrypted or a successful introduction grants
permission to read a database.

In a governed Chronolog group, a signal-only writer grant explicitly declares
`program: { sql: false, topics: [], signals: ['typing', 'job-progress'] }`.
Writer permission does not imply SQL, durable topics or forwarding. The standard
peer link independently requires reader admission; a standalone channel
instead uses its own configured authorization. No membership or
schema administration role is required to send live information.

The peer RTC adapter uses an independent unordered live channel, separate from
reliable history and detached-body transfer. Both channels share one authenticated
connection but have separate queues. Saturated history credit cannot hold a
progress update behind a large replay. A congested live send rejects; a slow live
receiver may drop queued datagrams. Network bandwidth is still shared, so no
latency or guaranteed delivery is implied. There is no reconnect outbox or
fallback that turns a signal into a durable frame.

Choose a TTL from the actual interaction: a few seconds can suit typing while a
slower sensor may need a longer freshness interval. Bound payloads, sessions,
pending sends and slow consumers independently. Reject or drop according to the
declared policy; never hide unbounded buffering behind the word "ephemeral."
An application should treat a subscription overflow as a gap and restart with
fresh live state when appropriate. Expiry timestamps are freshness bounds, not
evidence that the sender's wall clock is authoritative.

A receiver can enforce only the authorization state it currently knows. A
disconnected peer does not instantly learn a revocation elsewhere. Recheck access
on reconnect and close channels when the deployment's policy requires it. A
signal must never grant itself additional rights through its payload.

## Diagnose clock rejection without confusing it with lost authority

A valid signed, authorized signal can be too far in the future or already
expired at the receiver. Reject that disposable frame and count it without
tearing down the reliable history connection. This isolation does not turn an
invalid signature, malformed timestamp or transport/protocol failure into an
ignorable clock problem.

With a matching session package, inspect the receiver's existing participation
controller diagnostics (the controller is separate from the application session):

```js
const connections = await participation.diagnostics();
for (const connection of connections) {
  const counts = connection.signalRejections;
  if (counts) showSignalDrops(connection.peerId, counts);
}
```

`signalRejections` is an optional, bounded snapshot with fixed counters:
`total`, `clockSkew`, `expired`, `unauthorized`, `duplicate`, `capacity`.
Absence means unreported, not zero. A connection may carry relayed authors, so
its peer ID and counters do not establish the originating device's clock offset.
They retain no payloads or unbounded per-author history.

Inspect the configured skew/expiry policy and actual device time. Do not infer
remote delivery from `localEcho`, blindly raise TTL/skew limits, or introduce a
clock-synchronization protocol in each app. Keep the original freshness and
authorization rules; reestablish useful live state with fresh observations.
A local diagnostic copy remains useful when the telemetry channel itself drops
frames. Qualify future/expired frames while a reliable command/read still
completes, and separately verify invalid signatures and revoked authority.

## Keep required decisions durable

Use a durable event for submitted chat, a request that must reach a worker, a
permission change or an accepted outcome. Use a transaction when a condition and
its mutation must agree, such as claiming the last available resource. Use an explicitly configured protected action for irreversible external work.
An ordinary materialized event is revisable when an earlier operation arrives, and a configured closed frontier can exclude a delayed one. Live progress can
accompany the action while its durable service result remains authoritative.

These choices do not require a durable record for every harmless transient
interaction. A preview command, a local attention cue, a disposable reaction or
a live control suggestion can use signals when loss, expiry and duplication
have an acceptable application meaning. Keep Stop and local mute effective on
the device, even when no remote signal is delivered.

The [application guarantee guide](../../guides/application-primitives.md) connects
these decisions to materialized outcomes, finality and protected actions. The
[public session checks](../run-a-peer-application/checks/README.md) combine
ephemeral typing with retained messages through the same session API.

## Verify the live behavior

| Scenario | Expected observation |
| --- | --- |
| Send signals while the host is unavailable | An established authorized signal path still works without new durable records. |
| Stop sending without a goodbye packet | The UI expires the sender's indication on time. |
| Two senders type; one stops or expires first | Only that sender's indication disappears. |
| End or abort the subscription | The live view clears and no timer repaints it. |
| A slow consumer receives several distinct transient messages | Default `all` retains order within its budget and reports overflow as a gap. |
| A slow consumer follows replaceable progress | `latest` coalesces values and memory remains bounded. |
| A chunk is missing, expires or overflows | The preview is marked incomplete; the complete durable result repairs it. |
| Retry after reconnect | Only fresh live observations are sent; no old signal outbox replays. |
| A sender lacks topic authorization | Delivery fails; connection access or another topic grant does not widen its rights. |
| A signed, authorized frame exceeds clock tolerance or expires | The receiver counts and drops it; a reliable command/read on that connection still works. |
| Diagnostic counters are absent or a link carries relayed authors | Absence remains unknown; link counts do not become an invented author clock offset. |

These are adaptation checks. The standalone and integrated channel tests belong
to Chronolog; existing source-pinned task/chat reports qualify only the exact
versions and scenarios named in those reports.
