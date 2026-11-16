# Storage follow-up source accounting

This supplement accounts for the 13 paths changed on the previously unmerged
[contrib storage branch at `946f6ae39b932264da12610cf9c40b8d1717eef0`](https://github.com/werg/tendriller-contrib/tree/946f6ae39b932264da12610cf9c40b8d1717eef0).
It is separate from the [237-file conversion baseline](source-inventory.json).
The corresponding reviewed core storage source is
[`2cbc6b9be59efad6fe8fdf3353e1858a8729f40e`](https://github.com/werg/tendriller/tree/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e).
These revisions identify source material, not a claim that those drafts were the
final integrated or tested contract.

| Source path at the contrib storage revision | Disposition |
| --- | --- |
| `.github/workflows/branch-source-snapshot.yml` | Do not carry forward. Core owns the coherent SDK, engine, runtime, and tools artifact build; contrib records an explicit artifact pairing for its specimens. |
| `tools/bridges/test/wait.test.mjs` | Retain current core receiver and acknowledgement coverage. Adapt the service descriptor to the public contract constants without replacing later receiver fixes. |
| `tools/cli/bin/tendril.mjs` | Adapt the storage command dispatch in core's optional tools package. |
| `tools/cli/lib/api.mjs` | Adapt canonical storage transport in core; no contrib client or legacy request translation remains. |
| `tools/cli/lib/args.mjs` | Adapt storage command arguments in core. |
| `tools/cli/lib/blobs.mjs` | Move and adapt to core tools: verified upload sessions, downloads, and explicit guarded pins. |
| `tools/cli/lib/pack.mjs` | Adapt in core so publication builds a complete manifest from verified immutable objects. |
| `tools/cli/lib/publications.mjs` | Move and adapt to core tools: exact publication head guards, complete graphs, and explicit retained-version selection. |
| `tools/cli/lib/shared-files.mjs` | Move and adapt to core tools: canonical names, current revisions, change cursors, and conflict handling. |
| `tools/cli/test/blob-files-v3.test.mjs` | Move and adapt to core's public storage contract tests. |
| `tools/cli/test/cli.test.mjs` | Preserve current core CLI coverage and selectively incorporate storage cases. |
| `tools/cli/test/public-contract.test.mjs` | Preserve current core public-consumer checks and incorporate the storage schemas and command envelopes. |
| `tools/cli/test/transfer-resume-cli.test.mjs` | Move and adapt to core's interrupted-transfer and original-intent retry checks. |

## Knowledge retained here

The collection explains [where each kind of application data belongs](../cookbooks/choose-data-model/COOKBOOK.md),
[how to publish a coherent graph](../cookbooks/publish-coherent-updates/COOKBOOK.md),
[how to preserve old intent on retry](../cookbooks/recover-outdated-work/COOKBOOK.md),
and [how reviewed evidence differs from verified uploaded bytes](../cookbooks/capture-reviewed-evidence/COOKBOOK.md).
Annotations name the [exact reviewed object or file revision](../cookbooks/annotate-a-frame/COOKBOOK.md).
Operational software and transport authority remain in core.

The browser harness uses the supplied public preview/runtime artifacts. Its storage
follow-up must exercise the upload-session protocol and lost-completion behavior;
the [recorded earlier pilot run](pilot-checks.md) remains evidence for its exact
pre-integration source and artifacts until a new run is recorded. No source-delta
accounting entry upgrades private media, retention, or production authority claims.
