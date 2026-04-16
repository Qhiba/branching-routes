# Risk Register — Push 4: Flag/Status Split + Condition Evaluator

## Risk 1 — Migration loses numeric flag data during v2→v3 import

**Description:** The v2→v3 migration in `fileSystem.js` converts `flags[]` entries based on `type`. If a flag has `type: 'number'` but is also used in a boolean side effect (e.g., `operation: 'set', value: true`), the migration may misclassify it or produce invalid `status_set` entries.

**Early Detection Signal:** After importing a v2 file, open the Status tab and verify all previously-numeric flags appear as statuses with correct values.

**Mitigation:** Migration code reads `type` field from the source flag entry — this field is always present in v2 schema. Explicit type guard: if `type !== 'boolean'`, route to `status{}`. Log a warning for any flag whose `defaultValue` type doesn't match declared `type`.

---

## Risk 2 — `conditionEvaluator.js` change breaks simulation reachability

**Description:** `evaluateCondition` is called by `simulationStore.computeReachable()`. If the new evaluator signature or internal behavior changes in a way that returns `false` for unconditional edges (those with `condition: null`) or empty condition groups, nodes will appear unreachable during simulation.

**Early Detection Signal:** After Phase 2, start a simulation and verify the first reachable edges highlight correctly. Any empty-condition edges from the start node should be immediately reachable.

**Mitigation:** The guard `if (!condition) return true` and `if (!conditions || conditions.length === 0) return true` must be preserved verbatim. These are the unconditional pass-through cases. Unit test these explicitly if tests are added.

---

## Risk 3 — Referential integrity check misses `status_set` references

**Description:** `narrativeStore.deleteStatus()` must scan `data.status_set[]` on all nodes. If the scan iterates only `data.flags_set` or the old `data.sideEffects`, a status can be deleted while still referenced — orphaning node side effects silently.

**Early Detection Signal:** Add a status, apply it to a node's `status_set`, attempt to delete the status → the delete should be blocked with a reference listing the node ID.

**Mitigation:** `deleteStatus()` iterates `Object.values(state.common)`, `Object.values(state.choice)`, `Object.values(state.ending)` and checks each `node.data.status_set`.  Pattern matches `deleteFlag()` exactly — write both in the same function shape.

---

## Risk 4 — Sidebar phase gap causes React render crash

**Description:** Between Phase 1 (store schema changes) and Phase 3 (UI update), selecting a node and viewing the Inspector may attempt to render the old side effects UI against a node that now has `flags_set` and `status_set` instead of `sideEffects`. This may produce runtime errors if the UI reads `data.sideEffects.map(...)` on `undefined`.

**Early Detection Signal:** After Phase 1, select any node in the Inspector — if a crash occurs, the side effects section is reading the wrong field.

**Mitigation:** In Phase 1, update `NodeInspector`'s side effect section to guard with `data.sideEffects || []` AND additionally suppress rendering until Phase 3 is complete (e.g., render an empty placeholder). Alternatively, complete Phases 1–3 in a single execution if the gap is considered too risky.

---

## Risk 5 — `schemaVersion: 3` export rejected on re-import

**Description:** If `fileSystem.js` import validation still only accepts versions `1` and `2` after Phase 1, any file exported at `schemaVersion: 3` will throw `unsupported_schema_version` when reimported.

**Early Detection Signal:** Export a file after Phase 1 completes, then immediately re-import it. If it throws, the schema acceptance list has not been updated.

**Mitigation:** Update the schema version whitelist in `importProject()` to accept `[1, 2, 3]` in the same commit that updates `exportGraph()` to emit `schemaVersion: 3`. These two changes must be atomic — they live in the same phase (Phase 1).
