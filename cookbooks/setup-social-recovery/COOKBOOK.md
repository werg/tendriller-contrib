---
id: "setup-social-recovery"
title: "Set up trusted backup contacts for social recovery"
summary: "Protect encrypted spaces against total device loss using M-of-N trusted backup contacts who hold only encrypted recovery shares and can never read private data."
group: "Access and identity"
tags: ["recovery", "guardians", "permissions", "encryption", "ux"]
choices: ["2-of-3 trusted contacts vs backup hardware device", "Zero-read guardian isolation", "6-digit verbal match codes without hex keys"]
capabilities: []
evidence: "explained"
related: ["choose-page-governance", "coordinate-participants"]
sources: ["https://github.com/werg/tendriller/blob/f637d182075b5b734dd3c216a0fa3eed78f6d2e1/docs/tutorial/shared/helpers/social-recovery.mjs"]
---

# Set up trusted backup contacts for social recovery

End-to-end encrypted spaces should never have a host password-reset backdoor — yet losing every phone and laptop shouldn't mean losing your data forever. Chronolog supports threshold social recovery built directly into `$permissions` and `$keys`, with zero cryptographic jargon exposed to humans.

## 1. Configure trusted contacts (zero-read guarantee)

Use `setupTrustedContacts` from `shared/helpers/social-recovery.mjs`:

```js
import { setupTrustedContacts } from '../../shared/helpers/social-recovery.mjs';

await setupTrustedContacts(session, {
  threshold: 2,
  contacts: [
    { publicKey: momPk, wrapKey: momWrap, label: 'Mom' },
    { publicKey: friendPk, wrapKey: friendWrap, label: 'Sam' },
    { publicKey: backupPk, wrapKey: backupWrap, label: 'Spare laptop' },
  ],
});
```

Under the hood, Chronolog encrypts all epoch and compartment keys inside a recovery vault, splits the 32-byte recovery key into `N` Shamir shares (`M`-of-`N`), and HPKE-seals each share to its contact's wrap key. Backup contacts **cannot decrypt any page content** unless they are also admitted readers.

## 2. Recover cleanly with a 6-digit match code

Mount `mountRecoveryPanel` from `shared/ui/recovery-panel.mjs`:
1. On a replacement device, the owner taps **Request access recovery** and gets a 6-digit match code to share verbally or by text.
2. Any `M` trusted contacts verify the code and tap **Approve recovery** in their browser — atomically approving the new device and re-sealing their Shamir share to it.
3. The replacement device taps **Unlock my recovered space** (`finishDeviceRecovery`), reconstructs the vault key locally, restores every epoch key, and resumes normal operation.
