---
id: "encrypt-rows-and-scale-group-keys"
title: "Compartmentalize secrets with Private Vaults, SQL RLS crypto, TreeKEM, and anonymous envelopes"
summary: "Encrypt individual SQL rows or deal rooms inside a shared log with chronolog/vaults and chronolog/rls, harden metadata with hybrid PQ X-Wing and padded anonymous envelopes, and scale large group rotations to O(log N) with Key-Tagged TreeKEM."
group: "Access and identity"
tags: ["encryption", "vaults", "rls", "treekem", "post-quantum", "privacy", "compartments"]
choices: ["Whole-log E2EE vs $keys.topicRings compartments vs row-level Private Vaults / sealFor()", "Flat HPKE epochs vs O(log N) Key-Tagged TreeKEM (distribution: 'tree')", "Standard envelopes vs hybrid PQ X-Wing + padded anonymous envelopes (hideEnvelopeAuthor)"]
capabilities: []
evidence: "explained"
related: ["choose-page-governance", "manage-sensitive-data", "collect-private-responses", "setup-social-recovery"]
sources: ["https://github.com/werg/chronolog/blob/a320a63969c6006cb6adb331f07e8dd70903a82e/docs/SUBLINEAR_GROUP_ROTATION.md", "https://github.com/werg/chronolog/blob/a320a63969c6006cb6adb331f07e8dd70903a82e/docs/CRDT_CONTRACT.md"]
---

# Compartmentalize secrets with Private Vaults, SQL RLS crypto, TreeKEM, and anonymous envelopes

Whole-log end-to-end encryption (`privateLog: true`) keeps blind hosts out of your data, but real workspaces often need finer boundaries inside one shared page—like confidential deal rooms, HR notes, facilitator-only survey answers, metadata-hardened anonymous posting, or large teams that outgrow $O(N)$ key rotations.

## 1. Pick the right cryptographic privacy tier

| Need | Primitive | Who can read | Blind host sees |
| --- | --- | --- | --- |
| Complete audience & metadata isolation | Separate `privateLog: true` pages | Only that log's `$admission` readers | Separate blind control planes |
| Topic-level sub-group (e.g. `admin_notes`) | `$keys.topicRings` (`session.createCompartment`) | Only members of that ring (enforced fail-closed by `TopicKernel`) | Ring name & epoch metadata in `$keys` |
| Dynamic per-project / per-row sharing (e.g. `deal:acme`) | **Private Capability Vaults (`chronolog/vaults` + `session.vaults`)** | Only members of that vault; $O(1)$ adds, per-vault forward-secret removals | **Nothing** — vaults live inside the encrypted partition! |
| Ad-hoc 1:1 or small-group field encryption | `session.sealFor(recipients, payload)` / `session.unseal()` | Only the listed recipient public keys | **Nothing** — sealed inside an ordinary encrypted op |

## 2. Encrypt SQL rows with Private Capability Vaults + write-time `chronolog/rls`

Bind a private `vaults: { module: 'chronolog/vaults' }` topic alongside your `chronolog/sql` (or custom `chronolog:sqlite`) topic. Because `vaults` is a non-`$` topic, blind hosts never learn vault IDs, project topology, or vault ACLs.

Enforce encryption at write time using `vaultBoxPolicy` or `sealRecipientsPolicy` from `chronolog/rls` so reducers reject plaintext or mis-addressed writes before they ever commit:

```js
// Inside your SQLite reducer setup:
import { applyRls, vaultBoxPolicy, sealRecipientsPolicy } from 'chronolog/rls';

applyRls(db, {
  deal_docs: {
    insert: vaultBoxPolicy('payload', 'vault_id', 'vaults'),
    update: vaultBoxPolicy('payload', 'vault_id', 'vaults'),
  },
  direct_notes: {
    insert: sealRecipientsPolicy('secret_box', "SELECT public_key FROM allowed_viewers WHERE note_id = NEW.id"),
  },
});
```

On admitted peers, create vaults, seal rows, hydrate queries with `unsealRows()`, add members in $O(1)$, and revoke members with per-vault forward secrecy:

```js
// 1. Create a private vault for [me, alice] (Bob & blind host cannot decrypt or write to it)
await (await session.vaults.create('deal:acme', { members: [alicePk] })).materialized();

// 2. Seal row payload and write it to SQL (enforced by vaultBoxPolicy!)
const box = await session.vaults.seal('deal:acme', { price: '$2M', terms: 'Net 30' });
await (await session.command('putDealDoc', { id: 'd1', vaultId: 'deal:acme', payload: JSON.stringify(box) })).materialized();

// 3. Query & hydrate authorized cells transparently (unauthorized vaults become null; plain text is untouched)
const res = await session.query('db', { sql: 'SELECT id, vault_id, payload FROM deal_docs', format: 'objects' });
const hydrated = await session.vaults.unsealRows(res.value);

// 4. O(1) add Bob -> Bob immediately unseals historical vault docs
await (await session.vaults.addMember('deal:acme', bobPk)).materialized();

// 5. Remove Bob -> rotates vault to epoch 1 -> Bob cannot unseal future epoch-1 docs
await session.vaults.removeMember('deal:acme', bobPk);
```

## 3. Harden against quantum harvest-now and host metadata leaks (`$keys.policy`)

Configure `$keys.policy` at genesis (`keysPolicy`) or live via `session.setKeysPolicy(...)`:

```js
await (await session.setKeysPolicy({
  minSuite: 'hpke-xwing-aes256gcm',   // Require hybrid post-quantum X-Wing (ML-KEM-768 + X25519)
  hideEnvelopeAuthor: true,           // Zero outer envelope.author (ANONYMOUS_AUTHOR) + verify via mailboxTag
  paddingBucketBytes: 512,            // Power-of-2 bucket padding hides payload length from relays & blind hosts
  distribution: 'tree',               // O(log N) Key-Tagged TreeKEM rotations over structural-sharing CAS DAG
  rotateOnRemove: true,               // Automatically rotate epoch key on removeMember()
  maxOpsPerEpoch: 10000,              // Flag keysNeedsRotation() after 10k encrypted ops in one epoch
})).materialized();
```

- **Hybrid post-quantum X-Wing:** Every device holds persistent Ed25519 + X25519 + X-Wing (`pqWrapKey`) keys and can self-rotate via `session.rotateWrapKey(...)`. `minSuite: 'hpke-xwing-aes256gcm'` is enforced consistently across `$keys`, compartments, and `chronolog/vaults`.
- **Anonymous padded envelopes:** Every encrypted envelope derives a unique 192-bit HKDF per-operation AES-256-GCM subkey (`hkdf-aes-256-gcm`). When `hideEnvelopeAuthor: true`, Tendriller's blind mailbox authenticates uploads using `mailboxTag` against `$keys` `mailboxVerifyKeys` without learning which member wrote the operation or its exact byte size.

## 4. Scale large groups to $O(\log N)$ with Key-Tagged TreeKEM

Flat HPKE epochs scale well up to a few hundred members, but removing a member from a large hybrid-PQ group would otherwise publish $O(N)$ 1.2 KiB lockboxes. Setting `distribution: 'tree'` (or calling `session.rotateTreeEpoch()`) switches `$keys` to **Key-Tagged TreeKEM** (`chronolog-keytree-dag/v1`):
- Writes only $O(\log N)$ small structural-sharing CAS nodes and $O(\log N)$ `targetPubKeyHash`-tagged copath boxes (plus 1 updater self-box for stateless cold boot).
- Works with zero Delivery Service under Chronolog's flat leaderless undo-do-redo order: concurrent offline removals never fork the group—`await session.keysNeedsRotation()` deterministically detects any stale member (or `maxOpsPerEpoch` threshold) so the next online admin emits a single $O(\log N)$ healing rotation.

## Verify

1. Create a Private Capability Vault for Alice only, write an encrypted SQL row guarded by `vaultBoxPolicy`, and verify Bob's `unsealRows()` yields `null` AND Bob's forged write to that `vault_id` is rejected by SQLite RLS.
2. Add Bob (`vaults.addMember`) and verify Bob unseals epoch 0; remove Bob (`vaults.removeMember`) and verify Bob cannot unseal epoch 1 while Alice can.
3. Enable `hideEnvelopeAuthor: true` + `paddingBucketBytes: 512` and inspect exported encrypted envelopes: verify outer `author` is `00..00`, ciphertext lengths align to buckets, and Tendriller's blind host accepts valid `mailboxTag` uploads while rejecting tampered tags.
4. Rotate a multi-member group with `distribution: 'tree'` (`rotateTreeEpoch()`), verify `copathBoxes` grows as $O(\log N)$, remove a member offline, and confirm `keysNeedsRotation()` reports the stale member until healed.
