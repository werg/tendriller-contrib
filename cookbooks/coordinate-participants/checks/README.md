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
