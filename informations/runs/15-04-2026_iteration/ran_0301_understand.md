# 0301 Understand: Data Model, Canvas, State Management Behavioral Map

## 1. What It Does Now
- **Zustand Stores**: State is managed via three separated stores (`narrativeStore`, `simulationStore`, `uiStore`).
  - `narrativeStore` owns the single source of truth for the authored graph (`nodes`, `edges`, `flags`, `meta`). It provides CRUD operations (add, update, delete) for these entities and graph-level operations (new, load, export). It safely prevents deleting a flag if it is referenced by any condition or side effect. It enforces that `ending` nodes cannot be the source of an edge connection.
  - `simulationStore` maintains live simulation state cleanly isolated from the authored graph. It manages the `activeNodeId`, visitation history (`visitedNodeIds`, `traversedEdgeIds`), performs run-time evaluation of flags (`currentFlagValues`), and tracks which connected nodes/edges are currently `reachable` based strictly on evaluated conditions. Advancing the simulation applies edge side effects first, then node side effects.
  - `uiStore` holds transient UI state (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`), preventing global React Flow rendering loops that would occur if selection state were bundled with entity data.
- **Canvas (`GraphCanvas.jsx`)**: Renders the React Flow graph by mapping canonical state (`narrativeStore.nodes`, `narrativeStore.edges`) array data explicitly, augmenting it dynamically with UI metadata (setting the `selected` prop if it matches `uiStore`). Captures graph mutations through canvas interactions (drag to move, click to select, double-click to add, connecting handles). During simulation mode (`isRunning`), interaction behavior adapts: clicking a `reachable` node triggers `simulationStore.advance()`, ignoring regular selection logic.
- **Data Serialization**: The graph data exists in a normalized array-of-objects structure for nodes, edges, and flags, permitting clean export straight to JSON with no required tree-shaking, and perfectly loaded by patching state.

## 2. Input / Output Contract
* **Input**: 
  - User interactions on the canvas (click, drag, connect, double-click).
  - Structural object inputs from Inspector UI panels (property values, conditions, string names).
  - Whole-scale graph data for loading (`loadGraph` takes `schemaVersion`, `meta`, `nodes`, `edges`, `flags`).
* **Output**: 
  - Complete synchronous structured arrays provided to the React Flow component and UI stores.
  - Final serialized JSON state emitted for export.
  - During simulation: a calculation of "reachable" paths and flag adjustments.
* **Format**:
  - `nodes`: `[{ id, type, position: { x, y }, data: { label, content, isStartNode, sideEffects:[] } }]`
  - `edges`: `[{ id, sourceId, targetId, label, condition, sideEffects:[] }]`
  - `flags`: `[{ id, name, type, defaultValue }]`
  - `meta`: `{ title, createdAt, updatedAt }`

## 3. Full Dependency Map
* **`narrativeStore.js`**
  - **Upstream (Depends on it)**: `simulationStore` (reads canonical data to advance simulation compute reachable paths), `uiStore` (not directly, but narrative actions trigger `uiStore.clearIfSelected`), `GraphCanvas`, `Sidebar`, `TopBar`, various Inspector components.
  - **Downstream (Depends on)**: `utils/uuid.js` (for prefixed `generateId`), `uiStore` (for synchronous selection deletion).
  - **Breaks if contract changed**: Total UI layout failure; save file import/export schema invalidated; system-wide crashes (e.g. mapping `edges`).
* **`simulationStore.js`**
  - **Upstream (Depends on it)**: `TopBar` (start/reset simulation button), `GraphCanvas` (render reachable visual cues, `advance` via click), Node/Edge visual components inside canvas (check visitation).
  - **Downstream (Depends on)**: `narrativeStore` (reads canonical nodes/edges/flags locally via `getState()`), `utils/conditionEvaluator.js` (evaluates `reachableEdges` logic).
  - **Breaks if contract changed**: Simulation engine crashes; canvas click interaction during simulation mode breaks.
* **`uiStore.js`**
  - **Upstream (Depends on it)**: `narrativeStore` (requires sync deletes), `GraphCanvas`, `Sidebar`, `TopBar` (snap grid tracking).
  - **Downstream (Depends on)**: None.
  - **Breaks if contract changed**: Inspector panels would fail to mount contextually; visual highlights on canvas drop; memory leaks if syncs fail.
* **`GraphCanvas.jsx`**
  - **Upstream**: `<App />` root layout grid.
  - **Downstream**: `narrativeStore`, `simulationStore`, `uiStore`, `nodes/StoryNode.jsx`, `edges/ConditionalEdge.jsx`, `@xyflow/react` rendering mechanics.
  - **Breaks if contract changed**: Entire visual editing interaction ceases.

## 4. Implicit Assumptions
- Callers (like Canvas and File Export) assume `narrativeStore.nodes` and `narrativeStore.edges` arrays are always strictly structurally stable and mapped perfectly linearly.
- **OBSERVATION**: `narrativeStore.addNode` implicitly assumes a state where `nodes.length === 0` implies this node should automatically be `isStartNode = true`.
- `simulationStore.start()` implicitly assumes that exactly one node exists with `data.isStartNode === true`, and throws if this is violated.
- Architecture assumes `uiStore` effectively shadows the `narrativeStore` efficiently — any edge case where an ID deletes in `narrativeStore` but not `uiStore` will crash the UI. (Handled via synchronous invocations).
- Implicit assumption that any file loaded into the system matches the schema; `narrativeStore.loadGraph()` accepts data dynamically without rigid property assertions.
- The condition evaluator assumes strict adherence that all node/edge keys for conditions natively fit the schema or gracefully degrade via null checks.

## 5. Change Surface
If the area defined as "Data Model, Canvas, State Management" is altered, these faces are disrupted:
- **Input contract**: Parameters strictly enforced into `narrativeStore` method hooks.
- **Output contract**: The shape mapped in `GraphCanvas` via `useMemo` derivations. 
- **Side effects**: Cross-store references in `deleteNode`/`deleteEdge` keeping UI fresh, side-effect sequencing tightly bound inside `simulationStore.advance`.
- **Data model fields**: The root structure of serialized graphs and simulation memory.
- **Entity ID format**: Prefixed UUID dependencies (`n-`, `e-`, `f-`) flowing from generator into objects.

## 6. Persistence Inventory

**`meta.title`, `meta.createdAt`, `meta.updatedAt`**
- Where it is written: `narrativeStore.js:151`, `narrativeStore` everywhere properties update.
- Where it is read back: `narrativeStore.js:182`
- Storage layer: Memory/Zustand / Export File System
- Current format: String and numeric arrays. 
- Is the key name itself persisted? YES
- **MIGRATION REQUIRED**

**`nodes` array and its nested schema**
- Where it is written: `narrativeStore.js:13`, `narrativeStore.js:33`
- Where it is read back: `GraphCanvas.jsx:43`, export/import pipelines, array iterations inside standard store reads.
- Storage layer: Memory / File System Export
- Current format: Array of Object Data Models
- Is the key name itself persisted? YES
- **MIGRATION REQUIRED**

**`edges` array and its nested schema**
- Where it is written: `narrativeStore.js:57`, `narrativeStore.js:82`
- Where it is read back: `GraphCanvas.jsx:66`, simulation store mapping.
- Storage layer: Memory / File System Export
- Current format: Array of Object Data Models
- Is the key name itself persisted? YES
- **MIGRATION REQUIRED**

**`flags` array and its nested schema**
- Where it is written: `narrativeStore.js:97`
- Where it is read back: `simulationStore.js:53`
- Storage layer: Memory / File System Export
- Current format: Array of Object Data Models
- Is the key name itself persisted? YES
- **MIGRATION REQUIRED**

**`uiStore` selection details (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`)**
- Where it is written: `uiStore.js`
- Where it is read back: `GraphCanvas.jsx`, TopBar, side-panels
- Storage layer: Runtime Memory Only
- Current format: ID `String` / `Boolean`
- Is the key name itself persisted? NO
- **MIGRATION SAFE**

**`simulationStore` live execution states (`activeNodeId`, `currentFlagValues`, `visitedNodeIds`)**
- Where it is written: `simulationStore.js`
- Where it is read back: `GraphCanvas.jsx`, UI overlays
- Storage layer: Runtime Memory Only
- Current format: Mixed (IDs, maps)
- Is the key name itself persisted? NO
- **MIGRATION SAFE**

## 7. What Currently Works

**1. Reliable Cross-Store Deletion Synchronization**
- **The behavior**: When a node/edge is deleted in `narrativeStore`, it synchronically strips selection highlights from `uiStore`.
- **What depends on it**: The sidebar Inspector correctly reverting/dismounting upon entity deletion.
- **How it would break**: Refactoring deletion logic such that the explicit reference `useUIStore.getState().clearIfSelected()` drops.

**2. Strict Deterministic Side Effect Application**
- **The behavior**: Edge advancement guarantees side-effects on the traversing edge are mutated first, followed by side-effects on the destination node sequentially.
- **What depends on it**: Predictable branching narrative rules.
- **How it would break**: Wrapping `applySideEffects` into an asynchronous sequence or merging both arrays into standard flat loop unexpectedly.

**3. Visual Canvas State Segregation via `useMemo`**
- **The behavior**: Canonical source-of-truth arrays are heavily optimized inside `GraphCanvas` into React Flow specific format. `isRunning` logic actively detaches canvas interaction binding transparently.
- **What depends on it**: High-performance UI rendering that survives large graphs without visual clipping or state mutation.
- **How it would break**: Pointing react flow directly at canonical references without copying, altering native `id` / `source` fields.

**4. Safely Rejecting Terminus Edges**
- **The behavior**: Any attempt to set an `ending` node as a source for an Edge forcibly throws an exception in `narrativeStore`.
- **What depends on it**: AR-12 validation.
- **How it would break**: Condition block silently stripped.

**5. Robust Flag Reference Checking**
- **The behavior**: `narrativeStore.deleteFlag()` traverses every nested `flagId` present within connected operations / evaluate statements. If existing, block deletion.
- **What depends on it**: `FlagManager.jsx` relies on this response object to halt UI. 
- **How it would break**: If nested condition objects or side effect arrays are modified in schema without modifying search structure in store.
