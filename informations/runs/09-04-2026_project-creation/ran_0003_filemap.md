# File Map

## Project Root

### `index.html`
- **Purpose:** Entry point HTML shell; mounts the React app into `#root`. Sets `<title>` and meta description for SEO.
- **Key exports:** None (HTML file).
- **Dependencies:** `src/main.jsx`

### `vite.config.js`
- **Purpose:** Vite build configuration. Configures the `src/` absolute import alias so all internal imports use `components/`, `store/`, `utils/` without relative `../../` chains.
- **Key exports:** Default Vite config object.
- **Dependencies:** None.

---

## `src/`

### `src/main.jsx`
- **Purpose:** React application bootstrap. Renders `<App />` into the DOM root. No business logic.
- **Key exports:** None (side-effect entry point).
- **Dependencies:** `src/App.jsx`, global CSS.

### `src/App.jsx`
- **Purpose:** Root component. Composes the top-level layout: `<TopBar />`, `<GraphCanvas />`, and `<Sidebar />`. Manages no state directly — all state comes from stores.
- **Key exports:** `default App`
- **Dependencies:** `components/TopBar`, `components/GraphCanvas`, `components/Sidebar`

---

## `src/styles/`

### `src/styles/tokens.css`
- **Purpose:** CSS custom properties for the design system: colours, spacing scale, typography, border radii, shadows. The single source of truth for all visual tokens.
- **Key exports:** CSS variables (`:root` scope).
- **Dependencies:** None.

### `src/styles/global.css`
- **Purpose:** CSS reset, base element styles, and utility classes (e.g., `.visually-hidden`). Imports `tokens.css`.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css`

---

## `src/store/`

### `src/store/graphStore.js`
- **Purpose:** Zustand store that owns the canonical graph: `nodes[]`, `edges[]`, `flags[]`, and `meta`. Exposes actions for CRUD on all three entity types. Computes derived React Flow `nodes`/`edges` arrays from internal state.
- **Key exports:** `useGraphStore` (Zustand hook)
- **Dependencies:** `utils/uuid`, `utils/fileSystem`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store that owns the live simulation state: `activeNodeId`, `visitedNodeIds[]`, `traversedEdgeIds[]`, `currentFlagValues{}`, `isRunning`. Exposes `start()`, `advance(edgeId)`, and `reset()` actions. Never modifies `graphStore`.
- **Key exports:** `useSimulationStore` (Zustand hook)
- **Dependencies:** `store/graphStore`, `utils/conditionEvaluator`

### `src/store/index.js`
- **Purpose:** Barrel re-export for all stores.
- **Key exports:** `useGraphStore`, `useSimulationStore`
- **Dependencies:** `store/graphStore`, `store/simulationStore`

---

## `src/utils/`

### `src/utils/uuid.js`
- **Purpose:** Thin wrapper around the browser's `crypto.randomUUID()`. Returns a UUID v4 string. Centralised so mocking in tests is straightforward.
- **Key exports:** `generateId(): string`
- **Dependencies:** None.

### `src/utils/conditionEvaluator.js`
- **Purpose:** Pure functions that evaluate a `Condition` object against a `flagState` map and return `boolean`. The only file allowed to contain condition/logic evaluation code.
- **Key exports:** `evaluateCondition(condition, flagState): boolean`, `evaluateClause(clause, flagState): boolean`
- **Dependencies:** None.

### `src/utils/fileSystem.js`
- **Purpose:** Browser File System Access API wrappers: `saveFile(data)` and `openFile()`. Handles serialisation (`JSON.stringify`), deserialisation, and `schemaVersion` validation. Throws a typed error for invalid schema versions.
- **Key exports:** `saveFile(graphData): Promise<void>`, `openFile(): Promise<GraphData>`
- **Dependencies:** None.

### `src/utils/index.js`
- **Purpose:** Barrel re-export for all utilities.
- **Key exports:** `generateId`, `evaluateCondition`, `evaluateClause`, `saveFile`, `openFile`
- **Dependencies:** `utils/uuid`, `utils/conditionEvaluator`, `utils/fileSystem`

---

## `src/components/`

### `src/components/TopBar.jsx`
- **Purpose:** Horizontal top bar with project title, file actions (New, Open, Save), and simulation controls (Start / Stop). Reads `isRunning` from `simulationStore`.
- **Key exports:** `default TopBar`
- **Dependencies:** `store/graphStore`, `store/simulationStore`

### `src/components/GraphCanvas.jsx`
- **Purpose:** The React Flow canvas wrapper. Subscribes to `graphStore` for nodes/edges and `simulationStore` for highlighting state. Passes custom node and edge types to React Flow. Handles canvas-level interactions (drag-to-connect, right-click context menu trigger).
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store/graphStore`, `store/simulationStore`, `components/nodes/`, `components/edges/`

### `src/components/Sidebar.jsx`
- **Purpose:** Right-side panel. Conditionally renders `<NodeInspector />` (when a node is selected) or `<FlagManager />` (when the Flags tab is active). No state of its own.
- **Key exports:** `default Sidebar`
- **Dependencies:** `store/graphStore`, `components/NodeInspector`, `components/FlagManager`

### `src/components/NodeInspector.jsx`
- **Purpose:** Form panel for editing the selected node's `label`, `content`, and `sideEffects`. Writes back to `graphStore` via store actions.
- **Key exports:** `default NodeInspector`
- **Dependencies:** `store/graphStore`

### `src/components/FlagManager.jsx`
- **Purpose:** Panel listing all `flags` in the graph. Supports adding a new flag (name, type, defaultValue) and deleting existing flags. Validates name against the alphanumeric + underscore rule.
- **Key exports:** `default FlagManager`
- **Dependencies:** `store/graphStore`

### `src/components/EdgeInspector.jsx`
- **Purpose:** Form panel for editing a selected edge's `label` and `condition` (operator + clauses). Available flags are pulled from `graphStore` to populate clause dropdowns.
- **Key exports:** `default EdgeInspector`
- **Dependencies:** `store/graphStore`

### `src/components/nodes/StoryNode.jsx`
- **Purpose:** Custom React Flow node renderer for a story node. Displays `label`, a truncated `content` preview, and a side-effect count badge. Applies visual state classes (`--active`, `--visited`, `--reachable`) from `simulationStore`.
- **Key exports:** `default StoryNode`
- **Dependencies:** `store/simulationStore`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer. Displays the edge `label` inline and a condition badge (AND/OR) when a condition is present. Applies `--traversed` and `--reachable` visual states from `simulationStore`.
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store/simulationStore`

### `src/components/index.js`
- **Purpose:** Barrel re-export for all components.
- **Key exports:** All component defaults.
- **Dependencies:** All files in `components/`.
