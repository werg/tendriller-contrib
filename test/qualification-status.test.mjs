import test from 'node:test';
import assert from 'node:assert/strict';
import { collectorGates } from '../distribution/qualification-status.mjs';

test('missing artifacts and source inspection grant no gate pass', () => {
  const gates = collectorGates(); assert.equal(gates.length, 14);
  assert(gates.every(gate => gate.status === 'not_executed'));
});

test('synthetic measurements qualify only the observed fixtures', () => {
  const gates = collectorGates({ bootstrapVerifiedExtractMs: 12, probeCapabilitiesMs: 3, checkpointRecoveryPass: true });
  assert.deepEqual(gates.filter(gate => gate.status !== 'not_executed').map(gate => gate.id), [6, 11]);
  assert(gates.filter(gate => [6, 11].includes(gate.id)).every(gate => gate.status === 'measured_local_fixture'));
});

test('failed fixture, malformed timing and explicit process observations remain distinct', () => {
  const gates = collectorGates({ bootstrapVerifiedExtractMs: NaN, probeCapabilitiesMs: Infinity, checkpointRecoveryPass: false,
    chronologFastLane: { passedFiles: null } });
  assert.equal(gates.find(gate => gate.id === 6).status, 'not_executed');
  assert.equal(gates.find(gate => gate.id === 11).status, 'failed_local_fixture');
  assert.equal(gates.find(gate => gate.id === 13).status, 'observed_test_process_exit_0');
  assert.match(gates.find(gate => gate.id === 13).evidence, /count: unknown/);
  assert.equal(gates.find(gate => gate.id === 14).status, 'not_executed');
});
