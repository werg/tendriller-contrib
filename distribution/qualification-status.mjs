// Collector observations do not qualify unrelated product/transport gates.
const definitions = [
  [1, 'No native toolchain for events packages'], [2, 'Portable SQL execution and persistence'],
  [3, 'Windows pipe / Unix path / loopback IPC'], [4, 'HTTP gateway and remote/local MCP'],
  [5, 'Browser coordination and diagnostics'], [6, 'Capability probe and bootstrap fixture'],
  [7, 'Startup convergence and bounded mode'], [8, 'Pre-submission outbox and exact operation identity'],
  [9, 'SQL starter and composition profiles'], [10, 'OS and JavaScript runtime matrix'],
  [11, 'Encrypted checkpoint retirement/restore fixture'], [12, 'Host deployment templates'],
  [13, 'Explicit kernel fast-test process'], [14, 'Live external cloud-agent surfaces'],
];

export function collectorGates(observations = {}) {
  return definitions.map(([id, name]) => {
    let status = 'not_executed', evidence = 'Not executed by this collector. Source presence, configured CI and another gate are not pass evidence.';
    if (id === 6 && Number.isFinite(observations.bootstrapVerifiedExtractMs) && Number.isFinite(observations.probeCapabilitiesMs)) {
      status = 'measured_local_fixture'; evidence = 'Probe and synthetic bootstrap extraction completed; no live app, public composition or cross-platform qualification implied.';
    }
    if (id === 11 && typeof observations.checkpointRecoveryPass === 'boolean') {
      status = observations.checkpointRecoveryPass ? 'measured_local_fixture' : 'failed_local_fixture';
      evidence = 'One synthetic local export/retire/restore check; not a live device handoff or general anti-split-brain qualification.';
    }
    if (id === 13 && observations.chronologFastLane) {
      status = 'observed_test_process_exit_0';
      evidence = `Explicit fast-test process exited zero; parsed passed file count: ${observations.chronologFastLane.passedFiles ?? 'unknown'}. This is separate from public release qualification.`;
    }
    return { id, name, status, evidence };
  });
}
