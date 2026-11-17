# Keep application traffic between peers

The peer application has one durable write owner: Chronolog. Tendriller serves
the initial page and authenticates participant administration. A reachable
resident peer accepts a bounded HTTPS introduction directly; deployment places
that endpoint in the initial page configuration. Tendriller also provides an
explicit rendezvous when both endpoints already participate in the same attempt.
After introduction, one authenticated WebRTC connection has independent reliable
and live channels. The reliable channel carries history, inclusion and closure
evidence and detached envelopes; the live channel carries transient signals.
The page's normal operation has no hosted application socket or health poll.

This is the current architecture being implemented across
[Tendriller #35](https://github.com/werg/tendriller/pull/35),
[Chronolog #1](https://github.com/werg/chronolog-db/pull/1) and
[contrib #13](https://github.com/werg/tendriller-contrib/pull/13). Historical WSS
and workerd-relay reports retain their original revisions and transport scope.
An implemented API or a successful build is not evidence of a completed WebRTC
runtime scenario; new reports must identify the actual peers and selected route.

The [current compact membership and resident recovery evidence](compact-membership-resident-qualification-2026-11-17.md)
records clean-source native administration and actual browser/Worker RTC tests.
It preserves measured direct routes, authenticated recovery, original operations
and host-independent exchange, with the packaged-host integration scope explicit.

## Assign each responsibility once

| Responsibility | Owner | When the page host participates |
| --- | --- | --- |
| HTML, modules, Worker and WASM assets | Tendriller publication | Initial load or an explicit publication update |
| Account authentication and participant approval | Tendriller with the portable membership administrator | Enrollment, roster inspection, approval, revocation and key rotation |
| Cold peer introduction | Resident-owned HTTPS offer endpoint | None; the initial page already declares the endpoint |
| Coordinated peer introduction | Optional Tendriller rendezvous | One bounded offer and answer when both endpoints participate |
| ICE, separate reliable/live channels and their bounds | Chronolog WebRTC transport | No application payload relay through the page host |
| Peer identity, reader grants and signed records | Chronolog authenticated peer link | Independent of the introduction service |
| Durable proposals, retry, SQL, events and proofs | Chronolog replica | No hosted application-state command or replay queue |
| Inclusion and author-time closure | Selected Chronolog finality provider | Provider placement is independent of page hosting |
| Agent effects and timers | Resident Chronolog services | No browser reducer or hosted state handler dispatches the same work |
| Rendered views, drafts and focus | Page-owned application | Local reads and interaction state |

The portable membership administrator remains an explicit trust boundary. It
retains the keys needed to authorize readers and wrap epoch keys. Participant
operations synchronize a complete compact control projection whose count/root
is committed by the signed finality closure. Each entry binds its original
receipt and activation cutoff. The administrator verifies controls and their
checkpoint without application descriptors or bodies; full replicas recompute
the commitment while verifying the entire ledger. Retained administrative work
scales with governance changes, and ordinary application writes do not trigger
administrator work. New devices verify grants/keys from that proof before
connecting, then fetch and verify application history over RTC.
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
`negotiateWebRtc` callback transfers both untouched `RTCDataChannel` objects
together to the exclusive OPFS Worker before either loses transferability. That Worker owns
the framed channel, authenticated peer link, replica and signing identity. This
requires a browser implementing transferable RTC data channels; unsupported
transfer must fail visibly. Closing the page or replacing the Worker must close
the connection and pending sends. Opening another tab does not create a second
writer for the same local durable store.

## Compose the public APIs

The page-owned [resident connection recipe](../snippets/connect-resident-worker.mjs)
composes the core session supervisor with direct HTTP signaling and WebRTC
negotiation. Bundle it with `@chronolog/transport-webrtc` and the deployment
assets. The initial runtime includes an immutable `tendril.peers.initialBootstrap`
snapshot: `{version: 2, endpoints: [{url: 'https://resident.example/introduce'}]}`.
Selecting one of these endpoints performs no discovery read. An operator can
explicitly refresh or replace hints through the host API when necessary.

After opening the exclusive replica Worker, a deployment can use:

```js
import { connectResidentWorker } from './connect-resident-worker.mjs';

const resident = tendril.peers.initialBootstrap.endpoints[0];
if (!resident) throw new Error('This page has no configured resident introduction');
const workerLifetime = new AbortController();
const connection = connectResidentWorker({
  endpoint: resident.url,
  headers: deployment.introductionHeaders,
  configuration: rtcConfiguration,
  signal: workerLifetime.signal,
  retry: { initialDelayMs: 500, maxDelayMs: 8000, maxAttempts: 6 },
  attach(channels, attemptSignal) {
    // This application port transfers immediately and acknowledges only after
    // the Worker has framed, authenticated and attached the actual peer.
    return attachPeerChannels(replicaWorker, channels, attemptSignal);
  },
});
await connection.ready;

// Abort before replacing the Worker or leaving the page. Late acknowledgements
// cannot install a replacement session or restart the stopped supervisor.
// workerLifetime.abort();
// await connection.close();
```

`attachPeerChannels` is the deployment's Worker RPC port, not a new Chronolog
identity or writer. It calls `postMessage` with both channels in the transfer list before
returning its authentication acknowledgement promise. The promise resolves to
`{signal, close}` for that authenticated Worker connection. The signal ends when
the peer link ends, even if ICE remains connected. The recipe supervises both
lifetimes and closes both on retirement. The RPC port rejects pending replies
when the attempt signal aborts; the Worker also fences asynchronous attachment
against a replaced connection or closed replica.

The core `supervisePeerSession` owns one attempt and one established session. It
cancels stale attempts, closes late results and retries with the explicit bounded
backoff policy. A healthy connection has no supervisor timer, ping or discovery
poll. Brief success does not reset the failure budget; a sufficiently stable
session resets it only when that session ends. After exhaustion, a deliberate
new supervisor starts a new budget. `waitForSession()` waits for the current or
next authenticated attachment. That readiness does not assert that retained
history has finished replaying or that a finality provider is available.

The message shape is chosen by the deployment. Transfer inside `attach`
synchronously, without awaiting, attaching a listener or wrapping either channel
first. Its acknowledgement promise may settle later, after Worker authentication. Introduction
admission does not authorize a group read or change the durable signing identity.

In the receiving Worker, use public `frameRtcPeerChannels(channels)` from
`@chronolog/transport-webrtc`, and await its bounded `ready` handshake. Call the
opened browser peer's `connectPeer({ connection })`. That public composition
uses its persisted signing identity, verifies current reader capabilities,
attaches durable replication to the reliable lane and its signal channel to the
independent live lane. Signals never wait behind history credit or body replay.
Both lanes still share network bandwidth; this is not a latency guarantee. An optional `peerIdentity` pins the expected remote endpoint as well
as checking membership. Application bootstrap need not recreate the handshake,
signal routing or cleanup. Neither the recipe nor the rendezvous grants access.
Install `createChronologApplicationBackend` through the selected
`tendril.application` interface after the actual replica is ready, and install
`client.signals` independently through `tendril.signals.install()`.

The [native resident task](../snippets/serve-resident-webrtc.mjs) supplies a real
HTTPS listener through `AgentApplication.tasks`. Its `createResidentWebRtcTask`
accepts the existing native application context, explicit endpoint/listen/TLS
configuration, introduction authorization, page origins and RTC configuration.
The thin task delegates its HTTPS listener and shutdown ownership to
`createWebRtcHttpsListener` from the Node-only
`@chronolog/transport-webrtc/resident` entry point and passes framed connections
to `context.connectPeer`. Chronolog owns request cancellation, listener limits,
TLS adaptation and native connection cleanup in one reusable implementation. The daemon's existing
context performs the current group/read-grant handshake and owns replication.
Its `context.signals` supplies the application-facing live send/subscribe API;
`connectPeer` manages routing and verified relay automatically. The resident task
does not require `context.finality` to be present. Keep the native module out of
browser bundles.

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
waits. Established live signals do not wait for that finality progress. Host
independence cannot make an unavailable finality service available.
Do not silently substitute the hosted backend or issue a new operation identity.

If the RTC connection fails, preserve pending proposals and report the connection
state. The supervisor makes a fresh direct offer under its bounded retry policy, then
performs the authenticated handshake again. A coordinated rendezvous remains an
explicit alternative when both endpoints can join the intended attempt.
No hidden HTTP or Cloudflare payload relay
is a fallback. Configure an explicit alternative route only when its provider,
authorization, byte accounting and availability policy are acceptable.

ICE may select a direct candidate pair or a TURN relay. Both use the same
Chronolog protocol, but they have different traffic and cost boundaries. Use `session.getRoute()` to record
the selected candidate types when the implementation exposes them; unavailable
route information remains `unknown`. A configured ICE server or arbitrary route
label cannot stand in for a selected-candidate observation. An RTC connection by itself is not proof of
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
