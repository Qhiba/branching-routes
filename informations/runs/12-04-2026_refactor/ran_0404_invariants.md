# Invariant Preservation Plan — Branching Routes Refactor

**Source:** `ran_0402_first-audit.md` — Behavioral Invariants, Data Contract Invariants, Load-Bearing Assumptions

---

## Behavioral Invariants

### BI-01 — First node auto-becomes start node (`isStartNode: true`)

**How preserved:** `addNode` logic is unchanged in `narrativeStore.js`. The check `state.nodes.length === 0` runs identically.
**Test:** Add a node to an empty graph → `useNarrativeStore.getState().nodes[0].data.isStartNode === true`.

---

### BI-02 — `setStartNode(id)` sets exactly one start node

**How preserved:** `setStartNode` action is unchanged. It maps all nodes, setting `isStartNode: n.id === id`.
**Test:** Call `setStartNode(id)` → only target node has `isStartNode: true`.

---

### BI-03 — `deleteNode(id)` cascades to remove all connected edges

**How preserved:** The `set()` call in `deleteNode` filters both `nodes` and `edges` arrays atomically within a single Zustand update. This logic is unchanged in `narrativeStore.js`.
**Test:** Delete a node → no edge in `edges` has `sourceId` or `targetId` matching the deleted ID.

---

### BI-04 — `deleteNode(id)` clears `selectedNodeId` if it matches

**How preserved:** Phase 2 migration (S25). After `narrativeStore.deleteNode` completes its `set()`, it calls `useUIStore.getState().clearIfSelected(id, 'node')`. Functionally equivalent because both operations are synchronous and React batches the resulting renders.
**Test:** Select a node, call `deleteNode` → `useUIStore.getState().selectedNodeId === null`.

---

### BI-05 — `deleteEdge(id)` clears `selectedEdgeId` if it matches

**How preserved:** Same pattern as BI-04. Phase 2 migration wires `useUIStore.getState().clearIfSelected(id, 'edge')` after `deleteEdge`'s `set()`.
**Test:** Select an edge, call `deleteEdge` → `useUIStore.getState().selectedEdgeId === null`.

---

### BI-06 — `addEdge` rejects edges from ending nodes (AR-12)

**How preserved:** Guard logic inside `addEdge` is unchanged in `narrativeStore.js`.
**Test:** Call `addEdge(endingNodeId, anyId)` → throws `Error("Cannot add an edge from an 'ending' node")`.

---

### BI-07 — `addEdge` rejects duplicate edges between same source/target

**How preserved:** Duplicate check inside `addEdge` is unchanged in `narrativeStore.js`.
**Test:** Add same edge twice → second call throws `Error("Edge already exists between these nodes")`.

---

### BI-08 — `deleteFlag` blocks deletion when flag is referenced

**How preserved:** `deleteFlag` referential traversal (LBA-04) is unchanged. It traverses `e.condition.clauses[].flagId`, `e.sideEffects[].flagId`, and `n.data.sideEffects[].flagId`. No structural change to nodes/edges/flags shapes occurs in this refactor.
**Test:** Reference a flag in an edge condition → `deleteFlag` returns `{ blocked: true, references: [...] }`.

---

### BI-09 — `addFlag` validates name against `/^[a-zA-Z0-9_]+$/` (AR-02)

**How preserved:** Validation regex in `addFlag` is unchanged in `narrativeStore.js`.
**Test:** `addFlag('bad name!', ...)` → throws `Error('Invalid flag name')`.

---

### BI-10 — Simulation side effect order: edge first, then destination node (AR-11)

**How preserved:** `simulationStore.advance()` is not touched by this refactor. The `applySideEffects` call order is unchanged.
**Test:** Edge SFX sets flagX = 1, node SFX adds flagX + 5 → after advance, flagX === 6.

---

### BI-11 — Simulation `start()` initializes flags from `defaultValue`

**How preserved:** `simulationStore.start()` reads `graphState.flags` via `useNarrativeStore.getState()` (updated in Phase 4). The initialization logic is unchanged.
**Test:** Set flag `defaultValue: 42` → start simulation → `currentFlagValues[flagId] === 42`.

---

### BI-12 — Simulation `reset()` clears all ephemeral state

**How preserved:** `simulationStore.reset()` is unchanged. It sets all fields to their initial values.
**Test:** Run simulation → reset → all fields match initial state shape (AR-08).

---

### BI-13 — Simulation never mutates `graphStore` (AR-08)

**How preserved:** `simulationStore` only calls `useNarrativeStore.getState()` for reads. It never calls any action on `narrativeStore`. This pattern is unchanged.
**Test:** Snapshot `narrativeStore` state → run full simulation → snapshot again → deep equal.

---

### BI-14 — `exportGraph` produces `schemaVersion: 1` (AR-09)

**How preserved:** `exportGraph` return object is unchanged: `{ schemaVersion: 1, meta, nodes, edges, flags }`. `fileSystem.js` import check `data.schemaVersion !== 1` is unchanged.
**Test:** Export → output contains `schemaVersion: 1`.

---

### BI-15 — `exportGraph` formats timestamps as DD-MM-YYYY strings

**How preserved:** `formatTs` helper inside `exportGraph` is unchanged in `narrativeStore.js`.
**Test:** Export → `meta.createdAt` matches `/^\d{2}-\d{2}-\d{4}$/`.

---

### BI-16 — `loadGraph` resets selection state to null

**How preserved:** Phase 2 migration. `narrativeStore.loadGraph()` calls `useUIStore.getState().resetSelection()` after its `set()`. `newGraph()` does the same.
**Test:** Select a node → load a different graph → `useUIStore.getState().selectedNodeId === null`.

---

### BI-17 — `evaluateCondition(null, flags)` returns `true`

**How preserved:** `conditionEvaluator.js` is PROTECTED. Untouched.
**Test:** `evaluateCondition(null, {}) === true`.

---

### BI-18 — `evaluateCondition` defaults to AND when operator is not `'OR'`

**How preserved:** `conditionEvaluator.js` is PROTECTED. Untouched.
**Test:** Condition with two clauses, no operator → both must pass for `true`.

---

## Data Contract Invariants

### DC-01 — Export JSON top-level shape

**How preserved:** `exportGraph` return object unchanged. `fileSystem.js` unchanged.
**Test:** Export → JSON has top-level keys: `schemaVersion`, `meta`, `nodes`, `edges`, `flags`.

---

### DC-02 — Node shape

**How preserved:** `addNode` creates nodes with the same shape as before. No field names change.
**Test:** Add a node → `nodes[0]` has `{ id, type, position, data: { label, content, isStartNode, sideEffects } }`.

---

### DC-03 — Edge shape

**How preserved:** `addEdge` creates edges with the same shape. No field names change.
**Test:** Add an edge → `edges[0]` has `{ id, sourceId, targetId, label, condition, sideEffects }`.

---

### DC-04 — Flag shape

**How preserved:** `addFlag` creates flags with the same shape. No field names change.
**Test:** Add a flag → `flags[0]` has `{ id, name, type, defaultValue }`.

---

### DC-05 — ID format: UUID v4 string

**How preserved:** Phase 3 adds a prefix to new IDs. Existing IDs in loaded files remain as bare UUIDs. String comparison lookups (`find(n => n.id === id)`) work on both formats — both are strings.
**Test (new):** Create a node → `id` matches `/^n-[0-9a-f-]{36}$/`. **Test (legacy):** Load a file with bare UUID IDs → graph loads without error.

---

### DC-06 — Condition clause references flags by `flagId`

**How preserved:** No changes to condition evaluation, condition structure, or how flags are keyed in `currentFlagValues`.
**Test:** Simulation evaluates condition with `flagId` match → correct boolean result.

---

### DC-07 — CSS variable naming in `tokens.css`

**How preserved:** Phase 1 only changes color values, not variable names. All 60 variable names are preserved exactly.
**Test:** After Phase 1, open app → all elements render correctly with updated colors.

---

## Load-Bearing Assumptions

### LBA-01 — Synchronous cross-store read via `getState()`

**How preserved:** `simulationStore` continues to call `useNarrativeStore.getState()` synchronously. No indirection, no selector layer, no async. Updated in Phase 4 (import rename only).
**Test:** Run simulation → simulation advances correctly using current graph state.

---

### LBA-02 — Flat ID strings with no prefix (legacy compatibility)

**How preserved:** Phase 3 (Parallel Support strategy). `loadGraph` accepts any string as an ID. Both `"xxxxxxxx-..."` and `"n-xxxxxxxx-..."` are valid.
**Test:** Load a file with old-format IDs → graph loads, simulation starts, no errors.

---

### LBA-03 — `isStartNode` on `node.data`

**How preserved:** `addNode` and `setStartNode` are unchanged. `simulationStore.start()` still reads `n.data.isStartNode`.
**Test:** `nodes.find(n => n.data && n.data.isStartNode)` returns exactly one node after any operation.

---

### LBA-04 — `deleteFlag` traverses nested condition and side effect structures

**How preserved:** The traversal logic at `graphStore.js:L110-129` (now `narrativeStore.js`) is entirely unchanged. The data structures it traverses (edge conditions, side effects) have the same shape.
**Test:** Reference a flag deep inside an edge condition clause → `deleteFlag` detects and blocks.

---

### LBA-05 — Selection-clearing atomicity on delete

**How preserved:** Phase 2 migration (S25 In-place migration strategy). Cross-store sequential calls replace the previous single `set()`. Functionally equivalent within a single synchronous event handler.
**Test:** Select a node, delete it (via UI button) → sidebar inspector unmounts cleanly with no null-reference error.
