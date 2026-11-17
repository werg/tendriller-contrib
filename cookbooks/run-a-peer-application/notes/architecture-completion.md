# Complete the application architecture

This matrix separates remaining implementation from deployment qualification.
It uses the current [application contract](../../../guides/application-primitives.md),
the [release inventory](peer-generation-release-manifest.json), the committed
recipes and issues #14–#17 as its scope sources.

The existing exact-source native, hosted and browser gates already qualify
commands, SQL/events, key exchange, content, signals and explicit prefix recovery
in their recorded local settings. New features need their own public-artifact
acceptance. Their presence must not relabel old reports or turn unmeasured
deployment conditions into a pass.

## Remaining implementation and acceptance

| Area | Required behavior | Independent acceptance |
| --- | --- | --- |
| Restricted host participation | Chronolog authenticates signed control and release records. Tendriller supplies account policy, storage and HTTP transport for the records that role accepts. Transport does not manufacture authority. | A host receives approved control/publication data without a private application reader key or SQL materializer. Unrelated application envelopes, unauthorized publishers and altered signed metadata fail at the public boundary. |
| Code and page releases | A signed immutable manifest identifies the complete asset graph and application binding. Publisher authority is independent of data ownership. Staging bytes and activating the release are separate, exact, concurrency-guarded operations. | Verify every asset digest/size/path, publish nested assets, interrupt staging, lose an activation response and retry the exact request. Two publishers racing the same activation head yield one selection. A deliberate switch back still advances protected activation history. Current tabs retain a coherent graph and drafts until they apply the update. |
| Reset-aware projections | A selected-history source retains authenticated origin and exposes explicit append/reset boundaries. A projection advances incrementally within its generation and replaces its view coherently on recovery. | Observe initial and incremental state, select an earlier prefix, reject a stale cursor and produce one replacement view with no excluded events. Closing/reopening preserves the selected cursor or explicitly rebuilds it. |
| Reset-aware effects | A durable dispatch journal owns stable intent identity outside the lossy application suffix. Authorization uses verified origin. Completed or uncertain calls are reconciled across recovery; a reset never grants permission to repeat them. | Complete one call, leave one provider result uncertain, recover before both intents and reopen the worker. Completed work stays completed; uncertain work requires reconciliation. Deliberate domain reapplication does not accidentally reuse or duplicate an external effect identity. |
| Timers | Selected-history schedule/cancel commands drive a durable reset-aware scheduler. Wall-clock wakeup only proposes the original intent; it does not grant authority or silently rewrite its guards. | Reopen before/after a deadline, cancel before dispatch, abandon a schedule through recovery and recover after a completed dispatch. No orphaned timer or duplicate external call appears; an unavailable worker makes lateness visible. |
| Materializer resource bounds | Persist incremental work and report explicit capacity limits. Any WAL/checkpoint or history compaction must preserve live readers, replay and selected-prefix recovery. | Measure actual work as history grows. Reopen and recover with held views and interrupted writes at the new boundary. A local performance suspicion is not a root-cause claim or permission to weaken durability. |

Chronolog owns the portable protocol and recovery-aware machinery. Tendriller owns
the constrained host integration. This repository owns examples using only public
archives, exact-source evidence and the developer-facing acceptance story.
Prerelease changes replace old abstractions directly; there is no alternate
compatibility path or migration layer.

## Deployment work remains separate

| Issue | Required external evidence |
| --- | --- |
| [#14](https://github.com/werg/tendriller-contrib/issues/14) | Public home/mobile/restrictive routes, fallback/TURN, actual authentication and observed resource/traffic behavior. |
| [#15](https://github.com/werg/tendriller-contrib/issues/15) | Comparable provider usage and dated prices, including native/relay/content/backup costs and different recovery guarantees. |
| [#16](https://github.com/werg/tendriller-contrib/issues/16) | Intended deployment storage, fencing, independent copies, interrupted writes and permanent loss of the newest disk. |
| [#17](https://github.com/werg/tendriller-contrib/issues/17) | Real enrolled devices, production authentication, quota/eviction/clearing and audited private-data/key flows. |

The [deployment handoff](deployment-qualification-handoff.md) names the concrete
inputs and execution order. Those observations remain unknown until measured;
neither finishing this architecture nor an existing loopback success supplies
them.
