# Own one peer session behind the page

The [board](../checks/peer-ui/board.html) and
[compact page](../checks/peer-ui/compact.html) consume the maintained page-side
Chronolog Worker session. They contain domain calls, rendering, draft text and
review references. There is one signed command journal in the owning Worker.
The page never replays its draft list as a delivery queue.

The [conversation definition](../snippets/peer-conversation.mjs) needs only the
events runtime. The [shared task definition](../snippets/peer-task-board.mjs)
adds a signed SQL schema, shared collective ownership and guarded claim/finish
commands. The page selects its task controls from the authenticated definition;
the events application does not pretend to execute SQL.

## Bootstrap the owned public client

The complete deployment supplies `deployment/bootstrap.mjs`. Its
`applicationReady` export resolves to the client returned by
`connectApplicationWorker(worker)` from `@chronolog/peer-session/browser`.
The Worker first opens the device and application using its authorized
enrollment and pinned execution runtime. It attaches the host's dedicated
participant transport and starts the maintained participation controller before
serving the page facade:

```js
import { createPeerIntroductions } from '@tendriller/core/peers';
import { serveApplicationWorker } from '@chronolog/peer-session/browser';
import { openWorkerWebRtcConnection } from '@chronolog/peer-session/webrtc';
import { openWebSocketConnection } from '@chronolog/peer-session/websocket';

const control = session.connectControlParticipant({
  exchange: (envelope, { signal }) => peers.exchange(envelope, { signal }),
});
session.participate({
  control,
  ...createPeerIntroductions({
    peers,
    identity: session.deviceId,
    openDirectConnection: options => openWorkerWebRtcConnection(self, options),
    openRelayConnection: ({ relay, signal }) => openWebSocketConnection(relay, { ready: relay.ready, signal }),
  }),
});
serveApplicationWorker(session, self, { host: control });
```

`peers` is the deployment's public Tendriller peer client. It carries the shared
participant envelope over authenticated HTTP and applies the host interest
policy. The session owns authority verification, exact takeover/publication
journals and shutdown. Attaching the control port performs no request.
Participation owns bounded discovery, connection attempts, authority refresh,
coordinator selection, reconnect grace and recovery approval. The host adapter
supplies routing and invitations, then tries direct RTC and the bounded WebSocket relay within one connection opening. Both use the same encrypted peer channel; the Worker retains authority and the only command journal.

On the page, call `serveWorkerWebRtcConnections(worker)` from the public
`webrtc` entry before connecting the page facade. This helper supplies browser
RTC mechanics while the Worker opens the raw connection and authenticates it
through its own session. Close the helper when the owning page closes. Private
keys, authentication and application traffic remain in the Worker. The WebSocket fallback opens directly in that Worker and uses two independent sockets for reliable history and disposable live updates. It needs no page-owned socket or second Worker facade.

The device owner retains private keys, original signed attempts, authenticated
authority, materialization and detached content. RPC requests carry application
commands and bounded query results. A successful handoff or reachable endpoint
does not grant membership; readiness and connection teardown belong to the
maintained client. The deployment supplies explicit create/resume, enrollment
and transport configuration; it does not write a peer-recovery policy loop.

Build both pages from a packed public session package and the complete deployment:

```sh
node cookbooks/run-a-peer-application/checks/build-peer-pages.mjs \
  --session /extracted/public/peer-session \
  --deployment /complete/worker-and-runtime-assets \
  --output /new/peer-pages
```

The builder verifies the public package's content hashes, copies the complete
deployment and package, and records every output asset. It preserves native,
WASM and Worker resources supplied by that deployment. A task deployment needs
the real verified SQL runtime and signed schema; the default events archive is
insufficient. The build refuses missing bootstrap assets and never substitutes
an in-memory backend.

## Keep decisions visible through recovery

Both layouts observe `session.participation`. When its phase is
`approval-required`, they display the controller's reason, exact available
history point, last verified contact and observed age. Missing freshness remains
unknown. An explicit button calls `approveRecovery` with that displayed proposal
ID; a superseded or rejected choice stays visible for review. The page computes
no freshness threshold, ranks no candidates and schedules no reconnect timer.

A query returns one captured selected-history revision. The page submits new
commands using that revision, while task assertions also run inside the actual
transaction. Conflicting claims can reject; an applied result must be inspected
for its outcome. Applied does not promise that explicit recovery will retain it.

The session streams changes and recovery notices. A recovery replaces the task
and message projection together and displays the excluded-attempt count, with
unknown loss stated explicitly. Saved input is a review draft, never authority.
Unsent editor text survives reload and recovery. The user can inspect or retry
the same operation, copy a rejected message back into the editor, or deliberately
reapply an excluded attempt against a fresh view with a new operation identity.
Removing a reviewed reference only changes this device's list.

The UI exposes no automatic external-action dispatcher. A deployment adding an
irreversible action must select an explicit protected-action capability or
durable external-action service and define which authenticated participant and
resources it may act for. Provider idempotency and reconciliation do not make
an ordinary applied event irreversible. A task claim, live signal
or payload label cannot supply those permissions.

## Evidence boundary

The [browser/native gate](../checks/README.md) exercises real OPFS ownership and
RTC using an exact public package; its preserved report names which page paths
and domains actually ran. A generated page graph alone is a build result.
Events-only runtime evidence does not qualify SQL, mobile suspension, quota
exhaustion, deployed enrollment, Internet routing, or provider cost.
