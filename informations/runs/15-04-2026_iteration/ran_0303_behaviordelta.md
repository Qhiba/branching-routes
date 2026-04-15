# ran_0303_behaviordelta — Behavior Delta

## Current Behavior (Before)

### Node Storage
- All nodes live in a single flat `nodes[]` array on `narrativeStore`.
- Node type is distinguished only by a `type` field (`'common'`, `'ending'`). A `'choice'` type is referenced in scope but not yet present in the current model.
- `narrativeStore.addNode()` appends to `nodes[]`.
- `narrativeStore.updateNode()` maps over `nodes[]` by `id`.
- `narrativeStore.deleteNode()` filters `nodes[]` by `id`.
- `narrativeStore.setStartNode()` maps over all `nodes[]` to toggle `isStartNode`.
- `narrativeStore.exportGraph()` serializes `nodes: state.nodes` — a flat array.
- `narrativeStore.loadGraph()` accepts `graphData.nodes` and patches state directly.

### Edge Storage
- Edges live in a flat `edges[]` array on `narrativeStore`.
- Each edge carries `{ id, sourceId, targetId, label, condition, sideEffects: [] }`.
- `narrativeStore.addEdge()` checks the source node's `type` field on `nodes[]` to block ending-node sources.
- `narrativeStore.deleteFlag()` walks `edge.sideEffects` to check flag references.
- `simulationStore.advance()` applies `edge.sideEffects` before `destNode.data.sideEffects` — a two-phase ordered application.
- `EdgeInspector.jsx` renders a full side-effects UI section for edges.
- `ConditionalEdge.jsx` receives `data.sideEffects` (passed from `GraphCanvas`, currently unused in display but present in the data object).

### Meta Storage
- `meta: { title, createdAt, updatedAt }` — no type registries.

### Node Rendering
- `GraphCanvas.jsx` uses a single `nodeTypes` map: `{ storyNode: StoryNode, ending: StoryNode }`.
- `StoryNode.jsx` handles both common and ending display by checking `data.isEndNode` to hide the outgoing handle.
- A single node component handles all types via conditional branching.

### AR-12 Enforcement
- `narrativeStore.addEdge()` scans `state.nodes[]` to find the source entry and checks its `type` field.
- The structural constraint is enforced at the store level, not by sub-collection identity.

---

## Target Behavior (After)

### Node Storage
- `narrativeStore` holds three typed object maps instead of one flat array:
  - `common: {}` — keyed by node `id`, values are common node objects.
  - `choice: {}` — keyed by node `id`, values are choice node objects.
  - `ending: {}` — keyed by node `id`, values are ending node objects.
- CRUD actions are updated to read/write to the correct sub-collection by node type.
- `narrativeStore.addNode(position, type)` dispatches to the correct sub-collection.
- `narrativeStore.updateNode(id, patch)` resolves which collection owns the id before patching.
- `narrativeStore.deleteNode(id)` resolves collection, removes node, cascades edge deletion.
- `narrativeStore.setStartNode(id)` scans all three collections to reset `isStartNode`.
- `narrativeStore.exportGraph()` serializes all three sub-collections.
- `narrativeStore.loadGraph()` populates all three sub-collections from loaded data.

### Edge Storage
- The `edges[]` flat array is retained as-is.
- `sideEffects` field is **removed** from the edge schema.
- New edges are created without a `sideEffects` field.
- `narrativeStore.deleteFlag()` no longer scans `edge.sideEffects` (field gone).
- `simulationStore.advance()` applies only `destNode.data.sideEffects` — one-phase application.
- `EdgeInspector.jsx` renders no side-effects section.
- `ConditionalEdge.jsx` no longer receives `data.sideEffects`.

### Meta Storage
- `meta` gains two new fields: `commonNodeTypes: []` and `endingTypes: []`.

### Node Rendering
- `GraphCanvas.jsx` derives a unified React Flow node array by merging all three sub-collections.
- `nodeTypes` map expands to: `{ commonNode: CommonNode, choiceNode: ChoiceNode, endingNode: EndingNode }`.
- `StoryNode.jsx` is replaced by three dedicated renderers.
- `EndingNode.jsx` unconditionally omits the outgoing handle — no conditional required.
- AR-12 enforcement moves to sub-collection identity check in `addEdge()`.

---

## What Is Identical In Both

- `edges[]` array structure (except field removal of `sideEffects`).
- `flags[]` array structure — no changes.
- `uiStore` shape and all `clearIfSelected` / `resetSelection` synchronization.
- `simulationStore` lifecycle: `start()`, `advance()`, `reset()`.
- `simulationStore.computeReachable()` logic and `conditionEvaluator.js` — untouched.
- `simulationStore.applySideEffects()` function — signature and logic unchanged.
- `GraphCanvas.jsx` core interaction handlers: drag, double-click-to-add, connect, simulation click.
- `FileSystem.js` export mechanism — only import parsing changes.
- `FlagManager.jsx` — unchanged.
- `TopBar.jsx` — unchanged.
- `Sidebar.jsx` — unchanged.
- All CSS tokens, global styles — unchanged.
- AR-09 schema versioning: version bumps from `1` to `2`.
