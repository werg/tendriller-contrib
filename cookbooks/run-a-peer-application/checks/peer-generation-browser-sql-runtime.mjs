import { openBrowserSqlSession } from '@chronolog/peer-session/sql-browser';
import { conversation } from './peer-generation-definition.mjs';

export const openApplication = ({ device, applicationId, host }) => openBrowserSqlSession({ device, applicationId, host,
  definition: conversation, engineUrl: new URL('/browser-engine/', self.location.href) });
