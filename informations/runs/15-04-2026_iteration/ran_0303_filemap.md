# File Map — Push 4: Flag/Status Split + Condition Evaluator

## Files Being Modified

### `src/store/narrativeStore.js`
- **What changes:**
  - `flags[]` state replaced by `flag{}` and `status{}` dictionaries.
  - `addFlag` / `updateFlag` / `deleteFlag` actions replaced by `addFlag` / `updateFlag` / `deleteFlag` (boolean-only) and `addStatus` / `updateStatus` / `deleteStatus` (numeric).
  - `deleteFlag` and `deleteStatus` referential integrity checks updated to scan `flags_set[]` and `status_set[]` on nodes, and flag/status IDs in edge `condition.conditions[]`.
  - `newGraph()` and `loadGraph()` reset shape updated to `flag: {}`, `status: {}`.
  - `exportGraph()` emits `schemaVersion: 3`, `flag:`, `status:` keys.
  - Node side effects (`addNode`) initializes `data.flags_set: []`, `data.status_set: []` instead of `data.sideEffects: []`.
- **What must NOT change:** `addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `updateMeta` logic and signatures. `uiStore.getState().clearIfSelected()` call pattern in `deleteNode`/`deleteEdge`. `uiStore.getState().resetSelection()` call in `loadGraph`/`newGraph`.
- **Phases:** Phase 1

---

### `src/utils/conditionEvaluator.js`
- **What changes:**
  - `evaluateClause()` is rewritten to handle two schemas: flag clause `{ flag, state }` and status clause `{ status, min?, max? }`.
  - `evaluateCondition()` is updated to recurse on `conditions[]` (renamed from `clauses`) and support nested groups.
  - The exported function signatures remain: `evaluateCondition(condition, flagState)` and `evaluateClause(clause, flagState)`.
- **What must NOT change:** Export names `evaluateCondition` and `evaluateClause`. Return type: `boolean`. Behavior when `condition` is `null` (returns `true`). Behavior when `conditions` is empty (returns `true`).
- **Phases:** Phase 2

---

### `src/utils/fileSystem.js`
- **What changes:**
  - Schema detection now accepts `schemaVersion: 1`, `2`, and `3`. Versions `1` and `2` both trigger migration; `3` passes through.
  - Migration code for v2→v3: converts `flags[]` into `flag{}` / `status{}`, transforms `node.data.sideEffects[]` into `flags_set[]` / `status_set[]`, transforms edge `condition.clauses[]` into `condition.conditions[]` with typed clause objects.
  - v1→v2 migration path updated to output `flag{}` and `status{}` rather than `flags[]`.
- **What must NOT change:** `exportProject()` function signature. `importProject()` return shape (must match what `loadGraph()` expects). `AbortError` handling. `<a download>` fallback pattern.
- **Phases:** Phase 1 (data model migration), Phase 2 (condition clause migration)

---

### `src/utils/index.js`
- **What changes:** No new exports needed; re-exports are stable. Any renamed utility in `conditionEvaluator.js` must be reflected here if export names change.
- **What must NOT change:** Existing barrel exports for `generateId`, `evaluateCondition`, `evaluateClause`, `exportProject`, `importProject`.
- **Phases:** Phase 2 (if evaluator export names change)

---

### `src/components/FlagManager.jsx`
- **What changes:**
  - Reads `flag{}` (object) instead of `flags[]` (array). Iterates `Object.values(flag)`.
  - Calls `addFlag(name, state)` — `state` is boolean only. `type` selector removed.
  - Delete button calls `deleteFlag(id)` — same blocked/reference pattern preserved.
  - Numeric flags (now statuses) are no longer shown here.
- **What must NOT change:** Name validation display logic. Delete error display pattern. Overall component layout and style conventions.
- **Phases:** Phase 3

---

### `src/components/NodeInspector.jsx`
- **What changes:**
  - Side effect section replaced: `sideEffects[]` rows removed. Added `flags_set` multi-select (list of flag IDs) and `status_set` rows (`statusId` + `amount` numeric input).
  - Reads `flag{}` for flag picker, `status{}` for status picker.
  - Calls `updateNode` with `data.flags_set` and `data.status_set` instead of `data.sideEffects`.
- **What must NOT change:** Label, content, start node toggle, and delete node sections. Multi-collection node lookup pattern. `useUIStore`/`useNarrativeStore` hook usage.
- **Phases:** Phase 3

---

### `src/components/EdgeInspector.jsx`
- **What changes:**
  - Condition clause rows now support two types: flag clause (flag picker + boolean state toggle) and status clause (status picker + min/max numeric inputs).
  - `operator` values stored as lowercase `'and'`/`'or'` to match new condition schema.
  - `condition.clauses` renamed to `condition.conditions` in all read/write operations.
  - `addClause` generates clause objects with a `cond_` prefixed random ID.
- **What must NOT change:** Toggle condition on/off. AND/OR operator radio. Delete clause button. Label field. Delete edge button. Overall inspector layout.
- **Phases:** Phase 3

---

### `src/components/Sidebar.jsx`
- **What changes:**
  - Third tab added: **Status** (renders `StatusManager`).
  - `StatusManager` imported and mounted.
- **What must NOT change:** Inspector tab behavior. Flags tab behavior. `activeTab` state logic. Tab styling pattern.
- **Phases:** Phase 3

---

### `src/store/simulationStore.js`
- **What changes:**
  - `start()` reads `flag{}` and `status{}` to build `initialFlagValues{}` instead of `flags[]`.
  - `applySideEffects()` replaced by two helpers: `applyFlagsSet()` and `applyStatusSet()`.
  - `advance()` applies `flags_set[]` and `status_set[]` from destination node.
  - `computeReachable()` passes updated flag+status values to `evaluateCondition`.
- **What must NOT change:** `isRunning`, `activeNodeId`, `visitedNodeIds`, `traversedEdgeIds`, `reachableEdgeIds`, `reachableNodeIds` state shape. `start()`, `advance()`, `reset()` action names. Import from `store` barrel (not direct file).
- **Phases:** Phase 4

---

## Files Being Created

### `src/components/StatusManager.jsx` *(NEW)*
- **Purpose:** CRUD panel for `status{}` entities. Lists existing statuses with name, value, minValue, maxValue. Add-status form with name validation. Delete with referential integrity check (`deleteStatus`).
- **Pattern:** Follows `FlagManager.jsx` structure exactly.
- **Phase:** Phase 3

---

## Files NOT Touched

| File | Reason |
|------|--------|
| `src/utils/uuid.js` | ID format unchanged for top-level IDs (`f-`, `sp-` prefixes are already valid patterns) |
| `src/store/uiStore.js` | Selection logic unaffected |
| `src/components/GraphCanvas.jsx` | Canvas rendering unaffected |
| `src/components/TopBar.jsx` | No flag/status surface |
| `src/components/nodes/CommonNode.jsx` | Visual only |
| `src/components/nodes/ChoiceNode.jsx` | Visual only |
| `src/components/nodes/EndingNode.jsx` | Visual only |
| `src/components/edges/ConditionalEdge.jsx` | Visual only |
| `src/styles/tokens.css` | Design tokens unchanged |
| `src/styles/global.css` | No new visual states |
| `src/components/index.js` | Only needs update if `StatusManager` is exported from barrel |
| `src/App.jsx`, `src/App.css` | Layout unchanged |
| `src/main.jsx`, `index.html` | Entry points unchanged |
