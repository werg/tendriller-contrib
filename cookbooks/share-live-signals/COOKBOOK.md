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
sources: ["https://github.com/werg/chronolog-db/blob/92264b64cff41746aa9520f8c9f9047e616659cc/packages/signals/src/index.ts"]
---

# Share live signals without recording history

Use a signal when its value is useful now and losing it does not lose work that
must be recovered. A cursor position, typing indicator, live reading or token
preview should not need a database transaction, an inclusion receipt or a
finality service. The next observation can replace a missed one; an expired
observation disappears.

The public signal channel is independent of durable application storage. It
works with an explicit transport and authorization policy. Peer applications can
use the same channel with Chronolog membership, and Tendriller exposes it through
`tendril.signals`. Bootstrap explicitly installs a channel; `available` reports
whether installation has happened, and an unconfigured send fails immediately.
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
values from the same author/session/topic. Use it only when replacement is meaningful.
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

A peer bootstrap installs `tendril.signals.install(client.signals)`. A standalone
bootstrap can install its own `SignalChannel` instead. Installation is separate
from `tendril.application.install()`. If installation happens asynchronously,
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

`send()` resolving means the local channel handed the frame to its configured
transport. It is not a remote delivery receipt, durable acceptance or completed
action. Keep a transient send failure separate from a durable submission result.
Never queue yesterday's typing or preview to be resent after reconnect.

For native or standalone use, import `SignalChannel` from
`@chronolog/signals`. Configure an explicit scope, signing identity, sender
authorization callback, bounded frame transport and optional credential. Attach
that transport's incoming frames to `receive()`. No group history, reader grant,
SQL engine, durable proposal or finality provider is required by the standalone
channel. A Chronolog integration can supply a membership-backed policy instead
of implementing capability checks in application code.

The standard governed adapter uses an active publisher capability, represented
by a writer-kind grant with explicit signal topics. For a participant who may
send typing but no durable changes, its program rights can be
`{ sql: false, topics: [], signals: ['typing'] }`. That grants no SQL or durable
event publication. An ordinary read grant alone does not authorize sending.
The database peer connection also requires its reader capability to exchange
group data. These are choices of the group adapter, not requirements of a
standalone signal channel.

## Keep access and lifetime explicit

The scope separates applications; topics describe payloads. Neither is a secret
nor a permission. The channel checks a sender's signature and the configured
policy for the topic, with session/sequence replay protection and bounded expiry.
The transport must provide the required confidentiality and connection access.
Do not assume a signed signal is encrypted or a successful introduction grants
permission to read a database.

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
| A sender lacks topic authorization | Delivery fails without acquiring a durable writer or administrator role. |

These are adaptation checks. The standalone and integrated channel tests belong
to Chronolog; existing source-pinned task/chat reports qualify only the exact
versions and scenarios named in those reports.
