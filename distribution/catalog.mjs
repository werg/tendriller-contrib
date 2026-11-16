import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, dirname, sep } from 'node:path';

const required = ['id', 'title', 'summary'];
const arrays = ['tags', 'choices', 'capabilities', 'related', 'sources'];
const allowedEvidence = new Set(['explained', 'exercised', 'used']);

// Cookbook metadata is deliberately a small, readable frontmatter subset:
// top-level strings and string arrays. No executable tags, aliases, nesting, or
// implicit scalar coercion. JSON strings/arrays are also valid YAML notation.
export function parseCookbook(source, path = 'COOKBOOK.md') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`${path}: expected frontmatter delimited by ---`);
  const metadata = Object.create(null);
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const field = /^([a-z][a-z0-9_]*):\s*(.*)$/.exec(line);
    if (!field) throw new Error(`${path}: metadata must use top-level key: value lines`);
    const [, key, raw] = field;
    if (Object.hasOwn(metadata, key)) throw new Error(`${path}: duplicate metadata ${key}`);
    let value = raw.trim();
    if (value.startsWith('"') || value.startsWith('[')) {
      try { value = JSON.parse(value); }
      catch {
        if (/^\[[a-z0-9 _-]*(?:,[a-z0-9 _-]*)*\]$/i.test(value)) value = value.slice(1, -1).split(',').map(v => v.trim()).filter(Boolean);
        else throw new Error(`${path}: use a quoted string or a JSON/string list for ${key}`);
      }
    } else if (value.startsWith("'")) {
      if (!value.endsWith("'")) throw new Error(`${path}: unclosed quoted value for ${key}`);
      value = value.slice(1, -1).replaceAll("''", "'");
    }
    metadata[key] = value;
  }
  for (const key of required) if (typeof metadata[key] !== 'string' || !metadata[key].trim()) throw new Error(`${path}: ${key} is required`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id)) throw new Error(`${path}: id must be a stable lowercase slug`);
  for (const key of arrays) if (metadata[key] !== undefined && (!Array.isArray(metadata[key]) || metadata[key].some(v => typeof v !== 'string' || !v.trim()))) throw new Error(`${path}: ${key} must contain nonempty strings`);
  if (metadata.evidence !== undefined && !allowedEvidence.has(metadata.evidence)) throw new Error(`${path}: unknown evidence state`);
  if (metadata.group !== undefined && typeof metadata.group !== 'string') throw new Error(`${path}: group must be a string`);
  if (!match[2].trim()) throw new Error(`${path}: the guide body is empty`);
  return { metadata, body: match[2].trim() };
}

export function readCookbooks(root) {
  const directory = resolve(root, 'cookbooks');
  const entries = readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a,b) => a.name.localeCompare(b.name));
  const found = entries.map(entry => {
    const path = `cookbooks/${entry.name}/COOKBOOK.md`;
    const { metadata, body } = parseCookbook(readFileSync(resolve(root, path), 'utf8'), path);
    if (metadata.id !== entry.name) throw new Error(`${path}: id must match its directory`);
    return { ...metadata, path, body };
  });
  const ids = new Set(found.map(entry => entry.id));
  if (ids.size !== found.length) throw new Error('Duplicate cookbook IDs');
  for (const entry of found) for (const id of entry.related || []) if (!ids.has(id)) throw new Error(`${entry.path}: unknown related cookbook ${id}`);
  return found;
}

export function agentPrompt(entry, sourceBase = 'https://github.com/werg/tendriller-contrib/blob/main') {
  return `Read ${sourceBase}/${entry.path}. Inspect my task and existing page before choosing an approach. ${entry.summary} Explain consequential tradeoffs and a plausible alternative. Implement in the page's own style, structure, and ordinary web technology. Treat example state paths, markup, and parameters as choices. Preserve the referenced platform guarantees and verify relevant failure cases. Reading this cookbook does not install software or activate a trusted capability.`;
}

export function readingCatalog(entries) {
  return {
    format: 'tendriller-cookbooks',
    version: 1,
    cookbooks: entries.map(({ body, ...entry }) => ({ ...entry, prompt: agentPrompt(entry) })),
  };
}

export function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
}

export function validateLocalLinks(root, paths) {
  const errors = [];
  for (const path of paths) {
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) { errors.push(`${relative(root,path)}: unsupported link ${href}`); continue; }
      let decoded;
      try { decoded = decodeURIComponent(href.split(/[?#]/)[0]); } catch { errors.push(`${relative(root,path)}: invalid link ${href}`); continue; }
      const target = resolve(dirname(path), decoded);
      const rel = relative(root, target);
      if (rel === '..' || rel.startsWith('..' + sep)) { errors.push(`${relative(root,path)}: link escapes the collection: ${href}`); continue; }
      if (!existsSync(target)) errors.push(`${relative(root,path)}: missing ${href}`);
    }
  }
  return errors;
}
