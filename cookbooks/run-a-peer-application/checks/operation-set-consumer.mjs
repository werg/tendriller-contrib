import { runOperationSetScenario } from './operation-set-scenario.mjs';
import { connectDirect } from './operation-set-participation.mjs';
await runOperationSetScenario({ path: process.argv[2], connectSessions: connectDirect });
