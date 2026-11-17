// Build complete peer-session pages from a verified public archive and explicit deployment.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { session: { type: 'string' }, deployment: { type: 'string' }, output: { type: 'string' } } });
if (!values.session || !values.deployment || !values.output) throw Error('Usage: --session /extracted/public/peer-session --deployment /complete/bootstrap-assets --output /new/page-graph');
const here = dirname(fileURLToPath(import.meta.url)), session = resolve(values.session), deployment = resolve(values.deployment), output = resolve(values.output);
const metadata = JSON.parse(readFileSync(join(session, 'package.json'), 'utf8'));
assert.equal(metadata.name, '@chronolog/peer-session');
const provenance = JSON.parse(readFileSync(join(session, 'provenance.json'), 'utf8'));
assert.equal(provenance.profile, 'peer-generation-v1');
for (const [name, digest] of Object.entries(provenance.sha256)) {
  const file = resolve(session, name), path = relative(session, file);
  assert.ok(path && !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
  assert.equal(hash(readFileSync(file)), digest, `Public artifact changed: ${name}`);
}
assert.ok(existsSync(join(deployment, 'bootstrap.mjs')), 'The deployment must provide a real owned Worker session');
for (const source of [here, session, deployment]) {
  const path = relative(source, output);
  assert.ok(path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path), 'Output must be outside its source trees');
}
mkdirSync(output, { recursive: true }); assert.equal(readdirSync(output).length, 0, 'Use an empty output directory');
cpSync(join(here, 'peer-ui'), output, { recursive: true });
copyFileSync(join(here, 'shared/typing.mjs'), join(output, 'typing.mjs'));
cpSync(session, join(output, 'peer-session'), { recursive: true, dereference: false });
cpSync(deployment, join(output, 'deployment'), { recursive: true, dereference: false });
mkdirSync(join(output, 'domain'));
for (const name of ['peer-task-board.mjs', 'peer-conversation.mjs']) {
  const code = readFileSync(join(here, '../snippets', name), 'utf8').replaceAll("'@chronolog/peer-session'", "'../peer-session/index.mjs'");
  writeFileSync(join(output, 'domain', name), code);
}
const files = walk(output).map(file => ({ path: relative(output, file).split(sep).join('/'), sha256: hash(readFileSync(file)) }));
writeFileSync(join(output, 'specimen-manifest.json'), JSON.stringify({ format: 'peer-session-pages/v1', entries: ['board.html', 'compact.html'],
  session: { version: metadata.version, source: provenance.source, sourceTree: provenance.sourceTree, dirty: provenance.dirty }, files }, null, 2) + '\n');
console.log(`Built ${files.length} assets with explicit deployment ownership and public session provenance.`);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    assert.equal(entry.isSymbolicLink(), false, 'Published graphs must not contain symbolic links');
    const file = join(directory, entry.name); return entry.isDirectory() ? walk(file) : [file];
  });
}
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
