# ran_0303_phase_03 — Phase 3: Canvas and Node Renderer Migration

## Phase 3 — Canvas and Node Renderer Migration

**Goal:** Replace `StoryNode.jsx` with three dedicated node renderers (`CommonNode`, `ChoiceNode`, `EndingNode`) and update `GraphCanvas.jsx` to derive React Flow nodes from the three sub-collections. Resolve the temporary canvas inconsistency introduced in Phase 1.

---

**What it changes:**

- **NEW** `src/components/nodes/CommonNode.jsx`:
  - Contains simulation state hooks: `isActive`, `isVisited`, `isReachable` from `simulationStore`.
  - CSS class application: `story-node`, `story-node--active`, `story-node--visited`, `story-node--reachable`.
  - Renders: label, content, side-effects badge (count of `data.sideEffects`).
  - Handles: target (left), source (right).

- **NEW** `src/components/nodes/ChoiceNode.jsx`:
  - Same simulation state hooks as `CommonNode`.
  - Same CSS class scheme as `CommonNode` (or a distinct `choice-node` class if a visual distinction is desired — the class name is an authoring decision flagged here).
  - Renders: label, content, side-effects badge. Visually distinguishes choice intent (e.g., header suffix or badge).
  - Handles: target (left), source (right).

- **NEW** `src/components/nodes/EndingNode.jsx`:
  - Same simulation state hooks as `CommonNode`.
  - Renders: label, content, side-effects badge, "END" indicator.
  - **No source handle** — unconditionally absent. Reinforces AR-12.
  - No `data.isEndNode` prop required or checked.

- **MODIFIED** `src/components/GraphCanvas.jsx`:
  - Import: remove `StoryNode`. Add `CommonNode`, `ChoiceNode`, `EndingNode`.
  - `nodeTypes`: `{ commonNode: CommonNode, choiceNode: ChoiceNode, endingNode: EndingNode }`.
  - Destructure from `narrativeStore`: `common, choice, ending` instead of `nodes`.
  - `derivedNodes` useMemo: merge the three collections —
    - `Object.values(common)` → `type: 'commonNode'`
    - `Object.values(choice)` → `type: 'choiceNode'`
    - `Object.values(ending)` → `type: 'endingNode'`
    - Output per entry: `{ id, type, position, selected, data }` (same contract as before).
    - Remove `data.isEndNode` augmentation.
  - `reactFlowEdges` useMemo: remove `sideEffects: edge.sideEffects` from the `data` object.
  - All other logic unchanged.

- **MODIFIED** `src/components/index.js`:
  - Remove `export StoryNode`.
  - Add `export CommonNode`, `export ChoiceNode`, `export EndingNode`.

- **DELETED** `src/components/nodes/StoryNode.jsx`:
  - Deleted at the end of this phase, after `GraphCanvas` no longer imports it.

---

**Produces:**
- `src/components/nodes/CommonNode.jsx` — new
- `src/components/nodes/ChoiceNode.jsx` — new
- `src/components/nodes/EndingNode.jsx` — new
- `src/components/GraphCanvas.jsx` — modified
- `src/components/index.js` — modified
- `src/components/nodes/StoryNode.jsx` — deleted

---

**Migration step:** NONE
No persisted data is touched in this phase. All changes are UI rendering only.

---

**What it leaves temporarily inconsistent:**

- `NodeInspector.jsx` still uses `state.nodes.find(...)` to locate the selected node. After Phase 3, this selector returns `undefined` for all nodes (since `narrativeStore.nodes` no longer exists). The inspector panel will be blank for all nodes until Phase 4 fixes it. This is a visible but non-crashing inconsistency.
- **Resolved by:** Phase 4.

---

**What the next phase depends on from this phase:**
- Phase 4 assumes `GraphCanvas` correctly identifies node type and passes it in node `data` or via prop. `NodeInspector` will need to know a node's collection type — the store lookup strategy needs to resolve identity by sub-collection.

---

**Reference files needed:**
- `src/components/GraphCanvas.jsx`
- `src/components/nodes/StoryNode.jsx`
- `src/components/index.js`
- `src/store/narrativeStore.js` (to confirm `common`, `choice`, `ending` shape)
- `ran_0303_behaviordelta.md`
- `ran_0303_filemap.md`

---

**Rollback cost if this phase fails:** MEDIUM
Three new files are created and two are modified. Rollback means deleting the three new files and reverting `GraphCanvas.jsx` and `components/index.js`. `StoryNode.jsx` must be restored from version control. No store or data changes are involved.

---

**Hard stop triggers for this phase:**

- If the `derivedNodes` merge produces a node with `type: undefined` (e.g., because a node's collection could not be determined) — **STOP**. React Flow will silently drop nodes with unrecognized types.
- If removing `data.isEndNode` from the derived node causes any remaining conditional in the codebase to fail — **STOP** and audit all references to `isEndNode` before proceeding.
- If `EndingNode.jsx` inadvertently renders a source handle (check rendered DOM) — **STOP**. AR-12 UI enforcement must hold.

---

**Acceptance Criteria:**

Done when:
1. App loads without console errors.
2. All three node types render visually on the canvas.
3. `EndingNode` has no outgoing handle visible or interactable.
4. Dragging any node updates its position without loss.
5. Simulation mode: clicking a reachable common or choice node advances simulation.
6. Simulation mode: clicking an ending node correctly terminates the path.
7. `StoryNode.jsx` is deleted and no import reference to it remains in the codebase.

---

**Verification:**

Open the app. Add three nodes using double-click. In the canvas toolbar or inspector (if available), change one to `ending` type. Confirm that:
- The ending node visually differs from the common node.
- The ending node has no outgoing handle.
- You can connect from a common node to the ending node.
- You cannot connect from the ending node outward (the handle is absent; attempting to drag from it does nothing).
- Drag each node to a new position and release — all three stay in place.
- Start simulation. Click a reachable node. Confirm simulation advances. Continue until you reach the ending node. Confirm the simulation stops.
