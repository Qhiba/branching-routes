# Phase 2 — UI State Extraction

---

**Goal**
Create `uiStore.js` and move `selectedNodeId`, `selectedEdgeId`, and `snapToGrid` out of `graphStore`, re-establishing cross-store selection-clearing to preserve BI-04, BI-05, and BI-16.

---

**What it restructures**

- `src/store/uiStore.js` (NEW): Zustand store with `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, and actions `selectNode`, `selectEdge`, `clearSelection`, `toggleSnapToGrid`, `clearIfSelected(id, type)`, `resetSelection()`.
- `src/store/graphStore.js` (still named `graphStore.js` — rename is Phase 4):
  - Remove state fields: `selectedNodeId`, `selectedEdgeId`, `snapToGrid`.
  - Remove actions: `selectNode`, `selectEdge`, `clearSelection`, `toggleSnapToGrid`.
  - Update `deleteNode`: after `set(...)`, call `useUIStore.getState().clearIfSelected(id, 'node')`.
  - Update `deleteEdge`: after `set(...)`, call `useUIStore.getState().clearIfSelected(id, 'edge')`.
  - Update `loadGraph`: after `set(...)`, call `useUIStore.getState().resetSelection()`.
  - Update `newGraph`: after `set(...)`, call `useUIStore.getState().resetSelection()`.
- `src/store/index.js`: Add `export { useUIStore } from './uiStore.js'`.
- All MONITOR components: Update selection state reads from `useGraphStore` to `useUIStore`. Update selection action calls from `useGraphStore` to `useUIStore`.

---

**Produces**

- `src/store/uiStore.js` — new
- `src/store/graphStore.js` — modified (UI state removed, cross-store calls added)
- `src/store/index.js` — modified (barrel updated)
- `src/components/GraphCanvas.jsx` — modified (selection reads/writes → `useUIStore`)
- `src/components/TopBar.jsx` — modified (`snapToGrid` and `toggleSnapToGrid` → `useUIStore`)
- `src/components/Sidebar.jsx` — modified (selection reads → `useUIStore`)
- `src/components/NodeInspector.jsx` — modified (`selectedNodeId` read → `useUIStore`)
- `src/components/EdgeInspector.jsx` — modified (`selectedEdgeId` read → `useUIStore`)

---

**Migration step**

S25 — In-place migration (per `ran_0404_migrationstrategy.md §S25`).

In `graphStore.js`:
- `deleteNode(id)`: The `set(...)` call removes `selectedNodeId: ...` from its returned object. After `set(...)` resolves, call `useUIStore.getState().clearIfSelected(id, 'node')`.
- `deleteEdge(id)`: Same pattern with `clearIfSelected(id, 'edge')`.
- `loadGraph(graphData)` and `newGraph()`: Remove `selectedNodeId: null, selectedEdgeId: null` from the `set(...)` object. After `set(...)`, call `useUIStore.getState().resetSelection()`.

In `uiStore.js`, `clearIfSelected(id, type)` must check type before clearing:
```
if (type === 'node' && state.selectedNodeId === id) → set({ selectedNodeId: null })
if (type === 'edge' && state.selectedEdgeId === id) → set({ selectedEdgeId: null })
```

---

**What it leaves temporarily inconsistent**

- `graphStore` now imports from `uiStore`, but `graphStore` is still named `graphStore`. This is resolved in Phase 4 (rename). The import path `import { useUIStore } from './uiStore.js'` is valid and will remain valid after the rename.
- `graphStore` still exports `useGraphStore` — unchanged until Phase 4.

---

**What the next phase depends on from this phase**

Phase 3 (ID System) does not depend on Phase 2. Phases 3 and 4 are independent of Phase 2's selection wiring. However, Phase 4's rename of `graphStore` must preserve the `useUIStore.getState()` cross-store calls introduced in Phase 2.

---

**Reference files needed**

- `ran_0404_migrationstrategy.md §S25`
- `ran_0402_first-audit.md §3 LBA-05`
- `ran_0402_first-audit.md §1 BI-04, BI-05, BI-16`
- `ran_0402_first-audit.md §5 HS-08`
- `src/store/graphStore.js`
- `src/components/GraphCanvas.jsx`
- `src/components/TopBar.jsx`
- `src/components/Sidebar.jsx`
- `src/components/NodeInspector.jsx`
- `src/components/EdgeInspector.jsx`

---

**Rollback cost if this phase fails:** MEDIUM
Revert `uiStore.js` (delete), revert `graphStore.js`, `index.js`, and all 5 component files to the pre-Phase-2 git commit. Logic impact: selection state is lost for the current session, but no data is corrupted.

---

**Hard stop triggers for this phase**

- HS-08: `uiStore.js` imports from `graphStore.js` or `simulationStore.js` — STOP. This creates a circular import.
- HS-08 (converse): `simulationStore.js` imports from `uiStore.js` — STOP. Unintended coupling.
- Any null-reference error in `NodeInspector` or `EdgeInspector` after selecting and deleting a node — STOP. BI-04/BI-05 is broken.
- `loadGraph` completes but `selectedNodeId` is not null — STOP. BI-16 is broken.

---

**Acceptance Criteria**

Done when:
1. `uiStore.js` exists with `selectedNodeId`, `selectedEdgeId`, `snapToGrid`, and all required actions.
2. `graphStore.js` contains zero references to `selectedNodeId`, `selectedEdgeId`, or `snapToGrid` in its state object and actions.
3. `deleteNode`, `deleteEdge`, `loadGraph`, `newGraph` each call `useUIStore.getState()` after their primary `set()`.
4. No component imports `selectedNodeId`, `selectNode`, `clearSelection`, or `snapToGrid` from `useGraphStore`.
5. Selecting a node, then deleting it → inspector panel closes cleanly.
6. Loading a new graph → no node or edge remains selected.

---

**Verification**

Open the app. Confirm:
1. Click a node → the sidebar inspector opens and shows that node's data.
2. Delete that node (via inspector or canvas) → the inspector closes cleanly with no error or blank panel.
3. Click an edge → the edge inspector opens.
4. Delete that edge → the edge inspector closes cleanly.
5. With a node selected, load a different file (or create a new graph) → the inspector closes and nothing is selected.
6. Toggle "Snap to Grid" in the topbar → canvas snapping behavior changes as expected.
