# Qualify the common application session independently

## Application contract and plan scope

The implementation follows one public session, command/query/event API,
operation journal and authenticated replication model. Browser and native
runtimes provide explicit storage, transport and SQL engine capabilities. The
host is a light participant with a dedicated filtered transport for controls,
discovery, invitations and signed code publication. It does not execute ordinary
application commands or receive their required bodies.

The user's subsequent instructions supersede the plan's migration and parallel
profile provisions: this is pre-release software, with no compatibility aliases,
legacy-profile preservation or migration layer. Historical reports retain their
original factual scope; their retired runtime fixtures are not another supported
application composition. Signed wire format versions remain protocol evidence,
not application selectors.

The [evidence validator](../checks/peer-generation-report.mjs) defines the
independent packed-package gate. Its [synthetic tests](../checks/peer-generation-report.test.mjs)
refuse incomplete or contradictory reports; passing those tests alone does not
prove that a runtime, browser or deployment ran.

## Clean public-package checkpoints

| Run | Exact sources | Preserved evidence | What actually ran |
| --- | --- | --- | --- |
| Native RTC | Chronolog `d70939f5a10d51259879d53e19f1de9667c7bf9b`; contrib `94b4a751c700bd4df3e1857e544e8b39c952755e` | [Raw report](evidence/2026-11-17-common-session-native-d70939f5-report.json), [checked summary](evidence/2026-11-17-common-session-native-d70939f5-summary.json) | Public native sessions, independent durable stores and real authenticated loopback RTC; session-owned control/publication APIs and exact retry. |
| Native SQL | Same exact Chronolog and contrib sources as the native RTC row | [Raw report](evidence/2026-11-17-common-session-sql-d70939f5-report.json), [checked summary](evidence/2026-11-17-common-session-sql-d70939f5-summary.json) | The real patched native SQL engine through common `prepareSqlApplication`/`openSqlApplication` with an explicit engine capability; transactional authorization, coherent recovery and durable reopen. |
| Hosted participant | Chronolog `d70939f5a10d51259879d53e19f1de9667c7bf9b`; Tendriller `fa2eb6122cdf915bd893bb8f0f66d0bb86e68099`; contrib `8e3f9038749da5b94b62389fe8ab2fdc2dd41059` | [Raw report](evidence/2026-11-17-common-session-hosted-d70939f5-fa2eb612-report.json), [checked summary](evidence/2026-11-17-common-session-hosted-d70939f5-fa2eb612-summary.json) | Installed Tendriller SDK/engine, actual local workerd HTTP and rendezvous, synthetic authenticated accounts, real native RTC and served signed HTML/JavaScript. |

All named package sources and consumer checkouts were clean at capture. The
reports name source trees, package versions, fixture digests, runtime versions,
installed dependency locks and artifact SHA-256 values. The checked summaries
hash their exact raw inputs. A later commit or package is a new pairing and
requires its own run; these checkpoints do not automatically qualify it.

The Chronolog native RTC archive at `d70939f5` has SHA-256
`f7df9cd6028f1ad2aec4b4f328beab04f1be1349897fa0a3fb64c7f87cbf6a13`.
The SQL archive at that source has SHA-256
`72a413408c6bc704c742777b6ac3622b28a577981d8a8a4248ca23b4a2f1801a`.
The hosted checkpoint uses that same Chronolog RTC archive. Its Tendriller SDK
has SHA-256 `fe5a98f5f74294af82535d0cc4b3ac2965c9a527c391d266f917dd0917cd1862`;
runtime `67ebb6b5468547357cd9c6bf3062d9bb0dac96175fae4cd0e22e1ad3a37336d9`;
and engine `0f806c110cda78fedda09189249f1db880debc1ee03db8ee9306252aadc74c81`.

The native scenario recovered the original saved operation after a lost reply,
completed two commands while its control boundary was blocked, recovered from
sequence 6 to a complete prefix at 4, reconstructed a fresh peer, excluded a
returning branch across a third generation, linked a reviewed reapplication and
reopened the original signing identity. Control attachment performed no I/O;
a lost selection reply retried the same saved signed request.

The SQL task scenario accepted one competing claim, refused completion by the
wrong signer, reset SQL and events together to a complete older prefix, preserved
inherited operation identity, rejected an abandoned retry and continued after
the creator closed. Reopening recovered the same device, stored keys and outcome.

The hosted scenario verified actual authored HTML and JavaScript, publication
hashes, exact signed retry after a persisted reply was lost, rejection of altered
bytes, unauthorized authors and stale heads, retention of previous code, and
survival of the selected publication across host restart. Ordinary database,
content and live-signal updates were filtered before HTTP and refused at raw
host ingress. Full host request/body/rendezvous counters stayed unchanged while
host-blocked ordinary commands increased authenticated peer traffic.

## Implementation-plan gates

These rows distinguish implementation and local observations from full gate
completion. In particular, the checkpoints above use explicit recovery calls;
they do not establish SDK-owned reconnect grace, recovery freshness policy or
eligible-candidate selection.

| Plan gate | Implementation and recorded observations | Remaining acceptance boundary |
| --- | --- | --- |
| G0 — Executable authenticated order and recovery contract | Public sessions execute signed selected order; the actual native SQL consumer demonstrates original-signer authorization and coherent SQL/events. Shared control verification fences excluded ancestry and recovery selections. | The complete adversarial authority/continuity/floor matrix belongs to the core suite. This independent report does not substitute for every core security test or native/WASM equality run. |
| G1 — Remove hosted steady-state commands | The native and real workerd/native RTC runs pass the blocked-host workload, complete unchanged host counters, zero required hosted application-body bytes and explicit filtered participant rules. | Browser and deployed runs must demonstrate the same boundary with their actual transports. Loopback does not measure TURN or public network traffic. |
| G2 — Recover with accepted recent loss | Explicit selection adopts an older complete prefix, preserves adopted identities, exposes abandoned work, reconstructs a fresh peer and excludes an old branch across three generations. Lost control replies preserve the saved selection request. | Maintained SDK orchestration for reconnect grace, freshest eligible source and broader-loss approval still needs implementation and an independent consumer. No five-minute recovery-age workload or universal loss bound is claimed. |
| G3 — Independent developer/agent experience | Empty-directory consumers install public archives, use one journal, query/command/retry/recover/reapply and reopen without changing identity. Native SQL and the real host use that same session API. | Browser Worker ownership and second-tab behavior require an actual browser result for the exact pairing. A fresh-agent usability exercise with coaching, elapsed time and mistakes recorded has not been run here. |
| G4 — Real network, cost and operating envelope | The local reports expose the actual measured byte and runtime boundaries. Cost calculation keeps absent measurements unknown. | Deployed login, home/mobile/restrictive routes, TURN, suspension, churn, quota, large content, battery, backup and provider billing remain unqualified. |

The local browser attempt could not launch Chromium: the environment refused
its singleton socket before any page or Worker ran. A writable workspace profile
and temporary directory produced the same prelaunch failure. This is a blocked
browser qualification, not a pass and not a browser-application assertion failure.
The HTTP e2e runner similarly failed before tests when Wrangler could not enumerate
network interfaces. These restrictions do not replace the actual workerd
integration result above or the still-required browser/deployed gates.

## Public consumer boundary

Install the explicitly supplied `@chronolog/peer-session` archive in a new
directory, with a fresh package cache and lifecycle scripts disabled. Import only
public package entries. Fault injection may interrupt real transport/control
boundaries; application work must use the maintained session for commands, exact
retry, coherent views and recovery. No private core test fixture, copied
RPC/RTC lifecycle, second command queue or profile-dependent application is an
acceptable substitute.

The workflow has direct, native RTC, native SQL, browser/native and real hosted
lanes. Each builds immutable pinned sources and uploads artifacts, provenance,
raw reports and checked summaries even when a later assertion fails. A configured
workflow is not evidence that a particular lane passed. Preserve the execution
URL or its actual report for every claimed run.

| Fault or boundary | Required observation |
| --- | --- |
| Current-generation host outage | An actual host probe fails; ordinary work progresses; every host counter remains unchanged. |
| Selective host participant | Client filtering and independent host rejection both enforce the declared facet policy. |
| Signed page code | Actual served assets follow the authenticated publication chain and survive host restart. |
| Lost persisted reply | Exact operation, ordered receipt and record count survive retry. |
| Missing coordinator | Its process/store is unavailable as a recovery source; a survivor offers a complete usable prefix. |
| Coherent recovery | SQL, events and outcomes switch together; a fresh peer reconstructs the same selected state. |
| Retained and abandoned work | Adopted identities persist and the excluded suffix remains inspectable as abandoned evidence. |
| Returning branch and later takeover | An excluded ancestor suffix cannot reenter selected history despite valid old signatures. |
| Deliberate reapplication | A new operation links the original intent and checks current domain guards. |
| Reopen | The stored signing identity, keys and original operation state return through the public constructor. |

Measure the five-minute freshness objective under a named workload with a second
usable peer. Report actual adopted-state age, known abandoned work and unknown
loss. A heartbeat cannot establish a universal maximum. Provider-cost comparisons
require equivalent outcomes and explicitly stated retention/settlement guarantees;
see [measurement guidance](measuring-application-costs.md).

## Earlier source-specific evidence

The [earlier hosted095/d252 report](evidence/2026-11-17-common-session-hosted-095a04cf-d252a1e1-report.json)
and [checked summary](evidence/2026-11-17-common-session-hosted-095a04cf-d252a1e1-summary.json)
preserve the first clean actual-host checkpoint separately from the newer pairing.

The [dirty native/events development report](evidence/2026-11-17-peer-generation-preview-report.json)
and [summary](evidence/2026-11-17-peer-generation-preview-summary.json),
[partially dirty RTC development report](evidence/2026-11-17-peer-generation-rtc-preview-report.json)
and [summary](evidence/2026-11-17-peer-generation-rtc-preview-summary.json), and
[earlier clean RTC pairing](evidence/2026-11-17-peer-generation-rtc-clean-report.json)
and [summary](evidence/2026-11-17-peer-generation-rtc-clean-summary.json) retain
their original provenance and limitations. They describe the exact artifacts
named in those files. They neither qualify a later source nor require keeping
superseded runtime code or fixtures active.
