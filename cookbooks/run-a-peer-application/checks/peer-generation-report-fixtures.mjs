// Synthetic evidence used only to test validators; never runtime qualification.
const h = digit => digit.repeat(64);

export function syntheticReport() {
  const receipt = { generation: 'g1', sequence: 2, root: 'a'.repeat(64) };
  return {
    format: 'peer-generation-consumer/v1', mode: 'runtime', profile: 'peer-generation-v1',
    topology: 'independent-packed-peers', passed: true, executionManifestDigest: 'a'.repeat(64),
    runtime: { node: 'v24.0.0', platform: 'linux' },
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', version: '0.0.0-test', sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/native'], siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false },
    controlParticipant: { owner: 'application-session', role: 'control', attachRequests: 0, definitionVerified: true,
      recovery: { injectedAfterSelection: true, journalSavedBeforeRetry: true, originalRequest: 'a'.repeat(64), retriedRequest: 'a'.repeat(64),
        originalSelection: 'g2', retriedSelection: 'g2', recoveryNoticeObserved: true } },
    hostOutage: { boundary: 'portable-control-port', blocked: true, blockedProbeRejected: true, commandsApplied: 3,
      requests: { before: 4, after: 4 }, applicationBodyBytes: { before: 0, after: 0 }, finalityCapability: false },
    lostReply: { injectedAfterPersistence: true, originalOperationId: 'op-retained', retriedOperationId: 'op-retained',
      originalReceipt: receipt, retriedReceipt: structuredClone(receipt), orderedRecords: { before: 2, after: 2 } },
    recovery: { previousGeneration: 'g1', selectedGeneration: 'g2', previousHead: 4, adoptedPosition: 2,
      sourceRemoved: true, coherentReset: true, recoveredDigest: 'f'.repeat(64), freshPeerDigest: 'f'.repeat(64),
      inheritedOperationIds: ['op-retained'], abandonedOperationIds: ['op-abandoned'],
      inheritedIdentityPreserved: true, abandonedEvidencePreserved: true },
    projection: { owner: 'application-session', id: 'conversation-counts', version: '1',
      initialReducerCalls: 1, unchangedReadReducerCalls: 0, first: { state: { messages: 1 } },
      excludedCheckpointReopened: true, excluded: { state: { messages: 6 }, revision: { generation: 'g1', point: 6 } },
      recovered: { state: { messages: 4 }, revision: { generation: 'g2' }, reset: { reason: 'recovery', previousRevision: { generation: 'g1', point: 6 } } },
      reopened: { before: { state: { messages: 5 } }, after: { state: { messages: 5 }, reset: null }, reducerCalls: 0 },
      definitionReset: { snapshot: { state: { messages: 5 }, reset: { reason: 'definition' } }, reducerCalls: 5 } },
    returningBranch: { generationBefore: 'g2', generationAfter: 'g2', digestBefore: '1'.repeat(64), digestAfter: '1'.repeat(64),
      oldAttemptReadmitted: false, excludedAncestorReadopted: false, thirdGenerationChecked: true },
    reapply: { originalOperationId: 'op-abandoned', newOperationId: 'op-reapplied', originalAttemptId: 'attempt-abandoned', newAttemptId: 'attempt-reapplied', reapplyOf: 'attempt-abandoned',
      outcome: 'accepted', currentGuardsChecked: true },
    reopen: { identityBefore: 'device-a', identityAfter: 'device-a', operationBefore: { id: 'op-reapplied', status: 'applied' },
      operationAfter: { id: 'op-reapplied', status: 'applied' } },
    inheritedRecovery: { owner: 'application-session', previousGeneration: 'g3', previousNumber: 2, ancestorNumber: 0,
      ancestor: { generation: 'g1', sequence: 2, root: h('a') }, selectedGeneration: 'g4', selectedNumber: 3,
      adopted: { generation: 'g1', sequence: 2, root: h('a') }, sourceRemoved: true, incompleteViewRejected: true,
      proposalDidNotPublishView: true, emptyPeerRejected: true, plannedHandoverRejected: true,
      originalRequest: h('b'), retriedRequest: h('b'), expectedGeneration: 'g3', journalSavedBeforeRetry: true,
      originalSelection: 'g4', retriedSelection: 'g4', retainedDigest: h('c'), restoredDigest: h('c'), freshPeerDigest: h('c'),
      inheritedOperationBefore: { status: 'applied', operationId: 'op-retained' },
      inheritedOperationAfter: { status: 'applied', operationId: 'op-retained' }, excludedSuffixAbsent: true, unknownLoss: true,
      commandResumed: true, floor: { point: { generation: 'g4', sequence: 1, root: h('d') }, selectedGeneration: h('3'),
        localRejected: true, hostRejected: true, journalUnchanged: true, incompleteViewRejected: true } },
    participation: { owner: 'application-session', entry: 'session.participate', automaticConnections: true,
      observedPeerIdentities: ['1'.repeat(64), '2'.repeat(64)],
      statuses: [{ device: '1'.repeat(64), phase: 'coordinating', connectedPeers: ['2'.repeat(64)] },
        { device: '2'.repeat(64), phase: 'following', connectedPeers: ['1'.repeat(64)] }],
      hostOutage: { blocked: true, blockedProbeRejected: true, commandsApplied: 1,
        before: { requests: 9, applicationBodyBytes: 0 }, after: { requests: 9, applicationBodyBytes: 0 } },
      automaticRecovery: { previousGeneration: '3'.repeat(64), selectedGeneration: '4'.repeat(64),
        adopted: { generation: '3'.repeat(64), sequence: 2, root: '6'.repeat(64) }, graceMs: 150, elapsedMs: 200, freshnessBudgetMs: 300_000,
        workload: { commands: 32, textBytesPerCommand: 1024, completion: 'applied', retentionWaits: 1, clock: 'performance.now',
          startedAtMs: 100, appliedAtMs: 500, lastAppliedAtMs: 500, retainedAtMs: 510, disconnectedAtMs: 520, recoveredAtMs: 720,
          lastOperationId: 'freshness-31', observedAdoptedAgeMs: 20, recoveryReadyMs: 200, targetMs: 300_000,
          retained: { payload: { point: { generation: '3'.repeat(64), sequence: 2, root: '6'.repeat(64) }, peer: '2'.repeat(64), storageId: 'survivor' }, signature: 'a'.repeat(128) },
          coordinatorStorageId: 'coordinator', independentStorageId: 'survivor',
          adopted: { generation: '3'.repeat(64), sequence: 2, root: '6'.repeat(64) }, knownLostCommands: 0, scope: 'synthetic boundary test' } },
      broaderRecovery: { selectedGeneration: '5'.repeat(64), adopted: { generation: '4'.repeat(64), sequence: 0, root: '7'.repeat(64) },
        reason: 'freshness-unknown', ageMs: null, approvalRequired: true, staleApprovalRejected: true, proposalId: '8'.repeat(64), commandApplied: true },
      transport: { boundary: 'in-process-fixture-discovery', pendingIntroductions: 0, connections: [{ closed: true }, { closed: true }] } },
  };
}

export function syntheticRtcReport() {
  const report = syntheticReport();
  report.topology = 'independent-native-rtc';
  report.participation.transport.boundary = 'loopback-rtc-fixture-discovery';
  report.publicBoundary.imports.push('@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native');
  report.runtime.dependencies = { lockSha256: 'c'.repeat(64), packages: [{ path: 'node_modules/werift', version: '0.27.0', integrity: 'sha512-synthetic' }] };
  const signaling = { sentMessages: 2, sentBytes: 2048, closed: true };
  report.rtc = { implementation: 'werift', version: '0.27.0', signalingBoundary: 'one-off-in-process-sdp-mailbox',
    candidateSource: 'explicit-loopback-only', interfaceEnumeration: 'disabled-by-native-options',
    byteBoundary: 'authenticated-reliable-application-frames', connections: Array.from({ length: 4 }, () => ({
      peers: ['1'.repeat(64), '2'.repeat(64)], authenticated: true, closed: true, signaling,
      routes: [{ route: 'unknown', localCandidateType: null, remoteCandidateType: null }, { route: 'unknown', localCandidateType: null, remoteCandidateType: null }],
      reliable: { sentBytes: 500, receivedBytes: 500 },
    })) };
  report.hostOutage.transport = { before: { reliable: { sentBytes: 100, receivedBytes: 100 }, signaling },
    after: { reliable: { sentBytes: 500, receivedBytes: 500 }, signaling } };
  return report;
}

export function syntheticHostedReport() {
  const report = syntheticRtcReport();
  report.hostOutage.boundary = 'tendriller-workerd-http';
  report.participation.transport = { boundary: 'tendriller-sdk-introductions', traffic: { worker: {
    invitations: [{ closed: true }, { closed: true }], rendezvous: Array.from({ length: 10 }, () => ({ closed: true })) } } };
  report.publicBoundary.imports.push('@tendriller/core/peers');
  report.rtc.signalingBoundary = 'tendriller-workerd-rendezvous';
  report.host = { runtime: 'workerd', identity: 'synthetic authenticated test accounts',
    participant: { protocol: 'chronolog-participant-v1', route: 'peers/participant', transport: 'public-chronolog-participant',
      clientFiltered: ['database.submit', 'content.chunk', 'ephemeral.signal'],
      hostRejected: ['database.submit', 'content.chunk', 'ephemeral.signal'], clientFilteredHttpRequests: 0 },
    publication: { author: '1'.repeat(64), nonPublisher: '2'.repeat(64), administratorWithoutPublisher: true,
      first: { id: '3'.repeat(64), version: 1, expectedCodeDigest: '4'.repeat(64), servedCodeDigest: '4'.repeat(64) },
      second: { id: '5'.repeat(64), version: 2, previous: '3'.repeat(64), expectedCodeDigest: '6'.repeat(64), servedCodeDigest: '6'.repeat(64) },
      sessionOwned: true, lostReplyAfterPersistence: true, savedIdentityRecovered: true,
      exactRetry: true, alteredBytesRejected: true, nonPublisherRejected: true, staleHeadRejected: true,
      authoredHtmlObserved: true, priorCodeRetained: true, headAndCodeSurviveRestart: true, applicationAuthorityUnchanged: true },
    publicImports: ['@tendriller/core/peers', '@tendriller/engine/testing'], fixtureSha256: '5'.repeat(64),
    dependencies: { lockSha256: '6'.repeat(64) }, artifacts: ['@tendriller/core', '@tendriller/engine'].map(name => ({
      ...report.artifacts[0], name,
    })) };
  const observation = { requestBodyBytes: 2000, worker: { host: { httpRequests: 6, requestBodyBytes: 2000,
    rendezvousUpgrades: 4, rendezvousSentBytes: 4000, rendezvousReceivedBytes: 4000 },
  rendezvous: Array.from({ length: 4 }, () => ({ closed: true, sentBytes: 1000, receivedBytes: 1000 })) } };
  report.hostOutage.observations = { before: structuredClone(observation), after: structuredClone(observation) };
  return report;
}

export function syntheticRelayReport() {
  const report = syntheticHostedReport();
  report.topology = 'independent-native-websocket';
  report.publicBoundary.imports = ['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/websocket', '@tendriller/core/peers'];
  report.hostOutage.content = { bytes: 1024, sha256: h('a'), retainedByPeer: true };
  delete report.rtc; delete report.runtime.dependencies;
  report.relay = { implementation: 'native-websocket', hostRuntime: 'workerd',
    networkBoundary: 'loopback-websocket-to-bounded-test-bridge-to-workerd-websocket',
    forcedDirectFailure: true, directAttempts: 10, independentLanes: ['reliable', 'live'],
    security: 'shared-authenticated-peer-channel', controlOutageScope: 'control-http-only',
    connections: Array.from({ length: 4 }, () => ({ peers: [h('1'), h('2')], authenticated: true,
      route: 'websocket-relay', directAttempts: 2, closed: true, reliable: { sentBytes: 1000, receivedBytes: 1000 } })),
    ownedReconnect: { owner: 'application-session', physicalLinksCut: true, reconnected: true, sameGeneration: true,
      identity: h('2'), beforeConnections: 8, afterConnections: 10 },
    traffic: { boundary: 'actual-workerd-websocket-relay',
      host: { relayUpgrades: 16, relaySentBytes: 16_000, relayReceivedBytes: 16_000 },
      sockets: Array.from({ length: 16 }, (_, index) => ({ lane: index % 2 ? 'live' : 'reliable', closed: true,
        sentBytes: 1000, receivedBytes: 1000, sentBinaryFrames: 2, receivedBinaryFrames: 2, maxQueuedBytes: 1000, plaintextMatches: [] })) } };
  return report;
}

export function syntheticBrowserReport() {
  const digest = 'a'.repeat(64), id = 'b'.repeat(64), other = 'c'.repeat(64);
  const traffic = { controlRequests: 2, controlBodyBytes: 42, signalingRequests: 3, signalingBodyBytes: 1000 };
  const signaling = { descriptions: 2, bytes: 1000, closed: true };
  return {
    format: 'peer-generation-browser/v1', profile: 'peer-generation-v1', mode: 'runtime',
    topology: 'browser-worker-opfs-native-rtc', passed: true, executionManifestDigest: digest,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', version: '0.0.0-fixture', sha256: digest,
      sourceCommit: 'c'.repeat(40), sourceTree: 'd'.repeat(40), sourceDirty: false }],
    fixtures: Array.from({ length: 4 }, (_, index) => ({ path: `fixture-${index}.mjs`, sha256: digest })),
    browserAssets: [{ file: 'page.mjs', sha256: digest }, { file: 'worker.mjs', sha256: digest }],
    browserBundleInputs: ['peer-generation-browser-page.mjs', 'peer-generation-browser-worker.mjs',
      'peer-generation-definition.mjs', 'recovery-choice.mjs', 'node_modules/@chronolog/peer-session/browser.mjs'],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/browser', '@chronolog/peer-session/native',
      '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native'], testTools: ['esbuild', 'playwright'],
      siblingSourceImports: 0, applicationRpcMaps: 0, applicationRetryQueues: 0, residentRequired: false },
    runtime: { dependencies: { lockSha256: digest, packages: Object.entries({ werift: '0.27.0', playwright: '1.65.0', esbuild: '0.28.2' })
      .map(([name, version]) => ({ path: `node_modules/${name}`, version, integrity: 'sha512-synthetic' })) } },
    browser: { implementation: 'chromium', version: '156.0.0', transportOwner: 'dedicated-worker', storage: 'opfs-with-exclusive-web-lock',
      signalingBoundary: 'loopback-fixture-http', controlBoundary: 'chronolog-participant-over-loopback-http',
      nativeCandidateSource: 'explicit-loopback-only', interfaceEnumeration: 'disabled-by-native-options', pageErrors: [],
      observations: { secureContext: true, storage: true, locks: true } },
    ui: { pages: ['board.html', 'compact.html'], domain: 'events', sessionFacade: 'connectApplicationWorker', sentThroughForms: 3,
      reapplicationConfirmed: true, recoveryNoticeVisible: true, originalReviewPreserved: true,
      draftBeforeRestart: 'An unsent draft', draftAfterRestart: 'An unsent draft', draftAfterRecovery: 'An unsent draft' },
    ownership: { workerOnly: true, secondOwnerRefused: true, secondTabRefused: true, unsupportedStorageRefused: true,
      unsupportedFault: 'Worker navigator.storage.getDirectory removed by the fixture', freshDeviceAwaitedKeys: true, pagePrivateKeys: 0,
      initialDeviceId: id, initialStorageId: '00000000-0000-0000-0000-000000000000',
      controlParticipant: { owner: 'application-session', attachRequests: 0 },
      gracefulReopen: { sameDeviceId: true, sameStorageId: true, sameView: true, storedKeysReused: true },
      abruptWorkerReopen: { sameDeviceId: true, sameStorageId: true, sameView: true, durableOperation: true } },
    operations: { cancelledWaitPreservedAttempt: true, resumedExactAttempt: true, enrolledFromPeer: true, receiptPeer: other },
    hostOutage: { blocked: true, blockedProbeRejected: true, commandsApplied: 2, before: traffic, after: structuredClone(traffic),
      transport: { before: { reliable: { sentBytes: 100, receivedBytes: 100 }, signaling },
        after: { reliable: { sentBytes: 500, receivedBytes: 500 }, signaling } },
      liveSignalsObserved: 1, disposablePathsDidNotAppend: true, coherentReadView: true,
      content: { bytes: 32_768, sha256: digest, retainedByBrowser: true } },
    recovery: { originatorClosed: true, originatorStoreUnavailable: true, priorHead: { sequence: 6 }, adoptedPrefix: { sequence: 4 },
      selectedGeneration: id, originalAttempt: { status: 'needsReapply', operationId: 'old-op', attemptId: 'old-attempt' },
      reapplied: { outcome: 'accepted', operationId: 'new-op', attemptId: 'new-attempt' }, reapplyOf: 'old-attempt',
      currentGuardsChecked: true, capturedViewPreserved: true, staleCursorError: 'RecoveredViewError',
      noticesPersisted: 1, transitionJournalEntries: 1 },
    freshPeer: { joinedAfterOriginatorLoss: true, enrolledFromBrowser: true, generation: id, browserViewSha256: digest, nativeViewSha256: digest },
    contentRecovery: { bytes: 131_095, interruptedAfter: 65_536, partialRetentionRefused: true, partialSurvivedRestart: true,
      unavailableRemainderRefused: true, completeAfterReconnect: true, retainedBy: id, retentionSignature: 'a'.repeat(128) },
    connections: Array.from({ length: 4 }, () => ({ authenticated: true, nativeClosed: true, peers: [id, other], signaling,
      routes: Array.from({ length: 2 }, () => ({ route: 'direct', localCandidateType: 'host', remoteCandidateType: 'host' })) })),
  };
}

export function syntheticTaskReport() {
  const operation = { status: 'applied', operationId: 'finish', outcome: 'accepted', attemptId: h('5') };
  return { format: 'peer-generation-consumer/v1', mode: 'runtime', profile: 'peer-generation-v1', passed: true,
    topology: 'independent-packed-tasks', source: { commit: '1'.repeat(40), tree: '2'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', sha256: h('1'), sourceCommit: '1'.repeat(40), sourceTree: '2'.repeat(40), sourceDirty: true }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/sql', '@chronolog/peer-session/sql-native'],
      siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false },
    runtime: { platform: 'synthetic', architecture: 'synthetic' }, executionManifestDigest: h('2'),
    sqlEngine: { implementation: '@dolthub/doltlite@0.11.29', platform: 'synthetic', architecture: 'synthetic', patchSha256: h('1') },
    tasks: { definitionId: 'shared-peer-task-board', signedSchemaDigest: h('1'), schemaAdministrator: h('2'),
      claims: [{ operationId: 'creator', attemptId: h('3'), outcome: 'accepted' }, { operationId: 'member', attemptId: h('4'), outcome: 'rejected' }],
      unauthorizedCompletion: 'rejected', sharedCreatorClosed: true, completionAfterCreatorClosed: 'accepted' },
    recovery: { previousGeneration: h('1'), selectedGeneration: h('2'), previousHead: 7, adoptedPosition: 3,
      retainedDigest: h('3'), recoveredDigest: h('3'), otherPeerDigest: h('3'),
      sqlAndEventsResetTogether: true, inheritedIdentityPreserved: true, returningTailExcluded: true, retryRefused: true,
      originalOperationId: 'creator', originalAttemptId: h('3'), reappliedOperationId: 'reviewed', reappliedAttemptId: h('5'), reapplyOf: h('3') },
    reopen: { identityBefore: h('2'), identityAfter: h('2'), storageBefore: 'member', storageAfter: 'member',
      digestBefore: h('4'), digestAfter: h('4'), operationBefore: operation, operationAfter: structuredClone(operation), epochKeysProvided: false } };
}
