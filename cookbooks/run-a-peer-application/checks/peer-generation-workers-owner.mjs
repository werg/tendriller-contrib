// A real worker thread owns the device and SQL database. Only bootstrap is fixture data.
import { workerData } from 'node:worker_threads';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { openNativeSqlApplication } from '@chronolog/peer-session/sql-native';
import { serveApplicationWorker } from '@chronolog/peer-session/browser';
import { notifications } from './peer-generation-workers-definition.mjs';

const device = await openNativeDevice({ path: workerData.path });
const session = await openNativeSqlApplication({ device, definition: notifications,
  databasePath: workerData.databasePath, schema: workerData.schema, authority: workerData.authority });
const owner = serveApplicationWorker(session, workerData.port);
session.signal.addEventListener('abort', () => { void owner.close().finally(() => workerData.port.close()); }, { once: true });
