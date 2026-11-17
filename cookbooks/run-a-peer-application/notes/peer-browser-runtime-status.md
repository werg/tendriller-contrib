# Browser runtime qualification status

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
application failure. The browser gate must run in an environment supporting its
normal browser process requirements before it supplies acceptance evidence.
The existing packed native RTC evidence remains scoped to native peers.

Later public Worker-client, page and SQL changes require their own exact clean
archive and a fresh report. Building or checking those files does not update
this failed runtime result.
