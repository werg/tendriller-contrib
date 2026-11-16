# Measure application work before assigning a price

This is the executable measurement and calculation path for
[issue #15](https://github.com/werg/tendriller-contrib/issues/15). The native
measurement runs the actual portable administrator, signed HTTP membership
handler, separate authority identity, durable stores and SQL materializer. The
cost calculator consumes usage and prices as separate files. Provider usage that
has not been measured remains unknown; it cannot silently become a zero charge
or a savings claim.

## Run the native measurement

In an exact Chronolog checkout with its pinned dependencies and native engine:

```sh
node --import tsx tools/membership-cost.ts --output /new/membership-cost-evidence
```

The output directory must be new. The runner checkpoints `report.json` after
each phase and writes a failed result on error. It records source head, dirty
paths, measurement/fixture source hashes, Node/OS/architecture, commands and
timestamps. It requires native loopback HTTP and SQLite/DoltLite, but neither a
browser nor a Cloudflare account. Preserve its raw report; the adjacent private
stores contain private identities and must remain protected local state.

Its twelve phases include bootstrap observation, schema priming, four small
candidates, four 192-KiB candidates, eight small candidates, an empty warm sync,
lost approval reply, administrator reopen/exact retry, conflicting decision
refusal, writer and reader revocation/rotation, and future-epoch application
data. The body-size and candidate-count dimensions vary independently.

Each phase records:

- Actual signed HTTP request/response bodies, descriptor transfers, inline
  controls and unexpected endpoint calls. Inline envelope bytes are **already
  inside** inline-control descriptor bytes; do not add them twice.
- Administrator durable put calls, written value bytes, retained value bytes,
  and structural storage categories. Values and private keys are not exported.
- Native file sizes, including live WAL/SHM, followed by separately measured
  closed sizes and logical payload/feed/journal/authority categories.
- Process CPU time and sampled peak RSS. The administrator and native authority
  share this measurement process, so these are combined local resource costs.

A logical `put` is not a provider-billed SQL row, and a file size is not a
time-integrated GB-month. The fixture does not use a tunnel, relay, blob provider,
browser or deployed Durable Object; their costs stay unmeasured.

Create a concise derived report from contrib without changing the raw input:

```sh
node cookbooks/run-a-peer-application/checks/cost-report.mjs \
  --native-report /new/membership-cost-evidence/report.json \
  --output /new/membership-cost-summary.json
```

The summary hashes the exact raw report, preserves per-phase traffic/storage and
sets `providerCosts` and `hostedPeerSavings` to `null`.

## Prepare comparable deployment samples

Generate a complete usage worksheet:

```sh
node cookbooks/run-a-peer-application/checks/cost-report.mjs \
  --template --output /new/application-cost-usage.json
```

It contains hosted, peer-direct and peer-relayed cases. Fill only observations
backed by the cited raw evidence. `unmeasured` requires a reason. `not-used`
requires both topology evidence and a reason; an unavailable meter is
`unmeasured`, never `not-used`. Unsupported routes remain unmeasured cases.

Pin the actual deployed public artifacts and bootstrap, native runtime,
browser/device versions, network path, measurement window and workload trace
SHA-256. Use the same trace, counts, payload distribution, user/device counts,
idle periods, retention interval and fault schedule in each case. Replay final
events and compare the accepted/rejected business outcomes; a similar screenshot
does not establish equivalent work.

| Workload | Preserve with the usage sample |
| --- | --- |
| Shared edits and contested claim | Original operations, one winner/loser, final rows/events and exact retries |
| Chat and transient progress | Durable message bytes and separate expiring signal counts/bytes |
| Final agent intent and crash recovery | Dispatch journal, provider idempotency/reconciliation result and any unknown outcome |
| Fresh device and reconnect | Enrollment stages, history transferred, replay duration, browser memory, no duplicate commands |
| Capture/blob | Original bytes, metadata receipt, successful authorized reads, actual copy count and independent backup lag |
| Membership lifecycle | Size/count workloads, approval response loss, restart, revocation and future-key delivery |

### Measure the hosted baseline's actual idle behavior

The reviewed hosted implementation already accepts page and agent WebSockets
through the hibernation API and configures automatic ping responses. See pinned
[page sockets](https://github.com/werg/tendriller/blob/283f210c1fb9dc2c1d27e9bbd9e8813234a40a70/server/src/page.ts),
[agent sockets](https://github.com/werg/tendriller/blob/283f210c1fb9dc2c1d27e9bbd9e8813234a40a70/server/src/agent.ts)
and [automatic responses](https://github.com/werg/tendriller/blob/283f210c1fb9dc2c1d27e9bbd9e8813234a40a70/server/src/tendril.ts).
Do not estimate its cost as an always-active server merely because sockets are
connected. Run a quiet connected interval, a realistic active interval and a
reconnect interval. Preserve alarms, other pending work and outbound connections
that can affect eligibility.

Cloudflare's [duration rules](https://developers.cloudflare.com/durable-objects/platform/pricing/)
distinguish activity and hibernation eligibility. Its
[metrics documentation](https://developers.cloudflare.com/durable-objects/observability/metrics-and-analytics/)
describes namespace/object filtering, WebSocket accounting and GraphQL datasets.
Use the deployed account's raw metrics for the exact interval and preserve the
query, filters, units, sample resolution and missing-data flags. Export Workers,
Durable Object, D1 and storage-provider meters separately. Close the test sockets
and wait for delayed analytics before finalizing their totals. A workerd clock,
request elapsed time or sampled process CPU is not a billed duration export.

### Keep providers and physical copies visible

Account for every hop from browser to native agent, including a public tunnel,
Cloudflare relay, TURN server or hosting proxy. Record encoded payload bytes and
provider-metered egress separately. A direct application session through a
provider tunnel still uses that provider. Take direct/relayed topology and
unsupported-network evidence from
[issue #14](https://github.com/werg/tendriller-contrib/issues/14).

Measure native CPU, disk, network and browser memory/replay over the same window.
Record the sampling method and distinguish a process peak from a per-role peak.
Record stored data at several timestamps so retained-byte usage has a time
integral; keep the original samples and the integration rule. Record history
growth and the newest independently recoverable backup position/time. A backup
that was never created has unknown or absent durability, not zero lag.

For blobs, record the upload/retention receipt, content hash/length, authorized
read from every claimed copy and an independent restore test. The metadata event
and the object are separate retention obligations. A copied descriptor or an
accepted metadata transaction is not a receipt for a second blob copy. The
[blob metadata recipe](https://github.com/werg/chronolog-db/blob/c5edba7df30f2325f5f51de9b9ff04591be8c989/examples/blob-metadata.ts)
keeps that distinction in the application protocol.

## Apply dated prices only to measured quantities

The frozen [2026-11-16 pricebook](evidence/2026-11-16-cloudflare-pricebook.json)
records public Workers Paid and SQLite Durable Objects rates and their official
sources. Recheck rates, plan and contract for the measurement date. Add separate
prices for the actual D1, relay/tunnel, blob, native hosting/disk/backup and
observability services; the checked-in pricebook deliberately does not invent
those deployments. Include any allocated fixed subscription expense explicitly.

For a measured cost boundary, add charges like this shape, replacing `null` only
after collecting the corresponding provider quantities:

```json
{
  "status": "measured",
  "evidence": "account-usage.json#membership-object",
  "charges": [{
    "meter": "cloudflare-durable-requests",
    "unit": "billing-request",
    "quantity": null,
    "priorAccountUsage": null,
    "evidence": "account-usage.json#requests"
  }]
}
```

`priorAccountUsage` is that month's usage from other work before the measured
workload, in the same account meter. It is required because included allocations
and billing increments are shared. Aggregate each account meter once across all
phases; the calculator refuses duplicate meter names. Compare hosted and peer
cases at the same account baseline. A new free allocation per request or per
phase would overstate savings.

For each meter the calculator computes `charge(prior + quantity) - charge(prior)`.
`charge` subtracts the included allocation, applies the pricebook's billing
increment if specified, then multiplies by the rate/unit size. Units must match
exactly. The billing-request input must already use the provider's definition;
raw WebSocket frames, native membership requests, logical writes and byte
snapshots are not silently converted into provider meters.

```sh
node cookbooks/run-a-peer-application/checks/cost-report.mjs \
  --usage /new/application-cost-usage.json \
  --prices cookbooks/run-a-peer-application/notes/evidence/2026-11-16-cloudflare-pricebook.json \
  --output /new/application-cost-report.json
```

The output hashes both inputs, retains each charge's evidence and price source,
and lists missing measurements. Any missing boundary, price, quantity or account
allocation keeps `total` unknown. `knownSubtotal` is explicitly partial. A
hosted/peer difference additionally requires declared deployed evidence for all
workloads and operational measurements, a pinned workload fingerprint and the
hosted hibernation observation. This is a reproducible incremental cost model,
not an automatic verification of operator-supplied evidence or a monthly invoice.

## What still requires a different setting

Completing issue #15 needs an actual deployed hosted/peer pair, Cloudflare account
analytics and its monthly baseline, native host/provider usage, real browser
devices, qualified Internet routes and real blob/backup services. None is
substituted by the native runner or calculator. The local evidence can establish
payload exclusion, metadata write/retention behavior and named resource samples;
it cannot establish production prices paid, hibernation duration, NAT behavior,
backup availability or the application's complete hosting savings.
