# Integration Points — Context_menus_keyboard_shortcuts_creation_bar

---

## `src/store/uiStore.js`

**What it currently does:** Owns `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, `choiceDisplayMode`. Provides `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `toggleSnapToGrid`, `setChoiceDisplayMode`.

**How the new feature connects:**
- New `selectedNodeIds: []` field written by `setSelectedNodeIds(ids)` (called from `GraphCanvas.onSelectionChange`).
- New `labelDisplayMode: 'compact'` field toggled by `toggleLabelDisplayMode()` (called from the keyboard hook's `R` binding).
- `clearSelection` updated to also zero `selectedNodeIds`.
- The keyboard hook reads `clearSelection`, `toggleSnapToGrid`, `toggleLabelDisplayMode` via `useUIStore.getState()` (outside React subtree).
- `CommonNode`, `ChoiceNode`, and `ConditionalEdge` each read `labelDisplayMode` via targeted selectors to control verbose rendering.

**What must not change:** `selectedNodeId` semantics — still the primary signal for `NodeInspector` and `GraphCanvas` edit-mode selection. `choiceDisplayMode` and `setChoiceDisplayMode` are unchanged. `clearIfSelected` and `resetSelection` are unchanged.

---

## `src/store/narrativeStore.js`

**What it currently does:** Canonical store for all graph entities. Provides `addNode(position, type)`, `deleteNode(id)`, `addEdge(...)`, `deleteEdge(id)`, `addFlag(name)`, `addStatus(name)`, `addPath(name)`, `addChapter(name)`, `setStartNode(id)`. Also exposes `flag{}` and `status{}` dictionaries read by nodes/edges in verbose mode.

**How the new feature connects:**
- `NameModal.jsx` calls `useNarrativeStore.getState().addFlag(name)` (and equivalents) with the user-supplied name from the modal input — not an auto-generated name.
- `ContextMenu.jsx` calls `deleteNode`, `deleteEdge`, `setStartNode` via `getState()` calls (AR-04).
- `CommonNode`, `ChoiceNode`, and `ConditionalEdge` each subscribe to `flag{}` and `status{}` dictionaries (targeted selectors, AR-14) to resolve IDs to names in verbose label mode.

**What must not change:** No action signatures change. No new actions are added. The `flag{}` and `status{}` dictionaries are read-only consumers — the feature adds no write paths.

---

## `src/store/simulationStore.js`

**What it currently does:** Owns campaign lifecycle (`isCampaignActive`, `enterCampaign`, `exitCampaign`, `advance`, etc.) and edit-mode passive analysis.

**How the new feature connects:**
- The keyboard hook reads `useSimulationStore.getState().isCampaignActive` as a guard condition before dispatching any action.
- `CreationBar.jsx` receives `isCampaignActive` as a `disabled` prop from `TopBar` (which reads it via `useSimulationStore`).
- `ContextMenu.jsx` reads `isCampaignActive` to suppress creation-targeted menu items during campaign mode.

**What must not change:** No simulation state is read beyond `isCampaignActive`. No simulation actions are ever called by any new component or hook. The simulation engine is untouched.

---

## `src/components/GraphCanvas.jsx`

**What it currently does:** React Flow canvas wrapper. Derives RF nodes/edges from store, handles click/connect/drag/double-click-to-add, campaign advance-by-click, ESC key selection clear, passive analysis trigger, Tidy Layout event listener.

**How the new feature connects:**
- **Phase 1:** Calls `useKeyboardShortcuts()` (hook mount, one line). Removes the inline ESC `useEffect` (migrated to hook). Wires `onSelectionChange` → `setSelectedNodeIds`. Updates `derivedNodes` to use `selectedNodeIds.includes(node.id)` for the `selected` field.
- **Phase 2:** Adds `useEffect` listeners for `canvas-add-node` (calls `addNode` at viewport center) and `canvas-open-name-modal` (sets `pendingNameModal` local state). Renders `<NameModal />` conditionally on `pendingNameModal !== null`. The `canvas-open-name-modal` listener bails if `isCampaignActive === true` (RISK-CMK-09).
- **Phase 3:** Holds `contextMenuState` in local `useState` (position + type + targetId — UI-only concern, AR-03 compliant). Adds `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu` handlers. Adds dismiss wiring to `onMoveStart` / `onNodeDragStart`. Renders `<ContextMenu />` conditionally inside the canvas wrapper div.

**What must not change:** Campaign advance-by-click in `onNodeClick` (L128–144). `onConnect` edge-stamping logic (L151–161). `onNodeDragStop` → `updateNode` (L186–189). `graph-layout-tidy` event listener (L193–199). The `ReactFlowProvider` wrapper pattern. The double-click-to-add behavior in `onPaneClick` (L164–176). The `runPassiveAnalysis` trigger `useEffect`.

---

## `src/components/TopBar.jsx`

**What it currently does:** Horizontal bar with title input, Tidy Layout, Snap toggle, New/Import/Export buttons, campaign status indicator, `CampaignSelector` (edit mode) or Reset/Exit buttons (campaign mode).

**How the new feature connects:**
- Imports and renders `<CreationBar disabled={isCampaignActive} />` as a new child — placed between `.topbar__center` and `.topbar__right`, or within the right region.
- `isCampaignActive` is already subscribed via `useSimulationStore`.

**What must not change:** `handleNew`, `handleImport`, `handleExport`, `handleTidyLayout`, all campaign controls, and all existing button layout must remain exactly as-is. No restructuring of the three-region (left/center/right) layout.

---

## React Flow — `onSelectionChange` callback

**What it currently does:** React Flow fires this callback when the user Ctrl+clicks nodes or draws a selection box. It is currently **not wired** — `GraphCanvas` does not pass an `onSelectionChange` prop to `<ReactFlow>`.

**How the new feature connects:**
- Phase 1 adds `onSelectionChange={({ nodes }) => setSelectedNodeIds(nodes.map(n => n.id))}` to the `<ReactFlow>` props.
- This writes the multi-select set into `uiStore.selectedNodeIds`.
- `derivedNodes` reads `selectedNodeIds` to set `selected: selectedNodeIds.includes(node.id) || node.id === selectedNodeId` so that both single-select (click) and multi-select (box/Ctrl) propagate `selected` correctly to React Flow.

**What must not change:** React Flow's internal drag-box rendering, Ctrl+click behavior, and node repositioning on drag are all built-in — none of this is application code. Wiring `onSelectionChange` is purely additive and does not replace or override any existing React Flow behavior.

---

## Existing ESC key handler in `GraphCanvas.jsx` (L49–57)

**What it currently does:** A `useEffect` in `GraphCanvasInner` attaches a `keydown` listener to `window`. If `e.key === 'Escape'`, calls `clearSelection()`.

**How the new feature connects:**
- In Phase 1, this entire `useEffect` block is **removed** from `GraphCanvas`. The ESC → `clearSelection` binding is migrated to `useKeyboardShortcuts.js` and continues to work identically.
- This eliminates RISK-CMK-06 (double-handling) by having a single authoritative location for all keyboard handling.

**What must not change:** The behavior (ESC clears selection) is preserved — only the location of the handler changes.

---

**How the new feature connects:**
- `NameModal.jsx`, `ContextMenu.jsx`, and `CreationBar.jsx` each introduce new CSS class blocks. These are added to `global.css` as additive rules placed at the bottom of the file — no existing rule is modified.
- `CommonNode`, `ChoiceNode`, and `ConditionalEdge` verbose label rendering uses existing CSS variable tokens (colors, spacing) — no new tokens required.

**What must not change:** No existing rule in `global.css` is modified. All additions are standalone new class blocks.

> **RULE CANDIDATE:** `global.css` stylesheet additions that accompany new components should be explicit in the "files to touch" table in future scope documents, even when purely additive.

---

## `src/components/nodes/CommonNode.jsx`

**What it currently does:** Custom React Flow node renderer for standard narrative stops. Displays label, content preview, COMMON badge, side-effect count badge. In edit mode shows orphaned/unreachable warning badges. In campaign mode applies six-state CSS classes and `--seen` overlay. Uses `React.memo`.

**How the new feature connects:**
- Adds a `useUIStore(s => s.labelDisplayMode)` selector.
- Adds targeted `useNarrativeStore` selectors for `flag` and `status` dictionaries (AR-14: returns existing dict reference, not a new literal).
- When `labelDisplayMode === 'verbose'`: reads `data.flags_set` and `data.status_set` from the node's data prop, looks up each ID in the `flag`/`status` dictionaries, and renders the resolved names inline (e.g., `HasKey = true`, `Gold +5`).
- When `labelDisplayMode === 'compact'` (default): renders identically to pre-feature state.

**What must not change:** All simulation state CSS classes, `--seen` overlay, `isOrphaned`/`isUnreachable` warning badge, `React.memo` wrapping. The `data` prop shape is unchanged — the component reads `data.flags_set`/`data.status_set` which already exist on the node data model.

---

## `src/components/nodes/ChoiceNode.jsx`

**What it currently does:** Custom React Flow node renderer for choice points. Displays label, content preview, CHOICE badge, side-effect count, outgoing edge count. Per-option source handles. Campaign mode option-click interaction. Uses `React.memo`.

**How the new feature connects:**
- Same `labelDisplayMode` + `flag`/`status` dictionary subscription pattern as `CommonNode`.
- When `'verbose'`: shows side-effect names from `data.flags_set`/`data.status_set` inline.
- `choiceDisplayMode` (existing field for option label density) is entirely separate and unchanged.

**What must not change:** Per-option source handles, `choiceDisplayMode` rendering, campaign-mode option click handlers (`selectOption`), six-state CSS classes, `--seen` overlay, warning badges, `React.memo` wrapping.

---

## `src/components/edges/ConditionalEdge.jsx`

**What it currently does:** Custom React Flow edge using `BaseEdge` + `EdgeLabelRenderer`. Shows edge label and AND/OR condition pill badge. In campaign mode applies state CSS classes (`--traversed`, `--condition-pass`, `--condition-fail`, `--unselected-option-dim`). Uses `React.memo`.

**How the new feature connects:**
- Adds `useUIStore(s => s.labelDisplayMode)` selector.
- Adds targeted `useNarrativeStore` selectors for `flag` and `status` (AR-14 compliant).
- When `'verbose'`: for each clause in `data.condition.clauses`, resolves the `flagId` or `statusId` to its name from the respective dictionary. Renders the clause text (e.g., `HasKey = true`, `Gold ≥ 5`) within the `EdgeLabelRenderer` area, alongside or replacing the compact AND/OR pill.
- When `'compact'`: renders identically to pre-feature — AND/OR pill and edge label only.

**What must not change:** `BaseEdge` + `EdgeLabelRenderer` structure. All campaign-mode edge state CSS classes. `React.memo` wrapping. The `data.condition` shape is unchanged — this is a read-only consumer.
