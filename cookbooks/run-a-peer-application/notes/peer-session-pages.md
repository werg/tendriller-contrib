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
`applicationReady` export resolves to the maintained page facade. The page
supplies its existing authenticated `runtime.host.peers`; no agent credential
belongs in a browser Worker or application source.

```js
import { connectApplicationWorker, serveApplicationWorkerHost } from '@chronolog/peer-session/browser';
import { maintainWorkerApplicationWebRtc } from '@chronolog/peer-session/webrtc';

const worker = new Worker(new URL('./application.worker.mjs', import.meta.url), { type: 'module' });
const hostBridge = serveApplicationWorkerHost(worker, runtime.host.peers);
export const applicationReady = connectApplicationWorker(worker);
const session = await applicationReady;
const network = maintainWorkerApplicationWebRtc(session, worker, { host: runtime.host.peers });
await network.ready;

export async function close() {
  await network.close();
  await session.close();
  hostBridge.close();
  worker.terminate();
}
```

The owning Worker opens the session through that maintained control bridge. This
is a join/reopen example. First-time device creation explicitly adds
`create: true`; first application publication explicitly adds `create: {}` to the
session opener. A missing store never silently creates a new identity.

```js
import { openApplicationSession } from '@chronolog/peer-session';
import { connectApplicationWorkerHost, openBrowserDevice, serveApplicationWorker } from '@chronolog/peer-session/browser';
import { conversation } from './peer-conversation.mjs';

const host = await connectApplicationWorkerHost(self);
const device = await openBrowserDevice({ name: 'conversation' });
const session = await openApplicationSession({
  device, definition: conversation, applicationId, host,
});
serveApplicationWorker(session, self, { host });
session.signal.addEventListener('abort', () => { void host.close(); }, { once: true });
```

For the task definition, replace the session opener with
`openBrowserSqlSession` from `@chronolog/peer-session/sql-browser` and pass
`engineUrl: new URL('./browser-engine/', import.meta.url)`. Serve the complete
packed engine directory with the required cross-origin isolation headers and
JavaScript/WASM MIME types. The constructor checks the artifact identity and
owns the OPFS engine pool.

The facade installs the maintained Worker RTC transport. The lifecycle owner
handles discovery, introductions, authenticated catch-up, reconnect and eligible
takeover. Do not install a second Worker transport handler. The host bridge has
only four compact methods: application lookup, definition lookup, immutable
configuration and signed generation selection. Domain commands, keys and content
stay off that bridge.

The device owner retains private keys, original signed attempts, authenticated
authority, materialization and detached content. RPC requests carry application
commands and bounded query results. A successful handoff or reachable endpoint
does not grant membership; readiness and connection teardown belong to the
maintained client. The deployment chooses and exposes explicit create/resume,
enrollment, recovery eligibility and connection behavior.

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
agent effect must define which authenticated participant and resources it may
act for and how its effects reconcile across recovery. A task claim, live signal
or payload label cannot supply those permissions.

## Evidence boundary

The [browser/native gate](../checks/README.md) exercises real OPFS ownership and
RTC using an exact public package; its preserved report names which page paths
and domains actually ran. A generated page graph alone is a build result.
Events-only runtime evidence does not qualify SQL, mobile suspension, quota
exhaustion, deployed enrollment, Internet routing, or provider cost.
