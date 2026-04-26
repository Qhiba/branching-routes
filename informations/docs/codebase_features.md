# Branching Routes — Codebase Features

---

## Project Root

### `index.html`
- **Purpose:** Entry point HTML shell; mounts the React app into `#root`. Sets page title and meta description. Loads Inter font from Google Fonts.
- **Key exports:** None (HTML file).
- **Dependencies:** `src/main.jsx`

### `vite.config.js`
- **Purpose:** Vite build configuration. Configures `src/` absolute import aliases (`components`, `store`, `utils`, `styles`, `hooks`) so internal imports avoid relative `../../` chains.
- **Key exports:** Default Vite config object.
- **Dependencies:** `@vitejs/plugin-react`, `path`

---

## `src/`

### `src/main.jsx`
- **Purpose:** React application bootstrap and persistence wiring. On startup, runs `initPersistence()` asynchronously: loads any previously saved graph from IndexedDB via `loadFromIndexedDB()` (calling `loadGraph()` and `exitCampaign()` when data is found), restores saved campaigns via `useCampaignStore.getState().loadCampaignsFromIndexedDB()`, then wires two debounced Zustand `subscribe` calls — one on `narrativeStore` to call `saveToIndexedDB` and one on `campaignStore` to call `saveCampaignsToIndexedDB`, both at 1000ms debounce. After persistence is initialised, renders `<App />` into the DOM root with `StrictMode`.
- **Key exports:** None (side-effect entry point).
- **Dependencies:** `App.jsx`, `styles/global.css`, `utils` (barrel — `loadFromIndexedDB`, `saveToIndexedDB`), `store` (barrel — `useNarrativeStore`, `useSimulationStore`, `useCampaignStore`)

### `src/App.jsx`
- **Purpose:** Root component. Composes the 2-column shell layout: `<TopBar />`, `<LeftSidebar />`, `<GraphCanvas />` (with `<FloatingMiddleBar />` overlaid inside the canvas area), and `<RightSidebar />`. Also mounts `<Toast />` and `<CommandPalette />` as fixed viewport overlays outside the `ReactFlowProvider` subtree (AR-19 compliant).
- **Key exports:** `default App`
- **Dependencies:** `components/TopBar`, `components/GraphCanvas`, `components/layout/LeftSidebar`, `components/layout/RightSidebar`, `components/floating/FloatingMiddleBar`, `components/CommandPalette`, `components/Toast`, `App.css`

### `src/App.css`
- **Purpose:** CSS grid layout for the app shell — 48px top bar, two-column main area (left sidebar + canvas + right sidebar), 28px status strip.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css` (via CSS custom properties)

---

## `src/styles/`

### `src/styles/tokens.css`
- **Purpose:** CSS custom properties for the design system: colours (backgrounds, text, accents, semantic states, campaign simulation states), spacing scale (4px base), typography (Inter), border radii, shadows, transitions. Adds five campaign-state colour tokens: `--color-node-locked`, `--color-node-complete`, `--color-node-failed`, `--color-node-branch-locked`, `--color-node-seen`. Adds an explicit five-level z-index scale: `--z-cluster`, `--z-context-menu`, `--z-modal`, `--z-palette`, `--z-toast`. Adds cluster palette color tokens for auto-hashed entity region colors. Extended with indigo accent scale (`--color-accent-500` / `-600`), amber/emerald/blue/rose/purple/cyan accent families, shadow tokens (`--shadow-float`, `--shadow-nameplate`), and animation keyframes (`fade-in`, `zoom-in-95`, `slide-in-from-top`).
- **Key exports:** CSS variables (`:root` scope).
- **Dependencies:** None.

### `src/styles/utilities.css` (NEW)
- **Purpose:** Shared UI-v2 primitive classes reused across new components: `.ui-v2-pill`, `.ui-v2-nameplate`, `.ui-v2-floating-bar`, `.ui-v2-modal-shell`, `.ui-v2-segmented-control`, and related modifier classes. Imported by `global.css`.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css` (via CSS custom properties)

### `src/styles/global.css`
- **Purpose:** CSS reset, base element styles, component styles (StoryNode, ConditionalEdge, SandboxPanel), campaign mode overrides (`.campaign-mode` wrapper class), and the `pulse-border` animation. Contains six-state node simulation classes (`.story-node--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`), the `--seen` overlay pseudo-element, choice option interaction classes, edge condition-pass/fail/traversed/unselected-dim classes, `.story-node__warning-badge` styles, `.sandbox-panel` component styles, Toast overlay, CommandPalette overlay, and cluster overlay SVG regions. Imports `utilities.css`. Legacy TopBar, CreationBar, StatusStrip, and RouteFinderDialog CSS blocks removed in Phase 8 cleanup.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css`, `styles/utilities.css` (imported via `@import`)

---

## `src/store/`

### `src/store/narrativeStore.js` (RENAMED FROM graphStore.js — 14-04-2026)
- **Purpose:** Zustand store owning the canonical graph: `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, and `meta`. Exposes CRUD actions for all narrative entity types including path/chapter management with cascading deletion, variant CRUD on common nodes, option CRUD on choice nodes with cascading edge cleanup, graph import/export at `schemaVersion: 4`, and new graph creation. Cross-coordinates with `uiStore` on deletions and loads. `deleteFlag` and `deleteStatus` referential integrity scans cover edge conditions, node-level side effects, variant `requires`, and option `requires`/`flags_set`/`status_set`.
- **Key exports:** `useNarrativeStore` (Zustand hook)
- **Dependencies:** `utils` (barrel — `generateId`)
- **Actions:** `addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `addStatus`, `updateStatus`, `deleteStatus`, `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`, `addVariant`, `updateVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption`, `updateMeta`, `loadGraph`, `newGraph`, `exportGraph`

### `src/store/uiStore.js`
- **Purpose:** Zustand store owning UI state: `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, `choiceDisplayMode`, `selectedNodeIds`, `labelDisplayMode`, `clusterMode`, `showTraversalOverlay`, `showShortestRouteOverlay`, and `selectedRouteIndex`. The `choiceDisplayMode` field (`'medium'` | `'full'`) controls rendering density for choice node option labels on the canvas. The `labelDisplayMode` field (`'compact'` | `'verbose'`) controls whether node and edge renderers show full flag/status names or compact count badges. The `clusterMode` field controls the cluster overlay visibility. `showRouteFinderDialog` and `toggleRouteFinderDialog` were removed in the UI integration push (their sole consumer, `RouteFinderDialog.jsx`, was deleted).
- **Key exports:** `useUIStore` (Zustand hook)
- **Dependencies:** None.
- **Actions:** `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `toggleSnapToGrid`, `setChoiceDisplayMode`, `setSelectedNodeIds`, `toggleLabelDisplayMode`, `cycleClusterMode`, `toggleTraversalOverlay`, `toggleShortestRouteOverlay`, `setSelectedRouteIndex`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store owning campaign-mode state and live simulation. Runs in two modes: edit mode (passive structural analysis only — `runPassiveAnalysis` computes `orphanedNodeIds`/`unreachableNodeIds` via BFS from the start node) and campaign mode (full simulation lifecycle). Campaign lifecycle: `enterCampaign(campaignPayload?)` accepts an optional campaign object. `advance(edgeId)` moves to the destination node, records the move into `traversalRecords[]` containing `{ edgeId, targetNodeId, priorFlagSnapshot, priorStatusSnapshot }`, updates `seenNodeIds` and `traversedEdgeIds`, and recomputes node states. `undoLastNode()` pops a record from `traversalRecords`, resets `activeNodeId`, completely restores `currentFlagValues` and `currentStatusValues` using the captured snapshot, and rebuilds sets. `selectOption(optionId)` fires side effects, sets `selectedOptionId`, and modifies reachability. `computeRoutesFromStart` executes pathfinding via `routeTracer.js` storing multiple potential sequence strings in `shortestRouteResults`. The store tracks forward-reachability (`forwardReachableNodeIds`) leveraging BFS scanning under `computeForwardReachable` to power `--coverage-gap` visual styles. Sandbox overrides bypass narrative defaults ephemerally.
- **Key exports:** `useSimulationStore` (Zustand hook)
- **Dependencies:** `store` (barrel — `useNarrativeStore`), `utils` (barrel — `evaluateCondition`, `computeShortestPaths`, `computeForwardReachable`), `store/campaignStore.js`
- **Actions:** `enterCampaign`, `exitCampaign`, `reset`, `advance`, `undoLastNode`, `selectOption`, `applySandboxOverride`, `runPassiveAnalysis`, `getNodeState`, `snapshotCampaign`, `setAutosaveCampaign`, `computeRoutesFromStart`, `clearRouteResults`, `setShortestRouteStale`

### `src/store/toastStore.js`
- **Purpose:** Zustand store owning ephemeral toast state. `toasts` array holds `{ id, message, variant, duration }` objects. `addToast(message, variant, duration?)` creates a toast via `generateId('toast')`, appends it, and schedules `removeToast(id)` via `setTimeout`. `removeToast(id)` filters the toast from `toasts`. Store is ephemeral: never wired to IndexedDB, never appears in `exportGraph()` output, no boot-time restore. `toasts` initialised as `[]` in state so no selector ever needs a `?? []` fallback (AR-14 compliance).
- **Key exports:** `useToastStore` (Zustand hook)
- **Dependencies:** `utils` (barrel — `generateId`)
- **Actions:** `addToast(message, variant, duration?)`, `removeToast(id)`

### `src/store/index.js`
- **Purpose:** Barrel re-export for all stores.
- **Key exports:** `useNarrativeStore`, `useUIStore`, `useSimulationStore`, `useCampaignStore`, `useToastStore`
- **Dependencies:** `narrativeStore`, `uiStore`, `simulationStore`, `campaignStore`, `toastStore`
### `src/store/campaignStore.js`
- **Purpose:** Zustand store owning the campaign dictionary and active campaign pointer. Campaigns are named simulation snapshots that persist across sessions. Each campaign stores `{ id, name, createdAt, updatedAt, campaignSchemaVersion: 1, snapshot: { activeNodeId, seenNodeIds, traversedEdgeIds, flagOverrides, statusOverrides } }`. Provides full CRUD (`addCampaign` returns the new campaign ID for immediate chaining), IndexedDB persistence via `saveCampaignsToIndexedDB`/`loadCampaignsFromIndexedDB`, and `loadCampaignsFromObject` for restoring campaigns from a ZIP import. `loadCampaignsFromIndexedDB` always resets `activeCampaignId` to `null` after restore — preventing stale active-campaign state on boot.
- **Key exports:** `useCampaignStore` (Zustand hook)
- **Dependencies:** `utils` (direct — `generateId`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`)
- **Actions:** `addCampaign`, `updateCampaign`, `deleteCampaign`, `setActiveCampaign`, `clearCampaigns`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `loadCampaignsFromObject`

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

### `src/utils/routeTracer.js`
- **Purpose:** Pure functions responsible for whole-graph reachability logic decoupled from UI renders. Contains `detectDeadEnds()` scanning for nodes with no outgoing edges, `computeForwardReachable()` providing a standard BFS pass across all dynamically passable gateways starting from the active narrative state, and `computeShortestPaths()` — a K-Shortest gate-evaluating BFS tracking paths up limits respecting priority tie-breakers.
- **Key exports:** `detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`
- **Dependencies:** `utils/conditionEvaluator`

### `src/utils/fileSystem.js`
- **Purpose:** Primary persistence layer and explicit file I/O. Provides narrative IndexedDB functions (`saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`) and campaign IndexedDB functions (`saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB`) on a two-store IndexedDB schema (`graphs` + `campaigns`, DB v2). Explicit file I/O via Browser File System Access API with `<a download>` / `<input type="file">` fallback. Export: produces a `.zip` bundle (JSZip, browser-only) containing `datamodel.json` + `campaigns/{name}.json` per campaign when campaigns are present; falls back to a plain `.json` download when no campaigns exist. Import: detects `.zip` vs `.json` by file extension; extracts and validates `campaignSchemaVersion: 1` campaign files from ZIP; passes narrative data through the unchanged v1→v4 migration chain and full field-level sanitization pass.
- **Key exports:** `saveToIndexedDB(graphData): Promise<void>`, `loadFromIndexedDB(): Promise<GraphData | null>`, `clearIndexedDB(): Promise<void>`, `saveCampaignsToIndexedDB(payload): Promise<void>`, `loadCampaignsFromIndexedDB(): Promise<CampaignRecord | null>`, `clearCampaignsIndexedDB(): Promise<void>`, `exportProject(graphData, campaigns, defaultTitle): Promise<void>`, `importProject(): Promise<{ graphData, campaigns } | null>`
- **Dependencies:** `utils/uuid` (`generateId`), `jszip`

### `src/utils/index.js`
- **Purpose:** Barrel re-export for all utilities.
- **Key exports:** `generateId`, `evaluateCondition`, `evaluateClause`, `exportProject`, `importProject`, `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB`, `detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`
- **Dependencies:** `uuid`, `conditionEvaluator`, `fileSystem`, `routeTracer`

---

## `src/hooks/`

### `src/hooks/useKeyboardShortcuts.js`
- **Purpose:** Custom hook that attaches a single `keydown` listener to `window` on mount and removes it on unmount. Guards: bails early if `event.target` is an `INPUT`, `TEXTAREA`, or `contenteditable` element (RISK-CMK-01 mitigation); bails if `isCampaignActive === true` for all authoring shortcuts (AR-08). `Ctrl+K` is checked as the very first condition before the input-field guard so it closes the palette even when the palette's own `<input>` is focused (RISK-CP-04 mitigation). Dispatches: `Ctrl+K` → dispatches `palette-toggle` DOM event (opens/closes CommandPalette); node/edge creation shortcuts (`N`→Common, `C`→Choice, `E`→Ending via `canvas-add-node` custom event); naming modal shortcuts (`F`→Flag, `S`→Status, `P`→Path, `H`→Chapter via `canvas-open-name-modal` custom event); deletion (`Del` — multi or single node/edge); `Escape` (clears selection via `uiStore`); view shortcuts (`V`→toggle snap, `L`→tidy layout, `R`→toggle label display mode, `G`→`cycleClusterMode`). Mounted once inside `GraphCanvas`.
- **Key exports:** `default useKeyboardShortcuts`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`)

---

## `src/components/`

### `src/components/TopBar.jsx`
- **Purpose:** Horizontal top bar with three sections: left (brand logo + editable project title), center (icon-button clusters: Tidy Layout / Snap-to-Grid / Cluster Mode), right (file ops: New / Import / Export). No campaign controls — Enter/Exit Campaign is now FloatingMiddleBar's responsibility. `handleNew` opens a `<ConfirmModal />` before calling `clearCampaignsIndexedDB` + `clearIndexedDB` + `newGraph()`. TopBar CSS uses `ui-v2-topbar-*` classes with glassmorphism styling.
- **Key exports:** `default TopBar`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`, `useCampaignStore`), `utils` (barrel — `exportProject`, `importProject`, `clearIndexedDB`, `clearCampaignsIndexedDB`), `dagre`, `components/ConfirmModal`, `TopBar.css`

### `src/components/GraphCanvas.jsx`
- **Purpose:** React Flow canvas wrapper. Derives React Flow nodes/edges from narrative store, registers custom types, handles interactions (click, connect, drag). Double-clicking a **node** dispatches `canvas-edit-node-modal` (opens `NodeConfigModal`). Double-clicking an **edge** dispatches `canvas-edit-edge-modal` (opens `EdgeConfigModal`). Pane double-click no longer creates nodes — creation is exclusively through `FloatingMiddleBar`. Mounts `<NodeConfigModal />` (two slots: `pendingNodeModal` for new nodes with atomic cancel-and-delete, `editingNodeModal` for existing nodes) and `<EdgeConfigModal />`. Manages campaign-mode advance-by-click. Mounts `useKeyboardShortcuts`. Owns context menu state; context menu includes "Edit Node" / "Edit Edge" actions. Listens for `canvas-add-node`, `canvas-open-name-modal`, `canvas-navigate-to-node`, `canvas-edit-node-modal`, `canvas-edit-edge-modal` DOM events.
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`), `hooks/useKeyboardShortcuts`, `@xyflow/react`, node/edge renderers, `components/ContextMenu`, `components/NameModal`, `components/modals/NodeConfigModal`, `components/modals/EdgeConfigModal`

### `src/components/ConfirmModal.jsx` (NEW)
- **Purpose:** Reusable centered confirmation dialog with `title`, `message`, `confirmLabel`, and `danger` props. Replaces `window.confirm()` for destructive actions such as "New Project". The `danger` prop applies a red-tinted confirm button.
- **Key exports:** `default ConfirmModal`
- **Dependencies:** None.

### `src/components/ContextMenu.jsx`
- **Purpose:** Right-click context menu rendered on demand at cursor position. Receives `type` (`'pane'` | `'node'` | `'edge'` | `'multi'`) and `data` props. Node actions include **Edit Node** (dispatches `canvas-edit-node-modal`), Delete, Set Start, Add same type. Edge actions include **Edit Edge** (dispatches `canvas-edit-edge-modal`) and Delete Edge. Pane and multi-select actions unchanged. Viewport-edge flip via `useLayoutEffect`. Dismissal owned by `GraphCanvas`.
- **Key exports:** `default ContextMenu`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/NameModal.jsx`
- **Purpose:** Lightweight centered overlay for naming new flags, statuses, paths, and chapters. On confirm calls the matching store action. ESC calls `event.stopPropagation()` before closing (RISK-CMK-08 mitigation).
- **Key exports:** `default NameModal`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/FlagManager.jsx`
- **Purpose:** Panel listing all flags with name and default boolean value. Restyled with `EntityList.css` and lucide-react icons. Add-flag form with live name validation. Delete with referential integrity checking.
- **Key exports:** `default FlagManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/StatusManager.jsx`
- **Purpose:** Panel listing all status points with name, value, min/max. Restyled with `EntityList.css` and lucide-react icons. Add-status form with live name validation. Delete with referential integrity checking.
- **Key exports:** `default StatusManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/PathChapterManager.jsx`
- **Purpose:** Path and Chapter CRUD management UI. Accepts a `filterType` prop (`'path'` | `'chapter'`) — `LeftSidebar` mounts two separate instances, one per type, eliminating the dual-section layout. Restyled with `EntityList.css`.
- **Key exports:** `default PathChapterManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/EntityList.css` (NEW)
- **Purpose:** Shared stylesheet for `FlagManager`, `StatusManager`, and `PathChapterManager` list views. Provides consistent item rows, action buttons, and search inputs.
- **Key exports:** None (stylesheet).

### `src/components/nodes/CommonNode.jsx`
- **Purpose:** Custom React Flow node renderer for standard narrative components. Displays label, truncated content preview, and a solid green header bar with a `COMMON` badge and side-effect count. In edit mode, shows `⚠️ Orphaned` or `⚠️ Unreachable` warning badges (via `simulationStore.orphanedNodeIds`/`unreachableNodeIds`) when the node has a structural issue. In campaign mode, applies six-state simulation CSS classes (`--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`) and a separate `--seen` overlay. When `labelDisplayMode === 'verbose'` (from `uiStore`), side-effect indicators show actual flag/status names (e.g. "HasKey = true") resolved from `narrativeStore` instead of compact count badges. Uses `React.memo` with targeted selectors.
- **Key exports:** `default CommonNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`

### `src/components/nodes/ChoiceNode.jsx`
- **Purpose:** Custom React Flow node renderer for choice points. Displays label, truncated content preview, and a solid blue header bar with a `CHOICE` badge, side-effect count, and outgoing edge count. When `data.options` is present, renders one source `Handle` per option (keyed by option `id`) with option labels in the node body; falls back to a single source handle when no options exist. Respects `choiceDisplayMode` from `uiStore` for rendering density. In edit mode, shows structural warning badges. In campaign mode: applies six-state simulation CSS classes and `--seen` overlay; when this node is the active node, options become clickable (firing `selectOption`); the selected option gets `.choice-node__option--selected` styling; unselected options get `.choice-node__option--dimmed`. When `labelDisplayMode === 'verbose'` (from `uiStore`), side-effect indicators show actual flag/status names resolved from `narrativeStore` instead of compact count badges. Uses `React.memo`.
- **Key exports:** `default ChoiceNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/nodes/EndingNode.jsx`
- **Purpose:** Custom React Flow node renderer for terminal states. Displays label, truncated content preview, a solid orange header bar with an `ENDING` badge, and a footer terminal bar. Omits outgoing handle for structural AR-12 compliance. In edit mode, shows structural warning badges. In campaign mode, applies six-state simulation CSS classes and `--seen` overlay; advancing into an EndingNode resolves its state to `complete`. Uses `React.memo`.
- **Key exports:** `default EndingNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer using `BaseEdge` + `EdgeLabelRenderer`. Displays edge label and condition badge (AND/OR pill). In campaign mode, applies state CSS classes: `--traversed` (already advanced along), `--condition-pass` (currently reachable and pulsing), `--condition-fail` (active option selected but condition not satisfied), `--unselected-option-dim` (originates from an unselected option). Outside campaign mode edges are visually inert. When `labelDisplayMode === 'verbose'` (from `uiStore`), condition badges resolve flag/status IDs to their designer-assigned names and display full clause text (e.g. "HasKey = true AND Gold ≥ 5") instead of the compact AND/OR pill. Uses `React.memo` with targeted selectors.
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`

### `src/components/SandboxPanel.jsx`
- **Purpose:** Campaign-only panel containing only the **Sandbox Overrides** section: checkbox list for boolean flags and number inputs for status metrics — all writes go through `simulationStore.applySandboxOverride`, updating `currentFlagValues` ephemerally. The Campaign Save section (autosave toggle, Save Progression, Load Last Save) was moved to `FloatingMiddleBar` in Phase 7 Fix 3. Mounted directly in `RightSidebar`'s "Sandbox" tab. Overrides cleared on `exitCampaign()` and `reset()`.
- **Key exports:** `default SandboxPanel`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useSimulationStore`)

### `src/components/CommandPalette.jsx`
- **Purpose:** Searchable command overlay opened and closed via `Ctrl+K` (palette-toggle DOM event) or ESC. Builds a search index from all `narrativeStore` entities (common/choice/ending nodes, flags, statuses, paths, chapters) using a `useMemo` keyed on collection references (AR-14 compliant). Node entity rows are enriched with `chapterName`/`pathName` via `resolveNodeContext()` for disambiguation when multiple entities share the same label (AR-22). Static action items (Create Common/Choice/Ending Node, Create Flag/Status/Path/Chapter) dispatch the matching store action or `canvas-add-node`/`canvas-open-name-modal` DOM event; authoring actions are hidden when `isCampaignActive` (campaign-safe filtering). Selecting an entity row dispatches `canvas-navigate-to-node` so `GraphCanvas` pans and zooms to the target (AR-19). ESC handling attaches its own `keydown` listener on `window` calling `e.stopPropagation()` before close to prevent simultaneous canvas selection clear (RISK-CP-03 mitigation).
- **Key exports:** `default CommandPalette`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`)

### `src/components/Toast.jsx`
- **Purpose:** Top-right fixed overlay that reads `toastStore.toasts` and renders a stacked list of auto-dismiss notification messages. Each toast displays its `message` and applies a variant CSS modifier class (`info`, `success`, `warning`, `error`). The component has no side effects in render — it only reads and maps the `toasts` array (RISK-CP-02 mitigation). Manual dismiss calls `removeToast(id)` directly.
- **Key exports:** `default Toast`
- **Dependencies:** `store` (barrel — `useToastStore`)

### `src/components/StatusStrip.jsx`
- **Purpose:** Bottom strip with lucide-react icons displaying live coverage metrics (Nodes traversed / Endings / Edges / Dead-ends fractions) and entity counters (Flags / Statuses / Paths / Chapters). Uses `ui-v2-status-strip-*` classes from `StatusStrip.css`. Reads from `simulationStore` and `narrativeStore` via per-slice selectors. The traversal overlay toggle button was moved to `FloatingMiddleBar` in Phase 7 Fix 2.
- **Key exports:** `default StatusStrip`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`), `utils` (barrel — `detectDeadEnds`)

### `src/components/index.js`
- **Purpose:** Barrel re-export for all components.
- **Key exports:** `GraphCanvas`, `CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge`, `TopBar`, `LeftSidebar`, `RightSidebar`, `NameplateTab`, `NodesPanel`, `RouteTracingPanel`, `CampaignListPanel`, `FloatingMiddleBar`, `NodeConfigModal`, `EdgeConfigModal`, `FlagManager`, `StatusManager`, `PathChapterManager`, `SandboxPanel`, `ContextMenu`, `NameModal`, `CommandPalette`, `Toast`, `ConfirmModal`
- **Dependencies:** All files in `components/`

---

## `src/components/layout/`

### `src/components/layout/NameplateTab.jsx` (NEW)
- **Purpose:** Reusable vertical nameplate tab button with rotation animation. Used by both `LeftSidebar` and `RightSidebar` for their tab item rendering.
- **Key exports:** `default NameplateTab`
- **Dependencies:** None.

### `src/components/layout/LeftSidebar.jsx` (NEW)
- **Purpose:** Left nameplate-tab sidebar with four tabs: Flags (mounts `FlagManager`), Status (mounts `StatusManager`), Chapter (mounts `PathChapterManager` with `filterType="chapter"`), Paths (mounts `PathChapterManager` with `filterType="path"`). When `isCampaignActive`, applies `left-sidebar--campaign-mode` class: `opacity: 0.4`, `pointer-events: none`, `filter: grayscale(50%)`.
- **Key exports:** `default LeftSidebar`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `components/FlagManager`, `components/StatusManager`, `components/PathChapterManager`, `components/layout/NameplateTab`

### `src/components/layout/RightSidebar.jsx` (NEW)
- **Purpose:** Right nameplate-tab sidebar with four tabs: Nodes (mounts `NodesPanel`), Route Tracing (mounts `RouteTracingPanel`), Campaign List (mounts `CampaignListPanel`), Sandbox (mounts `SandboxPanel` directly — replaces deleted `Sidebar.jsx` wrapper). When `isCampaignActive`, applies `right-sidebar--campaign-mode` dim class.
- **Key exports:** `default RightSidebar`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `components/panels/NodesPanel`, `components/panels/RouteTracingPanel`, `components/panels/CampaignListPanel`, `components/SandboxPanel`, `components/layout/NameplateTab`

---

## `src/components/panels/`

### `src/components/panels/NodesPanel.jsx` (NEW)
- **Purpose:** Right-sidebar panel with segmented Common/Choice/Ending type filter and a text search box. Lists nodes from `narrativeStore`. Clicking the edit pencil on a node item dispatches `canvas-edit-node-modal` DOM event (AR-19); `GraphCanvas` opens `NodeConfigModal`.
- **Key exports:** `default NodesPanel`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/panels/RouteTracingPanel.jsx` (NEW)
- **Purpose:** Right-sidebar panel replacing `RouteFinderDialog`. Two-state UI: config view (target node picker, tie-breaking priority groups split into Flags and Status, path cap, Run Trace button) and results view (status dot, Stop Trace button, scrollable route list). Results read `shortestRouteResults` from `simulationStore` (store-driven, not local state). Clicking a route calls `setSelectedRouteIndex` and dispatches `canvas-navigate-to-node` (AR-19, AR-22). Target node card shows node label, type badge, content description, and chapter/path context.
- **Key exports:** `default RouteTracingPanel`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`)

### `src/components/panels/CampaignListPanel.jsx` (NEW)
- **Purpose:** Right-sidebar panel replacing `CampaignSelector`. Lists campaigns with icon-only action buttons (Enter via Play icon, Edit via Pencil, Delete via Trash). Create-new form included. Enter calls `setActiveCampaign` + `enterCampaign`. Uses `campaign-panel__*` CSS classes from `RightPanels.css`.
- **Key exports:** `default CampaignListPanel`
- **Dependencies:** `store` (barrel — `useCampaignStore`, `useSimulationStore`)

### `src/components/panels/RightPanels.css` (NEW)
- **Purpose:** Shared stylesheet for `NodesPanel`, `RouteTracingPanel`, and `CampaignListPanel`. BEM-namespaced `.nodes-panel__*`, `.trace-panel__*`, `.trace-results__*`, `.campaign-panel__*` rule blocks. Synthesized from the UI vision mockup using vanilla CSS variables; no Tailwind.
- **Key exports:** None (stylesheet).

---

## `src/components/floating/`

### `src/components/floating/FloatingMiddleBar.jsx` (NEW)
- **Purpose:** Centered overlay anchored inside `.app__canvas`. In **authoring mode**: node-type quick-create buttons (Common, Choice, Ending, Flag, Status, Path, Chapter — dispatch `canvas-add-node` / `canvas-open-name-modal` DOM events per AR-19) + campaign selector dropdown + Start button (calls `setActiveCampaign` then `enterCampaign`). In **campaign mode**: blinking emerald pulse pill showing campaign name + Overlay toggle (moved from StatusStrip) + Undo + Reset + Exit + Save/Load/Autosave controls (moved from SandboxPanel).
- **Key exports:** `default FloatingMiddleBar`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useSimulationStore`, `useCampaignStore`, `useUIStore`)

---

## `src/components/modals/`

### `src/components/modals/NodeConfigModal.jsx` (NEW)
- **Purpose:** Full-screen modal for editing nodes. **2-column layout** for Common and Choice nodes (left: label → chapter/path dropdowns → node subtype dropdown → start-node button → on-enter modifier editors; right: Narrative Variants [Common] or Branching Options [Choice] with collapsible cards, condition builder [AND/OR, flag/status clauses], per-card titles from actual option label text). **Narrow single-column** for Ending nodes. Absorbs all functionality of deleted `NodeInspector`, `VariantEditor`, and `OptionEditor`. Opened via `canvas-edit-node-modal` DOM event. Atomic creation flow: `pendingNodeModal` slot calls `deleteNode` on cancel/ESC/backdrop (orphaned node cleanup). All mutations go through dedicated store actions per AR-13.
- **Key exports:** `default NodeConfigModal`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/modals/EdgeConfigModal.jsx` (NEW)
- **Purpose:** Full-screen modal for editing edges. Provides label editing, AND/OR condition builder with flag and status clauses, and edge deletion. Opened via `canvas-edit-edge-modal` DOM event (dispatched by GraphCanvas `onEdgeDoubleClick` and ContextMenu "Edit Edge" action, and by NodesPanel's edge pencil action). Replaces deleted `EdgeInspector`.
- **Key exports:** `default EdgeConfigModal`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

---

## Changelog

## [2026-04-26] — UI_Integration
### Added
- `src/styles/utilities.css`: New shared UI-v2 primitive stylesheet (pill, nameplate, floating-bar, modal-shell, segmented-control classes); imported by `global.css`.
- `src/components/layout/LeftSidebar.jsx` + `.css`: Nameplate-tab left sidebar with Flags / Status / Chapter / Paths tabs; dims during campaign mode.
- `src/components/layout/RightSidebar.jsx` + `.css`: Nameplate-tab right sidebar with Nodes / Route Tracing / Campaign List / Sandbox tabs; dims during campaign mode; mounts `SandboxPanel` directly in Sandbox tab.
- `src/components/layout/NameplateTab.jsx` + `.css`: Reusable vertical tab button component.
- `src/components/panels/NodesPanel.jsx`: Right-sidebar node list with type filter and search; edit dispatches `canvas-edit-node-modal`.
- `src/components/panels/RouteTracingPanel.jsx`: Right-sidebar route tracer replacing `RouteFinderDialog`; store-driven results; clickable route items navigate canvas; flag/status priority groups separated.
- `src/components/panels/CampaignListPanel.jsx`: Right-sidebar campaign manager replacing `CampaignSelector`; icon-only action buttons.
- `src/components/panels/RightPanels.css`: Shared stylesheet for all right-sidebar panel components.
- `src/components/floating/FloatingMiddleBar.jsx` + `.css`: Centered canvas overlay; authoring mode (node-type buttons + campaign selector + Start) and campaign mode (pulse pill + Overlay/Undo/Reset/Exit/Save/Load/Autosave).
- `src/components/modals/NodeConfigModal.jsx` + `.css`: Full-screen 2-column node editor absorbing `NodeInspector`, `VariantEditor`, `OptionEditor`; atomic creation flow; node subtype dropdown; Start Node button.
- `src/components/modals/EdgeConfigModal.jsx` + `.css`: Full-screen edge editor absorbing `EdgeInspector`.
- `src/components/ConfirmModal.jsx` + `.css`: Reusable confirmation dialog replacing `window.confirm()` for destructive actions.
- `src/components/EntityList.css`: Shared list-view stylesheet for `FlagManager`, `StatusManager`, `PathChapterManager`.
### Changed
- `src/App.jsx`: Replaced `<Sidebar />` with `<LeftSidebar />`, `<RightSidebar />`, and `<FloatingMiddleBar />` inside the canvas area.
- `src/App.css`: Grid re-templated for 2-column main area (`min-content 1fr min-content`).
- `src/styles/tokens.css`: Extended with indigo accent scale, amber/emerald/blue/rose/purple/cyan accent families, shadow tokens (`--shadow-float`, `--shadow-nameplate`), and animation keyframes.
- `src/styles/global.css`: Imports `utilities.css`; legacy TopBar, CreationBar, StatusStrip, and RouteFinderDialog CSS blocks removed (~350 lines).
- `src/store/uiStore.js`: Removed `showRouteFinderDialog` state and `toggleRouteFinderDialog` action (sole consumer deleted). Added `selectedRouteIndex` / `setSelectedRouteIndex`.
- `src/components/TopBar.jsx`: Restyled with glassmorphism (`ui-v2-topbar-*` classes); removed campaign controls and `CreationBar`; added `ConfirmModal` for New action.
- `src/components/StatusStrip.jsx`: Restyled with lucide-react icons and `ui-v2-status-strip-*` classes; traversal overlay toggle moved to `FloatingMiddleBar`; fixed field name bug (`flag`/`status`/`path`/`chapter` instead of `flags`/`statuses`/`paths`/`chapters`).
- `src/components/SandboxPanel.jsx`: Campaign Save section (autosave, Save Progression, Load Last Save) moved to `FloatingMiddleBar`; panel now contains Sandbox Overrides only.
- `src/components/FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx`: Restyled with `EntityList.css` and lucide-react icons; `PathChapterManager` gains `filterType` prop.
- `src/components/ContextMenu.jsx`: Added Edit Node and Edit Edge actions dispatching `canvas-edit-node-modal` / `canvas-edit-edge-modal`.
- `src/components/GraphCanvas.jsx`: Double-click node → `canvas-edit-node-modal`; double-click pane no longer creates nodes; mounts `NodeConfigModal` (two slots: pending/editing) and `EdgeConfigModal`; listens for `canvas-edit-node-modal` and `canvas-edit-edge-modal`.
- `src/components/nodes/CommonNode.jsx`: Type bar displays user-defined subtype name when `nodeSubTypeId` is set.
- `src/components/index.js`: Removed barrel exports for deleted files; added exports for all new components.
### Deprecated
- `src/components/Sidebar.jsx` — deleted; `RightSidebar` replaces its structural role.
- `src/components/NodeInspector.jsx` — deleted; superseded by `NodeConfigModal`.
- `src/components/EdgeInspector.jsx` — deleted; superseded by `EdgeConfigModal`.
- `src/components/OptionEditor.jsx` — deleted; absorbed into `NodeConfigModal`.
- `src/components/VariantEditor.jsx` — deleted; absorbed into `NodeConfigModal`.
- `src/components/CampaignSelector.jsx` — deleted; superseded by `CampaignListPanel`.
- `src/components/RouteFinderDialog.jsx` — deleted; superseded by `RouteTracingPanel`.
- `src/components/CreationBar.jsx` — deleted; superseded by `FloatingMiddleBar` quick-create buttons.
- `src/components/CampaignBanner.jsx` — created and immediately deleted within push; FloatingMiddleBar pulse communicates campaign-active state.
- `uiStore.showRouteFinderDialog` / `toggleRouteFinderDialog` — removed; sole consumer deleted.
- `SandboxPanel` Campaign Save section — moved to `FloatingMiddleBar`; no longer in panel.
### Migration
- no — no persisted data shape changes. All Zustand stores, IndexedDB keys, and file export format (`schemaVersion: 4`) are untouched. This is a pure UI-layer reorganisation.

## [2026-04-22] — Route_Tracing
### Added
- `src/utils/routeTracer.js`: Introduced BFS-based algorithmic suite (`detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`).
- `src/components/RouteFinderDialog.jsx`: Interactive route tie-breaker tracing tool directly bound to target node tracking.
- `src/components/StatusStrip.jsx`: Live coverage metrics and toggle overlays spanning Node/Edge counts.
### Changed
- `src/store/simulationStore.js`: Added `.traversalRecords[]` tracking node advances complete with flag snapshots allowing precise `.undoLastNode()`. Added `computeForwardReachable` check producing unreachable node dims in active simulations via CSS custom class `--coverage-gap`.
- `src/store/uiStore.js`: Implemented boolean switches for toggling overlay layers natively (`showTraversalOverlay`, `showShortestRouteOverlay`).
- `src/components/TopBar.jsx`: Updated to include Undo action in Campaign view and trigger short paths.
- `src/components/nodes/*`: Integrated `--coverage-gap` opacity dimming token mapping across all visual footprints.

## [2026-04-20] — Command_palette_toast_Visual_Node_Clustering
### Added
- `src/store/toastStore.js`: New ephemeral Zustand store. `toasts[]` state initialised as `[]` (AR-14 compliant). `addToast(message, variant, duration?)` creates a toast with `generateId('toast')`, auto-schedules `removeToast` via `setTimeout`. `removeToast(id)` filters by ID. Never wired to IndexedDB or `exportGraph()`.
- `src/components/Toast.jsx`: New fixed viewport overlay. Reads `toastStore.toasts`, renders stacked auto-dismiss notifications with `info`/`success`/`warning`/`error` variant classes. No render-side effects.
- `src/components/CommandPalette.jsx`: New `Ctrl+K` searchable overlay. Builds a memoised search index over all narrative entity types. Node results include resolved `chapterName`/`pathName` context for disambiguation. Authoring actions hidden during campaign mode. Entity navigation via `canvas-navigate-to-node` DOM event (AR-19). ESC `stopPropagation` prevents simultaneous canvas selection clear.
### Changed
- `src/store/uiStore.js`: Added `clusterMode: 'off'` state (`'off' | 'chapter' | 'path' | 'both'`) and `cycleClusterMode` action (advances through the four-state cycle via lookup table).
- `src/store/index.js`: Added `useToastStore` re-export.
- `src/App.jsx`: Added `<Toast />` and `<CommandPalette />` mount points as fixed viewport overlays outside `ReactFlowProvider`.
- `src/styles/tokens.css`: Added explicit five-level z-index scale (`--z-cluster`, `--z-context-menu`, `--z-modal`, `--z-palette`, `--z-toast`) and cluster palette color tokens for auto-hashed entity region colors.
- `src/styles/global.css`: Added CSS blocks for Toast overlay, CommandPalette overlay (including `.palette-item__context` for disambiguation spans), and cluster overlay SVG regions (chapter corner-rect and path Gaussian-blur blob treatments).
- `src/hooks/useKeyboardShortcuts.js`: Added `Ctrl+K` handler as the first check (before input-field guard) dispatching `palette-toggle` DOM event. Added `G` shortcut (after guard) calling `cycleClusterMode`.
- `src/components/GraphCanvas.jsx`: Added `canvas-navigate-to-node` DOM event listener calling `useReactFlow().setCenter()`. Added `<ClusterOverlay>` render inside `ReactFlowProvider` subtree; bounding boxes computed via `useMemo` keyed on node positions and passed as props; `ClusterOverlay` applies CSS viewport transform via `useViewport()`.
- `src/components/TopBar.jsx`: Added cluster mode cycle button reading `clusterMode` and calling `cycleClusterMode`; visible in both edit and campaign mode.
- `src/components/index.js`: Added `CommandPalette` and `Toast` barrel exports.

## [2026-04-20] — Context_menus_keyboard_shortcuts_creation_bar
### Added
- `src/hooks/useKeyboardShortcuts.js`: New hook — global `keydown` listener with input-field guard and campaign-mode guard. Dispatches all authoring shortcuts: `N`/`C`/`E` (node creation via `canvas-add-node` event), `F`/`S`/`P`/`H` (naming modal via `canvas-open-name-modal` event), `Del` (delete selected node or edge, multi-aware), `Escape` (clear selection — migrated from GraphCanvas inline handler), `V` (toggle snap), `L` (tidy layout), `R` (toggle label display mode).
- `src/components/ContextMenu.jsx`: New component — right-click context menu panel. Pane/node/edge/multi-select action lists. Viewport-edge flip via `useLayoutEffect`. Dismissal via `GraphCanvas` event handlers.
- `src/components/NameModal.jsx`: New component — centered overlay for naming new flags, statuses, paths, and chapters. ESC `stopPropagation` prevents canvas selection clear on dismiss (RISK-CMK-08 mitigation).
- `src/components/CreationBar.jsx`: New component — horizontal strip of seven entity-creation buttons mounted in `TopBar`. Node buttons dispatch `canvas-add-node`; metadata buttons dispatch `canvas-open-name-modal`. All buttons disabled during campaign mode.
- `src/hooks/` (new directory): Top-level hook directory under `src/`, registered in `vite.config.js` as the `hooks` absolute import alias.
### Changed
- `src/store/uiStore.js`: Added `selectedNodeIds: string[]` state (multi-select set), `labelDisplayMode: 'compact' | 'verbose'` state, `setSelectedNodeIds` action, and `toggleLabelDisplayMode` action. `clearSelection` updated to also reset `selectedNodeIds` to `[]`.
- `src/components/GraphCanvas.jsx`: Mounts `useKeyboardShortcuts`. Wires `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu` to local `contextMenuState` + `<ContextMenu />` render. Promotes context menu type to `'multi'` when clicked node is in `selectedNodeIds`. Dismisses menu on `onPaneClick`, `onNodeDragStart`, `onMoveStart`. Listens for `canvas-add-node` and `canvas-open-name-modal` DOM events and handles placement/modal open. Wires `onSelectionChange` to `setSelectedNodeIds`.
- `src/components/TopBar.jsx`: Mounts `<CreationBar disabled={isCampaignActive} />`.
- `vite.config.js`: Added `hooks` path alias pointing to `src/hooks/`.
- `src/components/index.js`: Added `ContextMenu`, `NameModal`, `CreationBar` barrel exports.
- `src/components/nodes/CommonNode.jsx`: Reads `labelDisplayMode` from `uiStore`; renders side-effect names inline when `'verbose'`.
- `src/components/nodes/ChoiceNode.jsx`: Reads `labelDisplayMode` from `uiStore`; renders side-effect names inline when `'verbose'`.
- `src/components/edges/ConditionalEdge.jsx`: Reads `labelDisplayMode` from `uiStore`; resolves flag/status IDs to names and renders full clause text when `'verbose'`.
- `src/store/narrativeStore.js`: `addNode` now accepts an optional `label` string parameter (defaults to `'Node'`) and returns the new node ID. All existing call sites are backward compatible.

## [2026-04-19] — Campaign_Sheets
### Added
- `src/store/campaignStore.js`: New Zustand store for campaign management. Stores a dictionary of named simulation snapshots (`Campaign` entities with `campaignSchemaVersion: 1`). Full CRUD, IndexedDB persistence (`saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`), and `loadCampaignsFromObject` for restoring from ZIP import. Boot restore always resets `activeCampaignId` to `null`.
- `src/components/CampaignSelector.jsx`: New component for campaign lifecycle UI in `TopBar`. Lists existing campaigns with Enter/Delete actions, provides a create-new form, and shows active campaign name with Reset button during campaign mode.
- `src/store/simulationStore.js`: `enterCampaign(campaignPayload?)` now accepts an optional campaign object for snapshot hydration. `snapshotCampaign()` action for manual Save Progression. `autosaveCampaign` toggle and `setAutosaveCampaign` action. `exitCampaign()` conditionally auto-snapshots on exit.
- `src/utils/fileSystem.js`: Campaign IndexedDB functions (`saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB`). ZIP export via JSZip (browser-only) bundling narrative + campaign files. ZIP import with `campaignSchemaVersion: 1` validation. DB version bumped from 1 to 2 to add the `campaigns` object store.
- `src/main.jsx`: Campaign boot restore (`loadCampaignsFromIndexedDB` in `initPersistence`). Debounced `campaignStore` auto-save subscriber at 1000ms.
- `src/components/SandboxPanel.jsx`: Campaign Save section with autosave toggle, Save Progression button (`snapshotCampaign`), and Load Last Save button.
### Changed
- `src/components/TopBar.jsx`: Import/Export/New handlers updated to be campaign-aware. `handleNew` clears campaign IndexedDB and store before resetting. `handleImport` restores campaigns from `{ graphData, campaigns }` return shape. `handleExport` passes campaigns to `exportProject` for ZIP bundling. `CampaignSelector` mounted in edit mode.
- `src/store/index.js`: Added `useCampaignStore` re-export.
- `src/utils/index.js`: Added `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB` re-exports.
- `src/components/index.js`: Added `CampaignSelector` re-export.
### Migration
- no — `schemaVersion` remains `4`. Campaign data is stored in a new `campaigns` IndexedDB object store (DB v2 upgrade runs automatically on first load). Existing `.json` export files import identically — they produce a campaign-less project, which is correct. Existing campaign-less sessions receive empty `campaigns: {}` on boot.

## [2026-04-19] — IndexedDB_Persistence_Layer
### Changed
- `src/main.jsx`: Synchronous render bootstrap replaced with async `initPersistence()` that loads saved graph from IndexedDB on boot, calls `loadGraph()` + `exitCampaign()` for teardown, and wires a debounced Zustand `subscribe` for continuous auto-save.
- `src/utils/fileSystem.js`: Added IndexedDB persistence functions (`saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`). `importProject` import validation expanded from schema-version-only guard to full field-level sanitization and defaults injection after migrations run.
- `src/utils/index.js`: Re-exports updated to include `saveToIndexedDB`, `loadFromIndexedDB`, and `clearIndexedDB`.
- `src/components/TopBar.jsx`: `handleNew` updated to await `clearIndexedDB()` before `newGraph()`, closing the auto-save race condition window. `handleImport` teardown sequence confirmed: `loadGraph()` + `exitCampaign()`.
### Deprecated
- Nothing — the explicit Export/Import file I/O path is retained alongside the new IndexedDB layer. Browser fallback paths (`<a download>`, `<input type="file">`) are unchanged.
### Migration
- no — `schemaVersion` remains `4`. The IndexedDB layer is a greenfield introduction with no existing data to transform. The first auto-save writes the current in-memory store state. All pre-existing `.json` export files remain importable without modification.

## [2026-04-18] — Campaign_Mode_Rewire
### Added
- `SandboxPanel.jsx`: New campaign-only component rendering ephemeral flag and status override controls. Writes to `simulationStore.currentFlagValues` only via `applySandboxOverride`; never to `narrativeStore`.
- `simulationStore.js`: `isCampaignActive` state, `enterCampaign`/`exitCampaign`/`reset` lifecycle actions, `selectOption` action for choice interaction with option side-effect firing, `applySandboxOverride` for ephemeral in-campaign overrides, `runPassiveAnalysis` for edit-mode structural analysis (orphaned/unreachable node detection via BFS), `getNodeState` selector. Six-state node enum (`active`, `locked`, `complete`, `failed`, `branch_locked`, `reachable`). Separate `seenNodeIds` accumulation. `sandboxOverrides`, `orphanedNodeIds`, `unreachableNodeIds` state slices.
- `tokens.css`: Five new campaign-state colour tokens: `--color-node-locked` (grey), `--color-node-complete` (amber), `--color-node-failed` (red), `--color-node-branch-locked` (purple), `--color-node-seen` (white).
- `global.css`: Six-state node simulation CSS classes (`.story-node--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`). `--seen` overlay pseudo-element. Choice option interaction classes (`.choice-node__option--clickable`, `--selected`, `--dimmed`). Edge state classes (`--condition-pass`, `--condition-fail`, `--unselected-option-dim`). `.story-node__warning-badge` styles. `.sandbox-panel` component styles.
- `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`: `isOrphaned`/`isUnreachable` selectors from `simulationStore` driving structural warning badges in edit mode.
- `Sidebar.jsx`: Conditional fifth Sandbox tab (visible only when `isCampaignActive`). All non-Sandbox content disabled via `pointerEvents: none` during campaign mode.
- `components/index.js`: Barrel export for `SandboxPanel`.
### Changed
- `simulationStore.js`: `isRunning` renamed to `isCampaignActive`; `start` renamed to `enterCampaign`; `stop`/`reset` replaced by `exitCampaign` (full teardown) and `reset` (restart within campaign). `computeReachable` applies `selectedOptionId` filter for choice nodes. `computeNodeStates` produces six-state enum including `branch_locked` detection.
- `TopBar.jsx`: `Start Simulation` / `Stop Simulation` buttons replaced with `Enter Campaign Mode` / `Exit Campaign Mode` + `Reset Simulation` buttons. Status indicator updated from "Simulation Active" to "Campaign Active".
- `GraphCanvas.jsx`: `simulation-mode` CSS class renamed to `campaign-mode`. `onNodeClick` advance logic extended to match `selectedOptionId` for choice node edges. `runPassiveAnalysis` triggered via `useEffect` on topology changes and `isCampaignActive` toggle. ESC key clears selection.
- `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`: `isRunning` selector replaced with `nodeState` (string enum) and `isSeen` (boolean). Six-state CSS modifiers applied. `--seen` overlay applied via separate interpolation. `ChoiceNode` option divs gain click handlers conditionally gated on `isCampaignActive && isActive`.
- `ConditionalEdge.jsx`: `isConditionPass` now maps to `conditional-edge--condition-pass` (renamed from `--reachable`). New `isTraversed` class remains `--traversed`.
### Deprecated
- `isRunning` state field in `simulationStore` — replaced by `isCampaignActive`.
- `start()` action in `simulationStore` — replaced by `enterCampaign()`.
- `.simulation-mode` CSS class — replaced by `.campaign-mode`.
- Three-state node visual vocabulary (`--active` / `--visited` / `--reachable` as the only states) — replaced by the six-state enum plus independent `--seen` overlay.
### Migration
- no — no schema change. `schemaVersion` remains `4`. All new state is ephemeral in `simulationStore`. Existing save files load without modification.
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
