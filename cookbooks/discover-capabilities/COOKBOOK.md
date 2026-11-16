---
id: "discover-capabilities"
title: "Discover capabilities and design around them"
summary: "Distinguish API presence from usable permission and offer a task-completing alternative before requesting access."
group: "Choose inputs and algorithms"
tags: ["capabilities", "permissions", "fallbacks"]
choices: ["No-prompt observation versus a relevant permission request", "API presence, permission, hardware, and actual operation", "Fallbacks that complete the same task"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "choose-voice-interaction", "connect-instrument"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/probe.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/playground.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/INPUTS.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/explore-device/index.html"]
---

# Discover capabilities and design around them

Use capability discovery when choosing an input or adapting a page to an unfamiliar device. Do not turn discovery into a permission tour. The person wants to complete a task, not approve every sensor a browser might expose.

## Observe before asking

A no-prompt probe may report API presence, secure-context requirements, and known local state. It cannot establish hardware presence, chooser success, permission, operating-system policy, model availability, or reliable operation. Report “available to try” separately from “working.” Avoid stale browser support tables as authority; capability and a tested operation are stronger evidence on the actual device.

Choose a progressive path: first a usable text/file interaction, then relevant optional inputs. Ask for only the permission that the next action requires, from the required user gesture. Explain the purpose in task language. A denial or cancellation should not trigger repeated automatic prompts.

## Adapt the interface

Keep capability checks separate from permission requests and active resource handles. Observe failure at startup and during use: devices can be removed, streams can end, and a foreground page can lose access. Surface useful status and a Stop action without assuming a fixed controls panel.

Select alternatives by outcome. If taking a photo fails, file upload may still provide evidence. If a sensor cannot measure progress, a manual checkpoint may finish the task. Do not disable the whole application because an optional input is absent.

## Keep observations current across interruptions

A permission query is asynchronous. An older query can finish after a newer
result, an identity change, or a cached-page restoration. Tag refreshes with a
generation and discard responses from superseded generations. Detach listeners
while the page is suspended, then reattach and request a fresh no-prompt report
on a persisted `pageshow`; a restored JavaScript realm does not rerun startup.
Keep the page's active-use indicator and Stop affordance synchronized with the
actual tracked resources, rather than a remembered permission or requested state.
Reobserving must never restart a camera, microphone, geolocation watch, or lock
without the person's chosen active-task behavior.

## Check

Exercise absent API, denied permission, cancelled chooser, no physical device, unsupported data format, interrupted resource, and successful start/stop. Verify the initial page load requests no optional permission. Test a keyboard-only route through fallback and recovery. Record observed device/browser conditions where claiming exercised behavior; do not promote method existence into broad support.
