# Sensing specimen checks

## Deterministic gate

From the collection root:

```sh
npm run build
npm run check
```

The five sensor cookbooks' checks exercise the copied page modules directly.
The import check also imports every sensor snippet without browser globals,
establishing that import alone acquires no resource. Fixtures control chooser
grants, clocks, visibility, track endings, packet chunks and content writes.

Covered cases include filtered capability gating and bounded diagnostic sharing;
one-shot/watch location freshness, accuracy, hysteresis and producer coalescing;
iOS motion permission timing and refractory detection; Serial/Bluetooth framing,
late connection shutdown and reader locks; trusted screen/audio capture, time and
byte caps, no auto-capture from an agent request, local review, exact 64 KiB
staging, discarded work, uncertain sends and explicit retention. Card-handler
fixtures also check that late capability discovery cannot reopen sending or
discarded reviews and that correcting a response cannot reenable denied inputs.

## Public runtime and session gate

> **Qualification pending.** The runner now targets the authored operation-set
> session, but both existing JSON reports below remain historical evidence only.
> They have not been regenerated and do not qualify this port. Running it requires
> a freshly built matching public runtime and installed public peer-session archive
> exporting `/native.openDisposableNativeDevice`, `/worker` owner/session creation,
> and `/browser.connectApplicationOwner`, including Worker signals and network
> content support. A stale installed archive (including diag2) is not sufficient.
> Packaging and the isolated browser run must be scheduled separately; this source
> port alone is not a browser qualification.

The optional [runner](run-public-sensing.mjs) requires a deliberately selected
Tendriller checkout whose dependencies and public runtime build already exist.
It does not download, install, publish or modify that checkout, and does not copy
dirty release archives into this collection.

```sh
node cookbooks/capture-reviewed-evidence/checks/run-public-sensing.mjs \
  /absolute/path/to/tendriller \
  cookbooks/capture-reviewed-evidence/checks/public-report.json
```

It resolves the public `@tendriller/runtime/kernel` export from
`dist/runtime/package.json` and the installed `@chronolog/peer-session` import
export. It uses no imports from Tendriller or Chronolog implementation modules.
Playwright and esbuild come from the explicitly selected checkout.

The runner starts a private loopback test page, an actual owning DedicatedWorker
and a disposable Node peer. The Worker opens its browser device, creates the
application session and owner, and attaches the page facade over a MessagePort.
Only the Worker holds the browser's private signer and durable device store. The
Node authority signer and epoch key are generated afresh for this synthetic test;
they are not authored assets. The test-only two-lane bridge carries encrypted
Node ↔ page ↔ Worker frames; it is not another production transport or lifecycle.
Both peers use the same declared test definition and signed membership, with
explicit `finalityPolicy: { kind: 'none' }`. An injected browser
geolocation fix travels through the cookbook controller/publisher and signed
session signals. Stop sensors invalidates that controller. A native request
renders the actual card without acquiring media. Playwright's trusted click
starts Chromium's synthetic microphone, and Finish produces a local candidate.
A separate Send click transfers encrypted content, correlates the response, and
runs a declared retention command. The native peer checks the exact plaintext
content digest and the accepted retained record. A separate deterministic 70,000-byte
transport fixture crosses the 64 KiB chunk boundary and checks the exact digest;
it does not replace or pad the actual reviewed microphone candidate. No physical
microphone is used. Local stored intent, revisable materialization and named peer
retention are checked independently; finality remains disabled. The test closes
the Worker owner, page facade, Node session, browser and loopback server on exit;
none is a long-running sync service.

[public-report.json](public-report.json) records a historical execution's runtime ID, kernel
digest, installed session version/digest and snippet hashes. This records a local
development pairing. It is not a claim that the runtime is deployed, that an
uncommitted revision is a release, or that all authored pages behave alike.

[public-development-report.json](public-development-report.json) separately
records the same actual browser/native flow against the final sensing-development
Chronolog archive, including its SHA-256 and dirty provenance. The pinned public
package pairing above remains intact. Both reports name their actual runtime and
snippet bytes; neither establishes production deployment or physical hardware
qualification.

## Retention callback and cleanup

A page may opt into the card's retention checkbox by passing
`retainEvidence(response)`. Implement it using the app's actual declared command:

```js
async function retainEvidence(response) {
  const operation = await session.command('retainEvidence', response, {
    operationId: response.operationId,
  });
  const result = await operation.materialized({ signal: AbortSignal.timeout(15000) });
  if (result.outcome !== 'accepted') {
    throw Error('Inspect the original operation; retention was not confirmed.');
  }
}
```

Adapt the command schema and guard to the frozen original task/question revision.
A rejected or uncertain attempt keeps its operation identity. Reading the content
reference separately establishes available bytes; a provisional accepted outcome
alone does not imply another device retained a permanent copy, and an earlier
arriving operation can still revise it.

Unsent draft bytes stay in memory. The current session's upload `discard()` and
local `content.discard(reference)` enable explicit transient cleanup; this code
targets that current API, not older artifacts. After dispatch, do not discard
until the receiver confirms it read the bytes. Local discard does not retract
copies held by other peers.

## Qualification limits

Headless synthetic audio and injected geolocation test actual Web APIs and
public session execution. Screen choosers, iOS motion permission UI, Bluetooth,
Serial hardware, accuracy under movement, background policies and practical
usability still need deliberate testing on each supported device. The loopback
bridge is a test transport; network topology, relay fallback, host deployment and
production credentials are outside this gate.
