import assert from 'node:assert/strict';

export function validatePeerReleaseReport(report) {
  const hex = (value, length = 64) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'peer-release-consumer/v1'); assert.equal(report.profile, 'chronolog-release-v1');
  assert.equal(report.mode, 'runtime'); assert.equal(report.topology, 'independent-packed-workerd-browser'); assert.equal(report.passed, true);
  hex(report.source?.commit, 40); hex(report.source.tree, 40); assert.equal(report.source.dirty, false);
  assert.deepEqual(report.artifacts?.map(value => value.name).sort(), ['@chronolog/peer-session', '@tendriller/core']);
  for (const artifact of report.artifacts) { hex(artifact.sha256); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40); assert.equal(artifact.sourceDirty, false); }
  assert.deepEqual(report.publicBoundary?.imports, ['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/releases', '@tendriller/core']);
  for (const name of ['siblingSourceImports', 'copiedAuthorityStateMachines', 'applicationRetryQueues', 'pageSigningKeys', 'automaticReloads']) assert.equal(report.publicBoundary[name], 0, name);
  assert.equal(report.host?.runtime, 'workerd'); assert.equal(report.host.artifacts.length, 2);
  const sdk = report.artifacts.find(value => value.name === '@tendriller/core');
  for (const artifact of [...report.host.artifacts, report.host.runtimeArtifact]) {
    assert.equal(artifact.sourceCommit, sdk.sourceCommit); assert.equal(artifact.sourceTree, sdk.sourceTree); assert.equal(artifact.sourceDirty, false); hex(artifact.sha256);
  }
  assert.equal(report.host.artifacts.find(value => value.name === sdk.name).sha256, sdk.sha256);
  hex(report.bundle?.sha256); assert.ok(report.bundle.inputs.length > 0); assert.deepEqual(report.bundle.external, ['./lazy.mjs']);
  const publication = report.publication;
  hex(publication?.first.id); hex(publication.next.id); assert.notEqual(publication.first.id, publication.next.id);
  for (const name of ['interruptedPrepared', 'incompleteGraphRefused', 'operationReuseRefused', 'unsafePathRefused', 'exactRequestAfterReopen',
    'hostRestarted', 'nestedBaseVerified', 'observerReopened', 'signedRegressionRefused']) assert.equal(publication[name], true, name);
  assert.equal(publication.uncertain.result, null); assert.deepEqual(publication.committed, publication.retry);
  assert.deepEqual(publication.retry.payload.request, publication.uncertain.request);
  assert.equal(publication.retry.payload.releaseId, publication.next.id);
  assert.notEqual(publication.authoredEntryDigest, publication.renderedEntryDigest); hex(publication.binarySha256);
  const browser = report.browser;
  for (const name of ['draftPreserved', 'explicitApply', 'explicitDefer', 'noAutomaticReload', 'verifiedObserver', 'actualInjectedRuntime']) assert.equal(browser?.[name], true, name);
  assert.equal(browser.before.release, publication.first.id); assert.equal(browser.after.release, publication.next.id);
  assert.equal(browser.oldLazyModule, browser.before.version); assert.equal(browser.newLazyModule, browser.after.version);
  assert.notEqual(browser.before.version, browser.after.version);
  assert.ok(browser.requests.some(value => value.path.includes(`_publications/${publication.first.id}/assets/lazy.mjs`)));
  assert.ok(browser.requests.some(value => value.path.includes(`_publications/${publication.next.id}/assets/lazy.mjs`)));
  assert.equal(report.concurrency.rejectedStatus, 409);
  assert.notEqual(...report.concurrency.competingPublishers);
  assert.equal(report.concurrency.restoredCode.payload.previous, report.concurrency.winning.id);
  assert.equal(report.concurrency.restoredCode.payload.revision, report.concurrency.winning.payload.revision + 1);
  assert.equal(report.concurrency.restoredCode.payload.releaseId, publication.first.id);
  const application = report.application;
  for (const name of ['writerPublicationRefused', 'changedManifestRefused', 'applicationEnvelopeRefused', 'mismatchedBindingRefused']) assert.equal(application[name], true, name);
  assert.equal(application.dataGrantPublishers, false); hex(application.boundRelease);
  assert.equal(application.selectedBound.payload.releaseId, application.boundRelease);
  assert.notEqual(application.previousGeneration, application.selectedGeneration);
  assert.ok(application.previousHead > application.adoptedPosition && application.adoptedPosition > 0);
  assert.deepEqual(application.releaseAfterRecovery, application.releaseBeforeRecovery);
  assert.equal(application.releaseAfterRecovery.activations.at(-1).payload.releaseId, application.boundRelease);
  for (const name of ['revokedPublisherRefused', 'priorReceiptRetained', 'selectedBytesRetained']) assert.equal(report.authorization[name], true, name);
  assert.ok(report.traffic.requests > 0); assert.equal(report.traffic.applicationBodyBytes, 0);
  return { format: 'peer-release-summary/v1', source: report.source, artifacts: report.artifacts, host: report.host,
    bundle: report.bundle, publication, browser, concurrency: report.concurrency, application, authorization: report.authorization,
    limitations: [
      'Actual packed workerd, public SDK, signed registry and Chromium runtime; a loopback fixture supplies synthetic authenticated accounts.',
      'The browser explicitly refreshes updates. Real activation WebSocket delivery is qualified in the host public Workerd suite.',
      'Application recovery uses direct authenticated native peers; this gate does not measure deployed networks, production credentials or eviction.',
    ] };
}
