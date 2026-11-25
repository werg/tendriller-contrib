// Only public packed authority APIs. No schema or application history lives here.
import { epochKeyCommitment, signAppDescriptor, signMembership } from '@chronolog/authority';
import { eventExecutionManifest, executionManifestArtifacts, bytesToHex } from '@chronolog/peer-session';

export async function createFixtureAuthority({ applicationId, signer, devices, epochKey, executionManifestDigest, finalityPolicy = { kind: 'none' } }) {
  const digest = executionManifestDigest ?? bytesToHex((await executionManifestArtifacts(await eventExecutionManifest())).executionManifestDigest);
  const descriptor = await signAppDescriptor({ applicationId, rootPrincipal: devices[0].identity.publicKey,
    authorityPublicKey: signer.publicKey, executionManifestDigest: digest, finalityPolicy }, signer);
  const membership = await signMembership({ applicationId, revision: 0, previous: null, authorTimeAfterMs: -1n,
    epoch: 0, epochKeyDigest: await epochKeyCommitment(applicationId, 0, epochKey),
    members: devices.map((device, index) => ({ publicKey: device.identity.publicKey, reader: true, writer: true,
      administrator: index === 0, publisher: index === 0, finalizer: finalityPolicy.kind === 'signed-frontier' ? finalityPolicy.signer === device.identity.publicKey : finalityPolicy.kind === 'fixed-validator' && finalityPolicy.validators.includes(device.identity.publicKey) })) }, signer);
  return { descriptor, memberships: [membership] };
}
