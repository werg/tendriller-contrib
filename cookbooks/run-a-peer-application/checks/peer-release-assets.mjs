const bytes = value => new TextEncoder().encode(value);
const html = version => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Release ${version}</title>
<style>body{font:17px/1.6 system-ui;max-width:46rem;margin:4rem auto;padding:0 1.5rem;color:#18382f;background:#f6faf7}textarea{display:block;width:100%;height:7rem;font:inherit;margin:.5rem 0 1rem}button{font:inherit;padding:.5rem .8rem;margin:.3rem .3rem .3rem 0}#error{color:#9b2525}</style></head>
<body><h1>Release <span id="version">${version}</span></h1><p>The current asset graph stays coherent while an approved update waits.</p>
<label for="draft">Unsent draft</label><textarea id="draft"></textarea>
<button id="check-update">Check for updates</button><button id="defer-update" disabled>Defer</button><button id="apply-update" disabled>Apply update</button>
<p id="update-status" role="status">Ready to check.</p><button id="load-lazy">Load this version’s extra module</button><output id="lazy-version"></output>
<p><a href="docs/">Open the nested page</a></p><p id="error" role="alert"></p><script type="module" src="assets/page.mjs"></script></body></html>`;

export function releaseAssets(version, pageModule) {
  if (!/^[A-Z]$/u.test(version)) throw Error('FIXTURE_RELEASE_VERSION_INVALID');
  return [
    { path: 'index.html', mediaType: 'text/html', bytes: bytes(html(version)) },
    { path: 'assets/page.mjs', mediaType: 'text/javascript', bytes: new Uint8Array(pageModule) },
    { path: 'assets/lazy.mjs', mediaType: 'text/javascript', bytes: bytes(`export default ${JSON.stringify(version)};\n`) },
    { path: 'docs/index.html', mediaType: 'text/html', bytes: bytes(`<!doctype html><html><head><title>Nested ${version}</title></head><body><h1>Nested ${version}</h1><script type="module" src="nested.mjs"></script></body></html>`) },
    { path: 'docs/nested.mjs', mediaType: 'text/javascript', bytes: bytes(`document.body.dataset.nested=${JSON.stringify(version)};\n`) },
    { path: 'assets/exact.bin', mediaType: 'application/octet-stream', bytes: new Uint8Array([0, 255, 128, 10, 13, 34, 92, 0, version.charCodeAt(0)]) },
  ];
}
