# Keep application traffic between peers

The peer application has one durable write owner: Chronolog. Tendriller serves
the initial page and authenticates participant administration. A reachable
resident peer accepts a bounded HTTPS introduction directly; deployment places
that endpoint in the initial page configuration. Tendriller also provides an
explicit rendezvous when both endpoints already participate in the same attempt.
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
| Cold peer introduction | Resident-owned HTTPS offer endpoint | None; the initial page already declares the endpoint |
| Coordinated peer introduction | Optional Tendriller rendezvous | One bounded offer and answer when both endpoints participate |
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

For a cold connection to a resident peer, `createHttpWebRtcSignaling` sends one
complete offer to its declared HTTPS endpoint and receives one complete answer.
The resident starts its listener independently of browser visits. This needs no
host poll, persistent host socket, or fixture that secretly starts the other
half of a rendezvous. The initial deployment configuration includes the endpoint
and any coarse introduction admission headers. Production endpoints require
HTTPS; the transport permits plain HTTP only for loopback qualification.

`createWebRtcOfferHandler` mounts on that resident endpoint. It requires an
explicit `authorize(request, signal)` callback and exact allowed page origins.
Origin checks restrict browser calls; they do not authenticate native clients.
The handler bounds JSON bodies to 128 KiB and each fully gathered SDP to 64 KiB,
limits pending introductions and active connections, and applies a negotiation
deadline. It sends the answer before waiting for the channel and authenticated
peer, so the browser can complete ICE. Completion of the HTTP response retires
signaling without ending the established RTC connection.

The public Tendriller peer client opens `peers.rendezvous(channel, peerId)` for a
specific application channel and fresh connection attempt. Its `ready` promise
assigns an offerer or answerer role and a session identifier. Its message stream
carries only `{ type: 'offer' | 'answer', sdp }` descriptions. Each side sends one
fully gathered description, bounded to 64 KiB. The service closes its sockets
after that pair has been exchanged.

This optional rendezvous requires both peers to join the same attempt. A resident
behind an unreachable address cannot discover a new browser merely because a
channel exists on the page host. Supply an explicit reachability arrangement or
use a reachable resident introduction endpoint; no hidden relay or polling loop
is implied by this API.

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

A browser page owns its `RTCPeerConnection` and introduction. The synchronous
`negotiateWebRtc` data-channel callback transfers the untouched `RTCDataChannel`
to the exclusive OPFS Worker before it loses transferability. That Worker owns
the framed channel, authenticated peer link, replica and signing identity. This
requires a browser implementing transferable RTC data channels; unsupported
transfer must fail visibly. Closing the page or replacing the Worker must close
the connection and pending sends. Opening another tab does not create a second
writer for the same local durable store.

## Compose the public APIs

The page-owned [resident connection recipe](../snippets/connect-resident-worker.mjs)
composes `createHttpWebRtcSignaling` and `negotiateWebRtc`. Bundle it with
`@chronolog/transport-webrtc` and the actual deployment assets. It reads the
explicit endpoint supplied by the caller and closes signaling on negotiation
failure. It adds no reconnect loop, durable queue or application identity.

After opening the exclusive replica Worker, a deployment can use:

```js
import { connectResidentWorker } from './connect-resident-worker.mjs';

const connectionLifetime = new AbortController();
const session = await connectResidentWorker({
  endpoint: deployment.residentIntroductionUrl,
  headers: deployment.introductionHeaders,
  configuration: rtcConfiguration,
  signal: connectionLifetime.signal,
  handoff(channel) {
    replicaWorker.postMessage({ type: 'peer-channel', channel }, [channel]);
  },
});

// End this lifetime before replacing the replica Worker or leaving the page.
// connectionLifetime.abort();
// await session.close();
```

The message shape is chosen by the deployment. Transfer inside `handoff`
synchronously, without awaiting, attaching a listener or wrapping the channel
first. An asynchronous callback cannot safely transfer it later. Introduction
admission does not authorize a group read or change the durable signing identity.

In the receiving Worker, use public `frameRtcDataChannel(channel)` from
`@chronolog/transport-webrtc`, and await its bounded `ready` handshake. Feed that framed connection to
`openAuthenticatedPeerLink` from `@chronolog/agent-service/peer-link`, then attach
the authenticated link to the replica's portable transport. Use the persisted
signing identity and active reader grant, and verify the remote identity against
the current membership snapshot. Neither the recipe nor the rendezvous grants
access. Install `createChronologApplicationBackend` through the same selected
`tendril.application` interface after the actual replica is ready.

The [native resident task](../snippets/serve-resident-webrtc.mjs) supplies a real
HTTPS listener through `AgentApplication.tasks`. Its `createResidentWebRtcTask`
accepts the existing native application context, explicit endpoint/listen/TLS
configuration, introduction authorization, page origins and RTC configuration.
It creates native peer connections through `@chronolog/transport-webrtc/native`
and passes framed connections to `context.connectPeer`. The daemon's existing
context performs the current group/read-grant handshake and owns replication.
Keep the native module out of browser bundles.

Compose the task when loading a trusted native application module:

```js
import { createResidentWebRtcTask } from './serve-resident-webrtc.mjs';

export function createAgent(context) {
  return {
    tasks: [createResidentWebRtcTask({
      context,
      endpoint: deployment.residentIntroductionUrl,
      listen: { host: '0.0.0.0', port: 8443 },
      tls: deployment.residentTls,
      allowedOrigins: deployment.pageOrigins,
      authorize: authorizeIntroduction,
      configuration: deployment.rtc,
      onError: reportConnectionError,
    })],
  };
}
```

Here `deployment`, `authorizeIntroduction` and error reporting are supplied by
the trusted native module. Load TLS key/certificate bytes on that resident and
keep the private key out of page configuration. Authorization must independently
check the configured admission credential and honor cancellation. Returning
`true` unconditionally exposes an introduction service to every caller that can
reach it. An admitted caller still cannot read history without a current reader
grant. The task's shutdown closes its listener and its peer lifetimes; ordinary
HTTP introduction completion does neither to the application session.

When both peers explicitly coordinate through the page host, the separate
[Tendriller introduction recipe](../snippets/introduce-peer-worker.mjs) accepts
`peers`, `channel` and a fresh optional endpoint ID, waits for the assigned role,
then calls the same transport negotiation and Worker handoff. Both peers must
join the intended channel. Its routing identifier is unrelated to a signing key.

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
state. A new connection attempt makes a fresh direct offer or obtains a new
coordinated rendezvous session, then performs the authenticated handshake again.
No hidden HTTP or Cloudflare payload relay
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
   histories after catch-up. Bound queued frames during slow readers and refusal,
   and close the transferred channel when its owning Worker is replaced.
5. **Participant update.** Restore the administration service and exercise an
   explicit approval or revoke/rotate operation. Attribute its descriptor,
   control and key-wrap traffic to this phase instead of the warm application
   interval.

Actual browser/native RTC results establish the behavior of those tested
implementations. They do not establish home/mobile/corporate reachability, TURN
usage, provider billing, blob durability or a deployed authentication policy.
The [deployment handoff](deployment-qualification-handoff.md) and
[cost guide](measuring-application-costs.md) specify those separate observations.
