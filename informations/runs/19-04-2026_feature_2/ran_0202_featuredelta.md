# Feature Delta — Context_menus_keyboard_shortcuts_creation_bar

---

## What the system does NOT have now

- **No context menus.** Right-clicking anywhere on the canvas (pane, node, edge) either does nothing or triggers the browser's native context menu. There is no application-level context menu for graph actions.
- **No keyboard shortcuts.** The only key event currently wired is `Escape` → `clearSelection()` in `GraphCanvas.jsx` (L49–57). There are no creation, deletion, or view shortcuts.
- **No creation bar.** There is no visual strip in the top bar to quickly create any entity type. Creating a non-Common node (Choice, Ending) or a metadata entity (Flag, Status, Path, Chapter) always requires navigating to a sidebar tab and using the panel form.
- **No multi-select.** `uiStore` tracks exactly one `selectedNodeId` and one `selectedEdgeId`. React Flow's drag-box selection is not wired to any store state; selecting multiple nodes via drag-box or Ctrl+click has no application-level effect.
- **No `src/hooks/` directory.** The project has no hook abstraction layer. All event listeners are inline effects in component files.
- **No `hooks` Vite alias.** `vite.config.js` exports four aliases: `components`, `store`, `utils`, `styles`. A hook cannot currently be imported with an absolute path.
- **No naming modal.** Creating a Flag, Status, Path, or Chapter in the sidebar panels requires typing a name in the panel's own input form. There is no quick-create modal triggered by shortcut or toolbar button.
- **No label display mode.** Nodes and edges display side-effect and condition information only as compact badges (counts and AND/OR pills). The actual flag and status names referenced by conditions or side effects are not shown on the canvas.

---

## What the system will have after this feature

- **Context menus** — right-click on the canvas pane, any node, any edge, or a multi-selection renders a positioned action list. Actions are scoped to the target type:
  - **Pane:** Add Common Node, Add Choice Node, Add Ending Node.
  - **Node (single):** Delete Node, Set as Start Node, Add [type] (same type as clicked).
  - **Edge:** Delete Edge.
  - **Multi-select:** Delete Selected.
  - Menu dismisses on Escape, click-outside, canvas pan start, and node drag start.
  - Menu flips position if it would overflow the viewport edge.
- **Keyboard shortcuts** — a global `keydown` listener (mounted once, in a dedicated hook) handles:
  - `N` → Add Common Node at viewport center
  - `C` → Add Choice Node at viewport center
  - `E` → Add Ending Node at viewport center
  - `F` → Open naming modal to create a Flag
  - `S` → Open naming modal to create a Status
  - `P` → Open naming modal to create a Path
  - `H` → Open naming modal to create a Chapter
  - `Del` → Delete selected node or edge
  - `Escape` → Clear selection (migrated from the inline effect in `GraphCanvas`)
  - `V` → Toggle Snap-to-Grid
  - `L` → Trigger Tidy Layout
  - `R` → Toggle Label Display Mode (compact ↔ verbose) — see below
  - All single-letter keys are guarded: fire only when canvas has focus (i.e., `event.target` is not an `INPUT`, `TEXTAREA`, or `contenteditable` element).
  - All authoring shortcuts are guarded: do not fire when `isCampaignActive === true`.
- **Naming modal (`NameModal.jsx`)** — a lightweight centered overlay with a text input and Confirm/Cancel buttons. Opens when:
  - A shortcut key (F, S, P, H) is pressed on the canvas.
  - A creation bar button (Flag, Status, Path, Chapter) is clicked.
  - A context menu creation item (Flag, Status, Path, Chapter) is selected.
  - The user types the name and confirms → the entity is created via the matching store action. Cancel → nothing is created.
- **Creation bar** — a horizontal strip of labelled buttons mounted in the `TopBar`. One button per entity type: Common, Choice, Ending, Flag, Status, Path, Chapter.
  - **Common, Choice, Ending** buttons: dispatch `canvas-add-node` event → node appears at viewport center.
  - **Flag, Status, Path, Chapter** buttons: open `NameModal` → entity created on confirm.
  - All buttons are `disabled` during campaign mode.
- **Label Display Mode (`R` shortcut)** — a `labelDisplayMode: 'compact' | 'verbose'` field in `uiStore`. When `'verbose'`:
  - **Common nodes and Choice nodes:** Side-effect indicators show the actual flag/status names that will be set on entry (e.g., "HasKey = true", "Gold += 10"), not just a count badge.
  - **Edges:** Condition badges show the flag/status names referenced in each clause (e.g., "HasKey = true AND Gold ≥ 5"), not just the AND/OR pill.
  - When `'compact'` (default): existing visual behavior is unchanged — compact badges only.
  - This requires `CommonNode`, `ChoiceNode`, and `ConditionalEdge` to read `labelDisplayMode` from `uiStore` and look up flag/status names from `narrativeStore`.
- **Multi-select state in `uiStore`** — a `selectedNodeIds: []` field tracks the set of currently selected nodes. React Flow's native Ctrl+click and drag-box selection are wired to write into this field via `setSelectedNodeIds` on `onSelectionChange`. The existing `selectedNodeId` (single) is unchanged and remains the primary selection signal for `NodeInspector`.

---

## What existing behaviour is identical in both

- Double-click on the canvas pane creates a Common Node at the cursor position. This is unchanged.
- Click on a node calls `selectNode(id)` and sets `selectedNodeId`. NodeInspector still responds to this.
- Click on an edge calls `selectEdge(id)` and sets `selectedEdgeId`. EdgeInspector still responds to this.
- Campaign mode advance-by-click is unchanged.
- All CRUD store actions (`addNode`, `deleteNode`, `addEdge`, etc.) are unchanged — shortcuts, menus, and the creation bar are new call sites only.
- Dagre Tidy Layout logic is unchanged — `L` shortcut dispatches the existing `graph-layout-tidy` custom event.
- All sidebar panels (FlagManager, StatusManager, PathChapterManager, NodeInspector, EdgeInspector) are unchanged — they remain the primary authoring path for these entities.
- All simulation, campaign, and persistence behaviour is unchanged.
- Snap-to-Grid toggle (`V` shortcut) calls the existing `toggleSnapToGrid` action — no change to the action itself.
- All schema and export/import behaviour is unchanged.
- Node, Edge compact badge rendering (side-effect count, AND/OR pill) is the default — `labelDisplayMode` defaults to `'compact'` so the out-of-the-box experience is identical to before the feature.
