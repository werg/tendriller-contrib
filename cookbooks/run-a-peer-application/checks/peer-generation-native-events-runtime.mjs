import { applicationDefinitionDigest, eventExecutionManifest, executionManifestArtifacts } from '@chronolog/peer-session';
import { openNativeApplication } from '@chronolog/peer-session/native';
import { conversation } from './peer-generation-definition.mjs';

export async function prepareApplication({ schemaAdministrator }) {
  const execution = await executionManifestArtifacts(await eventExecutionManifest('peer-generation-v1'));
  return { schema: null, binding: { definitionDigest: await applicationDefinitionDigest(conversation),
    executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'),
    schemaAdministrator: schemaAdministrator.publicKey, schemaDigest: null } };
}
export const openApplication = ({ device, authority, epochKeys }) => openNativeApplication({ device, authority, definition: conversation,
  ...(epochKeys === undefined ? {} : { epochKeys }) });
