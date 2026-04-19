# File Map — Context_menus_keyboard_shortcuts_creation_bar

---

## New Files

### `src/hooks/useKeyboardShortcuts.js`
- **Status:** NEW (new directory `src/hooks/`)
- **What changes and why:** Creates a custom React hook that attaches a single `keydown` listener to `window`. The listener guards on `event.target` (bails for INPUT/TEXTAREA/contenteditable) and `isCampaignActive` (bails if in campaign mode). When guards pass, dispatches to store actions or custom DOM events. Handles: N, C, E (canvas-add-node event), F, S, P, H (canvas-open-name-modal event), Del (deletion), Escape (clear selection), V (toggle snap), L (tidy layout), R (toggle label display mode).
- **What must NOT change:** Must not import from `components/` — circular dependency with `GraphCanvas`. Must not hold narrative state in local React state — all writes go through store actions or custom events (AR-04). Must not fire any action when `isCampaignActive === true` (AR-08).
- **Phase:** Phase 1 (scaffold, no dispatch), Phase 2 (full dispatch)

### `src/components/NameModal.jsx`
- **Status:** NEW
- **What changes and why:** Lightweight centered overlay component. Receives `entityType: 'flag'|'status'|'path'|'chapter'` and `onClose` callback as props (or reads from local state in `GraphCanvas`). Renders a modal backdrop, a title ("New Flag", "New Status", etc.), a text input, and Confirm/Cancel buttons. Local state holds the input value. On Confirm: calls the appropriate `narrativeStore.getState()` action with the typed name, then calls `onClose`. On Cancel or Escape keydown inside the modal: calls `onClose` without creating anything. The internal Escape handler calls `event.stopPropagation()` to prevent the keyboard hook from simultaneously clearing canvas selection.
- **What must NOT change:** Must not create entities with empty names — validate that the input is non-empty before enabling Confirm. Must not write to store directly — all creation via `narrativeStore.getState()` named actions (AR-04).
- **Phase:** Phase 2

### `src/components/ContextMenu.jsx`
- **Status:** NEW
- **What changes and why:** Renders a positioned floating panel when `contextMenuState` is non-null. Receives `{ x, y, type, targetId }` as props (or via local state in `GraphCanvas`). Renders a different action list per `type`: `'pane'` → Add Common Node, Add Choice Node, Add Ending Node; `'node'` → Delete Node, Set as Start Node; `'edge'` → Delete Edge; `'multi'` → Delete Selected. Each button calls the appropriate store action and then closes the menu. For pane actions that create nodes, dispatches `canvas-add-node` event. Implements viewport-edge flip: if `x + menuWidth > window.innerWidth`, renders to the left of cursor; same vertically.
- **What must NOT change:** Must not mutate store state directly — all actions via store `getState()` calls (AR-04). Must not introduce new visual state vocabulary for nodes (AR-16).
- **Phase:** Phase 3

### `src/components/CreationBar.jsx`
- **Status:** NEW
- **What changes and why:** A compact horizontal row of buttons — one per entity type. Node buttons (Common, Choice, Ending) dispatch `canvas-add-node` event; `GraphCanvas` handles viewport-center placement. Metadata buttons (Flag, Status, Path, Chapter) dispatch `canvas-open-name-modal` event with `{ entityType }` payload; `GraphCanvas` opens `NameModal`. All buttons receive `disabled={disabled}` prop (passed from `TopBar` as `isCampaignActive`). `TopBar` is outside the `ReactFlowProvider` subtree — `CreationBar` never calls `useReactFlow()` or `addNode` directly.
- **What must NOT change:** Must not create entities with auto-generated names — all metadata entity creation goes through modal. Must not call store actions directly for canvas-positioned entities (AR-04 custom event pattern).
- **Phase:** Phase 4

---

## Modified Files

### `src/store/uiStore.js`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Adds `selectedNodeIds: []` initial state + `setSelectedNodeIds(ids)` action. Adds `labelDisplayMode: 'compact'` initial state + `toggleLabelDisplayMode()` action that cycles between `'compact'` and `'verbose'`. Updates `clearSelection` to also reset `selectedNodeIds: []`. All existing fields (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`, `choiceDisplayMode`) and all existing actions are unchanged.
- **What must NOT change:** `selectedNodeId` remains the primary single-select signal. `choiceDisplayMode` and `setChoiceDisplayMode` are unchanged. `clearIfSelected` and `resetSelection` are unchanged.
- **Phase:** Phase 1

### `vite.config.js`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Adds one alias: `hooks: path.resolve(__dirname, 'src/hooks')`. Allows absolute imports from `hooks/` without relative path chains.
- **What must NOT change:** All four existing aliases (`components`, `store`, `utils`, `styles`) must remain unchanged.
- **Phase:** Phase 1

### `src/components/GraphCanvas.jsx`
- **Status:** EXISTING — MODIFY
- **What changes and why (accumulated across phases):**
  - **Phase 1:** Remove inline ESC `keydown` effect (L49–57). Call `useKeyboardShortcuts()` inside `GraphCanvasInner`. Wire `onSelectionChange` → `setSelectedNodeIds`. Update `derivedNodes` `selected` field to `selectedNodeIds.includes(node.id) || node.id === selectedNodeId`.
  - **Phase 2:** Add `useEffect` listener for `canvas-add-node` custom event (calls `addNode` at viewport center). Add `useEffect` listener for `canvas-open-name-modal` custom event (sets `pendingNameModal` local state). Add `pendingNameModal` local `useState(null)` for modal entity type (UI-only, AR-03 compliant). Render `<NameModal />` conditionally on `pendingNameModal !== null`.
  - **Phase 3:** Add `contextMenuState` local `useState`. Wire `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu`. Wire dismiss on `onMoveStart` / `onNodeDragStart` / `onPaneClick`. Render `<ContextMenu />` conditionally.
- **What must NOT change:** Campaign advance-by-click (`onNodeClick` campaign path). `onConnect` edge stamping. `onNodeDragStop` → `updateNode`. `graph-layout-tidy` event listener. All `useMemo` derivations. The `ReactFlowProvider` wrapper.
- **Phase:** Phase 1, Phase 2, Phase 3

### `src/components/nodes/CommonNode.jsx`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Adds a read of `labelDisplayMode` from `useUIStore`. When `'verbose'`: reads the `flag` and `status` dictionaries from `useNarrativeStore` (targeted selectors — AR-14 compliant) and renders the names of flags/statuses referenced in `data.flags_set` / `data.status_set` alongside the existing side-effect badge. When `'compact'`: renders identically to pre-feature behavior.
- **What must NOT change:** All existing simulation campaign state classes (`--active`, `--locked`, etc.), `--seen` overlay, `isOrphaned`/`isUnreachable` warning badge rendering, and `React.memo` wrapping must remain exactly as-is.
- **Phase:** Phase 2

### `src/components/nodes/ChoiceNode.jsx`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Same as `CommonNode` — adds `labelDisplayMode` read from `useUIStore`. When `'verbose'`: shows flag/status names from `data.flags_set` / `data.status_set` in the node body alongside existing badges. When `'compact'`: unchanged.
- **What must NOT change:** Per-option source handles, `choiceDisplayMode` rendering density, option click handlers (campaign mode), `--seen` overlay, all simulation state classes, `React.memo`, warning badges.
- **Phase:** Phase 2

### `src/components/edges/ConditionalEdge.jsx`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Adds a read of `labelDisplayMode` from `useUIStore`. When `'verbose'`: reads `flag` and `status` from `useNarrativeStore` and renders the names of flags/statuses referenced in `data.condition.clauses` (each clause's `flagId` / `statusId` resolved to its name). When `'compact'`: renders identically to pre-feature (AND/OR pill and label only).
- **What must NOT change:** All simulation state edge classes (`--traversed`, `--condition-pass`, `--condition-fail`, `--unselected-option-dim`), `BaseEdge` + `EdgeLabelRenderer` structure, `React.memo` wrapping.
- **Phase:** Phase 2

### `src/components/TopBar.jsx`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Imports `CreationBar` and renders `<CreationBar disabled={isCampaignActive} />` as a new child. Placement: between `.topbar__center` and `.topbar__right`, wrapped in `<div className="topbar__creation-bar">` for styling isolation.
- **What must NOT change:** `handleNew`, `handleImport`, `handleExport`, `handleTidyLayout`, campaign controls, `CampaignSelector` mount, and all existing button wiring remain completely unchanged.
- **Phase:** Phase 4

### `src/components/index.js`
- **Status:** EXISTING — MODIFY
- **What changes and why:** Adds export lines for `NameModal` (Phase 2), `ContextMenu` (Phase 3), `CreationBar` (Phase 4).
- **What must NOT change:** All 17 existing export lines must remain unchanged.
- **Phase:** Phase 2 (NameModal), Phase 3 (ContextMenu), Phase 4 (CreationBar)

### `src/styles/global.css`
- **Status:** EXISTING — MODIFY (additive only)
- **What changes and why:** Three additive style blocks:
  - `.name-modal` — centered fixed overlay for `NameModal.jsx` (added in Phase 2).
  - `.context-menu` / `.context-menu__item` — positioned floating panel for `ContextMenu.jsx` (added in Phase 3).
  - `.topbar__creation-bar` / `.creation-bar__btn` — creation bar strip styles (added in Phase 4).
- **What must NOT change:** No existing rule is modified. All additions are new class blocks placed at the bottom of the file.
- **Phase:** Phase 2 (modal styles), Phase 3 (menu styles), Phase 4 (bar styles)

---

## Protected Files (must not be touched)

`src/store/narrativeStore.js`, `src/store/simulationStore.js`, `src/store/campaignStore.js`, `src/utils/fileSystem.js`, `src/utils/conditionEvaluator.js`, `src/utils/uuid.js`, `src/utils/index.js`, `src/store/index.js`, `src/components/NodeInspector.jsx`, `src/components/EdgeInspector.jsx`, `src/components/nodes/EndingNode.jsx`, `src/components/SandboxPanel.jsx`, `src/components/CampaignSelector.jsx`, `src/components/FlagManager.jsx`, `src/components/StatusManager.jsx`, `src/components/PathChapterManager.jsx`, `src/components/Sidebar.jsx`, `src/styles/tokens.css`, `src/main.jsx`, `src/App.jsx`, `src/App.css`

> **Note:** `CommonNode.jsx`, `ChoiceNode.jsx`, and `ConditionalEdge.jsx` have moved from PROTECTED to MODIFY to support `labelDisplayMode` verbose rendering. `EndingNode.jsx` remains protected — it has no side effects (`flags_set`/`status_set`) and no conditions, so it has nothing to show in verbose mode.
