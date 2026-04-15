# ran_0303_preservation — Preservation Plan

## PROTECTED Items

### Visual Canvas State Segregation via `useMemo`
**What this is:** Canonical state is never passed directly to React Flow; `useMemo` derives clean React Flow–compatible arrays from the store. The `isDragging` ref prevents store overwrites during drag. `isRunning` gates click behavior without altering the derivation pipeline.

**How the plan preserves it across all phases:**
- Phase 1 (store restructure): `narrativeStore` internal shape changes but its public interface retains named action and selector functions. `GraphCanvas` is not touched in Phase 1; it continues to read from the old shape via the unchanged `storeNodes` alias. Phase 1 does not break this.
- Phase 2 (import/export): `fileSystem.js` changes occur in the import path only. No canvas logic is altered.
- Phase 3 (canvas migration): `derivedNodes` useMemo is rewritten to merge three sub-collections. The output contract — a stable array of React Flow node objects — is identical. The `isDragging` ref, `applyNodeChanges`, and `setRfNodes` pattern are explicitly preserved.
- Phase 4 (inspectors): no canvas changes.

**What confirms it survived:**
- Drag a node and release. The node stays in the correct position without snapping back.
- Add ten nodes. Canvas does not re-render the entire graph on each drag tick.

---

### Robust Flag Reference Checking
**What this is:** `narrativeStore.deleteFlag(id)` blocks deletion if the flag `id` appears in any edge condition clause or any node's `sideEffects`. Returns `{ blocked: true, references }`.

**How the plan preserves it across all phases:**
- Phase 1: `deleteFlag()` is modified to:
  1. Remove the `edge.sideEffects` scan (field no longer exists on edges).
  2. Update the node `sideEffects` scan to iterate `Object.values(state.common)`, `Object.values(state.choice)`, and `Object.values(state.ending)` instead of `state.nodes`.
  3. Retain the `references` array, `return { blocked: true, references }`, and `return { blocked: false }` paths — identical.
- Phases 2–4: no further changes to `deleteFlag`.

**What confirms it survived:**
- Create a flag. Assign it to a node's side effect. Attempt to delete the flag in the Flags tab. The deletion is blocked and the flag remains.

---

## ACKNOWLEDGED RISK Items

### Reliable Cross-Store Deletion Synchronization
**Accepted impact:** If `useUIStore.getState().clearIfSelected()` is accidentally removed during `deleteNode` or `deleteEdge` refactoring, the sidebar inspector will remain mounted after the entity is gone and crash on render.

**How the blast radius is contained:**
- Phase 1 is the only phase touching `deleteNode`. The invariant comment `// INVARIANT: BI-04` and `// INVARIANT: BI-05` must remain in place in both `deleteNode` and `deleteEdge`. These comments are the guard trigger for review.
- The `clearIfSelected` call is placed *after* the `set()` call. This ordering is not changed — `set()` runs first, then the UI sync. The refactor only changes *what collection* is filtered inside `set()`, not the sequencing.
- Verifiable: delete a selected node. The inspector panel must go blank, not crash.

---

### Strict Deterministic Side Effect Application
**Accepted impact:** Edge side effects are permanently removed. Graphs that previously authored effects on edges will have those effects stripped on import. This is intentional per scope.

**How the blast radius is contained:**
- The `applySideEffects()` function in `simulationStore` is unchanged — same signature, same logic. Only the call site that passed `edge.sideEffects` is removed.
- The ordering ambiguity (edge effects then node effects) is resolved by eliminating the edge effects layer. What remains is a single deterministic call: destination node effects only.
- `fileSystem.js` logs a console warning when it discards non-empty `sideEffects` arrays from edges during legacy import, giving visibility into lost data.
- Verifiable: export a file after the migration. Open it. Incoming edges have no `sideEffects` field. Simulation still fires node side effects correctly.

---

### Safely Rejecting Terminus Edges
**Accepted impact:** The enforcement mechanism changes from a `type` field check on a flat array entry to a sub-collection identity check.

**How the blast radius is contained:**
- Phase 1 rewrites `narrativeStore.addEdge()` to check `sourceId in state.ending` instead of `state.nodes.find(n => n.id === sourceId)?.type === 'ending'`. The thrown error message is identical.
- The `EndingNode.jsx` component unconditionally omits the source handle, preserving the UI-layer reinforcement of AR-12.
- The logic executes in `narrativeStore.addEdge()` only — no other enforcement points are added or removed (per AR-12 rationale).
- Verifiable: attempt to draw an edge from an ending node. The connection is rejected; error is logged to console; no edge appears.
