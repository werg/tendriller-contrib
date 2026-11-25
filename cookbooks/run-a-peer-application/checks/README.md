# Qualify an authored-operation-set application

These checks execute public archives installed in an empty consumer directory.
No sibling checkout, workspace alias, private import, install lifecycle script,
application retry queue, or alternative production discovery policy is allowed.
The runners freeze fixture bytes, verify installed files against provenance,
record exact archive/dependency hashes and consumer commits/trees, and require a
new output directory. `--allow-dirty` is development evidence only; composition
validation rejects dirty inputs.

Both `@chronolog/peer-session` and standalone `@chronolog/authority` archives must
identify `chronolog-crdt-v1`. The authority archive independently supplies signed
membership, enrollment, publication, and finality APIs. A historical report is
not evidence for this protocol. No new runtime qualification is claimed until
these commands successfully execute the exact newly minted clean archives.

## Native operations and RTC

```sh
npm run test:operation-set -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --authority /exact/chronolog-authority.tgz \
  --output /new/events

npm run test:operation-set -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --authority /exact/chronolog-authority.tgz \
  --transport native-rtc --output /new/rtc
```

The event scenario exercises independent disconnected authors, equal author
timestamps, late earlier insertion, duplicate/permuted fact delivery, exact
signed retry after a lost local reply, independent authenticated retention,
coherent captured/reactive snapshots, restart with cached authority, reconnect
union, actual encrypted content transfer, and explicit no-finality behavior.
The RTC variant uses actual pinned Werift with deliberately loopback-only
candidates, authenticates both peers, measures reliable bytes, retires SDP
introductions, exercises the independent live lane, and closes every transport.
A bounded in-memory framed pair makes no physical-network claim.

Both variants additionally exercise signed-frontier and two-validator policies
through the public session APIs: local work before a provider is available,
threshold enforcement, proof-without-body final-read blocking, certified
inclusion, delayed offline exclusion without rewriting signed intent, and proof
and outcome persistence after reopening. Finality never supplies operation order.

## Real native and WASM SQL

```sh
npm run test:operation-set -- \
  --artifact /exact/session-with-native-and-wasm-sql.tgz \
  --authority /exact/chronolog-authority.tgz \
  --domain tasks --output /new/sql
```

This gate requires actual `/sql`, `/sql-native`, and `/sql-wasm` public exports and
verified native/WASM engine bytes. The report retains the archive's actual
`nativeEngine.implementation` and manifest. These Node/native/WASM runs do not
qualify an external Celld process or its bridge ABI; that engine needs its own
exact clean-source qualification. The task definition contains no schema.
Initialization is a separate ordinary authored transaction. Two disconnected
writers initially materialize conflicting claims; an earlier claim revises the
later outcome after merge. Ordinary late DDL changes a rejected insert into an
accepted one. Permissioned alter/drop/index operations, cross-object denial,
DDL+DML+emit rollback, coherent captured schemas, explicit stale-query errors,
scoped public agent-tool exact retry, and reload are checked. The same signed
facts replay through actual Node WASM and native engines with identical rows,
outcomes, and execution manifests. Public scoped tools are exercised here; this
is not an unassisted agent usability study.

## Browser Worker, OPFS, WASM, offline reload and UI

```sh
npm run test:operation-set:browser -- \
  --artifact /exact/session-with-native-and-browser-sql.tgz \
  --authority /exact/chronolog-authority.tgz \
  --output /new/browser
```

The browser runner installs pinned Playwright/esbuild only as test tools. Supply
`--chromium /exact/chromium` to select and hash a specific executable. It launches
a fresh Chromium context, uses the public owning Worker facade, and explicitly
provisions a new signing identity with a recipient-bound encrypted key package.
It keeps the page free of private keys, rejects a second owner, and records real
OPFS resources.

The browser and native participants independently author while disconnected,
merge over actual RTC, preserve exact retries, transfer multi-chunk encrypted
content, send disposable live signals, and continue while control HTTP is
unavailable. It caches the complete immutable page/Worker/WASM graph in a fixture
service worker, abruptly terminates the Worker, reloads fully offline, resumes
cached identity/authority, writes locally, and reconnects. Another browser SQL
scope executes real WASM/native parity over authenticated peers, including late
DDL/outcome revision, atomic rollback, unauthorized DDL, and offline SQL reload.
An authorized browser separately certifies signed-frontier finality with its
native participant already closed; exclusion and evidence survive offline reload.

The domain page has conversation list/detail, authenticated intent inspection,
separate drafts and deep links, rather than a JSON editor. Desktop and 320px
flows check late insertion, draft/focus preservation, Back/Forward, keyboard
navigation, long content and horizontal overflow, retaining before/after PNGs.
The page builder `build-peer-pages.mjs` requires explicit real bootstrap assets;
it does not manufacture deployment or signing material.

## Actual Workerd controls, publication and relay

```sh
npm run test:operation-set:host -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --authority /exact/chronolog-authority.tgz \
  --artifacts /exact/tendriller-dist --output /new/host
```

The host runner installs the exact SDK/engine pairing and Workerd testing tools.
It checks clean host provenance, every emitted file digest, and embedded authority
source/file hashes. Public test fixtures sign in synthetic accounts through the
real auth routes. Device enrollment uses `ownerApi` with cookie and exact origin,
not a bearer token masquerading as a browser. New member grants use exact retry
and authenticated membership-head comparison. No epoch keys reach the host.

Publication is independent of data authority. The checks sign actual authored
HTML, lose a reply after persistence, retry the exact release, reject altered
bytes/non-publishers/stale heads, retain prior code, restart Workerd, and verify
served bytes and unchanged application authority. Ordinary data writes do not
call host control endpoints.

Use `--transport websocket` to force direct refusal and exercise actual native
reliable/live WebSocket lanes through a bounded loopback bridge to real Workerd
relay sockets. Add `--browser` for real browser Worker relay clients. Relay cuts
and reopenings are deliberate explicit topology faults, not a second production
connection manager. Reports measure host bytes, check ciphertext for private
markers, verify queue bounds, and close all lanes. Blocking control HTTP does
not mean blocking the relay: relayed synchronization still depends on relay
availability and consumes host bandwidth.

## Composition and limits

```sh
npm run check:operation-set-composition -- \
  --report /new/events/report.json \
  --report /new/rtc/report.json \
  --report /new/browser/report.json \
  --report /new/sql/report.json \
  --report /new/host/peers/report.json \
  --report /new/relay/peers/report.json \
  --report /new/browser-relay/peers/report.json \
  --output /new/composition.json
```

Composition requires all seven freshly successful raw gates, hashes original
report bytes, rejects dirty/mixed sources or differing bytes under one package
version, binds exact embedded host authority to the independently installed
archive, and checks native/browser/WASM execution manifests and binary hashes.
Synthetic report fixtures test validators only and are never written as runtime
evidence. Historical green reports are never converted or relabeled.

These checks run against SDK, engine and Chronolog archives you select from published
builds. Contrib CI does not pin, download or qualify a core release, and these
gates remain manual independent qualifiers.

These are local loopback artifact qualifications, not deployed login, Internet,
mobile suspension/eviction, provider cost, guaranteed retention, or exactly-once
external-effect qualification. Runners close their browsers, links and Workerd
children on completion. Real pages/native participants must remain open for live
sync; a finality actor must be available to advance its policy. Neither is needed
to durably save local work. The separate cost report preserves unknown usage and
pricing inputs rather than treating missing measurements as zero.
