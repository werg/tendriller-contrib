// Produce a complete authored graph from explicit public artifacts and deployment assets.
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';

const { values } = parseArgs({ options: {
  'public-module': { type: 'string' }, deployment: { type: 'string' }, output: { type: 'string' },
} });
if (!values['public-module'] || !values.deployment || !values.output) throw Error('Usage: node checks/build-pages.mjs --public-module /exact/public-application.mjs --deployment /complete/deployment-assets --output /page-output');
const here = dirname(fileURLToPath(import.meta.url));
const publicModule = resolve(values['public-module']), deployment = resolve(values.deployment), output = resolve(values.output);
if (!existsSync(join(deployment, 'bootstrap.mjs'))) throw Error('Deployment assets must include the real bootstrap.mjs');
for (const source of [here, deployment]) {
  const rel = relative(source, output);
  if (!rel || (!rel.startsWith('..' + sep) && rel !== '..')) throw Error('Output must be outside the source and deployment directories');
}
mkdirSync(output, { recursive: true });
if (readdirSync(output).length) throw Error('Use an empty output directory so stale assets cannot enter the publication');
for (const name of ['board.html', 'compact.html']) copyFileSync(join(here, name), join(output, name));
for (const name of readdirSync(join(here, 'shared'))) copyFileSync(join(here, 'shared', name), join(output, name));
copyFileSync(publicModule, join(output, 'public-application.mjs'));
cpSync(deployment, join(output, 'deployment'), { recursive: true, dereference: false });
const files = directory => readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
  if (entry.isSymbolicLink()) throw Error(`Publication assets cannot contain a symlink: ${entry.name}`);
  const path = join(directory, entry.name);
  return entry.isDirectory() ? files(path) : [path];
});
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const manifest = {
  format: 'peer-application-specimen', public_module_sha256: sha256(publicModule),
  entries: ['board.html', 'compact.html'],
  files: files(output).map(path => ({ path: relative(output, path).split(sep).join('/'), sha256: sha256(path) })),
};
writeFileSync(join(output, 'specimen-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Built ${manifest.files.length} explicit assets in ${output}`);
