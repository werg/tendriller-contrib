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
| Transfer in progress | The host is receiving and verifying the named assets. | Retry the same signed publication and exact assets. |
| Selected | The host committed this publication after its declared predecessor. | Inspect the returned signed identity and served version. |
| Predecessor conflict | Another publication changed the reviewed head. | Inspect the new head and prepare a newly reviewed operation. |
| Old tab still open | The tab retains its original coherent graph. | Preserve work and navigate to the chosen new publication deliberately. |
| Asset or capability failure | Actual loading or execution failed. | Diagnose the specific dependency; publishing alone is not proof of a useful page. |

A selected release does not prove that a browser loaded it, an application synchronized or an agent handled a request. Record those observations separately. Do not let an unverified health report rewrite the signed head.

## Publish through the owned participant

Open the application's ordinary session and attach the host's public exchange transport. Attachment performs no request; explicit publication operations do the work:

The signing device needs the current signed `publisher` grant. That permission
is independent of `administrator`, data access and coordination: a publisher
can release code without controlling membership, and an administrator without
the publisher grant cannot release code. Enrollment must supply the intended
permission explicitly.

```js
const control = session.connectControlParticipant({ exchange: host.peers.exchange });
const publication = await control.preparePublication({
  operationId,
  entry: 'index.html',
  files, // complete { path, type, size, hash } manifest of reviewed authored bytes
});
const selected = await control.publish(publication, assets);
```

`assets` carries each distinct hash and its exact base64 bytes. The public tools' packer enumerates the complete authored directory, validates the entry and paths, preserves bytes and enforces limits. The manifest binds application, definition, execution manifest, author, control revision, operation ID, revision and predecessor. The session journals the signed publication; the host verifies its authority, hashes and compare-and-set predecessor before selecting the graph.

After a lost reply, pass the same intent to `preparePublication` and retry the exact saved signed publication. The host returns its existing receipt rather than making another release. Do not invent a new operation ID to recover a timeout. Changing a file or accepting a different predecessor is a new review and operation.

The host transport accepts control, discovery, invitation and publication messages according to its policy. It rejects database submissions, application content chunks and live UI signals. Code publication does not make the host an application replica or an alternate command executor. Application data and immutable evidence content continue through the common session's peer transport.

## Keep the file graph coherent

Validate canonical relative paths, duplicate entries, byte sizes, digests and the existing HTML entry before transfer. Include every authored dependency the page needs. Nested HTML and lazy modules must resolve against their publication directory; absolute application paths can accidentally escape that graph. A framework router fallback is a serving choice to implement and test explicitly.

Cookbook provenance names where an idea came from. A selected executable dependency may have a separate exact version and integrity lock. The publication identifies the final adapted authored bytes. These identities have different purposes: editing a copied snippet does not require pretending its old upstream digest still describes it.

The host supplies the selected runtime and injects its configuration into served HTML. Verify that actual runtime binding and complete graph as well as authored module bytes. Do not compare transformed HTML with the unmodified authored digest and call it the same representation.

Prior selected publications retain their own immutable URLs. An existing tab can stay coherent while canonical navigation selects a new graph. A reversion publishes earlier reviewed authored bytes as a new signed revision after the current head; it does not reset the predecessor chain or erase application history.

## Preserve the person's work

Offer a concise update notice and an apply/defer action. Preserve focus, text selection, local drafts and original pending operation IDs. Decide whether a capture must finish or stop before navigation. New page code cannot silently relabel an old command as a new task.

Use `tendril.publication.saveOffline()` to request readiness for the exact current publication. Its success does not establish readiness for a later version or unused optional models. Test nested routes and cold start in the actual browser, and keep incomplete saves visible.

Preview serves the exact authored files. An optional authored bootstrap opens the real common application session and supplies it to the runtime. A missing dependency remains missing; preview does not fabricate hosted state, receipts or application authority. The [public tooling guide](https://github.com/werg/tendriller/blob/ecf3851957d8089075fa95ff19c4eb3b08941363/docs/tools/PREVIEW.md) explains that boundary.

## Copy code with explicit data boundaries

A new application can reuse a reviewed authored graph after configuring its own application identity and authority. Sign the destination publication under that destination's membership. Never copy device private keys, administrative tokens, session journals or private data merely because the UI files were copied.

Importing domain data is a separate guarded application command. Cross-application imports and code publication are not one implicit transaction. Record which steps succeeded and require review if the destination changed. There is no hosted portable-state import path or automatic format migration.

## Verify

Race two publishers from the same signed predecessor. Lose a persisted reply and recover the exact signed identity. Tamper with one asset and require rejection without a head change. Publish a second graph, navigate both canonical and prior immutable URLs, and verify the actual module bytes. Restart the actual host and verify the selected code and unchanged application authority. Publish while a user types, fail one authored import, and exercise offline readiness with fresh storage.

Verify the authorization boundary with a publisher that has no administrator
grant and an administrator that has no publisher grant. The former can publish
the reviewed graph; the latter must be refused without a head change.

The [independent hosted participant gate](../run-a-peer-application/checks/README.md) exercises signed HTML/module delivery, authority, byte integrity, exact retry, predecessor conflict, old graph retention and host restart. Its runtime result does not establish browser interaction, deployed login or Internet connectivity; qualify those separately for the finished page.
