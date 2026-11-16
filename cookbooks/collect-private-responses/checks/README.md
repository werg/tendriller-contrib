# Verify the trusted references

These checks install the built public `@tendriller/core` and `@tendriller/engine`
archives in a temporary directory. They deliberately select the two reviewed
reference modules in a fresh Worker entry. They do not import a core checkout,
use a private runtime bus, or treat a preview fixture as an authorization test.

Build the target core artifacts, then run:

```sh
node cookbooks/collect-private-responses/checks/run-host.mjs --artifacts /path/to/core/dist
```

The runner installs its pinned test harness, creates fresh account and page
storage, and exercises the real Worker, authenticated role checks, operation
host, transactions and receipts. The public engine test fixture creates
synthetic signed-in identities; it does not exercise an OAuth provider. The
runner prints SHA-256 digests of both installed archives and both selected
references so evidence refers to exact bytes.

## Established behavior

- A participant can read and submit only their own assigned response. Another
  participant and a shared display cannot read private records.
- Summaries are deliberately published by the owner. Raw answers and account
  identifiers do not appear in shared state or broadcast events.
- Retries preserve command identity; stale revisions and generations reject
  new work. Archive creation, active-record removal and generation rotation
  occur in one transaction.
- Approval identifies an exact proposal version. Approved content cannot be
  edited. Owner response and first execution claim must precede expiry.
- An execution claim has one stable deduplication key. Its holder can record
  completion after expiry; the external effect must independently honor that
  key. This reference does not promise exactly-once external execution.

The first recorded run passed all three end-to-end scenarios on 16 November
2026. `evidence.json` records the exact observed artifacts and reference bytes.
Rerun the checks after adapting either reference. Evidence about these text-only
records does not establish private-media access or archive retention.
