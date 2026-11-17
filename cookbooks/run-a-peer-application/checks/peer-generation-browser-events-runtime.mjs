import { openApplicationSession } from '@chronolog/peer-session';
import { conversation } from './peer-generation-definition.mjs';

export const openApplication = ({ device, applicationId, host }) => openApplicationSession({ device, applicationId, host, definition: conversation });
