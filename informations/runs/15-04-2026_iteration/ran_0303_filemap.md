# ran_0303_filemap — File Map

## Modified Files

### `src/store/narrativeStore.js`
- **What changes:**
  - State shape: replace `nodes: []` with `common: {}`, `choice: {}`, `ending: {}`.
  - `addNode(position, type)`: writes to the correct sub-collection keyed by the new `id`.
  - `updateNode(id, patch)`: resolves which sub-collection owns `id` before applying patch.
  - `deleteNode(id)`: resolves collection, removes entry, cascades edge deletion unchanged.
  - `setStartNode(id)`: iterates all three collections to reset `isStartNode`.
  - `addEdge(sourceId, targetId)`: replaces `state.nodes.find()` check with sub-collection identity check — looks up `sourceId` in `state.ending` to block.
  - `addEdge()` new edge: removes `sideEffects: []` from the edge object.
  - `updateEdge()`: unchanged.
  - `deleteEdge()`: unchanged.
  - `deleteFlag()`: removes the `edge.sideEffects` scan block entirely. Retains node `sideEffects` scan, which now resolves nodes from all three sub-collections.
  - `loadGraph(graphData)`: accepts the normalized shape produced by `fileSystem.js`; populates `common`, `choice`, `ending`, `edges`, `flags`, `meta` (with defaulted `commonNodeTypes`/`endingTypes`).
  - `newGraph()`: resets all three sub-collections to `{}`.
  - `exportGraph()`: serializes `common`, `choice`, `ending` instead of `nodes`; increments `schemaVersion` to `2`.
  - `updateMeta()`: unchanged.
- **What must NOT change:**
  - `useUIStore.getState().clearIfSelected()` calls in `deleteNode` and `deleteEdge` — INVARIANT BI-04, BI-05.
  - `useUIStore.getState().resetSelection()` in `loadGraph` and `newGraph` — INVARIANT BI-16.
  - Flag validation regex in `addFlag`.
  - Circular-import guard (no `simulationStore` import).
  - The `generateId` prefix scheme (`n-`, `e-`, `f-`).
- **Which phase touches it:** Phase 1
- **New files:** None
- **Deleted:** None

---

### `src/store/simulationStore.js`
- **What changes:**
  - `start()`: replace `graphState.nodes.find(n => n.data && n.data.isStartNode)` with a search across all three sub-collections.
  - `advance()`: replace `graphState.nodes.find(n => n.id === edge.targetId)` with a unified lookup across all three sub-collections.
  - `advance()`: remove the `edge.sideEffects` application block entirely.
  - `advance()`: the `destNode.type === 'ending'` check changes to sub-collection identity: check membership in `graphState.ending`.
- **What must NOT change:**
  - `computeReachable()` function — unchanged, it reads `edges[]` only.
  - `applySideEffects()` function — unchanged.
  - `start()`, `advance()`, `reset()` lifecycle signatures.
  - `reachableEdgeIds`/`reachableNodeIds` computation.
  - The invariant comment `// INVARIANT: LBA-01` at both `start()` and `advance()`.
- **Which phase touches it:** Phase 1
- **New files:** None
- **Deleted:** None

---

### `src/utils/fileSystem.js`
- **What changes:**
  - `importProject()`: after parsing JSON, detect legacy format (has `nodes` key) vs new format (has `common`/`choice`/`ending` keys).
  - Legacy path: distribute `nodes[]` entries into `{ common: {}, choice: {}, ending: {} }` by each entry's `type` field; strip `sideEffects` from each edge entry with a console warning if any non-empty arrays are discarded.
  - New-schema path: pass `common`, `choice`, `ending`, `edges` through unchanged.
  - Schema version acceptance: accept `schemaVersion === 1` (legacy) and `schemaVersion === 2` (new); throw `'unsupported_schema_version'` for anything else.
  - `exportProject()`: unchanged — it receives already-structured data from `narrativeStore.exportGraph()`.
- **What must NOT change:**
  - File picker logic (both `showSaveFilePicker` path and fallback blob path).
  - `AbortError` handling.
  - The `'unsupported_schema_version'` error string (callers key on it).
- **Which phase touches it:** Phase 2
- **New files:** None
- **Deleted:** None

---

### `src/components/GraphCanvas.jsx`
- **What changes:**
  - Import: replace `StoryNode` with `CommonNode`, `ChoiceNode`, `EndingNode`.
  - `nodeTypes` map: `{ commonNode: CommonNode, choiceNode: ChoiceNode, endingNode: EndingNode }`.
  - `derivedNodes` useMemo: merge all three sub-collections into one array for React Flow, mapping each entry's collection identity to the correct `type` string (`'commonNode'`, `'choiceNode'`, `'endingNode'`). Remove `data.isEndNode` augmentation — `EndingNode` no longer needs it.
  - `reactFlowEdges` useMemo: remove `sideEffects: edge.sideEffects` from the `data` object passed to edge components.
  - `onPaneClick`: `addNode(position, 'common')` — unchanged.
  - `storeNodes` destructuring: change from `nodes` to `common, choice, ending`.
- **What must NOT change:**
  - `isDragging` ref / `applyNodeChanges` sync pattern — PROTECTED invariant.
  - `isRunning` click-routing logic in `onNodeClick`.
  - `onNodeDragStop` calling `updateNode`.
  - `graph-layout-tidy` event listener.
  - All `useSimulationStore` subscriptions.
- **Which phase touches it:** Phase 3
- **New files:** None
- **Deleted:** None

---

### `src/components/NodeInspector.jsx`
- **What changes:**
  - State selector: replace `state.nodes.find(n => n.id === selectedNodeId)` with a lookup that searches `common`, `choice`, and `ending` sub-collections.
  - Add a `nodeType` derived value (which collection the node belongs to) to gate type-specific fields.
  - Common and Choice nodes: retain label, content, sideEffects, setStartNode fields.
  - Ending nodes: retain label and content; hide `setStartNode` button (ending nodes cannot be start nodes); retain sideEffects section (ending nodes can still fire effects on entry).
  - Delete button: calls `deleteNode(node.id)` — unchanged.
- **What must NOT change:**
  - `addSideEffect`, `updateSideEffect`, `removeSideEffect` logic — unchanged.
  - `updateNode` call signature — unchanged.
  - `deleteNode` call — unchanged.
- **Which phase touches it:** Phase 4
- **New files:** None
- **Deleted:** None

---

### `src/components/EdgeInspector.jsx`
- **What changes:**
  - Remove `addSideEffect`, `updateSideEffect`, `removeSideEffect` handler functions.
  - Remove the entire "Side Effects" `<div>` section from JSX.
  - Remove `edge.sideEffects` references in the state selector.
- **What must NOT change:**
  - Condition (AND/OR clause) section — entirely unchanged.
  - Label input — unchanged.
  - Delete edge button — unchanged.
  - `updateEdge`, `deleteEdge` calls — unchanged.
- **Which phase touches it:** Phase 4
- **New files:** None
- **Deleted:** None

---

### `src/components/edges/ConditionalEdge.jsx`
- **What changes:**
  - Remove `data.sideEffects` destructuring (it will no longer be present in `data`).
  - No other display logic changes — `sideEffects` was not rendered, only passed through.
- **What must NOT change:**
  - Edge path rendering, label, condition badge.
  - `isTraversed` and `isReachable` simulation state reads.
- **Which phase touches it:** Phase 4
- **New files:** None
- **Deleted:** None

---

### `src/components/nodes/StoryNode.jsx`
- **What changes:** This file is **deleted** at the end of Phase 3 once all consumers are migrated.
- **What must NOT change:** Nothing — file is replaced, not modified.
- **Which phase touches it:** Phase 3
- **New files:** `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`
- **Deleted:** `StoryNode.jsx` (end of Phase 3)

---

### `src/components/nodes/CommonNode.jsx` *(new)*
- **What it is:** Replaces `StoryNode.jsx` for `type === 'common'` nodes.
- **Contents:** Simulation state classes (active/visited/reachable), label, content, side-effects badge, target handle (left), source handle (right).
- **Which phase creates it:** Phase 3

---

### `src/components/nodes/ChoiceNode.jsx` *(new)*
- **What it is:** New renderer for `type === 'choice'` nodes.
- **Contents:** Same simulation state hooks as `CommonNode`, distinct visual treatment to signal "player-choice" semantics (e.g., a badge or header suffix), target handle (left), source handle (right).
- **Which phase creates it:** Phase 3

---

### `src/components/nodes/EndingNode.jsx` *(new)*
- **What it is:** Renderer for `type === 'ending'` nodes.
- **Contents:** Simulation state hooks, label, content. **No source handle** — unconditionally absent. Distinct visual (e.g., "END" badge). No `isEndNode` prop needed.
- **Which phase creates it:** Phase 3

---

### `src/components/index.js`
- **What changes:** Remove `StoryNode` export. Add `CommonNode`, `ChoiceNode`, `EndingNode` exports.
- **Which phase touches it:** Phase 3
- **New files:** None
- **Deleted:** None

---

### `src/store/index.js`
- **What changes:** None — barrel re-exports `narrativeStore`, `simulationStore`, `uiStore` by name. Internal changes to those stores do not require barrel updates.

---

## Deleted Files

| File | Reason | Phase |
|---|---|---|
| `src/components/nodes/StoryNode.jsx` | Replaced by `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx` | Phase 3 |

## New Files

| File | Purpose | Phase |
|---|---|---|
| `src/components/nodes/CommonNode.jsx` | Common node renderer | Phase 3 |
| `src/components/nodes/ChoiceNode.jsx` | Choice node renderer | Phase 3 |
| `src/components/nodes/EndingNode.jsx` | Ending node renderer | Phase 3 |
