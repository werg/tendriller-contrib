# Measure application work before assigning a price

The current application has one Chronolog session and one command, query, event
and journal model. Native and browser deployments select storage, SQL engines
and transports as explicit capabilities. Tendriller participates through the
filtered control/publication transport. A hosted native process can run the same
session; hosting location does not introduce a second application data API.

The [independent qualification record](peer-generation-qualification.md) preserves
actual native RTC, native SQL and packaged Tendriller observations, including the
exact public artifacts, complete host counters and authenticated peer-frame
bytes. The cost calculator consumes measured usage and dated prices as separate
files. Missing usage remains unknown; a passing local scenario is not a provider
bill or a savings result.

The [2026-11-16 before/after evidence](membership-cost-review-2026-11-16.md) and
[earlier compact-proof evidence](compact-membership-resident-qualification-2026-11-17.md)
are historical measurements of their named sources. Their author-time finality
and membership implementations are retired. Preserve their raw facts when
comparing a historical baseline; do not build or retain those implementations as
another supported runtime or feed their reports into a compatibility parser.

## Measure the common session and selective host

Run the packed consumers described in the
[application cookbook](../COOKBOOK.md). Preserve each raw report and its checked
summary. The native and SQL consumers install the supplied archive into a fresh
directory; the hosted consumer additionally installs exact Tendriller SDK and
engine artifacts and exercises a real local Worker. These gates do not require
production credentials and do not measure account charges.

Record three separate windows: cold enrollment and peer introduction, warm
application work with fixed membership, and an explicit control or publication
update. Warm work must increase authenticated peer bytes and actual application
outcomes while every host request and body-byte counter remains unchanged.
Block the host and repeat that work. The host transport must filter ordinary
database, content and live-signal messages before HTTP, and raw attempts to send
them must fail at host ingress. A zero application-write counter alone does not
exclude unrelated polling or an application payload hidden in another route.

Count signed membership/control envelopes, code publications and page asset
reads separately from ordinary peer replication. Publication asset bytes are
expected at the host because serving signed page code is its declared role.
Control changes include grants, key wraps and selected recovery prefixes; their
cost depends on governance history and participant decisions. There is no
per-command host acknowledgement or constant-cost claim for all control changes.

Local reports contain public evidence, not private stores. Keep signing keys,
epoch keys, login credentials and durable device databases outside published
reports. A logical store write is not a provider-billed SQL row, a file size is
not a time-integrated GB-month, and an observed process peak is not a per-role
resource bill.

## Prepare comparable deployment samples

Generate a complete usage worksheet:

```sh
node cookbooks/run-a-peer-application/checks/cost-report.mjs \
  --template --output /new/application-cost-usage.json
```

It contains a hosted baseline, peer-direct and peer-relayed comparison cases.
These are measurement labels, not runtime profiles. Name whether the baseline
runs the same session on a hosted peer or is a preserved historical measurement;
a historical source cannot qualify the current implementation. Fill only observations
backed by the cited raw evidence. `unmeasured` requires a reason. `not-used`
requires both topology evidence and a reason; an unavailable meter is
`unmeasured`, never `not-used`. Unsupported routes remain unmeasured cases.

Pin the actual deployed public artifacts and bootstrap, native runtime,
browser/device versions, network path, measurement window and workload trace
SHA-256. Use the same trace, counts, payload distribution, user/device counts,
idle periods, retention interval and fault schedule in each case. Replay selected
events and compare the accepted/rejected business outcomes; a similar screenshot
does not establish equivalent work.

| Workload | Preserve with the usage sample |
| --- | --- |
| Shared edits and contested claim | Original operations, one winner/loser, final rows/events and exact retries |
| Chat and transient progress | Durable message bytes and separate expiring signal counts/bytes |
| Protected external action and crash recovery | Dispatch journal, provider idempotency/reconciliation result and any unknown outcome |
| Fresh device and reconnect | Enrollment stages, history transferred, replay duration, browser memory, no duplicate commands |
| Capture/blob | Original bytes, metadata receipt, successful authorized reads, actual copy count and independent backup lag |
| Membership lifecycle | Size/count workloads, approval response loss, restart, revocation and future-key delivery |

### Measure the deployed baseline's actual idle behavior

Run a quiet interval, a realistic active interval and a reconnect interval for
the exact deployed topology. Preserve alarms, pending work and outbound
connections that affect idle behavior. A hosted peer process and the Tendriller
control participant are separate resource consumers. Measure each one instead
of estimating that every connected application keeps a Durable Object active.

If a comparison uses an older hosted baseline, retain its source and original
socket/hibernation measurements with that baseline. They describe that historical
implementation, not an application socket service available in the current host.

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
The current native RTC gates report logical authenticated peer frame
payload bytes, excluding RTC packet headers and credit messages as well as
IP/UDP/DTLS/SCTP overhead. The packaged-host application gate counts SDP JSON
envelopes separately. Preserve those exact boundaries when comparing results;
they are not total network bytes or a provider egress meter.
Record stored data at several timestamps so retained-byte usage has a time
integral; keep the original samples and the integration rule. Record history
growth and the newest independently recoverable backup position/time. A backup
that was never created has unknown or absent durability, not zero lag.

For content, record the storage/retention receipt, content hash/length, authorized
read from every claimed copy and an independent restore test. The metadata event
and the object are separate retention obligations. A copied descriptor or an
accepted metadata transaction is not a receipt for a second blob copy. Use the session content facet for the bytes and a guarded domain command for
their application reference. A signed publication is the separate mechanism for
the complete page-code graph.

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
substituted by a local package gate or the calculator. The local evidence can establish
payload exclusion, metadata write/retention behavior and named resource samples;
it cannot establish production prices paid, hibernation duration, NAT behavior,
backup availability or the application's complete hosting savings.
