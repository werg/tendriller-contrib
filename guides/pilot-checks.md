# Pilot verification

The pilot guides separate shared semantic guarantees from layout choices. Executable
specimens are evidence for adaptation and failure behavior, not stable page packages.

| Pilot | Distinct adaptations | Required shared behavior |
| --- | --- | --- |
| Measurements | Dense desktop table/panels and a nested mobile instrument | Source/run identity, exact missing values, bounded models, coherent checkpoint and gap state. |
| Reviewed capture | Compact inline file form and fullscreen canvas with separate review | Reviewed immutable snapshot, discard, original command meaning, new draft preservation, delayed rejection. |
| Private responses | Facilitator console, minimal participant form, and shared projection | Actual private reads, revision conflicts, intentional aggregate publication, authoritative reset. |

## Run local checks

`npm run check` validates reading metadata/links, generated discovery, complete source
accounting, and deterministic snippets. It does not launch a service or install core.

`npm run test:pilots -- --tools /path/to/core/dist/tools --playwright /path/to/playwright/index.mjs` consumes explicitly supplied built public core tools/runtime and browser automation artifacts. Add `--browser /path/to/chromium` to select an installed browser. The runner rejects missing inputs. It does not import sibling private source, complete missing page
assets, or install the retired component graph. The exact tested artifact hashes and
results are recorded when the checks run.

## Evidence boundaries

A fixture can exercise denied/unavailable service branches, delay, and interaction
continuity. It cannot prove private storage or transaction enforcement. Trusted reference
checks must use the public engine host with fresh identities and records; those checks
belong to the deliberately selected reference and core's actual-host suite.

The private-response reference is text-only. Private media requires separately reviewed
storage and authorization; no browser screenshot establishes that guarantee. Live hardware,
real microphone accuracy, and production deployment are separate observations and are not
claimed by deterministic or fixture checks.

## Current local evidence

The deterministic/editorial suite passes ten cases. The actual-host reference suite passed three scenarios against the exact hashes in its [record](../cookbooks/collect-private-responses/checks/evidence.json). Local browser launch is blocked before assertions: the workspace Chromium cannot create its required Unix socket (`EPERM`). No fixture/browser pass is claimed from that attempt. The separate GitHub integration workflow builds the exact declared public core ref and runs the browser and actual-host checks; its uploaded report records the observed runtime and browser identity.
