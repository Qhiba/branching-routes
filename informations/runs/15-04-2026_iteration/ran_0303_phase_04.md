# ran_0303_phase_04 — Phase 4: Inspector Cleanup

## Phase 4 — Inspector Cleanup

**Goal:** Remove edge side-effects UI from `EdgeInspector` and `ConditionalEdge`, update `NodeInspector` to locate nodes from the three sub-collections and branch form fields by node type, completing the surface-level behavioral parity.

---

**What it changes:**

- **MODIFIED** `src/components/NodeInspector.jsx`:
  - State selector: replace `state.nodes.find(n => n.id === selectedNodeId)` with a multi-collection lookup:
    - Check `state.common[selectedNodeId]` → if found, `nodeType = 'common'`
    - Check `state.choice[selectedNodeId]` → if found, `nodeType = 'choice'`
    - Check `state.ending[selectedNodeId]` → if found, `nodeType = 'ending'`
  - The derived `node` object and its `data` field are unchanged in structure.
  - `nodeType` gates the following:
    - "Set as Start Node" button: shown for `common` and `choice`; **hidden** for `ending` (ending nodes cannot be start nodes by structural definition).
    - All other fields (label, content, side effects): shown for all three types.
  - `addSideEffect`, `updateSideEffect`, `removeSideEffect` handlers: unchanged.
  - `deleteNode` call: unchanged.
  - `updateNode` call: unchanged.

- **MODIFIED** `src/components/EdgeInspector.jsx`:
  - Remove `addSideEffect`, `updateSideEffect`, `removeSideEffect` handler functions (all ~25 lines).
  - Remove the entire "Side Effects" `<div>` section from JSX (~70 lines).
  - Remove any `edge.sideEffects` reference from the state selector.
  - Retain: label input, condition (AND/OR) section, add/remove clause logic, delete edge button.

- **MODIFIED** `src/components/edges/ConditionalEdge.jsx`:
  - Remove `data.sideEffects` from the destructured `data` prop (it is no longer present in the edge data object passed from `GraphCanvas`).
  - No other changes — `sideEffects` was never rendered in this component.

---

**Produces:**
- `src/components/NodeInspector.jsx` — modified
- `src/components/EdgeInspector.jsx` — modified
- `src/components/edges/ConditionalEdge.jsx` — modified

---

**Migration step:** NONE
This phase is UI-only. No store state, persisted data, or data model is touched.

---

**What it leaves temporarily inconsistent:**

Nothing. Phase 4 is the final phase. On completion the system is fully consistent.

---

**What the next phase depends on from this phase:**

Nothing — this is the terminal phase.

---

**Reference files needed:**
- `src/components/NodeInspector.jsx`
- `src/components/EdgeInspector.jsx`
- `src/components/edges/ConditionalEdge.jsx`
- `src/store/narrativeStore.js` (to confirm sub-collection key shape)
- `ran_0303_behaviordelta.md`
- `ran_0303_filemap.md`

---

**Rollback cost if this phase fails:** LOW
Three component files revert. No store, canvas, or data changes are involved. The app returns to Phase 3 state with full canvas and store functionality.

---

**Hard stop triggers for this phase:**

- If the multi-collection node lookup in `NodeInspector` returns `undefined` for a selected node that demonstrably exists in the store — **STOP**. The lookup logic is broken; the inspector will silently unmount.
- If any `edge.sideEffects` reference survives in `EdgeInspector` or `ConditionalEdge` after cleanup — **STOP**. The field no longer exists on the edge object; accessing it will produce `undefined`, which is not a crash but leaves dead code.

---

**Acceptance Criteria:**

Done when:
1. Clicking a `common` or `choice` node opens the inspector with label, content, side effects, and "Set as Start Node" button all visible.
2. Clicking an `ending` node opens the inspector with label, content, and side effects visible; "Set as Start Node" button is absent.
3. Clicking an edge opens the inspector showing label and condition sections; no "Side Effects" section is present.
4. Adding a side effect to a node via the inspector correctly updates the store.
5. Setting a condition on an edge via the inspector correctly updates the store.
6. No references to `edge.sideEffects` exist in `EdgeInspector.jsx` or `ConditionalEdge.jsx`.
7. No `state.nodes` references exist in `NodeInspector.jsx`.

---

**Verification:**

Add three nodes: one common, one choice, one ending.
- Click the common node. Confirm the inspector shows all sections including "Set as Start Node". Click "Set as Start Node". Confirm it marks correctly.
- Click the ending node. Confirm the inspector shows label, content, and side effects. Confirm "Set as Start Node" is not present.
- Add an edge between the common and choice nodes. Click the edge. Confirm the inspector shows label and condition sections only — no "Side Effects" section.
- Add a side effect on the common node. Add a flag first if needed. Confirm the side effect persists when deselecting and reselecting the node.
- Start simulation and advance to the destination node. Confirm the side effect fires (flag value changes as expected).
