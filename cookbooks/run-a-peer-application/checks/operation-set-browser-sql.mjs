// Actual browser WASM capability, loaded lazily in the owning Worker only.
import { createBrowserSqlEngine, loadBrowserEngine } from '@chronolog/peer-session/sql-browser';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
export { program, sqlStatement, emit } from '@chronolog/peer-session';
export function browserSqlMaterializer(name) {
  let loaded;
  return async ({ rootPrincipal }) => {
    loaded ??= (async () => {
      const engine = await loadBrowserEngine('/wasm/');
      if (!engine.module.installOpfsSAHPoolVfs) throw Error('BROWSER_SQL_OPFS_UNAVAILABLE');
      const pool = await engine.module.installOpfsSAHPoolVfs({ name: `sql-${name}`, directory: `/qualified-sql-${name}`, initialCapacity: 24 });
      return { engine: createBrowserSqlEngine({ ...engine, vfs: pool.vfsName }), pool };
    })();
    const { engine, pool } = await loaded;
    const runtime = await createSqlMaterializationRuntime({ engine, rootPrincipal, path: '/application.db', checkpointEvery: 1 });
    return { ...runtime, async close() { await runtime.close(); pool.pauseVfs(); } };
  };
}
