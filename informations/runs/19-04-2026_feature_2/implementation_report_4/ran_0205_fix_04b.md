# Fix Report — Phase 4 (Supplemental)

## SCOPE EXPANSIONS (flagged before proceeding — user approved)

| File | Reason |
|---|---|
| `src/store/narrativeStore.js` | Outside phase 4 file map — `addNode` restructured to return new node ID; label param added |
| `src/components/NameModal.jsx` | Phase 2 file — extended to support `onConfirm` override and node type titles |
| `src/components/NodeInspector.jsx` | Not in phase 4 file map — added `nodeId` and `hideDelete` props for modal use |
| `src/components/FlagManager.jsx` | Not in phase 4 file map — delete guard UX improvement |
| `src/components/StatusManager.jsx` | Not in phase 4 file map — delete guard UX improvement |
| `src/hooks/useKeyboardShortcuts.js` | Phase 1 file — N/C/E keys now dispatch `canvas-open-node-modal` |
| `src/components/ContextMenu.jsx` | Phase 3 file — pane items now dispatch `canvas-open-node-modal` |

---

## Fix 1 (Planned) — Creation bar node buttons place node at canvas viewport center

**Addressed:** Human note: "creation bar button for `common`, `choice`, and `ending` node should make the node appear at the middle of the current canvas viewport"

**What changed:**
- `CreationBar.jsx`: `handleNodeAdd` dispatches `canvas-open-node-modal` with `{ nodeType }` instead of `canvas-add-node`. Position is computed inside `GraphCanvas` where `canvasRef` and `screenToFlowPosition` are available.
- `GraphCanvas.jsx`: `canvas-open-node-modal` handler computes canvas center via `canvasRef.current.getBoundingClientRect()`, converts via `screenToFlowPosition`, adds ±30px jitter in flow space to prevent stacking.

**Impact:** Feature delta — changes placement and creation flow for creation bar node buttons.

---

## Fix 2 & 3 (Unplanned) — Full node inspector modal before creation + ESC/Cancel deletes node

**Addressed:** Human notes: modal flow (Create Node → modal → node appears); ESC closes modal and cancels creation. Modal has all node inspector fields. Other creation methods (keyboard, context menu, double-click) also open the modal.

**What changed:**

### Modal flow architecture
- Node is created immediately when the modal opens (so `OptionEditor`/`VariantEditor` have a real `nodeId` to write to).
- `pendingNodeModal` state holds the new node's ID, not its type.
- **Done** — keeps the node, closes modal.
- **Cancel / ESC / backdrop click** — calls `deleteNode(id)` + `clearSelection()`, removing the node as if creation never happened.

### `narrativeStore.js`
- `addNode` restructured from `set(...)` to `{ id = generateId('n'); set(...); return id; }` so callers receive the new node's ID.
- Third param `label = 'Node'` passed into `data.label`.

### `NodeInspector.jsx`
- Added optional `nodeId` prop — overrides `selectedNodeId` from uiStore when provided.
- Added `hideDelete` prop — hides the Delete Node button when rendered inside the creation modal (deleting from within would orphan the modal shell).

### `GraphCanvas.jsx`
- `canvas-open-node-modal` listener: accepts optional `screenX/screenY` in event detail. If present, places node at that screen position (context menu / double-click). If absent, places at canvas viewport center with ±30px jitter (creation bar / keyboard).
- Listener calls `addNode` → gets ID → `selectNode(id)` → `setPendingNodeModal(id)`.
- Modal renders `<NodeInspector nodeId={pendingNodeModal} hideDelete />` inside a scrollable overlay (480px wide, 70vh max-height).
- `onPaneClick` double-click now dispatches `canvas-open-node-modal` with `clientX/Y` instead of calling `addNode` directly.
- `canvas-add-node` handler retains its `screenX/screenY` branch for any remaining callers; `centered` branch removed (no longer needed).

### `NameModal.jsx`
- Added `onConfirm` optional prop (unused by node creation flow now, retained for future callers).
- Added title map entries for `common`, `choice`, `ending` (used by modal header).

### `useKeyboardShortcuts.js`
- N, C, E keys dispatch `canvas-open-node-modal` with `{ nodeType }` (no position — places at viewport center with jitter).

### `ContextMenu.jsx`
- Pane context menu items dispatch `canvas-open-node-modal` with `{ nodeType, screenX: x, screenY: y }` (node lands at right-click position).

### `global.css`
- Added `.node-creation-modal` (width: 480px, max-width: 90vw) and `.node-creation-modal__body` (overflow-y: auto, max-height: 70vh).

**Impact:** Feature delta — all three node types across all four creation paths now go through the modal. `NameModal.jsx` changes are backwards-compatible. `NodeInspector` new props are optional, existing sidebar usage unaffected.

---

## Fix 4 (Unplanned) — Delete guard shows node label + Focus button

**Addressed:** Human note: "Deleting `flags` and `status` will show the guard, but the current one shows the id of the node. This is not user friendly. I think it should show the `node label` and there are a button to `focus` on the node."

**What changed:**
- `FlagManager.jsx`: Added `getNodeLabel(ref, common, choice, ending)` helper — parses reference strings (e.g. `node_sideEffect:n_abc`) and resolves the embedded node ID to `data.label`. Subscribes to `common`, `choice`, `ending` from store. Delete guard renders each reference as the node label + a "Focus" button (dispatches `canvas-focus-node`). Edge references (`edge_condition:...`) show raw string, no focus button.
- `StatusManager.jsx`: Identical changes.
- `GraphCanvas.jsx`: Added `canvas-focus-node` listener — calls `selectNode(nodeId)` then `fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.3 })` after 50ms.

**Impact:** Neither feature delta nor an integration point. Pure UX improvement to existing delete guard UI.

---

## Modified Files

| File | Path |
|---|---|
| `narrativeStore.js` | `src/store/narrativeStore.js` |
| `NameModal.jsx` | `src/components/NameModal.jsx` |
| `NodeInspector.jsx` | `src/components/NodeInspector.jsx` |
| `CreationBar.jsx` | `src/components/CreationBar.jsx` |
| `GraphCanvas.jsx` | `src/components/GraphCanvas.jsx` |
| `FlagManager.jsx` | `src/components/FlagManager.jsx` |
| `StatusManager.jsx` | `src/components/StatusManager.jsx` |
| `useKeyboardShortcuts.js` | `src/hooks/useKeyboardShortcuts.js` |
| `ContextMenu.jsx` | `src/components/ContextMenu.jsx` |
| `global.css` | `src/styles/global.css` |
