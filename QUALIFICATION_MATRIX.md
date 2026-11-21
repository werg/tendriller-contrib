# Tendriller Cross-Platform Qualification Matrix

Generated: `2026-11-21T23:35:14.576Z` on `linux/x64` (`Node v22.22.1`).

> **Honesty contract:** Measurements below come from real local runs on this host. Unobserved operating systems, external runtimes (Bun/Deno), Emscripten WASM compilation, and commercial cloud-agent VMs are explicitly marked `ci_workflow_configured`, `implemented_wasm_binary_pending_emcc`, or `pending_live_access`—never fabricated.

## Measured Local Artifact Footprint & Benchmarks

| Metric | Measured Value | Target |
| --- | --- | --- |
| `@tendriller/core` SDK tarball | 136.8 KB | — |
| `@tendriller/runtime` tarball | 6322.0 KB | — |
| `@tendriller/tools` tarball | 8745.2 KB | — |
| Standalone `tendriller-bootstrap.mjs` | 12.7 KB | Zero-dependency single file |
| `chronolog-peer-session` (`events-full`) | 200.4 KB | — |
| `chronolog-peer-session` (`events-relay-only`, zero `werift`) | 198.0 KB | Smaller / zero native RTC |
| Compiled DoltLite + `sqlite-vec` WASM binary (`sqlite3.wasm`) | 2696.5 KB | Portable SQL without C++ compiler |
| Total `events-relay-only` core+runtime+session archive size | 6656.8 KB | < 15 MB |
| Capability probe (`probeCapabilities`) | 16.4 ms | < 500 ms |
| Verified local bootstrap extract (`tendriller-bootstrap.mjs`) | 153.24 ms | < 15,000 ms |
| Encrypted checkpoint export + retire + restore pass rate | 100% | 100% |
| Measured Node process RSS (probe + SQLite checkpoint) | 70.46 MB | < 150 MB |
| `chronolog-db` `pnpm test:fast` (59 pure-JS test files) | 34.38 s | < 30 s target |

## Acceptance Gates (W1–W12)

| # | Gate | Status | Observed Evidence |
| --- | --- | --- | --- |
| 1 | Zero GNU tar / native compiler on events-relay-only & events-full | `passed_local_linux_x64` | Pure-JS tar.gz in @tendriller/core/archive, tendriller-bootstrap.mjs, and tendriller-contrib build; CI matrix configured for macOS/Windows. |
| 2 | Pure-JS SQL WASM fallback (no silent downgrade to events) | `passed_local_linux_x64` | Built Emscripten 4.0.20 DoltLite WASM (2.63 MB); passed 6/6 wasm-conformance and 3/3 chronolog-node-fs VFS host-disk persistence tests. |
| 3 | Windows named pipe, long Unix path auto-hash, loopback TCP fallback | `passed_local_linux_x64` | session/ipc.mjs tested in scripts/test/ergonomics-portability.test.mjs; Windows CI matrix configured in runtime-matrix.yml. |
| 4 | Outbound HTTPS polling gateway + Remote MCP + Local Stdio MCP | `passed_local_linux_x64` | Verified via real OAuth + DO admission in server/test/assistant-http-gateway.public.test.ts and Stdio MCP in ergonomics-portability.test.mjs. |
| 5 | Browser-led coordination & graceful degradation diagnostics | `passed_local_linux_x64` | docs/tutorial/pairing-native.mjs allowBrowserCoordinator + docs/tutorial/helpers/diagnostics-panel.mjs verified. |
| 6 | Single-command verified bootstrapper & capability probe | `passed_local_linux_x64` | scripts/tendriller-bootstrap.mjs (12963 B) verified extract in 153.24 ms. |
| 7 | Connect-or-start startup race convergence + zero-IPC bounded mode | `passed_local_linux_x64` | connectOrStartNativeSession tested for bounded mode and concurrent shared startup convergence over loopback TCP. |
| 8 | Atomic pre-submission outbox + verbatim local operationId preservation | `passed_local_linux_x64` | session/outbox.mjs & session/native.mjs preserveOperationId verified in ergonomics-portability.test.mjs. |
| 9 | SQL starter UI + composition v2 profiles | `passed_local_linux_x64` | docs/tutorial/sql/{index.html,page.mjs,build.mjs} + COMPOSITION_V2_PROFILES verified. |
| 10 | Node 22.15+ / 24+ / Bun / Deno compatibility matrix | `ci_workflow_configured` | engines.node >=22.15.0 verified locally on Node v22.22.1; .github/workflows/runtime-matrix.yml configured for Node 22.15/24, Bun, Deno across 3 OSes. |
| 11 | Encrypted device checkpoint + anti-split-brain retirement + secret-free source handoff | `passed_local_linux_x64` | chronolog-db checkpoint.ts + tendril handoff/checkpoint verified with 100% recovery & DEVICE_RETIRED_BY_CHECKPOINT. |
| 12 | ServerlessHostAdapter + Docker/systemd/launchd/Windows service templates | `passed_local_linux_x64` | @tendriller/core/serverless tested; deploy/* templates and docs/DEPLOYMENT_GUIDE.md shipped. |
| 13 | chronolog-db fast pure-JS test lane & AGENTS.md | `passed_local_linux_x64` | pnpm test:fast ran 59 pure-JS files in 34.38s. |
| 14 | Live qualification across 5 external cloud-agent surfaces | `pending_live_access` | Honest placeholder matrix generated; vendor cloud VM credentials/runs are not locally accessible. |

## Target Cloud-Agent Qualification Surfaces

| Platform | Primary Route | Existing App (Connector) | Create & Run Events App | Create & Run SQL App | Checkpoint & Resume |
| --- | --- | --- | --- | --- | --- |
| Meta Muse | `outbound-https-mcp-or-polling-gateway` | `pending_live_access` | `pending_live_access` | `pending_live_access` | `pending_live_access` |
| Grok Bot + Cursor Cloud Agent | `mcp-or-disposable-sandbox` | `pending_live_access` | `pending_live_access` | `pending_live_access` | `pending_live_access` |
| OpenAI Dots + Work / Codex Cloud + Desktop Bridge | `remote-mcp-or-desktop-ipc` | `pending_live_access` | `pending_live_access` | `pending_live_access` | `pending_live_access` |
| Claude Duet | `remote-mcp-or-stdio-mcp` | `pending_live_access` | `pending_live_access` | `pending_live_access` | `pending_live_access` |
| Instinct | `disposable-sandbox-and-handoff` | `pending_live_access` | `pending_live_access` | `pending_live_access` | `pending_live_access` |

Re-generate locally after building sibling `tendriller` and `chronolog-db` checkouts:

```sh
node distribution/scorecard.mjs
```
