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

### `src/store/graphStore.js`
- **Purpose:** Zustand store owning the canonical graph: `nodes[]`, `edges[]`, `flags[]`, and `meta`. Exposes CRUD actions for all entity types, selection management, graph import/export, and the `snapToGrid` toggle.
- **Key exports:** `useGraphStore` (Zustand hook)
- **Dependencies:** `utils` (barrel — `generateId`)
- **Actions:** `addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `updateMeta`, `selectNode`, `selectEdge`, `clearSelection`, `loadGraph`, `newGraph`, `exportGraph`, `toggleSnapToGrid`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store owning live simulation state: `activeNodeId`, `visitedNodeIds[]`, `traversedEdgeIds[]`, `currentFlagValues{}`, `reachableEdgeIds[]`, `reachableNodeIds[]`, `isRunning`. Exposes `start()`, `advance(edgeId)`, and `reset()` actions.
- **Key exports:** `useSimulationStore` (Zustand hook)
- **Dependencies:** `store` (barrel — `useGraphStore`), `utils` (barrel — `evaluateCondition`)

### `src/store/index.js`
- **Purpose:** Barrel re-export for all stores.
- **Key exports:** `useGraphStore`, `useSimulationStore`
- **Dependencies:** `graphStore`, `simulationStore`

---

## `src/utils/`

### `src/utils/uuid.js`
- **Purpose:** Thin wrapper around the browser's `crypto.randomUUID()`. Returns a UUID v4 string.
- **Key exports:** `generateId(): string`
- **Dependencies:** None.

### `src/utils/conditionEvaluator.js`
- **Purpose:** Pure functions that evaluate a `Condition` object against a `flagState` map. The only file permitted to contain condition/logic evaluation code (AR-07).
- **Key exports:** `evaluateCondition(condition, flagState): boolean`, `evaluateClause(clause, flagState): boolean`
- **Dependencies:** None.

### `src/utils/fileSystem.js`
- **Purpose:** Browser File System Access API wrappers for save and open. Falls back to `<a download>` / `<input type="file">` when the API is unavailable. Validates `schemaVersion` on import.
- **Key exports:** `exportProject(graphData, defaultTitle): Promise<void>`, `importProject(): Promise<GraphData | null>`
- **Dependencies:** None.

### `src/utils/index.js`
- **Purpose:** Barrel re-export for all utilities.
- **Key exports:** `generateId`, `evaluateCondition`, `evaluateClause`, `exportProject`, `importProject`
- **Dependencies:** `uuid`, `conditionEvaluator`, `fileSystem`

---

## `src/components/`

### `src/components/TopBar.jsx`
- **Purpose:** Horizontal top bar with app title, editable project title, file actions (New, Import, Export), Tidy Layout button (Dagre-based), Snap-to-Grid toggle, simulation controls (Start / Stop), and simulation status indicator.
- **Key exports:** `default TopBar`
- **Dependencies:** `store` (barrel — `useGraphStore`, `useSimulationStore`), `utils` (barrel — `exportProject`, `importProject`), `dagre`

### `src/components/GraphCanvas.jsx`
- **Purpose:** React Flow canvas wrapper. Transforms store state into React Flow format, registers custom node/edge types, handles interactions (click, connect, drag, double-click-to-add-node), manages simulation advance-by-click, and applies simulation mode CSS class.
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store` (barrel — `useGraphStore`, `useSimulationStore`), `@xyflow/react`, `components/nodes/StoryNode`, `components/edges/ConditionalEdge`

### `src/components/Sidebar.jsx`
- **Purpose:** Right-side panel with two tabs: Inspector (shows NodeInspector or EdgeInspector based on selection) and Flags (always shows FlagManager).
- **Key exports:** `default Sidebar`
- **Dependencies:** `store` (barrel — `useGraphStore`), `NodeInspector`, `EdgeInspector`, `FlagManager`

### `src/components/NodeInspector.jsx`
- **Purpose:** Form panel for editing the selected node's label, content, side effects, and start node status. Includes node deletion.
- **Key exports:** `default NodeInspector`
- **Dependencies:** `store` (barrel — `useGraphStore`)

### `src/components/EdgeInspector.jsx`
- **Purpose:** Form panel for editing a selected edge's label, condition (AND/OR operator + clauses), and side effects. Shows execution order hint. Includes edge deletion.
- **Key exports:** `default EdgeInspector`
- **Dependencies:** `store` (barrel — `useGraphStore`)

### `src/components/FlagManager.jsx`
- **Purpose:** Panel listing all flags with name, type badge, and default value. Add-flag form with live name validation. Delete with referential integrity checking (RISK-02 mitigation).
- **Key exports:** `default FlagManager`
- **Dependencies:** `store` (barrel — `useGraphStore`)

### `src/components/nodes/StoryNode.jsx`
- **Purpose:** Custom React Flow node renderer. Displays label, truncated content preview, side-effect count badge. Applies simulation state CSS classes (`--active`, `--visited`, `--reachable`). Uses `React.memo` with targeted selectors (RISK-01 mitigation). Hides outgoing handle on ending nodes (AR-12).
- **Key exports:** `default StoryNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer using `BaseEdge` + `EdgeLabelRenderer`. Displays edge label and condition badge (AND/OR pill). Applies simulation state CSS classes (`--traversed`, `--reachable`). Uses `React.memo` with targeted selectors.
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/index.js`
- **Purpose:** Barrel re-export for all components.
- **Key exports:** `GraphCanvas`, `StoryNode`, `ConditionalEdge`, `TopBar`, `Sidebar`, `NodeInspector`, `EdgeInspector`, `FlagManager`
- **Dependencies:** All files in `components/`

---

## Changelog

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
