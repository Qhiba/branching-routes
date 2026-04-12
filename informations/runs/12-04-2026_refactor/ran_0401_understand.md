# Structural Refactor: Area Understanding

## 1. Current Structure
The area currently consists of two Zustand global stores, a UUID generator utility, and a set of design system CSS variables:
*   **Stores**: Located in `src/store/`.
    *   `graphStore.js`: Holds the canonical data of the project (meta, nodes, edges, flags) **and** UI state (selectedNodeId, selectedEdgeId, snapToGrid).
    *   `simulationStore.js`: Holds the ephemeral state representing a live playthrough (active node, traversed edges, visited nodes, live flag values).
*   **ID Generation**: `src/utils/uuid.js` generates flat UUID v4 strings (e.g., `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`) without any entity-type prefixes.
*   **Theme Tokens**: `src/styles/tokens.css` contains all design system variables (colors, spacing, shadows) in the `:root` scope, currently hardcoded to a dark mode palette.

## 2. Data Flow
*   **Data Entry**: User actions trigger `graphStore` methods (e.g., `addNode`, `addEdge`, `selectNode`). New entities get IDs via `generateId()` from `uuid.js`.
*   **Transformation**: The `graphStore` updates its internal arrays immutably. The `simulationStore.start()` or `.advance()` methods pull from `graphStore.getState()` synchronously and compute reachable edges/side-effects.
*   **Data Exit**: `graphStore.exportGraph()` wraps the canonical structured state (`meta`, `nodes`, `edges`, `flags`) and adds `schemaVersion: 1`, returning a plain object formatted for the `fileSystem.js` exporter.
*   **Formats**: At runtime, all states are JS arrays/objects inside Zustand stores. At export, they are serialized to JSON.

## 3. Full Dependency Map
*   **`store/graphStore.js`**
    *   **Upstream (Depends on it)**: `store/simulationStore.js` (reads state), `components/GraphCanvas.jsx`, `components/TopBar.jsx`, `components/Sidebar.jsx`, `components/NodeInspector.jsx`, `components/EdgeInspector.jsx`, `components/FlagManager.jsx`.
    *   **Downstream (It depends on)**: `utils/uuid.js`
    *   **Fragility**: Renaming the store or modifying the shape of the UI state (e.g., removing `selectedNodeId`) will break almost all UI components immediately.
*   **`store/simulationStore.js`**
    *   **Upstream**: `components/TopBar.jsx`, `components/GraphCanvas.jsx`, `components/nodes/StoryNode.jsx`, `components/edges/ConditionalEdge.jsx`.
    *   **Downstream**: `store/graphStore.js` (reads state via `getState()`), `utils/conditionEvaluator.js`.
    *   **Fragility**: Expects `graphStore` APIs and specific shapes (evaluates `isStartNode` and `sideEffects` heavily).
*   **`utils/uuid.js`**
    *   **Upstream**: `store/graphStore.js`.
    *   **Downstream**: `crypto.randomUUID()`.
    *   **Fragility**: If this changes its contract, ID associations across the app will break.
*   **`styles/tokens.css`**
    *   **Upstream**: `styles/global.css`, `App.css`.
    *   **Downstream**: None.
    *   **Fragility**: Changing CSS variable names will break styles application-wide silently.

## 4. Load-Bearing Assumptions
*   **OBSERVATION**: The `example_datamodel.json` shows prefixed IDs (`n001...`, `e001...`, `f001...`), but `uuid.js` currently generates raw UUID v4 without prefixes. The system assumes a flat ID string is fine.
*   **Sync Reads**: `simulationStore` assumes synchronous access to `graphStore` via `.getState()`.
*   **Referential Integrity**: Deleting a node or flag assumes a full manual traversal of all node/edge references. Changing the shape of a node/edge without updating the deletion logic will leave dangling references.
*   **UI State mixed with Graph State**: Selecting a node updates `graphStore`, triggering state updates across the graph context.

## 5. Coupling Points
*   **Intentional Coupling**: `simulationStore` pulling from `graphStore`. The simulation cannot exist independently of the authored graph context.
*   **Tightly Coupled where it Shouldn't Be**: UI selection states (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`) reside inside `graphStore`, forcing file-save-related logic to co-mingle with immediate canvas interaction states.
*   Delete logic inside `graphStore` is tightly coupled to UI interactions—it actively clears `selectedNodeId` if the deleted node matches the selection.

## 6. Hidden Complexity
*   **Cross-Store Synchronization needed post-refactor**: If `selectedNodeId` is moved to a `uiStore`, deleting a node in `graphStore` will somehow need to inform `uiStore` to clear the selection. They currently share this logic seamlessly because they are in the same store.
*   Referential checks in `deleteFlag` (graphStore.js: L110) traverse deep JSON structures (`e.condition.clauses`, `n.data.sideEffects`). 

## 7. Persistence Inventory

**schemaVersion**
- Where it is written: `store/graphStore.js`, `exportGraph`, L178
- Where it is read back: `utils/fileSystem.js` (per documentation rules)
- Storage layer: File System JSON
- Current format: Number
- Is the key name itself persisted: YES
- MIGRATION REQUIRED — key name or format is persisted

**meta**
- Where it is written: `store/graphStore.js`, `exportGraph`, L179 (updated on mutations L30, L36, etc.)
- Where it is read back: `store/graphStore.js`, `loadGraph`, L151
- Storage layer: File System JSON
- Current format: Object
- Is the key name itself persisted: YES
- MIGRATION REQUIRED — key name or format is persisted

**nodes**
- Where it is written: `store/graphStore.js`, `exportGraph`, L184
- Where it is read back: `store/graphStore.js`, `loadGraph`, L152
- Storage layer: File System JSON
- Current format: Array of Objects
- Is the key name itself persisted: YES
- MIGRATION REQUIRED — key name or format is persisted

**edges**
- Where it is written: `store/graphStore.js`, `exportGraph`, L185
- Where it is read back: `store/graphStore.js`, `loadGraph`, L153
- Storage layer: File System JSON
- Current format: Array of Objects
- Is the key name itself persisted: YES
- MIGRATION REQUIRED — key name or format is persisted

**flags**
- Where it is written: `store/graphStore.js`, `exportGraph`, L186
- Where it is read back: `store/graphStore.js`, `loadGraph`, L154
- Storage layer: File System JSON
- Current format: Array of Objects
- Is the key name itself persisted: YES
- MIGRATION REQUIRED — key name or format is persisted

**node / edge / flag ids**
- Where it is written: `store/graphStore.js` (various `generateId` calls, e.g. L18, L64, L94)
- Where it is read back: `store/graphStore.js` `loadGraph`
- Storage layer: File System JSON
- Current format: UUID String (unprefixed currently)
- Is the key name itself persisted: NO for values, YES for `id` key.
- MIGRATION OPTIONAL — value format may change safely (though import may need to handle unprefixed vs prefixed UUIDs if older files exist).

**selectedNodeId / selectedEdgeId / snapToGrid**
- Where it is written: `store/graphStore.js`, various UI actions.
- Where it is read back: Memory only (not exported).
- Storage layer: Memory
- Current format: String (ID) / Boolean
- Is the key name itself persisted: NO
- MIGRATION SAFE — nothing about this is persisted.
