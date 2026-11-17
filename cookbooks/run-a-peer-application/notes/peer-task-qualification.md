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

## Recorded preparation contract at fe752b7f

The [later native report](evidence/2026-11-17-peer-generation-task-fe752b7f-report.json)
and [validated summary](evidence/2026-11-17-peer-generation-task-fe752b7f-summary.json)
repeat the complete native task scenario with clean consumer
`bf140dbdb0c13365a05b2a24896ed6637082e680` and clean Chronolog
`fe752b7f6fd7095b6f45c61a176e34b6f37d0674`. The native archive SHA-256 is
`c19b6f806c39873c79a94613c107f0fcdf3979f2221f7beb700da2e52f9b58b2`.
All task, recovery, reapplication and reopen checks passed.

This run explicitly asserts the actual installed
`prepareNativeSqlApplication()` result has `schema` and `binding` fields before
building the signed descriptor from that binding. It verifies the package
contract directly. Consumer commit `9736489` corrected an unsupported assumption
that those binding fields had moved to the top level; no alternate shape or
compatibility path remains.

The current public API at Chronolog `17a1b64ae0fae6954d9e094db19e17edfbedc7ac`
returns the flat hosted configuration fields `definition`, `schema`,
`executionManifestDigest` and `schemaAdministrator`. The independent fixture
constructs its own signed descriptor from those values and computes the bound
schema/definition digests through public helpers. Canonical
`openNativeSqlSession` and `openBrowserSqlSession` own those steps for ordinary
applications. The fixture accepts only this current shape. The fe752b7f report
above remains unchanged as evidence of its actual earlier artifact.

That current shape is verified by the [clean 76129c3c native report](evidence/2026-11-17-peer-generation-task-76129c3c-report.json)
and [validated summary](evidence/2026-11-17-peer-generation-task-76129c3c-summary.json).
The consumer source is `3107cba13007633177b5003c379ff481b20e5481`; Chronolog is
`76129c3cbe3ef6623d54aba155decb68cecf49e1`, both clean. Archive SHA-256 is
`a3c9ec7046c880a8d0c5f0b6b127b4f8d7b8e76767e07efee98713f745c40a27`.
The four-key public configuration assertion and the complete guarded-task,
SQL/events recovery, explicit reapplication and retained-key reopen scenario
all passed. This is the latest native pairing recorded here.

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

The [later local investigation](peer-browser-runtime-status.md#later-local-sql-investigation)
records a supported browser launch, precise SQL startup stages, and a separately
labeled instrumented run that reached RTC gathering without browser candidates.
Those attempts preserve the original errors and remain unsuccessful runtime
evidence; they do not replace the independent native task result or a required
clean browser task result.

## Browser SQL evidence before the final receipt failure

The [clean CI task report](evidence/2026-11-17-peer-generation-browser-task-ci-b05979c6-report.json)
is from [Chronolog browser run 44095421612](https://github.com/werg/chronolog-db/actions/runs/44095421612),
with clean consumer `1029c7cfb69a16a0f7b403a9e654b962b0304260` and clean
Chronolog `b05979c6407de9dc8c8a73a2866cb026a5ad172b`. Its combined archive
SHA-256 is `de92302a48d4397d5c5320bc75d4f183219a9b76e8ad1ee5b35951820c69aa23`.
The downloaded workflow ZIP was verified against GitHub's recorded SHA-256
`54cdabc7d1c97e9c8f21de6118356089dd2b0faa36ba7ac3879a521dbe0cd4fc`.

That real browser run opened Worker-owned SQL/OPFS, enrolled its keys from a
native peer, and created, claimed and finished a task through the board forms.
Two authors then claimed from the same captured revision: one claim applied,
the other was rejected, and only the successful claim emitted its task event.
Unauthorized completion was rejected. A separately saved offline message later
applied with its original identity over authenticated RTC.

The run subsequently failed while waiting for the operation row from a new task
submitted with the control host blocked. The report records a 30-second DOM wait
timeout, with no page or console error. It does not capture the original
operation state at that point, so it cannot distinguish delayed rendering from
an operation that remained saved. Consumer `bf140db` now records bounded DOM,
original operation and query observations from both peers for that failure.
The partial observations above are preserved; `passed: false` remains the overall
result, and SQL browser recovery is not qualified by this run.
