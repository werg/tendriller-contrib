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
digests, source commits/trees, runtime and engine identity, six actual signing
profiles, distinct endpoint attachments, guarded work/result races, generation
recovery and retained operation evidence. Existing output directories are refused.
`--allow-dirty` is useful during implementation; such output is development
evidence and cannot qualify a clean release.

Native direct authenticated transport and MessagePort attachment tests do not
qualify browser SharedWorker/storage combinations, physical phone suspension,
deployed relay quotas or a real conversational provider. Their report flags remain
false. The companion repository browser and gateway tests exercise their own
boundaries; link exact results when publishing a release tuple.

## Build the two authored views

`page/board.html` and `page/discussion.html` offer the same guarded operations in
different layouts. Both attach to the deployment's maintained owner and use its
allocated `endpoint.context.viewId` for independent drafts. The UI supports
addressed requests, frozen review slots, claims, handoff, contributions, late
evidence, cancellation acknowledgment and version-guarded final synthesis.

The deployment directory must provide a real `bootstrap.mjs` exporting:

- `applicationReady`: a promise for an authenticated `connectApplicationOwner`
  facade with the collaboration definition and an allocated view ID.
- `readParticipants(session)`: current authenticated membership/binding records
  for permitted recipients. Each record supplies `deviceId`, `label`, `kind`,
  `authorized`, `revoked`, actual route/availability evidence and optional
  `applicationAdministrator`. Presence alone cannot grant these fields.

Use the same signed immutable owner bundle for both documents. The deployment
owns browser storage, engine/WASM loading, profile enrollment and relay/RTC
composition; the cookbook neither invents a key nor retries a saved command.
The native SQL archive used for conformance is not the browser engine capability.

```sh
node cookbooks/coordinate-participants/checks/build-pages.mjs \
  --session /exact/extracted/browser-sql-peer-session \
  --core /exact/extracted/tendriller-sdk \
  --deployment /reviewed/authenticated/bootstrap-assets \
  --output /new/signed-page-graph
```

The builder resolves only public package exports, checks session content hashes,
rejects symbolic links and writes a manifest for every final file. Supply the
resulting graph to the normal signed publication workflow. An entry-specific UI
publication cannot replace the immutable application definition. Use fresh test
applications or a separately reviewed data migration.
