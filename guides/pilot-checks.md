# Pilot verification

The pilot guides separate shared semantic guarantees from layout choices. Executable
specimens are evidence for adaptation and failure behavior, not stable page packages.

The new [resident-peer task-board/chat specimen](../cookbooks/run-a-peer-application/checks/README.md)
has two layouts and focused deterministic page/model checks. It consumes the public
application-backend boundary, an explicitly supplied public Chronolog bundle, and
a real deployment bootstrap. These new checks are separate from the historical
browser results below. Its [qualification matrix](../cookbooks/run-a-peer-application/notes/implementation-and-qualification.md)
keeps actual SQL/OPFS, native authority, provider effects, network routes, and cost
measurements at their respective evidence boundaries; none are inferred from a
read-handle fixture or a screenshot.

| Pilot | Distinct adaptations | Observed browser behavior | Passed scenarios |
| --- | --- | --- | --- |
| Measurements | Dense desktop panels/table and a nested mobile instrument | Source/run identity, exact missing values, bounded ingestion, coherent checkpoints, retention gaps, and invalidation of delayed reads or paints after revoked access. | 8 |
| Reviewed capture | Compact inline file form and fullscreen canvas with a separate review | Reviewed snapshot, discard, missing context, runtime capture identity, retry after reload, delayed rejection, new drafts, saveable evidence when durable storage is unavailable, and lost upload-completion replay without resending bytes. | 10 |
| Private responses | Facilitator console, minimal participant form, and shared projection | Capability absence, intentional aggregate publication, exact retries, deliberate conflict review, draft identity across reload, fresh authorization on cached-page restoration, and immediate clearing after denied access or late responses. | 15 |

## Recorded target checks

All **33 browser scenarios** and **three actual-host scenarios** passed in
[GitHub run 43871914704](https://github.com/werg/tendriller-contrib/actions/runs/43871914704).
The [uploaded evidence](https://github.com/werg/tendriller-contrib/actions/runs/43871914704/artifacts/14227749050)
includes the scenario records and seven adaptation screenshots.

The exact executable/check source was contrib PR head
`b5e438d6192d2d8791f54078f80764686632f0de`, paired with public core
`c248ceeabfd210538f445d5f889f7cc166f081b1` and its `0.3.0-rc.6` artifacts.
GitHub exercised that head directly; its checked tree is
`735ba4959af4d61beb90cff1957983e119d9523c`.

The run built public core artifacts from that exact checkout, exercised all seven
independent page specimens in Chromium, and installed the packaged SDK/engine for
the fresh-storage trusted-host scenarios. This establishes source-paired integration
evidence. Verifying separately downloaded release archives or a live Cloudflare
deployment requires separate release and deployment checks.

The [browser record](pilot-evidence.json) names the runtime identity, preview bundle
SHA-256, Chromium version, individual scenarios, and command. The
[host record](../cookbooks/collect-private-responses/checks/evidence.json) names the
SDK/engine archive and reference-source digests. Evidence-only documentation updates
do not change the checked executable snapshot.

The preceding recorded `0.3.0-rc.4` checkpoint's
[browser record](https://github.com/werg/tendriller-contrib/blob/0ff8a7a29de4a93bea2e75fb209032160511950b/guides/pilot-evidence.json)
and [host record](https://github.com/werg/tendriller-contrib/blob/0ff8a7a29de4a93bea2e75fb209032160511950b/cookbooks/collect-private-responses/checks/evidence.json)
remain unchanged, with their earlier source and artifact history. The successful
intermediate [rc5 run](https://github.com/werg/tendriller-contrib/actions/runs/43871230786)
also retains its [exact evidence](https://github.com/werg/tendriller-contrib/actions/runs/43871230786/artifacts/14228690589).
The 33-scenario browser harness and three host cases are unchanged across these
candidate pairings. Stale-retry checks still subscribe before clicking Retry and
await the next public rejection for the exact capture before checking the two
identical commands. Every result remains attached to its own source and artifact pair.

The preceding cookbook-only refactor remains separately preserved: its
[30-browser record](https://github.com/werg/tendriller-contrib/blob/c62452f86e7c387daff029847681ef19744e00e0/guides/pilot-evidence.json)
and [three-host record](https://github.com/werg/tendriller-contrib/blob/c62452f86e7c387daff029847681ef19744e00e0/cookbooks/collect-private-responses/checks/evidence.json)
pair contrib `1ade2ae0fb220e7ec9417536092dae0bd6eb08ed` with core
`dc4997e2d728d790ede4d893613342fd51f80898`. The current run re-exercises every earlier
scenario and adds the immutable-upload recovery case against the completed storage
contract; results from the two artifact pairs are not combined.

That source snapshot's dependency-free editorial/numerical suite also passed **10 tests**. It validated
all 37 guide entries, generated discovery, local links, and 237 source-accounting
decisions; five tests exercise numerical/model semantics. The separate
[storage-source supplement](storage-source-delta.md) accounts for the initial 13-path
storage snapshot and the complete 80-path concurrent-main reconciliation. Exported snapshot links and
the clean source identity were checked separately.

These counts and outcomes describe the recorded source pair, not every subsequent
addition to the collection. Run the ordinary checks below to obtain the current
guide count. Expanded user journeys and new feature choices are explained designs
unless a separate record names the actual scenarios and artifacts exercised.

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
separate tests. The local workspace used for that recorded run could not launch
Chromium because its required Unix socket was blocked, so browser execution was
performed in CI.

Cached-page restoration checks dispatch persisted page-transition events. They verify
fresh authorization before restoring a draft and continued clearing after denied access;
they do not establish actual browser BFCache admission or history navigation.

The private-response reference is text-only. Private media needs separately reviewed
storage and authorization. Synthetic identities do not test production OAuth setup.
No live camera, microphone, instrument, production deployment, or exactly-once external
action is claimed. An unsaved in-memory snapshot survives only while its tab remains
open; the storage-failure scenario verifies its explicit save path, not nonexistent
durability.
