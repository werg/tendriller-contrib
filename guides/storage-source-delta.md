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

## Reconcile the concurrently merged default branch

During final verification, the default branch advanced to
[`cb50d60f0ccb3f201975b462b93c49bd1996b221`](https://github.com/werg/tendriller-contrib/tree/cb50d60f0ccb3f201975b462b93c49bd1996b221),
merging storage-branch head `95ac1e87490d87d278c7e8f99494951695ea7857`.
The [complete concurrent-source inventory](concurrent-main-delta.json) accounts for
all **80 changed paths** from the original `6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce`
base, including before/after Git blob identities and each disposition. A rename is
one change record with its previous path retained. This is a separate revision range;
its counts overlap the original inventory and the earlier 13-path snapshot.

| Concurrent source area | Changed paths | Reconciliation |
| --- | ---: | --- |
| Root packaging, distribution, source-archive workflow, and vendored artifacts | 13 | Keep the dependency-free reading collection and core-owned public artifacts. Do not restore executable contrib packaging, core locks, or the old source-archive workflow. |
| Components and their fixtures | 6 | Contract literals, canonical blob URLs, and a recording-test timeout add no new page mechanism. Keep extracted reasoning and independent specimens. |
| Recipe and example declarations | 28 | Keep the established guide conversions; do not reinstate recipe manifests, component closures, or a scaffolder. |
| Workflow adapters and tests | 4 | Version/contract alignment adds no new policy. Explicit trusted references and actual-host checks remain the authority boundary. |
| Old browser publishing helper | 1 | Public uploads, complete publication manifests, and empty upload-response handling already exist in the current SDK and service fixtures. |
| Operational tools, tests, and documentation | 28 | Preserve useful behavior in core, including publication health polling, contract discovery, complete preview transfers, and original-intent retries. Asset-lock and notebook-recipe fixtures remain retired. |

The operational review checked these changes against released core
[`c0aaaecbd01eaaced3aab10706f359125a437a26`](https://github.com/werg/tendriller/tree/c0aaaecbd01eaaced3aab10706f359125a437a26).
Its preview already supplies upload sessions, cancellation, verified completion,
stable blob identity, metadata, and pins with stricter authority and replay checks.
The additional upstream successive-write subprocess assertion introduces no new
production logic: target shared-file records distinguish changed bytes and preserve
accepted receipt replay. That exact redundant assertion is not copied solely to match
source layout; its disposition is explicit in the inventory.

The merge preserves the concurrent default branch as an ancestor while retaining
the tested target architecture. Only source-accounting documentation changes from
the previously verified feature tree. Executable code, specimens, and assertions
remain those exercised at contrib `38ff221447431822f248db3134be5deb3c5bf2a5` against
the published `0.3.0-rc.2` artifacts; the [recorded proof](pilot-checks.md) keeps its
original exact identities.

## Knowledge retained here

The collection explains [where each kind of application data belongs](../cookbooks/choose-data-model/COOKBOOK.md),
[how to publish a coherent graph](../cookbooks/publish-coherent-updates/COOKBOOK.md),
[how to preserve old intent on retry](../cookbooks/recover-outdated-work/COOKBOOK.md),
and [how reviewed evidence differs from verified uploaded bytes](../cookbooks/capture-reviewed-evidence/COOKBOOK.md).
Annotations name the [exact reviewed object or file revision](../cookbooks/annotate-a-frame/COOKBOOK.md).
Operational software and transport authority remain in core.

The browser harness uses the supplied public preview/runtime artifacts and exercises
the upload-session protocol and lost-completion behavior. The [recorded pilot checks](pilot-checks.md)
identify their exact source and artifacts. No source-delta accounting entry upgrades
private media, retention, or production authority claims.
