# Source conversion and deletion inventory

The reviewed current contrib baseline is
[`6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce`](https://github.com/werg/tendriller-contrib/tree/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce).
Its 237 tracked files are each classified in [the exact-file inventory](source-inventory.json).
The plan's earlier baseline included `wakeword`, already removed before this branch;
its reasoning is accounted for separately. There is no promise of a successor API
for each removed implementation.

## All component families

| Source family | Knowledge destination |
| --- | --- |
| camera, input-kit | [Reviewed capture](../cookbooks/capture-reviewed-evidence/COOKBOOK.md) |
| glance | [Meaningful visual changes](../cookbooks/notice-visual-changes/COOKBOOK.md) |
| ptt, vad, historical wakeword | [Voice choices](../cookbooks/choose-voice-interaction/COOKBOOK.md) |
| geo | [Location and route progress](../cookbooks/follow-location-progress/COOKBOOK.md) |
| motion | [Motion interpretation](../cookbooks/interpret-motion/COOKBOOK.md) |
| pose, objects, text | [Explicit local perception](../cookbooks/select-local-perception/COOKBOOK.md) |
| overlay | [Frame annotation](../cookbooks/annotate-a-frame/COOKBOOK.md) |
| qr | [Device joining](../cookbooks/join-across-devices/COOKBOOK.md) |
| screenshot | [Rendered evidence](../cookbooks/capture-rendered-evidence/COOKBOOK.md) |
| serial, bluetooth, connectors, hardware-lab | [Instrument protocols](../cookbooks/connect-instrument/COOKBOOK.md) |
| probe, playground | [Capability choices](../cookbooks/discover-capabilities/COOKBOOK.md) |
| wakelock | [Active task lifetime](../cookbooks/keep-task-active/COOKBOOK.md) |
| list | [Shared edits](../cookbooks/reconcile-concurrent-edits/COOKBOOK.md) |
| chart, stream-view | [Live measurements](../cookbooks/present-live-measurements/COOKBOOK.md) |
| ui and optional block schema | [Adaptation without lost work](../cookbooks/adapt-without-losing-work/COOKBOOK.md) |

The 24 current components plus the earlier wakeword account for the plan's 25.
Mounted components, globals, catalogs, dependency closures, and vendored UI libraries
are deleted. Useful algorithm semantics and failure cases survive as reasoning and
small checks, not a renamed component library.

## All recipes and examples

| Source | Principal destination |
| --- | --- |
| approval-remote | [Exact proposal review](../cookbooks/review-exact-proposal/COOKBOOK.md) |
| field-notebook | [Evidence and interpretation](../cookbooks/separate-evidence-interpretation/COOKBOOK.md) |
| hands-free-guide | [Explicit checkpoints](../cookbooks/guide-explicit-checkpoints/COOKBOOK.md) |
| multi-device-workshop | [Device coordination](../cookbooks/coordinate-devices/COOKBOOK.md) |
| hardware-experiment | [Bounded experiment](../cookbooks/run-measurement-experiment/COOKBOOK.md) |
| facilitated-session | [Private responses](../cookbooks/collect-private-responses/COOKBOOK.md) |
| voice-coach | [Voice choices](../cookbooks/choose-voice-interaction/COOKBOOK.md) |
| motion-companion | [Motion interpretation and session summaries](../cookbooks/interpret-motion/COOKBOOK.md) |
| photo-inspector | [Questions about evidence](../cookbooks/ask-about-evidence/COOKBOOK.md) |
| collaborative-canvas | [Sketch discussion](../cookbooks/collect-sketch/COOKBOOK.md) |
| explore-device | [Capability discovery](../cookbooks/discover-capabilities/COOKBOOK.md) |
| adaptive-checkin | [Interface adaptation](../cookbooks/adapt-without-losing-work/COOKBOOK.md) |
| examples/first-page | [Smallest useful page](../cookbooks/publish-smallest-page/COOKBOOK.md) |
| examples/training-dashboard | [Long-running processes](../cookbooks/observe-long-running-process/COOKBOOK.md) |

Complete starter pages, old schemas/scenarios, screenshots, and scaffold metadata
are removed. Selected new specimens prove independent layouts against the target
public contract. Original screenshots remain in Git history as provenance, not a
normative product or an archived supported release.

## Software and supporting material

Core owns CLI, preview, host bridges, collector, artifact integrity, and operational
command references. Their old contrib paths and exports are deleted without forwarders.
Contrib owns extracted decisions, editorial generation, content-only archives, and
checks. The six-domain sessions package, fixed scopes, composition dependency, old
asset locks, and synchronized core release pin are deleted.

Root browser rule policies—geofence hysteresis, first-fix semantics, local-time grace,
and deduplication—are explained in the location, change-detection, and interruption
guides. They do not become a replacement rule DSL. Trusted approval/private references
are deliberately selected application policy through the public host.

The expansion adds the plan's ten source-grounded operational guides and focused
comparison/import guidance. Broader “what if” and application-structure work belongs
in [the curated backlog](backlog.md) until actual adaptation evidence warrants it;
no runtime feature or compatibility work is hidden there.
