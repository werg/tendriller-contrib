---
id: "join-across-devices"
title: "Join or transfer a page across devices"
summary: "Choose role-aware links and a usable transfer method without turning device purpose into authority."
group: "Guide and coordinate work"
tags: ["devices", "links", "roles"]
choices: ["QR, typed link, or explicit device handoff", "Same page, participant view, or shared projection", "Authentication and draft-transfer policy"]
capabilities: []
evidence: "explained"
related: ["coordinate-devices", "resume-across-sessions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/qr.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/multi-device-workshop/AGENT.md"]
---

# Join or transfer a page across devices

Use a join link or QR code when someone moves a task from a laptop to a phone, joins a workshop, or opens a reviewed display on another screen. The goal is a recognizable, authorized arrival with a useful next action. Scanning a code is only transport for a URL; it is not proof of identity, successful handoff, or permission to access private work.

For a person already signed in with retained, enrolled devices, opening the same page may be enough. A new device still needs its own reviewed grant. A short typed link can work better when a camera is unavailable, scanning is awkward, or showing a code would disclose the page location to bystanders. Use a separately designed invitation mechanism only when the service and task actually require one.

## Choose what the new device is joining

| Intent | Receiving experience | What the sender should confirm |
| --- | --- | --- |
| Add a companion device | Same task with a purpose such as capture or review | The original device continues and any local draft stays where it was. |
| Continue on another device | Current authoritative progress plus an explicit draft-transfer choice | Which work has arrived and whether responsibility has transferred. |
| Join as a participant | Current authorized participant view | Authentication and assignment happen at the service boundary. |
| Open a shared display | Deliberately public or authorized read-only projection | No raw private data or administrative credentials are exposed. |

A device label describes purpose, not authority. The receiving page must obtain current authorized state rather than trusting query parameters that say “owner” or “facilitator.” The [public protocol](https://github.com/werg/tendriller/blob/master/docs/PROTOCOL.md) makes page selection and authenticated permissions separate concerns.

## Build a recognizable arrival journey

1. **Offer transfer.** On the source device, show “Open this inspection on your phone,” the page/task title, and whether this adds a device or continues work. Explain that local unsent material is separate.
2. **Present the destination.** Display the intended viewer/join URL as a readable link and optional QR code. Include a copy action with a success or failure message. Never encode an agent token or administrative handle.
3. **Open and authenticate.** The destination shows a recognizable title before asking the person to proceed where the platform permits. Let the service perform its actual sign-in, ownership, or guest approval steps. A signed-in account with no access needs an understandable route to switch identity or request the appropriate access.
4. **Confirm context.** After authorization, show the task, current progress, and any changed instructions. Do not immediately activate a camera, microphone, speech output, or wake lock merely because the source device was using it.
5. **Choose purpose.** Offer a small set of relevant next actions, such as “Capture evidence” or “Continue checklist.” Keep the ordinary page usable if the preferred capability is absent.
6. **Confirm arrival.** Distinguish “Link opened” from “Authorized device joined” and from “Work accepted here.” Only mark a transfer complete under the chosen explicit policy.
7. **Recover.** Keep the source device's pending work available until its disposition is known. A failed scan or denied sign-in should not discard the current session.

For a workshop projector, use clear room instructions and a public projection. For a personal transfer, emphasize continuity and which drafts remain local. The two experiences need not share the same panel or wording.

## Make the link useful and safe to handle

Use a destination supplied or constructed according to the service's documented public routing, with the current publication and role requirements understood. Do not invent a short-code redemption service or an expiring invitation guarantee that has not been implemented. If the URL is long, make copying reliable instead of shortening it through an unreviewed third party.

A QR encoder is an ordinary selected dependency. Review it for the required output and include its authored assets coherently when publishing. Use sufficient contrast, quiet space, and a size appropriate for the intended display and distance. Those values depend on the actual screen and camera; verify them in the target setting. Provide a text link and instructions that remain useful without vision or camera access.

If the page itself offers scanning, inspect availability without prompting and request camera access only after “Scan a code.” Provide a visible stop action and close acquisition on exit. Decode and show the destination before navigating if arbitrary codes are accepted. A scan result is untrusted input; restrict navigation to the intended destination policy rather than accepting executable or unrelated URLs.

Copying a page URL does not necessarily grant access, but URLs can still disclose names or identifiers. Avoid putting private notes, assignments, draft text, or personal data into query strings or fragments. Explain where a link may be shared according to the actual access model.

## Transfer drafts deliberately

For a Tendriller browser, follow the current host's explicit device enrollment
procedure in [connected-app setup](../../guides/connected-app-setup.md). Account
sign-in, an approved assistant connection and a copied page link do not enroll
that browser's signer. Check the session in the browser actually being used;
sign-in elsewhere does not authenticate an agent-controlled browser.

Current core source implements automatic pairing; confirm that the selected
host and its exact release support it before using that route. The browser
proves possession with its own retained key. The page's owner inside the agent
program (`npm run agent`) durably pauses ordering and stages the exact signed
proposal; the host verifies it against the proved key, account and current
authority and approves it automatically for the signed-in owner or an admitted
guest. There is no approval screen: the page shows its progress and connects.
The proof binds the fingerprint, account, application, origins, rights and
retained history. A copied link or successful sign-in grants none of those device
rights by itself.

Individual requests expire after ten minutes, and the agent program receives
pairing notices over its one hub connection with no idle polling. Restart the
same agent program if it stopped; closing it preserves any uncertain ordering
pause. Resume a lost reply with the same request, device checkpoint and browser
key; reconcile the original signed outcome before writes resume. An expired or
stale request is renewed once per visit, and further expiry requires an explicit
new request for that device. Do not silently grant rights, replace an identity,
choose another prefix or present a staged proposal as a connected application.
Verify the actual peer session and same-key reopen separately; this cookbook's
historical evidence does not certify the newer protocol or a deployed service.

Authoritative accepted progress can be reloaded through an authorized read. An unsent local draft has different ownership and durability. Let the person choose whether to keep it local, transfer it through an authorized application mechanism, or export it for their own recovery. Do not imply that copying the page URL copied the draft.

A transfer record, if implemented, should name the source task and revision, intended recipient context, exact draft snapshot, and transfer state. An accepted transfer receipt should not delete a newer draft subsequently edited on the source. Preserve both when they diverge and offer a comparison. Ordinary shared state is unsuitable for a draft that other page readers must not see; private transfer requires an appropriate authorized storage design.

If the original device disappears, resume from acknowledged task state and clearly name unavailable local work. Do not fabricate a complete recovery from a last-seen indicator. If an old link opens a replaced or expired task, explain the situation and route to current authorized work without silently applying old pending actions to it.

## Helpful finishing touches

A “This is the right page” confirmation can prevent confusing similar tasks. A device nickname helps a person distinguish their phone from a shared tablet, but should not collect more identifying information than necessary. Keep a visible exit or “Stay on this device” option. Let the user retry copying or show the code again without generating a new application intent each time.

The sender's progress indicator should be calm and precise: waiting for an authorized arrival, joined, transfer offered, or transfer accepted. Do not turn connection polling into a guaranteed human-read receipt. On the receiving device, focus the page heading or appropriate next-action region after navigation rather than launching a disruptive modal chain.

## Verify arrival and recovery

| Scenario | Expected observation |
| --- | --- |
| Open in a signed-out browser or the wrong account. | The service's authentication boundary applies; no private preview leaks before authorization. |
| Scan from a real display at the expected distance. | The code works at usable size and a text/copy alternative remains available. |
| Use a device with no camera or denied camera permission. | Joining remains possible through the link; scanning failure does not block the task. |
| Change the purpose or role-looking URL parameter. | Permissions do not change with presentation hints. |
| Reload after requesting pairing or lose the enrollment response. | The same request, browser key and signed attempt resume; no second grant or page is created. |
| Stop the agent program, let a request expire, or revoke an enrolled key. | The UI names the actual pending, expired or revoked state; refresh never silently restores authority. |
| Disconnect during draft transfer, then edit the source. | The original snapshot, receipt, and newer draft remain distinguishable. |
| Open a stale task or publication link. | The person sees an accurate stale/expired explanation and a deliberate continuation path. |
| Inspect QR contents, logs, and copied instructions. | They contain the intended user-facing URL and no agent secret or private draft. |

These checks cover a designed transfer experience. They do not establish anonymous access, invitation expiry, private draft storage, or cross-device durability unless the selected service and application explicitly implement those guarantees.
