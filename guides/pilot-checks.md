# Pilot verification

The pilot guides separate shared semantic guarantees from layout choices. Executable
specimens are evidence for adaptation and failure behavior, not stable page packages.

| Pilot | Distinct adaptations | Observed browser behavior | Passed scenarios |
| --- | --- | --- | --- |
| Measurements | Dense desktop panels/table and a nested mobile instrument | Source/run identity, exact missing values, bounded ingestion, coherent checkpoints, retention gaps, and invalidation of delayed reads or paints after revoked access. | 8 |
| Reviewed capture | Compact inline file form and fullscreen canvas with a separate review | Reviewed snapshot, discard, missing context, runtime capture identity, retry after reload, delayed rejection, new drafts, saveable evidence when durable storage is unavailable, and lost upload-completion replay without resending bytes. | 10 |
| Private responses | Facilitator console, minimal participant form, and shared projection | Capability absence, intentional aggregate publication, exact retries, deliberate conflict review, draft identity across reload, fresh authorization on cached-page restoration, and immediate clearing after denied access or late responses. | 15 |

## Most recent cross-repository verification

[GitHub integration run 43871914704](https://github.com/werg/tendriller-contrib/actions/runs/43871914704)
passed **33 browser scenarios** and **three actual-host scenarios** on the
contrib PR source `b5e438d6192d2d8791f54078f80764686632f0de`, paired with
core source `c248ceeabfd210538f445d5f889f7cc166f081b1` (the reserved
`0.3.0-rc.6` candidate). The run built the public core artifacts from that
exact checkout, exercised all seven independent page specimens in Chromium,
and used the packaged SDK/engine for the three fresh-storage trusted-host
scenarios. Every corresponding CI step completed successfully.

This run is **source-paired integration evidence**, not proof that a separately
downloaded release archive or a live Cloudflare deployment was exercised.
Core's own release checks and published release assets must be verified
separately. Earlier immutable scenario records and their source pairings below
remain useful as historical checkpoints; they are not silently relabeled.

## Recorded target checks

All **33 browser scenarios** and **three actual-host scenarios** passed in
[GitHub run 43869136552](https://github.com/werg/tendriller-contrib/actions/runs/43869136552).
The [uploaded evidence](https://github.com/werg/tendriller-contrib/actions/runs/43869136552/artifacts/14227350346)
includes the scenario records and seven adaptation screenshots.

The exact executable/check source was contrib PR head
`335cb89e61f5cfcd931d56fed3e1c840b0bc5c82`, paired with public core
`f3e55e202bc0b37d581b66b61446f7e1a56c67e1` and its `0.3.0-rc.4` artifacts.
GitHub exercised PR merge commit `107b852e0a2712e7dcd313a98b75180e8f9ced8a`;
its tree `32e7971d9340469a6688096679963cfc6600c319` is identical to that PR head.
The [browser record](pilot-evidence.json) names the runtime identity, preview bundle
SHA-256, Chromium version, individual scenarios, and command. The
[host record](../cookbooks/collect-private-responses/checks/evidence.json) names the
SDK/engine archive and reference-source digests. Evidence-only documentation updates
do not change the checked executable snapshot.

The preceding reviewed `0.3.0-rc.2` checkpoint's
[browser record](https://github.com/werg/tendriller-contrib/blob/b843f49c5115d8699d4925b78107bc4bf265e92b/guides/pilot-evidence.json)
and [host record](https://github.com/werg/tendriller-contrib/blob/b843f49c5115d8699d4925b78107bc4bf265e92b/cookbooks/collect-private-responses/checks/evidence.json)
remain unchanged, with their earlier source and artifact history. The current target
retains every earlier scenario and adds two participant-restoration cases. Stale-retry
checks still subscribe before clicking Retry and await the next public rejection for
the exact capture before checking the two identical commands. Every result remains
attached to its own source and artifact pair.

The preceding cookbook-only refactor remains separately preserved: its
[30-browser record](https://github.com/werg/tendriller-contrib/blob/c62452f86e7c387daff029847681ef19744e00e0/guides/pilot-evidence.json)
and [three-host record](https://github.com/werg/tendriller-contrib/blob/c62452f86e7c387daff029847681ef19744e00e0/cookbooks/collect-private-responses/checks/evidence.json)
pair contrib `1ade2ae0fb220e7ec9417536092dae0bd6eb08ed` with core
`dc4997e2d728d790ede4d893613342fd51f80898`. The current run re-exercises every earlier
scenario and adds the immutable-upload recovery case against the completed storage
contract; results from the two artifact pairs are not combined.

The dependency-free editorial/numerical suite also passes **10 tests**. It validates
all 37 guide entries, generated discovery, local links, and 237 source-accounting
decisions; five tests exercise numerical/model semantics. The separate
[storage-source supplement](storage-source-delta.md) accounts for the initial 13-path
storage snapshot and the complete 80-path concurrent-main reconciliation. Exported snapshot links and
the clean source identity were checked separately.

## Run the checks

`npm run check` validates reading metadata/links, generated discovery, complete source
accounting, and deterministic snippets. It does not launch a service or install core.

`npm run test:pilots -- --tools /path/to/core/dist/tools --playwright /path/to/playwright/index.mjs`
consumes explicitly supplied built public tools/runtime and browser automation artifacts.
Add `--browser /path/to/chromium` to select an installed browser. The runner rejects
missing inputs, records each independent scenario, and fails on uncaught browser errors.
It does not import sibling private source, complete missing page assets, or install a
retired component graph.

`node cookbooks/collect-private-responses/checks/run-host.mjs --artifacts /path/to/core/dist`
creates a temporary consumer of the public SDK/engine archives and exercises the actual
Worker with fresh storage and synthetic identities. It records archive/source digests
and individual scenario outcomes. These tests establish private projections, revision
conflicts, exact receipt replay, text archive/reset, immutable approved content, expiry,
and stable execution identity for the selected references.

## Evidence boundaries

Preview fixtures exercise interaction behavior; they do not establish service privacy,
transaction enforcement, or production byte retention. Browser scenarios block service
workers for deterministic HTTP interception. Offline publication belongs to core's
separate tests. The local workspace cannot launch Chromium because its required Unix
socket is blocked, so browser execution was performed in CI.

Cached-page restoration checks dispatch persisted page-transition events. They verify
fresh authorization before restoring a draft and continued clearing after denied access;
they do not establish actual browser BFCache admission or history navigation.

The private-response reference is text-only. Private media needs separately reviewed
storage and authorization. Synthetic identities do not test production OAuth setup.
No live camera, microphone, instrument, production deployment, or exactly-once external
action is claimed. An unsaved in-memory snapshot survives only while its tab remains
open; the storage-failure scenario verifies its explicit save path, not nonexistent
durability.
