import { openBrowserApplication } from '@chronolog/peer-session/browser';
import { conversation } from './peer-generation-definition.mjs';

export const openApplication = ({ device, authority }) => openBrowserApplication({ device, authority, definition: conversation });
