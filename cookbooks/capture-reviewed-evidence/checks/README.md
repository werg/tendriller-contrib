# Sensing specimen checks

## Deterministic gate

From the collection root:

```sh
npm run build
npm run check
```

The five sensor cookbook test files exercise the copied page modules directly.
The import check also imports every sensor snippet without browser globals,
establishing that import alone acquires no resource. Fixtures control chooser
grants, clocks, visibility, track endings, packet chunks and content writes.

Covered cases include filtered capability gating and bounded diagnostic sharing;
one-shot/watch location freshness, accuracy, hysteresis and producer coalescing;
iOS motion permission timing and refractory detection; Serial/Bluetooth framing,
late connection shutdown and reader locks; trusted screen/audio capture, time and
byte caps, no auto-capture from an agent request, local review, exact 64 KiB
staging, discarded work, uncertain sends and explicit retention.

## Public runtime and session gate

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

The runner starts a private loopback test page and an actual Node peer. Both use
the same declared test definition and signed membership. An injected browser
geolocation fix travels through the cookbook controller/publisher and signed
session signals. Stop sensors invalidates that controller. A native request
renders the actual card without acquiring media. Playwright's trusted click
starts Chromium's synthetic microphone, and Finish produces a local candidate.
A separate Send click transfers encrypted content, correlates the response, and
runs a declared retention command. The native peer checks the exact plaintext
content digest and the applied retained record. No physical microphone is used.

[public-report.json](public-report.json) records the executed runtime ID, kernel
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
  const result = await operation.applied({ signal: AbortSignal.timeout(15000) });
  if (result.status !== 'applied' || result.outcome !== 'accepted') {
    throw Error('Inspect the original operation; retention was not confirmed.');
  }
}
```

Adapt the command schema and guard to the frozen original task/question revision.
A rejected or uncertain attempt keeps its operation identity. Reading the content
reference separately establishes available bytes; applied acceptance alone does
not imply another device retained a permanent copy.

Unsent draft bytes stay in memory. The current session's optional upload
`discard()` and local `content.prune()` enable transient cleanup; older public
artifacts may lack them. After dispatch, do not prune until the receiver confirms
it read the bytes. Local pruning does not retract copies held by other peers.

## Qualification limits

Headless synthetic audio and injected geolocation test actual Web APIs and
public session execution. Screen choosers, iOS motion permission UI, Bluetooth,
Serial hardware, accuracy under movement, background policies and practical
usability still need deliberate testing on each supported device. The loopback
bridge is a test transport; network topology, relay fallback, host deployment and
production credentials are outside this gate.
