# ran_0303_phase_01 — Phase 1: Core Store Restructure

## Phase 1 — Core Store Restructure

**Goal:** Replace the flat `nodes[]` array with three typed sub-collections (`common{}`, `choice{}`, `ending{}`) in `narrativeStore`, update all action functions that touch node state, remove `sideEffects` from the edge schema, and update `simulationStore` to locate nodes via sub-collection lookup.

---

**What it changes:**

- `narrativeStore` initial state: `nodes: []` → `common: {}`, `choice: {}`, `ending: {}`.
- `narrativeStore.addNode(position, type)`: writes `{ id, position, data }` keyed by `id` into the sub-collection matching `type`.
- `narrativeStore.updateNode(id, patch)`: resolves which of the three sub-collections holds `id`; applies patch to that entry only.
- `narrativeStore.deleteNode(id)`: resolves collection; deletes the entry; cascades edge deletion unchanged; calls `clearIfSelected` unchanged.
- `narrativeStore.setStartNode(id)`: maps across all three sub-collections to set `isStartNode`.
- `narrativeStore.addEdge(sourceId, targetId)`: replaces `state.nodes.find(...)?.type === 'ending'` with `sourceId in state.ending`.
- `narrativeStore.addEdge()` new edge object: removes `sideEffects: []`.
- `narrativeStore.deleteFlag(id)`: removes the `edge.sideEffects` scan; updates node scan to use `Object.values(state.common)`, `Object.values(state.choice)`, `Object.values(state.ending)`.
- `narrativeStore.loadGraph()`: receives the new normalized shape; assigns `common`, `choice`, `ending`, `edges`, `flags`, `meta`.
- `narrativeStore.newGraph()`: resets `common: {}`, `choice: {}`, `ending: {}`, `edges: []`, `flags: []`.
- `narrativeStore.exportGraph()`: emits `common`, `choice`, `ending` instead of `nodes`; sets `schemaVersion: 2`.
- `simulationStore.start()`: replaces `graphState.nodes.find(n => n.data?.isStartNode)` with a search across `Object.values(graphState.common)`, `Object.values(graphState.choice)`, `Object.values(graphState.ending)`.
- `simulationStore.advance()`: replaces `graphState.nodes.find(n => n.id === edge.targetId)` with sub-collection lookup; removes `edge.sideEffects` application; replaces `destNode.type === 'ending'` with `edge.targetId in graphState.ending`.

---

**Produces:**
- `src/store/narrativeStore.js` — modified
- `src/store/simulationStore.js` — modified

---

**Migration step:**

`narrativeStore.exportGraph()` bumps `schemaVersion` to `2` and serializes `common`, `choice`, `ending` instead of `nodes`. This is the write side only; the read side (import) is handled in Phase 2. New graphs created and exported after Phase 1 will be `schemaVersion: 2`. Import of legacy files remains broken until Phase 2 is complete — this is the documented temporary inconsistency.

---

**What it leaves temporarily inconsistent:**

- `GraphCanvas.jsx` still destructures `nodes` from `narrativeStore`. Because `nodes` no longer exists in state, the canvas will fail to render until Phase 3 replaces this. This must be addressed via a compatibility shim (see hard stop trigger) or by treating Phase 1 and Phase 3 as an atomic delivery.
- Legacy file import (`fileSystem.js`) still rejects `schemaVersion: 2` until Phase 2.
- **Resolved by:** Phase 2 (import), Phase 3 (canvas).

---

**What the next phase depends on from this phase:**
- Phase 2 depends on `narrativeStore.loadGraph()` accepting the new normalized shape (`common`, `choice`, `ending`).
- Phase 3 depends on `narrativeStore` exposing `common`, `choice`, `ending` in state.
- Phase 4 depends on `narrativeStore` no longer holding `sideEffects` on edges.

---

**Reference files needed:**
- `src/store/narrativeStore.js`
- `src/store/simulationStore.js`
- `src/store/uiStore.js`
- `ran_0303_behaviordelta.md`
- `ran_0303_migrationstrategy.md`
- `ran_0303_preservation.md`
- `architecture_rules.md`

---

**Rollback cost if this phase fails:** MEDIUM
Both store files revert to their previous state. No canvas changes have been made yet. The app returns to full working condition at the prior state. Only in-progress session data is lost (no saved files are affected since export is not the primary risk here).

---

**Hard stop triggers for this phase:**

- If `narrativeStore.deleteFlag()` after the sub-collection change can no longer locate node side-effect references — **STOP**. Do not proceed until the iteration logic is corrected and verified.
- If `simulationStore.start()` cannot locate a start node after sub-collection change — **STOP**.
- If `GraphCanvas.jsx` crashes on load because `nodes` is undefined and no shim is in place — **STOP**. Either add a temporary `nodes` getter to `narrativeStore` that flattens sub-collections, or commit Phase 1 and Phase 3 atomically.

---

**Acceptance Criteria:**

Done when:
1. `narrativeStore` state contains `common: {}`, `choice: {}`, `ending: {}` and no `nodes: []`.
2. `addNode('common')` and `addNode('ending')` place entries in the correct sub-collection.
3. `updateNode` and `deleteNode` operate on the correct sub-collection without cross-collection side effects.
4. `setStartNode` correctly toggles `isStartNode` across all three sub-collections.
5. `addEdge` from an ending node throws the expected error.
6. `addEdge` creates an edge with no `sideEffects` field.
7. `deleteFlag` with a reference in a node's `sideEffects` returns `{ blocked: true }`.
8. `simulationStore.start()` finds the start node and initializes simulation correctly.
9. `simulationStore.advance()` moves to the destination node applying only node side effects.
10. `exportGraph()` produces output with `schemaVersion: 2` and `common`/`choice`/`ending` keys.

---

**Verification:**

Open the browser console and run:
```
useNarrativeStore.getState()
```
Confirm the state shape shows `common`, `choice`, `ending` as objects; no `nodes` key.  
Add a node, then run the same command again. Confirm the new node appears in `common`.  
Click "Start Simulation". Confirm the simulation starts without error.  
Add a node with a side effect. Open the Flags tab and attempt to delete the referenced flag. Confirm the deletion is blocked.
