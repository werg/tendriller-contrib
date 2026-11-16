import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { calculateCosts, COST_BOUNDARIES, createUsageTemplate, incrementalCharge, MEASUREMENTS, WORKLOADS,
  summarizeNativeMembership } from './cost-report.mjs';

const price = { meter: 'durable-requests', unit: 'request', includedUnits: 1_000_000,
  unitSize: 1_000_000, billingStep: 1_000_000, rate: 0.15,
  source: 'https://developers.cloudflare.com/durable-objects/platform/pricing/' };
const pricebook = () => ({ format: 'peer-application-pricebook/v1', currency: 'USD', checkedAt: '2026-11-16', rates: [{ ...price }] });

function measuredInput() {
  const usage = createUsageTemplate();
  usage.workloadSha256 = 'a'.repeat(64);
  for (const item of usage.cases) {
    item.setting = 'deployed'; item.topologyEvidence = 'topology.json#sha256:reviewed'; item.artifacts = { core: 'b'.repeat(40) };
    item.window = { startedAt: '2026-11-16T12:00:00Z', finishedAt: '2026-11-16T12:30:00Z' };
    item.hostedHibernation = { status: 'measured', evidence: 'provider-usage.json#idle-window' };
    for (const name of WORKLOADS) item.workloads[name] = { status: 'measured', evidence: `workload.json#${name}` };
    for (const name of MEASUREMENTS) item.measurements[name] = { status: 'measured', evidence: `measurements.json#${name}` };
    for (const name of COST_BOUNDARIES) item.costs[name] = { status: 'not-used', reason: 'Test fixture declares no use.', evidence: 'topology.json', charges: [] };
    item.costs.membership = { status: 'measured', evidence: 'account-meters.json', charges: [{ meter: 'durable-requests', unit: 'request',
      quantity: item.mode === 'hosted' ? 2_000_000 : 1_000_000, priorAccountUsage: 1_000_000, evidence: 'account-meters.json#requests' }] };
  }
  return usage;
}

test('unknown usage and account allocation do not become zero cost or savings', () => {
  const result = calculateCosts(createUsageTemplate(), pricebook());
  assert.equal(result.cases.length, 3);
  for (const item of result.cases) {
    assert.equal(item.total, null); assert.equal(item.costsComplete, false);
    assert.ok(item.gaps.includes('cost:backup')); assert.ok(item.gaps.includes('workload:capture-and-blob'));
  }
  assert.ok(result.comparisons.every(item => item.comparable === false && item.peerMinusHosted === null));
  const usage = measuredInput(); usage.cases[0].costs.membership.charges[0].priorAccountUsage = null;
  const missing = calculateCosts(usage, pricebook());
  assert.equal(missing.cases[0].total, null);
  assert.ok(missing.cases[0].gaps.includes('meter:durable-requests:account-baseline'));
});

test('included units are consumed once and billable-unit rounding applies before pricing', () => {
  assert.equal(incrementalCharge(500_000, 0, price), 0);
  assert.equal(incrementalCharge(500_000, 900_000, price), 0.15);
  assert.equal(incrementalCharge(500_000, 1_100_000, price), 0);
  assert.equal(incrementalCharge(1_000_001, 1_000_000, price), 0.30);
  assert.equal(incrementalCharge(100, 10_000_000, { ...price, includedUnits: 10_000_000, billingStep: 0, rate: 0.30 }), 0.00003);
});

test('comparable declared deployed workloads calculate the difference and local cases do not', () => {
  const usage = measuredInput(), result = calculateCosts(usage, pricebook());
  assert.equal(result.cases[0].total, 0.30);
  assert.equal(result.cases[1].total, 0.15);
  assert.equal(result.comparisons[0].peerMinusHosted, -0.15);
  usage.cases[1].setting = 'native-loopback';
  const local = calculateCosts(usage, pricebook());
  assert.equal(local.cases[1].total, 0.15);
  assert.equal(local.comparisons[0].peerMinusHosted, null);
  usage.cases[1].setting = 'deployed'; usage.cases[0].hostedHibernation = { status: 'unmeasured', reason: 'No provider idle-window export.' };
  assert.equal(calculateCosts(usage, pricebook()).comparisons[0].comparable, false);
  const changedBaseline = measuredInput(); changedBaseline.cases[1].costs.membership.charges[0].priorAccountUsage = 0;
  const changed = calculateCosts(changedBaseline, pricebook()).comparisons[0];
  assert.equal(changed.comparable, false); assert.equal(changed.sameAccountBaseline, false);
});

test('unknown providers, inconsistent units and duplicate meters cannot disappear into a total', () => {
  const usage = measuredInput(), book = pricebook();
  book.rates = [];
  const result = calculateCosts(usage, book);
  assert.equal(result.cases[0].total, null);
  assert.ok(result.cases[0].gaps.includes('meter:durable-requests:price'));
  usage.cases[0].costs.membership.charges[0].unit = 'byte';
  assert.throws(() => calculateCosts(usage, pricebook()), /Unit mismatch/);
  usage.cases[0].costs.membership.charges[0].unit = 'request';
  usage.cases[0].costs.hosting = structuredClone(usage.cases[0].costs.membership);
  assert.throws(() => calculateCosts(usage, pricebook()), /Duplicate meter/);
});

test('invalid numbers, fabricated zeros, missing provenance and incomplete workload coverage fail closed', () => {
  for (const value of [-1, NaN, Infinity, '100', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => incrementalCharge(value, 0, price));
  assert.throws(() => incrementalCharge(1, 0, { ...price, unitSize: 0 }));
  const usage = measuredInput();
  usage.cases[0].costs.backup = { status: 'measured', evidence: 'none', charges: [] };
  assert.throws(() => calculateCosts(usage, pricebook()), /measured requires charges/);
  usage.cases[0].costs.backup = { status: 'not-used', evidence: '', reason: 'none', charges: [] };
  assert.throws(() => calculateCosts(usage, pricebook()), /evidence/);
  const book = pricebook(); book.rates[0].source = '';
  assert.throws(() => calculateCosts(measuredInput(), book), /Price source/);
  const incomplete = measuredInput(); delete incomplete.cases[0].workloads['capture-and-blob'];
  assert.throws(() => calculateCosts(incomplete, pricebook()), /invalid status/);
});

test('native summaries preserve encoded boundaries without adding inline envelopes twice', () => {
  const raw = { format: 'chronolog-membership-cost/v1', passed: true, phases: [], source: {}, topology: {}, limits: [], final: {
    traffic: { applicationEnvelopeBytesToAdministrator: 0, unexpectedAdministratorRequests: 0,
      candidateDescriptorBytes: 568, inlineControlDescriptorBytes: 1352, inlineControlEnvelopeBytes: 1056 },
  } };
  const summary = summarizeNativeMembership(raw, 'f'.repeat(64));
  assert.equal(summary.traffic.descriptorBytesIncludingInlineControls, 1920);
  assert.equal(summary.providerCosts, null); assert.equal(summary.hostedPeerSavings, null);
  raw.final.traffic.applicationEnvelopeBytesToAdministrator = 1;
  assert.throws(() => summarizeNativeMembership(raw, 'f'.repeat(64)), /Administrator received/);
  raw.passed = false;
  assert.throws(() => summarizeNativeMembership(raw, 'f'.repeat(64)), /passing native/);
});

test('published reference rates remain dated inputs instead of overriding unknown measurements', async () => {
  const frozen = JSON.parse(await readFile(new URL('../notes/evidence/2026-11-16-cloudflare-pricebook.json', import.meta.url), 'utf8'));
  const result = calculateCosts(createUsageTemplate(), frozen);
  assert.equal(result.pricingCheckedAt, '2026-11-16');
  assert.ok(result.cases.every(item => item.total === null));
});
