import { openBrowserSqlApplication } from '@chronolog/peer-session/sql-browser';
import { conversation } from './peer-generation-definition.mjs';

export const openApplication = ({ device, authority, schema }) => openBrowserSqlApplication({ device, authority, schema,
  definition: conversation, engineUrl: new URL('/browser-engine/', self.location.href) });
