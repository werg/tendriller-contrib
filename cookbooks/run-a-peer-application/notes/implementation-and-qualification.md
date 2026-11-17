# Common-session implementation and qualification

This checklist follows the peer-generation implementation plan across Chronolog,
Tendriller and contrib. Its consumers share one application/session API, attempt
journal, verified execution order and replication model. Native, browser and
hosted participants supply different storage, transport and capability policies.
The separate `chronolog-finality-v1` profile remains supported in Chronolog core,
outside these cookbook runners. It is not an implicit fallback or a completion
mode of the generation session.

All software is prerelease. Replace abstractions directly and update every
consumer. No compatibility alias, old/new mirror, migration layer or permanent
resident role is part of this work. Historical reports retain their original
source identities; they do not require maintaining the obsolete implementation.

## Protocol and execution ownership

| Plan work | Owner | Required behavior and evidence |
| --- | --- | --- |
| X-BASE, C-PROFILE | Chronolog; shared by all consumers | One authority model separates authorship, sequencing, recovery and settlement. Shared verification binds application, controls, selected ancestry, delegated order and protected floors. |
| C-ORDER | Chronolog | Exact signed attempts and body-before-receipt persistence; deduplication; verified order used consistently for SQL, events, outcomes and revisions. Coordinator, follower and fresh replay agree. |
| C-CONTROL | Chronolog with Tendriller host | Monotonic signed controls, explicit device/data/schema/coordinator roles, revocation/key boundaries and protected administrative transitions. Recovering data never widens permissions. |
| C-RECOVERY | Chronolog with hosted selection | Complete usable prefix evidence; authorized takeover; repeated-generation exclusion cutoffs; atomic coherent view switch; preserved abandoned commands and explicit reapplication. |
| C-OPS | Chronolog and all adapters | Saved/applied/shared/abandoned vocabulary; exact retry and lookup; cancelled waits do not reject commands; inherited identity persists; stale captured views receive explicit recovery handling. |
| C-SESSION | Chronolog | One supported browser/native lifecycle owns identity, local storage, connections, control participation, recovery and shutdown. No copied lifecycle or second consumer outbox. |
| C-REPLICATION | Chronolog | Prompt bounded background body/proof replication; durable complete-prefix receipts; no mandatory second-copy barrier; distinguish retention, completeness, application and reachability. |
| C-PROJECTION | Chronolog | Generation-aware coherent reads and cursors; incremental updates while ancestry remains selected; explicit reset/rebuild for excluded state. |
| C-CONTENT | Chronolog | Authorized bounded chunked/resumable peer content, lazy fetch and retention observations. Optional providers declare their own guarantees. |
| C-EFFECTS | Chronolog; optional service owners | Ordinary applied events cannot feed irreversible-finality consumers. Protected actions preserve full prerequisites; stable effect identity, authorization and reconciliation remain required. |
| C-AGENT | Chronolog; consumed by Tendriller/contrib | Definition-generated describe/query/command/operation/changes/recovery tools in the agent's session. Host tools handle lifecycle/control, not every application command. |
| C-STORAGE | Chronolog | Indexed append/range/deduplication, quota bounds, one owner, restart/fault consistency and bounded work as history grows. No whole-history reference log on the production hot path. |
| C-PACKAGING | Chronolog | Self-contained public session entries, Worker assets, native adapter, engine/control manifests; SQL-free imports remain SQL-free. |

## Hosted participant and publication

| Plan work | Owner | Required behavior and evidence |
| --- | --- | --- |
| T-BOOTSTRAP | Tendriller | Authenticated descriptor, definition and assets independent of creator/device lifetime; explicit enrollment; no mandatory native authority URL. |
| T-DISCOVERY | Tendriller/Chronolog | Bounded authenticated expiring route hints; coalesced updates and one-off introductions; no per-command poll. Advertisements never confer authority. |
| T-GENERATIONS | Tendriller using Chronolog verification | Durable authenticated CAS; exact transition retry; candidate/requester authorization; selected-ancestry and floor enforcement; persistence before reply and continuity through host restart. |
| T-RUNTIME | Tendriller using the common session | Honest saved/applied/shared/recovering/abandoned status; the same application API through native/browser adapters; no fabricated finality or synchronization. |
| T-OPTIONAL | Explicit service owners | Archive, relay and protected-action capabilities enabled deliberately and qualified separately; ordinary collaboration has no hidden dependency on them. |
| Participant transport | Chronolog protocol, Tendriller adapter | One bounded scoped envelope for control/publication/discovery/ephemeral/database/content facets. Client and host enforce the same selective interests; routing grants no author permissions. |
| Code/page updates | Chronolog publication, Tendriller hosting | Signed publication ancestry/CAS, authorized current author, exact bytes, application/definition/execution binding, atomic served graph and durable retry/restart. Code publication does not rewrite application history. |

## Consumer and release ownership

| Plan work | Owner | Required behavior and evidence |
| --- | --- | --- |
| K-RECIPES | Contrib | Signals, events and SQL use the same supported composition. Domain definitions and UI remain visible; protocol lifecycle, retry and takeover stay in Chronolog. |
| K-QUAL | Contrib | Empty-directory packed consumers demonstrate lost replies, host outage, accepted-loss takeover, abandoned inspection, deliberate reapply and unchanged identity after reopening. |
| X-RELEASE | All repositories | Exact clean source trees and compatible archives; embedded control/engine identities; real public consumer execution; one reproducible composition manifest. |
| Upstream qualification | Chronolog/deployment maintainers | Native/WASM deterministic execution and exact engine patches; browser storage/crypto/channel ownership; native RTC interoperability. Patch upstream only for a demonstrated dependency defect. |

## Acceptance gates

**G0 — Authority and execution.** Real signed encrypted commands and independent
stores must preserve original authorship, deterministic selected order, exact
retry and inherited identities. Exercise unauthorized recovery, conflicting
order, missing bodies, restrictive controls, protected floors and three-generation
ancestry. An excluded suffix cannot become eligible merely because its signatures
remain valid. Browser, native and hosted consumers use the shared verifier.

**G1 — Host independence.** Establish connections, then block every Tendriller
endpoint during ordinary commands, coherent reads, live signals and replication.
Require zero command-correlated hosted requests and application-body bytes,
usable local status, no certificate/append dependency and no backend fallback.
Measure TURN separately when configured.

**G2 — Accepted-loss recovery.** Remove coordinator A and its newest store; let
B select an older complete prefix; reconstruct fresh C; return A and quarantine
its excluded suffix; deliberately reapply one appropriate intent under current
guards. Also test racing successors, a lost selection reply, clean handover,
incomplete head, no survivor, coordinator-plus-host outage, restrictive controls,
unmet recovery floors and repeated exclusion ancestry. Measure the five-minute
freshness objective under a stated workload; report unknown loss honestly.

**G3 — Independent developer experience.** A fresh consumer installs only public
packed artifacts, creates/enrolls or resumes a device, discovers, queries,
commands, inspects a lost reply and recovery, reapplies deliberately and reopens
without changing identity. Include second-tab ownership and unsupported browser
capabilities. Record extra protocol code, coaching, time to useful work and
recovery mistakes; repeated application-owned infrastructure belongs in core.

**G4 — Deployed operation and cost.** Actual authentication, deployed controls,
home/mobile/restrictive networks, TURN, suspension, restart, quota pressure,
large content, recovery freshness and provider/device cost require actual
observations. The [deployment handoff](deployment-qualification-handoff.md)
names those settings. Local workerd, loopback RTC and build-only evidence cannot
qualify them.

## Current executable boundaries

The [public-artifact guide](../checks/README.md) names the maintained native,
SQL, RTC, browser and hosted-participant runners. The
[peer-generation evidence note](peer-generation-qualification.md) records actual
results and exact artifacts. New tests do not become passing runtime evidence
until their complete raw report and checked summary exist.

The [historical resident archive](finalized-resident-recipe.md) preserves earlier
source-specific observations. The former implementation checklist is available
at its [exact source snapshot](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/implementation-and-qualification.md).
