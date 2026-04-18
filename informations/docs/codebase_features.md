# Branching Routes — Codebase Features

---

## Project Root

### `index.html`
- **Purpose:** Entry point HTML shell; mounts the React app into `#root`. Sets page title and meta description. Loads Inter font from Google Fonts.
- **Key exports:** None (HTML file).
- **Dependencies:** `src/main.jsx`

### `vite.config.js`
- **Purpose:** Vite build configuration. Configures `src/` absolute import aliases (`components`, `store`, `utils`, `styles`) so internal imports avoid relative `../../` chains.
- **Key exports:** Default Vite config object.
- **Dependencies:** `@vitejs/plugin-react`, `path`

---

## `src/`

### `src/main.jsx`
- **Purpose:** React application bootstrap. Renders `<App />` into the DOM root with `StrictMode`. Imports global CSS.
- **Key exports:** None (side-effect entry point).
- **Dependencies:** `App.jsx`, `styles/global.css`

### `src/App.jsx`
- **Purpose:** Root component. Composes the three-region grid layout: `<TopBar />`, `<GraphCanvas />`, and `<Sidebar />`.
- **Key exports:** `default App`
- **Dependencies:** `components/TopBar`, `components/GraphCanvas`, `components/Sidebar`, `App.css`

### `src/App.css`
- **Purpose:** CSS grid layout for the app shell — 48px top bar, flexible canvas area, 300px sidebar.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css` (via CSS custom properties)

---

## `src/styles/`

### `src/styles/tokens.css`
- **Purpose:** CSS custom properties for the design system: colours (backgrounds, text, accents, semantic states), spacing scale (4px base), typography (Inter), border radii, shadows, transitions.
- **Key exports:** CSS variables (`:root` scope).
- **Dependencies:** None.

### `src/styles/global.css`
- **Purpose:** CSS reset, base element styles, component styles (StoryNode, ConditionalEdge, TopBar), simulation mode overrides, React Flow theme overrides, and the `pulse-border` animation.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css` (imported via `@import`)

---

## `src/store/`

### `src/store/narrativeStore.js` (RENAMED FROM graphStore.js — 14-04-2026)
- **Purpose:** Zustand store owning the canonical graph: `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, and `meta`. Exposes CRUD actions for all narrative entity types including path/chapter management with cascading deletion, variant CRUD on common nodes, option CRUD on choice nodes with cascading edge cleanup, graph import/export at `schemaVersion: 4`, and new graph creation. Cross-coordinates with `uiStore` on deletions and loads. `deleteFlag` and `deleteStatus` referential integrity scans cover edge conditions, node-level side effects, variant `requires`, and option `requires`/`flags_set`/`status_set`.
- **Key exports:** `useNarrativeStore` (Zustand hook)
- **Dependencies:** `utils` (barrel — `generateId`)
- **Actions:** `addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `addStatus`, `updateStatus`, `deleteStatus`, `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`, `addVariant`, `updateVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption`, `updateMeta`, `loadGraph`, `newGraph`, `exportGraph`

### `src/store/uiStore.js`
- **Purpose:** Zustand store owning UI state: `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, and `choiceDisplayMode`. The `choiceDisplayMode` field (`'medium'` | `'full'`) controls rendering density for choice node option labels on the canvas.
- **Key exports:** `useUIStore` (Zustand hook)
- **Dependencies:** None.
- **Actions:** `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `toggleSnapToGrid`, `setChoiceDisplayMode`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store owning live simulation state: `activeNodeId`, `visitedNodeIds[]`, `traversedEdgeIds[]`, `currentFlagValues{}`, `reachableEdgeIds[]`, `reachableNodeIds[]`, `isRunning`. Exposes `start()`, `advance(edgeId)`, and `reset()` actions.
- **Key exports:** `useSimulationStore` (Zustand hook)
- **Dependencies:** `store` (barrel — `useNarrativeStore`), `utils` (barrel — `evaluateCondition`)

### `src/store/index.js`
- **Purpose:** Barrel re-export for all stores.
- **Key exports:** `useNarrativeStore`, `useUIStore`, `useSimulationStore`
- **Dependencies:** `narrativeStore`, `uiStore`, `simulationStore`

---

## `src/utils/`

### `src/utils/uuid.js`
- **Purpose:** Thin wrapper around the browser's `crypto.randomUUID()`. Returns a prefixed UUID string.
- **Key exports:** `generateId(prefix): string`
- **Dependencies:** None.

### `src/utils/conditionEvaluator.js`
- **Purpose:** Pure functions that evaluate a `Condition` object against a `flagState` map. The only file permitted to contain condition/logic evaluation code (AR-07).
- **Key exports:** `evaluateCondition(condition, flagState): boolean`, `evaluateClause(clause, flagState): boolean`
- **Dependencies:** None.

### `src/utils/fileSystem.js`
- **Purpose:** Browser File System Access API wrappers for save and open. Falls back to `<a download>` / `<input type="file">` when the API is unavailable. Validates `schemaVersion` on import (accepts v1–v4), runs migration chains (v1→v3, v2→v3, v3→v4), redistributes legacy `nodes[]` into sub-collections, strips legacy edge `sideEffects`, and initialises `path{}` and `chapter{}` for pre-v4 files.
- **Key exports:** `exportProject(graphData, defaultTitle): Promise<void>`, `importProject(): Promise<GraphData | null>`
- **Dependencies:** `utils/uuid` (`generateId`)

### `src/utils/index.js`
- **Purpose:** Barrel re-export for all utilities.
- **Key exports:** `generateId`, `evaluateCondition`, `evaluateClause`, `exportProject`, `importProject`
- **Dependencies:** `uuid`, `conditionEvaluator`, `fileSystem`

---

## `src/components/`

### `src/components/TopBar.jsx`
- **Purpose:** Horizontal top bar with app title, editable project title, file actions (New, Import, Export), Tidy Layout button (Dagre-based), Snap-to-Grid toggle, simulation controls (Start / Stop), and simulation status indicator.
- **Key exports:** `default TopBar`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`), `utils` (barrel — `exportProject`, `importProject`), `dagre`

### `src/components/GraphCanvas.jsx`
- **Purpose:** React Flow canvas wrapper. Derives React Flow nodes from the three sub-collections, registers custom node/edge types, handles interactions (click, connect, drag, double-click-to-add-node), manages simulation advance-by-click, applies simulation mode CSS class, and stamps `optionId` on edges when connections originate from per-option handles on choice nodes. Edges with an `optionId` are rendered with `sourceHandle` set so React Flow anchors them to the correct option handle.
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`), `@xyflow/react`, `components/nodes/CommonNode`, `components/nodes/ChoiceNode`, `components/nodes/EndingNode`, `components/edges/ConditionalEdge`

### `src/components/Sidebar.jsx`
- **Purpose:** Right-side panel with four tabs: Inspector (shows NodeInspector or EdgeInspector based on selection), Flags (shows FlagManager), Status (shows StatusManager), and Paths (shows PathChapterManager).
- **Key exports:** `default Sidebar`
- **Dependencies:** `store` (barrel — `useUIStore`), `NodeInspector`, `EdgeInspector`, `FlagManager`, `StatusManager`, `PathChapterManager`

### `src/components/NodeInspector.jsx`
- **Purpose:** Form panel for editing a selected node's properties based on its type (label, content, path/chapter assignment, side effects, start node status). Performs multi-collection lookups to locate nodes. Includes path and chapter assignment dropdowns that write `pathId`/`chapterId` to `node.data` via `updateNode`. Conditionally mounts `VariantEditor` for common nodes and `OptionEditor` for choice nodes below the existing form sections. Includes node deletion.
- **Key exports:** `default NodeInspector`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`), `components/OptionEditor`, `components/VariantEditor`

### `src/components/EdgeInspector.jsx`
- **Purpose:** Form panel for editing a selected edge's label and condition (AND/OR operator + clauses). When the edge has an `optionId`, displays a read-only "Connected from option" field showing the originating option's label from the source choice node. Includes edge deletion.
- **Key exports:** `default EdgeInspector`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/FlagManager.jsx`
- **Purpose:** Panel listing all flags with name and default boolean value. Add-flag form with live name validation. Delete with referential integrity checking (RISK-02 mitigation).
- **Key exports:** `default FlagManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/StatusManager.jsx`
- **Purpose:** Panel listing all status points with name, value, min/max. Add-status form with live name validation. Delete with referential integrity checking.
- **Key exports:** `default StatusManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/PathChapterManager.jsx`
- **Purpose:** Panel with two sections (Paths and Chapters) providing list, add, rename, and delete UI for both entity types. All mutations go through store actions. Local state is limited to add-form text inputs (AR-03 compliant).
- **Key exports:** `default PathChapterManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/nodes/CommonNode.jsx`
- **Purpose:** Custom React Flow node renderer for standard narrative components. Displays label, truncated content preview, and a solid green header bar with a `COMMON` badge and side-effect count. Applies simulation state CSS classes (`--active`, `--visited`, `--reachable`). Uses `React.memo` with targeted selectors.
- **Key exports:** `default CommonNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/nodes/ChoiceNode.jsx`
- **Purpose:** Custom React Flow node renderer for choice points. Displays label, truncated content preview, and a solid blue header bar with a `CHOICE` badge, side-effect count, and outgoing edge count. When `data.options` is present, renders one source `Handle` per option (keyed by option `id`) with option labels in the node body; falls back to a single source handle when no options exist. Respects `choiceDisplayMode` from `uiStore` for rendering density. Applies simulation state CSS classes. Uses `React.memo`.
- **Key exports:** `default ChoiceNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/nodes/EndingNode.jsx`
- **Purpose:** Custom React Flow node renderer for terminal states. Displays label, truncated content preview, a solid orange header bar with an `ENDING` badge, and a footer terminal bar. Omits outgoing handle for structural AR-12 compliance. Applies simulation state CSS classes. Uses `React.memo`.
- **Key exports:** `default EndingNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer using `BaseEdge` + `EdgeLabelRenderer`. Displays edge label and condition badge (AND/OR pill). Applies simulation state CSS classes (`--traversed`, `--reachable`). Uses `React.memo` with targeted selectors.
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/index.js`
- **Purpose:** Barrel re-export for all components.
- **Key exports:** `GraphCanvas`, `CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge`, `TopBar`, `Sidebar`, `NodeInspector`, `EdgeInspector`, `FlagManager`, `StatusManager`, `PathChapterManager`, `OptionEditor`, `VariantEditor`
- **Dependencies:** All files in `components/`

---

## Changelog

## [2026-04-18] — Variants_on_nodes_and_Options_on_choices
### Added
- `VariantEditor.jsx`: New component for editing conditional text variants on common nodes (label, text, requires condition).
- `OptionEditor.jsx`: New component for editing selectable options on choice nodes (label, requires condition, flags_set, status_set).
- `narrativeStore.js`: Six new CRUD actions — `addVariant`, `updateVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption`. `deleteOption` cascades to remove edges with matching `optionId`.
- `uiStore.js`: `choiceDisplayMode` state and `setChoiceDisplayMode` action for choice node rendering density.
- `EdgeInspector.jsx`: Read-only "Connected from option" field for edges with an `optionId`.
- `ChoiceNode.jsx`: Per-option source handles rendered from `data.options`, with fallback single handle for legacy nodes.
- `GraphCanvas.jsx`: `onConnect` stamps `optionId` on edges from option handles; edge mapping passes `sourceHandle` for correct visual anchoring.
- `components/index.js`: Barrel exports for `OptionEditor` and `VariantEditor`.
### Changed
- `narrativeStore.js`: `addEdge` accepts optional third `optionId` argument. Duplicate-edge check now includes `optionId` in the uniqueness tuple. `deleteFlag`/`deleteStatus` referential integrity scans extended to cover `variants[].requires`, `options[].requires`, `options[].flags_set`, and `options[].status_set`.
- `NodeInspector.jsx`: Conditionally mounts `VariantEditor` for common nodes and `OptionEditor` for choice nodes.
- `global.css`: Removed `overflow: hidden` from `.story-node` to prevent handle clipping; added `border-radius` to type bars; removed explicit handle dimensions from `.choice-node__handle`.

## [2026-04-17] — Path_Chapter_Entities
### Added
- `PathChapterManager.jsx`: New CRUD management UI for paths and chapters, mounted in a new "Paths" tab in the Sidebar.
- `narrativeStore.js`: `path{}` and `chapter{}` dictionaries with full CRUD actions (`addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`) including cascading `pathId`/`chapterId` nullification on deletion.
- `NodeInspector.jsx`: Two new `<select>` dropdowns (Path, Chapter) for assigning nodes to organizational groups via `updateNode`.
- `fileSystem.js`: v3→v4 migration pass initialising `path: {}` and `chapter: {}` for legacy files.
### Changed
- `narrativeStore.js`: `exportGraph()` now emits `schemaVersion: 4` with `path` and `chapter` dictionaries. `loadGraph()` and `newGraph()` initialise both collections.
- `fileSystem.js`: Version guard now accepts `schemaVersion: 4`.
- `Sidebar.jsx`: Tab bar expanded from 3 tabs (Inspector, Flags, Status) to 4 tabs (+ Paths).
- `components/index.js`: Added `PathChapterManager` export.

## [2026-04-15] — Canvas Visual Identity Iteration
### Changed
- `CommonNode` now features a solid green header bar with a `COMMON` type label and effect badge.
- `ChoiceNode` now features a solid blue header bar with a `CHOICE` type label, effect badge, and an outgoing edge count indicator.
- `EndingNode` now features a solid orange header bar with an `ENDING` type label and a footer terminal bar with a prompt icon.
- Added visual token colors (`--color-node-common`, `--color-node-choice`, `--color-node-ending`) to `tokens.css`.
- Node bodies now feature a cleaner, unified structure without inline type text.
### Deprecated
- The single generic `.story-node` border treatment previously shared by all nodes.
- Inline type text (e.g., `[Choice]`, `[END]`) within node titles.
### Migration
- no — changes were purely presentational and did not alter the saved data structure.


## [2026-04-15] — Data Model, Canvas, State Management Iteration
### Changed
- `narrativeStore` now holds `common{}`, `choice{}`, `ending{}` sub-collections instead of a flat `nodes[]` array.
- `GraphCanvas.jsx` derives React Flow nodes directly from the three new sub-collections.
- Node rendering architecture split from a single component into dedicated `CommonNode`, `ChoiceNode`, and `EndingNode` renderers.
- `meta` schema enriched with `commonNodeTypes` and `endingTypes` tracking arrays.
### Deprecated
- The flat `nodes[]` array schema is strictly un-supported for new documents.
- The `sideEffects` field on edges is completely removed (one-way).
- `StoryNode.jsx` has been completely deleted and functionally replaced.
### Migration
- yes — `fileSystem.js` transparently distributes legacy `nodes[]` into the correct sub-collections upon load, and actively removes `sideEffects` from edges under `schemaVersion: 1`. Save files are now emitted as `schemaVersion: 2`.

## [2026-04-14] — Structural Refactor
### Changed
- `src/store/graphStore.js` renamed to `src/store/narrativeStore.js` directly owning canonical data.
- Extraction of UI state to a new `src/store/uiStore.js` to manage selected entity and snap grid configuration.
- ID System updated to emit prefixed UUID strings (`n-{uuid}`, `e-{uuid}`, `f-{uuid}`).
- Component dependencies updated to use `useNarrativeStore` and `useUIStore`.
### Retired
- `graphStore.js` was replaced by `narrativeStore.js`.
- Legacy bare UUID generation from `generateId` was replaced by prefixed generation.
### Behavior
- Unchanged — this was a structural refactor
### Migration
- Yes — New entities use prefixed IDs; legacy UUIDs remain acceptable at import via backward compatibility rules.

## [2026-04-11] — Initial Creation

### Added
- Design system: CSS custom properties (`tokens.css`), global reset and component styles (`global.css`), three-region grid layout (`App.css`)
- Graph data layer: `graphStore` with full CRUD for nodes, edges, and flags; selection management; graph import/export/new
- Simulation data layer: `simulationStore` with start/advance/reset, side-effect execution in AR-11 order, reachable set computation
- Utilities: UUID generation (`uuid.js`), pure condition evaluator (`conditionEvaluator.js`), File System Access API with fallback (`fileSystem.js`)
- Interactive canvas: React Flow integration with custom `StoryNode` and `ConditionalEdge` types, double-click-to-add, drag-to-connect, node drag persistence
- Sidebar panels: `NodeInspector` (label, content, side effects, start node, delete), `EdgeInspector` (label, conditions, side effects, delete), `FlagManager` (add/delete with referential integrity)
- Live simulation: Start/Stop controls, simulation mode banner, advance-by-click, active/visited/reachable visual states, simulation mode CSS lockout
- Auto-layout: Dagre-powered "Tidy Layout" button with left-to-right ranking
- File I/O: New/Import/Export buttons with schema version validation, browser API fallback, and save confirmation indicator
- Vite path aliases for clean absolute imports (`components/`, `store/`, `utils/`, `styles/`)
