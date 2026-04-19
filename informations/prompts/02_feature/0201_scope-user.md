<!-- 0201_scope-user.md -->

## ROLE
You are a feature analyst helping scope a new addition to a
working system. You surface what already exists so the user
only fills in what only they know about the new thing.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the feature must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. `/informations/docs/risk_register.md` — existing risks

## TASK
Read Part 1. Fill Part 2 based on the user's decisions
cross-referenced against the loaded files.
Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely. Then feed this
> file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_feature/ran_0201_scope.md`

---

## Part 1 — User fills

### Feature name
<!-- [SNAKE_CASE NAME] -->
Context_menus_keyboard_shortcuts_creation_bar

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
Adds three power-user interaction layers to the canvas. Right-click context menus surface actions based on what was clicked (canvas, node, edge, or multi-selection). A global keyboard shortcut system (N/C/E/F/S/Del/Space/V/I/L/R/Escape) triggers entity creation, deletion, and view actions from anywhere in the app. A dedicated creation bar in the top bar provides buttons for each entity type — Common, Choice, Ending, Flag, Status, Path, Chapter. Multi-select via Ctrl+click and drag-box enables bulk operations.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- Does not add Ctrl+K command palette (Later Update).
- Does not add toast notifications (Later Update) or minimap (Later Update).
- Does not restyle any existing UI — purely additive. later update handles polish.
- Does not change data model, simulation, or persistence.
- Does not add undo/redo — out of V3 scope.
- Does not add bulk drag-to-move beyond React Flow defaults.

### Why this feature is needed now
Current version only supports double-click-to-add-node and click-based interactions. For any non-trivial narrative, this is slow: every flag, status, path, chapter, and non-common node requires navigating to a sidebar tab and clicking "add." Context menus and shortcuts collapse these into single gestures.

Multi-select specifically unblocks the bulk operations that become viable in later update's command palette ("delete all selected") and the next update route tracing ("trace from any of these nodes").


### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| ADD | `src/components/ContextMenu.jsx` | Right-click menus for canvas/node/edge/multi-select |
| ADD | `src/hooks/useKeyboardShortcuts.js` | Global shortcut handler |
| ADD | `src/components/CreationBar.jsx` | Buttons for each entity type |
| MODIFY | `src/components/GraphCanvas.jsx` | Context menu triggers, multi-select, shortcut integration |
| MODIFY | `src/components/TopBar.jsx` | Mount creation bar |
| MODIFY | `vite.config.js` | Add `hooks/` path alias |


### Assumptions I am making
<!-- [LIST OR "NONE"] -->
This will come with a risk that I don't know how to mitigate:
- **Shortcut conflicts with browser defaults**. Ctrl+K is reserved for Push 12 command palette.     Don't claim it here. Avoid Ctrl+S (browser save), Ctrl+W (close tab), Ctrl+N (new window). Single-letter shortcuts only fire when canvas has focus.

- **Shortcut conflicts with form inputs**. Pressing N in a text field must type "n", not create a node. Handler must check `event.target` — bail if input/textarea/contenteditable.

- **Context menu vs. React Flow pane events**. React Flow has its own `onPaneContextMenu`. Wiring custom menu must call `event.preventDefault()` and suppress React Flow's default.

- **Multi-select state model breaking existing code**. `uiStore.selectedNodeId` is read by NodeInspector, GraphCanvas, ChoiceNode. Changing to array breaks all consumers. Keep `selectedNodeId` as "primary selection" and add `selectedNodeIds` for multi — or migrate cleanly with a compatibility selector.

- **Context menu positioning off-screen**. Right-click near viewport edge puts menu off-screen. Detect bounds, flip to left/up side.

- **Escape key already handled**. GraphCanvas clears selection on Escape (per codebase_features). Keyboard shortcuts hook must not double-handle or conflict.

---

## Part 2 — AI fills, user does not edit

### Related existing features
<!-- Cross-reference the user's feature description against
codebase_features.md. List every existing feature or component
that relates to, overlaps with, or will be affected by
this addition. -->

### Files to touch
<!-- Cross-reference against codebase_features.md.
List every file that must change to support this feature.
For each file state: MODIFY / CREATE -->

### Files to protect
<!-- List files that must not change under any circumstance —
especially stable core files the new feature will depend on.
For each file state: PROTECTED and why. -->

### Architecture rules relevant to this feature
<!-- List every rule from architecture_rules.md that this
feature must respect. For each rule, state why it is relevant. -->

### Relevant existing risks
<!-- Cross-reference against risk_register.md.
List any existing risks this feature touches or amplifies. -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0202 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Build the core logic without UI
- Phase 2: Wire UI to the logic
- Phase 3: Connect to existing data layer -->