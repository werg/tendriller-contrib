// Evidence and pricing are separate inputs. Missing measurements stay unknown.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const COST_BOUNDARIES = ['hosting', 'membership', 'relay', 'blob', 'native-agent', 'backup', 'observability'];
export const WORKLOADS = ['table-and-contested-claim', 'chat-and-transient-progress', 'final-intent-crash-recovery',
  'first-device-catch-up-and-reconnect', 'capture-and-blob', 'enrollment-retry-restart-revocation'];
export const MEASUREMENTS = ['cloudflare-active-duration', 'cloudflare-requests', 'storage-row-writes', 'retained-storage',
  'relay-egress', 'agent-cpu-disk-network', 'browser-memory-replay', 'history-growth', 'backup-lag',
  'administrator-descriptor-control-key-traffic', 'full-peer-payload-traffic'];
const SHA256 = /^[a-f0-9]{64}$/;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
function requireValue(condition, message) { if (!condition) throw Error(message); }
function list(value, name) { requireValue(Array.isArray(value), `${name} must be an array`); return value; }
function text(value, name) { requireValue(nonempty(value), `${name} must identify its source or reason`); }
function unique(values, name) { requireValue(new Set(values).size === values.length, `${name} contains duplicates`); }
function timestamp(value, name) { requireValue(nonempty(value) && Number.isFinite(Date.parse(value)), `${name} must be a date`); }

export function createUsageTemplate() {
  const unknown = () => ({ status: 'unmeasured', evidence: null, reason: 'Collect the named raw measurement in the deployed run.' });
  return { format: 'peer-application-cost-usage/v1', currency: 'USD', workloadSha256: null,
    cases: ['hosted', 'peer-direct', 'peer-relayed'].map(id => ({ id, mode: id === 'hosted' ? 'hosted' : 'peer',
      setting: 'unmeasured', route: id === 'hosted' ? 'hosted' : id.slice(5), artifacts: {}, topologyEvidence: null,
      window: { startedAt: null, finishedAt: null }, hostedHibernation: unknown(),
      workloads: Object.fromEntries(WORKLOADS.map(name => [name, unknown()])),
      measurements: Object.fromEntries(MEASUREMENTS.map(name => [name, unknown()])),
      costs: Object.fromEntries(COST_BOUNDARIES.map(name => [name, { ...unknown(), charges: [] }])) })) };
}

/** Difference in account charge with and without one measured workload.
 * Included usage is applied once to the stated account baseline, never once per
 * request or phase. billingStep=0 means proportional charging; otherwise round
 * excess units upward before applying the unit rate.
 */
export function incrementalCharge(quantity, priorAccountUsage, price) {
  requireValue(finite(quantity) && finite(priorAccountUsage), 'Quantities and account baseline must be finite nonnegative numbers');
  requireValue(finite(price.includedUnits) && finite(price.billingStep) && finite(price.rate) && finite(price.unitSize) && price.unitSize > 0,
    'Invalid rate, included allocation, unit size, or billing step');
  const charge = usage => {
    const excess = Math.max(0, usage - price.includedUnits);
    const billable = price.billingStep === 0 ? excess : Math.ceil(excess / price.billingStep) * price.billingStep;
    return billable / price.unitSize * price.rate;
  };
  requireValue(finite(priorAccountUsage + quantity), 'Combined account usage is outside the supported numeric range');
  const amount = charge(priorAccountUsage + quantity) - charge(priorAccountUsage);
  requireValue(finite(amount), 'Calculated charge is outside the supported numeric range');
  return Number(amount.toPrecision(12));
}

function evidenceStatus(item, name, { allowUnused = true } = {}) {
  requireValue(item && ['measured', 'unmeasured', ...(allowUnused ? ['not-used'] : [])].includes(item.status), `${name} has an invalid status`);
  if (item.status === 'unmeasured') text(item.reason, `${name}.reason`);
  else text(item.evidence, `${name}.evidence`);
  if (item.status === 'not-used') text(item.reason, `${name}.reason`);
  return item.status !== 'unmeasured';
}

export function calculateCosts(usage, pricebook) {
  requireValue(usage?.format === 'peer-application-cost-usage/v1', 'Unsupported usage format');
  requireValue(pricebook?.format === 'peer-application-pricebook/v1', 'Unsupported pricebook format');
  requireValue(/^[A-Z]{3}$/.test(usage.currency) && usage.currency === pricebook.currency, 'Currency mismatch');
  timestamp(pricebook.checkedAt, 'pricebook.checkedAt');
  requireValue(usage.workloadSha256 === null || SHA256.test(usage.workloadSha256), 'Invalid workload SHA-256');
  const prices = new Map();
  for (const price of list(pricebook.rates, 'prices')) {
    text(price.meter, 'price.meter'); text(price.unit, 'price.unit');
    requireValue(!prices.has(price.meter), `Duplicate price for ${price.meter}`);
    requireValue(typeof price.source === 'string' && /^https:\/\//.test(price.source), `Price source required: ${price.meter}`);
    timestamp(price.checkedAt ?? pricebook.checkedAt, `price date: ${price.meter}`);
    incrementalCharge(0, 0, price); prices.set(price.meter, price);
  }
  const inputCases = list(usage.cases, 'cases');
  requireValue(inputCases.length > 0, 'At least one measured or explicitly unmeasured case is required');
  unique(inputCases.map(item => item.id), 'case IDs');
  const cases = inputCases.map(input => {
    text(input.id, 'case.id');
    requireValue(['hosted', 'peer'].includes(input.mode), `Invalid case mode: ${input.id}`);
    requireValue(['unmeasured', 'native-loopback', 'local-workerd', 'deployed'].includes(input.setting), `Invalid setting: ${input.id}`);
    requireValue(['hosted', 'loopback', 'direct', 'relayed'].includes(input.route), `Invalid route: ${input.id}`);
    requireValue(input.costs && Object.keys(input.costs).every(name => COST_BOUNDARIES.includes(name)),
      `Unknown cost boundary: assign every provider charge to a declared boundary`);
    const gaps = [], boundaries = {}, meters = new Set();
    let knownSubtotal = 0;
    for (const name of COST_BOUNDARIES) {
      const boundary = input.costs?.[name];
      evidenceStatus(boundary, `${input.id}.costs.${name}`);
      const charges = list(boundary.charges, `${name}.charges`);
      requireValue(boundary.status === 'measured' ? charges.length > 0 : charges.length === 0,
        `${name}: measured requires charges; unmeasured/not-used must not carry charges`);
      if (boundary.status === 'unmeasured') gaps.push(`cost:${name}`);
      const calculated = charges.map(charge => {
        text(charge.meter, `${name}.meter`);
        requireValue(!meters.has(charge.meter), `Duplicate meter ${charge.meter}: aggregate the account usage once`);
        meters.add(charge.meter); text(charge.evidence, `${charge.meter}.evidence`);
        requireValue(charge.quantity === null || finite(charge.quantity), `Invalid quantity: ${charge.meter}`);
        requireValue(charge.priorAccountUsage === null || finite(charge.priorAccountUsage), `Invalid account baseline: ${charge.meter}`);
        const price = prices.get(charge.meter);
        if (price) requireValue(price.unit === charge.unit, `Unit mismatch for ${charge.meter}: no implicit conversion is allowed`);
        if (!price || charge.quantity === null || charge.priorAccountUsage === null) {
          gaps.push(`meter:${charge.meter}:${!price ? 'price' : charge.quantity === null ? 'quantity' : 'account-baseline'}`);
          return { ...charge, amount: null, price: price ?? null };
        }
        const amount = incrementalCharge(charge.quantity, charge.priorAccountUsage, price);
        knownSubtotal += amount;
        return { ...charge, amount, price };
      });
      boundaries[name] = { status: boundary.status, evidence: boundary.evidence, reason: boundary.reason, charges: calculated };
    }
    const costGaps = [...gaps];
    for (const name of WORKLOADS) if (!evidenceStatus(input.workloads?.[name], `${input.id}.workload.${name}`, { allowUnused: false })) gaps.push(`workload:${name}`);
    for (const name of MEASUREMENTS) if (!evidenceStatus(input.measurements?.[name], `${input.id}.measurement.${name}`)) gaps.push(`measurement:${name}`);
    if (input.mode === 'hosted' && !evidenceStatus(input.hostedHibernation, 'hostedHibernation', { allowUnused: false })) gaps.push('hosted-hibernation');
    if (input.setting !== 'deployed') gaps.push('deployed-setting');
    if (!nonempty(input.topologyEvidence)) gaps.push('topology-evidence');
    if (!input.artifacts || Object.keys(input.artifacts).length === 0) gaps.push('artifact-pins');
    else for (const [name, digest] of Object.entries(input.artifacts)) requireValue(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(digest), `Invalid artifact/source pin: ${name}`);
    if (input.window?.startedAt === null || input.window?.finishedAt === null) gaps.push('measurement-window');
    else {
      timestamp(input.window?.startedAt, 'window.startedAt'); timestamp(input.window?.finishedAt, 'window.finishedAt');
      requireValue(Date.parse(input.window.finishedAt) > Date.parse(input.window.startedAt), 'Measurement window must have positive duration');
    }
    if (usage.workloadSha256 === null) gaps.push('workload-fingerprint');
    return { id: input.id, mode: input.mode, setting: input.setting, route: input.route,
      boundaries, knownSubtotal: Number(knownSubtotal.toPrecision(12)),
      total: costGaps.length === 0 ? Number(knownSubtotal.toPrecision(12)) : null,
      costsComplete: costGaps.length === 0, deploymentEvidenceComplete: gaps.length === 0, gaps };
  });
  const comparisons = [];
  for (const baseline of cases.filter(item => item.mode === 'hosted')) for (const peer of cases.filter(item => item.mode === 'peer')) {
    const accountUsage = item => new Map(Object.values(item.boundaries).flatMap(boundary => boundary.charges)
      .map(charge => [charge.meter, charge.priorAccountUsage]));
    const baselineAccount = accountUsage(baseline), peerAccount = accountUsage(peer);
    const sameAccountBaseline = [...baselineAccount].every(([meter, prior]) => !peerAccount.has(meter) || peerAccount.get(meter) === prior);
    const complete = baseline.deploymentEvidenceComplete && peer.deploymentEvidenceComplete && sameAccountBaseline;
    comparisons.push({ baseline: baseline.id, peer: peer.id, comparable: complete,
      sameAccountBaseline,
      peerMinusHosted: complete ? Number((peer.total - baseline.total).toPrecision(12)) : null,
      reason: complete ? 'Identical workload fingerprint with complete declared deployed evidence and measured cost boundaries.'
        : 'A price table or partial measurements cannot establish hosted/peer savings.' });
  }
  return { format: 'peer-application-cost-report/v1', currency: usage.currency, workloadSha256: usage.workloadSha256,
    pricingCheckedAt: pricebook.checkedAt, cases, comparisons,
    scope: 'Incremental charge for the measured workload at the supplied account baseline; include allocated fixed charges as explicit meters. Not an invoice forecast.' };
}

export function summarizeNativeMembership(raw, digest) {
  requireValue(raw?.format === 'chronolog-membership-cost/v1' && raw.passed === true, 'A passing native membership measurement is required');
  requireValue(SHA256.test(digest), 'Raw report SHA-256 required');
  const traffic = raw.final?.traffic;
  assert.equal(traffic.applicationEnvelopeBytesToAdministrator, 0, 'Administrator received application envelopes');
  assert.equal(traffic.unexpectedAdministratorRequests, 0, 'Administrator attempted an unexpected endpoint');
  const phases = raw.phases.map(phase => ({ name: phase.name, candidates: phase.result?.count ?? null,
    descriptorBytes: phase.result?.descriptorBytes ?? null, detachedEnvelopeBytes: phase.result?.detachedEnvelopeBytes ?? null,
    administratorPutCalls: phase.administrator.durablePutCalls, administratorValueBytesWritten: phase.administrator.durableValueBytesWritten,
    administratorRetainedValueBytes: phase.administrator.after.retainedValueBytes,
    nativeLiveFileBytes: phase.nativeStorage.after.bytes, processResources: phase.resources, elapsedMs: phase.elapsedMs }));
  return { format: 'peer-membership-cost-summary/v1', rawReportSha256: digest, source: raw.source,
    setting: raw.topology, phases, administrator: raw.final.administrator, closedStorage: raw.final.closedStorage,
    traffic: { ...traffic, descriptorBytesIncludingInlineControls: traffic.candidateDescriptorBytes + traffic.inlineControlDescriptorBytes,
      note: 'Inline control envelope bytes are already inside inline control descriptor bytes. HTTP body totals include framing/certificates and repeated transfers.' },
    providerCosts: null, hostedPeerSavings: null, missing: ['deployed hosted baseline and hibernation', 'public direct and relay routes',
      'provider metered usage and account allocation', 'browser memory and replay', 'blob copies and backup lag', 'paired full application workload'],
    limits: raw.limits };
}

async function main() {
  const { values } = parseArgs({ options: { template: { type: 'boolean', default: false },
    usage: { type: 'string' }, prices: { type: 'string' }, 'native-report': { type: 'string' }, output: { type: 'string' } } });
  requireValue(Boolean(values.output), 'Supply --output with a new JSON file');
  const modes = Number(values.template) + Number(Boolean(values['native-report'])) + Number(Boolean(values.usage));
  requireValue(modes === 1, 'Choose --template, --native-report FILE, or --usage FILE --prices FILE');
  let result;
  if (values.template) result = createUsageTemplate();
  else if (values['native-report']) {
    const raw = await readFile(resolve(values['native-report']));
    result = summarizeNativeMembership(JSON.parse(raw.toString('utf8')), createHash('sha256').update(raw).digest('hex'));
  } else {
    requireValue(Boolean(values.prices), 'Supply --prices separately from measured usage');
    const usage = await readFile(resolve(values.usage)), prices = await readFile(resolve(values.prices));
    result = { ...calculateCosts(JSON.parse(usage.toString('utf8')), JSON.parse(prices.toString('utf8'))),
      inputs: { usageSha256: createHash('sha256').update(usage).digest('hex'), pricesSha256: createHash('sha256').update(prices).digest('hex') } };
  }
  await writeFile(resolve(values.output), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  console.log(`Cost evidence: ${resolve(values.output)}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
