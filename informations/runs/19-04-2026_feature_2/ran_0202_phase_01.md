# Phase 1 — Foundation

---

**Goal:** Establish the `hooks/` infrastructure, add `selectedNodeIds` to `uiStore`, scaffold the keyboard hook (listener wired, no action dispatch yet), migrate the ESC handler out of `GraphCanvas`, and wire React Flow's multi-select callback to `uiStore`.

---

## What it adds

- `src/hooks/` directory (new).
- `src/hooks/useKeyboardShortcuts.js` — stub hook. Attaches a `window.addEventListener('keydown', handler)` in `useEffect` and removes it on cleanup. Handler body contains the input-field guard and campaign-mode guard but dispatches no actions yet. Returns nothing.
- `vite.config.js` — new `hooks` alias: `hooks: path.resolve(__dirname, 'src/hooks')`.
- `src/store/uiStore.js` — new state field `selectedNodeIds: []`, new action `setSelectedNodeIds(ids)` that sets the array. Updated `clearSelection` to also set `selectedNodeIds: []`.
- `src/components/GraphCanvas.jsx`:
  - **Remove** the inline ESC `useEffect` (lines 49–57 in current source).
  - **Add** `useKeyboardShortcuts()` call inside `GraphCanvasInner` (one line).
  - **Add** `setSelectedNodeIds` from `useUIStore` destructuring.
  - **Add** `onSelectionChange` handler: `({ nodes }) => setSelectedNodeIds(nodes.map(n => n.id))`.
  - **Update** `derivedNodes` useMemo: change `selected` field to `selectedNodeIds.includes(node.id) || node.id === selectedNodeId` (add `selectedNodeIds` to dependency array).
  - **Pass** `onSelectionChange` prop to `<ReactFlow>`.

---

## Produces

| File | Status |
|---|---|
| `src/hooks/useKeyboardShortcuts.js` | NEW (stub) |
| `vite.config.js` | MODIFIED |
| `src/store/uiStore.js` | MODIFIED |
| `src/components/GraphCanvas.jsx` | MODIFIED |

---

## What it leaves temporarily incomplete

- `useKeyboardShortcuts.js` listens but dispatches nothing. All shortcut bindings are pending Phase 2.
- `ContextMenu.jsx` does not exist yet. Right-click still shows the browser context menu. Phase 3 completes this.
- `CreationBar.jsx` does not exist yet. Phase 4 completes this.
- `components/index.js` does not yet export `ContextMenu` or `CreationBar`. Phase 3 and 4 complete this.

---

## What the next phase depends on from this phase

- Phase 2 depends on `useKeyboardShortcuts.js` existing and being mounted in `GraphCanvas` — it fills in the dispatch body of this stub.
- Phase 2 depends on the `hooks/` Vite alias resolving cleanly.
- Phase 2 depends on `uiStore.selectedNodeIds` existing so `Del` shortcut can read the multi-select set.

---

## Reference files needed

- `vite.config.js` (current — to add alias cleanly alongside existing four)
- `src/store/uiStore.js` (current — to add field and update `clearSelection`)
- `src/components/GraphCanvas.jsx` (current — to remove inline ESC handler, mount hook, wire `onSelectionChange`)
- `ran_0202_risks.md` — RISK-CMK-03 (multi-select vs single-select field), RISK-CMK-06 (ESC migration)

---

## Rollback cost if this phase fails: LOW

- `vite.config.js` change: remove one line.
- `uiStore.js` change: remove `selectedNodeIds` field and `setSelectedNodeIds` action; revert `clearSelection`.
- `GraphCanvas.jsx` changes: restore the inline ESC `useEffect`, remove hook call, remove `onSelectionChange`, revert `derivedNodes`.
- Delete `src/hooks/` directory.
- No data is affected. The app reverts cleanly to its pre-feature state.

---

## Hard stop triggers

- Any console error on cold boot after changes.
- The `hooks` alias fails to resolve (Vite reports a module-not-found error for `hooks/useKeyboardShortcuts`).
- `selectedNodeIds` selector returns a new `[]` literal on every render (AR-14 violation — causes infinite re-render loop). Detection: open React DevTools Profiler; a component that reads `selectedNodeIds` must not show continuous re-renders when nothing is interacted with.
- `NodeInspector` stops showing a form after clicking a single node (RISK-CMK-03 materialized).
- Pressing Escape no longer clears selection (ESC migration failed).

---

## Acceptance Criteria

- Done when:
  1. The app boots without console errors.
  2. The `hooks/` alias resolves — importing `useKeyboardShortcuts` from `'hooks/useKeyboardShortcuts'` in `GraphCanvas` works.
  3. Clicking a single node sets `selectedNodeId` and shows the `NodeInspector` form — identical behavior to pre-feature.
  4. Pressing Escape clears selection (now handled by the hook stub's guard-only handler, or explicitly wired in the stub).
  5. Ctrl+clicking two nodes causes both to show as selected on the canvas (React Flow's visual selection, wired to `selectedNodeIds`).
  6. No keyboard shortcut letter keys trigger any action (dispatch is not yet implemented).

---

## Verification

Open the app.
1. Click a node — confirm the NodeInspector panel on the right still shows the node's form. *(Tests that selectedNodeId is intact.)*
2. Click on empty canvas — confirm the inspector clears. Press Escape — confirm selection clears.
3. Ctrl+click two different nodes — confirm both are visually selected (highlighted) on the canvas.
4. While a text input is focused (e.g., click the project title field at the top), press N, C, E — confirm no new nodes appear.
5. Open the browser console — confirm zero errors.
