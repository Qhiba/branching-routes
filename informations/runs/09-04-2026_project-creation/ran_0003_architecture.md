# Architecture Rules

## AR-01 — Naming: Files
All component files use PascalCase (e.g., `NodeCard.jsx`). All store files use camelCase with a `store` suffix (e.g., `graphStore.js`). All utility files use camelCase with no suffix (e.g., `conditionEvaluator.js`).

## AR-02 — Naming: Variables and Entities
Graph entity IDs are UUID v4 strings generated at creation time and never mutated. Node data fields use camelCase (e.g., `nodeId`, `nodeLabel`). Flag/variable names defined by the designer must be alphanumeric + underscore only (validated on input).

## AR-03 — State Management
All global application state (graph nodes, edges, flags, simulation state) lives exclusively in Zustand stores. React component local state (`useState`) is limited to UI-only concerns (e.g., modal open/closed, hover state) and must never hold graph data.

## AR-04 — Data Layer Separation
No component file may directly mutate the graph data structure. All mutations must go through a Zustand store action. Components are read-only consumers of store state.

## AR-05 — Single Source of Truth
The canonical graph representation is the Zustand `graphStore`. The React Flow `nodes` and `edges` arrays are derived from this store and re-synced on every store change. The JSON export/import format is the serialised form of `graphStore` state only.

## AR-06 — Import Constraints
Absolute imports are resolved from `src/` (configured in `vite.config.js`). Barrel files (`index.js`) are used only at the top level of each directory (`components/`, `store/`, `utils/`). Circular imports between store files are forbidden.

## AR-07 — Condition Evaluation
All condition logic (AND/OR flag evaluation for edges) must live in `src/utils/conditionEvaluator.js` and be pure functions: `evaluateCondition(condition, flagState) => boolean`. No condition logic may be embedded in components or store actions.

## AR-11 — Side Effect Execution Order
When the simulation advances along an edge, side effects must execute in this strict order: (1) edge `sideEffects` fire first (the consequence of the choice), then (2) destination node `sideEffects` fire (the consequence of entering the scene). This order must be enforced inside `simulationStore.advance()` and nowhere else.

## AR-12 — Node Type Structural Constraints
A node of `type: 'ending'` must never be the `sourceId` of any edge. `graphStore.addEdge()` must validate this and throw if the source node is an ending node. The UI must also hide the outgoing handle on `EndingNode` to prevent accidental connection.

## AR-08 — Simulation Isolation
Simulation state (active node, traversed edges, current flag values mid-simulation) must live in a dedicated Zustand store (`simulationStore`) and must never pollute `graphStore`. Starting and stopping a simulation must reset `simulationStore` to a clean initial state.

## AR-09 — JSON Format Stability
The exported JSON structure is versioned via a top-level `"schemaVersion"` field (starting at `1`). Any breaking change to the data model increments this field. The import function must validate and reject files with an unrecognised schema version.

## AR-10 — No External Backend
This application makes zero network requests at runtime. No fetch, axios, or WebSocket calls are permitted in application code. All persistence is via the browser's File System Access API (`showSaveFilePicker` / `showOpenFilePicker`).
