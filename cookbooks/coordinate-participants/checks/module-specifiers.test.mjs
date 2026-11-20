import assert from 'node:assert/strict';
import test from 'node:test';
import { rewriteModuleSpecifiers } from './module-specifiers.mjs';

test('rewriting imports preserves ordinary application strings and comments', () => {
  const source = `import { value } from '@tendriller/core';
export { x } from '@tendriller/core/browser';
const data = '@tendriller/core';
const instruction = "import '@tendriller/core'";
// import '@tendriller/core';
const module = await import('@tendriller/core/browser');`;
  const result = rewriteModuleSpecifiers(source, specifier => specifier.replace('@tendriller/core', './core/index.mjs'));
  assert.match(result, /from '\.\/core\/index\.mjs'/);
  assert.match(result, /from '\.\/core\/index\.mjs\/browser'/);
  assert.match(result, /import\("\.\/core\/index\.mjs\/browser"\)/);
  assert.ok(result.includes("const data = '@tendriller/core'"));
  assert.ok(result.includes('const instruction = "import \'@tendriller/core\'"'));
  assert.ok(result.includes("// import '@tendriller/core'"));
});
