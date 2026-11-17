# Guarded shared-task qualification

The [native task report](evidence/2026-11-17-peer-generation-task-clean-report.json)
and [validated summary](evidence/2026-11-17-peer-generation-task-clean-summary.json)
record a passing independent runtime execution of the actual
[cookbook task definition](../snippets/peer-task-board.mjs).

| Component | Exact identity |
| --- | --- |
| Consumer source | `164e35d607bce2bef7d344c9e7af3d62882f5f97`, clean |
| Consumer tree | `b038dfda4e250c110b8f4c40562a56d1f67a9ca3` |
| Chronolog source | `c685d393e900828278ca401285fded2c17ab1753`, clean |
| Chronolog tree | `a5509737c9276657f9be8ddb4dc277c2cb9fe445` |
| Public package | `@chronolog/peer-session@0.0.0-gc685d393-sql` |
| Archive SHA-256 | `da43bcf731c85aa95d007e2b8b2cd2b2e0e66fb230469a18fe012b8db3dd95e4` |
| Engine | Exact patched `@dolthub/doltlite@0.11.29`, with its native manifest and patch digest in the report |

The consumer installed the archive offline in a new directory, verified every
published content hash, and used the public native SQL constructor. Its fixtures
were frozen before installation and are identified by content hash in the report.
No sibling source import or secondary application command queue was available.

## Observed behavior

Two authenticated members attempted to claim the same shared task. One result
was accepted and the other rejected. The other author could not finish the
successful claimant's task. These decisions came from the actual transactional
SQL guards, with events and SQL state materialized by the packaged engine.

Recovery selected position 3 from a previous head at position 7. The SQL rows
and conversation events matched the retained snapshot on both peers, including
the restored unclaimed task and the single retained message. The inherited
message kept its original operation identity. The old claim became abandoned;
retrying it refused, while explicit reapplication created a new accepted attempt
whose signed `reapplyOf` identified the original attempt. Reconnecting did not
restore the excluded tail.

The original task creator then closed. Another member claimed and completed a
separate shared task. Reopening that member's owned native device preserved its
identity, storage identity, complete view and applied operation. The reopen call
did not supply epoch keys: the device's retained keyring supplied them.

## Scope of this result

This is native SQL with direct authenticated peer transport and a portable local
generation registry. It does not qualify browser WASM or Tendriller HTTP by
itself. The [browser task command](../checks/README.md) runs the same definition
through both packaged SQL engines and actual board/compact forms; it needs a
separate passing runtime report. The preserved browser events report and hosted
RTC report retain their own exact source pairs and boundaries.

The [browser task attempt](evidence/2026-11-17-peer-generation-browser-task-blocked-report.json)
used clean consumer `114bc2709f5cbb15d96dff0481ded425ffa15384` and the clean
combined Chronolog `c685d393` archive. Package integrity verification and the
isolated public browser bundle succeeded, including the packaged WASM asset
graph. The report records those exact input and output hashes. Chromium could
not start in this workspace because its process-singleton socket was denied.
It records `passed: false`; no SQL browser, OPFS or task-form runtime success is
claimed by that attempt. CI runs this explicit task domain with both engines.
