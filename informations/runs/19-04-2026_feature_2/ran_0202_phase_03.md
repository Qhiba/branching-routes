# Phase 3 — Context Menu

---

**Goal:** Build `ContextMenu.jsx` and wire all four right-click targets in `GraphCanvas` — with correct positioning, viewport-edge flip, and dismiss logic.

---

## What it adds

- `src/components/ContextMenu.jsx` — new component:
  - Receives props: `x`, `y`, `type` (`'pane' | 'node' | 'edge' | 'multi'`), `targetId`, `onClose`.
  - Renders an absolutely-positioned `<div>` at `{ left: x, top: y }` (or flipped if overflow detected).
  - **Viewport-edge flip logic:** After positioning, check `x + MENU_WIDTH > window.innerWidth` → flip to `left: x - MENU_WIDTH`. Check `y + estimatedHeight > window.innerHeight` → flip to `top: y - estimatedHeight`. Use a `ref` on the menu div + `useLayoutEffect` to measure actual rendered size and re-position if needed.
  - **Action lists by type:**
    - `'pane'`: "Add Common Node" → dispatch `canvas-add-node` `{ type: 'common', x, y }` (positioned at right-click location), "Add Choice Node", "Add Ending Node".
    - `'node'` (single): "Delete Node" → `narrativeStore.deleteNode(targetId)`, "Set as Start Node" → `narrativeStore.setStartNode(targetId)`.
    - `'edge'`: "Delete Edge" → `narrativeStore.deleteEdge(targetId)`.
    - `'multi'`: "Delete Selected (N nodes)" → iterates `selectedNodeIds` from `uiStore`, calls `deleteNode` for each.
  - All actions call `onClose()` immediately after dispatching.
  - Renders `null` when `type` is null/undefined.
  - Has no Zustand subscriptions of its own — receives all data it needs via props from `GraphCanvas`.

- `src/components/GraphCanvas.jsx` — additions:
  - `contextMenuState` local `useState({ visible: false, x: 0, y: 0, type: null, targetId: null })`.
  - `onPaneContextMenu(event)` handler: `event.preventDefault()`, set state to `{ visible: true, x: event.clientX, y: event.clientY, type: 'pane', targetId: null }`.
  - `onNodeContextMenu(event, node)` handler: `event.preventDefault()`, set state to `{ visible: true, x: event.clientX, y: event.clientY, type: selectedNodeIds.length > 1 ? 'multi' : 'node', targetId: node.id }`.
  - `onEdgeContextMenu(event, edge)` handler: `event.preventDefault()`, set state to `{ visible: true, x: event.clientX, y: event.clientY, type: 'edge', targetId: edge.id }`.
  - Dismiss handler `closeContextMenu` → sets `visible: false`. Wired to:
    - `onMoveStart` prop on `<ReactFlow>` (canvas pan start).
    - `onNodeDragStart` is already defined — add `closeContextMenu()` call at start.
    - `onPaneClick` — add `closeContextMenu()` call at start.
  - Render `<ContextMenu />` inside the canvas wrapper div (above `<ReactFlow>`), conditionally on `contextMenuState.visible`.
  - Pass `onSelectionChange` to wire multi-select (already from Phase 1, no change needed here).

- `src/components/index.js` — add `export { default as ContextMenu } from './ContextMenu';`.

- `src/styles/global.css` — additive block for `.context-menu` styles:
  - `position: fixed; z-index: 1000; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 160px; padding: 4px 0; overflow: hidden;`
  - `.context-menu__item`: `display: block; width: 100%; padding: 8px 16px; background: none; border: none; cursor: pointer; text-align: left; font-size: 0.875rem; color: var(--color-text);`
  - `.context-menu__item:hover`: `background: var(--color-surface-raised);`
  - `.context-menu__item--danger`: `color: var(--color-error);`

---

## Produces

| File | Status |
|---|---|
| `src/components/ContextMenu.jsx` | NEW |
| `src/components/GraphCanvas.jsx` | MODIFIED |
| `src/components/index.js` | MODIFIED |
| `src/styles/global.css` | MODIFIED (additive) |

---

## What it leaves temporarily incomplete

- `CreationBar.jsx` does not exist (Phase 4).
- The `'pane'` right-click menu's "Add Common/Choice/Ending Node" places the node at the click coordinates in flow-space. This requires passing the `event` coordinates through `screenToFlowPosition` at menu action time. The `screenToFlowPosition` function is available in `GraphCanvasInner` (via `useReactFlow()`) but not in `ContextMenu.jsx`. Solution: `ContextMenu` dispatches `canvas-add-node` with `{ type, screenX: x, screenY: y }`, and `GraphCanvas` handles the `screenToFlowPosition` conversion in the `canvas-add-node` listener — which now accepts optional `screenX`/`screenY` to override the default viewport center placement.

---

## What the next phase depends on from this phase

- Phase 4 (`CreationBar`) does not depend on `ContextMenu`. The phases are parallel — Phase 4 can be executed immediately after Phase 2 if desired.
- The `canvas-add-node` event enhancement (optional `screenX`/`screenY`) from Phase 3 is already available to Phase 4 for any future positional override need.

---

## Reference files needed

- `src/components/ContextMenu.jsx` (new — this phase creates it)
- `src/components/GraphCanvas.jsx` (Phase 1 state — for existing handler signatures and `selectedNodeIds` availability)
- `src/store/narrativeStore.js` — `deleteNode`, `deleteEdge`, `setStartNode` action signatures
- `src/store/uiStore.js` — `selectedNodeIds` (for multi-select count in menu label)
- `src/styles/global.css` — existing CSS variable names to use (`--color-surface`, `--color-border`, etc.)
- `ran_0202_risks.md` — RISK-CMK-02 (event.preventDefault), RISK-CMK-04 (dismiss on scroll/drag), RISK-CMK-05 (viewport flip)

---

## Rollback cost if this phase fails: LOW

- Delete `ContextMenu.jsx`.
- Revert `GraphCanvas.jsx` to Phase 1 state (remove `contextMenuState`, three context menu handlers, dismiss wiring, `<ContextMenu />` render).
- Revert `components/index.js` (remove `ContextMenu` export).
- Revert `global.css` additive block (remove `.context-menu` styles).
- Phase 1 and Phase 2 are completely intact. App reverts to keyboard-shortcuts-only state.

---

## Hard stop triggers

- Browser's native context menu appears on right-click (event.preventDefault not working — RISK-CMK-02 materialized).
- Context menu appears but is positioned off-screen with no flip (RISK-CMK-05 not implemented).
- Context menu stays open after panning the canvas (RISK-CMK-04 not implemented).
- "Delete Node" from context menu does not remove the node.
- "Set as Start Node" from context menu does not set the start node.
- "Delete Selected" on multi-select does not delete all selected nodes.
- Any context menu action fires during campaign mode (AR-08 violation).
- Clicking outside the menu does nothing (menu does not dismiss).

---

## Acceptance Criteria

- Done when:
  1. Right-clicking the empty canvas shows a "pane" menu with three Add options.
  2. Right-clicking a node shows a "node" menu with Delete and Set as Start.
  3. Right-clicking an edge shows an "edge" menu with Delete.
  4. Ctrl+clicking 3 nodes, then right-clicking one shows a "multi" menu with "Delete Selected (3 nodes)".
  5. All menu items execute the correct action.
  6. Menu dismisses on: click outside, canvas pan, node drag start, pressing Escape.
  7. Menu flips position when right-clicking near the right or bottom edge of the viewport.
  8. No menu appears or functions during campaign mode.

---

## Verification

Open the app with several nodes and edges connected.
1. Right-click on empty canvas space — confirm a menu appears with "Add Common Node", "Add Choice Node", "Add Ending Node". Click "Add Common Node" — confirm a new node appears near the right-click position.
2. Right-click on a node — confirm menu shows "Delete Node" and "Set as Start Node". Click "Delete Node" — confirm the node is removed.
3. Right-click on an edge — confirm menu shows "Delete Edge". Click it — confirm the edge is removed.
4. Ctrl+click 3 nodes. Right-click one of them — confirm menu shows "Delete Selected (3 nodes)". Click it — confirm all 3 are removed.
5. Right-click, then immediately pan the canvas — confirm the menu disappears.
6. Right-click very close to the right edge of the browser window — confirm the menu appears to the left of the cursor (does not overflow off-screen).
7. Enter Campaign Mode. Right-click on the canvas — confirm no application menu appears (only browser default or nothing).
