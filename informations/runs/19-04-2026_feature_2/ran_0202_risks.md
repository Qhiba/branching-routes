# Risk Register — Context_menus_keyboard_shortcuts_creation_bar

> All RISK-CMK IDs are new to this feature. Existing RISK-01 through RISK-CSH-06 from the master register are unchanged.

---

| # | Risk | Likelihood | Impact | Phase | Status |
|---|---|---|---|---|---|
| RISK-CMK-01 | Keyboard shortcut fires inside input fields | High | Medium | Phase 2 | OPEN |
| RISK-CMK-02 | Context menu conflicts with React Flow pane event handling | Medium | Medium | Phase 3 | OPEN |
| RISK-CMK-03 | `selectedNodeId` vs `selectedNodeIds` consumer mismatch breaks NodeInspector | Medium | High | Phase 1 | OPEN |
| RISK-CMK-04 | Context menu stays open after canvas scroll or node drag | Low | Low | Phase 3 | OPEN |
| RISK-CMK-05 | Context menu renders off-screen near viewport edges | Medium | Low | Phase 3 | OPEN |
| RISK-CMK-06 | ESC key double-handling between `GraphCanvas` inline handler and new hook | Medium | Medium | Phase 1 | OPEN |
| RISK-CMK-07 | `CreationBar` / shortcut node creation positions at canvas origin (0, 0) | Medium | Low | Phase 4 | OPEN |
| RISK-CMK-08 | ESC inside `NameModal` simultaneously clears canvas selection | High | Medium | Phase 2 | OPEN |
| RISK-CMK-09 | `NameModal` opens during campaign mode via shortcut or creation bar | Low | Medium | Phase 2 | OPEN |

---

## RISK-CMK-01 — Keyboard Shortcut Fires Inside Input Fields

**Description:** Single-letter shortcuts (N, C, E, F, S, P, H) are indistinguishable from normal typing. If a designer is editing a node label or flag name in any text input, pressing N must type "n" — not create a new Common Node.

**Likelihood:** High — designers constantly type in node label/content fields, flag name inputs, and the `TopBar` title field.

**Impact:** Medium — pressing a shortcut in an input creates an unwanted entity but does not corrupt data. It is annoying and produces orphaned entities the designer must delete.

**Early detection signal:** In Phase 2, click into the node label input in `NodeInspector`, then press N. If a new node appears on the canvas, this risk has materialized.

**Mitigation:** At the top of the `keydown` handler: `const tag = e.target.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;`

---

## RISK-CMK-02 — Context Menu Conflicts With React Flow Pane Event Handling

**Description:** React Flow handles pane mouse events for panning and zooming. A right-click on the pane fires React Flow's own `onPaneContextMenu` callback before the browser's default context menu. If `event.preventDefault()` is not called, the browser menu appears on top of ours. If React Flow internally swallows or transforms the event before the handler receives it, position data (`clientX`, `clientY`) may be wrong.

**Likelihood:** Medium — React Flow's event handling pipeline is non-trivial; subtle differences between React synthetic events and native events can cause unexpected behavior.

**Impact:** Medium — wrong menu position or browser context menu overlay makes the feature unusable.

**Early detection signal:** In Phase 3, right-click on an empty canvas area. If both the browser context menu and the custom menu appear, `preventDefault()` was not effective. If the menu position is offset (e.g., top-left corner), event coordinates are wrong.

**Mitigation:** 
1. Call `event.preventDefault()` as the first line of all three context menu handlers.
2. Use `event.clientX` / `event.clientY` (not `event.pageX` / `event.pageY`) for menu position — React Flow uses viewport-relative coordinates.
3. Test on Chromium and Firefox independently (Firefox handles synthetic events differently with `stopPropagation`).

---

## RISK-CMK-03 — selectedNodeId vs selectedNodeIds Consumer Mismatch

**Description:** `NodeInspector`, `EdgeInspector`, and campaign advance-by-click in `GraphCanvas` all depend on `selectedNodeId` (singular). If the Phase 1 changes accidentally clear `selectedNodeId` when `selectedNodeIds` is populated (e.g., during drag-box selection), `NodeInspector` will show its empty state and the inspector panel will appear to lose focus.

**Likelihood:** Medium — the `onSelectionChange` callback fires for both single-click and drag-box selections. If Phase 1 routes all selection through `setSelectedNodeIds` and stops setting `selectedNodeId`, this breaks `NodeInspector`.

**Impact:** High — `NodeInspector` becomes non-functional for single-node editing, which is the primary authoring workflow.

**Early detection signal:** In Phase 1, click a single node. If `NodeInspector` no longer shows the node's form, `selectedNodeId` is being cleared by the new selection wiring.

**Mitigation:** 
- `onSelectionChange` only writes to `selectedNodeIds`. Single-node `onNodeClick` continues to call `selectNode(id)` (which sets `selectedNodeId`) exactly as before.
- The `derivedNodes` `selected` field uses `selectedNodeIds.includes(node.id) || node.id === selectedNodeId` so both sources propagate to React Flow.
- `setSelectedNodeIds` is **never** called from `onNodeClick` — only from `onSelectionChange`.

---

## RISK-CMK-06 — ESC Key Double-Handling

**Description:** `GraphCanvas.jsx` currently has an inline `useEffect` that adds a `keydown` listener for Escape → `clearSelection()` (L49–57). The new hook also handles Escape → `clearSelection()`. If both coexist simultaneously in Phase 1, pressing Escape calls `clearSelection()` twice per keypress — which is harmless functionally but is a structural violation (two competing listeners for the same key) and could mask future bugs.

**Likelihood:** Medium — easy to overlook when writing Phase 1, especially if the inline handler is not explicitly removed.

**Impact:** Medium — double-call is functionally benign now but breaks the "single authoritative keyboard handler" invariant. A future developer adding side effects to Escape handling would need to know to update two places.

**Early detection signal:** In Phase 1, search the codebase for `'Escape'` and `keydown`. If both `GraphCanvas.jsx` and `useKeyboardShortcuts.js` appear, the risk has materialized.

**Mitigation:** The inline `useEffect` block (GraphCanvas.jsx L49–57) is deleted as part of Phase 1. The migration is atomic: both the deletion and the hook mount happen in the same commit.

---

## RISK-CMK-07 — Node Creation at Canvas Origin

**Description:** When `addNode(position, type)` is called from a keyboard shortcut or the creation bar, a `position` must be provided. If the shortcut or button calls `addNode({ x: 0, y: 0 }, 'common')`, the new node appears at the canvas origin — which may be off-screen if the designer has panned away, making it invisible.

**Likelihood:** Medium — easy to forget to compute the viewport center; defaulting to `{ x: 0, y: 0 }` is the obvious first implementation.

**Impact:** Low — the node is created and can be found via Tidy Layout. It is confusing but not data-corrupting.

**Early detection signal:** In Phase 2, press N on the keyboard. If no new node is visible on the current canvas view, it was placed at the origin.

**Mitigation:**
- **Keyboard hook:** The hook is outside React; it cannot call `useReactFlow()`. Instead, it dispatches a custom event (e.g., `canvas-add-node`) carrying the `type` payload. `GraphCanvas` listens for this event and calls `addNode(screenToFlowPosition(viewportCenter), type)` where `viewportCenter` = `{ x: window.innerWidth / 2, y: window.innerHeight / 2 }` (accounting for topbar/sidebar offset).
- **CreationBar:** Is a React component, so it can receive `useReactFlow()` via a passed-down ref or by being rendered inside the `ReactFlowProvider` subtree. **Important:** `TopBar` is rendered outside `ReactFlowProvider` (in `App.jsx`). Therefore `CreationBar` cannot call `useReactFlow()` directly when mounted in `TopBar`. Mitigation: same custom event pattern as the keyboard hook — `CreationBar` dispatches `canvas-add-node` and `GraphCanvas` handles placement.

> **RULE CANDIDATE:** Components or hooks that need to trigger canvas-space operations (node creation at viewport center, fit-view, etc.) but live outside the `ReactFlowProvider` subtree should use the existing custom DOM event pattern (`window.dispatchEvent(new CustomEvent(...))`) already established by the `graph-layout-tidy` event. This pattern should be formalized in AR-06 or a new rule after this feature ships.

---

## RISK-CMK-08 — ESC Inside NameModal Simultaneously Clears Canvas Selection

**Description:** The keyboard hook handles `Escape` → `clearSelection()` on the `window` `keydown` event. `NameModal` is a focused overlay; pressing Escape to dismiss it fires the same `keydown` event that the hook receives. Without intervention, the hook will call `clearSelection()` at the same moment the modal closes — producing a confusing double side-effect.

**Likelihood:** High — pressing Escape is the intuitive modal-dismiss gesture; it will be the first thing users try.

**Impact:** Medium — functionally harmless (selection was likely already clear while modal was open), but produces a subtle UX inconsistency where canvas selection state changes as a side effect of modal dismissal.

**Early detection signal:** In Phase 2, open the NameModal (press F), then press Escape. If the modal closes AND a previously selected node becomes visually deselected — or the inspector panel clears — the double-fire is occurring.

**Mitigation:** `NameModal.jsx` attaches its own `keydown` listener for Escape that calls `event.stopPropagation()` before calling `onClose()`. `stopPropagation` prevents the event from bubbling to the `window` listener in the keyboard hook.

---

## RISK-CMK-09 — NameModal Opens During Campaign Mode

**Description:** The keyboard shortcut hook guards all actions on `isCampaignActive`. The `canvas-open-name-modal` event is dispatched by both the hook (F/S/P/H keys) and `CreationBar` buttons. If the `GraphCanvas` listener for this event does not independently guard on `isCampaignActive`, the modal could theoretically open during campaign mode via a timing or render race.

**Likelihood:** Low — two guard layers already exist: the hook bails on `isCampaignActive`, and `CreationBar` buttons are `disabled={isCampaignActive}`.

**Impact:** Medium — opening a naming modal during campaign mode could add unexpected narrative entities while a campaign is active.

**Early detection signal:** In Phase 2 or 4, enter campaign mode, then press F or click a (supposed-to-be-disabled) creation bar button. If the modal appears, one of the guard layers failed.

**Mitigation:** The `canvas-open-name-modal` listener inside `GraphCanvas` independently reads `useSimulationStore.getState().isCampaignActive` and bails if true — a third layer of defense.
