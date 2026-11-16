# Pilot verification

The pilot guides separate shared semantic guarantees from layout choices. Executable
specimens are evidence for adaptation and failure behavior, not stable page packages.

| Pilot | Distinct adaptations | Observed browser behavior | Passed scenarios |
| --- | --- | --- | --- |
| Measurements | Dense desktop panels/table and a nested mobile instrument | Source/run identity, exact missing values, bounded ingestion, coherent checkpoints, retention gaps, and invalidation of delayed reads or paints after revoked access. | 8 |
| Reviewed capture | Compact inline file form and fullscreen canvas with a separate review | Reviewed snapshot, discard, missing context, runtime capture identity, retry after reload, delayed rejection, new drafts, and saveable evidence when durable storage is unavailable. | 9 |
| Private responses | Facilitator console, minimal participant form, and shared projection | Capability absence, intentional aggregate publication, exact retries, deliberate conflict review, draft identity across reload, and immediate clearing after denied access or late responses. | 13 |

## Recorded target checks

All **30 browser scenarios** and **three actual-host scenarios** passed in
[GitHub run 43856375056](https://github.com/werg/tendriller-contrib/actions/runs/43856375056).
The [uploaded evidence](https://github.com/werg/tendriller-contrib/actions/runs/43856375056/artifacts/14220853772)
includes the scenario records and seven adaptation screenshots.

The exact executable/check source was contrib
`1ade2ae0fb220e7ec9417536092dae0bd6eb08ed`, paired with public core
`dc4997e2d728d790ede4d893613342fd51f80898` and its `0.3.0-rc.1` artifacts.
The [browser record](pilot-evidence.json) names the runtime identity, preview bundle
SHA-256, Chromium version, individual scenarios, and command. The
[host record](../cookbooks/collect-private-responses/checks/evidence.json) names the
SDK/engine archive and reference-source digests. Evidence-only documentation updates
do not change the checked executable snapshot.

The dependency-free editorial/numerical suite also passes **10 tests**. It validates
all 37 guide entries, generated discovery, local links, and 237 source-accounting
decisions; five tests exercise numerical/model semantics. Exported snapshot links and
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

The private-response reference is text-only. Private media needs separately reviewed
storage and authorization. Synthetic identities do not test production OAuth setup.
No live camera, microphone, instrument, production deployment, or exactly-once external
action is claimed. An unsaved in-memory snapshot survives only while its tab remains
open; the storage-failure scenario verifies its explicit save path, not nonexistent
durability.
