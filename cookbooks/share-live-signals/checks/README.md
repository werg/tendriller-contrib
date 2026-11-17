# Run a signal-only composition

This check uses the built public `@chronolog/signals` entry with two independent
signing identities, an explicit author/topic policy and a small in-process frame
route. It opens no database, reads no group history and runs no finality service.

```sh
node cookbooks/share-live-signals/checks/run.mjs \
  --signals-module /exact/built-public-signals.mjs
```

The supplied module must export `SignalChannel`, `generateSignalIdentity` and
`signalAuthorId`.
The check uses the actual implementation; it does not substitute
a fixture channel. Its result records the supplied module's SHA-256 and the
observed checks.

The scenario combines two ordinary author choices. Current thermometer readings
use `latest` and a source/run identity. Token previews use default FIFO delivery,
a request ID and chunk index; the page-owned preview model marks a missing chunk
incomplete. Both stop on session cancellation. A disconnected send fails without
becoming an offline backlog, and reconnection sends only a fresh reading.

Create a route with `channel.attachRoute({ send(frame, { signal }), close?() })`.
Pass incoming frames to that returned route's `receive(frame)` and call its
`close()` when the connection ends; this cancels verification before admission.
The outgoing transport honors the supplied abort signal. The optional transport
`close()` hook retires a failed or noncooperative writer. Preserve the channel's
cancellation and size/backpressure bounds; explicit `relay: true` enables
forwarding verified originals to other live routes. The production route
must provide the required confidentiality and access control. A signed live
frame does not establish encryption, a database grant or a completed action.

This local composition qualifies signal semantics and public API use. It does
not establish Internet routing, browser background behavior or deployment
authorization. Existing peer task/chat reports remain separate evidence for
their recorded source and network topology.
