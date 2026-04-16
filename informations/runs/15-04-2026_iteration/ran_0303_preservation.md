# Preservation Plan — Push 4: Flag/Status Split + Condition Evaluator

## PROTECTED Items (must survive all phases unchanged)

### Referential Integrity
**Behavior:** Deleting a flag or status that is referenced in any edge condition or node side effect raises a blocked result with a list of references, rather than silently deleting.

**How the plan preserves it:**
- `narrativeStore.deleteFlag()` and `deleteStatus()` scan all three node collections (`common{}`, `choice{}`, `ending{}`) checking `data.flags_set[]` and `data.status_set[]` respectively.
- Both actions also scan `edges[]` checking `condition.conditions[]` for the relevant clause type (`flag` field for flags, `status` field for statuses).
- The same `{ blocked: true, references: [] }` return shape is preserved — `FlagManager` and `StatusManager` display the error identically.

**What confirms it survived:**
- Add a flag, use it in an edge condition. Attempt to delete the flag → expect a blocked result listing the edge ID.
- Add a status, use it in an edge condition. Attempt to delete the status → expect a blocked result listing the edge ID.
- Add a flag, apply it in a node's `flags_set`. Attempt to delete the flag → expect a blocked result listing the node ID.

---

### Architecture Rules (all must hold)

- **AR-03 (State in Zustand):** All `flag{}` and `status{}` data lives in `narrativeStore`. `StatusManager` and `FlagManager` are read-only consumers calling store actions — no direct mutations.
- **AR-04 (Data Layer Separation):** No component writes to the store directly. All changes go through `addFlag`, `deleteFlag`, `addStatus`, `deleteStatus`, `updateNode`, `updateEdge`.
- **AR-05 (Single Source of Truth):** `narrativeStore` is canonical. `exportGraph()` serializes exactly what is in the store. No derived copies or local shadow state.
- **AR-06 (Import Constraints):** `StatusManager` uses the `store` barrel import. No direct file imports.
- **AR-07 (Condition Evaluation in Evaluator):** All evaluation logic — including the new status range checks — lives exclusively in `conditionEvaluator.js`. No evaluation logic in components or store actions.
- **AR-09 (Schema Version Stability):** `schemaVersion` bumped from `2` to `3` in `exportGraph()`. Import function rejects versions other than `1`, `2`, `3`.
- **AR-10 (No External Backend):** No network calls introduced. `fileSystem.js` remains File System Access API + fallback only.
- **AR-11 (Side Effects on Nodes Only):** The new `flags_set[]` / `status_set[]` are on nodes only. Edges still carry no side effects — only conditions and routing.
- **AR-12 (Ending Node Structural Constraint):** Unaffected — ending sub-collection separation is unchanged.

---

## ACKNOWLEDGED RISK Items

### Simulation Sandbox Logic
**Accepted impact:** The `simulationStore` must be updated in Phase 4 to read `flags_set[]` and `status_set[]` instead of `sideEffects[]`. Until Phase 4 completes, node side effects will not fire during simulation. The canvas remains visually stable (reachable/active states still render), but flag/status values will not change during traversal.

**What contains the blast radius:**
- Phase 4 is the final phase and is explicitly scoped to this fix. The simulation does not crash — it simply won't apply side effects.
- The `computeReachable()` function is updated in Phase 4 alongside `advance()`, so condition evaluation is consistent.
- `isRunning`, `activeNodeId`, `visitedNodeIds`, `traversedEdgeIds` states are never touched — simulation structure remains intact.

---

### Inspector Binding
**Accepted impact:** `NodeInspector` and `EdgeInspector` will be non-functional for their side effect / condition areas between Phase 1 (when the store schema changes) and Phase 3 (when the UI is updated). During this window, rendering the inspector for a node with existing `sideEffects` data may produce React errors if the old UI attempts to bind to a missing field.

**What contains the blast radius:**
- Phase 1 ensures all *new* nodes are created with `flags_set: []` and `status_set: []`. No undefined access on fresh data.
- The migration in `fileSystem.js` ensures imported v2 files also have correctly shaped node data before reaching the UI.
- The Phase 3 UI update is the phase immediately following Phase 2 — the gap is minimized.
- Label, content, start node toggle, and delete node actions in `NodeInspector` are not affected by this window.
