# Phase 4 — Store Consolidation

---

**Goal**
Rename `graphStore.js` to `narrativeStore.js` and rename the exported hook from `useGraphStore` to `useNarrativeStore`, then sweep all import references across the codebase. Update `simulationStore` to read from `useNarrativeStore`. Remove `useGraphStore` from the barrel to force any missed reference to fail loudly.

---

**What it restructures**

- `src/store/graphStore.js` → renamed to `src/store/narrativeStore.js`:
  - `export const useGraphStore` → `export const useNarrativeStore`
  - `window.useGraphStore` debug exposure → `window.useNarrativeStore`
  - All cross-store calls to `useUIStore` from Phase 2 are preserved exactly.
  - All `generateId('n')` / `generateId('e')` / `generateId('f')` call sites from Phase 3 are preserved exactly.
- `src/store/index.js`:
  - Remove: `export { useGraphStore } from './graphStore.js'`
  - Add: `export { useNarrativeStore } from './narrativeStore.js'`
  - (Keep `useUIStore` and `useSimulationStore` exports unchanged)
- `src/store/simulationStore.js`:
  - `import { useGraphStore } from 'store'` → `import { useNarrativeStore } from 'store'`
  - All `useGraphStore.getState()` calls → `useNarrativeStore.getState()`
- All MONITOR components: `useGraphStore` → `useNarrativeStore` in import and usage.

**Affected components (import rename only):**
- `src/components/GraphCanvas.jsx` — `useGraphStore` → `useNarrativeStore` for graph data reads (selection reads already moved to `useUIStore` in Phase 2)
- `src/components/TopBar.jsx`
- `src/components/Sidebar.jsx`
- `src/components/NodeInspector.jsx`
- `src/components/EdgeInspector.jsx`
- `src/components/FlagManager.jsx`
- `src/components/nodes/StoryNode.jsx` (if it reads from `useGraphStore` directly)
- `src/components/edges/ConditionalEdge.jsx` (if it reads from `useGraphStore` directly)

---

**Produces**

- `src/store/narrativeStore.js` — new (renamed from `graphStore.js`)
- `src/store/graphStore.js` — deleted
- `src/store/index.js` — modified
- `src/store/simulationStore.js` — modified
- `src/components/GraphCanvas.jsx` — modified
- `src/components/TopBar.jsx` — modified
- `src/components/Sidebar.jsx` — modified
- `src/components/NodeInspector.jsx` — modified
- `src/components/EdgeInspector.jsx` — modified
- `src/components/FlagManager.jsx` — modified
- `src/components/nodes/StoryNode.jsx` — modified (if applicable)
- `src/components/edges/ConditionalEdge.jsx` — modified (if applicable)

---

**Migration step**

NONE — State shape is unchanged. The exported hook's name changes, but the state and actions it exposes are identical. No persisted data format changes.

---

**What it leaves temporarily inconsistent**

Nothing — this phase is a complete sweep. When this phase ends, `graphStore.js` must not exist and `useGraphStore` must not be exported from the barrel or referenced anywhere in the codebase.

---

**What the next phase depends on from this phase**

This is the final phase. No subsequent phase.

---

**Reference files needed**

- `ran_0404_filemap.md` (CHANGES + MONITOR sections)
- `ran_0402_first-audit.md §3 LBA-01`
- `ran_0402_first-audit.md §5 HS-08`
- `src/store/graphStore.js`
- `src/store/simulationStore.js`
- `src/store/index.js`
- All component files listed in MONITOR

---

**Rollback cost if this phase fails:** HIGH
This phase touches 12+ files. A failed or partial Phase 4 leaves the app in a broken state with mismatched imports. Rollback requires reverting all 12+ files to the pre-Phase-4 commit simultaneously. Git reset `--hard HEAD` to the commit tagged before Phase 4 is the correct rollback action.

---

**Hard stop triggers for this phase**

- HS-08: `narrativeStore.js` imports from `simulationStore.js` — STOP. This would be circular (`simulationStore` imports `narrativeStore` already).
- R02 signal: App renders but `addNode` / `addFlag` / `selectEdge` does nothing → missed import reference. STOP and run `grep -r "useGraphStore"` across `src/` to locate the missed file.
- `graphStore.js` still exists after phase completes — STOP. Delete it and confirm no import errors.
- `useGraphStore` still appears in `store/index.js` exports — STOP. Any component still using the old hook name will silently get `undefined`.

---

**Acceptance Criteria**

Done when:
1. `src/store/graphStore.js` does not exist.
2. `src/store/narrativeStore.js` exists and `export const useNarrativeStore` is its top-level export.
3. `src/store/index.js` exports `useNarrativeStore`, `useUIStore`, `useSimulationStore` — and nothing else.
4. Project-wide search for `useGraphStore` returns zero results.
5. Project-wide search for `graphStore` (as an import path string) returns zero results.
6. `simulationStore.js` calls `useNarrativeStore.getState()` in both `start()` and `advance()`.
7. App compiles without build errors.
8. All full-flow tests from Phases 1–3 still pass.

---

**Verification**

Open the app. Confirm end-to-end flow:
1. Create a new graph → add two nodes → connect them with an edge → add a flag.
2. Open the inspector for the node → edit its label → label updates on the canvas.
3. Open the inspector for the edge → add a condition referencing the flag.
4. Start the simulation → confirm the active node highlights → advance along the edge → confirm the destination node becomes active.
5. Reset simulation → confirm all state clears.
6. Export the graph as JSON → open the JSON and confirm `schemaVersion: 1` and all node IDs begin with `n-`.
7. Import a pre-refactor JSON file (bare UUID IDs) → confirm it loads, edge connections are intact, simulation works.
