# One participant protocol across transports

The common session owns identity, commands, coherent views, exact retry,
replication and recovery. Native processes and browser Workers are ordinary
participants. A host is a light control participant whose transport accepts a
restricted set of protocol interests.

The bounded `chronolog-participant-v1` envelope binds the application, request
identity, facet, action and payload. Transport interests determine which updates
are delivered. Signed authority separately decides who may author data,
coordinate, recover, administer membership or publish code. A route,
advertisement, server account or newest database never supplies those rights.

## Peer transport

Use the public `session.connectPeer` with a bounded `FramedPeerConnection`. Direct WebRTC and the WebSocket relay implement that same byte interface.
The session authenticates the peer, verifies its current grants and owns the
connection's request lifetime, framing, congestion, retries and shutdown. The
page does not copy RPC maps, channel-transfer choreography or reconnect counters.

Reliable database/history and content exchange is separate from bounded lossy
live signals. Typing and cursors expire without entering retained history or an
outbox. Peers continuously retain complete usable prefixes in the background;
an ordinary applied command does not wait for another copy or a hosted receipt.

`createPeerIntroductions` attempts direct WebRTC first, then the hosted WebSocket
relay when direct establishment fails. Its two connection openers supply bytes;
`session.participate` owns discovery, cancellation, reconnection and recovery.
There is one command journal and one authenticated channel implementation across
both transports. The channel protects reliable RPC envelopes and live signals,
while the relay sees only routing metadata and opaque application frames after
the public authenticated handshake.

RTC introductions retire after establishment. The relay pairs two authenticated
host accounts' endpoints and forwards bounded frames without retaining history,
executing commands or gaining application-reader authority. Reliable/history and
live updates use independent sockets. The live lane drops before enqueue when
busy and never retries; queued TCP bytes still have TCP delivery behavior.

A direct connection can keep the active generation usable while the host is
unavailable. A relayed connection consumes host bandwidth and depends on relay
availability. Blocking only the control HTTP endpoint is therefore a separate
measurement from blocking the relay. Neither route requires a TURN service.

## Hosted control transport

The hosted participant receives explicit control, publication, discovery and
introduction actions through `peers/participant`. Ordinary database commands,
content replication and live UI signals are filtered before HTTP and rejected
at host ingress. Replies must match the requested application and interest.

Membership/key policy and generation selections form durable monotonic controls.
Signed page publication updates authored HTML/code independently of database
recovery, while preserving the authenticated application definition and execution
binding. The server stores these occasional controls and published assets; it
does not execute application SQL or hold a mandatory command-body archive.

Cached verified controls permit work without control HTTP in the active generation, provided the selected peer transport remains available. If the
coordinator is also lost, the session retains exact saved intent while successor
selection waits. A later valid takeover may adopt an older complete selected
prefix; excluded attempts remain abandoned and cannot silently merge.

## Ownership and qualification

One native store owner or browser Worker owns a device identity and journal.
Opening another tab must reuse a qualified owner or report busy. Missing storage
must not silently generate a new identity. Closing a session fences late work,
releases transport resources and preserves committed attempts for exact retry.

The [current independent gates](../checks/README.md) exercise this composition
through public artifacts. Direct-mode host-blocked work must show unchanged host counters and increasing peer traffic. Relay-mode work must separately report control HTTP counters and increasing relay bytes, plus actual relay loss and reconnection. Record the selected route, introduction traffic and application-frame versus wire-byte boundaries.
Loopback evidence does not qualify production login, home/mobile/restrictive
networks, browser suspension, storage eviction or provider cost.

The previous resident service contract is available only as
[historical source](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/peer-network.md).
Its copied connection specimens are not part of the current public workflow.
