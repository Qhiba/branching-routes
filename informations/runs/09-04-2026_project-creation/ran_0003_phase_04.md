# Phase 04 — Sidebar Inspectors & Flag Manager

## Goal
Allow the designer to create and edit nodes, define flags (boolean and numerical variables), and set conditional logic on edges through form panels in the sidebar. This phase makes the graph data meaningful.

## Produces
- `src/components/Sidebar.jsx`
- `src/components/NodeInspector.jsx`
- `src/components/EdgeInspector.jsx`
- `src/components/FlagManager.jsx`

## Dependencies Required Before This Phase
- Phase 01 complete (styles and tokens)
- Phase 02 complete (stores and their actions all implemented)
- Phase 03 complete (canvas selection system works — `selectedNodeId`, `selectedEdgeId` populated)

## Reference Documents
- `ran_0003_architecture.md` — AR-03 (state in stores), AR-04 (no component mutation)
- `ran_0003_datamodel.md` — Node, Edge, Flag, Condition, Clause, SideEffect shapes
- `ran_0003_filemap.md` — `Sidebar`, `NodeInspector`, `EdgeInspector`, `FlagManager`
- `ran_0003_risks.md` — RISK-02 (flag deletion with reference check)

## Steps

### 1. `src/components/Sidebar.jsx`

Renders the right panel. Two tabs:
- **Inspector** tab — shows `<NodeInspector />` when a node is selected, `<EdgeInspector />` when an edge is selected, or a placeholder "Select a node or edge to inspect" when nothing is selected.
- **Flags** tab — always shows `<FlagManager />`

Internal `useState` tracks the active tab (`'inspector' | 'flags'`). Reads `selectedNodeId` and `selectedEdgeId` from `graphStore` to know what to render.

### 2. `src/components/NodeInspector.jsx`

Reads the selected node from `graphStore` using `selectedNodeId`. Displays a form with:

**Label field:** `<input type="text">` bound to `node.label`. Calls `graphStore.updateNode(id, { label })` on change.

**Content field:** `<textarea>` bound to `node.content`. Calls `graphStore.updateNode(id, { content })` on change.

**Set as Start Node:** A `<button>` that calls `graphStore.setStartNode(id)`. Disabled and labelled "Start Node ✓" if `node.isStartNode` is already true.

**Side Effects section:** Lists existing `sideEffects`. For each:
- Dropdown to select a flag (populated from `graphStore.flags`)
- Dropdown for `operation` (`set`, `add`, `subtract`)
- Input for `value` (boolean checkbox or number input based on flag type)
- Delete button to remove the side effect

"Add Side Effect" button appends a new blank side effect to the node.

All updates call `graphStore.updateNode(id, { sideEffects: [...] })`.

**Delete Node:** A danger `<button>` at the bottom. Calls `graphStore.deleteNode(id)`.

### 3. `src/components/EdgeInspector.jsx`

Reads the selected edge from `graphStore` using `selectedEdgeId`. Displays a form with:

**Label field:** `<input type="text">` bound to `edge.label`. Calls `graphStore.updateEdge(id, { label })` on change.

**Condition section:**
- Toggle: "Add Condition" / "Remove Condition" button — sets `condition` to `{ operator: 'AND', clauses: [] }` or `null`
- When condition exists:
  - `operator` toggle between `AND` and `OR` (two radio buttons or a segmented control)
  - List of clauses, each with:
    - Flag dropdown (populated from `graphStore.flags`)
    - Comparator dropdown (`==`, `!=`, `>`, `>=`, `<`, `<=`)
    - Value input (boolean checkbox or number based on flag.type of selected flag)
    - Delete clause button
  - "Add Clause" button — appends blank clause

All updates call `graphStore.updateEdge(id, { condition })`.

**Side Effects section:** Identical UI to NodeInspector's side effects panel, but writes to the **edge's** `sideEffects` array. These fire when the player picks this choice, before arriving at the destination node.
- Lists existing edge `sideEffects`, each with a flag dropdown, operation dropdown, value input, and delete button
- "Add Side Effect" button appends a blank entry
- All updates call `graphStore.updateEdge(id, { sideEffects: [...] })`

**Execution order note:** Display a small inline hint below the side effects panel: _"Edge effects run first, then the destination node's effects."_

**Delete Edge:** A danger `<button>` at the bottom. Calls `graphStore.deleteEdge(id)`.

**Important:** If `graphStore.flags` is empty, show a helper message: "No flags defined yet. Add flags in the Flags tab first." The condition section inputs should be disabled or hidden when no flags exist.

### 4. `src/components/FlagManager.jsx`

Displays and manages the flags array from `graphStore`.

**Flag list:** For each flag:
- Name (displayed as code/monospace)
- Type badge (`boolean` or `number`)
- Default value display
- Edit button (inline editing or modal — inline preferred)
- Delete button — calls `graphStore.deleteFlag(id)`. If the store returns `{ blocked: true, references }`, display a modal/alert showing which edges (condition clauses or side effects) and nodes (side effects) reference this flag, and block deletion until the user removes those references (RISK-02 mitigation).

**Add Flag form** (always visible at the bottom of the list):
- `<input type="text">` for name, with live validation: shows an error if the name contains characters other than `[a-zA-Z0-9_]` or if the name already exists
- Type dropdown: `boolean` / `number`
- Default value input: checkbox (`boolean`) or number input (`number`)
- "Add Flag" submit button — disabled if name is invalid

Calls `graphStore.addFlag(name, type, defaultValue)`.

## Acceptance Criteria
- Done when:
  1. Clicking a node opens the NodeInspector with the correct label populated
  2. Editing the label in the form updates the node label on the canvas in real time
  3. A new flag can be added with name `has_key`, type `boolean`, default `false`
  4. Clicking a connecting edge opens the EdgeInspector with both condition controls AND a side effects panel
  5. Adding a side effect to an edge saves correctly (verifiable via `graphStore.getState().edges` in console)
  6. Attempting to delete a flag referenced by an edge side effect (not just a condition clause) shows a blocking warning

## Verification
1. Double-click the canvas to create two nodes and connect them with an edge
2. Click Node 1 → sidebar shows NodeInspector with label field
3. Change label to "Introduction" → the node card on the canvas updates immediately
4. Switch to Flags tab → add flag `player_score` (number, default 0)
5. Click the edge → EdgeInspector opens → add condition: `player_score >= 5`
6. In the same EdgeInspector → add a side effect: `player_score set 10`
7. Check DevTools: `useGraphStore.getState().edges[0].sideEffects` — confirm one entry with `operation: 'set'` and `value: 10`
8. Go back to Flags tab → attempt to delete `player_score` → a warning appears listing both the referenced condition clause AND the side effect on the edge
9. Confirm zero console errors throughout

## Next Phase Dependency
Phase 05 requires `FlagManager` (flags exist in store), `NodeInspector` (side effects can be configured), `EdgeInspector` (conditions are set on edges), and the `graphStore.setStartNode` action, all of which are implemented here.
