# Proposal review qualification boundary

The [historical actual-host evidence](../../collect-private-responses/checks/README.md)
records the retired workflow reference's exact-version and owner checks,
response/execution expiry, approved content and stable downstream execution key.
It remains evidence of those exact artifacts only.

A current application declares proposal commands and coherent queries through
the [common owned session](../../run-a-peer-application/COOKBOOK.md). Ordinary
`materialized()` success is revisable and does not authorize an irreversible effect.
Such an action needs an explicit protected checkpoint or independently durable
action service, with its own authority, idempotency and reconciliation tests.
The common session gates do not claim this stronger capability.
