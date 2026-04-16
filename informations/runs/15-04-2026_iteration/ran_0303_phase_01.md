# Phase 1 — State & Import/Export Data Model

## Goal
Migrate the store and persistence layer from `flags[]` to `flag{}` + `status{}`, bump schema to v3, and add the v2→v3 import migration path — so all downstream phases work against a stable, correct data shape.

## What It Changes
- `narrativeStore` state shape: `flags: []` → `flag: {}`, `status: {}`.
- `addFlag(name, type, defaultValue)` → `addFlag(name, state)` (boolean), plus new `addStatus(name, value, minValue, maxValue)`.
- `updateFlag(id, patch)` → unchanged signature, now operates on `flag{}`.
- `deleteFlag(id)` → referential integrity scan updated to check `data.flags_set[]` on nodes and `flag` field in edge `condition.conditions[]`.
- `deleteStatus(id)` → new action; referential integrity scans `data.status_set[]` on nodes and `status` field in edge `condition.conditions[]`.
- `addNode()` initializes nodes with `data.flags_set: []`, `data.status_set: []` (not `data.sideEffects: []`).
- `newGraph()` resets to `flag: {}`, `status: {}`.
- `loadGraph()` accepts GraphData with `flag`, `status` keys.
- `exportGraph()` emits `schemaVersion: 3`, `flag:`, `status:`.
- `fileSystem.js` `importProject()`: accepts `schemaVersion` 1, 2, 3. v2→v3 migration converts `flags[]` → `flag{}` + `status{}`, transforms `node.data.sideEffects[]` → `flags_set[]` / `status_set[]`, transforms edge `condition.clauses[]` → `condition.conditions[]`.

## Produces
- `src/store/narrativeStore.js` — modified
- `src/utils/fileSystem.js` — modified

## Migration Step
**MIGRATION REQUIRED** — Parallel Support strategy (see `ran_0303_migrationstrategy.md`).

In `fileSystem.js` `importProject()`:
1. v2→v3 block: for each entry in `data.flags[]` → route to `flag{}` if `type === 'boolean'`, route to `status{}` if `type === 'number'`.
2. For each node across all three collections: read `data.sideEffects[]`, emit `data.flags_set[]` / `data.status_set[]`, remove `data.sideEffects`.
3. For each edge with a non-null `condition`: rename `clauses` → `conditions`, lowercase `operator`, transform each clause to typed clause object.
4. v1→v2 migration path is extended to also output `flag{}` / `status{}` directly (skips the intermediate `flags[]` output).

## What It Leaves Temporarily Inconsistent
- `NodeInspector.jsx` still reads `data.sideEffects` — will render nothing (guarded by `|| []`) but side effect editing is unavailable until Phase 3.
- `FlagManager.jsx` still reads `state.flags` — will render an empty list (flags array no longer exists) until Phase 3.
- `EdgeInspector.jsx` condition clauses still reference old shape — will render no clauses until Phase 3.
- `simulationStore.js` still reads `state.flags[]` and `node.data.sideEffects` — simulation side effects will not fire until Phase 4.

**Resolved by:** Phase 3 (UI), Phase 4 (simulation).

## What the Next Phase Depends on From This Phase
- Phase 2 (`conditionEvaluator.js`) depends on the new edge condition shape existing in persisted data (for tests/verification).
- Phase 3 (UI) depends on `narrativeStore` exposing `flag{}`, `status{}`, `addFlag`, `addStatus`, `deleteFlag`, `deleteStatus`, `updateFlag`, `updateStatus`.
- Phase 4 (simulation) depends on nodes having `data.flags_set[]` and `data.status_set[]`.

## Reference Files Needed
- `src/store/narrativeStore.js` (current implementation)
- `src/utils/fileSystem.js` (current implementation)
- `ran_0303_migrationstrategy.md`
- `informations/docs/example_datamodel.json` (v2 shape reference)

## Rollback Cost If This Phase Fails
**MEDIUM** — Reverting `narrativeStore.js` and `fileSystem.js` restores v2 behavior. No UI or evaluator files changed. Any data exported at schemaVersion 3 during this phase cannot be reimported by the reverted importer.

## Hard Stop Triggers
- `loadGraph()` fails to accept a valid v3 exported file.
- `newGraph()` produces a state with `flags` key still present.
- Import of a v2 file produces a state where any `flag{}` or `status{}` key has the wrong value type.

## Acceptance Criteria
- Done when: `narrativeStore.getState()` contains `flag: {}`, `status: {}` with no `flags` key. `exportGraph()` returns a payload with `schemaVersion: 3`, `flag:`, `status:`, no `flags:` key. Importing a v2 file populates `flag{}` and `status{}` correctly.

## Verification
Open the app (fresh state). Open browser console and run:
```js
useNarrativeStore.getState()
```
Confirm the result has `flag: {}` and `status: {}` fields, and no `flags` field.

Export the default empty graph. Open the JSON file and confirm: `"schemaVersion": 3`, `"flag": {}`, `"status": {}`, no `"flags"` key.

Import the example v2 datamodel file. Confirm no error is thrown and the imported state has `flag` and `status` populated from the original `flags[]` entries.
