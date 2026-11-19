# Deployment choices and readiness evidence

Use this note with the pinned [deployment guide](https://github.com/werg/tendriller/blob/ee7f1bf7c444e04e5712bf63e0bda7240c115820/integrations/chatgpt/deploy/README.md)
and [host OAuth guide](https://github.com/werg/tendriller/blob/ee7f1bf7c444e04e5712bf63e0bda7240c115820/docs/INTEGRATION_OAUTH.md).
The [evidence record](evidence.md) identifies the exact qualified source, passed
release gates and downloadable artifacts. This procedure prepares a deployment;
it is not a record that a public host or ChatGPT account has already been
connected.

The Tendriller Worker supplies OAuth and page-access checks. Its existing host
MCP tools manage pages. The Node bridge in this bundle exposes the
application-facing MCP endpoint and runs as a separate enrolled participant.
The host can be deployed without enabling that optional endpoint.

## Choose the account route

| Choice | When it fits | What must be supplied |
| --- | --- | --- |
| Included Tendriller account host | The existing GitHub/Google host account is the intended authority | Additive OAuth account migration, host signing key, exact MCP resource, predefined client and bridge registrations, actual application/page mapping |
| External authorization server | The client needs a different issuer or identity features not provided by the included host | Compatible code/PKCE provider plus trusted current-account, owner and browser-session adapters |
| Authorized native participant | Remote account linking or a retained service is unavailable | Its own retained enrolled device, current native grants and reachable peers; it does not gain permission to send cloud events |

In the included route, `hostAccount: {origin, bridgeId, bridgeSecret, csrfKey}`
enables the supplied account adapter and connection-management UI. Each
application adds its actual `pageId` and explicit `allowedEvents` to the query,
command and projection configuration. The service verifies the host's signed
token, introspects the exact authorization grant and checks current page access.
A different still-active grant does not replace a revoked grant. Owner status
is checked separately before changing application consent.

The host's browser handoff authenticates the existing account without asking the
person to paste a token or bridge credential. The person still approves the
handoff and exact application permissions. OAuth scope, account/page access,
application consent and signed native grants remain independent conditions.

Configure the callback copied from the actual ChatGPT setup. Public clients use
`oauthClient.tokenEndpointAuthMethod: "none"`. Clients requiring a secret use
`"client_secret_basic"`; preparation generates a separate private client-secret
file, or preserves one from `oauthClient.clientSecretFile`. Only its SHA-256 hash
enters host configuration. The raw value is supplied only to that registered
client, never to the Node bridge environment. Both client types require S256
PKCE. The supplied host has no dynamic client registration or OIDC endpoints.

## Preserve the native authority when deploying

The concrete packaging route uses Linux, Node 24, systemd and Caddy. It keeps
the coordinating participant and assistant bridge under different non-root
accounts, with different native stores. The assistant receives only its own
enrolled reader/writer identity. The creator retains separate coordinator,
administrator and publisher authority. Stop a participant before moving or
snapshotting its identity; never run two copies of one native signer.

The release builder accepts exact source inputs, builds public Tendriller and
pinned Chronolog archives in isolated checkouts, and requires native integration
and packed-host/account tests before sealing the release. `RELEASE.json` records
source revisions, package hashes and all release-file hashes. The downloadable
[`tendriller-chatgpt-release`](https://github.com/werg/tendriller/actions/runs/44524005124/artifacts/14528478012)
and [`chatgpt-integration-qualification`](https://github.com/werg/tendriller/actions/runs/44524005124/artifacts/14528198442) artifacts are
build evidence. They do not certify a public deployment or a live model answer.

Use the tools in this order, substituting real private paths and copied client
settings as the release guide specifies:

1. **Build and inspect the exact release.** Keep the manifest and qualification
   reports. Do not replace the pinned prerelease native package with an assumed
   npm version or copy private source state into the bundle.
2. **Provision the real application and devices.** Claim the page as its actual
   owner, configure the immutable version 2 kitchen, publish the signed UI and
   enroll the verified browser and dedicated bridge keys. Retain a coordinating
   peer. Existing version 1 applications need a new definition/application or a
   separately supported evolution procedure.
3. **Prepare private settings.** `prepare.mjs` writes a new private output
   directory with the actual page/application mapping, separate delivery and
   management keys, matching host/client/bridge registrations, systemd units and
   a handoff. Existing output is refused; preparation is not key rotation.
4. **Configure the intended account host.** Apply the additive OAuth migration
   to the current accounts database, or both account migrations for a fresh
   database. Install the signing private key only in that host's secret store.
   Merge unrelated existing client/bridge registrations deliberately.
5. **Stage only the dedicated bridge.** `stage-bridge.mjs` verifies the release,
   takes a coherent SQLite backup of the stopped bridge device, checks its
   expected public key and copies the minimal public runtime. Creator stores,
   enrollment journals and bootstrap secrets are excluded.
6. **Install and check the retained services.** Public code is read-only. Only
   the bridge's native directory and encrypted delivery directory are writable
   by its service. Start the separate coordinator, validate systemd/Caddy on the
   real machine, and run local then online preflight as the assistant user while
   the assistant service is stopped. Start the assistant afterward.
7. **Link the person and accept the real journey.** Complete `/connections`
   sign-in and exact application consent, link the MCP resource in the intended
   client, and record a native request, event receipt, assistant turn, signed
   reply and page query. Qualify optional widget/Workspace routes separately.

## Interpret readiness precisely

| Observation | What it establishes | What it leaves open |
| --- | --- | --- |
| Release gates and file hashes | The selected source passed the recorded tests and produced the identified bytes | Installation, host credentials, DNS, TLS and live client availability |
| Local preflight | Linux/Node/non-root execution, configured scope, exact release/staged bytes, private writable stores and explicit allowlists | Account-host reachability or current native readiness |
| Online preflight | Authenticated exact host registration/signing readiness, a current native selected revision and the dedicated device's least-privilege grants | Human login, owner consent, subscription or assistant write-back |
| `/health` | Process liveness | Successful authorization, peer connectivity or task completion |
| Owner account link and consent | The actual person's selected permissions for this resource/application | A running background subscription or a finished answer |
| Accepted webhook or Workspace trigger | The remote endpoint acknowledged that delivery/run | A model answer or native response command |
| Signed reply observed in selected history | The application received the correlated response under current history | Any automatic stock change, purchase or other action not declared by the domain |

Online preflight has a one-minute CLI deadline and closes its integration. It
does not call the subscription pump, send a provider request or submit a domain
command. The source device must be available only to that process while it runs.
An unavailable coordinator or missing grant is a prerequisite failure to fix,
not a reason to install the creator signer into the bridge.

Retain the native stores, delivery SQLite/WAL data and matching delivery key
coherently. Back up the creator separately. A journal that cannot be decrypted
needs the original key restored; silently replacing it loses retry evidence.
Capacity limits require reviewed reconciliation and archival. Upgrades replace
public code deliberately while preserving compatible private state; they do
not rerun preparation or republish a changed immutable domain into an existing
application.
