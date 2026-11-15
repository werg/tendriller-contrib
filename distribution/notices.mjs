import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

/** Preserve notices for the packages actually present in a bundled executable. */
export function bundledNotices(inputs, root) {
  const packages = new Map();
  for (const input of Object.keys(inputs)) {
    const absolute = resolve(root, input).replaceAll('\\', '/');
    const marker = absolute.lastIndexOf('/node_modules/');
    if (marker < 0) continue;
    const suffix = absolute.slice(marker + '/node_modules/'.length).split('/');
    const name = suffix[0].startsWith('@') ? suffix.slice(0, 2).join('/') : suffix[0];
    const directory = absolute.slice(0, marker) + '/node_modules/' + name;
    if (!existsSync(join(directory, 'package.json'))) continue;
    const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    if (name.startsWith('@tendriller/')) continue; // Project provenance is supplied separately; no license is invented.
    const identity = `${pkg.name}@${pkg.version}`;
    if (packages.has(identity)) continue;
    let paths = readdirSync(directory).filter(name => /^(?:licen[cs]e|notice|copying)(?:\.|$)/i.test(name));
    if (!paths.length) paths = readdirSync(directory).filter(name => /^readme(?:\.|$)/i.test(name));
    if (!paths.length) throw Error(`No distributed license or notice source found for bundled package ${identity}.`);
    const text = paths.sort().map(path => `${path}\n${readFileSync(join(directory, path), 'utf8')}`).join('\n\n');
    packages.set(identity, `${identity}\nPackage license metadata: ${pkg.license || 'not declared'}\n\n${text}`);
  }
  return [...packages].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value).join('\n\n' + '='.repeat(72) + '\n\n');
}
