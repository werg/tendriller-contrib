# Membership through the control participant

The host is a participant in the same Chronolog protocol as the application
peers. It has a control role and a dedicated delivery policy. It does not open a
second database, materializer or application journal to manage permissions.
The [participant transport guide](peer-network.md) lists the allowed facets and
the [implementation map](implementation-and-qualification.md) identifies the
remaining independent qualification boundaries.

## Keep permissions separate from deployment roles

Application grants declare reader, writer, coordinator eligibility and
administrator rights independently. A browser, native agent or optional always
available process uses the same session contract. Being online longer does not
make an agent an authority; having an authenticated host account does not grant
application reader or writer rights.

| Participant | Receives | Owns |
| --- | --- | --- |
| Browser or native application peer | Authorized signed control updates, encrypted commands, retained content and permitted live signals | One device identity, exact-attempt journal and coherent application view |
| Selected coordinating peer | The same protocol and data as an eligible application peer, plus commands for ordering | Ordering within the selected generation; no permanent authority or unique decryption role |
| Host control participant | Explicit control, publication, discovery and invitation messages admitted by its policy | Durable control selection, signed page publication projection and route hints |

The host policy rejects database submission, content chunks and live application
signals. The client transport filters those messages before HTTP and the host
independently rejects bypassed envelopes. The host must not receive ordinary
commands merely to keep its control state current. Device catch-up transfers
application history and content from authorized peers.

## Use the owned session for lifecycle actions

Pre-session bootstrap obtains the pinned descriptor, application definition,
controls and authorized keys through the public participant transport. Once the
application is open, attach that transport with
`session.connectControlParticipant({ exchange })`. Attaching performs no I/O.
The returned control port verifies definitions and authority and retains a
monotonic record of publication heads. Ordinary commands, coherent queries,
operation waits and live signals continue through the same session while that
host transport is unavailable.

A survivor uses `session.recovery.takeover(control)` at an explicit recovery
boundary. Planned retirement uses `session.recovery.handover(control, ...)` with
verified retained coverage from the successor. These actions persist their exact
signed transition before sending it. A lost response retries that identity and
base; it does not silently select a more recent prefix or invent a second
application history.

A restrictive control update must fence newly forbidden work as soon as its
verified authority is learned, including while required application content is
missing. The application can keep a previously coherent view visible with an
explicit unavailable state; it cannot present that view as current authority.
Reader revocation rotates future access under the epoch rules. It cannot erase
plaintext or keys already held by a device.

## Qualify actual membership updates independently

The maintained [hosted public-artifact gate](../checks/README.md) runs the real
packed Tendriller engine in workerd and the packed native session over RTC. It
checks host interest filtering, zero host requests during established
application work, selected-prefix recovery and signed page-code publication.
Those checks do not by themselves establish a live enrollment or revocation
campaign.

Membership qualification additionally needs device-created identities after
bootstrap; review and signed activation through the public host participant;
authorized key delivery; and actual peer catch-up before readiness. Drop the
control response after persistence, restart the host and retry the exact
operation. A changed decision under the same operation ID must be refused.

Revoke a writer while its host login remains valid and verify that a newly
signed direct peer command fails. Preserve the original result of an accepted
exact retry. Then revoke a reader, rotate future access and verify that it
cannot receive new keys or authorized future content. Restart the device and
host to check that neither a cached grant nor a stale control response restores
revoked rights. Keep these observations separate from transport authentication
and from merely receiving a successful administration response.

Measure actual encoded request and response bytes at the host boundary. Compare
fixed command count with increasing body sizes, then fixed body size with
increasing command counts. Host application-data bytes and request counts must
remain unchanged in both established-work windows. Measure participant updates
separately: grants, key wraps, control history and published assets legitimately
have their own traffic and storage costs.

## Historical evidence

The retired membership/finality implementation and its complete acceptance table
remain available at their [exact source snapshot](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/thin-membership-administration.md).
Its reports describe those artifacts, including real workerd restarts, browser
enrollment and revocation. They do not qualify the common session or its current
participant envelope:

- [Initial thin-membership raw report](evidence/2026-11-16-thin-membership.json).
- [Initial application report](evidence/2026-11-16-application-pilot.json).
- [The reviewed source/artifact pairing](qualification-review-43957113710.md).
- [Later compact-control evidence](compact-membership-resident-qualification-2026-11-17.md).

The [deployment handoff](deployment-qualification-handoff.md) keeps real login,
networking, hosted persistence, device recovery and measured cost work explicit.
A local workerd/native check does not establish the deployed operating envelope.
