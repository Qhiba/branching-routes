# Phase 2 — Keyboard Shortcuts, Naming Modal, and Label Display Mode

---

**Goal:** Implement the full shortcut dispatch body in `useKeyboardShortcuts.js`, introduce `NameModal.jsx` for named entity creation, implement the `labelDisplayMode` verbose display across Common nodes, Choice nodes, and edges, and add the `canvas-add-node` / `canvas-open-name-modal` custom event listeners in `GraphCanvas`.

---

## What it adds

### `src/hooks/useKeyboardShortcuts.js` — stub filled with full dispatch table:

- **Node creation shortcuts (canvas-center via custom event):**
  - `N` → `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'common' } }))`
  - `C` → `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'choice' } }))`
  - `E` → `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'ending' } }))`

- **Named entity creation shortcuts (modal via custom event):**
  - `F` → `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'flag' } }))`
  - `S` → `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'status' } }))`
  - `P` → `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'path' } }))`
  - `H` → `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'chapter' } }))`

- **Deletion shortcut:**
  - `Delete` → read `selectedNodeId`; if set, `deleteNode(selectedNodeId)`. Else read `selectedEdgeId`; if set, `deleteEdge(selectedEdgeId)`. Else iterate `selectedNodeIds` and `deleteNode` for each.

- **View / state shortcuts:**
  - `Escape` → `useUIStore.getState().clearSelection()`
  - `V` → `useUIStore.getState().toggleSnapToGrid()`
  - `L` → `window.dispatchEvent(new Event('graph-layout-tidy'))`
  - `R` → `useUIStore.getState().toggleLabelDisplayMode()`

### `src/components/NameModal.jsx` — new component:

- Renders a fixed centered backdrop + dialog box.
- Receives `entityType: 'flag'|'status'|'path'|'chapter'` and `onClose` via props (passed from `GraphCanvas` local state).
- Local state: `inputValue: ''`.
- Title maps to entity type: "New Flag", "New Status", "New Path", "New Chapter".
- Text input, autofocused on mount.
- **Confirm** button: disabled when `inputValue.trim() === ''`. On click: calls the matching `narrativeStore.getState()` action with `inputValue.trim()` as the name, then calls `onClose()`.
- **Cancel** button + backdrop click: calls `onClose()` with no creation.
- Escape keydown inside the modal: calls `onClose()` + `event.stopPropagation()` (RISK-CMK-08 mitigation — prevents the keyboard hook from simultaneously clearing canvas selection).

### `src/components/GraphCanvas.jsx` — two additions (beyond Phase 1):

1. **`canvas-add-node` event listener** — `useEffect` inside `GraphCanvasInner` listens for this event. Handler: `addNode(screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }), event.detail.type)`.
2. **`canvas-open-name-modal` event listener** — `useEffect` inside `GraphCanvasInner` listens for this event. Sets `pendingNameModal` local state to `event.detail.entityType`.
3. **`pendingNameModal` local `useState(null)`** — UI-only concern (AR-03 compliant). Controls whether `<NameModal />` is rendered.
4. **`<NameModal />` render** — conditionally rendered inside the canvas wrapper div when `pendingNameModal !== null`. Pass `entityType={pendingNameModal}` and `onClose={() => setPendingNameModal(null)}`.

### `src/components/nodes/CommonNode.jsx` — label display mode support:

- Add `labelDisplayMode` selector: `useUIStore(s => s.labelDisplayMode)`.
- Add targeted `flag` and `status` selectors from `useNarrativeStore` (AR-14 compliant — return the existing dictionaries, not new literals).
- When `labelDisplayMode === 'verbose'`: render a list of flag/status names from `data.flags_set` / `data.status_set` by looking up IDs in the `flag`/`status` dictionaries. Display format: `"flagName = true"` for flags, `"statusName: +N"` for statuses. Render below the existing content preview area.
- When `labelDisplayMode === 'compact'` (default): existing rendering is 100% unchanged.
- Update `React.memo` dependency selectors to include `labelDisplayMode`.

### `src/components/nodes/ChoiceNode.jsx` — label display mode support:

- Same pattern as `CommonNode`: add `labelDisplayMode` + `flag`/`status` selectors. Verbose mode renders side-effect names below the content preview. Compact mode is unchanged.
- **Note:** `choiceDisplayMode` (existing field for option label density) is entirely separate and unchanged.

### `src/components/edges/ConditionalEdge.jsx` — label display mode support:

- Add `labelDisplayMode` from `useUIStore` and `flag`/`status` from `useNarrativeStore` (targeted selectors — AR-14).
- When `'verbose'`: for each clause in `data.condition.clauses`, resolve the `flagId` or `statusId` to its name from the dictionary and render the clause as text (e.g., `"HasKey = true"`, `"Gold ≥ 5"`). Rendered within the existing `EdgeLabelRenderer` area.
- When `'compact'`: renders identically to pre-feature (AND/OR pill + edge label only).

---

## Produces

| File | Status |
|---|---|
| `src/hooks/useKeyboardShortcuts.js` | MODIFIED (stub → full) |
| `src/components/NameModal.jsx` | NEW |
| `src/components/GraphCanvas.jsx` | MODIFIED (canvas-add-node listener + modal listener + NameModal render) |
| `src/components/nodes/CommonNode.jsx` | MODIFIED (labelDisplayMode verbose rendering) |
| `src/components/nodes/ChoiceNode.jsx` | MODIFIED (labelDisplayMode verbose rendering) |
| `src/components/edges/ConditionalEdge.jsx` | MODIFIED (labelDisplayMode verbose rendering) |
| `src/components/index.js` | MODIFIED (add NameModal export) |
| `src/styles/global.css` | MODIFIED (additive — .name-modal styles) |

---

## What it leaves temporarily incomplete

- No visual feedback (no toast) when a node is created via shortcut. Node appears on canvas. By design — scope excludes toasts.
- Context menu does not exist yet (Phase 3).
- Creation bar does not exist yet (Phase 4).

---

## What the next phase depends on from this phase

- Phase 3 (`ContextMenu`) does not depend on Phase 2 — can be built independently.
- Phase 4 (`CreationBar`) uses both the `canvas-add-node` and `canvas-open-name-modal` custom event patterns established in this phase. Flag/Status/Path/Chapter buttons in `CreationBar` dispatch `canvas-open-name-modal`; `GraphCanvas` already handles it.

---

## Reference files needed

- `src/hooks/useKeyboardShortcuts.js` (Phase 1 stub)
- `src/components/GraphCanvas.jsx` (Phase 1 state)
- `src/store/narrativeStore.js` — action signatures: `addNode`, `deleteNode`, `addFlag`, `addStatus`, `addPath`, `addChapter`, `deleteEdge`; state shapes: `flag`, `status`
- `src/store/uiStore.js` — `clearSelection`, `toggleSnapToGrid`, `toggleLabelDisplayMode`, `selectedNodeId`, `selectedEdgeId`, `selectedNodeIds`, `labelDisplayMode`
- `src/store/simulationStore.js` — `isCampaignActive`
- `src/components/nodes/CommonNode.jsx` (current)
- `src/components/nodes/ChoiceNode.jsx` (current)
- `src/components/edges/ConditionalEdge.jsx` (current)
- `ran_0202_risks.md` — RISK-CMK-01 (input guard), RISK-CMK-07 (canvas-center placement), RISK-CMK-08 (modal ESC conflict), RISK-CMK-09 (modal in campaign mode)

---

## Rollback cost if this phase fails: MEDIUM

- Revert `useKeyboardShortcuts.js` to Phase 1 stub.
- Delete `NameModal.jsx`.
- Revert `GraphCanvas.jsx` (remove two event listeners, `pendingNameModal` state, `<NameModal />` render).
- Revert `CommonNode.jsx`, `ChoiceNode.jsx`, `ConditionalEdge.jsx` to pre-phase state.
- Revert `components/index.js` (remove NameModal export).
- Revert `global.css` (remove modal style block).
- MEDIUM because six files revert (vs. two in the original plan), though each revert is targeted and non-destructive.

---

## Hard stop triggers

- Any shortcut fires during campaign mode (AR-08 guard failed).
- Any shortcut fires when cursor is in an input field (RISK-CMK-01 materialized).
- `N`/`C`/`E` creates a node at `{ x: 0, y: 0 }` (RISK-CMK-07).
- Pressing `F` does not open the naming modal.
- Pressing `Escape` inside the modal closes the modal **and** also clears canvas selection (RISK-CMK-08 — `stopPropagation` missing).
- Verbose mode (`R`) does not change rendering on Common or Choice nodes.
- Verbose mode (`R`) does not show flag/status names on edges.
- `CommonNode`, `ChoiceNode`, or `ConditionalEdge` enters an infinite re-render loop when `labelDisplayMode` is set (AR-14 selector violation).

---

## Acceptance Criteria

Done when:
1. `N`/`C`/`E` create the correct node type near viewport center.
2. `F` opens a modal with title "New Flag" and a text input. Typing "HasKey" and confirming creates a flag named "HasKey" visible in the Flags sidebar tab.
3. `S`, `P`, `H` each open the corresponding modal. Confirming creates the entity with the typed name. Cancelling creates nothing.
4. Confirming with an empty input in the modal is blocked (Confirm button disabled).
5. Pressing `Escape` inside the modal closes the modal — canvas selection is NOT cleared simultaneously.
6. `Del` with a selected node removes it; with a selected edge removes it.
7. `Escape` outside modal clears canvas selection.
8. `V` toggles Snap; `L` triggers Tidy Layout.
9. `R` toggles label display. In verbose mode, at least one Common or Choice node with side effects shows flag/status names. In verbose mode, at least one edge with conditions shows flag/status names. Pressing `R` again returns to compact mode (names hidden).
10. No shortcut fires during campaign mode.
11. No shortcut fires while typing in an input field.
12. No infinite re-render loop in node or edge components when `R` is pressed.

---

## Verification

Open the app with nodes that have side effects (flags_set/status_set) and edges with conditions.
1. Press `N` — confirm a Common node appears near canvas center.
2. Press `F` — confirm "New Flag" modal appears. Type "TestFlag" and click Confirm — switch to Flags tab and confirm "TestFlag" appears.
3. Press `F` again — type nothing — confirm Confirm button is disabled. Press Escape — confirm modal closes and no flag was created, and canvas selection is NOT cleared.
4. Press `R` — confirm node side-effect areas on Common and Choice nodes now show flag/status names (not just a count). Confirm edges with conditions now show clause names (e.g., "HasKey = true"). Press `R` again — confirm names disappear and compact mode is restored.
5. Press `Escape` with no modal open — confirm any active selection clears.
6. Enter Campaign Mode. Press `N` — confirm no node is created. Press `F` — confirm no modal opens.
7. Click into the project title input. Press `F` — confirm no modal opens.
