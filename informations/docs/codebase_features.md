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
- **Purpose:** Root component. Composes the four-region grid layout: `<TopBar />`, `<GraphCanvas />`, `<Sidebar />`, and `<StatusStrip />`. Also mounts `<Toast />` and `<CommandPalette />` as fixed viewport overlays outside the `ReactFlowProvider` subtree (AR-19 compliant — both components use DOM events for canvas communication, not `useReactFlow()` directly). `<StatusStrip />` occupies a 28px bottom-bar region and is visible during campaign mode only.
- **Key exports:** `default App`
- **Dependencies:** `components/TopBar`, `components/GraphCanvas`, `components/Sidebar`, `components/CommandPalette`, `components/Toast`, `components/StatusStrip`, `App.css`

### `src/App.css`
- **Purpose:** CSS grid layout for the app shell — 48px top bar, flexible canvas area, 300px sidebar, 28px bottom status bar. Grid template extended to four rows to accommodate the `<StatusStrip />` bottom-bar region.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css` (via CSS custom properties)

---

## `src/styles/`

### `src/styles/tokens.css`
- **Purpose:** CSS custom properties for the design system: colours (backgrounds, text, accents, semantic states, campaign simulation states), spacing scale (4px base), typography (Inter), border radii, shadows, transitions. Adds five campaign-state colour tokens: `--color-node-locked`, `--color-node-complete`, `--color-node-failed`, `--color-node-branch-locked`, `--color-node-seen`. Adds an explicit five-level z-index scale: `--z-cluster`, `--z-context-menu`, `--z-modal`, `--z-palette`, `--z-toast`. Adds cluster palette color tokens for auto-hashed entity region colors. Adds route-tracing tokens: `--color-traversal-overlay` (edge traversal highlight), `--color-route-overlay` (shortest-route path highlight), `--opacity-coverage-gap` (unreachable-node dimming), and StatusStrip color tokens.
- **Key exports:** CSS variables (`:root` scope).
- **Dependencies:** None.

### `src/styles/global.css`
- **Purpose:** CSS reset, base element styles, component styles (StoryNode, ConditionalEdge, TopBar, SandboxPanel), campaign mode overrides (`.campaign-mode` wrapper class), and the `pulse-border` animation. Contains six-state node simulation classes (`.story-node--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`), the `--seen` overlay pseudo-element, the `--coverage-gap` orthogonal overlay pseudo-element (unreachable-from-active-node dimming, applied additively per AR-16), choice option interaction classes (`.choice-node__option--clickable`, `--selected`, `--dimmed`), edge condition-pass/fail/traversed/unselected-dim classes, traversal overlay class (`.conditional-edge--traversal-overlay`), shortest-route overlay class (`.conditional-edge--route-overlay`), `.story-node__warning-badge` styles, and `.sandbox-panel` component styles. React Flow theme overrides. Adds CSS blocks for: Toast overlay (`.toast-container`, `.toast`, variant modifier classes), CommandPalette overlay (`.command-palette`, `.palette-item`, `.palette-item__context`), cluster overlay SVG regions (chapter corner-rect and path blob treatments), StatusStrip component styles, and RouteFinderDialog overlay styles.
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
- **Purpose:** Zustand store owning UI state: `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, `choiceDisplayMode`, `selectedNodeIds`, `labelDisplayMode`, `clusterMode`, `showTraversalOverlay`, `showRouteFinderDialog`, `showShortestRouteOverlay`, and `selectedRouteIndex`. The `choiceDisplayMode` field (`'medium'` | `'full'`) controls rendering density for choice node option labels on the canvas. The `selectedNodeIds: string[]` field tracks the multi-select set populated by React Flow's `onSelectionChange` (Ctrl+click and drag-box); it is additive and does not replace `selectedNodeId`. The `labelDisplayMode` field (`'compact'` | `'verbose'`) controls whether node and edge renderers show full flag/status names or compact count badges. The `clusterMode` field (`'off'` | `'chapter'` | `'path'` | `'both'`) controls the cluster overlay visibility on the canvas; initial value `'off'`; not persisted to IndexedDB and resets on each page load. The `showTraversalOverlay` boolean (default `true`) controls traversal-overlay edge coloring. The `showRouteFinderDialog` boolean (default `false`) controls RouteFinderDialog visibility. The `showShortestRouteOverlay` boolean (default `false`) controls shortest-route edge overlay. The `selectedRouteIndex` number (default `0`) tracks which route in the sorted result list is currently highlighted.
- **Key exports:** `useUIStore` (Zustand hook)
- **Dependencies:** None.
- **Actions:** `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `toggleSnapToGrid`, `setChoiceDisplayMode`, `setSelectedNodeIds`, `toggleLabelDisplayMode`, `cycleClusterMode`, `toggleTraversalOverlay`, `toggleRouteFinderDialog`, `toggleShortestRouteOverlay`, `setSelectedRouteIndex`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store owning campaign-mode state and live simulation. Runs in two modes: edit mode (passive structural analysis only — `runPassiveAnalysis` computes `orphanedNodeIds`/`unreachableNodeIds` via BFS from the start node) and campaign mode (full simulation lifecycle). Campaign lifecycle: `enterCampaign(campaignPayload?)` accepts an optional campaign object; when present it hydrates `currentFlagValues` from the snapshot's `flagOverrides` and `statusOverrides` filtered against currently-existing narrative IDs (stale IDs silently dropped), and resumes at `snapshot.activeNodeId` if the node still exists; without a payload it seeds from `narrativeStore` defaults. `advance(edgeId)` moves to the destination node, fires node `flags_set`/`status_set` side effects, accumulates `seenNodeIds`, appends a rich `TraversalRecord` (`{ sequence, edgeId, optionId, fromNodeId, toNodeId, flagSnapshot }`) to `traversalRecords`, recomputes `unreachableFromActiveNodeIds` via `routeTracer.computeForwardReachable`, and recomputes node states. `selectOption(optionId)` fires option side effects, sets `selectedOptionId`, captures `preAdvanceFlagSnapshot` for the next traversal record, and recomputes reachable edges. `undoLastNode()` pops the last traversal record, restores `currentFlagValues`/`activeNodeId`/`seenNodeIds`/`traversedEdgeIds` from the snapshot, recomputes node states, and marks `isShortestRouteStale = true` if results exist; no-op when `traversalRecords` is empty. `snapshotCampaign()` writes `{ activeNodeId, seenNodeIds, traversedEdgeIds, flagOverrides, statusOverrides }` to the active campaign in `campaignStore` — separating booleans (flags) from numerics (statuses) via `narrativeStore` key discrimination. `exitCampaign()` conditionally auto-snapshots (if `autosaveCampaign === true`) then zeroes all state including traversal records and route results. `reset()` restarts from the start node within campaign mode and clears all tracing state. Sandbox: `applySandboxOverride(key, value)` writes ephemeral flag/status overrides to `currentFlagValues` only — never to `narrativeStore`. Runtime tracing state (all cleared on campaign lifecycle transitions, never persisted per AR-08): `traversalRecords[]`, `preAdvanceFlagSnapshot`, `unreachableFromActiveNodeIds`, `shortestRouteResults`, `shortestRouteTargetNodeId`, `isShortestRouteStale`. Six-state node enum values: `active`, `locked`, `complete`, `failed`, `branch_locked`, `reachable`. Separate `seenNodeIds` accumulation produces a `--seen` overlay orthogonal to the enum.
- **Key exports:** `useSimulationStore` (Zustand hook)
- **Dependencies:** `store` (barrel — `useNarrativeStore`), `utils` (barrel — `evaluateCondition`, `computeForwardReachable`, `computeShortestPaths`, `detectDeadEnds`), `store/campaignStore.js` (direct — `useCampaignStore`)
- **Actions:** `enterCampaign`, `exitCampaign`, `reset`, `advance`, `selectOption`, `applySandboxOverride`, `runPassiveAnalysis`, `getNodeState`, `snapshotCampaign`, `setAutosaveCampaign`, `undoLastNode`, `computeRoutes`, `clearRouteResults`, `setShortestRouteStale`, `setShortestRouteResults`

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
- **Purpose:** Pure route analysis functions for the Route_Tracing feature. All gate checks call `evaluateCondition` from `conditionEvaluator.js` — no inline condition logic (AR-07 compliant). `detectDeadEnds(nodes, edges)` returns IDs of non-ending nodes with no outgoing edges. `computeForwardReachable(fromNodeId, graphState)` runs an unconstrained forward BFS and returns the set of node IDs reachable from the given position — called by `simulationStore.advance()` to populate `unreachableFromActiveNodeIds` for the `--coverage-gap` overlay. `computeShortestPaths(startNodeId, targetNodeId, graphState, priorities, limit)` runs a gate-respecting state-space search (Yen's k-shortest variant), enforcing `HARD_CAP = 50` on returned paths and a `MAX_STATE_VISITS` budget cap; returns a sorted `RouteResult[]` with an `exhausted` flag when the budget was reached before finding all paths.
- **Key exports:** `detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`
- **Dependencies:** `utils` (barrel — `evaluateCondition`)

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
- **Purpose:** Horizontal top bar with app title, editable project title, file actions (New, Import, Export), Tidy Layout button (Dagre-based), Snap-to-Grid toggle, campaign controls, `<CreationBar />`, and cluster mode cycle button. The cluster button reads `clusterMode` from `uiStore` and calls `cycleClusterMode` on click; it displays the current mode label and is visible in both edit and campaign mode (G shortcut is campaign-safe). In edit mode mounts `<CampaignSelector />` which handles campaign listing, creation, and entry, and `<CreationBar />` for entity quick-creation buttons. When a campaign is active shows `Reset Simulation` + `Exit Campaign Mode` buttons, an Undo Active Node button (campaign mode only; disabled when `traversalRecords.length === 0`; uses the primitive `.length` selector for AR-14 compliance), and a "Campaign Active — [name]" status indicator. All authoring controls (`disabled={isCampaignActive}`) are locked during campaign mode; `CreationBar` inherits the same guard. `handleNew` calls `clearCampaignsIndexedDB()` + `clearIndexedDB()` + `campaignStore.clearCampaigns()` before `newGraph()` and `exitCampaign()`. `handleImport` calls `exitCampaign()`, `clearCampaigns()`, then loads campaigns and graph from the `{ graphData, campaigns }` return shape. `handleExport` passes `campaigns` from `campaignStore` to `exportProject` to enable ZIP bundling.
- **Key exports:** `default TopBar`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`, `useCampaignStore`), `utils` (barrel — `exportProject`, `importProject`, `clearIndexedDB`, `clearCampaignsIndexedDB`), `dagre`, `components/CampaignSelector`, `components/CreationBar`

### `src/components/GraphCanvas.jsx`
- **Purpose:** React Flow canvas wrapper. Derives React Flow nodes from the three sub-collections, registers custom node/edge types, handles interactions (click, connect, drag, double-click-to-add-node), manages campaign-mode advance-by-click, applies `.campaign-mode` CSS class when `isCampaignActive`, stamps `optionId` on edges when connections originate from per-option handles on choice nodes, and edges with an `optionId` are rendered with `sourceHandle` set for correct handle anchoring. In edit mode triggers `runPassiveAnalysis` on every topology change and on `isCampaignActive` toggle. During campaign mode, `onNodeClick` advances via the edge matching both the selected node and (for choice nodes) the `selectedOptionId`. Mounts `useKeyboardShortcuts` hook for global shortcut handling (ESC migrated here from inline effect). Owns `contextMenuState` local state and wires `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu` to render `<ContextMenu />`; promotes type to `'multi'` when the clicked node is in `selectedNodeIds`. Dismisses context menu on `onPaneClick`, `onNodeDragStart`, and `onMoveStart`. Listens for `canvas-add-node` and `canvas-open-name-modal` custom DOM events to place nodes at viewport center and open `<NameModal />`. Listens for `canvas-navigate-to-node` DOM event and calls `useReactFlow().setCenter()` to pan/zoom the canvas to the target node (AR-19 — the CommandPalette dispatches this event; GraphCanvas owns the execution). Renders `<ClusterOverlay>` as a separate child component inside the `ReactFlowProvider` subtree; `ClusterOverlay` uses `useViewport()` for the CSS transform and receives pre-computed bounding boxes as props (RISK-CP-05 mitigation). Wires `onSelectionChange` to `uiStore.setSelectedNodeIds` for multi-select.
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`), `hooks/useKeyboardShortcuts`, `@xyflow/react`, `components/nodes/CommonNode`, `components/nodes/ChoiceNode`, `components/nodes/EndingNode`, `components/edges/ConditionalEdge`, `components/ContextMenu`, `components/NameModal`

### `src/components/Sidebar.jsx`
- **Purpose:** Right-side panel with up to five tabs. In edit mode: Inspector (shows NodeInspector or EdgeInspector based on selection), Flags (shows FlagManager), Status (shows StatusManager), Paths (shows PathChapterManager). In campaign mode: a fifth Sandbox tab appears showing SandboxPanel. All non-Sandbox content is visually disabled (`pointerEvents: none`, `opacity: 0.5`) during campaign mode to prevent authoring while simulating.
- **Key exports:** `default Sidebar`
- **Dependencies:** `store` (barrel — `useUIStore`, `useSimulationStore`), `NodeInspector`, `EdgeInspector`, `FlagManager`, `StatusManager`, `PathChapterManager`, `SandboxPanel`

### `src/components/NodeInspector.jsx`
- **Purpose:** Form panel for editing a selected node's properties based on its type (label, content, path/chapter assignment, side effects, start node status). Performs multi-collection lookups to locate nodes. Includes path and chapter assignment dropdowns that write `pathId`/`chapterId` to `node.data` via `updateNode`. Conditionally mounts `VariantEditor` for common nodes and `OptionEditor` for choice nodes below the existing form sections. Includes node deletion.
- **Key exports:** `default NodeInspector`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`), `components/OptionEditor`, `components/VariantEditor`

### `src/components/EdgeInspector.jsx`
- **Purpose:** Form panel for editing a selected edge's label and condition (AND/OR operator + clauses). When the edge has an `optionId`, displays a read-only "Connected from option" field showing the originating option's label from the source choice node. Includes edge deletion.
- **Key exports:** `default EdgeInspector`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/ContextMenu.jsx`
- **Purpose:** Right-click context menu rendered on demand at cursor position. Receives a `type` prop (`'pane'` | `'node'` | `'edge'` | `'multi'`) and a `data` prop with target entity info. Renders an action list scoped to the target: pane → Add Common/Choice/Ending; node → Delete, Set Start, Add same type; edge → Delete Edge; multi → Delete Selected. Uses `useLayoutEffect` to measure its own bounding rect and flip position (`left`/`up`) if the menu would overflow `window.innerWidth` or `window.innerHeight`. Dismissal is owned by `GraphCanvas` (via `onPaneClick`, `onNodeDragStart`, `onMoveStart` events) — the menu has no self-dismiss logic. All actions dispatch store calls via `useNarrativeStore.getState()`.
- **Key exports:** `default ContextMenu`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`)

### `src/components/NameModal.jsx`
- **Purpose:** Lightweight centered overlay with a text input and Confirm/Cancel buttons. Opened by `GraphCanvas` when a `canvas-open-name-modal` event is received (from keyboard shortcuts F/S/P/H or `CreationBar` buttons for Flag/Status/Path/Chapter). On confirm, calls the matching store action (`addFlag`, `addStatus`, `addPath`, `addChapter`). On cancel or ESC, closes without creating an entity. Attaches its own `keydown` listener for ESC that calls `event.stopPropagation()` before closing — preventing the global shortcut hook from also calling `clearSelection` (RISK-CMK-08 mitigation).
- **Key exports:** `default NameModal`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/CreationBar.jsx`
- **Purpose:** Horizontal strip of seven entity-creation buttons (Common, Choice, Ending, Flag, Status, Path, Chapter) mounted inside `TopBar`. Common/Choice/Ending buttons dispatch a `canvas-add-node` custom DOM event carrying the node type; `GraphCanvas` handles placement at viewport center (AR-19 — outside `ReactFlowProvider`). Flag/Status/Path/Chapter buttons dispatch a `canvas-open-name-modal` event; `GraphCanvas` opens `NameModal`. All buttons accept a `disabled` prop and are rendered disabled when `isCampaignActive === true`.
- **Key exports:** `default CreationBar`
- **Dependencies:** None (dispatches DOM events only).

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
- **Purpose:** Custom React Flow node renderer for standard narrative components. Displays label, truncated content preview, and a solid green header bar with a `COMMON` badge and side-effect count. In edit mode, shows `⚠️ Orphaned` or `⚠️ Unreachable` warning badges (via `simulationStore.orphanedNodeIds`/`unreachableNodeIds`) when the node has a structural issue. In campaign mode, applies six-state simulation CSS classes (`--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`), a separate `--seen` overlay, and a `--coverage-gap` orthogonal overlay when the node is in `simulationStore.unreachableFromActiveNodeIds` (dims nodes with no forward graph path from the current active position, per AR-16). When `labelDisplayMode === 'verbose'` (from `uiStore`), side-effect indicators show actual flag/status names (e.g. "HasKey = true") resolved from `narrativeStore` instead of compact count badges. Uses `React.memo` with targeted selectors.
- **Key exports:** `default CommonNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`

### `src/components/nodes/ChoiceNode.jsx`
- **Purpose:** Custom React Flow node renderer for choice points. Displays label, truncated content preview, and a solid blue header bar with a `CHOICE` badge, side-effect count, and outgoing edge count. When `data.options` is present, renders one source `Handle` per option (keyed by option `id`) with option labels in the node body; falls back to a single source handle when no options exist. Respects `choiceDisplayMode` from `uiStore` for rendering density. In edit mode, shows structural warning badges. In campaign mode: applies six-state simulation CSS classes, `--seen` overlay, and `--coverage-gap` orthogonal overlay when the node is in `simulationStore.unreachableFromActiveNodeIds`; when this node is the active node, options become clickable (firing `selectOption`); the selected option gets `.choice-node__option--selected` styling; unselected options get `.choice-node__option--dimmed`. When `labelDisplayMode === 'verbose'` (from `uiStore`), side-effect indicators show actual flag/status names resolved from `narrativeStore` instead of compact count badges. Uses `React.memo`.
- **Key exports:** `default ChoiceNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/nodes/EndingNode.jsx`
- **Purpose:** Custom React Flow node renderer for terminal states. Displays label, truncated content preview, a solid orange header bar with an `ENDING` badge, and a footer terminal bar. Omits outgoing handle for structural AR-12 compliance. In edit mode, shows structural warning badges. In campaign mode, applies six-state simulation CSS classes, `--seen` overlay, and `--coverage-gap` orthogonal overlay when the node is in `simulationStore.unreachableFromActiveNodeIds`; advancing into an EndingNode resolves its state to `complete`. Uses `React.memo`.
- **Key exports:** `default EndingNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`), `@xyflow/react`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer using `BaseEdge` + `EdgeLabelRenderer`. Displays edge label and condition badge (AND/OR pill). In campaign mode, applies state CSS classes: `--traversed` (already advanced along), `--condition-pass` (currently reachable and pulsing), `--condition-fail` (active option selected but condition not satisfied), `--unselected-option-dim` (originates from an unselected option), `--traversal-overlay` (highlights traversal-history edges via per-edge boolean from `traversedEdgeIds`; shown when `showTraversalOverlay === true`), and `--route-overlay` (highlights the selected shortest-route path when `showShortestRouteOverlay === true`). Outside campaign mode edges are visually inert. When `labelDisplayMode === 'verbose'` (from `uiStore`), condition badges resolve flag/status IDs to their designer-assigned names and display full clause text (e.g. "HasKey = true AND Gold ≥ 5") instead of the compact AND/OR pill. Uses `React.memo` with targeted selectors. All traversal/route checks return primitives (AR-14 compliant).
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`

### `src/components/SandboxPanel.jsx`
- **Purpose:** Campaign-only sidebar panel with two sections. (1) Campaign Save: autosave toggle (`autosaveCampaign`), "Save Progression" button (calls `snapshotCampaign()`), and "Load Last Save" button (re-enters the active campaign from its stored snapshot). (2) Sandbox Overrides: checkbox list for boolean flags and number inputs for status metrics — all writes go through `simulationStore.applySandboxOverride`, updating `currentFlagValues` ephemerally. Overrides are cleared on `exitCampaign()` and `reset()`. Only visible when `isCampaignActive === true`.
- **Key exports:** `default SandboxPanel`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useSimulationStore`, `useCampaignStore`)

### `src/components/CommandPalette.jsx`
- **Purpose:** Searchable command overlay opened and closed via `Ctrl+K` (palette-toggle DOM event) or ESC. Builds a search index from all `narrativeStore` entities (common/choice/ending nodes, flags, statuses, paths, chapters) using a `useMemo` keyed on collection references (AR-14 compliant). Node entity rows are enriched with `chapterName`/`pathName` via `resolveNodeContext()` for disambiguation when multiple entities share the same label (AR-22). Static action items (Create Common/Choice/Ending Node, Create Flag/Status/Path/Chapter) dispatch the matching store action or `canvas-add-node`/`canvas-open-name-modal` DOM event; authoring actions are hidden when `isCampaignActive` (campaign-safe filtering). Selecting an entity row dispatches `canvas-navigate-to-node` so `GraphCanvas` pans and zooms to the target (AR-19). ESC handling attaches its own `keydown` listener on `window` calling `e.stopPropagation()` before close to prevent simultaneous canvas selection clear (RISK-CP-03 mitigation).
- **Key exports:** `default CommandPalette`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`)

### `src/components/Toast.jsx`
- **Purpose:** Top-right fixed overlay that reads `toastStore.toasts` and renders a stacked list of auto-dismiss notification messages. Each toast displays its `message` and applies a variant CSS modifier class (`info`, `success`, `warning`, `error`). The component has no side effects in render — it only reads and maps the `toasts` array (RISK-CP-02 mitigation). Manual dismiss calls `removeToast(id)` directly.
- **Key exports:** `default Toast`
- **Dependencies:** `store` (barrel — `useToastStore`)

### `src/components/StatusStrip.jsx`
- **Purpose:** Fixed 28px bottom bar mounted in `App.jsx` as a fourth grid region. Displays campaign coverage readouts: nodes visited / total, endings reached / total, edges traversed / total. Reads six coverage primitives from `simulationStore` and `narrativeStore` via per-slice selectors (AR-23 compliant). Visible during campaign mode only. Has no render-side effects (AR-14 compliant). Uses `React.memo`.
- **Key exports:** `default StatusStrip`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`)

### `src/components/RouteFinderDialog.jsx`
- **Purpose:** Modal overlay for shortest-route analysis. Mounts in `App.jsx` outside the `ReactFlowProvider` subtree (AR-19). Provides: a searchable target-node selector with chapter/path disambiguation (AR-22, reuses `resolveNodeContext` pattern); a priority list UI (`{ flagOrStatusId, preferredValue }[]` for tie-breaking among equal-length paths); a path-cap input with hard ceiling enforcement (`HARD_CAP = 50`); a sorted result list with per-path selection driving `uiStore.selectedRouteIndex`; and a stale-result re-run prompt when `isShortestRouteStale === true`. Calls `simulationStore.setShortestRouteResults(paths)` (unguarded writer for edit-mode use) or `computeRoutes` (campaign-guarded writer). Dialog visibility controlled by `uiStore.showRouteFinderDialog`; local `useState` limited to transient input fields (AR-03). All three close paths (cancel, auto-close after run, ESC) consolidated in `handleClose` (AR-25).
- **Key exports:** `default RouteFinderDialog`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`)

### `src/components/index.js`
- **Purpose:** Barrel re-export for all components.
- **Key exports:** `GraphCanvas`, `CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge`, `TopBar`, `Sidebar`, `NodeInspector`, `EdgeInspector`, `FlagManager`, `StatusManager`, `PathChapterManager`, `OptionEditor`, `VariantEditor`, `SandboxPanel`, `CampaignSelector`, `ContextMenu`, `NameModal`, `CreationBar`, `CommandPalette`, `Toast`, `StatusStrip`, `RouteFinderDialog`
- **Dependencies:** All files in `components/`
### `src/components/CampaignSelector.jsx`
- **Purpose:** Campaign management UI mounted in `TopBar` when not in campaign mode. With no campaigns: shows a single "Enter Campaign Mode" button that creates a default campaign and enters it. With existing campaigns: shows a pill list (campaign name, Enter button, Delete button) and a create-new-campaign form. Coordinates `campaignStore.setActiveCampaign()` before calling `simulationStore.enterCampaign()` to ensure the active ID is set for snapshotting.
- **Key exports:** `default CampaignSelector`
- **Dependencies:** `store` (barrel — `useCampaignStore`, `useSimulationStore`)

---

## Changelog

## [2026-04-21] — Route_Tracing
### Added
- `src/utils/routeTracer.js`: New pure utility. `detectDeadEnds(nodes, edges)` — returns non-ending nodes with no outgoing edges. `computeForwardReachable(fromNodeId, graphState)` — unconstrained forward BFS for unreachable-node dimming. `computeShortestPaths(startNodeId, targetNodeId, graphState, priorities, limit)` — gate-respecting state-space Yen's k-shortest variant with `HARD_CAP = 50` and `MAX_STATE_VISITS` budget cap; all gate checks via `evaluateCondition`.
- `src/components/StatusStrip.jsx`: New 28px bottom-bar component showing campaign coverage metrics (nodes visited/total, endings reached/total, edges traversed/total). Campaign-mode only. Per-slice selectors throughout (AR-23).
- `src/components/RouteFinderDialog.jsx`: New modal for shortest-route analysis. Target-node selector with disambiguation (AR-22), priority list, path-cap with hard ceiling, sorted result list with path selection, stale-result prompt. `handleClose` consolidates all close paths (AR-25).
### Changed
- `src/store/simulationStore.js`: Added `traversalRecords[]`, `preAdvanceFlagSnapshot`, `unreachableFromActiveNodeIds`, `shortestRouteResults`, `shortestRouteTargetNodeId`, `isShortestRouteStale` runtime state (all cleared on campaign lifecycle transitions, never persisted). Extended `advance()` to append `TraversalRecord` and recompute `unreachableFromActiveNodeIds`. Extended `selectOption()` to capture `preAdvanceFlagSnapshot`. Added `undoLastNode()`, `computeRoutes`, `clearRouteResults`, `setShortestRouteStale`, `setShortestRouteResults` actions.
- `src/store/uiStore.js`: Added `showTraversalOverlay` (default `true`), `showRouteFinderDialog` (default `false`), `showShortestRouteOverlay` (default `false`), `selectedRouteIndex` (default `0`) state fields and corresponding toggle/set actions.
- `src/components/TopBar.jsx`: Added Undo Active Node button (campaign mode only; disabled when `traversalRecords.length === 0`).
- `src/components/edges/ConditionalEdge.jsx`: Added `--traversal-overlay` CSS class (per-edge boolean from `traversedEdgeIds`; shown when `showTraversalOverlay`) and `--route-overlay` CSS class (shown when edge is in the selected shortest-route path).
- `src/components/nodes/CommonNode.jsx`: Added `--coverage-gap` orthogonal CSS overlay when node is in `unreachableFromActiveNodeIds`.
- `src/components/nodes/ChoiceNode.jsx`: Added `--coverage-gap` orthogonal CSS overlay when node is in `unreachableFromActiveNodeIds`.
- `src/components/nodes/EndingNode.jsx`: Added `--coverage-gap` orthogonal CSS overlay when node is in `unreachableFromActiveNodeIds`.
- `src/App.jsx`: Added `<StatusStrip />` as a fourth grid region (28px bottom bar).
- `src/App.css`: Expanded grid from three to four regions to accommodate the StatusStrip bottom bar.
- `src/styles/tokens.css`: Added `--color-traversal-overlay`, `--color-route-overlay`, `--opacity-coverage-gap`, and StatusStrip color tokens.
- `src/styles/global.css`: Added CSS blocks for `--coverage-gap` overlay pseudo-element, `.conditional-edge--traversal-overlay`, `.conditional-edge--route-overlay`, StatusStrip component styles, and RouteFinderDialog overlay styles.
- `src/utils/index.js`: Added `detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths` re-exports from `routeTracer.js`.
- `src/components/index.js`: Added `StatusStrip` and `RouteFinderDialog` barrel exports.

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
