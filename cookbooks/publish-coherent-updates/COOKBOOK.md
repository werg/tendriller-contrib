---
id: "publish-coherent-updates"
title: "Publish coherent page updates"
summary: "Keep authored assets, runtime identity, nested paths, and draft-aware updates consistent within one target system."
group: "Keep work dependable"
tags: ["publication", "integrity", "updates"]
choices: ["Provenance, deliberate dependency, and final publication identity", "Nested relative files and explicit routing assumptions", "Draft-aware publication readiness and update behavior"]
capabilities: []
evidence: "explained"
related: ["publish-smallest-page", "adapt-without-losing-work", "test-adaptive-page"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/ARTIFACTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/PREVIEW.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/cli/lib/pack.mjs", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Publish coherent page updates

Use this when a page has several authored files, nested HTML, lazy imports or updates while someone is working. A single file is still useful. One signed publication names a complete authored graph; the host serves that graph through its selective Chronolog publication facet.

## Make the update reviewable

A field page may receive a new question flow while someone types a report. The author needs to inspect the complete changed files and the publication result. The person using the page needs to preserve their draft and choose when to load the update. Keep those concerns explicit.

Review the visible changes, full asset snapshot, entry HTML, current signed predecessor and application definition binding. Preview empty, pending, rejected and recovery states. Optional capabilities must be present in the actual application or show an unavailable state; a new UI does not install an executor at the host.

| Stage | Honest meaning | Recovery |
| --- | --- | --- |
| Prepared locally | The exact signed manifest is saved under its operation ID. | Reuse that identity and complete byte snapshot. |
| Transfer in progress or outcome unknown | No verified acceptance receipt has reached this participant. The host may already have committed. | Inspect the saved operation, then retry its exact signed publication and assets if needed. |
| Committed receipt retained | The host acknowledged this exact publication and version. A later local write or selection read may still fail. | Preserve the receipt and inspect the current selected head separately. |
| Selected | A verified head read identifies the publication currently selected by the host. | Inspect its signed identity and served version; an older retained receipt does not replace this observation. |
| Predecessor conflict | Another publication changed the reviewed head. | Inspect the new head and prepare a newly reviewed operation. |
| Old tab still open | The tab retains its original coherent graph. | Preserve work and navigate to the chosen new publication deliberately. |
| Asset or capability failure | Actual loading or execution failed. | Diagnose the specific dependency; publishing alone is not proof of a useful page. |

A selected release does not prove that a browser loaded it, an application synchronized or an agent handled a request. Record those observations separately. Do not let an unverified health report rewrite the signed head.

## Publish with an independent signed publisher

Code publication is a separate signed `$publications` control-topic log (`chronolog/publications`). It is not an application-data operation,
does not enter private encrypted application topics and neither orders nor is ordered by data.
A publisher can sign the complete UI before any browser has created the data
root, and a later data operation never requires a new code release.

The signing key needs the current signed `publisher` grant. That right is
independent of `administrator`, reader/writer data access, finalizer eligibility
and application SQL permissions. A publisher can release code without controlling
membership, and an administrator without the publisher grant cannot release code.
Keep the publisher's private signing identity outside authored assets and the
repository.

The supplied tutorial's [publish.mjs](https://github.com/werg/tendriller/blob/master/docs/tutorial/publish.mjs)
shows the actual helpers. It enumerates the complete authored directory, rejects
symbolic links and records each file's path, type, size and SHA-256 hash. It reads
the host's prepared `publicationAuthority` and current head, then calls
`signPublicationManifest` from `@chronolog/authority` under the imported
publisher identity. The manifest binds the application, publisher grant,
execution manifest digest, author, operation ID, revision, predecessor, entry and
file list. `host.peers.publish(signedPublication, assets)` uploads every distinct
hash with its exact base64 bytes. The host verifies authority, hashes and the
compare-and-set predecessor before selecting the graph. The tutorial also saves
the signed publication record under its graph digest before upload.

After a lost reply, reload that exact saved signed record and publish it again.
Compare the receipt's publication ID with the retained intent. The host returns
its original receipt rather than making another release. An old exact retry can
succeed after a newer release was selected, so read the current head separately
with `host.peers.publication()`. Do not mint a new operation ID to recover a
timeout. Changing a file or accepting a different predecessor is a new review
and a new signed publication. A verified receipt means the host acknowledged the
publication; a later local save or head read can still fail, so report those
facts separately. Cancellation stops local waiting and does not retract a host
commit.

Browser readiness, application synchronization and agent handling are separate
observations that a signed head does not establish.

The host's participant transport accepts signed authority, discovery, introduction and publication messages according to its policy. It rejects application operations, application content chunks and live UI signals. Code publication does not make the host an application replica, an ordering authority or an alternate command executor. Application data and immutable evidence content continue through the common session's peer transport.

## Publish through a running native owner

A UI-only release does not require stopping a compatible native owner and
disconnecting its listeners. Use the existing local attachment with publication
granted to it: the agent program's one local terminal binding carries the
ordinary application capabilities and `publish`, not `ownerAdmin`, and is reused
on restart and never broadened. No broader administrative attachment is needed for
a UI-only release. The agent's shared signer still needs its signed publisher
grant in the page application; local attachment access alone does not supply it.
Publish with `tendril --page <slug> publish`. Browser-first publication before the
first owner sign-in does not need the agent program: the workspace's one shared
signer signs under the prepared publisher policy.

```sh
tendril --page notes publish ./pages/notes/dist --operation reviewed-ui-001
tendril --page notes publication-operation reviewed-ui-001
tendril --page notes publication
```

On an uncertain reply, inspect the original operation and retry the same reviewed
file graph and operation ID through the same application and binding. Publication
IDs are scoped by application and binding, as command IDs are. The signed payload
may return a full namespaced operation ID; keep it opaque. The original
short ID and returned full ID identify that binding's same operation, not work
belonging to another agent. A new graph or reviewed predecessor needs a new ID.

Old bindings without `publish` remain restricted: have the owner deliberately
provision the intended scope rather than widening a retained policy, exposing
the signer or falling back to a second owner process. Credential rotation retains
the stable binding's namespace; revoked bindings cannot publish or recover access
by restarting. Do not grant publication to an ordinary assistant as a side effect.

Use a matching qualified core/session composition containing this scoped attach
path. Publication acceptance, current host selection and a browser loading the
new UI remain separate observations; inspect them explicitly rather than adding
another polling or publication service.

## Keep the file graph coherent

Validate canonical relative paths, duplicate entries, byte sizes, digests and the existing HTML entry before transfer. Include every authored dependency the page needs. Nested HTML and lazy modules must resolve against their publication directory; absolute application paths can accidentally escape that graph. A framework router fallback is a serving choice to implement and test explicitly.

For document and fragment links, use the current runtime's
`tendril.documentUrl('discussion.html')` or `tendril.documentUrl('#evidence')`.
It constructs a URL without navigating, preserving the page's live application
context or explicitly pinned publication. Asset and module URLs remain relative
to their signed graph. Do not construct publication prefixes or use an immutable
asset base as the application's document-navigation base. Follow the selected
service's [browser API guide](https://github.com/werg/tendriller/blob/master/docs/BROWSER_API.md)
and test both live and pinned nested-document navigation.

Cookbook provenance names where an idea came from. A selected executable dependency may have a separate exact version and integrity lock. The publication identifies the final adapted authored bytes. These identities have different purposes: editing a copied snippet does not require pretending its old upstream digest still describes it.

The host supplies the selected runtime and injects its configuration into served HTML. Verify that actual runtime binding and complete graph as well as authored module bytes. Do not compare transformed HTML with the unmodified authored digest and call it the same representation.

Prior selected publications retain their own immutable URLs while cached on the host (short rolling R2 cache), and pruned historical releases remain recoverable from connected Chronolog peers by SHA-256 hash via `session.content`. An existing tab can stay coherent while canonical navigation selects a new graph. A reversion publishes a signed `$publications` `rollback` operation referencing an earlier revision; it appends a new signed release rather than erasing application or publication history.

## Preserve the person's work

Offer a concise update notice and an apply/defer action. Preserve focus, text selection, local drafts and original pending operation IDs. Decide whether a capture must finish or stop before navigation. New page code cannot silently relabel an old command as a new task.

Use `tendril.publication.saveOffline()` to request readiness for the exact current publication. Its success does not establish readiness for a later version or unused optional models. Test nested routes and cold start in the actual browser, and keep incomplete saves visible.

Preview serves the exact authored files. An optional authored bootstrap opens the real common application session and supplies it to the runtime. A missing dependency remains missing; preview does not fabricate hosted state, receipts or application authority. The [public tooling guide](https://github.com/werg/tendriller/blob/ecf3851957d8089075fa95ff19c4eb3b08941363/docs/tools/PREVIEW.md) explains that boundary.

## Copy code with explicit data boundaries

A new application can reuse a reviewed authored graph after configuring its own application identity and authority. Sign the destination publication under that destination's membership. Never copy device private keys, administrative tokens, session journals or private data merely because the UI files were copied.

Importing domain data is a separate guarded application command. Cross-application imports and code publication are not one implicit transaction. Record which steps succeeded and require review if the destination changed. There is no hosted portable-state import path or automatic format migration.

## Verify

Race two publishers from the same signed predecessor. Lose a persisted reply and recover the exact signed identity. Fail a selection read after a valid acknowledgement and preserve the committed receipt. Close during receipt retention, reopen the same profile, and inspect the original operation. Retry an older acknowledged release after a newer one and keep the newer selected head. Tamper with one asset and require rejection without a head change. Publish a second graph, navigate both canonical and prior immutable URLs, and verify the actual module bytes. Restart the actual host and verify the selected code and unchanged application authority. Publish while a user types, fail one authored import, and exercise offline readiness with fresh storage.

Verify the authorization boundary with a publisher that has no administrator
grant and an administrator that has no publisher grant. The former can publish
the reviewed graph; the latter must be refused without a head change.

The [independent hosted participant gate](../run-a-peer-application/checks/README.md) exercises signed HTML/module delivery, authority, byte integrity, exact retry, predecessor conflict, old graph retention and host restart. Its runtime result does not establish browser interaction, deployed login or Internet connectivity; qualify those separately for the finished page.
