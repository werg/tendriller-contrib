# Independent collaboration checks

The consumer installs `@chronolog/peer-session` and `@tendriller/core` archives in
an empty directory and imports only their declared public exports. The native SQL
engine must be included in the Chronolog archive. Source files from a sibling
checkout are not a substitute for either package.

Run the report validator tests with `npm test`. The full runtime entry point is
`npm run test:collaboration`, with exact archive paths and core provenance:

```sh
npm run test:collaboration -- \
  --session-artifact /exact/chronolog-peer-session.tgz \
  --core-artifact /exact/tendriller-sdk.tgz \
  --core-provenance /exact/provenance.json \
  --output /new/evidence-directory
```

The output is immutable evidence for that source tuple: archive and fixture
digests, source commits/trees, runtime and engine identity, the complete six-role
journey and an eight-signer scale profile with 32 simultaneous real MessagePort
attachments. It includes guarded work/result races, raw SQL and DDL bypass
attempts, independently executed evidence/clarity policies, generation recovery
and retained operation evidence. The lineage gates reject a borrowed attempt ID,
ignore body-supplied operation references and trace actual signed request, claim,
result and message attempts. The authority gate reads verified current grants
through the owner without a host transport and checks that returned objects cannot
mutate owner state. Existing output directories are refused.
`--allow-dirty` is useful during implementation; such output is development
evidence and cannot qualify a clean release.

Native direct authenticated transport and MessagePort attachment tests do not
qualify browser SharedWorker/storage combinations, physical phone suspension,
deployed relay quotas or a real conversational provider. Their report flags remain
false. The companion repository browser and gateway tests exercise their own
boundaries; link exact results when publishing a release tuple.

The native report measures command-to-applied, synchronization, concurrent view
query and retained-store reopen times, with sample counts and p50/p95 values. It
records process RSS, sampled heap/external memory, CPU time, the exact grants and
the observed stream-quota rejection. These are eight retained signers in one
Node process with authenticated direct links, local filesystem storage and 32
real MessagePorts. They establish no Internet latency or physical-device memory
budget. Unavailable signal-drop counters are `null`, never invented zeroes.

## Exercise actual SQL/WASM browser views

The browser gate installs the same exact public archives plus pinned Playwright
and esbuild test tools. It builds the actual authored board/discussion UI around
the maintained browser owner and a separately identified qualification bootstrap.
The bootstrap provisions a fresh local test signer; it is never copied into the
production deployment graph.

```sh
npm run test:collaboration:browser -- \
  --session-artifact /exact/chronolog-peer-session-with-native-and-browser-sql.tgz \
  --core-artifact /exact/tendriller-sdk.tgz \
  --core-provenance /exact/provenance.json \
  --wasm /exact/matching-browser-engine \
  --output /new/browser-evidence-directory
```

Both SharedWorker and elected Worker routes must preserve independent drafts and
operation references, keep focus and selection through another view's update,
complete an addressed request, explicitly reassign an old endpoint's claim,
accept a contribution and synthesis, and retain the selected history after
detachment or owner exit. Browser storage uses the actual OPFS SQL/WASM engine.
Screenshots and exact test dependency locks accompany the observations.

The [composition workflow](../../../.github/workflows/collaboration.yml) builds
immutable companion commits and the pinned Emscripten engine, then runs both
gates. `composition.mjs --native .../report.json --browser .../report.json
--output /new/composition.json` refuses mismatched archives, dirty source,
missing observations and unobserved physical-device/provider claims. A blocked
browser launch or skipped test remains a failed gate.

## Build the two authored views

`page/board.html` and `page/discussion.html` offer the same guarded operations in
different layouts. Both attach to the deployment's maintained owner and use its
allocated `endpoint.context.viewId` for independent drafts. The UI supports
addressed requests, frozen review slots, claims, handoff, contributions, late
evidence, cancellation acknowledgment and version-guarded final synthesis.

The normal deployment directory contains `configuration.json` with the following
public values. The builder supplies the [page bootstrap](../snippets/bootstrap.mjs),
[Worker bootstrap](../snippets/worker.mjs) and immutable review definition.

| Configuration field | Required value |
| --- | --- |
| `page_url` | The actual enrolled application publication URL |
| `applicationId` | The stable 64-character application ID in the signed descriptor |
| `profileId` | The retained browser profile name; never a new random value on reload |
| `descriptor` | The signed application descriptor pinned by enrollment |
| `schema` | The signed SQL schema prepared from `reviewWorkspace` with these administrators |
| `administrators` | Exact signing IDs used when creating the immutable collaboration definition |
| `engineBaseUrl` | `../engine/`, pointing to the exact engine copied into this graph |
| `participants` | Optional map from actual signer to descriptive `label`, `kind`, `deviceLabel` and `route`; no permission is derived from it |

The page explicitly offers profile creation only for a missing retained browser
identity. Enrollment remains an owner action against the displayed public key.
Busy storage, unavailable keys and incompatible definitions never recreate a
signer. The Worker uses public authenticated control and relay introductions and
keeps its transport alive independently of either page's RPC attachment.
`serveBrowserOwner({ load })` installs its attachment listeners before waiting for
configuration, so an early Worker boot event cannot disappear during a fetch.
The page refreshes eligibility from `session.authority()`, the owner's verified
local signed control bundle; refreshing the roster does not call the host.

An alternative deployment directory may supply a real `bootstrap.mjs` exporting:

- `applicationReady`: a promise for an authenticated `connectApplicationOwner`
  facade with the collaboration definition and an allocated view ID.
- `readParticipants(session)`: current authenticated membership/binding records
  for permitted recipients. Each record supplies `deviceId`, `label`, `kind`,
  `authorized`, `revoked`, actual route/availability evidence and optional
  `applicationAdministrator`. Presence alone cannot grant these fields.
- `detachView()`, `suspendView()` and `resumeView()` when it owns a browser owner
  composition. These release or preserve its transport and Worker resources;
  closing only the session facade is insufficient for an elected owner.

Use the same signed immutable owner bundle for both documents. The deployment
owns browser storage, engine/WASM loading, profile enrollment and relay/RTC
composition; the cookbook neither invents a key nor retries a saved command.
The native SQL archive used for conformance is not the browser engine capability.

```sh
node cookbooks/coordinate-participants/checks/build-pages.mjs \
  --session /exact/extracted/browser-sql-peer-session \
  --core /exact/extracted/tendriller-sdk \
  --deployment /reviewed/configuration-directory \
  --wasm /exact/matching-browser-engine \
  --output /new/signed-page-graph
```

The builder resolves only public package exports, checks session content hashes,
rejects symbolic links and writes a manifest for every final file. Supply the
resulting graph to the normal signed publication workflow. An entry-specific UI
publication cannot replace the immutable application definition. Use fresh test
applications or a separately reviewed data migration.

## Run the two reference reviewers

The [review policies](../snippets/reviewer.mjs) perform small reversible local
checks of evidence context and clarity. They are runnable specialist agents, not
claims that a model verified the evidence. The conformance fixture invokes these
same functions under two separate enrolled signers and records their distinct
accepted contributions. Neither policy dispatches a provider call.

Provision each agent as its own retained signing profile through the normal core
native bootstrap and start one public native session supervisor for that profile.
Give its client binding a limited command/query policy. Copy `reviewer.mjs` and
[reviewer-cli.mjs](../snippets/reviewer-cli.mjs) into a directory with the matching
public archives installed, then run one process per specialist:

```sh
node reviewer-cli.mjs --directory /private/evidence-owner \
  --token-file /private/evidence-attachment.key \
  --application-id ACTUAL_APPLICATION_ID --policy evidence
node reviewer-cli.mjs --directory /private/clarity-owner \
  --token-file /private/clarity-attachment.key \
  --application-id ACTUAL_APPLICATION_ID --policy clarity
```

The CLI attaches through `@tendriller/core/collaboration/native`; it never opens
a competing signer or retries attachment as independent enrollment. It claims
only eligible frozen slots, rereads the current fence before computation and
result submission, emits disposable signed progress and writes full operation
references to its output. Interrupting the process detaches its client. An old
active claim needs explicit reassignment or generation revalidation before a
new run can continue. Replacing these policies with provider I/O also requires
the maintained effect journal and an explicit reconciliation policy.
