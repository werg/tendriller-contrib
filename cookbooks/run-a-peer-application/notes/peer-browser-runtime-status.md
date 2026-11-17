# Browser runtime qualification status

Both the [events pairing](peer-generation-qualification.md#clean-browser-worker-and-opfs-pairing)
and the [complete guarded SQL task pairing](peer-task-qualification.md#complete-clean-browser-sql-pairing)
passed with actual Chromium, Worker-owned OPFS, peer key enrollment, real RTC,
host-blocked work, partial-content restart and explicit recovery. Each report
retains its exact tested artifact and consumer revisions. Deployed operating
conditions remain outside these local browser/native topology results.

## Earlier workspace launch failure

The [preserved attempted runtime report](evidence/2026-11-17-peer-generation-browser-blocked-report.json)
records `passed: false`. It installed and verified the clean public Chronolog
archive from `784414c95e77f797083866f9c314c1ecd4183661`, with SHA-256
`79ab3c6ead93e539e90940fe13d74968a0173156e2d9ee1d7afe83f641b0b89c`.
The consumer source was `83af44064b708011c2ac0c2d11d721949c210b67` with
uncommitted consumer work, correctly recorded as dirty. The report preserves
the installed dependency lock digest, package integrities and fixture digests.

Chromium 156.0.8078.79 could not launch in this workspace: its process-singleton
Unix socket failed with `Operation not permitted`. No Worker ownership, OPFS,
RTC, page interaction or browser recovery scenario ran. A download of the
supported Playwright Chromium headless shell also failed with a truncated
archive before it could be used. No system restrictions were changed.

The runner now retains the original runtime error as well as its outer process
failure, so a missing executable or denied launch cannot be mistaken for an
application failure. That attempt supplied no browser acceptance evidence. The
later CI run used an environment supporting normal browser process requirements.
The earlier packed native RTC evidence remains scoped to native peers.

Later public Worker-client, page and SQL changes require their own exact clean
archive and a fresh report. Building or checking those files does not update
this failed runtime result.

## Later local SQL investigation

The supported Playwright 1.65 headless shell, Chromium 158.0.8127.18, subsequently
launched under the existing workspace restrictions. The
[clean SQL attempt](evidence/2026-11-17-peer-generation-browser-task-local-report.json)
uses consumer `1029c7cfb69a16a0f7b403a9e654b962b0304260` and the combined
Chronolog `c685d393` archive. The consumer was installed beneath a Chronolog
checkout to reproduce the CI directory layout. All 19 browser bundle inputs
resolved to the installed public package or frozen consumer fixtures. An empty
esbuild configuration now prevents inheritance of producer source aliases; the
strict bundle-input check remains in place.

That attempt opened the owned browser device and fetched its authority, but
the public SQL runtime did not finish within the fixture's 30-second startup
limit. The page was secure and isolated, with OPFS and Web Locks available. The
report records `passed: false` and the observed startup stages. It does not
establish a SQL runtime defect or successful task interactions.

A separate [diagnostic report](evidence/2026-11-17-peer-generation-browser-task-diagnostic-report.json)
has `mode: "diagnostic"`. Its copied installed `sql-browser.mjs` was instrumented
with stage messages after schema verification, engine fetch and verification,
WASM compilation and instantiation, SAH pool opening, and materializer opening.
Those startup stages completed, as did Worker ownership checks. RTC then timed
out: the browser entered ICE gathering but reported no candidates, and only the
native offer reached signaling. The recorded endpoint failures distinguish
browser `APPLICATION_WORKER_CONNECTION_TIMEOUT` from native
`WEBRTC_NEGOTIATION_TIMEOUT`.

The diagnostic is not an unmodified artifact qualification. Its artifact fields
identify the original archive, while its browser asset hashes identify the
instrumented execution. Neither local report qualifies SQL forms, peer data
exchange, or recovery. No product timeouts, transport policy, or workspace
restrictions were changed to obtain these observations. The separate clean
`76129c3c` CI pairing subsequently passed the full SQL scenario.

A further local browser-only OPFS diagnostic sampled an initial SQL commit in
`csReplayWal`/BLAKE3 before any held read view. It did not measure WAL size or a
defensible commit duration, and it did not establish the cause of the earlier
CI receipt timeout. Read-only engine inspection identified whole-WAL replay and
synchronous SAH I/O as a possible source of read amplification. Automatic
compaction has not been qualified with live readers, so no product patch was
made from that diagnostic. The complete cloud scenario above passed.
