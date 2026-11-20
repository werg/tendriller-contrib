import { init, parse } from 'es-module-lexer';

await init;

export function rewriteModuleSpecifiers(source, resolveSpecifier) {
  const [imports] = parse(source);
  let result = source;
  for (const entry of imports.toReversed()) {
    if (typeof entry.specifier !== 'string' || entry.glob) continue;
    const replacement = resolveSpecifier(entry.specifier);
    if (replacement === entry.specifier) continue;
    const text = entry.type === 'static' ? replacement : JSON.stringify(replacement);
    result = result.slice(0, entry.start) + text + result.slice(entry.end);
  }
  return result;
}
