// An application-owned reset guard, authored through the supplied public bundle.
import { program, emit, sqlStatement } from './public-application.mjs';

const MAX_GENERATION = Number.MAX_SAFE_INTEGER;
const topic = 'scoped-state';

function scopeId(scope) {
  if (typeof scope !== 'string' || scope.length === 0 || scope.length > 128) throw new TypeError('Invalid state scope');
  return scope;
}

function generation(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('Invalid captured generation');
  return value;
}

function guard(scope, expectedGeneration) {
  return sqlStatement("SELECT chronolog_assert(EXISTS(SELECT 1 FROM app_scoped_state WHERE scope = ? AND generation = ?), 'scope_generation_changed')",
    [scope, expectedGeneration]);
}

/** Initialize this example's table and one scope once, under the schema owner. */
export function initializeScopedState({ scope, value = null }) {
  scopeId(scope);
  const event = emit(topic, { type: 'scope.initialized', version: 1, scope, generation: 0, value });
  return program(
    sqlStatement(`CREATE TABLE app_scoped_state (scope TEXT PRIMARY KEY, generation INTEGER NOT NULL CHECK(generation >= 0 AND generation <= ${MAX_GENERATION}), value_json TEXT NOT NULL) STRICT`),
    sqlStatement('INSERT INTO app_scoped_state (scope, generation, value_json) VALUES (?, 0, ?)',
      [scope, JSON.stringify(event.payload.value)]),
    event,
  );
}

/** Capture expectedGeneration when reviewing the edit; never re-read it on retry. */
export function setScopedState({ scope, expectedGeneration, value }) {
  scopeId(scope); generation(expectedGeneration);
  const event = emit(topic, { type: 'state.set', version: 1, scope, generation: expectedGeneration, value });
  return program(
    guard(scope, expectedGeneration),
    sqlStatement('UPDATE app_scoped_state SET value_json = ? WHERE scope = ? AND generation = ?',
      [JSON.stringify(event.payload.value), scope, expectedGeneration]),
    event,
  );
}

/** A reset replaces the value and advances the generation in the same program. */
export function rotateScopedState({ scope, expectedGeneration, value = null }) {
  scopeId(scope); generation(expectedGeneration);
  if (expectedGeneration === MAX_GENERATION) throw new RangeError('Scope generation is exhausted');
  const nextGeneration = expectedGeneration + 1;
  const event = emit(topic, { type: 'scope.rotated', version: 1, scope,
    previousGeneration: expectedGeneration, generation: nextGeneration, value });
  return program(
    guard(scope, expectedGeneration),
    sqlStatement("SELECT chronolog_assert(? < ?, 'scope_generation_exhausted')", [expectedGeneration, MAX_GENERATION]),
    sqlStatement('UPDATE app_scoped_state SET generation = ?, value_json = ? WHERE scope = ? AND generation = ?',
      [nextGeneration, JSON.stringify(event.payload.value), scope, expectedGeneration]),
    event,
  );
}
