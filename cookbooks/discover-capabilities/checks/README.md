# discover-capabilities checks

Run from the collection root:

```sh
node --test cookbooks/discover-capabilities/checks/capabilities.test.mjs
npm run check
```

## Exercised scope

Filtered no-prompt reports, unavailable/denied controls, intact file/text fallbacks, bounded summaries and trusted diagnostic sharing.

The tests execute the linked page modules with controlled browser/runtime ports.
They use the current public `capabilities(filter)`, `sensors.register`,
abort-first `unregister` and session signal shapes. Fixtures establish state,
cancellation, timing and memory behavior; they do not establish physical-device
accuracy, permission UX or hardware compatibility.

See the shared [public package browser/native check](../../capture-reviewed-evidence/checks/README.md) for actual
built `@tendriller/runtime/kernel` and `@chronolog/peer-session` qualification,
artifact hashes, exact commands and the separation from hardware qualification.
The cookbook's exercised label applies to these named scenarios only.
