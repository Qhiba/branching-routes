# Integration Points — Command_palette_toast_Visual_Node_Clustering

---

## 1. `src/hooks/useKeyboardShortcuts.js`

**What it currently does:** Single `keydown` listener on `window`. Input-field guard bails early on `INPUT`/`TEXTAREA`/`contenteditable`. Campaign-mode guard bails on all authoring shortcuts. Handles: N, C, E (node creation via `canvas-add-node`/`canvas-open-node-modal`), F, S, P, H (naming modal via `canvas-open-name-modal`), Delete (single and multi), Escape (clear selection), V (snap toggle), L (tidy layout), R (label display mode toggle).

**How this feature connects:**
- Phase 2 inserts `Ctrl+K` as the very first check inside `handleKeyDown`, before the input-field guard. Reason: `Ctrl+K` must fire even when the palette's own `<input>` is focused (so the user can close the palette while typing). Uses `e.ctrlKey && e.key === 'k'`; calls `e.preventDefault()` (Firefox conflict mitigation); dispatches `window.dispatchEvent(new Event('palette-toggle'))`.
- Phase 3 inserts `G` in the view shortcuts section (after R, before the `isCampaignActive` guard). Reason: cluster toggle is a view-only action, allowed during campaign mode, same as V (snap) and L (tidy). Calls `useUIStore.getState().cycleClusterMode()`.

**What must not change:** Input-field guard block; campaign-mode guard position; all existing shortcut handlers and their return statements; `isCampaignActive` in the `useEffect` dependency array.

**Integration risk:** `Ctrl+K` must use `e.ctrlKey && e.key === 'k'` (case-insensitive via `.toLowerCase()` or matching lowercase `'k'`). Do not use `e.key === 'K'` (capital) — that would require Shift.

---

## 2. `src/components/GraphCanvas.jsx`

**What it currently does:** Wraps React Flow. Handles: node/edge interactions, campaign advance-by-click, context menus, `useKeyboardShortcuts` mount, `canvas-add-node`, `canvas-open-node-modal`, `canvas-open-name-modal`, `canvas-focus-node`, `graph-layout-tidy` event listeners.

**How this feature connects:**
- Phase 2: new `useEffect` listening for `canvas-navigate-to-node` event. Handler reads node position from `useNarrativeStore.getState()` (all three collections), calls `setCenter(x + 125, y + 75, { zoom: 1.2, duration: 400 })`. Node half-dimensions (125×75) match the Dagre layout node size already used in `TopBar.jsx`. `setCenter` is added to the `useReactFlow()` destructure.
- Phase 3: `<ClusterOverlay>` component rendered as the first child of the canvas-wrapper div (before `<ReactFlow>`). Positioned absolutely; `z-index: var(--z-cluster)` keeps it behind React Flow's node layer. `ClusterOverlay` uses `useViewport()` from `@xyflow/react` for the transform — must be called inside `ReactFlowProvider`, which it is.

**What must not change:** `onNodeClick` campaign-advance logic; `runPassiveAnalysis` `useEffect`; `onConnect` option-handle stamping; `onNodeDragStop` multi-drag position persistence; `ReactFlowProvider` outer wrapper; all three context menu handlers; all existing event listeners.

**Integration note (AR-19):** `canvas-navigate-to-node` follows the established custom DOM event pattern. `CommandPalette` (outside `ReactFlowProvider`) dispatches the event; `GraphCanvas` (inside provider) handles it and calls `setCenter`. This is consistent with `canvas-add-node`, `canvas-focus-node`, and `graph-layout-tidy`.

---

## 3. `src/store/narrativeStore.js`

**What it currently does:** Owns canonical graph: `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`, `meta`. Full CRUD for all entity types.

**How this feature connects:**
- `CommandPalette` reads all seven entity collections via targeted `useNarrativeStore` selectors to build its search index. The index memo is keyed on the collection object references — it rebuilds only when a collection actually changes, not on every keystroke.
- `ClusterOverlay` reads `path` and `chapter` for cluster color keying, and reads node positions from `common`/`choice`/`ending` for bounding box computation.
- Neither component ever writes to `narrativeStore`.

**What must not change:** This store is PROTECTED. All actions, data model shape, export format, schema version 4.

---

## 4. `src/store/uiStore.js`

**What it currently does:** Owns `selectedNodeId`, `selectedEdgeId`, `selectedNodeIds`, `snapToGrid`, `choiceDisplayMode`, `labelDisplayMode` plus their actions.

**How this feature connects:** Phase 3 adds `clusterMode: 'off'` and `cycleClusterMode`. `TopBar` reads `clusterMode` and calls `cycleClusterMode` (cluster button). `useKeyboardShortcuts` calls `cycleClusterMode` (G shortcut). `ClusterOverlay` reads `clusterMode` to decide which overlay layers to render.

**What must not change:** All existing state fields; all existing action signatures; `setSelectedNodeIds` order-independent equality check; `clearSelection` and `resetSelection` implementations.

---

## 5. `src/App.jsx`

**What it currently does:** Composes the three-region CSS grid: `TopBar`, `GraphCanvas`, `Sidebar`. No other responsibilities.

**How this feature connects:** Phase 1 adds `<Toast />` (fixed-position, does not affect grid). Phase 2 adds `<CommandPalette />` (fixed-position, does not affect grid). Both are appended inside the `.app` div after the three layout children. Both are outside `ReactFlowProvider` — this is correct per AR-19; their canvas interactions must go via DOM events.

**What must not change:** The `.app` CSS grid layout; the three existing children and their wrapper elements; `App.css` import.

---

## 6. `src/components/TopBar.jsx`

**What it currently does:** Horizontal top bar with app title, file actions, Tidy Layout, Snap toggle, campaign controls, `CampaignSelector`, and `CreationBar`.

**How this feature connects:** Phase 3 adds a cluster mode cycle button in `topbar__right`, after the existing Snap button. Reads `clusterMode` and `cycleClusterMode` from `useUIStore`. Not disabled during campaign mode — clustering is a view-only control.

**What must not change:** All existing layout regions; `CampaignSelector` and `CreationBar` mount points; all handlers; all existing button `disabled={isCampaignActive}` states.

---

## 7. `src/components/NameModal.jsx`

**What it currently does:** Lightweight overlay for entity naming. Attaches its own `keydown` listener with `event.stopPropagation()` on ESC — the RISK-CMK-08 pattern.

**How this feature connects:** `CommandPalette` must replicate this exact ESC `stopPropagation` pattern. No changes to `NameModal` itself — it is PROTECTED. The pattern it established is used as the reference implementation for the palette.

**What must not change:** `NameModal` is PROTECTED. ESC handler, store calls, CSS class names — all unchanged.

---

## 8. `src/styles/tokens.css` and `src/styles/global.css`

**What they currently do:** Design system CSS custom properties (tokens) and all component styles.

**How this feature connects:** Tokens gains the project's first explicit z-index scale and new color tokens (toast variants, cluster palette). `global.css` gains three new CSS block groups (Toast, CommandPalette, ClusterOverlay) appended at the end of the file.

**What must not change:** All existing token values; invariant comment DC-07 in `tokens.css`; all existing CSS blocks in `global.css`; `@import './tokens.css'` at top of global.
