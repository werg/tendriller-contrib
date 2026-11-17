// Independent runtime entry: the maintained session owns transport and retry.
import { connectApplications } from '@chronolog/peer-session';
import { runPeerGenerationScenario } from './peer-generation-scenario.mjs';

await runPeerGenerationScenario({ path: process.argv[2], connectSessions: connectApplications });
