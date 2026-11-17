// One device, one command journal, and the public local MCP surface.
import { createInterface } from 'node:readline';
import { createClient } from '@tendriller/core';
import { openApplicationSession, serveApplicationMcpLines } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { maintainNativeApplicationWebRtc } from '@chronolog/peer-session/webrtc-native';
import { conversation } from './peer-conversation.mjs';

export async function runPeerAgent({ api, token, applicationId, devicePath,
  createDevice = false, createApplication = false, definition = conversation }) {
  const host = createClient({ api, token }).peers;
  const device = await openNativeDevice({ path: devicePath, ...(createDevice ? { create: true } : {}) });
  let session, network;
  try {
    session = await openApplicationSession({ device, definition, applicationId, host,
      ...(createApplication ? { create: {} } : {}) });
    network = maintainNativeApplicationWebRtc(session, { host });
    await network.ready;
    await serveApplicationMcpLines(session, {
      input: createInterface({ input: process.stdin, crlfDelay: Infinity }),
      write: line => { process.stdout.write(line); },
      host,
    });
  } finally {
    await network?.close();
    if (session) await session.close();
    else await device.close();
  }
}
