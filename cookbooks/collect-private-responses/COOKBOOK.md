---
id: "collect-private-responses"
title: "Collect private responses and publish a reviewed aggregate"
summary: "Keep answers and assignments private while giving a facilitator an explicit, versioned path to shared results."
group: "Guide and coordinate work"
tags: ["privacy", "collaboration", "transactions"]
choices: ["Public poll or authorized private records", "Revisioned answers or append-only revisions", "Reviewed aggregate and atomic round reset"]
capabilities: ["application membership", "guarded commands", "coherent queries"]
evidence: "explained"
related: ["review-exact-proposal", "choose-data-model", "coordinate-devices", "manage-sensitive-data"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/server.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/facilitated-session/AGENT.md"]
---

# Collect private responses and publish a reviewed aggregate

Use this for a workshop, interview, peer review or check-in where participants should not read each other's raw responses. A public poll is simpler when every answer may be shared. If privacy matters, define exactly who can obtain plaintext before designing the form. Hidden panels, filtered queries and device-purpose labels do not limit the data an authorized application reader can replicate.

## Choose the reader boundary first

The current host is a selective Chronolog participant for membership controls, discovery and signed page publication. It does not provide a private-response database or execute application workflows. Private and shared application data use the same owned session API, with reader membership and keys appropriate to each history.

One possible design gives each participant and the facilitator access to a separate response application, while a shared results application contains only intentionally published aggregates. These are distinct data audiences using the same protocol, commands and journal; they are not alternative runtime implementations. Decide whether the operational cost of several memberships is justified. A single history whose readers include all participants cannot keep their raw answers private from one another by returning different query projections.

The application must establish participant identity and actual membership before opening a response view. Test encrypted bytes and key distribution as well as UI visibility. Revoking future access cannot make a reader forget plaintext or keys already obtained. Private attachments need the same explicit audience and retention review as text.

| Question | Starting policy | Consequence |
| --- | --- | --- |
| Who may respond? | Explicit authenticated participant identities. | Missing display names do not provide anonymity. |
| Who reads raw answers? | The author and an authorized facilitator. | Separate their history from the shared display's history. |
| Can answers change? | A guarded command checks prompt and answer versions. | Preserve the old draft when review becomes stale. |
| How is a summary shared? | Publish an explicit facilitator-reviewed snapshot. | Small groups and quotations can still reveal identity. |
| What does close/reset mean? | Close the domain round and preserve the chosen archive within its actual storage boundary. | Across separate applications there is no implied atomic transaction. |

Assignments and feedback can be as sensitive as answers. A facilitator's ability to read raw responses does not automatically grant publication or external-tool authority. A display device's purpose supplies neither reader membership nor access to private keys.

## Declare guarded domain commands

Define queries and commands through the [common application session](../run-a-peer-application/COOKBOOK.md). For example, your definition may declare an assignment query, a response command and a round-close command. The command checks the verified author, assignment identity, prompt version, answer version and closed status inside one deterministic transaction. These are domain operations you implement; there is no installed private-response vocabulary.

Capture a coherent query result before the person begins or reviews a draft. Retain both its application revision and the domain versions needed by the command. `basedOn` orders the attempt after a captured revision; it does not replace those transactional guards. Use a stable operation ID for the submitted snapshot, inspect the maintained journal after reopening, and retry that exact operation after a lost reply. Applied rejection needs review; an abandoned attempt after explicit history recovery needs a deliberately linked new operation.

Within one application, archive metadata and round closure can be one guarded transaction. Content retention is a separate receipt that must be obtained and checked. If the design splits private responses across applications, closure and aggregation span histories: show individual coverage and partial failures, or introduce an explicitly qualified coordination capability. Do not label several independent commands an atomic reset.

## Make each person's journey complete

Explain who reads raw answers, what may be published, whether answers may change, and how long drafts and archives remain. “Private” should name its readers. A shared screen that omits names does not make the protocol anonymous.

The participant sees the current authorized assignment, a local draft and an intentional submit action. Distinguish saved locally, applied accepted or rejected, retained coverage, and recovery that abandoned a prior result. A facilitator changing the prompt must not relabel an old pending answer. Keep its original context and preserve later typing separately.

The facilitator sees expected, received and missing responses, source revisions, private review and a separate aggregate draft. Missing is not a negative answer. Explain whether a denominator counts invitations, active assignments or received answers. Review identifying quotations and rare categories before sharing; aggregation does not automatically anonymize text.

The shared display reads only the intentionally published aggregate from its own authorized application. A newer private response may make the aggregate outdated without changing what the room sees. Show that a new review is available to the facilitator, and require a deliberate publication command. Cross-application publication records the reviewed source references and coverage without copying private records or keys.

Use keyboard-accessible forms and meaningful labels. Store recoverable drafts only where the device and privacy policy permit it. When identity or authority changes, clear private surfaces and invalidate pending read continuations before they can repaint. Reauthorize before displaying a restored draft; the presence of a cached page is not evidence of current access.

## Adapt the plan

1. List every reader, writer, administrator and external actor. Decide which application histories each can access and how enrollment obtains keys.
2. Choose stable prompt, participant and response identities. Distinguish domain round versions from application recovery generations.
3. Implement the smallest guarded definition. Test a malicious signed command, a guessed record ID and direct encrypted-content access, not only disabled controls.
4. Build the participant form and facilitator review independently around their different tasks. Keep new drafts separate from immutable submitted snapshots.
5. Give the shared display access only to the results application. Do not connect it to raw responses and merely omit fields from the rendering.
6. Publish an aggregate from an explicit reviewed snapshot. Record coverage, denominators, omissions and source revisions without exposing private values.
7. Define close, withdrawal, correction, deletion and archive policy. Show partial progress honestly when the operation spans applications or content stores.
8. Exercise recovery: retain original operation identities, show abandoned work and require review before reapplication.

## Verify the actual boundaries

| Scenario | Required observation |
| --- | --- |
| Two participants connect and request each other's history or keys. | The actual membership and encryption boundary refuses access; a filtered query alone is insufficient. |
| A participant submits a facilitator-only command directly. | Verified author checks reject it inside execution. |
| Two edits race from the same response version. | The guarded definition accepts only the permitted result and preserves the stale draft. |
| A response reply is lost. | Retry recovers the same signed attempt and outcome without duplicate answers. |
| The facilitator publishes an aggregate. | The display history contains only reviewed results and intended provenance. |
| A round closes while a participant is offline. | Old intent retains its original domain version and cannot silently reopen the round. |
| Recovery abandons a response or aggregate. | The application shows the selected history and affected operations; it does not silently resubmit. |
| Reader membership changes. | New access follows actual control and key policy; cached private UI clears without claiming past plaintext was erased. |
| Content retention or one cross-application close fails. | The result identifies the missing coverage instead of reporting atomic completion. |

## Historical interaction evidence

The [archived facilitator](https://github.com/werg/tendriller-contrib/blob/646ceca52c1cd4c164ef3af7c9bddeba3e3df90f/cookbooks/collect-private-responses/checks/facilitator/index.html), [participant](https://github.com/werg/tendriller-contrib/blob/646ceca52c1cd4c164ef3af7c9bddeba3e3df90f/cookbooks/collect-private-responses/checks/participant/index.html) and [shared display](https://github.com/werg/tendriller-contrib/blob/646ceca52c1cd4c164ef3af7c9bddeba3e3df90f/cookbooks/collect-private-responses/checks/display/index.html) used different DOM, navigation and data access for that retired transport. Current implementations use the owned Chronolog session.

The [actual-host record](checks/evidence.json) preserves the exact artifacts and text-only reference digests for the former hosted workflow executor. The [archive note](checks/README.md) explains its boundary. Those results do not establish current private application membership, private media, anonymous participation or a protected external action. The design above requires fresh qualification against its actual readers, keys, commands and recovery policy.
