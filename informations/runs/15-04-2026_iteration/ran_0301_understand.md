# 0301 Understand: Data Model, Condition Evaluation, Form Layer

### 1. What It Does Now
The system manages game variables using a single array of `flags` in the `narrativeStore` (file: `src/store/narrativeStore.js`). Flags can be numerical or boolean.
During simulation (`src/store/simulationStore.js`), node `sideEffects` mutate these flags via `set`, `add`, or `subtract` operations, updating a `currentFlagValues` dictionary. 
Edges evaluate conditions recursively in `src/utils/conditionEvaluator.js` by checking `currentFlagValues` against the edge's `condition.clauses` using standard operators (`==, !=, >, >=, <, <=`). 
The Form Layer (`src/components/EdgeInspector.jsx`, `src/components/NodeInspector.jsx`) directly modifies node `sideEffects` and edge `condition.clauses` via Zustand store actions (`updateNode`, `updateEdge`).

### 2. Input / Output Contract
- **Data Model:** `narrativeStore` imports/exports a `schemaVersion: 2` payload containing `flags[]`, `edges[]`, `common{}`, `choice{}`, `ending{}`, and `meta{}`.
- **Condition Evaluator:** `evaluateCondition(condition, flagState)` accepts an object `{ operator: 'AND'/'OR', clauses: [{ flagId, comparator, value }] }` and a map `{ 'f-uuid': value }`. It outputs a `boolean`.
- **Form Layer:** Inspectors accept nothing (they read global store state internally) and output actions to `narrativeStore`. They display forms mapping flat variables to dropdowns/inputs.

### 3. Full Dependency Map
- **`narrativeStore.js`:** 
  - Depends on: `utils/uuid.js` for ID generation (`f-{uuid}`, `n-{uuid}`, etc).
  - Depended on by: `GraphCanvas`, `EdgeInspector`, `NodeInspector`, `FlagManager`, `TopBar`, `fileSystem.js`, `simulationStore.js`.
  - Breaking the contract: Breaking the `flags` structure will break the `uiStore` sync, `conditionEvaluator`, `FlagManager`, and `exportGraph/importGraph`.
- **`conditionEvaluator.js`:**
  - Depends on: Nothing.
  - Depended on by: `simulationStore.advance`, `simulationStore.start` (via `computeReachable`).
  - Breaking the contract: Changing input shape will crash simulation branch logic.
- **`NodeInspector.jsx` / `EdgeInspector.jsx`:**
  - Depends on: `narrativeStore`, `uiStore`.
  - Depended on by: `Sidebar.jsx`.

### 4. Implicit Assumptions
- Callers mapping `sideEffects` and `condition.clauses` assume `flags` is a flat array of objects, and any item can be boolean or number.
- `simulationStore.js` assumes side effects are shaped exactly as `{ flagId, operation, value }` arrays.
- `EdgeInspector.jsx` assumes conditions are structured with top-level `AND`/`OR` and a list of `clauses`.
- Persistence layer assumes `flags` is exported/imported as `flags: [...]`.

### 5. Change Surface
If the flag/status split and condition evaluator changes are made (Push 4), the following are affected:
- **Input contract:** `fileSystem.js` must handle mapping legacy `flags` or expect `flag{}` and `status{}`.
- **Output contract:** `exportGraph` will emit `flag{}` and `status{}` instead of `flags[]`.
- **Side effects:** Node `sideEffects` shape will change to `flags_set[]` and `status_set[]`.
- **Data model fields:** `flags[]` is deprecated.
- **Entity ID format:** New prefix `sp-` for status points, `f-` for flags. IDs will change.

### 6. Persistence Inventory
**edges[] (containing conditions)**
- Where it is written: `src/store/narrativeStore.js`, `addEdge`, line 101; `updateEdge`, line 126
- Where it is read back: `exportGraph` (line 265), `loadGraph` (line 220), `simulationStore.js` `advance` (line 85)
- Storage layer: File system JSON via `exportProject`
- Current format: Array of objects (`condition` is nested object)
- Is the key name itself persisted: YES → MIGRATION REQUIRED

**flags[]**
- Where it is written: `src/store/narrativeStore.js`, `addFlag`, line 140
- Where it is read back: `exportGraph` (line 266), `loadGraph` (line 221)
- Storage layer: File system JSON via `exportProject`
- Current format: Array of objects
- Is the key name itself persisted: YES → MIGRATION REQUIRED

**node.data.sideEffects**
- Where it is written: `src/store/narrativeStore.js` via `updateNode` (line 41), manipulated by `NodeInspector.jsx` lines 42-67
- Where it is read back: JSON export, `simulationStore.js` `advance` (line 98) 
- Storage layer: File system JSON
- Current format: Array of objects within node.data
- Is the key name itself persisted: YES (implicitly as part of node data schema) → MIGRATION REQUIRED

### 7. What Currently Works
- **Simulation Sandbox Logic:** `simulationStore` seamlessly evaluates conditions against `currentFlagValues` and applies `sideEffects` using mathematical operations. 
  - Depended on by: `GraphCanvas` visual simulation state.
  - Breakage: Breaking the pure evaluation logic would break "Play" mode.
- **Inspector Binding:** Forms automatically adjust input types (checkbox vs number input) based on the flag's `type` field.
  - Depended on by: UI Form Layer (`NodeInspector`, `EdgeInspector`).
  - Breakage: Changing data model structure without updating the UI will cause React render errors on undefined properties.
- **Referential Integrity:** Deleting a flag warns if it's used in conditions or side effects.
  - Depended on by: `narrativeStore.deleteFlag` (line 162).
  - Breakage: This ensures the graph isn't orphaned. Breaking it corrupts the graph.
