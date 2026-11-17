// Independent runtime entry: the maintained session owns transport and retry.
import { connectApplications } from '@chronolog/peer-session';
import { runPeerGenerationScenario } from './peer-generation-scenario.mjs';
import { createParticipationFixture, qualifyParticipation } from './peer-generation-participation.mjs';

const network = createParticipationFixture();
await runPeerGenerationScenario({ path: process.argv[2], connectSessions: connectApplications,
  qualifyParticipation: options => qualifyParticipation({ ...options, ports: network.ports,
    copyPrefix: connectApplications, inspectTransport: network.inspect }) });
