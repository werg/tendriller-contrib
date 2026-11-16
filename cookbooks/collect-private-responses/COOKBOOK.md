---
id: "collect-private-responses"
title: "Collect private responses and publish a reviewed aggregate"
summary: "Keep answers and assignments private while giving a facilitator an explicit, versioned path to shared results."
group: "Guide and coordinate work"
tags: ["privacy", "collaboration", "transactions"]
choices: ["Public poll or authorized private records", "Revisioned answers or append-only revisions", "Reviewed aggregate and atomic round reset"]
capabilities: ["explicit trusted extension", "private records", "transactions"]
evidence: "exercised"
related: ["review-exact-proposal", "choose-data-model", "coordinate-devices", "manage-sensitive-data"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/server.ts", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/workflows/test/sessions.test.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/facilitated-session/AGENT.md"]
---

# Collect private responses and publish a reviewed aggregate

Use this for a workshop, interview, peer review, or check-in where participants should not read each other's raw responses. If every answer may be public, a shared poll can be much simpler. If privacy matters, a hidden panel, device role, targeted conversation message, or obscure state path cannot supply it. The server must authorize every read and mutation of private records.

## Decide the policy before the interface

| Question | Reasonable starting policy | Alternative and consequence |
| --- | --- | --- |
| Who may respond? | Explicit authenticated participant identities. | Anonymous responses require a separate abuse and identity design; do not infer anonymity from missing display names. |
| Who reads raw answers? | The author and an authorized facilitator. | A blind review may deliberately hide authors from reviewers; enforce the projection on the server. |
| Can answers change? | Revision-checked edits while a prompt is open. | Append-only revisions preserve a fuller record but need a clear active version. |
| How is a summary shared? | Facilitator reviews an explicit aggregate snapshot and publishes it intentionally. | Automatic counts can be useful for low-sensitivity tasks; small groups can still reveal individual answers. |
| What does reset mean? | Archive a complete round and retained media, then rotate its generation in one transaction. | Delete without an archive if retention is inappropriate; state that choice before collection. |

Assignments and feedback can be as sensitive as answers. A participant should read only the assignments and feedback intended for that identity. A display device's purpose is useful for presentation; it does not grant the right to fetch private data. Treat an agent's read authority separately from its ability to publish a summary.

## Required server boundary

The default core installs no application workflow. This cookbook's [private-response reference](snippets/private-responses.mjs) is deliberately selected and adapted through the public trusted host. Reading this guide never activates it. Review its operation names, identities, record projection, limits, and generation policy for the actual task before deployment.

The shipped reference accepts text only. It rejects media-bearing records because ordinary page blob access is not a participant-private media boundary. Private media requires a separately reviewed storage and authorization implementation before enabling that branch. The text-only archive/reset checks do not establish private-media retention.

Keep application vocabulary and record shapes in the selected extension. The host supplies authenticated identity, transactional mutation, concurrency protection, private storage, retained media references, and post-commit behavior. Do not write raw answers into shared state and rely on the UI to filter them. Browser fixtures cannot validate these guarantees.

**Platform invariants:** retries retain the original command and generation; stale work is rejected; authorized operations and private reads are checked on the server. **Conditional requirements:** if archive/reset is offered, the archive, media retention, active-state reset, and generation change must commit together or not at all. **Example choices:** prompt names, assignment structure, grouping, facilitator layout, and aggregation algorithms belong to this application.

## Make each person's journey complete

For a workshop check-in, begin with a plain explanation of who reads raw answers, what may be shared, whether answers may change, and what happens when the round closes. “Private” should name its readers; do not imply anonymity merely because the public screen omits names.

The participant first sees the current authorized assignment and its prompt, then a local draft and an intentional submit action. Their receipt distinguishes queued, accepted, rejected, and superseded responses. If the facilitator changes the assignment, keep the old draft associated with its original context and ask for review. A late rejection must not erase a newer edit. Show a useful closed-round state with the disposition of pending work instead of an empty form that looks broken.

The facilitator needs a different view: eligible assignments, received and missing responses, revision freshness, private review, and a separate aggregate draft. Missing is not a negative answer. A denominator should explain whether it counts invited participants, active assignments, or received answers. Before sharing, review whether a rare category, identifying quotation, or small group reveals someone indirectly. The application must decide its aggregation and quotation policy; this reference does not automatically anonymize text.

The shared display opens directly onto the last intentionally published aggregate with its source revision and review time. A new private response can make that aggregate outdated without silently changing what the room sees. Show that a new review is available in the facilitator view, and publish a replacement only after the appropriate intentional action. Do not show raw-response previews on a projector while preparing the summary.

Use clear keyboard-accessible forms, labels and error summaries on participants' phones. Keep a local recoverable draft where the privacy and device policy allow it, but explain that local storage on a shared device can be inappropriate. Closing a round should stop further collection under the authoritative generation without restarting sensors or deleting a participant's recoverable unsent text without explanation.

## Choose extensions deliberately

The shipped reference supports assignment, private text submission and revision, controller review, owner publication, and atomic archive/reset. It does not implement anonymous participation, participant deletion, private attachments, automatic moderation, blind reviewer assignment, or a general feedback inbox. These can be useful features, but require an explicit policy and verified implementation rather than merely adding controls to the specimen.

For several prompts, decide whether assignments are independent or must be submitted together. For a withdrawal request, decide whether a response can be removed before publication, what happens to an already shared aggregate, and how retained archives are handled. For feedback, create an authorized recipient projection rather than reusing shared conversation targeting as privacy. Explain those decisions before collecting data.

Keep facilitation convenience separate from access. A participant display name or a device purpose does not establish identity. A collaborator invited to help summarize may need a different authorized projection from an owner who can archive/reset. If the selected host cannot express that distinction, simplify the role design or deliberately implement the missing policy.

## Adapt the plan

1. List every actor and operation: participant submission/edit, own-record read, facilitator review, assignment, feedback, public aggregate, archive/reset. Write the authorization rule for each.
2. Choose stable prompt and participant identifiers. Separate definition revisions from response revisions and server concurrency generations.
3. Build the smallest selected trusted implementation. Return only the authorized projection; test that another participant cannot fetch raw records by guessing IDs.
4. Design the participant form around a clear question, privacy explanation, draft, submit status, and revision conflict. Build the facilitator console independently around review and uncertainty.
5. Make the shared display read only the intentionally published aggregate. Never connect it to the facilitator's raw-response fetch and merely hide fields.
6. Clear private forms, receipts, summaries, and review panels immediately when identity or authority changes. Invalidate every pending read/write continuation, including failures; a delayed error must not redisplay an answer from the former view. Read a local draft only after the current authorized projection identifies its assignment.
7. Bind a submitted answer to the original prompt/version before asynchronous work. On conflict, show what changed and preserve the local draft for review.
8. Publish an aggregate from an explicit reviewed snapshot. Include denominators, missing responses, and limitations. Avoid exposing individual text through small-group summaries.
9. If offered, close/archive/reset through one authoritative transaction. Enforce archive privacy and retained media permissions after reset as well as before.

## Adaptation and checks

The [facilitator console specimen](checks/facilitator/index.html) combines authorized private review with a separate aggregate publication step. The [minimal participant form](checks/participant/index.html) shows one assigned prompt and its own submission receipt. The [shared projection](checks/display/index.html) reads only reviewed shared state and contains no private-read operation. They have different DOM, navigation, and data access; none requires a universal sessions schema.

The reference and its [checks](checks/) are application-specific examples, not an installed product catalog. Service tests must create fresh identities and records and exercise actual host transactions. The browser checks are only evidence of interaction behavior.

- Submit as two participants; neither can read the other's answer or assignment through direct requests.
- Attempt facilitator operations as a participant and as a display. Both are denied regardless of UI controls.
- Revise the same answer concurrently. One stale revision fails without losing the author's local draft.
- Retry after acknowledgement loss. The original receipt is returned without duplicate responses.
- Publish a summary; verify the shared response includes no raw-answer fields or private media references.
- Fill storage or force a transaction failure during archive/reset. The active round, retained media, and generation remain coherent.
- Reset while a participant is offline. Their old queued work remains associated with the old generation and is rejected on reconnect.
- Request old archive/media as an unauthorized identity. Privacy still holds after active records are reset.

**Evidence:** the text-only private policy and proposal reference were exercised against the actual packaged public host with fresh identities and storage. The [record](checks/evidence.json) identifies exact artifacts and scope. Thirteen browser scenarios across the three independent views passed; their [separate fixture record](../../guides/pilot-evidence.json) covers interaction continuity and revoked-view races, and does not establish server privacy. This guide does not claim an anonymous protocol, end-to-end encryption, or exactly-once external actions.
