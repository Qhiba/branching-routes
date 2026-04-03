# Structural Map & System Audit: Schema and Condition Refactor

## 1. Current Structure
The Branching Routes application functions as a single-page interactive graph editor with a heavy client-side state model.
- **State Store**: `EditorContext.jsx` acts as the single source of truth, loading data from and periodically syncing to an IndexedDB store (`localforage` payload key `branching-routes-data`). It manages full CRUD for all narrative entities and applies historical schema migrations upon hydration.
- **Graph Transformation**: The core raw data (`scenes`, `choices`, etc.) is injected into a dependency graphing utility (`dependencyGraph.js`), reachability checks (`reachabilityAnalyzer.js`), and finally laid out graphically via Dagre (`graphLayout.js`) for React Flow (`RouteViewer.jsx`).
- **Simulation Engine**: `useSimulator.js` tracks traversal interactively by reading node connections (`next`, `options`), evaluating prerequisites through `conditionUtils.js`, and preserving a stack of applied flags and status point aggregations.
- **Editing Surfaces**: The UI relies on sidebar properties (`LeftSidebar.jsx`) and modal forms (`SceneModalForm.jsx`) which update Context, immediately bouncing back through the graph transformation pipeline.

## 2. Data Flow
1. **Entry (Hydration)**: `localforage` grabs the main data dictionary or an imported `.json` payload. `EditorContext.jsx` applies backward-compatibility migrations (e.g., normalizing legacy `requires` logic into explicit nested structures).
2. **Evaluation & Indexing**: Context pushes data up. Utilities build intermediate maps:
   - Sets vs. Gets mapping (Dependency graph).
   - Flag validation (Static reachability).
   - Auto layout coordinates computing (Dagre). 
3. **Interactive Traversal**: Simulation and trace modes compute paths dynamically by accumulating set/unset commands and resolving matching `next` edges at runtime.
4. **Exit (Persistence/Export)**: Data triggers a debounced save to IndexedDB every 500ms and can be manually exported as a clean JSON BLOB containing top-level domain arrays (`scenes`, `choices`, etc.).

## 3. Full Dependency Map
- `App.jsx`
  - Upstream: User
  - Downstream: `EditorContext`, `RouteViewer`, UI layouts
  - **Contract**: Relies on defined schema maps (`scenes`, `flags`) to generate exports.
- `EditorContext.jsx`
  - Upstream: All UI operations and hydration
  - Downstream: `localforage`, `conditionUtils`
  - **Contract**: Depends intimately on specific ID strings (S, CH, E) for parsing and object shapes for deep cloning/migrating.
- `RouteViewer.jsx` & `graphLayout.js`
  - Upstream: `EditorContext`, Layout utilities
  - Downstream: React Flow UI
  - **Contract**: Assumes explicit target-pointer connections and internal structures like `route.target`, needing nodes to have matching `.id` variables.
- `useSimulator.js`
  - Upstream: `RouteViewer`, Context
  - Downstream: `conditionUtils`
  - **Contract**: Bound to specific ID strings to parse history stacks, identifying specific types (choices vs. scenes) based on ID presence, treating next IDs as concrete values rather than node references.
- `routeTracer.js` & `dependencyGraph.js`
  - Upstream: `App.jsx`, `LeftSidebar.jsx`
  - Downstream: `conditionUtils.js`
  - **Contract**: Expect `flags_set` / `status_set` and deeply nested `requires` blocks to function sequentially.

## 4. Load-Bearing Assumptions
- **Namespaced IDs**: Entity prefixes (`S*` for Scenes, `CH*` for Choices, `E*` for Endings, `F*` for Flags) define identity types for the simulator routing mechanics and modal loaders.
- **`requires` Schema**: All pre-requisite conditions follow strict explicit formats with an `operator` and array of `conditions` which must either define a boolean `flag` state or `min`/`max` integers for a `status`. 
- **Array-Bound Navigation**: Scene targets natively sit under `.next[].target`, but Choices hide their next-step edges under `.options[].next`. 
- **Coordinates & Layout**: Layout dictates that custom node position states (`_position`) merge intelligently alongside unpositioned node Dagre placements. Removing or renaming this state breaks graph memory.

## 5. Coupling Points
- **Simulation History & Node Types**: `useSimulator.js` directly relies on knowledge that a Choice routes via `options` with `target` / `next` fields, while a Scene uses `next` blocks with `target` properties. 
- **Context Migrations & Condition Model**: `EditorContext.jsx` internal logic (`migrateChoiceRequires`, `migrateSceneRequires`) rewires legacy strings into objects based on exact condition structures. Changing the data contract without updating these transformers will corrupt user data loads.
- **Node Tooltips & State Styling**: Node UI styling in `SceneNode.jsx` tightly binds to the node's `.id` rendering prefix and depends heavily on `flagsMap` and `statusMap` passed straight from Context.

## 6. Hidden Complexity
- **ID Replacements**: Since connections reference node IDs heavily, features like `reorderScenes` manually map and string-replace IDs across the entire global document any time an entity position is swapped.
- **Implicit Fallbacks**: Edge routing algorithms execute sequentially; a missing "fallback" match (no conditions) in the last index of `.next` will result in a visual lock or soft crash in routing mechanics. 
- **Dagre State Dualism**: Nodes switch between auto-layout modes and explicitly tracked absolute coordinates. Adjusting generic node IDs changes layout logic handling since local coordinates might drop or misalign string lookups.

## 7. Persistence Inventory
The entire document operates tightly bound to IndexedDB (`localforage`) and `.json` file exports.

* **Database Key:** `branching-routes-data` (IndexedDB)
* **Metadata Export Wrapper:** `branching-routes.json` 

**`metadata`**
- Where it is written: [src/App.jsx, handleExport, line 98]
- Where it is read back: [src/App.jsx, handleImport, line 133] (imported via JSON payload)
- Storage layer: `.json` export blob
- Current format: object
- Is the key name itself persisted? NO
MIGRATION SAFE

**`flags`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 264] 
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 216]
- Storage layer: `localforage`
- Current format: Object map `{'F*': {id, name, state}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`choices`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 217]
- Storage layer: `localforage`
- Current format: Object map `{'CH*': {id, text, options: []}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`scenes`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 218]
- Storage layer: `localforage`
- Current format: Object map `{'S*': {id, name, next: []}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`paths`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 219]
- Storage layer: `localforage`
- Current format: Object map `{'P*': {id, name, color}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`chapters`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 220]
- Storage layer: `localforage`
- Current format: Object map `{'C*': {id, name, desc}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`statusPoints`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 221]
- Storage layer: `localforage`
- Current format: Object map `{'SP*': {id, name}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`quests`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 222]
- Storage layer: `localforage`
- Current format: Object map `{}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`endings`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 223]
- Storage layer: `localforage`
- Current format: Object map `{'E*': {id, name, desc}}`
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`entryNode`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 224]
- Storage layer: `localforage`
- Current format: String (ID referencing 'S001' or similar)
- Is the key name itself persisted? YES
MIGRATION REQUIRED

**`sceneTypes`**
- Where it is written: [src/context/EditorContext.jsx, useEffect (save), line 265]
- Where it is read back: [src/context/EditorContext.jsx, useEffect (load), line 225]
- Storage layer: `localforage`
- Current format: Array of strings
- Is the key name itself persisted? YES
MIGRATION REQUIRED
