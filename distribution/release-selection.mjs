// Exact selection of the current Tendriller release composition for qualification
// telemetry. The release manifest and composition document, not a filename glob,
// name every archive; each selected archive is verified by size and SHA-256.
// Obsolete or extra files in the directory never participate in selection.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export class ReleaseSelectionError extends Error {
  constructor(code, message) { super(message); this.name = 'ReleaseSelectionError'; this.code = code; }
}

/** Exactly the profiles a current release must bind (mirrors the core release composition). */
export const CURRENT_PROFILES = Object.freeze({
  events: Object.freeze({ session: 'session', packages: Object.freeze(['sdk', 'tools', 'authority', 'session']) }),
  sql: Object.freeze({ session: 'session-sql-browser', packages: Object.freeze(['sdk', 'tools', 'authority', 'session-sql-browser']) }),
});
export const SELECTED_ROLES = Object.freeze(['sdk', 'runtime', 'tools', 'authority', 'session', 'session-sql-browser']);

const SHA40 = /^[a-f0-9]{40}$/u, SHA64 = /^[a-f0-9]{64}$/u, SAFE_NAME = /^[A-Za-z0-9._-]+$/u;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => { throw new ReleaseSelectionError(code, message); };
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function readJson(path, code, label) {
  if (!existsSync(path)) fail(code, `${label} is not present: ${path}`);
  const malformed = code.replace(/_MISSING$/u, '_FORMAT');
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(malformed, `${label} must be a JSON object: ${path}`);
    return value;
  } catch (error) {
    if (error instanceof ReleaseSelectionError) throw error;
    return fail(malformed, `${label} is unreadable or not valid JSON: ${path}`);
  }
}

function expectedFile(role, version, source) {
  if (['sdk', 'runtime', 'tools'].includes(role)) return `tendriller-${role}-${version}.tgz`;
  if (role === 'authority') return `chronolog-authority-${source}.tgz`;
  if (role === 'session') return `chronolog-peer-session-${source}.tgz`;
  return `chronolog-peer-session-${source}-sql-browser.tgz`;
}

function cleanSource(identity, repository, label) {
  if (identity?.repository !== repository || !SHA40.test(identity.source ?? '') || !SHA40.test(identity.sourceTree ?? '') || identity.dirty !== false)
    fail('SOURCE_NOT_CLEAN', `${label} must identify a clean ${repository} source and tree.`);
}

/**
 * Select and verify one release directory (a core `dist/`). Throws
 * ReleaseSelectionError with a stable `code`; returns only fully verified facts.
 */
export function selectRelease(distDir) {
  const manifest = readJson(join(distDir, 'manifest.json'), 'MANIFEST_MISSING', 'Release manifest');
  if (manifest.format !== 'tendriller-core-release') fail('MANIFEST_FORMAT', 'Unsupported release manifest format.');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/u.test(manifest.version ?? '') || !Number.isSafeInteger(manifest.contract) ||
      !SHA40.test(manifest.source_commit ?? '') || !SHA40.test(manifest.source_tree ?? '') || !SHA64.test(manifest.runtime ?? ''))
    fail('MANIFEST_IDENTITY', 'The manifest must name its version, contract, exact source commit/tree and runtime.');
  const compositionFile = manifest.composition?.file;
  if (typeof compositionFile !== 'string' || !SAFE_NAME.test(compositionFile)) fail('COMPOSITION_REF', 'The manifest names no safe composition file.');
  const composition = readJson(join(distDir, compositionFile), 'COMPOSITION_MISSING', 'Release composition');
  const { id, ...body } = composition;
  if (composition.format !== 'tendriller-release-composition-v1' || id !== sha256(JSON.stringify(body)) || id !== manifest.composition.id ||
      composition.version !== manifest.version || composition.contract !== manifest.contract || composition.runtime !== manifest.runtime)
    fail('COMPOSITION_IDENTITY', 'The composition identity, version, contract and runtime must match the manifest and its contents.');
  cleanSource(composition.core, 'werg/tendriller', 'Core source');
  if (composition.core.source !== manifest.source_commit || composition.core.sourceTree !== manifest.source_tree)
    fail('SOURCE_MISMATCH', 'The composition core source must equal the manifest source.');
  cleanSource(composition.chronolog?.authority, 'werg/chronolog-db', 'Chronolog authority source');
  for (const role of ['session', 'authority', 'session-sql-browser']) {
    cleanSource(composition.chronolog?.[role], 'werg/chronolog-db', `Chronolog ${role} source`);
    if (composition.chronolog[role].source !== composition.chronolog.authority.source ||
        composition.chronolog[role].sourceTree !== composition.chronolog.authority.sourceTree)
      fail('SOURCE_MISMATCH', 'The Chronolog session, authority and SQL archives must come from one source.');
  }
  if (!sameJson(composition.profiles, CURRENT_PROFILES))
    fail('PROFILES', 'The release must bind exactly the current events and browser SQL profiles; an obsolete or extended profile set is not accepted.');

  const kernelSource = composition.chronolog.authority.source;
  if (!Array.isArray(composition.components) || !Array.isArray(manifest.artifacts))
    fail('ROLE_RECORD', 'Manifest artifacts and composition components must be arrays.');
  const components = {};
  for (const role of SELECTED_ROLES) {
    const inComposition = composition.components?.filter(item => item?.role === role) ?? [];
    const inManifest = manifest.artifacts?.filter(item => item?.role === role) ?? [];
    if (inComposition.length !== 1 || inManifest.length !== 1)
      fail('ROLE_AMBIGUOUS', `The release must bind exactly one ${role} archive in both its manifest and composition.`);
    const [component] = inComposition, [artifact] = inManifest;
    const file = expectedFile(role, manifest.version, kernelSource);
    if (component.file !== file || artifact.file !== file) fail('ROLE_FILE', `The ${role} archive must be named ${file}.`);
    if (!SAFE_NAME.test(file) || !Number.isSafeInteger(component.size) || !SHA64.test(component.sha256 ?? '') ||
        component.size !== artifact.size || component.sha256 !== artifact.sha256)
      fail('ROLE_RECORD', `The manifest and composition disagree about the ${role} archive.`);
    if (artifact.url !== `https://github.com/werg/tendriller/releases/download/source-${manifest.source_commit}/${file}`)
      fail('ROLE_URL', `The ${role} archive must use its canonical source-qualified URL.`);
    const path = join(distDir, file);
    if (!existsSync(path)) fail('ARCHIVE_MISSING', `The selected ${role} archive is not present: ${file}`);
    const bytes = readFileSync(path);
    if (bytes.length !== component.size || sha256(bytes) !== component.sha256)
      fail('ARCHIVE_DIGEST', `The ${role} archive does not match its recorded size and SHA-256.`);
    components[role] = Object.freeze({ role, file, path, size: component.size, sha256: component.sha256 });
  }
  return Object.freeze({
    version: manifest.version, contract: manifest.contract, runtime: manifest.runtime, compositionId: id,
    source: Object.freeze({ core: composition.core, chronolog: composition.chronolog.authority }),
    components: Object.freeze(components), profiles: CURRENT_PROFILES,
  });
}

/** Never throws: a blocked or absent release is reported, not hidden. */
export function inspectRelease(distDir) {
  try {
    if (!existsSync(join(distDir, 'manifest.json'))) return { status: 'absent', code: 'MANIFEST_MISSING', reason: `No release manifest at ${distDir}; no gate was executed.` };
    return { status: 'verified', release: selectRelease(distDir) };
  } catch (error) {
    if (error instanceof ReleaseSelectionError) return { status: 'blocked', code: error.code, reason: error.message };
    return { status: 'blocked', code: 'RELEASE_INSPECTION_FAILED', reason: `Release inspection failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export const profileBytes = (release, profile) =>
  CURRENT_PROFILES[profile].packages.reduce((sum, role) => sum + release.components[role].size, 0);
