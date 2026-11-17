import { openNativeSqlApplication, prepareNativeSqlApplication } from '@chronolog/peer-session/sql-native';
import { conversation } from './peer-generation-definition.mjs';

export const prepareApplication = options => prepareNativeSqlApplication({ ...options, definition: conversation });
export const openApplication = options => openNativeSqlApplication({ ...options, definition: conversation });
