# Tendriller contrib

Optional first-party tools, browser components, trusted workflows and complete example pages for [Tendriller core](https://github.com/werg/tendriller).

This is the **contract 2** pre-release redesign. It supports one recorded core/contrib pairing. No old URL, payload, queue or package format is translated.

## Install a release

Download the immutable tool archive and `manifest.json` from the same [release](https://github.com/werg/tendriller-contrib/releases). Verify the archive's SHA-256 against that manifest, then unpack it. The archive contains bundled Node executables and the exact runtime, components and recipe resources they use; no npm install or core checkout is required.

```sh
curl -fL https://github.com/werg/tendriller-contrib/releases/download/v0.2.0-rc.3/manifest.json -o manifest.json
curl -fL https://github.com/werg/tendriller-contrib/releases/download/v0.2.0-rc.3/tendriller-tools-0.2.0-rc.3.tgz -o tools.tgz
# Verify tools.tgz against the manifest before extracting.
mkdir tendriller-tools
tar -xzf tools.tgz -C tendriller-tools
node tendriller-tools/tools/cli/bin/tendril.mjs --help
```

The same release includes standalone `tendril.mjs` (lightweight CLI with vendoring; no full tools archive), `tendril-stream.mjs`, `tendril-preview.mjs`, watch/wait/event commands, and host bridges. Discovery may follow a latest-release link; saved dependencies always use an exact release URL and hash.

For device notifications while the published page is closed, use `tendril notifications` to inspect opted-in owner devices and quota, then `tendril notify "Decision needed" "Please review"`. Deploy core `0.2.0-rc.5` or newer first; its `GET A/notify` endpoint is required. The owner must enable notifications in the built-in page control; see the [core Web Push runbook](https://github.com/werg/tendriller/blob/master/docs/PUSH_NOTIFICATIONS.md). These CLI commands use the authenticated agent API and do not need a live page tab.

## Create a page

```sh
node tendriller-tools/tools/cli/bin/tendril.mjs scaffold field-notebook ./notebook
node tendriller-tools/tools/preview/bin/tendril-preview.mjs ./notebook --fixture ./notebook/scenario.json
```

Scaffolding writes `tendril.json`, copies the complete declared component dependency graph into `assets/`, and records exact hashes in `tendril.assets.json`. Hand-built pages can run `tendril assets sync <dir>`; `tendril push <dir>` performs the same safe sync before publication. Lazy siblings resolve relative to the selected component script, so changing a service deployment cannot replace a page's component implementation.

A workflow recipe declares its required module interface. On the service, an authenticated controller explicitly activates its scope before publishing initial protected state:

```sh
tendril workflow sessions activate '{"scope":"notebook"}'
tendril scopes list
# Supply the returned authoritative generation when making a protected write.
tendril state set notebook.title '"Field notes"' --scope sessions:notebook --generations '{"sessions:notebook":"<generation>"}'
tendril push ./notebook
```

The server's publication manifest locks actual file hashes and runtime URLs. The page asset lock complements it by identifying the selected contrib release and source artifacts.

## Ownership

| Directory | Owns |
| --- | --- |
| `tools/cli/` | General CLI, page packing, scaffolding, service checks and resource resolution |
| `tools/collector/` | Source adapters, transforms, spool management and machine producers |
| `tools/bridges/` | Host-specific wake delivery, event acknowledgement, watch and wait commands |
| `tools/preview/` | Fixture transport adapter using the released production browser runtime |
| `components/` | Optional browser components and explicit dependency graph |
| `workflows/` | Session workflow schemas, clients, browser UI and trusted Worker implementation |
| `recipes/`, `examples/` | Application models, layouts, scenarios and setup |
| `distribution/` | Artifact builds, integrity manifests, catalog and installed-artifact tests |

The trusted workflow artifact contains only a Worker-compatible module. CLI, preview, `ws`, MCP host bridges, and components never become dependencies of the deployed core engine.

## Contract and generations

The public service descriptor is `GET /api/service`. Tools check contract and required workflow interface/schema revisions before provisioning or writing. A new collector or chart release can use an existing workflow interface without requiring a service deployment.

Application event data is opaque. A field named `session`, an event type that resembles a recipe, or a state key named `experiment` cannot activate a workflow. Protected commands carry `cid`, explicit `scope` where needed, and `expected_generations` outside `data`. Browser adapters capture these through `tendril.scopes.capture()`; durable commands retain their original capture when reconnected.

The `sessions` workflow is explicitly invoked at `POST /workflows/sessions/<operation>`. Its browser adapter lives in the page's declared assets. Its module activation, private responses, assignment permissions, archive/reset and generation rotation are enforced by the server, not by fixture preview.

## Preview

Preview embeds the exact released core runtime and imports the public `@tendriller/runtime/preview-support` primitives. Sensor fixture events use the supported `fixture_event` transport boundary, enabled only by preview configuration. Unsupported service operations return `preview_unsupported`. Preview does not substitute for real service authorization or transaction tests.

The standalone preview starts without downloading executable code. Screenshot and headless scenario automation require Playwright to be installed locally. Optional neural engines are not downloaded automatically. Experimental `pose`, `objects` and `text` adapters require explicitly declared engine/model assets and are excluded from the supported default component catalog.

## Develop and verify

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:components
npm run test:preview
npm run test:portable
```

`core.lock.json` records the exact public SDK/runtime archives, release URLs and SHA-256 hashes. Copies in `vendor/core/` make initial development and builds independent of a sibling core checkout. `npm run core:install` refreshes only the locked artifacts after verifying their hashes. Updating the supported pairing requires updating both this lock and the ordinary npm lockfile.

`npm run build` produces the tool archive, standalone commands, static component/example/catalog bundle, separate trusted workflow archive, and a manifest. Installed-artifact tests unpack into a fresh directory, scaffold every starter, verify dependency hashes, start the standalone preview, and compare its runtime bytes with the released core manifest.

Create `release/v<package-version>` at the exact source commit to publish a release candidate. Branch creation and subsequent pushes run the full Node/browser gate before CI creates the matching version tag and GitHub pre-release at that tested commit. The release job downloads the public SDK/runtime URLs in `core.lock.json` and verifies their hashes before building, so the pinned core release must already be published. Existing version tags and published releases use the same gate. Manual dispatch publishes only when selected on a matching release branch or version tag.

The publisher requires the ref, package version, manifest version and exact source commit to agree. Existing tags must resolve to that commit, including annotated tags. Publication is serialized and idempotent: it verifies all existing asset bytes, uploads only missing files and publishes the manifest last. A mismatched tag or asset stops publication; use a new version instead of moving a tag or replacing published bytes.

See [source provenance](PROVENANCE.md), [CLI commands](tools/cli/README.md), [collector documentation](docs/COLLECTOR.md), and [host integrations](docs/AGENT_HOSTS.md).

## Authenticated service tests

`npm run test:e2e` targets an explicitly started core deployment with the pinned
`sessions` artifact and test identity fixtures. Set `TENDRILLER_E2E_SERVICE`,
`TENDRILLER_E2E_OWNER`, `TENDRILLER_E2E_OWNER_TOKEN` and
`TENDRILLER_E2E_OTHER_TOKEN` for the fixture host. The defaults match the documented
local test deployment. The suite publishes complete contrib assets through the
public API, activates scopes explicitly, and exercises approvals, participant
privacy and retained drafts against real authorization. It does not import or
start another repository's source. Core's artifact composition tests separately
exercise the same trusted module archive through its transaction host.
