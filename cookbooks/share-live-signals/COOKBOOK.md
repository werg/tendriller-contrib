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
sources: ["https://github.com/werg/chronolog-db/blob/1b356067e531f1d76f162c8339356ade61e571f6/packages/signals/src/index.ts"]
---

# Share live signals without recording history

Use a signal when its value is useful now and losing it does not lose work that
must be recovered. A cursor position, typing indicator, live reading or token
preview should not need a database transaction, an inclusion receipt or a
finality service. The next observation can replace a missed one; an expired
observation disappears.

The public signal channel is independent of durable application storage. It
works with an explicit transport and authorization policy. Peer applications can
use the same interface with Chronolog membership, and Tendriller exposes it through
`tendril.signals`. Hosted pages receive a channel automatically through their
existing authenticated page socket. Peer deployments install their selected
channel independently of durable application readiness. `available` reports
installation, not connectivity or delivery; an unconfigured send fails immediately.
Signal-only applications do not need to open a SQL database or select a durable
application backend.

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
promise every sent message arrives. `latest` deliberately coalesces pending
values from the same author/session/topic and ignores reordered older values,
even after the newest value has been consumed. Use it only when replacement is meaningful.
One topic should not mix independent entities that need separate pending values;
send a small complete snapshot or choose separate topics.

For chunked previews, a missing chunk means the preview is incomplete. Include a
stream/request ID and chunk index, detect gaps, and replace the preview from the
complete durable result. Do not manufacture a complete answer by concatenating
whichever chunks happened to arrive. A complete replaceable preview can instead
use `latest` if it stays within the frame budget.

## Send and observe through the public surface

The application sends JSON payloads. Authorization and envelope verification
belong to the channel; the application still validates its payload schema.

A hosted page can use `tendril.signals` directly. A peer bootstrap installs
`tendril.signals.install(client.signals)`; it does not also send through the hosted
channel. A standalone bootstrap can install its own `SignalChannel` instead.
An application can also explicitly select the hosted live channel with
`connectHostedSignals` or a native host client's `connectSignals`, including
when its durable history is peer-owned. That choice uses host accounts and
credentials; it does not grant Chronolog membership or change the durable backend.
Installation is separate from `tendril.application.install()`. If it happens asynchronously,
bootstrap may explicitly await `tendril.signals.ready()`; `send()` itself never
queues work while waiting for a channel.

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

`send()` resolving means at least one currently attached route accepted local
dispatch. It is not a remote delivery receipt, durable acceptance or completed
action. Keep a transient send failure separate from a durable submission result.
Never queue yesterday's typing or preview to be resent after reconnect.

A hosted agent or other native SDK client explicitly opens its live connection:

```js
const signals = await host.connectSignals({ signal: lifetime.signal });
try { await signals.send('progress', { completed: 3, total: 5 }); }
finally { signals.close(); }
```

The returned port also supports `subscribe()`. It has no reconnect or replay
outbox: when the connection ends, the application decides whether to open a new
one and publish fresh observations. Its scope and author come from the
authenticated hosted session, not fields supplied in the payload.

For native or standalone use, import `SignalChannel` from
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
[package build and isolated-consumer instructions](https://github.com/werg/chronolog-db/blob/1b356067e531f1d76f162c8339356ade61e571f6/packages/signals/README.md#build-and-consume-the-standalone-package)
and install that archive into the consuming application. Construct
`new SignalChannel({ scope, identity, authorize })`; `generateSignalIdentity()`
can create a fresh standalone identity. Keeping an identity across restarts is
an explicit application choice.

The governed peer service owns routes for browser and resident replicas.
Applications using that service call `peer.connectPeer(...)` or
`context.connectPeer(...)` instead of adding another frame-forwarding loop.
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
await signals.send('progress', { runId, completed: 300, total: 500 }, { ttlMs: 3000 });
await signals.send('preview', { runId, text: completeCurrentPreview }, { ttlMs: 3000 });
```

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
starts while the bootstrap's separate `applicationReady` promise is pending.
Stopping or failing that durable initialization does not silently cancel live
observation; the page lifetime cancels both when the person leaves.

The [focused checks](checks/live-run.test.mjs) exercise payload selection,
independent expiry, replaceable previews and local attention policy. They establish
page-owned behavior, not network delivery or deployed authorization.

## Keep access and lifetime explicit

The scope separates applications; topics describe payloads. Neither is a secret
nor a permission. The adapter establishes the sender through its authenticated
hosted session or a verified standalone/Chronolog signature, and enforces its
topic policy, session/sequence bounds and expiry. A payload cannot replace that identity.
The transport must provide the required confidentiality and connection access.
Do not assume a signed signal is encrypted or a successful introduction grants
permission to read a database.

In a governed Chronolog group, a signal-only writer grant explicitly declares
`program: { sql: false, topics: [], signals: ['typing', 'job-progress'] }`.
Writer permission does not imply SQL, durable topics or forwarding. The standard
peer link independently requires reader admission; standalone and hosted
channels instead use their own configured authorization. No membership or
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

## Keep required decisions durable

Use a durable event for submitted chat, a request that must reach a worker, a
permission change or an accepted outcome. Use a transaction when a condition and
its mutation must agree, such as claiming the last available resource. Dispatch
irreversible external work from a final durable intent. A live progress signal
can accompany that work while its final result remains the source of truth.

These choices do not require a durable record for every harmless transient
interaction. A preview command, a local attention cue, a disposable reaction or
a live control suggestion can use signals when loss, expiry and duplication
have an acceptable application meaning. Keep Stop and local mute effective on
the device, even when no remote signal is delivered.

The [primitive and role guide](../../guides/application-primitives.md) connects
these decisions to finality, rollback, redo and effect handling. The
[peer task/chat specimen](../run-a-peer-application/checks/README.md) combines
ephemeral typing with durable messages and final agent results.

## Verify the live behavior

| Scenario | Expected observation |
| --- | --- |
| Send signals while the finality provider is unavailable | An established authorized signal path still works without new durable records. |
| Stop sending without a goodbye packet | The UI expires the sender's indication on time. |
| Two senders type; one stops or expires first | Only that sender's indication disappears. |
| End or abort the subscription | The live view clears and no timer repaints it. |
| A slow consumer receives several distinct transient messages | Default `all` retains order within its budget and reports overflow as a gap. |
| A slow consumer follows replaceable progress | `latest` coalesces values and memory remains bounded. |
| A chunk is missing, expires or overflows | The preview is marked incomplete; the complete durable result repairs it. |
| Retry after reconnect | Only fresh live observations are sent; no old signal outbox replays. |
| A sender lacks topic authorization | Delivery fails; connection access or another topic grant does not widen its rights. |

These are adaptation checks. The standalone and integrated channel tests belong
to Chronolog; existing source-pinned task/chat reports qualify only the exact
versions and scenarios named in those reports.
