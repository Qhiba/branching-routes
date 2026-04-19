# Scope Report — Context_menus_keyboard_shortcuts_creation_bar

**Generated:** 2026-04-19
**Prompt:** `0201_scope-user.md`
**Run folder:** `19-04-2026_feature_2/`

---

## Part 1 — User Input (reproduced)

**Feature name:** `Context_menus_keyboard_shortcuts_creation_bar`

**What it does:** Adds three power-user interaction layers to the canvas. Right-click context menus surface actions based on what was clicked (canvas, node, edge, or multi-selection). A global keyboard shortcut system (N/C/E/F/S/Del/Space/V/I/L/R/Escape) triggers entity creation, deletion, and view actions from anywhere in the app. A dedicated creation bar in the top bar provides buttons for each entity type — Common, Choice, Ending, Flag, Status, Path, Chapter. Multi-select via Ctrl+click and drag-box enables bulk operations.

**What it does NOT do:**
- Does not add Ctrl+K command palette (Later Update).
- Does not add toast notifications (Later Update) or minimap (Later Update).
- Does not restyle any existing UI — purely additive. Later update handles polish.
- Does not change data model, simulation, or persistence.
- Does not add undo/redo — out of V3 scope.
- Does not add bulk drag-to-move beyond React Flow defaults.

**Definition of done:**

| Action | File | Detail |
|--------|------|--------|
| ADD | `src/components/ContextMenu.jsx` | Right-click menus for canvas/node/edge/multi-select |
| ADD | `src/hooks/useKeyboardShortcuts.js` | Global shortcut handler |
| ADD | `src/components/CreationBar.jsx` | Buttons for each entity type |
| MODIFY | `src/components/GraphCanvas.jsx` | Context menu triggers, multi-select, shortcut integration |
| MODIFY | `src/components/TopBar.jsx` | Mount creation bar |
| MODIFY | `vite.config.js` | Add `hooks/` path alias |

**User-stated assumptions / known risks:**
1. Shortcut conflicts with browser defaults — single-letter shortcuts only; Ctrl+K reserved; avoid Ctrl+S/W/N.
2. Shortcut conflicts with form inputs — bail if `event.target` is input/textarea/contenteditable.
3. Context menu vs. React Flow pane events — must call `event.preventDefault()` and suppress React Flow's native `onPaneContextMenu`.
4. Multi-select state model — keep `selectedNodeId` as primary; add `selectedNodeIds` for multi, or migrate cleanly.
5. Context menu positioning off-screen — detect viewport bounds and flip position.
6. Escape key double-handling — `GraphCanvas` already clears selection on Escape; keyboard hook must not conflict.

---

## Part 2 — AI Analysis

### Related Existing Features

| Existing Feature / Component | Relationship |
|---|---|
| **`GraphCanvas.jsx`** | The primary integration site. Already owns `onPaneContextMenu` (implicit via React Flow), `onNodeClick`, `onEdgeClick`, `onConnect`, drag, double-click-to-add-node, and ESC key → `clearSelection`. All three new layers (context menus, shortcuts, creation bar wiring) touch this file. |
| **`uiStore.js` — `selectedNodeId` / `selectedEdgeId`** | The feature introduces multi-select. `selectedNodeId` is read by `NodeInspector`, `GraphCanvas`, and `ChoiceNode`. Any multi-select implementation must extend `uiStore` without breaking these consumers. `clearSelection` and `clearIfSelected` actions interact with the same selection surface. |
| **`uiStore.js` — `clearSelection` / `resetSelection`** | The proposed ESC key shortcut must cooperate with the existing `clearSelection` call in `GraphCanvas`. |
| **`TopBar.jsx`** | The creation bar mounts here. `TopBar` already holds New/Import/Export/Tidy/Snap controls and the `CampaignSelector`. The new `CreationBar` must fit alongside these without restructuring the layout. All authoring controls are locked during campaign mode (`disabled={isCampaignActive}`) — this pattern must apply to `CreationBar` buttons too. |
| **`narrativeStore.js` — `addNode`, `addEdge`, `addFlag`, `addStatus`, `addPath`, `addChapter`, `deleteNode`, `deleteEdge`** | Every shortcut and context menu action that creates or deletes an entity calls one of these store actions. No direct data mutation is allowed (AR-04). |
| **`simulationStore.js` — `isCampaignActive`, `orphanedNodeIds`, `unreachableNodeIds`** | Shortcuts and context menus must be disabled (or guarded) during campaign mode — the same pattern as authoring controls. The passive analysis that produces warning badges is unaffected but good to note as a read-dependent on the node list. |
| **`NodeInspector.jsx` / `EdgeInspector.jsx`** | Both read `selectedNodeId` / `selectedEdgeId` from `uiStore`. If multi-select is introduced as a parallel field (`selectedNodeIds`), these components are unaffected. If `selectedNodeId` itself becomes null during multi-select, NodeInspector will render its empty state — which is acceptable. |
| **`CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`** | All three read `selectedNodeId` for visual selection state (via React Flow's `selected` prop). Multi-select via React Flow's built-in selection will propagate selection to these components automatically through the React Flow `nodes` array's `selected` field — no changes needed to the node renderers themselves. |
| **`FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx`** | These panels provide creation UI for their entity types in the sidebar. The new shortcuts and context menus duplicate some of these creation actions. Both paths must call the same store actions — no divergence allowed (AR-04). |
| **`vite.config.js`** | Currently exports aliases for `components`, `store`, `utils`, `styles`. The `hooks/` directory is new and requires a path alias addition. |
| **`src/components/index.js`** | Barrel re-export for all components. `ContextMenu` and `CreationBar` must be added here after creation. |
| **`src/utils/uuid.js`** | `generateId(prefix)` is used by every entity creation action — new shortcut/menu-triggered creations will use the same call chain via store actions. No direct usage in hook or components. |

---

### Files to Touch

| File | Action | Reason |
|---|---|---|
| `src/components/ContextMenu.jsx` | **CREATE** | New component: context menu panel with dynamic action lists for canvas / node / edge / multi-select targets. |
| `src/hooks/useKeyboardShortcuts.js` | **CREATE** | New hook: `keydown` listener with target guard, campaign-mode guard, and action dispatch to store actions. Lives in `src/hooks/` (new directory). |
| `src/components/CreationBar.jsx` | **CREATE** | New component: horizontal bar of entity-creation buttons (Common, Choice, Ending, Flag, Status, Path, Chapter). |
| `src/components/GraphCanvas.jsx` | **MODIFY** | Wire `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu` → `ContextMenu` placement state. Integrate multi-select (`selectedNodeIds`). Wire `useKeyboardShortcuts` hook. |
| `src/components/TopBar.jsx` | **MODIFY** | Mount `<CreationBar />` inside the top bar. Apply `disabled={isCampaignActive}` guard to all creation bar buttons. |
| `src/store/uiStore.js` | **MODIFY** | Add `selectedNodeIds: []` state slice and `setSelectedNodeIds` / `addToSelection` / `clearSelection` (update existing) actions to support multi-select without breaking `selectedNodeId` consumers. |
| `vite.config.js` | **MODIFY** | Add `hooks` path alias pointing to `src/hooks/`. |
| `src/components/index.js` | **MODIFY** | Add `ContextMenu` and `CreationBar` barrel exports. |

> **Note on `src/hooks/`:** This is a new top-level directory under `src/`. It does not require a barrel `index.js` — `useKeyboardShortcuts` can be imported directly via the `hooks/` alias. If a barrel is added later, it must not create circular dependencies (AR-06).

---

### Files to Protect

| File | Status | Reason |
|---|---|---|
| `src/store/narrativeStore.js` | **PROTECTED** | Zero new actions needed. All entity creation/deletion triggered by shortcuts and menus routes through existing store actions (`addNode`, `deleteNode`, etc.). No new mutations. |
| `src/store/simulationStore.js` | **PROTECTED** | This feature does not touch simulation logic, passive analysis, or campaign lifecycle. Only reads `isCampaignActive` as a guard. |
| `src/store/campaignStore.js` | **PROTECTED** | No interaction with campaign data model. |
| `src/utils/fileSystem.js` | **PROTECTED** | No persistence changes. |
| `src/utils/conditionEvaluator.js` | **PROTECTED** | Pure utility; no shortcut or menu logic involves condition evaluation. |
| `src/utils/uuid.js` | **PROTECTED** | Used indirectly via store actions. |
| `src/components/NodeInspector.jsx` | **PROTECTED** | `selectedNodeId` primary selection is preserved; NodeInspector consumers are unaffected by the additive `selectedNodeIds` field. |
| `src/components/EdgeInspector.jsx` | **PROTECTED** | Same reasoning as `NodeInspector`. |
| `src/components/nodes/CommonNode.jsx` | **PROTECTED** | Node renderer; selection visual state comes from React Flow's `selected` prop and `useSimulationStore` for campaign states — neither changes. |
| `src/components/nodes/ChoiceNode.jsx` | **PROTECTED** | Same as `CommonNode`. |
| `src/components/nodes/EndingNode.jsx` | **PROTECTED** | Same as `CommonNode`. |
| `src/components/edges/ConditionalEdge.jsx` | **PROTECTED** | Edge renderer; no interaction model changes for edges beyond context menu wiring in `GraphCanvas`. |
| `src/components/SandboxPanel.jsx` | **PROTECTED** | Campaign-only panel; not touched by this feature. |
| `src/components/CampaignSelector.jsx` | **PROTECTED** | Campaign lifecycle UI; not touched by this feature. |
| `src/components/FlagManager.jsx` | **PROTECTED** | Flag creation remains the panel's responsibility. Shortcut-triggered flag creation calls the same store action — no UI changes to the panel itself. |
| `src/components/StatusManager.jsx` | **PROTECTED** | Same as `FlagManager`. |
| `src/components/PathChapterManager.jsx` | **PROTECTED** | Same as `FlagManager`. |
| `src/components/Sidebar.jsx` | **PROTECTED** | Tab/panel structure is unchanged. No new tabs required. |
| `src/styles/tokens.css` | **PROTECTED** | No new design tokens. Context menu styling handled inline or via `global.css`. |
| `src/main.jsx` | **PROTECTED** | Boot sequence and persistence wiring unchanged. |
| `src/App.jsx` | **PROTECTED** | Root layout unchanged — `CreationBar` mounts inside `TopBar`, not at the layout level. |
| `src/App.css` | **PROTECTED** | Grid layout unchanged. |

---

### Architecture Rules Relevant to This Feature

| Rule | Relevance |
|---|---|
| **AR-03 — State Management** | `selectedNodeIds` (the multi-select set) must live in `uiStore`, not in component local state. `ContextMenu` open/close position *may* be local state (UI-only concern). Keyboard shortcut handler state such as "last modifier pressed" may be local to the hook. |
| **AR-04 — Data Layer Separation** | All entity creations from shortcuts and context menus must call store actions (`addNode`, `addFlag`, etc.). The hook and menu components are read-only invokers; they never mutate store state directly. |
| **AR-05 — Single Source of Truth** | `selectedNodeIds` must be canonical in `uiStore`. `GraphCanvas` derives the React Flow `nodes` array's `selected` field from this when building the node list. No second copy of selection state may exist in `GraphCanvas` local state or the hook. |
| **AR-06 — Import Constraints** | The new `hooks/` directory needs a Vite alias. The hook imports from `store` (barrel) only. `useKeyboardShortcuts` must not import from `components/` (creating circular dependency with `GraphCanvas` which mounts the hook). `ContextMenu` and `CreationBar` barrel exports must be added to `components/index.js`. |
| **AR-08 — Simulation Isolation** | All shortcut and context menu creation actions must be gated on `!isCampaignActive`. Without this guard, pressing N during a campaign would create a new node — a direct violation of the authoring-locked-during-campaign principle. |
| **AR-12 — Node Type Structural Constraints** | If a context menu or shortcut creates an edge, `narrativeStore.addEdge()` already enforces that `EndingNode` IDs cannot be edge sources. The new code does not bypass this — it calls the same action. |
| **AR-14 — Zustand Selector Stability** | Any new selector in `uiStore` for `selectedNodeIds` must not return a new `[]` literal as a fallback. Use `undefined` or return the existing array reference. Any consumer component must default to `[]` outside the hook call. |
| **AR-16 — Campaign Visual State Vocabulary** | The context menu items and shortcut actions must never introduce new visual states on nodes. Status badges, warning overlays, and simulation state classes remain the exclusive domain of `simulationStore` and `global.css`. |

---

### Relevant Existing Risks

| Risk ID | Title | Amplification |
|---|---|---|
| **RISK-01** | Real-Time Simulation Causes React Flow Re-Render Storms | `ContextMenu` mounted conditionally in `GraphCanvas` adds a new render path. If `contextMenuState` (position + target) is stored in `GraphCanvas` local `useState`, it will not affect the store subscription pattern. Keep it local to avoid amplifying this risk. |
| **RISK-02** | Flag Name Collisions Break Condition Evaluation | Shortcut-triggered flag/status creation (`F`, `S` keys) calls `addFlag`/`addStatus`, which already validates unique names via the store. The new entrypoint does not bypass this guard — risk is not amplified. However: if the shortcut creates a flag/status with a generated default name (e.g., "Flag 1"), the designer needs to rename it to something meaningful. A bad name can still collide. Shortcut should focus the new item for immediate rename. |
| **RISK-04** | Graph Becomes Visually Unreadable at Medium Scale | Multi-select drag-box adds a new way to interact with dense graphs. React Flow's built-in selection box already exists; wiring it to `selectedNodeIds` in `uiStore` does not worsen readability. No amplification. |
| **RISK-05** | Simulation UX Ambiguity Without Clear Mode Indicator | Keyboard shortcuts firing during campaign mode would be a confusing UX regression. The AR-08 guard (`!isCampaignActive`) eliminates this. Without the guard, this risk reactivates. |

---

### New Risks Introduced

| Risk ID | Risk | Likelihood | Impact | Suggested Mitigation |
|---|---|---|---|---|
| **RISK-CMK-01** | Keyboard shortcut fires inside input fields | High | Medium | Check `event.target.tagName` — bail if `INPUT`, `TEXTAREA`, or `contentEditable === 'true'` before dispatching any action. |
| **RISK-CMK-02** | `onPaneContextMenu` / `onNodeContextMenu` / `onEdgeContextMenu` conflict with React Flow's default context handling | Medium | Medium | Call `event.preventDefault()` at the top of all three handlers. Verify React Flow does not swallow the event before the handler fires. |
| **RISK-CMK-03** | `selectedNodeId` vs `selectedNodeIds` consumer mismatch breaks NodeInspector | Medium | High | Keep `selectedNodeId` as the primary single-select field. Set it to the last clicked node even during multi-select. `selectedNodeIds` is additive. NodeInspector reads only `selectedNodeId` — it remains functional. |
| **RISK-CMK-04** | Context menu stays open after canvas scroll or node drag | Low | Low | Dismiss menu on `onMoveStart`, `onNodeDragStart`, and any `onClick` on the canvas outside the menu. |
| **RISK-CMK-05** | Context menu renders off-screen near viewport edges | Medium | Low | After positioning the menu at the cursor, compare `x + menuWidth` against `window.innerWidth` (and `y + menuHeight` against `window.innerHeight`). Flip to left/up side if overflow detected. |
| **RISK-CMK-06** | ESC key double-handling between `GraphCanvas` and `useKeyboardShortcuts` | Medium | Medium | The existing `GraphCanvas` ESC handler calls `clearSelection`. The new hook must not independently call `clearSelection` again (no double-fire). Solution: move ESC handling exclusively into the hook and remove the inline handler from `GraphCanvas`. |
| **RISK-CMK-07** | `CreationBar` node creation positions new node at canvas origin (0, 0) | Medium | Low | On creation, position the node at the current canvas viewport center. Use React Flow's `screenToFlowPosition` with the viewport midpoint, or default to the center of the React Flow instance's current view. |

---

### Suggested Phase Shape

**Phase 1 — Foundation: uiStore multi-select + vite.config alias + hook scaffold**
- Add `selectedNodeIds: []` state + `setSelectedNodeIds` to `uiStore`.
- Add `hooks/` Vite alias to `vite.config.js`.
- Create `src/hooks/useKeyboardShortcuts.js` as a stub that attaches/detaches the `keydown` listener with target guard and campaign-mode guard. No actions dispatched yet.
- Wire hook into `GraphCanvas` (mount only).
- Hard stop: `uiStore` tests pass; alias resolves; no console errors on mount.

**Phase 2 — Keyboard Shortcuts: full action dispatch**
- Implement all shortcut bindings: N (Common), C (Choice), E (Ending), F (Flag), S (Status), P (Path), H (Chapter), Del (delete selected), Escape (clear selection — migrate from GraphCanvas inline handler), V (toggle snap), L (tidy layout), R (toggle choice display mode), Space (tbd — frame selected).
- All creation shortcuts call store actions via `useNarrativeStore.getState()` and `useUIStore.getState()` (outside React subtree, from the hook).
- Hard stop: each shortcut fires the correct store action; no action fires during campaign mode; no action fires when cursor is in an input.

**Phase 3 — Context Menu**
- Create `ContextMenu.jsx`: render-on-demand panel, positioned at cursor, with action list derived from click target type (canvas / node / edge / multi-select).
- Wire `onPaneContextMenu`, `onNodeContextMenu`, `onEdgeContextMenu` into `GraphCanvas` state.
- Implement viewport-edge flip logic (RISK-CMK-05).
- Implement dismiss-on-scroll/drag (RISK-CMK-04).
- Add `ContextMenu` to `components/index.js`.
- Hard stop: right-click on each target type shows the correct menu; menu dismisses cleanly; all menu actions reach the store.

**Phase 4 — Creation Bar**
- Create `CreationBar.jsx`: horizontal strip of icon+label buttons for each entity type: Common, Choice, Ending, Flag, Status, Path, Chapter.
- Each button calls the matching store action and positions the new node at viewport center (RISK-CMK-07 mitigation).
- Mount `<CreationBar />` in `TopBar.jsx` with `disabled={isCampaignActive}` guard.
- Add `CreationBar` to `components/index.js`.
- Hard stop: every button creates the correct entity type; all buttons disabled during campaign mode; layout doesn't break the existing TopBar structure.
