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

Use the public `session.connectPeer` or maintained browser/native WebRTC helpers.
The session authenticates the peer, verifies its current grants and owns the
connection's request lifetime, framing, congestion, retries and shutdown. The
page does not copy RPC maps, channel-transfer choreography or reconnect counters.

Reliable database/history and content exchange is separate from bounded lossy
live signals. Typing and cursors expire without entering retained history or an
outbox. Peers continuously retain complete usable prefixes in the background;
an ordinary applied command does not wait for another copy or a hosted receipt.

RTC introductions are bounded and retire after establishment. Discovery helps
find a route and may be refreshed on join or reconnect; it is not a per-command
poll. A healthy active generation keeps working with host access blocked.

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

Cached verified controls permit host-off work in the active generation. If the
coordinator is also lost, the session retains exact saved intent while successor
selection waits. A later valid takeover may adopt an older complete selected
prefix; excluded attempts remain abandoned and cannot silently merge.

## Ownership and qualification

One native store owner or browser Worker owns a device identity and journal.
Opening another tab must reuse a qualified owner or report busy. Missing storage
must not silently generate a new identity. Closing a session fences late work,
releases transport resources and preserves committed attempts for exact retry.

The [current independent gates](../checks/README.md) exercise this composition
through public artifacts. The host-blocked workload must show unchanged complete
host counters and increasing actual peer traffic. Record direct versus TURN
routes, introduction traffic and application-frame versus wire-byte boundaries.
Loopback evidence does not qualify production login, home/mobile/restrictive
networks, browser suspension, storage eviction or provider cost.

The previous resident service contract is available only as
[historical source](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/peer-network.md).
Its copied connection specimens are not part of the current public workflow.
