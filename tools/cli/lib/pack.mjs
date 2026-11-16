import { verifyAssets, syncAssets } from "./assets.mjs";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { join, basename, extname, relative, sep } from "node:path";
// Deterministic publication plan, not a body containing text/base64 file bytes.
// Object transport and publication are distinct operations.
const TYPES = {
  ".html": "text/html", ".htm": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain",
  ".md": "text/markdown", ".webmanifest": "application/manifest+json", ".xml": "application/xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon", ".mp3": "audio/mpeg",
  ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".wasm": "application/wasm",
  ".pdf": "application/pdf", ".csv": "text/csv", ".geojson": "application/geo+json",
};
export function guessType(path) { return TYPES[extname(path).toLowerCase()] || "application/octet-stream"; }
export function shouldSkip(relPath) {
  const parts = relPath.split(/[\\/]/);
  return parts.some(p => p.startsWith(".") || p === "node_modules") || ["_tendril", "_publications"].includes(parts[0]);
}
export function listFiles(dir) {
  const found = [];
  function walk(at) {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name), rel = relative(dir, full).split(sep).join("/");
      if (shouldSkip(rel)) continue;
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in publication: ${rel}`);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) found.push(rel);
      else throw new Error(`Unsupported publication entry: ${rel}`);
    }
  }
  walk(dir);
  return found.sort();
}
function canonical(path) {
  if (!path || path.normalize("NFC") !== path || path.length > 512 || path.startsWith("/") ||
    /[\\\x00-\x1f\x7f]/.test(path) || path.split("/").some(s => !s || s === "." || s === "..") ||
    /^(?:_tendril|_publications)(?:\/|$)/.test(path)) throw new Error(`Unsafe publication path: ${path}`);
  return path;
}
function describe(path, source) {
  const sourceStats = lstatSync(source);
  if (!sourceStats.isFile() || sourceStats.isSymbolicLink()) throw new Error(`Refusing non-file publication entry: ${path}`);
  if (sourceStats.size > 5 * 1024 * 1024) throw new Error(`Publication file exceeds the effective upload limit: ${path}`);
  const bytes = readFileSync(source);
  if (bytes.length > 25 * 1024 * 1024) throw new Error(`Publication file exceeds the platform's hard size cap: ${path}`);
  return { path:canonical(path), type:guessType(path), sha256:createHash("sha256").update(bytes).digest("hex"), size:bytes.length, bytes };
}
/** Return a complete deterministic byte enumeration; the CLI then uploads exact blobs. */
export function pack(target, { as, merge = false, message } = {}) {
  const stats = lstatSync(target);
  if (stats.isSymbolicLink()) throw new Error("Refusing publication source symlink");
  let files;
  if (stats.isDirectory()) {
    if (readdirSync(target).includes('tendril.json')) syncAssets(target);
    verifyAssets(target);
    const paths = listFiles(target);
    if (!paths.length) throw new Error(`nothing to upload in ${target}`);
    if (!merge && !paths.includes("index.html")) throw new Error(`${target} has no index.html (use --no-replace only to update a page with an existing entry)`);
    files = paths.map(p => describe(p, join(target, p)));
  } else if (stats.isFile()) {
    let name = as || basename(target);
    if (!as && /\.html?$/i.test(name)) name = "index.html";
    files = [describe(name, target)];
  } else throw new Error("Publication source must be a regular file or directory");
  return { files, merge, entry:"index.html", ...(message ? { message } : {}) };
}
