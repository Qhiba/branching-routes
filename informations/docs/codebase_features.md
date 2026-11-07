# Branching Routes — Codebase Features

---

## Project Root

### `index.html`
- **Purpose:** Entry point HTML shell; mounts the React app into `#root`. Sets page title and meta description. (Google Fonts CDN links removed).
- **Key exports:** None (HTML file).
- **Dependencies:** `src/main.jsx`

### `vite.config.js`
- **Purpose:** Vite build configuration. Configures `src/` absolute import aliases (`components`, `store`, `utils`, `styles`, `hooks`) so internal imports avoid relative `../../` chains. Adds `manualChunks(id)` splitting `vendor_react`, `vendor_reactflow`, and `vendor_icons`. Vitest config block (`globals: true`, `environment: 'node'`). **`savesPlugin()` (2026-11-05):** dev-server middleware at `/__saves` for Save/Load. `GET /__saves` lists `saves/` (`[{ name, size, modified }]`, newest first), `GET /__saves/<file>` reads, `PUT /__saves/<file>` writes (creates `saves/`, overwrites). Only names matching `[A-Za-z0-9_-]{1,100}.(json|zip)` are accepted (400 otherwise), `PUT` needs the `x-br-saves: 1` header (403 otherwise), 100 MB cap, and every reply carries `x-br-saves: 1` so the client can tell it from a static host's index.html fallback. Not present in `vite build` / preview.
- **Key exports:** Default Vite config object.
- **Dependencies:** `@vitejs/plugin-react`, `path`

### `start-app.bat` (NEW — 2026-11-05)
- **Purpose:** Windows launcher at the repo root. Checks that `npm` exists, runs `npm install` when `node_modules` is missing, then `npm run dev -- --open` (opens the browser). Pauses on errors and when the server stops.

---

## `src/`

### `src/main.jsx`
- **Purpose:** Bootstrap and persistence wiring. `initPersistence()` (AR-17): loads the IndexedDB autosave, runs it through `migrateGraph()` (falls back to the raw autosave if that throws), calls `loadGraph()` + `exitCampaign()`, starts undo history with `initHistory()`, restores campaigns (`loadCampaignsFromIndexedDB`), then wires two debounced (1000ms) subscriptions: `narrativeStore` → `saveToIndexedDB(exportGraph())` and `campaignStore` → `saveCampaignsToIndexedDB`. Then renders `<App />` inside `<ErrorBoundary>` and `StrictMode`. **Dev only:** when the URL hash is `#design` it lazy-imports `components/dev/DesignSystemPreview` instead (no persistence); that branch is removed from production builds.
- **Key exports:** None (side-effect entry point).
- **Dependencies:** `App.jsx`, `components` (`ErrorBoundary`), `styles/global.css`, `utils` (`loadFromIndexedDB`, `saveToIndexedDB`, `migrateGraph`), `store` (`useNarrativeStore`, `useSimulationStore`, `useCampaignStore`, `initHistory`)

### `src/components/ErrorBoundary.jsx` (NEW)
- **Purpose:** React class component using `getDerivedStateFromError` + `componentDidCatch`. Fallback UI with: page reload, emergency JSON backup export (extracting narrativeStore data), storage reset (clears IndexedDB + localStorage). Has expandable diagnostic panel. Wrapped around App in main.jsx. Styled with glassmorphic overlay in global.css.
- **Key exports:** `default ErrorBoundary`
- **Dependencies:** `store` (barrel — `useNarrativeStore`), `utils` (barrel — `clearIndexedDB`)

### `src/App.jsx`
- **Purpose:** Root component. Grid shell: `<TopBar />`, `<LeftSidebar />` (project data), `<GraphCanvas />` with `<FloatingMiddleBar />` overlaid (campaign mode only), `<RightSidebar />` (Browse / Inspect), `<StatusStrip />`. Fixed overlays mounted outside the `ReactFlowProvider` subtree (AR-19): `<Toast />`, `<CommandPalette />`, `<SettingsModal />`, `<ShortcutsDialog />`.
- **Key exports:** `default App`
- **Dependencies:** `components` barrel, `App.css`

### `src/App.css`
- **Purpose:** CSS grid for the shell — 48px top bar, `min-content 1fr min-content` main row (left sidebar, canvas, right sidebar), 28px status strip. Layout regions use z-index 1–3 only; overlay z-indices are reserved for portalled dialogs (AR-38). Background `--br-night`, font `--br-font`.
- **Key exports:** None (stylesheet).

---

## `src/styles/`

### `src/components/nodes/HubNode.jsx`
- **Purpose:** Custom React Flow node component for the HUB / Bridge Router Node (`type === 'hub'`). Styled as a **True Diamond (Rhombus)** shape ($45^\circ$ rotated square with $-45^\circ$ counter-rotated inner content) using Electric Teal (`#14b8a6`) accent border, glow, and a clean centered $22\text{px}$ GitMerge icon (text label removed from canvas display, retained as tooltip title). Acts as a convergence/routing junction for funneling choice options into downstream conditional edges. Supports campaign simulation active, reachable, visited, and locked visual states.
- **Key exports:** `HubNode` (React component, memoized)
- **Dependencies:** `@xyflow/react`, `store`

### `src/styles/tokens.css`
- **Purpose:** Legacy design tokens (`--color-*`, `--space-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--transition-*`, z-index scale `--z-cluster` / `--z-context-menu` / `--z-modal` / `--z-palette` / `--z-toast`, campaign-state colours, node-type colours, cluster palette, accent families and `-rgb` helpers) plus the keyframes `fade-in`, `zoom-in-95`, `slide-in-from-top`. **Since Redesign Step 8** the surface, text, border, primary and canvas tokens hold the design-system values (night `#12151c`, graphite `#191d26`, slate `#212634`, chalk `#e4e8ef`, …), so older stylesheets render in the new palette. `--color-primary` is chalk (fills use dark text). Node identity colours (`--color-node-common/choice/ending/hub`) are unchanged. Frozen for new work: use the `--br-*` tokens (AR-37).
- **Key exports:** CSS variables (`:root` scope), keyframes.
- **Dependencies:** None.

### `src/styles/global.css`
- **Purpose:** Reset, base styles and the legacy component styles: node cards (`.story-node`, type bars, warning badges, seen overlay), six-state campaign classes (`.story-node--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`) and `--coverage-gap` / `--filtered-out`, choice option interaction classes, `ConditionalEdge` (stroke `--br-edge`, 1.75px; selected edges chalk; campaign, route and frozen-prefix overlays), snap guides, `.sandbox-panel`, ErrorBoundary, context menu, command palette, toasts and the naming dialog. A closing block (Redesign Step 8) aligns the context menu, palette, toasts and `NameModal` with `.br-menu` / `.br-dialog` geometry. No `text-transform: uppercase` (AR-37). React Flow handles are hidden until hover; campaign mode hides them. Imports `tokens.css`, `buttons.css` and `system.css`.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css`, `styles/buttons.css`, `styles/system.css` (imported via `@import`)

### `src/styles/system.css` (NEW — Redesign Step 3)
- **Purpose:** The design system ("Night route map"). Principle: colour belongs to the story, not the interface — chrome is graphite + chalk, the primary action is a chalk fill, and hue is reserved for node identity (route colours) and danger. Defines `--br-*` tokens (surfaces night/graphite/slate/well, lines, three text levels all ≥ 4.5:1 contrast, chalk action, danger, route colours + brightened `-mark` variants, type scale 11/12/13/15/18, radius hierarchy control 6 / menu 8 / dialog 12, control heights, shadows for floating layers only, motion that respects `prefers-reduced-motion`). Primitives (class-only selectors): `.br-btn` (`--primary`, `--ghost`, `--danger`, `--sm`, `--icon`, `[aria-pressed]`), `.br-field`/`.br-input`/`.br-select`/`.br-textarea`/`.br-range`, `.br-switch` (`role=switch`), `.br-segmented`/`.br-segment` (`aria-checked`), `.br-panel-header`, `.br-section`, `.br-setting`, `.br-row`, `.br-chip`, `.br-badge`, `.br-kbd`, `.br-empty`, `.br-menu`, `.br-dialog`, and the signature **route mark** `.br-route` / `.br-route--stripe` coloured by any `[data-route=common|choice|ending|hub|warp]` ancestor. One focus ring (2px chalk outline, 2px offset) for all primitives. Also: `--br-edge` (canvas edge colour), quiet scrollbars app-wide, `.br-btn--danger-solid`, `.br-dialog--sm`, `.br-dialog__body--form`, `.br-dialog-backdrop--top`, `.br-setting__control`, `.br-value`, `.br-confirm__message`, keyboard shortcut sheet layout (`.br-shortcuts*`). Imported by `global.css` after the legacy sheets.
- **Key exports:** None (stylesheet).
- **Dependencies:** legacy `--color-node-*` tokens (route base colours), `--z-modal`.

### `src/components/dev/DesignSystemPreview.jsx` (NEW — Redesign Step 3)
- **Purpose:** Development-only reference sheet rendering every `system.css` primitive with realistic content. Opened at `/#design` during `npm run dev`; `main.jsx` lazy-imports it inside an `import.meta.env.DEV` branch, so it is excluded from production builds and skips persistence wiring.
- **Key exports:** `default DesignSystemPreview`

### `src/styles/buttons.css`
- **Purpose:** Legacy button classes (`.btn`, `.btn--sm`, `.btn--secondary`, `.btn--ghost`, `.btn--primary`, `.btn--danger`, `.btn--icon`, `.btn--active`) still used by a few campaign-era components. Frozen: new UI uses `.br-btn` (AR-37). Unused variants (`--lg`, `--danger-ghost`, `--pill`) were removed in Redesign Step 8.
- **Key exports:** None (stylesheet).
- **Dependencies:** `styles/tokens.css`

---

## `src/store/`

### `src/store/narrativeStore.js` (RENAMED FROM graphStore.js — 14-04-2026)
- **Purpose:** Zustand store owning the canonical graph: `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, `tag{}`, `commonType{}`, `endingType{}`, `collectibleCategory{}`, `collectible{}`, and `meta`. Persistent editor-level seen marks `editorSeenNodeIds[]` / `editorSeenOptionIds[]` (keys `nodeId::optionId`). Runtime-only `graphRevision` (bumped by `loadGraph` / `newGraph`; never exported) lets undo history reset. CRUD for every entity type with cascading deletes, option CRUD with edge cleanup, collectible CRUD, list reordering (`reorderDictionaryKeys`), and import/export at `schemaVersion: 5` (`CURRENT_SCHEMA_VERSION`). `addFlag` / `addStatus` validate names (letters, digits, `_`); spaces are converted to `_` by `NameModal` before saving. `deleteFlag` / `deleteStatus` scan edge conditions, node effects and option `requires` / `flags_set` / `status_set` (blocked unless `force`). Cross-store calls to `uiStore` / `toastStore` carry `// INTENTIONAL` comments.
- **Key exports:** `useNarrativeStore` (Zustand hook)
- **Dependencies:** `utils` (barrel — `generateId`, `CURRENT_SCHEMA_VERSION`)
- **Collectibles (Redesign Step 2):** tracking-only items granted by Common nodes via `data.collectibleIds[]` (never read by `conditionEvaluator`). `addCollectibleCategory(name)` / `addCollectible(name, categoryId?)` return the new ID (unknown category → `null`). `deleteCollectible(id, force?)` returns `{ blocked, references }` while nodes grant it; `force` cascades via the module helper `stripCollectibleIds`. `deleteCollectibleCategory(id, force?)` is blocked while it has items; `force` deletes the items too. `toggleNodeCollectible(nodeId, collectibleId)` ignores non-Common nodes (hub/warp/choice/ending). `exportGraph()` emits `schemaVersion: 5`. Variant CRUD was removed.
- **Actions:** `addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `addStatus`, `updateStatus`, `deleteStatus`, `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`, `addTag`, `updateTag`, `deleteTag`, `addCollectibleCategory`, `updateCollectibleCategory`, `deleteCollectibleCategory`, `addCollectible`, `updateCollectible`, `deleteCollectible`, `toggleNodeCollectible`, `addOption`, `updateOption`, `deleteOption`, `addCommonType`, `updateCommonType`, `deleteCommonType`, `addEndingType`, `updateEndingType`, `deleteEndingType`, `reorderDictionaryKeys`, `updateMeta`, `toggleNodeSeen`, `toggleOptionSeen`, `clearAllSeen`, `applySeenFromCampaign`, `loadGraph`, `newGraph`, `exportGraph`, `pasteNode`
- **`addTag(name)`:** Creates a new tag `{ id, name }` in the `tag{}` dictionary.
- **`updateTag(id, name)`:** Updates the name of an existing tag.
- **`deleteTag(id, force?)`:** Removes the tag from the `tag{}` dictionary. Performs cascading cleanup: removes the tag ID from `data.tagIds[]` arrays across all nodes in `common{}`, `choice{}`, and `ending{}` collections. `force` bypasses confirmation.
- **`pasteNode(copiedNode, position)`:** Duplicates the node, appends ` (Copy)` to its label, clears the start flag, regenerates Choice option IDs (`opt-`), selects the copy, shows a toast and **returns the new node ID** (used by Duplicate).
- **`applySeenFromCampaign(nodeIds, optionKeys)`:** Union-merges the provided node ID array and option key array (`nodeId::optionId` format) into `editorSeenNodeIds` and `editorSeenOptionIds` respectively, using Set deduplication. Called by `FloatingMiddleBar` "Save Seen" to persist campaign traversal marks into the authored data.

### `src/store/uiStore.js`
- **Purpose:** Zustand store for UI state (never persisted with the graph).
  - **Selection:** `selectedNodeId`, `selectedEdgeId`, `selectedNodeIds` (`setSelectedNodeIds` has a load-bearing order-independent equality check), `copiedNode`.
  - **Canvas display:** `snapToGrid`, `snapAssist` (session), `snapThreshold` (`br_snapThreshold`, 2–32), `choiceDisplayMode` (`'medium'` | `'full'`), `labelDisplayMode` (`'compact'` | `'verbose'`), `showMiniMap` (`br_showMiniMap`, default on).
  - **Canvas filters** (dim, never hide): `canvasFilterChapterId`, `canvasFilterPathId`, `canvasFilterTagIds`, `canvasFilterTagsLogic` (`'or'` | `'and'`), `canvasFilterNodeType`, `canvasFilterCollectibleCategoryId`; `resetCanvasFilters`.
  - **Settings / features:** `featureCampaign` (`br_featureCampaign`, default off — AR-36), `searchIncludeEdges` (`br_searchIncludeEdges`, default on), `showSettings`, `showShortcuts`.
  - **Campaign / route tracing:** `followActiveNode`, `showTraversalOverlay`, `showShortestRouteOverlay`, `selectedRouteIndex`, `frozenWaypointEdgeIds`, `mergedGroupEdgeIds`.
  - **Batch flag creation:** `seqStart`, `seqEnd`, `seqPad` (persisted).
  - Persistent values go through `safeStorage` (AR-33).
- **Key exports:** `useUIStore` (Zustand hook)
- **Dependencies:** `utils/safeStorage`
- **Actions:** `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `setSelectedNodeIds`, `setCopiedNode`, `toggleSnapToGrid`, `toggleSnapAssist`, `setSnapThreshold`, `setChoiceDisplayMode`, `toggleLabelDisplayMode`, `toggleMiniMap`, `setCanvasFilterChapterId`, `setCanvasFilterPathId`, `setCanvasFilterTagIds`, `setCanvasFilterTagsLogic`, `setCanvasFilterNodeType`, `setCanvasFilterCollectibleCategoryId`, `resetCanvasFilters`, `setFeatureCampaign`, `setSearchIncludeEdges`, `setShowSettings`, `setShowShortcuts`, `setFollowActiveNode`, `toggleTraversalOverlay`, `toggleShortestRouteOverlay`, `setSelectedRouteIndex`, `setFrozenWaypointEdgeIds`, `setMergedGroupEdgeIds`, `setSeqStart`, `setSeqEnd`, `setSeqPad`

### `src/store/simulationStore.js`
- **Purpose:** Zustand store owning campaign-mode state and live simulation. Runs in two modes: edit mode (passive structural analysis only — `runPassiveAnalysis` computes `orphanedNodeIds`/`unreachableNodeIds` via BFS from the start node, traversing active warp portals by connecting matching `warp_entrance` and `warp_exit` channels) and campaign mode (full simulation lifecycle). Campaign lifecycle: `enterCampaign(campaignPayload?)` accepts an optional campaign object, seeding start node `flags_set`/`status_set` initial values. `advance(edgeId)` moves to the destination node, records the move into `traversalRecords[]` containing `{ edgeId, targetNodeId, priorFlagSnapshot, priorStatusSnapshot }` (capped at `MAX_TRAVERSAL_DEPTH = 1000` via `.slice()`), updates `seenNodeIds` and `traversedEdgeIds`, and recomputes node states. If advancing reaches a `warp_entrance` node, it resolves the matching `warp_exit` (with the same `portalChannel`) and teleports the active state to the exit node's ID. If advancing reaches a `hub` node, it evaluates outgoing edge conditions and automatically cascades pass-through routing to the destination node while executing any junction side effects (`flags_set`, `status_set`). `seenNodeIds` tracks campaign-only traversal history and is reset on `exitCampaign()` / `enterCampaign()`; editor-level seen marks are owned by `narrativeStore`. `undoLastNode()` pops a record from `traversalRecords`, resets `activeNodeId` (handling warp and hub node teleports in reverse), restores `currentFlagValues` and `currentStatusValues` using the captured snapshot, rebuilds sets, and restores `selectedOptionId` from `record.optionId`. `selectOption(optionId)` fires side effects, sets `selectedOptionId`, and modifies reachability. `computeRoutesFromStart` executes pathfinding asynchronously via `computeShortestPathsAsync` using the search depth limit, storing multiple potential sequence strings in `shortestRouteResults`. The store tracks forward-reachability (`forwardReachableNodeIds`) leveraging BFS scanning under `computeForwardReachable` to power `--coverage-gap` visual styles. Sandbox overrides bypass narrative defaults ephemerally.
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
- **Key exports:** `useNarrativeStore`, `useSimulationStore`, `useCampaignStore`, `useUIStore`, `useToastStore`, and from `historyStore`: `useHistoryStore`, `initHistory`, `resetHistory`, `undo`, `redo`, `beginGroup`, `endGroup`, `cancelGroup`
- **Dependencies:** `narrativeStore`, `simulationStore`, `campaignStore`, `uiStore`, `toastStore`, `historyStore`

### `src/store/campaignStore.js`
- **Purpose:** Zustand store owning the campaign dictionary and active campaign pointer. Campaigns are named simulation snapshots that persist across sessions. Each campaign stores `{ id, name, createdAt, updatedAt, campaignSchemaVersion: 1, snapshot: { activeNodeId, seenNodeIds, traversedEdgeIds, flagOverrides, statusOverrides } }`. Provides full CRUD (`addCampaign` returns the new campaign ID for immediate chaining), IndexedDB persistence via `saveCampaignsToIndexedDB`/`loadCampaignsFromIndexedDB`, and `loadCampaignsFromObject` for restoring campaigns from a ZIP import. `loadCampaignsFromIndexedDB` always resets `activeCampaignId` to `null` after restore — preventing stale active-campaign state on boot.
- **Key exports:** `useCampaignStore` (Zustand hook)
- **Dependencies:** `utils` (direct — `generateId`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`)
- **Actions:** `addCampaign`, `updateCampaign`, `deleteCampaign`, `setActiveCampaign`, `clearCampaigns`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `loadCampaignsFromObject`

---

## `src/utils/`

### `src/utils/uuid.js`
- **Purpose:** Thin wrapper around the browser's `crypto.randomUUID()`. Returns a prefixed UUID string. Includes a `getUUID()` helper with `crypto.randomUUID()` check + RFC 4122 v4 math-random fallback for non-secure contexts.
- **Key exports:** `generateId(prefix): string`, `getUUID(): string`
- **Dependencies:** None.

### `src/utils/conditionEvaluator.js`
- **Purpose:** Pure functions that evaluate a `Condition` object against a `flagState` map. The only file permitted to contain condition/logic evaluation code (AR-07).
- **Key exports:** `evaluateCondition(condition, flagState): boolean`, `evaluateClause(clause, flagState): boolean`
- **Dependencies:** None.

### `src/utils/routeTracer.js`
- **Purpose:** Pure functions responsible for whole-graph reachability logic decoupled from UI renders. Contains `detectDeadEnds()` scanning for nodes with no outgoing edges; `computeForwardReachable()` providing a standard BFS pass across all dynamically passable gateways; `computeShortestPaths()` — a K-Shortest gate-evaluating BFS tracking paths up to a caller-supplied `limit` (no internal hard cap) with priority tie-breakers, bounded by an internal `MAX_STATE_VISITS = 10_000` ceiling. It treats warp portal connections as virtual jumps (which do not increase path lengths or edge lists), accepts a `depthLimit` to restrict maximum search depth, and implements a state-aware cycle guard hashing active flags and status points to allow paths to loop through choice nodes if and only if status points or flags change; `simulateFlagStateAlongPath()` replaying a sequence of edges against an initial flag seed to produce final accumulated flag/status state; `findMergeGroups()` grouping paths that can be collapsed into a single merged display card (union-find transitive merging — two paths merge when they diverge only at choice-option edges whose side effects are not read downstream); and `buildRouteSnapshot()` constructing a campaign snapshot from a traced path. Exposes `computeShortestPathsAsync` and `cancelRouteWorker` async wrapper functions for Web Worker integration (falling back to synchronous execution in non-browser/test environments).
- **Key exports:** `detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`, `simulateFlagStateAlongPath`, `findMergeGroups`, `buildRouteSnapshot`, `computeShortestPathsAsync`, `cancelRouteWorker`
- **Dependencies:** `utils/conditionEvaluator`

### `src/utils/routeTracer.worker.js` (NEW)
- **Purpose:** ES module Web Worker importing `computeShortestPaths`. Processes pathfinding off main thread. Instantiated via Vite ESM worker syntax.
- **Key exports:** None (Web Worker)
- **Dependencies:** `utils/routeTracer` (`computeShortestPaths`)

### `src/utils/fileSystem.js`
- **Purpose:** Persistence and file I/O. IndexedDB (DB v2, stores `graphs` + `campaigns`): `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB`. Files: `exportProject` (`.json`, or `.zip` with `datamodel.json` + `campaigns/` when campaigns exist; File System Access API with download fallback) and `importProject` (JSON or ZIP; campaign files validated against `campaignSchemaVersion: 1`). Every graph goes through `migrateGraph()` (v1→v5 chain, structural validation, `sanitizedData` whitelist — AR-27). Errors: `unsupported_schema_version`, `invalid_project_structure`.
- **Key exports:** `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB`, `exportProject(graphData, campaigns, title)`, `importProject()`, `saveProject(graphData, campaigns, title)`, `listSavedProjects()`, `loadSavedProject(name)`, `migrateGraph(data)`, `CURRENT_SCHEMA_VERSION`
- **Save / Load (2026-11-05):** `saveProject(graphData, campaigns, title)` builds the file (`buildProjectFile`: `<title>.json`, or `<title>.zip` with `datamodel.json` + `campaigns/` when campaigns exist; name lowercased, non-alphanumerics → `_`) and `PUT`s it to `/__saves`; returns `{ name, where: 'saves' | 'download' }` or `null` if the picker was cancelled. If the endpoint is missing (not running under `npm run dev`) it falls back to `exportProject` (save-as picker / download). `listSavedProjects()` returns the list or `null` when unavailable; `loadSavedProject(name)` fetches a file and parses it. `importProject()` (file picker) and `loadSavedProject` share the module-private `parseProjectFile(file)` (JSON/ZIP → `migrateGraph`). The `/__saves` fetches are the single AR-10 exception.
- **Migration pipeline (Redesign Step 2):** `migrateGraph(data)` (exported, pure) holds the whole v1→v5 migration chain, structural validation and the `sanitizedData` whitelist. `importProject()` returns `{ graphData: migrateGraph(data), campaigns }`; `main.jsx` runs the IndexedDB autosave through it too (falling back to the raw autosave if it throws). v4→v5 deletes `data.variants` (console warning with the count), adds `collectibleCategory`/`collectible`; `sanitizeNodes` keeps `createdAt` and gives plain Common nodes `collectibleIds[]` (dangling IDs dropped), removing it elsewhere. `CURRENT_SCHEMA_VERSION = 5` is exported.
- **Dependencies:** `utils/uuid` (`generateId`), `jszip`

### `src/utils/safeStorage.js` (NEW)
- **Purpose:** Safe localStorage wrapper with `safeGet`, `safeSet`, `safeRemove`, `safeClear` — all wrapped in try/catch for QuotaExceeded and SecurityError.
- **Key exports:** `safeGet`, `safeSet`, `safeRemove`, `safeClear`
- **Dependencies:** None

### `src/utils/snapGuides.js` (NEW)
- **Purpose:** Pure math utilities for the Smart Snap Assist feature. No store access, no DOM access — independently testable. Contains `computeSnapGuides(otherNodes)` which collects deduplicated Y (row) and X (column) positions from non-dragging, non-Hub nodes and returns sorted arrays for O(log N) binary-search lookups; `getActiveGuides(pos, guides, threshold)` which returns which guide (if any) is within threshold of the current drag position — used to decide whether to render guide lines; `getSnappedPosition(pos, guides, threshold)` which snaps each axis independently to the nearest guide within threshold — applied on `onNodeDragStop`; and `applyAxisLock(finalPos, startPos)` which compares `|dx|` vs `|dy|` from drag start and locks the non-dominant axis back to its start value (Shift-hold behavior). Performance design: `computeSnapGuides` is called **once** in `onNodeDragStart` and cached in a ref; per-frame calls during drag only run `getActiveGuides` (binary search, O log N).
- **Key exports:** `computeSnapGuides`, `getActiveGuides`, `getSnappedPosition`, `applyAxisLock`
- **Dependencies:** None.

### `src/utils/index.js`
- **Purpose:** Barrel re-export for all utilities.
- **Key exports:** everything exported by `uuid`, `conditionEvaluator`, `fileSystem`, `routeTracer`, `snapGuides`, `dialogKeys` (`isConfirmEnter`), `nodeColors` (`ROUTE_MARK_COLORS`, `EDGE_COLOR`, `miniMapNodeColor`), `alignNodes` (`computeAlignment`, `ALIGN_MODES`) and `searchIndex` (`searchGraph`, `nodeMatchesFilters`, `nodeRouteType`, `listNodes`, `describeClause`, `describeCondition`, `countActiveFilters`, `ROUTE_TYPE_LABELS`). `safeStorage` is imported directly by `uiStore`.

---

## `src/hooks/`

### `src/hooks/useFocusTrap.js` (NEW)
- **Purpose:** Custom hook that auto-focuses the first interactive element on mount, traps Tab/Shift+Tab inside the dialog and restores focus on unmount. Used by every dialog (AR-35).
- **Key exports:** `default useFocusTrap`
- **Dependencies:** None (React only)

### `src/hooks/useKeyboardShortcuts.js`
- **Purpose:** Global keyboard handling, mounted once inside `GraphCanvas`. Order of checks: `Ctrl+K` (palette, works inside its own input) → `Ctrl+S` (dispatches `project-save`; works while typing; skipped in campaigns) → input guard (inputs keep native keys) → **Ctrl/⌘ combos**: `Z` undo, `Shift+Z` / `Y` redo, `A` select all (`canvas-select-nodes`), `D` duplicate, `=`/`+` `-` `0` zoom (`canvas-view`), `C` / `V` copy / paste node, `W` warp exit → `Esc` clears selection → modifier guard → **view keys** (allowed in campaigns): `Shift+1` fit all, `Shift+2` fit selection, `?` shortcut sheet, `V` snap to grid, `L` fit the whole story (`graph-layout-tidy` → `fitView`), `R` label mode, `A` Snap Assist → campaign guard → **authoring keys**: `N` / `C` / `E` / `W` new Common / Choice / Ending / Warp entrance (`canvas-open-node-modal`), `F` / `S` / `P` / `H` new flag / status / path / chapter (`canvas-open-name-modal`), `M` toggle Seen (only with `featureCampaign`), `Del` delete selection (multi-delete is one undo step). **Arrow keys** run in a separate capture-phase listener: they move the selection 16px (snap-to-grid) or 4px, ×5 with Shift, and stop React Flow's own focused-node arrow move. Modifier body classes `alt-pressed` / `ctrl-pressed` / `shift-pressed` (AR-30) are cleared on window blur.
- **Key exports:** `default useKeyboardShortcuts`, `duplicateSelection()` (copies the selection 48px down-right as one undo step and selects the copies), `nudgeSelection(dx, dy, big)`
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useSimulationStore`, `useToastStore`, `undo`, `redo`, `beginGroup`, `endGroup`)

---

## `src/components/`

*Note: Components import their own stylesheet when they need component-specific layout (e.g. `TopBar.css`, `StatusStrip.css`, `SideRail.css`). Shared appearance comes from `styles/system.css` (AR-37).*

### `src/components/TopBar.jsx`
- **Purpose:** Horizontal top bar with three sections: left (brand logo + editable project title), center ("Add node" group: labelled buttons Common, Choice, Ending, Hub, Warp in, Warp out, each with its route dot; labels collapse to dots below 1180px), right (campaign selector + Start when the feature switch is on, undo/redo, File menu: New project / Load project… / Save project `Ctrl S`, Settings gear). **Save/Load (2026-11-05):** Save writes `saves/<title>` through `saveProject` and toasts `Saved saves/<name>`; it also runs on the `project-save` window event (fired by Ctrl+S, AR-19; ignored in campaign mode). Load opens `LoadProjectDialog` with the `saves/` list, or goes straight to the file picker when the list is unavailable; "Browse other file…" opens the picker. The campaign selector and Start button render only when `uiStore.featureCampaign` is on. Snap Assist controls were moved to `SettingsModal` (Redesign Step 1). Node buttons, the title, undo/redo and the File menu are disabled during a campaign. New project asks first (`ConfirmModal`), then clears both IndexedDB stores and calls `newGraph()`. Open/import errors (`unsupported_schema_version`, `invalid_project_structure`) and successes are reported with toasts, not `alert()`. Built on design-system primitives (AR-37).
- **Key exports:** `default TopBar`
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useSimulationStore`, `useCampaignStore`, `useToastStore`, `useHistoryStore`, `undo`, `redo`), `utils` (`saveProject`, `importProject`, `listSavedProjects`, `loadSavedProject`, `clearIndexedDB`, `clearCampaignsIndexedDB`), `components/ConfirmModal`, `components/modals/LoadProjectDialog`, `TopBar.css`

### `src/components/GraphCanvas.jsx`
- **Purpose:** React Flow canvas. Derives nodes from `common` / `choice` / `ending` (z-order by `createdAt`) and edges from `edges`; module-scope `NODE_TYPES` (`commonNode`, `choiceNode`, `endingNode`, `warpEntranceNode`, `warpExitNode`, `hubNode`) and `EDGE_TYPES`. Per-slice store selectors (AR-23). `isFilteredOut` comes from `nodeMatchesFilters` (shared with Browse). Campaign guards: nodes not draggable / connectable / selectable; node click advances along reachable edges. **Editing:** click selects and opens the Inspector (`switch-right-panel`); double-click node → `NodeConfigModal` or `WarpConfigModal`; double-click edge → `EdgeConfigModal`. **Undo groups (AR-39):** node creation (`canvas-open-node-modal`: `beginGroup` → `addNode` → modal; save `endGroup`, cancel `deleteNode` + `cancelGroup`) and each node/edge editing session. Nodes new to the canvas take their selection from `uiStore` (keeps duplicates selected). **Snap Assist:** guide cache on drag start, Ctrl shows guides, Shift locks an axis, snap on drop (Hub nodes excluded). **Events handled (AR-19):** `canvas-add-node`, `canvas-open-node-modal`, `canvas-paste-node`, `canvas-edit-node-modal`, `canvas-edit-edge-modal`, `canvas-open-name-modal`, `canvas-focus-node`, `canvas-navigate-to-node`, `canvas-center-origin`, `canvas-view` (zoom-in / zoom-out / zoom-reset / fit / fit-selection), `canvas-select-nodes` (`ids` or `null` for all), `canvas-align` (uses measured node sizes + `computeAlignment`, one undo step), `graph-layout-tidy` (`fitView`). Renders `<CanvasControls/>`, a skinned toggleable `<MiniMap/>` (route colours), snap guide overlay and the context menu. Follows the active node in campaigns when `followActiveNode` is on. Mounts `useKeyboardShortcuts`.
- **Key exports:** `default GraphCanvas`
- **Dependencies:** `store` (`useNarrativeStore`, `useSimulationStore`, `useUIStore`, `beginGroup`, `endGroup`, `cancelGroup`), `utils` (`computeSnapGuides`, `getSnappedPosition`, `getActiveGuides`, `applyAxisLock`, `miniMapNodeColor`, `computeAlignment`, `nodeMatchesFilters`, `nodeRouteType`, `EDGE_COLOR`), `hooks/useKeyboardShortcuts`, `@xyflow/react`, node/edge renderers, `ContextMenu`, `NameModal`, `CanvasControls`, `NodeConfigModal`, `WarpConfigModal`, `EdgeConfigModal`

### `src/components/ConfirmModal.jsx` (NEW)
- **Purpose:** Reusable confirmation dialog (`isOpen`, `title`, `message`, `confirmLabel`, `danger`, `onConfirm`, `onCancel`). Rendered through `ModalPortal` above other dialogs (`.br-dialog-backdrop--top`), `role="alertdialog"`, focus trap. Enter confirms (except when a button has focus, so Cancel + Enter cancels), Esc cancels — both in the capture phase so canvas shortcuts don't fire. `danger` uses `.br-btn--danger-solid`, otherwise `.br-btn--primary`. Built on primitives; `ConfirmModal.css` was removed.
- **Key exports:** `default ConfirmModal`
- **Dependencies:** `hooks/useFocusTrap`, `ModalPortal`

### `src/components/ContextMenu.jsx`
- **Purpose:** Right-click menu at the cursor (`type`: `'pane'` | `'node'` | `'edge'` | `'multi'`). **Pane:** add Common / Choice / Ending / Warp entrance / Warp exit / Hub at the cursor, Paste node. **Node:** Edit node, Make start node, Copy node, Duplicate node (Ctrl D), Delete node. **Edge:** Edit edge, Delete edge. **Several nodes:** align left / centres / right / top / middles / bottom, distribute horizontally / vertically (3+ nodes) via `canvas-align`, Duplicate, Delete (one undo step). Flips at viewport edges; Esc closes it (capture phase); `GraphCanvas` also closes it on pane click, drag and pan. Styled to match `.br-menu` (`global.css`).
- **Key exports:** `default ContextMenu`
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useToastStore`, `beginGroup`, `endGroup`), `hooks/useKeyboardShortcuts` (`duplicateSelection`)

### `src/components/NameModal.jsx`
- **Purpose:** Naming dialog for flags, statuses, paths, chapters, tags and node types (create and rename). Rendered through `ModalPortal` (never inside a sidebar, AR-38), focus trap, Enter confirms (with `preventDefault` so the focused + button is not re-clicked), Esc closes. Flag and status names turn spaces into `_` (`toVariableName`, with a "Saved as …" hint); invalid names show an error toast instead of throwing. Flags support batch creation (`seqStart` / `seqEnd` / `seqPad` from `uiStore`, e.g. `flag_001`…).
- **Key exports:** `default NameModal`
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useToastStore`), `hooks/useFocusTrap`, `ModalPortal`

### `src/components/FlagManager.jsx`
- **Purpose:** Panel listing all flags with name and default boolean value. Restyled with `EntityList.css` and lucide-react icons. Add-flag form with live name validation. Delete with referential integrity checking. Supports manual reordering via `@hello-pangea/dnd` invoking `narrativeStore.reorderDictionaryKeys` (drag disabled while searching). Dynamically fills the Flag icon (`fill="currentColor"`) if the flag is actively referenced anywhere in the narrative graph (via `isFlagUsed` check).
- **Key exports:** `default FlagManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/StatusManager.jsx`
- **Purpose:** Panel listing all status points with name, value, min/max. Restyled with `EntityList.css` and lucide-react icons. Add-status form with live name validation. Delete with referential integrity checking. Supports manual reordering via `@hello-pangea/dnd` invoking `narrativeStore.reorderDictionaryKeys` (drag disabled while searching).
- **Key exports:** `default StatusManager`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/PathChapterManager.jsx`
- **Purpose:** Generic list manager for simple named entities. `filterType`: `'chapter'`, `'path'`, `'tag'`, `'commonType'`, `'endingType'`. Search, create/rename through `NameModal`, delete, drag-reorder (`reorderDictionaryKeys`, disabled while searching). Mounted by `LeftSidebar` in the Tags, Chapters, Paths and Types panels.
- **Key exports:** `default PathChapterManager`
- **Dependencies:** `store` (`useNarrativeStore`, `useSimulationStore`), `NameModal`, `EntityList.css`

### `src/components/EntityList.css` (NEW)
- **Purpose:** Shared list view for `FlagManager`, `StatusManager`, `PathChapterManager` and `CollectibleManager`: search field, + button, flat rows with hover actions, drag handle, delete guard. On `--br-*` tokens since Redesign Step 4; entity icons are neutral (hue is reserved for node identity).
- **Key exports:** None (stylesheet).

### `src/components/nodes/CommonNode.jsx`
- **Purpose:** Custom React Flow node for Common nodes: type bar (subtype name or "Common", warning badges for orphaned / unreachable nodes, effects count, **collectible badge** with gem + count and names on hover), title and content preview; in verbose label mode the flag/status effects (`VerboseEffectsBox`) and collectible names are listed. Editor Seen styling (`story-node--seen`) only when `featureCampaign` is on and no campaign runs. Campaign mode applies the six-state classes, `--seen` and `--coverage-gap`. Reads `data.isFilteredOut` for `--filtered-out`. `React.memo`.
- **Key exports:** `default CommonNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`, `components/nodes/VerboseEffects`

### `src/components/nodes/ChoiceNode.jsx`
- **Purpose:** Custom React Flow node for Choice nodes: type bar ("Choice", effects count, "N out" edge count), title, content, and one option row + source handle per option (single handle when there are no options). Options with unmet requirements show a lock; `choiceDisplayMode` controls option text length; verbose mode lists effects (`OptionVerboseEffectsBox`). Editor Seen styling for the node and its options only with `featureCampaign`. In campaigns the active node's options are clickable (`selectOption`), unmet ones dimmed, the chosen one highlighted. Reads `data.isFilteredOut`. `React.memo`.
- **Key exports:** `default ChoiceNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`, `components/nodes/VerboseEffects`

### `src/components/nodes/VerboseEffects.jsx` (NEW)
- **Purpose:** Isolated sub-components (`FlagChip`, `StatusChip`, `FlagConditionChip`, `StatusConditionChip`, `VerboseEffectsBox`, `OptionVerboseEffectsBox`) for rendering flag/status names in verbose mode. Each chip subscribes to individual flag/status name via `s.flag[id]?.name` targeted selector. Extracted from CommonNode and ChoiceNode to eliminate top-level dictionary subscriptions.
- **Key exports:** `VerboseEffectsBox`, `OptionVerboseEffectsBox`
- **Dependencies:** `store` (barrel — `useNarrativeStore`)

### `src/components/nodes/EndingNode.jsx`
- **Purpose:** Custom React Flow node for Ending nodes: type bar (subtype name or "Ending"), title, content and a footer bar; no outgoing handle (AR-12). Warning badges in edit mode; editor Seen styling only with `featureCampaign`; campaign states (reaching it resolves to `complete`). Reads `data.isFilteredOut`. `React.memo`.
- **Key exports:** `default EndingNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/nodes/WarpEntranceNode.jsx` (NEW)
- **Purpose:** Custom React Flow node for warp entrances ("Warp entrance"): purple square card, left target handle only, label and portal channel. Warning badges in edit mode, seen / coverage-gap in campaigns (editor Seen only with `featureCampaign`). Reads `data.isFilteredOut`.
- **Key exports:** `default WarpEntranceNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/nodes/WarpExitNode.jsx` (NEW)
- **Purpose:** Custom React Flow node for warp exits ("Warp exit"): purple square card, right source handle only, label and portal channel. Warning badges in edit mode, seen / coverage-gap in campaigns (editor Seen only with `featureCampaign`). Reads `data.isFilteredOut`.
- **Key exports:** `default WarpExitNode`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `@xyflow/react`

### `src/components/edges/ConditionalEdge.jsx`
- **Purpose:** Custom React Flow edge renderer using `BaseEdge` + `EdgeLabelRenderer`. Displays edge label and condition badge (AND/OR pill). Labels are draggable via `labelOffsetX` and `labelOffsetY` state, persisted to `narrativeStore`. In campaign mode, applies state CSS classes: `--traversed` (already advanced along), `--condition-pass` (currently reachable and pulsing), `--condition-fail` (active option selected but condition not satisfied), `--unselected-option-dim` (originates from an unselected option). When `uiStore.frozenWaypointEdgeIds` is non-empty and includes this edge's ID, applies `conditional-edge--frozen-overlay` (green dashed animated stroke) regardless of campaign state; this takes priority over all other edge state classes. When `uiStore.mergedGroupEdgeIds` is non-empty and includes this edge's ID, applies the shortest-route overlay highlight (same mechanism as `showShortestRouteOverlay`) for the canonical path of the selected merged route group. Outside campaign mode and without any overlay, edges are visually inert. When `labelDisplayMode === 'verbose'` (from `uiStore`), condition badges resolve flag/status IDs to their designer-assigned names and display full clause text (e.g. "HasKey = true AND Gold ≥ 5") instead of the compact AND/OR pill. **Canvas filter logic:** derives `isFilteredOut` from `sourceNode?.data?.isFilteredOut || targetNode?.data?.isFilteredOut` (no direct `uiStore` filter subscriptions) to apply `.conditional-edge--filtered-out` CSS dimming class. **Edge bend control:** reads `data.bendX` (a `0.0–1.0` ratio) and passes a derived `centerX` to `getSmoothStepPath`, repositioning the vertical segment of long smooth-step edges. In editor mode (not campaign), renders a draggable `⠿` grip handle via `EdgeLabelRenderer` at the vertical segment midpoint; dragging updates `narrativeStore.updateEdge({ bendX })` live via `useReactFlow().screenToFlowPosition`; double-clicking the handle resets `bendX` to `undefined` (auto-center). The edge label container uses `pointerEvents: none` by default; holding `Alt` (via `.alt-pressed` body class) enables pointer events, allowing drag/reposition of the label. Double-click on the label resets `labelOffsetX/Y` to `0`. Labels are always unclickable in Campaign mode. Uses `React.memo` with targeted selectors.
- **Key exports:** `default ConditionalEdge`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useUIStore`, `useNarrativeStore`), `@xyflow/react`

### `src/components/SandboxPanel.jsx`
- **Purpose:** Campaign-only panel containing only the **Sandbox Overrides** section: checkbox list for boolean flags and number inputs for status metrics — all writes go through `simulationStore.applySandboxOverride`, updating `currentFlagValues` ephemerally. The Campaign Save section (autosave toggle, Save Progression, Load Last Save) was moved to `FloatingMiddleBar` in Phase 7 Fix 3. Mounted directly in `RightSidebar`'s "Sandbox" tab. Overrides cleared on `exitCampaign()` and `reset()`.
- **Key exports:** `default SandboxPanel`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useSimulationStore`)

### `src/components/CommandPalette.jsx`
- **Purpose:** Searchable command overlay opened and closed via `Ctrl+K` (palette-toggle DOM event) or ESC. Uses per-slice selectors instead of whole-store destructuring. `handleToggle` uses functional state update `setIsOpen(prev => ...)` with empty deps `[]`. Builds a search index from all `narrativeStore` entities (common/choice/ending/warp nodes, flags, statuses, paths, chapters) using a `useMemo` keyed on collection references (AR-14 compliant). Node entity rows are enriched with `chapterName`/`pathName` via `resolveNodeContext()` for disambiguation when multiple entities share the same label (AR-22). Static action items (Create Common / Choice / Ending node, Create Warp entrance / exit, Create Hub, Create Flag / Status / Path / Chapter — sentence case since Redesign Step 8) dispatch the matching store action or `canvas-add-node`/`canvas-open-name-modal` DOM event; authoring actions are hidden when `isCampaignActive` (campaign-safe filtering). Selecting an entity row dispatches `canvas-navigate-to-node` so `GraphCanvas` pans and zooms to the target (AR-19). ESC handling attaches its own `keydown` listener on `window` calling `e.stopPropagation()` before close to prevent simultaneous canvas selection clear (RISK-CP-03 mitigation). Styled to match the design system by the Step 8 block in `global.css`.
- **Key exports:** `default CommandPalette`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useUIStore`, `useSimulationStore`)

### `src/components/Toast.jsx`
- **Purpose:** Overlay in the top-right corner of the canvas area (mounted inside `.app__canvas`, so it sits below the top bar and left of the right sidebar) that reads `toastStore.toasts` and renders a stacked list of auto-dismiss notification messages. Each toast displays its `message` and applies a variant CSS modifier class (`info`, `success`, `warning`, `error`). The component has no side effects in render — it only reads and maps the `toasts` array (RISK-CP-02 mitigation). Manual dismiss calls `removeToast(id)` directly.
- **Key exports:** `default Toast`
- **Dependencies:** `store` (barrel — `useToastStore`)

### `src/components/StatusStrip.jsx`
- **Purpose:** 28px bottom strip: node counts (Common / Choice / Ending, icons in route colours) and entity counts (Flags, Statuses, Paths, Chapters, neutral icons). During a campaign it adds coverage numbers (nodes visited, endings reached, edges traversed, dead ends). Per-slice selectors.
- **Key exports:** `default StatusStrip`
- **Dependencies:** `store` (`useSimulationStore`, `useNarrativeStore`), `utils` (`detectDeadEnds`), `StatusStrip.css`

### `src/components/index.js`
- **Purpose:** Barrel re-export for components.
- **Key exports:** `GraphCanvas`, `CommonNode`, `ChoiceNode`, `EndingNode`, `WarpEntranceNode`, `WarpExitNode`, `ConditionalEdge`, `TopBar`, `FlagManager`, `StatusManager`, `PathChapterManager`, `SandboxPanel`, `NameModal`, `NodeConfigModal`, `WarpConfigModal`, `SettingsModal`, `ShortcutsDialog`, `ContextMenu`, `Toast`, `CommandPalette`, `StatusStrip`, `LeftSidebar`, `RightSidebar`, `SideRail`, `FloatingMiddleBar`, `ErrorBoundary`. Newer pieces (`BrowsePanel`, `InspectorPanel`, `CollectibleManager`, `CanvasControls`, `ModalPortal`, fields, `LoadProjectDialog`) are imported by path.
- **Dependencies:** files in `components/`

---

## `src/components/layout/`

### `src/components/layout/LeftSidebar.jsx` (NEW)
- **Purpose:** Left sidebar = project data, built on `SideRail`. Panels: Flags (`FlagManager`), Status (`StatusManager`), Collectibles (`CollectibleManager`), Tags, Chapters, Paths (`PathChapterManager`), Types (Common node types + Ending types stacked in one panel). Dimmed and read-only during a campaign.
- **Key exports:** `default LeftSidebar`
- **Dependencies:** `store` (`useSimulationStore`), `SideRail`, `FlagManager`, `StatusManager`, `PathChapterManager`, `CollectibleManager`, `lucide-react`

### `src/components/layout/RightSidebar.jsx` (NEW)
- **Purpose:** Right sidebar = nodes, built on `SideRail`. Panels: Browse (`BrowsePanel`) and Inspect (`InspectorPanel`); with `featureCampaign` on also Routes (`RouteTracingPanel`), Campaigns (`CampaignListPanel`) and Sandbox (`SandboxPanel`). Listens for `switch-right-panel` (`detail` = panel ID) so the canvas can open the Inspector. Dimmed during a campaign.
- **Key exports:** `default RightSidebar`
- **Dependencies:** `store` (`useSimulationStore`, `useUIStore`), `SideRail`, the panels above

---

## `src/components/panels/`

### `src/components/panels/RouteTracingPanel.jsx` (NEW)
- **Purpose:** Right-sidebar panel replacing `RouteFinderDialog`. Two-state UI: config view (target node picker, tie-breaking priority groups split into Flags and Status, route limit controls, Search Depth Limit selector, Run Trace button) and results view (status dot, Stop Trace / Cancel button, scrollable route list). Results read `shortestRouteResults` from `simulationStore` (store-driven, not local state). **Route limit:** a numeric input controls how many routes to fetch (default 50, no internal ceiling); a `searchAll` checkbox overrides the input to use `Number.MAX_SAFE_INTEGER` (uncapped BFS) and shows a warning; a Cancel button (visible while the BFS is running) sets `cancelledRef.current = true` to abort the deferred computation before it writes results. **Search Depth Limit:** a numeric input setting the maximum BFS path-searching depth, default unlimited (`-1`). **Merge display:** `findMergeGroups` is called via `useMemo` on the results array; one card is rendered per group instead of per route; merged cards show a "Via: A or B" option pill listing diverging choice labels. Selecting a merged card highlights the canonical (first) path via `setMergedGroupEdgeIds`. **Save to Campaign:** each route card has a bookmark icon button; clicking opens a modal with a campaign name input and, for merged groups, a multi-axis node navigator (one axis per convergent choice node, navigated with prev/next arrows) where radio buttons select which option to record; each axis card has a Locate button dispatching `canvas-focus-node` to pan the canvas to that choice node; confirming calls `buildRouteSnapshot` → `addCampaign(name)` → `updateCampaign(id, { snapshot })`. Clicking a route calls `setSelectedRouteIndex` and dispatches `canvas-navigate-to-node` (AR-19, AR-22). Target node card shows node label, type badge, content description, and chapter/path context. **Freeze waypoint:** a "Freeze at" action stores the waypoint node and its flag state snapshot; the prefix edge IDs are written to `uiStore.frozenWaypointEdgeIds` so `ConditionalEdge` renders them with the green dashed frozen overlay. Clearing the freeze or stopping the trace calls `setFrozenWaypointEdgeIds([])`. **Re-route:** calls `computeRoutesFromStart` starting at the waypoint node then clears `waypoints` and `preWaypointResults` so stale impossible-route indicators do not persist on newly computed results.
- **Key exports:** `default RouteTracingPanel`
- **Dependencies:** `store` (barrel — `useSimulationStore`, `useNarrativeStore`, `useUIStore`), `utils` (barrel — `findMergeGroups`, `buildRouteSnapshot`, `simulateFlagStateAlongPath`)

### `src/components/panels/CampaignListPanel.jsx` (NEW)
- **Purpose:** Right-sidebar panel replacing `CampaignSelector`. Lists campaigns with icon-only action buttons (Enter via Play icon, Edit via Pencil, Delete via Trash). Create-new form included. Enter calls `setActiveCampaign` + `enterCampaign`. Includes a **Clear All Seen** button (visible only when `editorSeenNodeIds.length + editorSeenOptionIds.length > 0` and no campaign is active) that calls `narrativeStore.clearAllSeen()` to reset all persistent editor-level seen marks. Uses `campaign-panel__*` CSS classes from `RightPanels.css`.
- **Key exports:** `default CampaignListPanel`
- **Dependencies:** `store` (barrel — `useCampaignStore`, `useSimulationStore`, `useNarrativeStore`)

### `src/components/panels/RightPanels.css` (NEW)
- **Purpose:** Styles for `RouteTracingPanel` (`.trace-panel__*`, `.trace-results__*`) and `CampaignListPanel` (`.campaign-panel__*`), plus edge clause pills. The old Nodes / Filters panel rules were removed in Redesign Step 8; the rest is kept because those features are only hidden (AR-36).
- **Key exports:** None (stylesheet).

---

## `src/components/floating/`

### `src/components/floating/FloatingMiddleBar.jsx` (NEW)
- **Purpose:** Centered overlay anchored inside `.app__canvas`. Returns `null` (hidden) in **authoring mode** (`isCampaignActive === false`), as all node creation buttons and campaign starter controls are hosted in `TopBar`. Displays exclusively in **campaign mode** (`isCampaignActive === true`): blinking emerald pulse pill showing campaign name + Follow toggle (sets `followActiveNode` in `uiStore`) + Overlay toggle + Undo + Reset + Exit + **Save Seen** button + Save/Load/Autosave controls. **Save Seen** (`handleSaveSeen`): collects `seenNodeIds` + `activeNodeId` (current node not yet in the set), derives `nodeId::optionId` option keys from `traversedEdgeIds` × `edges`, and calls `narrativeStore.applySeenFromCampaign` to union-merge them into the persistent editor marks. A brief flash state confirms the action.
- **Key exports:** `default FloatingMiddleBar`
- **Dependencies:** `store` (barrel — `useNarrativeStore`, `useSimulationStore`, `useCampaignStore`, `useUIStore`)

---

## `src/components/modals/`

### `src/components/modals/NodeConfigModal.jsx` (NEW)
- **Purpose:** Full editor for Common, Choice, Ending and Hub nodes — the modal half of hybrid editing (AR-25). Rendered through `ModalPortal`, focus trap, Enter saves when the label is not empty, Esc cancels (a pending new node is deleted and its undo step dropped). Edits apply live; Save closes. **Common / Choice (two columns):** left — Label, Chapter, Path, Common type, Text, "Collectibles granted here" (Common only, `ChipsField` + `toggleNodeCollectible`), Start node; right — On enter (set flags to true, change statuses) and, for Choice, Options (collapsible cards: option text, Requires condition builder, flags / status changes when chosen, delete). **Ending:** single column. **Hub:** compact (label + on-enter changes). A slide-out Tags panel assigns `data.tagIds`. Seen toggles only with `featureCampaign` and no running campaign. Sentence-case copy (Redesign Step 8). Narrative Variants were removed in schema v5.
- **Key exports:** `default NodeConfigModal`
- **Dependencies:** `store` (`useNarrativeStore`, `useSimulationStore`, `useUIStore`), `hooks/useFocusTrap`, `ModalPortal`, `utils` (`isConfirmEnter`), `fields/ChipsField`, `NodeConfigModal.css`

### `src/components/modals/WarpConfigModal.jsx` (NEW)
- **Purpose:** Editor for warp entrances and exits: Label, Text, "Connected warp" (searchable picker that shares or creates the portal channel), optional channel name, Delete warp. `ModalPortal`, focus trap, Enter saves when the label is not empty, Esc cancels.
- **Key exports:** `default WarpConfigModal`
- **Dependencies:** `store` (`useNarrativeStore`), `hooks/useFocusTrap`, `ModalPortal`, `utils` (`isConfirmEnter`), `NodeConfigModal.css`, `EdgeConfigModal.css`

### `src/components/modals/EdgeConfigModal.jsx` (NEW)
- **Purpose:** Edge editor: From → To, source option, Label (text shown on the edge), Condition builder (AND / OR, flag and status clauses), Delete edge. Opened from double-click, the context menu or the Inspector's "Edit condition". `ModalPortal`, focus trap, Enter saves, Esc closes; each opening is one undo step.
- **Key exports:** `default EdgeConfigModal`
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`), `hooks/useFocusTrap`, `ModalPortal`, `utils` (`isConfirmEnter`), `EdgeConfigModal.css`

---

### `src/components/modals/SettingsModal.jsx` (NEW — Redesign Step 1; rebuilt Step 3)
- **Purpose:** Settings dialog, opened from the TopBar gear (`uiStore.showSettings`), mounted in `App.jsx`, rendered through `ModalPortal`. Settings apply live; Esc, the close button or the backdrop close it. Sections: **Canvas** (Snap to grid, Align to nearby nodes + alignment distance 2–32px, Dot brightness slider), **Display** (Choice options Short / Full, Flags and statuses on nodes Counts / Names), **Search** (Include edge conditions), **Features** (Campaign and Route Tracing; disabled while a campaign runs). Footer button opens the keyboard shortcut sheet. Internal `SwitchSetting` (`role="switch"`) and `ChoiceSetting` (`role="radiogroup"`).
- **Key exports:** `default SettingsModal`
- **Dependencies:** `store` (barrel — `useUIStore`, `useSimulationStore`), `hooks/useFocusTrap`, `styles/system.css` primitives (`.br-dialog`, `.br-section`, `.br-setting`, `.br-switch`, `.br-segmented`, `.br-range`, `.br-kbd`). `SettingsModal.css` was deleted in Step 3. Copy rewritten in plain language (e.g. "Align to nearby nodes", "Counts / Names").

---

### `src/components/layout/SideRail.jsx` + `SideRail.css` (NEW — Redesign Step 4)
- **Purpose:** Shared sidebar shell used by `LeftSidebar` and `RightSidebar`: a 68px icon+label rail (`aria-pressed` tabs) and a 300px docked panel with a `.br-panel-header` (title + close). Props: `side`, `label`, `items[{ id, label, title?, icon, render }]`, `activeId`, `onChange`, `dimmed` (campaign mode). Panels show/hide instantly, never via CSS transform (AR-29). `.br-siderail__stack` stacks several titled sections in one panel. Replaces `NameplateTab` (deleted together with `LeftSidebar.css`, `RightSidebar.css`, `NameplateTab.css`).
- **Key exports:** `default SideRail`

### `src/components/CollectibleManager.jsx` + `CollectibleManager.css` (NEW — Redesign Step 4)
- **Purpose:** Left "Collectibles" panel. Search, New category, New collectible. Groups collectibles by category (plus "No category"). Clicking a category name (a button with a chevron, `aria-expanded`) collapses or expands its collectibles; the state is session-only, and while a search is active every group stays open so matches are visible. Each category has a count badge and row actions (add in category / rename / delete). Each collectible shows "N nodes" (expands to route-marked rows that dispatch `canvas-focus-node`) or "Not placed". Drag to reorder within a category (`reorderDictionaryKeys('collectible', …)`) or onto another category (`updateCollectible({ categoryId })`); drag is disabled while searching or during a campaign. Deletes go through `ConfirmModal`, which explains the cascade, then call the store with `force`. The empty state invites creating a first category.
- **Dependencies:** `store` (`useNarrativeStore`, `useSimulationStore`), `@hello-pangea/dnd`, `CollectibleDialog`, `ConfirmModal`, `EntityList.css`

### `src/components/CollectibleDialog.jsx` (NEW — Redesign Step 4)
- **Purpose:** Create/rename dialog for collectibles (name + category select) and categories (name). When creating a collectible it has a "Sequential mode" switch (not shown for categories or when editing): Start at / Ends at / Padding use the same `uiStore` values as sequential flags (`seqStart`, `seqEnd`, `seqPad`, persisted, shared with `NameModal`), names are `<name> <number>` with a space ("CG 01"), a chip preview lists them, the range is capped at 200, and the batch is created inside one undo group (`beginGroup`/`endGroup`, AR-39). Built on `.br-dialog` primitives, rendered through `ModalPortal`, uses `useFocusTrap`; Enter confirms (`isConfirmEnter`), Esc cancels; store errors surface as toasts.

### `src/components/ModalPortal.jsx` (NEW — Redesign Step 4)
- **Purpose:** `createPortal(children, document.body)`. Every dialog (`NameModal`, `ConfirmModal`, `NodeConfigModal`, `EdgeConfigModal`, `WarpConfigModal`, `SettingsModal`, `CollectibleDialog`) renders through it, so dialogs are never trapped in a sidebar stacking context (AR-38). The config modals keep their original component as `<Name>Inner` and export a thin wrapper.

### `src/components/CanvasControls.jsx` + `CanvasControls.css` (NEW — Redesign Step 4)
- **Purpose:** Floating canvas toolbar replacing React Flow's default `<Controls/>`: zoom out, zoom % (click resets to 100%), zoom in, fit all, zoom to selection (disabled without a selection), go to start node (disabled without one), centre on (0,0) (moved from TopBar), minimap toggle (`uiStore.showMiniMap`). Rendered inside `ReactFlowProvider` (AR-19). Also skins the MiniMap (`.br-minimap`).

### `src/utils/dialogKeys.js`, `src/utils/nodeColors.js` (NEW — Redesign Step 4)
- **dialogKeys:** `isConfirmEnter(e)` returns true for plain Enter outside textarea/select/button/link/combobox and not during IME composition.
- **nodeColors:** `ROUTE_MARK_COLORS` and `miniMapNodeColor(node)` for JS-painted canvas elements (mirrors `--br-route-*-mark`).
- Tests: `src/utils/redesignStep4.test.js`.

### `src/store/historyStore.js` (NEW — Redesign Step 5)
- **Purpose:** Undo/redo for the authored graph. `initHistory()` (called in `main.jsx` after the autosave restore, AR-17) subscribes to `narrativeStore`; each change to a tracked slice (`common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`, `tag`, `commonType`, `endingType`, `collectibleCategory`, `collectible`, plus `meta.title`) pushes the previous snapshot (slice references — cheap, the store is immutable). Changes within `BURST_MS` (600ms) form one step; `beginGroup()`/`endGroup()` make a whole session one step; `cancelGroup()` drops the group's step entirely. Seen marks and `meta.updatedAt` are not tracked. A change of `narrativeStore.graphRevision` (bumped by `loadGraph`/`newGraph`) resets history. `undo()`/`redo()` are inert during a campaign (AR-08) and clear the selection. Capped at `HISTORY_LIMIT` (100). `useHistoryStore` exposes `canUndo`/`canRedo` for the TopBar.
- **Key exports:** `useHistoryStore`, `initHistory`, `resetHistory`, `undo`, `redo`, `beginGroup`, `endGroup`, `cancelGroup`, `HISTORY_LIMIT`, `BURST_MS`, `TRACKED_SLICES` (re-exported from the `store` barrel).
- **Dependencies:** `narrativeStore`, `simulationStore`, `uiStore` (no store imports `historyStore`, so there is no cycle — AR-06).
- Tests: `src/store/historyStore.test.js` (7).

### `src/utils/alignNodes.js` (NEW — Redesign Step 5)
- **Purpose:** `computeAlignment(items, mode)` — pure align/distribute math. Modes: `left`, `centerX`, `right`, `top`, `middleY`, `bottom`, `distributeX`, `distributeY` (distribute needs ≥ 3 nodes and keeps the outer nodes in place with equal gaps). Returns only the nodes that move. Tests: `src/utils/alignNodes.test.js`.

### `src/components/modals/LoadProjectDialog.jsx` (NEW — 2026-11-05)
- **Purpose:** Dialog behind File → Load project. Props `files` (`[{ name, size, modified }]` from `listSavedProjects`), `onPick(name)`, `onBrowse()`, `onClose()`. Rows use `.br-row`; empty state "No saved projects yet"; footer has "Browse other file…" and Cancel; Esc closes (capture phase). Built on primitives (AR-37), `ModalPortal`, `useFocusTrap` (AR-35, AR-38).

### `src/components/modals/ShortcutsDialog.jsx` (NEW — Redesign Step 5)
- **Purpose:** Keyboard shortcut sheet in three columns (Edit / Add / View). Opened with `?` or from Settings ("Keyboard shortcuts"); `uiStore.showShortcuts`. Primitives (AR-37), `ModalPortal`, focus trap; Esc, Enter or `?` close it.

### `src/components/panels/BrowsePanel.jsx` + `BrowsePanel.css` (NEW — Redesign Step 6)
- **Purpose:** Right-sidebar "Browse" panel, the single place to find nodes. Replaces `NodesPanel` and `FiltersPanel` (both deleted). Search field ("Search nodes, flags, items…", Esc clears) runs `searchGraph` over node labels, collectibles, flags/statuses set on enter, Choice options (label, effects, requirements) and, when `uiStore.searchIncludeEdges` is on, edge conditions listed under their source node. A filter toggle (badge = active filter count) reveals: Type chips (All / Common / Choice / Ending / Hub / Warp, with route dots), Chapter, Path, "Grants a collectible from" (category) and Tags (Any/All when 2+ selected). Filters are the uiStore canvas filters, so they also dim the canvas; "Clear filters" calls `resetCanvasFilters`. Results are grouped in type sections with route stripes, chapter name, and hover actions Edit (opens the modal) and Delete (one undo step); match reasons are listed under each node. Click = focus + select on canvas (`canvas-focus-node`, `canvas-select-nodes`), double-click = edit. Drag-reorder (`reorderDictionaryKeys`) works for Common/Choice/Ending sections when there is no search, no filter and no campaign. Empty states explain how to add nodes or why nothing matched.
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useSimulationStore`, `beginGroup`, `endGroup`), `utils` (`searchGraph`, `nodeMatchesFilters`, `countActiveFilters`, `ROUTE_TYPE_LABELS`), `@hello-pangea/dnd`

### `src/utils/searchIndex.js` (NEW — Redesign Step 6)
- **Purpose:** Pure search + filter helpers. `searchGraph(query, graph, { includeEdges })` → one result per node `{ nodeId, collection, routeType, label, matches[{ kind, text, targetId? }] }` (empty query → every node, no matches). `describeCondition` / `describeClause` write conditions in plain words ("affection ≥ 5", "affection 2–8", "has_key is true", nested groups in brackets). `nodeMatchesFilters(node, routeType, filters, collectibleDict)` is the single filter predicate used by both `GraphCanvas` (dimming) and `BrowsePanel` (list). Also `nodeRouteType`, `listNodes`, `countActiveFilters`, `ROUTE_TYPE_LABELS`. Tests: `src/utils/searchIndex.test.js` (9).

### `src/components/panels/InspectorPanel.jsx` + `InspectorPanel.css` (NEW — Redesign Step 7)
- **Purpose:** Right-sidebar "Inspect" tab — the docked half of hybrid editing (AR-25). Clicking a node or edge on the canvas opens it (`switch-right-panel` → `Inspector`). Views: **nothing selected** (hint); **node** — type line with route dot (+ subtype, Start chip), Label, Content, Chapter, Path, Common/Ending type, Tags (`ChipsField`), Collectibles granted here (Common only, grouped by category, `toggleNodeCollectible`), Flags set on enter (`ChipsField`) and Statuses on enter (`StatusEffectsField`) for Common/Choice/Hub, a read-only Choice option list with plain-language requirements, warp portal channel; actions "Open full editor" and "Make start node"; **edge** — from → to, source option, Label, plain-language condition, "Edit condition" (opens `EdgeConfigModal`), Delete; **several nodes** — align/distribute buttons, bulk Set chapter / Set path / Add a tag (one undo step each), Duplicate, Delete. Read-only during campaigns.
- **Dependencies:** `store` (`useNarrativeStore`, `useUIStore`, `useSimulationStore`, `beginGroup`, `endGroup`), `utils` (`nodeRouteType`, `describeCondition`, `ROUTE_TYPE_LABELS`), `hooks/useKeyboardShortcuts` (`duplicateSelection`), `fields/ChipsField`, `fields/StatusEffectsField`

### `src/components/fields/ChipsField.jsx`, `StatusEffectsField.jsx`, `fields.css` (NEW — Redesign Step 7)
- **ChipsField:** multi-pick of entities — selected items as removable chips, the rest in an "Add…" select (with `<optgroup>` when options have a `group`). Used for tags, flags and collectibles in the Inspector and for collectibles in `NodeConfigModal`.
- **StatusEffectsField:** edits `[{ statusId, amount, mode: 'add' | 'set' }]` with a status select, ± / = segmented control, number field and remove button.
- Both are presentational; callers write through store actions.

## Changelog

## [2026-11-06] — Empty Min/Max for new status conditions

### Changed
- A new status clause starts with Min and Max empty (was Min = 0), in both `EdgeConfigModal` (edge condition) and `NodeConfigModal` (Choice option "Requires"). Until a number is entered the clause matches any value of that status (unchanged evaluator behaviour), shown as `name (any value)`.

### Migration
- no — only affects newly added clauses.

## [2026-11-06] — One wording for status conditions

### Added
- `searchIndex.formatStatusClause(name, clause)` (re-exported from `utils`): `affection = 5` when Min = Max, `1 ≤ affection ≤ 10` for a range (both ends included), `affection ≥ 5` / `affection ≤ 5` for one open end, `affection (any value)` for none. Tests in `searchIndex.test.js`.

### Changed
- Edge condition pills (`ConditionalEdge`, verbose labels), Choice option requirement chips (`VerboseEffects.StatusConditionChip`) and Browse/Inspector text (`describeClause`) all use it. Before, they showed ranges three ways: `[1…10]`, `1..10` and `1–10`, and the edge and chip showed `[5…5]` / `5..5` for an exact value.

### Migration
- no — display only.

## [2026-11-06] — Canvas dot brightness setting

### Added
- Settings → Canvas → "Dot brightness" slider, shown as a number 0–10: **0 = no dots**, 1 = the original dim dots (`#2a3040`), 10 = very bright (`#cdd5e8`), evenly spaced; default 3 (about the previous colour). `uiStore.canvasDotLevel` (default 3, persisted as `br_canvasDotBrightness` via safeStorage; a new key because an earlier build used a 0–8 scale) + `setCanvasDotLevel`. `utils/nodeColors.js`: `CANVAS_DOT_LEVEL_DEFAULT`, `CANVAS_DOT_LEVEL_MAX`, `clampCanvasDotLevel`, `canvasDotColor` (null for level 0), re-exported from the `utils` barrel. Tests in `redesignStep4.test.js` (3).

### Changed
- `GraphCanvas` renders `<Background>` only when the level is above 0 and passes `canvasDotColor(level)` as its colour. The `--color-canvas-dot` token in `tokens.css` is unused (React Flow needs a JS colour).
- `system.css` `.br-range`: explicit track and thumb (webkit + moz) so the thumb reaches both ends of the track; the native control left a gap. Applies to every range input (also the alignment distance slider).

### Migration
- no — a UI preference in localStorage only. `schemaVersion` remains 5.

## [2026-11-05] — Collectibles polish

### Changed
- `CollectibleManager`: clicking a category name collapses / expands its collectibles (chevron + `aria-expanded`; session-only; open while searching).
- `CollectibleDialog`: "Sequential mode" for new collectibles (see its section). Reuses the flag batch settings in `uiStore`.
- `NodeConfigModal`: for Common nodes the collectibles picker moved from the left column to the right column, inside the "On enter" box after flags and statuses (order top to bottom: Flags, Status, Collectibles). The label is now "Collectibles granted". It uses the same searchable "Add collectible…" dropdown as flags (the modal's `FlagDropdown` made reusable with `triggerLabel` / `searchLabel` / `emptyLabel` props and an optional per-option `hint`, here the category name) with removable chips below it; already-granted items are hidden from the list. The Hub modal is unchanged. `ChipsField` is still used by the Inspector.

### Migration
- no — UI only. `schemaVersion` remains 5.

## [2026-11-05] — Docs sweep

### Changed
- Per-file reference rewritten to match the current code after the redesign and Save/Load: `main.jsx`, `App.jsx/.css`, `tokens.css`, `global.css`, `buttons.css`, `narrativeStore`, `uiStore`, `store/index.js`, `fileSystem.js`, `utils/index.js`, `useFocusTrap`, `useKeyboardShortcuts`, `TopBar`, `GraphCanvas`, `ConfirmModal`, `ContextMenu`, `NameModal`, `PathChapterManager`, `EntityList.css`, node renderers, `CommandPalette`, `StatusStrip`, components barrel, `LeftSidebar`, `RightSidebar`, `RightPanels.css`, `NodeConfigModal`, `WarpConfigModal`, `EdgeConfigModal`, `SettingsModal`; `vite.config.js` / `start-app.bat` entries untangled. `project_overview.md` tree updated to match.

### Removed
- Sections for deleted files: `NameplateTab`, `NodesPanel`, `FiltersPanel`, `utilities.css`.

## [2026-11-05] — Save / Load, launcher, saves folder

### Added
- `Ctrl+S`: saves the project as `saves/<project title>.json` (overwrites the same name). Projects with campaigns are saved as `.zip`, as Export did.
- `vite.config.js` `savesPlugin` (dev-only `/__saves` endpoint), `saveProject` / `listSavedProjects` / `loadSavedProject` in `utils/fileSystem.js`, `components/modals/LoadProjectDialog.jsx`.
- `start-app.bat`: one-click launcher.
- Shortcut sheet row "Save project".

### Changed
- File menu: "Export project…" → "Save project" (Ctrl S), "Open project…" → "Load project…" (now opens the `saves/` list). Toasts read "Saved …" / "Loaded …". The New-project confirmation says "Save it first".
- `fileSystem.js`: `exportProject` now returns the saved name (or `null` if cancelled) and is the fallback of `saveProject`; file parsing moved to `parseProjectFile`. `importProject()` behaves as before.
- AR-10 gets one documented exception (the same-origin `/__saves` calls).
- `.gitignore`: `save` → `saves`.

### Removed
- The old `save/` folder and its sample project, and all references to it in the handoff notes.

### Migration
- no — `schemaVersion` remains 5. Saved files are the same format Export produced.

### Also (2026-11-05)
- Toasts moved from the viewport corner (over the top bar) to the top-right corner of the canvas area: `<Toast />` is mounted inside `.app__canvas` in `App.jsx` and `.toast-container` is `position: absolute` (`global.css`). Applies to every toast.

## [2026-11-04] — Redesign Step 8: Polish pass

### Changed
- `tokens.css`: legacy surface, text, border, primary and canvas tokens now hold the design-system values (night / graphite / slate / chalk), so every legacy stylesheet matches the new look. `--color-primary` is chalk; rules that fill with it now use dark text (`--br-text-on-chalk`). The font stack no longer names Inter.
- All `text-transform: uppercase` (and its letter-spacing) removed from legacy stylesheets; node type labels (`Common`, `Choice`, `Ending`, `Warp entrance`, `Warp exit`, subtype names) and the modal type badge use sentence case. Choice node badge reads "N out".
- Editor dialogs, context menu and command palette copy in plain sentence case (e.g. "Edit node", "On enter", "Set flags to true", "Change statuses", "Make start node", "Condition", "Text shown on the edge", "Edit warp").
- `global.css`: context menu, command palette, toasts and the naming dialog aligned with `.br-menu` / `.br-dialog` geometry, density and focus. Edges are quieter (`--br-edge`, 1.75px; arrowheads use `EDGE_COLOR`); selected edges stay chalk.
- `StatusStrip.css`: neutral entity icons; node-count icons use route colours; no overlay z-index inside the layout grid.
- `system.css`: thin, dark scrollbars app-wide; new token `--br-edge`. `utils/nodeColors` exports `EDGE_COLOR`.

### Fixed
- Esc did not close the canvas context menu (documented, never implemented).

### Removed
- About 830 lines of CSS whose selectors no component uses (deleted Nodes/Filters panels, old authoring floating bar, old TopBar snap controls, unused button and token utilities), removed with a parser-based pass. Campaign, edge and route-tracing rules were kept even where currently unused, because those features are only hidden (AR-36).
- `src/styles/utilities.css` (all `ui-v2-*` primitives unused) and its import.

### Migration
- no — styling and copy only. `schemaVersion` remains 5.

## [2026-11-04] — Redesign Step 7: Inspector (hybrid editing) + collectible badge

### Added
- `InspectorPanel`, `fields/ChipsField`, `fields/StatusEffectsField` (see sections above); right-sidebar "Inspect" tab.
- `CommonNode`: collectible badge (gem + count, names on hover) in the type bar; in verbose label mode the names are listed as small chips in the body.
- `NodeConfigModal`: "Collectibles granted here" picker for Common nodes (left column, above the start-node section).

### Changed
- `GraphCanvas`: clicking a node or edge opens the Inspector (`switch-right-panel`). Browse clicks do not switch panels.
- AR-25 rewritten for hybrid editing.

### Migration
- no — `schemaVersion` remains 5 (collectibleIds already existed since Step 2).

## [2026-11-04] — Redesign Step 6: Browse panel (unified search + filters)

### Added
- `BrowsePanel`, `utils/searchIndex` (see sections above).
- `uiStore.canvasFilterNodeType`, `uiStore.canvasFilterCollectibleCategoryId`, `setCanvasFilterNodeType`, `setCanvasFilterCollectibleCategoryId`, `resetCanvasFilters`.

### Changed
- Right sidebar: the Nodes and Filters tabs are replaced by one "Browse" tab.
- `GraphCanvas`: canvas dimming uses `nodeMatchesFilters` (adds node type and collectible-category filters).

### Fixed
- The old Nodes panel type filter compared `commonTypeId`/`endingTypeId`, but nodes store `nodeSubTypeId`, so it never matched. (The panel is gone; subtype filtering was not carried over.)

### Removed
- `src/components/panels/NodesPanel.jsx`, `src/components/panels/FiltersPanel.jsx` (their CSS in `RightPanels.css` is cleaned up in Step 8).

### Migration
- no — UI and session state only. `schemaVersion` remains 5.

## [2026-11-04] — Redesign Step 5: Graph-editor basics

### Added
- Undo / redo (`historyStore`): Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, TopBar buttons. One step per typing burst, drag, nudge series, editing-modal session, multi-delete, duplicate or align. Cancelling a new node leaves no step. Resets on New/Open project.
- Shortcuts: Ctrl+A select all, Ctrl+D duplicate (selects the copies), arrow keys move the selection (16px with snap-to-grid, 4px without; Shift ×5), Ctrl+= / Ctrl+− / Ctrl+0 zoom, Shift+1 fit all, Shift+2 fit selection, `?` shortcut sheet.
- Right-click on a multi-selection: align left/centres/right/top/middles/bottom, distribute horizontally/vertically, duplicate, delete. Right-click on a node: Duplicate.
- `ShortcutsDialog`, `utils/alignNodes`, `uiStore.showShortcuts`, `narrativeStore.graphRevision` (not persisted).
- GraphCanvas events: `canvas-view` (`detail.action`: zoom-in, zoom-out, zoom-reset, fit, fit-selection), `canvas-select-nodes` (`detail.ids` or `null` for all), `canvas-align` (`detail.mode`).

### Changed
- `narrativeStore.pasteNode` now returns the new node ID (additive, AR-20).
- `GraphCanvas`: node creation (`beginGroup` before `addNode`, `endGroup` on save, `cancelGroup` on cancel) and node/edge editing sessions are undo groups; nodes new to the canvas take their selection from `uiStore` (so a duplicate stays selected).
- `useKeyboardShortcuts`: exports `duplicateSelection` and `nudgeSelection`; arrow keys are handled in the capture phase so React Flow's own focused-node arrow move (which never reached the store) no longer runs.
- Settings dialog has a "Keyboard shortcuts" footer button.

### Removed
- `utils/autoLayout.js` and the `dagre` dependency. `L` stays "fit the whole story" (decision 2026-11-04).

### Migration
- no — `schemaVersion` remains 5. `graphRevision` is runtime-only and never exported.

## [2026-11-04] — Redesign Step 4: Layout shell + modal fixes

### Added
- `SideRail`, `CollectibleManager`, `CollectibleDialog`, `ModalPortal`, `CanvasControls`, `utils/dialogKeys`, `utils/nodeColors` (see sections above). (`utils/autoLayout` was added here and removed in Step 5.)
- `uiStore.showMiniMap` (persisted as `br_showMiniMap`, default on) + `toggleMiniMap`.
- Left panel "Collectibles"; a "Types" panel stacking Common node types and Ending types.
- AR-38 (dialogs render through ModalPortal and confirm on Enter).

### Changed
- `TopBar`: rebuilt on primitives. Brand + title | labelled "Add node" group with route dots (labels collapse below 1180px) | campaign selector + Start (switch on), File menu (New project / Open project… / Export project…), Settings. Import/export feedback uses toasts instead of `alert()`. Center (0,0) moved to the canvas controls.
- `LeftSidebar` / `RightSidebar`: built on `SideRail`. The right side keeps Nodes + Filters until Steps 6–7; campaign tabs (Routes, Campaigns, Sandbox) only appear with the switch on.
- `App.css`: layout regions use z-index 1–3; overlay z-indices are reserved for portalled dialogs.
- `EntityList.css`: moved onto `--br-*` tokens (flat rows, neutral entity icons, secondary add button). Markup unchanged.
- `ConfirmModal`: primitives + portal; Enter confirms and Esc cancels (Esc was not handled before); `ConfirmModal.css` removed.
- `NameModal`: portal; flag/status names convert spaces to `_` (a "Saved as …" hint shows the result; batch names too); invalid names show an error toast instead of throwing.
- `NodeConfigModal`, `EdgeConfigModal`, `WarpConfigModal`: portal; Enter saves (Node/Warp only when the label is not empty, matching the Save button).
- `GraphCanvas`: per-slice selectors instead of whole-store destructures (AR-23); `<CanvasControls/>` and a skinned, toggleable `<MiniMap/>` replace the defaults.
- `NodesPanel`: removed its duplicate inner "Nodes" title.

### Fixed
- Dialogs opened from sidebar panels rendered inside the sidebar (sidebars z-index 300 above modals at 200).
- Pressing Enter in `NameModal` created the entity and immediately re-opened a new empty dialog (focus returned to the + button and the browser's follow-up keypress clicked it).

### Removed
- `NameplateTab.jsx/.css`, `LeftSidebar.css`, `RightSidebar.css`, `ConfirmModal.css`, the unused Dagre handler in `TopBar`.

### Known
- The `L` shortcut only fits the view. Decided in Step 5: it stays that way and Dagre auto-layout was removed.

### Migration
- no — UI only. `schemaVersion` remains 5.

## [2026-11-04] — Redesign Step 3: Design foundation

### Added
- `src/styles/system.css`: `--br-*` tokens and `.br-*` primitives ("Night route map" system); imported from `global.css`.
- `src/components/dev/DesignSystemPreview.jsx`: dev-only reference sheet at `/#design`.
- AR-37 (design-system usage rule).

### Changed
- `SettingsModal.jsx` rebuilt on the primitives; plain-language copy; setting names regular weight under semibold section titles.
- `main.jsx`: dev-only `#design` branch (lazy import, excluded from production).

### Removed
- `src/components/modals/SettingsModal.css` (superseded by primitives).

### Migration
- no — styling only. Legacy tokens (`tokens.css`) unchanged; other surfaces migrate in Steps 4–8.

## [2026-11-04] — Redesign Step 2: Data model v5 (Variants removed, Collectibles added)

### Added
- `narrativeStore`: `collectibleCategory{}` and `collectible{}` dictionaries; actions `addCollectibleCategory`, `updateCollectibleCategory`, `deleteCollectibleCategory`, `addCollectible`, `updateCollectible`, `deleteCollectible`, `toggleNodeCollectible`; included in `loadGraph` / `newGraph` / `exportGraph`.
- `fileSystem.migrateGraph()` + `CURRENT_SCHEMA_VERSION` (re-exported from the `utils` barrel).
- Tests: `src/utils/migrateGraph.test.js`, `src/store/narrativeStore.collectibles.test.js` (26 tests total).

### Changed
- Schema bumped to **v5**. Import guard accepts v1–v5.
- `main.jsx`: boot autosave restore now runs through `migrateGraph` (previously bypassed migration/sanitization).
- `NodesPanel`: Common node stats show "Collectibles" count instead of "Variants".

### Fixed
- Import sanitizer dropped `createdAt`, losing node z-order after import.

### Removed
- Narrative Variants: `addVariant` / `updateVariant` / `deleteVariant`, variant branches in `deleteFlag` / `deleteStatus` / `pasteNode`, `FlagManager.isFlagUsed` variant scan, `VariantCard` and the "Narrative Variants" section of `NodeConfigModal` (the Common node right column now holds only On-Enter Modifiers).

### Migration
- yes — v4→v5 strips `data.variants` from every node and adds empty collectible dictionaries. Verified by round-tripping the real project (51 nodes, 103 edges): no field differences apart from the variant removal; only `meta.createdAt/updatedAt` formatting changes on re-export (pre-existing behaviour).

## [2026-11-04] — Redesign Step 1: Feature switch + Settings modal

### Added
- `uiStore.featureCampaign` (default `false`, persisted as `br_featureCampaign` via safeStorage) + `setFeatureCampaign`. When off, the Campaign & Route Tracing feature set is hidden from the UI; stores, actions and persisted data are untouched.
- `uiStore.searchIncludeEdges` (default `true`, persisted as `br_searchIncludeEdges`) + `setSearchIncludeEdges` — consumed by the unified search in a later step.
- `uiStore.showSettings` (session-only) + `setShowSettings`.
- `SettingsModal.jsx` + `SettingsModal.css` [NEW]; barrel export in `components/index.js`; mounted in `App.jsx`.
- TopBar Settings (gear) button, available in every mode.

### Changed
- `TopBar.jsx`: campaign selector + Start are rendered only when `featureCampaign` is on. Snap Assist toggle and threshold slider **removed from TopBar** (now in SettingsModal); unused snap selectors dropped.
- `RightSidebar.jsx`: Route Tracing, Campaign List and Sandbox tabs (and their panel mounts) exist only when `featureCampaign` is on.
- `CommonNode`, `ChoiceNode`, `EndingNode`, `HubNode`, `WarpEntranceNode`, `WarpExitNode`: editor-level Seen styling (`story-node--seen` outside campaigns, and Choice option green "seen" text) requires `featureCampaign`. Campaign-time seen styling is unchanged.
- `NodeConfigModal.jsx`: node and option Seen toggles require `featureCampaign`.
- `useKeyboardShortcuts.js`: `M` (toggle seen) is inert when `featureCampaign` is off.
- "Clear All Seen" lives in `CampaignListPanel`, so it is hidden with that tab.

### Migration
- no — no persisted data shape changes. `schemaVersion` remains `4`. Seen marks stay in the file while hidden.

## [2026-08-25] — Smart Snap Assist

### Added
- `src/utils/snapGuides.js` [NEW]: Pure snap math utilities (`computeSnapGuides`, `getActiveGuides`, `getSnappedPosition`, `applyAxisLock`). Guide cache computed once per drag in `onNodeDragStart` and reused via O(log N) binary search per frame. Hub Nodes excluded from guide rail contribution.
- `uiStore.snapAssist` (session-only boolean, default `true`) and `uiStore.snapThreshold` (persisted to `br_snapThreshold` localStorage key via safeStorage, default `8`, range 2–32).
- `uiStore.toggleSnapAssist()` and `uiStore.setSnapThreshold(val)` actions.
- `GraphCanvas.onNodeDrag`: per-frame handler that reads Ctrl body class (AR-30) and, if held, queries the cached guide rail to update `activeGuides` state only when the active guide changes (prevents unnecessary re-renders).
- `GraphCanvas.SnapGuideOverlay` [new internal component]: reads `useViewport()` to convert flow-coordinate guide positions to screen-pixel positions; renders absolutely-positioned cyan dashed `<div>` lines within `.canvas-wrapper`.
- `TopBar` Snap Assist controls: a `Magnet` icon toggle button (`aria-pressed`) + conditionally visible `<input type="range">` threshold slider + numeric label, all disabled in campaign mode.
- Keyboard shortcut `A` → toggle Snap Assist (alongside `V`, `L`, `R` view shortcuts).
- `ctrl-pressed` and `shift-pressed` CSS body classes (AR-30 pattern) tracked by new keydown/keyup listeners in `useKeyboardShortcuts`. A unified `blur` handler clears all three modifier classes (`alt-pressed`, `ctrl-pressed`, `shift-pressed`) to prevent stuck keys.
- CSS: `.snap-guide`, `.snap-guide--horizontal`, `.snap-guide--vertical` (cyan glow dashed lines), `.br-topbar__snap-assist`, `.br-topbar__file-btn--active`, `.br-topbar__snap-slider`, `.br-topbar__snap-range`, `.br-topbar__snap-value`.

### Modified
- `GraphCanvas.onNodeDragStart`: now caches snap guide rails once per drag into a ref (`dragGuidesCache`) and stores each dragging node's start position into `dragStartPositions` ref for Shift-lock.
- `GraphCanvas.onNodeDragStop`: applies Shift-lock axis constraint (`applyAxisLock`) then snaps to cached guide (`getSnappedPosition`) before calling `updateNode`. Hub Nodes bypass both corrections.

### Behavior summary
| Input | Result |
|---|---|
| Drop a node | Snaps to nearest row/column rail within threshold |
| Hold **Ctrl** while dragging | Cyan dashed guide lines appear showing the active snap rail |
| Hold **Shift** while dragging | On drop, movement is constrained to dominant axis (horizontal or vertical) |
| Press **A** / click 🧲 | Toggles Snap Assist on/off |
| Slider in TopBar | Adjusts snap threshold (2–32px); persisted across sessions |
| Hub Node dragged | No snap, no axis lock; Hub Nodes also never contribute guide rails |
| Campaign mode | All snap behavior inactive |

---

## [2026-05-24] — Warp Portals, Copy & Paste, Viewport Centering & UI Polish

### Added
- `WarpEntranceNode.jsx` & `WarpExitNode.jsx` [NEW]: Special React Flow warp portal nodes styled as flat purple square blocks (`border-radius: 0 !important`).
- `WarpConfigModal.jsx` [NEW]: Dedicated narrow single-column configuration modal for warp nodes allowing title, description, and searchable opposite-portal connections.
- **Copy/Paste Node**: Support copying narrative nodes with `Ctrl+C` / context menu and pasting them at cursor/viewport location with `Ctrl+V` / canvas context menu, resolving options and variants ID collisions.
- **Viewport Follow**: A follow toggle button ("Follow: ON/OFF") in the campaign floating middle toolbar which automatically tracks and centers the canvas on the player's active node coordinates.
- **Search Depth Limit**: Added Search Depth Limit input control in `RouteTracingPanel` (default unlimited `-1`) allowing paths to search up to a specified depth limit.

### Changed
- `GraphCanvas.jsx`: Mapped warp entrance/exit custom React Flow node components, conditionally rendered `WarpConfigModal` for warp nodes, and implemented viewport centering tracking `activeNodeId` reactively.
- `uiStore.js`: Added state variables and actions for `seqStart`, `seqEnd`, `seqPad` (persisted in localStorage), `copiedNode` copy buffer, and `followActiveNode` viewport following toggle.
- `narrativeStore.js`: Added `pasteNode()` to clone and clean nested IDs for variants and options, and registered default naming mappings for warp nodes.
- `simulationStore.js`: Integrated warp entrance/exit teleportation traversal in Campaign mode, reachability BFS portal queue connections in Passive Analysis, and forwarded pathfinder `maxDepth` limit.
- `routeTracer.js`: Pathfinder K-shortest path BFS now treats portal transitions as virtual jumps (without increasing path lengths or edge lists), respects `depthLimit`, and implements a state-aware cycle guard hashing flag/status states to permit loops only when narrative variables change.
- `useKeyboardShortcuts.js`: Configured copy/paste hotkeys (`Ctrl+C`/`Ctrl+V`) and warp portal triggers (`W` for entrance, `Ctrl+W` for exit) with global modifier Guards to prevent character shortcuts clash.
- `ContextMenu.jsx`: Extended context actions for copying, pasting, and creating warp nodes.
- `NameModal.jsx`: Integrated sequential flag properties in `uiStore` state to persist flag config settings.
- `RightSidebar.jsx`: Changed default tab state from Nodes to collapsed (null) to reduce reload clutter.
- `global.css` & sidebar styles: Replaced sidebar transition transforms with margin transitions to resolve drag-and-drop mouse offsets, and added styling for purple square portal nodes.

## [2026-05-16] — Draggable Edge Labels & Choice Requirements
### Added
- `ConditionalEdge.jsx`: Draggable edge labels (persists `labelOffsetX` and `labelOffsetY` in `narrativeStore`). Default `pointerEvents: none` on the label container prevents collision with edge bend handles. Holding `Alt` toggles pointer events on, enabling drag. Double click resets offset to `0`. Labels are locked during campaign mode.
- `useKeyboardShortcuts.js`: Global `Alt` key down/up listeners that toggle the `alt-pressed` class on `document.body`, used to gate CSS interactions (like edge label dragging) without triggering expensive React re-renders.
- `ChoiceNode.jsx`: Options with unmet requirements (via `evaluateCondition`) now display a visual `Lock` pill icon.
### Changed
- `ChoiceNode.jsx`: During Campaign Mode, options with unmet requirements are visually dimmed (`choice-node__option--dimmed`) and block click events, preventing traversal.
- `GraphCanvas.jsx`: Edge mapping now passes `labelOffsetX` and `labelOffsetY` from store to React Flow edge `data`.
- `global.css`: `.alt-pressed` class applied to `document.body` toggles pointer-events on `.conditional-edge__label` for dragging.
### Migration
- no — `schemaVersion` remains `4`. `labelOffsetX` and `labelOffsetY` are optional additive fields on edges. Old save files load without them and default to centered. New saves persist the coordinates.

## [2026-05-12] — Drag-and-Drop & Polish Iteration
### Added
- `narrativeStore.js`: Added `reorderDictionaryKeys(dictKey, startIndex, endIndex)` helper to support manual list reordering while preserving string-based dict keys. `exportGraph()` now correctly syncs `commonNodeTypes` and `endingTypes` keys to the legacy `meta` array on export.
- `@hello-pangea/dnd`: Dependency added to package.json. Implemented `DragDropContext`, `Droppable`, and `Draggable` inside `FlagManager`, `StatusManager`, `PathChapterManager`, and `NodesPanel`.
- `global.css`: Added `-webkit-line-clamp: 1` equivalent (standard ellipsis) to `.story-node__title`.
- `FlagManager.jsx`: Added `isFlagUsed(id)` utility to check all graph properties for flag references; dynamically sets `fill="currentColor"` on the Flag icon if actively used.
### Changed
- `GraphCanvas.jsx`: `minZoom` lowered to `0.1` enabling extreme zoom-out.
- `LeftSidebar.css` & `RightSidebar.css`: Replaced sliding `transform: translateX` with `margin` to prevent absolute positioning offset bugs during React Beautiful DnD interactions.
- `FlagManager`, `StatusManager`, `PathChapterManager`, `NodesPanel`: Added drag handles. Drag-and-drop functionality is disabled dynamically whenever a search query or filter is active.
### Migration
- no — `schemaVersion` remains `4`. Entity order relies on JSON key insertion order, requiring no explicit `orderIndex` properties.

## [2026-05-10] — Edge_Bend_Control
### Added
- `ConditionalEdge.jsx`: `bendX` ratio support — reads `data.bendX` (0.0–1.0), derives `centerX` for `getSmoothStepPath`, controlling where the vertical segment of a smooth-step edge sits. In editor mode, renders a draggable `⠿` grip handle via `EdgeLabelRenderer` at the vertical segment midpoint; dragging live-updates `narrativeStore.updateEdge({ bendX })`; double-click resets to `undefined` (auto-center). Handle is guarded: only shown when `|targetX - sourceX| >= 32` and not in campaign mode.
- `global.css`: `.edge-bend-handle` CSS rule — 16×16px grip, `opacity: 0.25` at rest, `opacity: 1` + primary color on hover, `ew-resize` cursor, `pointer-events: all`.
### Changed
- `GraphCanvas.jsx`: Edge `data` object now includes `bendX: edge.bendX` so `ConditionalEdge` can read the persisted bend ratio. Cluster bounding box constants corrected to `NODE_W = 240` (was 250) and `NODE_H = 160` (was 150), both multiples of 16. `setCenter` offsets corrected to `+120` / `+80` (was `+125` / `+75`) to match the corrected node half-dimensions.
- `ConditionalEdge.jsx`: Edge label container `pointerEvents` changed from `'all'` to `'none'` so the bend handle is always clickable even when the label visually overlaps it.
### Migration
- no — `bendX` is an optional additive field on edges. Old save files load without it and default to auto-center (React Flow's built-in behaviour). New saves persist `bendX` transparently through the existing `exportGraph()` / `importProject()` pipeline — no whitelist change needed (edges are serialised as a whole array, not individually whitelisted). `schemaVersion` remains `4`.

## [2026-05-09] — Route_Merge_Save_To_Campaign_And_Vitest
### Added
- `tests/routeTracer.test.js`: Vitest test suite for `routeTracer.js` — three suites covering `computeShortestPaths`, `findMergeGroups`, and `buildRouteSnapshot` against the `tests/test.json` fixture.
- `tests/test.json`: Example datamodel fixture (schemaVersion 4) used by the test suite.
- `routeTracer.js`: `findMergeGroups(paths, graphState)` — union-find transitive merge grouping; `buildRouteSnapshot(pathEdgeIds, graphState, flagDict, statusDict)` — constructs a minimal campaign snapshot (delta overrides only) from a traced route; `simulateFlagStateAlongPath(pathEdgeIds, graphState, initialFlagState)` — flag/status replay for a path sequence.
- `uiStore.js`: `mergedGroupEdgeIds: string[]` state and `setMergedGroupEdgeIds` action — bridges merged route canvas highlight from `RouteTracingPanel` to `ConditionalEdge`.
- `RouteTracingPanel.jsx`: Convergent route merge display (one card per merge group, "Via: A or B" option pill); Save to Campaign workflow (bookmark icon button → name input modal with multi-axis node navigator for merged groups; Locate button dispatches `canvas-focus-node`; `buildRouteSnapshot` → `addCampaign` → `updateCampaign`); `searchAll` checkbox (uncapped BFS via `Number.MAX_SAFE_INTEGER`) with warning text and Cancel button (`cancelledRef` abort pattern).
### Changed
- `vite.config.js`: Added Vitest configuration block (`test: { globals: true, environment: 'node' }`); added `/// <reference types="vitest" />` header.
- `package.json`: Added `"test": "vitest"` script.
- `routeTracer.js`: Removed internal hard cap (`HARD_CAP = 50`); `computeShortestPaths` default `limit` parameter raised from `5` to `50`; actual limit is now `limit` directly (no ceiling), giving callers full control.
- `simulationStore.js`: `computeRoutesFromStart` default `limit` raised from `5` to `50` to match.
- `fileSystem.js`: `sanitizedData` whitelist in `importProject` now includes `editorSeenNodeIds` and `editorSeenOptionIds`, fixing silent data loss where those fields were dropped on import.
- `ConditionalEdge.jsx`: Reads `uiStore.mergedGroupEdgeIds`; applies the route overlay highlight when this edge's ID is in the merged set.
### Deprecated
- Internal hard cap in `routeTracer.computeShortestPaths` — retired; callers supply the limit directly. `RouteTracingPanel` exposes the limit as a user-controlled input, making the hidden ceiling unnecessary.
### Migration
- no — `schemaVersion` remains `4`. No persisted data shape changes. The `editorSeenNodeIds`/`editorSeenOptionIds` fix is a sanitization correction; files that omitted those fields already defaulted to `[]` on import; files that included them now round-trip correctly.

## [2026-05-09] — Campaign_UX_Fixes_And_Visual_Polish
### Changed
- `uiStore.js`: Added `frozenWaypointEdgeIds: string[]` state and `setFrozenWaypointEdgeIds` action; bridges `RouteTracingPanel` local freeze state to `ConditionalEdge` renderer without prop drilling.
- `RouteTracingPanel.jsx`: Freeze-at-waypoint writes prefix edge IDs to `uiStore.frozenWaypointEdgeIds`; clear/stop/run clears them. Re-route now clears `waypoints` and `preWaypointResults` after calling `computeRoutesFromStart` so newly computed routes are not falsely marked impossible.
- `ConditionalEdge.jsx`: Reads `uiStore.frozenWaypointEdgeIds`; applies `conditional-edge--frozen-overlay` (green dashed animated stroke) when the edge is in the frozen set; frozen overlay takes priority over all other edge state classes.
- `global.css`: Added `.conditional-edge--frozen-overlay` rule (green dashed, `flow-dash` animation). Added `box-shadow` type-color glow to `.common-node`, `.choice-node`, `.ending-node` base classes. React Flow handles changed to `opacity: 0` by default, `opacity: 1` on `.react-flow__node:hover`; campaign mode forces `opacity: 0 !important` on both states. Removed unused `.story-node__seen-check` rule.
- `tokens.css`: Brightened node type color tokens — `--color-node-common`: `#1e8a4a`, `--color-node-choice`: `#2255b8`, `--color-node-ending`: `#c25a18`.
- `narrativeStore.js`: Added `applySeenFromCampaign(nodeIds, optionKeys)` action — union-merges campaign traversal marks into `editorSeenNodeIds` and `editorSeenOptionIds` without overwriting existing marks.
- `FloatingMiddleBar.jsx`: Added **Save Seen** button (Eye icon) in campaign mode bar; `handleSaveSeen` collects `seenNodeIds` + `activeNodeId` + option keys derived from `traversedEdgeIds`, then calls `narrativeStore.applySeenFromCampaign`.
- `simulationStore.js`: `selectOption` now uses `preAdvanceFlagSnapshot` as the flag baseline when re-selecting a different option, preventing prior option side effects from accumulating. `undoLastNode` restores `selectedOptionId` from `record.optionId` and passes it to `computeReachable` and `computeNodeStates` so undoing back to a choice node correctly rebuilds reachable edges.
- `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`: Replaced inline `<CircleCheck>` icon in type bar with CSS-only seen indicator — `story-node--seen` class now applied when `isEditorSeen && !isCampaignActive`, matching the existing campaign-mode seen visual (green border glow + `::after` corner badge). Removed `lucide-react` `CircleCheck` imports from all three files.
### Deprecated
- Inline `<CircleCheck>` icon in node type bars — retired; seen state now communicated exclusively via `story-node--seen` CSS class and its `::after` pseudo-element, consistent between edit mode and campaign mode.
### Migration
- no — no persisted data shape changes. `schemaVersion` remains `4`.

## [2026-05-09] — Persistent_Seen_Status
### Added
- `narrativeStore.js`: `editorSeenNodeIds[]` and `editorSeenOptionIds[]` persistent state arrays; `toggleNodeSeen(id)`, `toggleOptionSeen(nodeId, optionId)`, and `clearAllSeen()` actions. Included in `loadGraph()`, `newGraph()`, and `exportGraph()`.
- `CampaignListPanel.jsx`: "Clear All Seen" button (conditionally visible when marks exist and no campaign is active) calling `narrativeStore.clearAllSeen()`. `.clear-seen-btn` CSS rules in `RightPanels.css`.
- `useKeyboardShortcuts.js`: `M` shortcut toggles `narrativeStore.toggleNodeSeen` on selected node(s); supports single-select and multi-select; guarded by campaign mode.
### Changed
- `simulationStore.js`: `seenNodeIds` now tracks campaign-only traversal history exclusively; `toggleNodeSeen` and `toggleOptionSeen` actions removed (migrated to `narrativeStore`). `seenOptionIds` state slice removed.
- `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`: Editor-level seen mark now read from `narrativeStore.editorSeenNodeIds` (was `simulationStore`). Seen icon changed from `Check` to `CircleCheck` (lucide-react). `ChoiceNode` option text turns green when the option is in `narrativeStore.editorSeenOptionIds`. Both indicators hidden during active campaigns.
- `NodeConfigModal.jsx`: Seen toggles for nodes and options now read/write `narrativeStore` (was `simulationStore`).
- `example_datamodel.json`: Added `editorSeenNodeIds` and `editorSeenOptionIds` top-level fields.
### Migration
- no — `schemaVersion` remains `4`. `editorSeenNodeIds` and `editorSeenOptionIds` default to `[]` when absent in loaded data (backward compatible with older save files).

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
