# Keep application traffic between peers

The peer application has one durable write owner: Chronolog. Tendriller serves
the initial page, authenticates participant administration and introduces peers.
After introduction, an authenticated WebRTC data channel carries the application
history, inclusion and closure evidence, detached envelopes and transient signals.
The page's normal operation has no hosted application socket or health poll.

This is the current architecture being implemented across
[Tendriller #35](https://github.com/werg/tendriller/pull/35),
[Chronolog #1](https://github.com/werg/chronolog-db/pull/1) and
[contrib #13](https://github.com/werg/tendriller-contrib/pull/13). Historical WSS
and workerd-relay reports retain their original revisions and transport scope.
An implemented API or a successful build is not evidence of a completed WebRTC
runtime scenario; new reports must identify the actual peers and selected route.

## Assign each responsibility once

| Responsibility | Owner | When the page host participates |
| --- | --- | --- |
| HTML, modules, Worker and WASM assets | Tendriller publication | Initial load or an explicit publication update |
| Account authentication and participant approval | Tendriller with the portable membership administrator | Enrollment, roster inspection, approval, revocation and key rotation |
| Peer introduction | Tendriller rendezvous | One bounded offer and answer per connection attempt |
| ICE, reliable data channel and flow control | Chronolog WebRTC transport | No application payload relay through the page host |
| Peer identity, reader grants and signed records | Chronolog authenticated peer link | Independent of the introduction service |
| Durable proposals, retry, SQL, events and proofs | Chronolog replica | No hosted application-state command or replay queue |
| Inclusion and author-time closure | Selected Chronolog finality provider | Provider placement is independent of page hosting |
| Agent effects and timers | Resident Chronolog services | No browser reducer or hosted state handler dispatches the same work |
| Rendered views, drafts and focus | Page-owned application | Local reads and interaction state |

The portable membership administrator remains an explicit trust boundary. It
retains the keys needed to authorize readers and wrap epoch keys. Participant
operations synchronize authenticated descriptor/control history; this still
costs work proportional to history since the administrator's last synchronized
position. There is no claimed sparse membership proof. The important operational
boundary is that ordinary application writes do not trigger administrator work.
Measure participant operations separately from a warm interval containing only
application activity.

## Introduce once, authenticate over the data channel

The public Tendriller peer client opens `peers.rendezvous(channel, peerId)` for a
specific application channel and fresh connection attempt. Its `ready` promise
assigns an offerer or answerer role and a session identifier. Its message stream
carries only `{ type: 'offer' | 'answer', sdp }` descriptions. Each side sends one
fully gathered description, bounded to 64 KiB. The service closes its sockets
after that pair has been exchanged.

Treat the rendezvous session and participant identifier as routing information.
The Chronolog peer handshake still verifies the remote signing key and current
reader capability for the intended group. Possessing a host account, matching a
channel name or receiving an SDP answer does not grant access to application
history. Keep membership verification active when processing requests after
connection establishment as well as during the initial handshake.

The WebRTC adapter supplies a bounded framed connection to the same authenticated
peer protocol. Durable history and ephemeral signals retain their existing
protocol domains and authorization. RTC transport configuration cannot choose a
new signer, rewrite a proposal or change finality.

A browser page owns its `RTCPeerConnection`. An exclusive OPFS Worker can retain
the replica and signing identity while a bounded `MessagePort` bridge carries
frames to that page connection. Closing the page or replacing the Worker must
close the bridge, pending sends and owned data channel. Opening another tab does
not create a second writer for the same local durable store.

## Keep an established session independent

After the data channel is open and the Chronolog identity handshake succeeds,
discard the introduction connection. A stopped page host must not interrupt
the established RTC session, durable outbox delivery, evidence exchange or local
reads. Membership changes still need an available administrator, and a cold
page load or a new introduction still needs their declared services.

A disconnected finality provider has a different effect: peers can exchange
existing signed history and keep local proposals, but coordinated finality
waits. Host independence cannot make an unavailable finality authority available.
Do not silently substitute the hosted backend or issue a new operation identity.

If the RTC connection fails, preserve pending proposals and report the connection
state. A new connection attempt obtains a new rendezvous session and performs
the authenticated handshake again. No hidden HTTP or Cloudflare payload relay
is a fallback. Configure an explicit alternative route only when its provider,
authorization, byte accounting and availability policy are acceptable.

ICE may select a direct candidate pair or a TURN relay. Both use the same
Chronolog protocol, but they have different traffic and cost boundaries. Record
the selected candidate types when the implementation exposes them; unavailable
route information remains unknown. An RTC connection by itself is not proof of
a direct path. A configured STUN or TURN service is an explicit deployment
dependency, independent of the page host.

## Prove the intended load boundary

Capture separate snapshots before and after each phase. Counters must be
monotonic for the same connection and include all observed host requests and
sent/received body bytes, not only the hosted application write endpoint.

1. **Cold start.** Record initial page/assets, enrollment and introduction work,
   artifact identities, the two peer identities and the selected route.
2. **Warm application work.** Hold membership fixed. Submit real signed work,
   replicate its bodies and finality evidence, and exercise transient signals.
   Direct data-channel counters must increase. Host request and byte counters,
   hosted application writes and introduction-message counters must not.
3. **Host unavailable.** Stop the introduction/page service after assets and
   connections are ready. Submit another original operation and wait for the
   actual peer result. Preserve signed-history digests and operation identities,
   and verify that no host retry loop was started.
4. **Peer interruption.** Preserve the prepared outbox while reconnecting through
   a new introduction. Compare original operations and complete authenticated
   histories after catch-up. Bound queued frames during slow readers and refusal.
5. **Participant update.** Restore the administration service and exercise an
   explicit approval or revoke/rotate operation. Attribute its descriptor,
   control and key-wrap traffic to this phase instead of the warm application
   interval.

Actual browser/native RTC results establish the behavior of those tested
implementations. They do not establish home/mobile/corporate reachability, TURN
usage, provider billing, blob durability or a deployed authentication policy.
The [deployment handoff](deployment-qualification-handoff.md) and
[cost guide](measuring-application-costs.md) specify those separate observations.
