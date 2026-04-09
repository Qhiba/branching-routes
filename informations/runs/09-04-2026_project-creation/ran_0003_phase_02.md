# Phase 02 — Core Data Layer (Stores + Utilities)

## Goal
Implement the Zustand stores and pure utility functions that define the application's data layer. All future components are consumers of this layer and must not exist without it.

## Produces
- `src/store/graphStore.js`
- `src/store/simulationStore.js`
- `src/store/index.js`
- `src/utils/uuid.js`
- `src/utils/conditionEvaluator.js`
- `src/utils/fileSystem.js`
- `src/utils/index.js`

## Dependencies Required Before This Phase
- Phase 01 complete (Vite project, dependencies installed, path aliases configured)

## Reference Documents
- `ran_0003_architecture.md` — AR-03 (state in stores), AR-04 (no component mutation), AR-05 (single source of truth), AR-07 (condition logic isolation), AR-08 (simulation isolation), AR-09 (schema versioning), AR-10 (no network)
- `ran_0003_datamodel.md` — all entity types and JSON format
- `ran_0003_filemap.md` — all files listed above

## Steps

### 1. `src/utils/uuid.js`
```js
export const generateId = () => crypto.randomUUID()
```

### 2. `src/utils/conditionEvaluator.js`
Export two pure functions:
- `evaluateClause(clause, flagState)` — looks up `flagState[clause.flagId]`, applies `clause.comparator`, returns `boolean`. Handles all six comparators (`==`, `!=`, `>`, `>=`, `<`, `<=`). Returns `false` if `flagId` is not found in `flagState`.
- `evaluateCondition(condition, flagState)` — if `condition` is `null`, return `true`. Otherwise call `evaluateClause` for each clause and combine with `AND` (all must pass) or `OR` (any must pass).

### 3. `src/utils/fileSystem.js`
Export two async functions:
- `saveFile(graphData)` — attempts `showSaveFilePicker` with `.json` filter. Falls back to `<a download>` if API unavailable. Serialises with `JSON.stringify(graphData, null, 2)`.
- `openFile()` — attempts `showOpenFilePicker`. Falls back to `<input type="file">` prompt. Deserialises JSON. Validates `schemaVersion === 1`. Throws `Error('unsupported_schema_version')` if invalid.

Both functions must check `typeof window.showSaveFilePicker === 'function'` before using the API (RISK-03 mitigation).

### 4. `src/store/graphStore.js`
State shape:
```js
{
  meta: { title, createdAt, updatedAt },
  nodes: [],   // Node[]
  edges: [],   // Edge[]
  flags: [],   // Flag[]
  selectedNodeId: null,
  selectedEdgeId: null,
}
```

Actions to implement:
- `addNode(position, type?)` — creates a node with `generateId()`, `type` defaulting to `'common'`, default label "Node", empty content, `isStartNode: false`, empty `sideEffects: []`
- `updateNode(id, patch)` — merges patch into matching node
- `deleteNode(id)` — removes node and all edges referencing it
- `setStartNode(id)` — sets `isStartNode: true` on target, `false` on all others
- `addEdge(sourceId, targetId)` — validates that source node is not `type: 'ending'` (AR-12); if invalid, throws. Creates edge with `generateId()`, empty label, `condition: null`, `sideEffects: []`
- `updateEdge(id, patch)` — merges patch into matching edge
- `deleteEdge(id)` — removes edge
- `addFlag(name, type, defaultValue)` — validates name matches `/^[a-zA-Z0-9_]+$/`, creates flag
- `updateFlag(id, patch)` — merges patch into matching flag
- `deleteFlag(id)` — checks for references in `edges[].condition.clauses`, `edges[].sideEffects`, and `nodes[].sideEffects`; if any references exist, returns `{ blocked: true, references: [...] }`. Otherwise deletes. (RISK-02 mitigation)
- `selectNode(id)` — sets `selectedNodeId`, clears `selectedEdgeId`
- `selectEdge(id)` — sets `selectedEdgeId`, clears `selectedNodeId`
- `clearSelection()` — clears both
- `loadGraph(graphData)` — replaces entire state from a parsed JSON file
- `newGraph()` — resets state to empty defaults
- `exportGraph()` — returns a plain object in the JSON export format (schemaVersion 1)

### 5. `src/store/simulationStore.js`
State shape:
```js
{
  isRunning: false,
  activeNodeId: null,
  visitedNodeIds: [],
  traversedEdgeIds: [],
  currentFlagValues: {},   // { [flagId]: value }
  reachableEdgeIds: [],    // edges passable from current node
  reachableNodeIds: [],    // nodes reachable in one step
}
```

Actions to implement:
- `start()` — reads `graphStore` for the node where `isStartNode: true`, sets `activeNodeId`, initialises `currentFlagValues` from all `flags[].defaultValue`, computes `reachableEdgeIds`/`reachableNodeIds` using `evaluateCondition`, sets `isRunning: true`. Throws if no start node exists.
- `advance(edgeId)` — validates edge is in `reachableEdgeIds`. Executes in strict order (AR-11):
  1. Apply the traversed **edge's** `sideEffects` to `currentFlagValues`
  2. Apply the destination **node's** `sideEffects` to `currentFlagValues`
  3. Update `activeNodeId`, append to `visitedNodeIds` and `traversedEdgeIds`
  4. If destination node is `type: 'ending'`, set `reachableEdgeIds: []` and `reachableNodeIds: []` — simulation is at a terminal state (but keep `isRunning: true` so the Stop button remains visible)
  5. Otherwise recompute reachable sets via `computeReachable`
- `reset()` — resets all fields to initial values, sets `isRunning: false`.

Private helper (not exported): `computeReachable(activeNodeId, edges, currentFlagValues)` returns `{ reachableEdgeIds, reachableNodeIds }`.

### 6. Barrel files
`src/store/index.js`:
```js
export { useGraphStore } from './graphStore'
export { useSimulationStore } from './simulationStore'
```

`src/utils/index.js`:
```js
export { generateId } from './uuid'
export { evaluateCondition, evaluateClause } from './conditionEvaluator'
export { saveFile, openFile } from './fileSystem'
```

## Acceptance Criteria
- Done when: The app starts without errors, and `useGraphStore.getState().addNode({x:0,y:0})` called from the browser console adds a node visible via `useGraphStore.getState().nodes`.
- `evaluateCondition(null, {})` returns `true`.
- `evaluateCondition({ operator: 'AND', clauses: [{ flagId: 'x', comparator: '==', value: true }] }, { x: true })` returns `true`.
- `evaluateCondition({ operator: 'AND', clauses: [{ flagId: 'x', comparator: '==', value: true }] }, { x: false })` returns `false`.

## Verification
1. Run `npm run dev` — confirm no console errors
2. Open DevTools Console, run:
   ```js
   const { useGraphStore } = await import('/src/store/graphStore.js')
   useGraphStore.getState().addNode({ x: 100, y: 100 })
   console.log(useGraphStore.getState().nodes)
   ```
   Confirm one node is logged.
3. Test condition evaluator:
   ```js
   const { evaluateCondition } = await import('/src/utils/conditionEvaluator.js')
   console.log(evaluateCondition(null, {}))  // true
   ```

## Next Phase Dependency
Phase 03 requires `graphStore` to exist and export `useGraphStore`. `GraphCanvas` reads nodes/edges from this store.
