# 0305 Self-Review Report: Phase 1 (Re-run)

> Re-run after 0306 fix pass. Reflects current code state.

---

### Section A — Behavior Compliance

**Files produced check:**
- `src/store/narrativeStore.js` — PRESENT ✓
- `src/store/simulationStore.js` — PRESENT ✓

**CHANGED comment audit:**

1. `narrativeStore` initial state (`common{}`, `choice{}`, `ending{}`): CHANGED comment present at line 9. ✓
2. `addNode`: CHANGED comment present at lines 19 and 34. ✓
3. `updateNode`: CHANGED comment present at line 43. ✓
4. `deleteNode`: CHANGED comment present at line 63. ✓
5. `setStartNode`: CHANGED comment present at line 87. ✓
6. `addEdge` — ending check: CHANGED comment present at line 105. ✓
7. `addEdge` — edge object removes `sideEffects`: CHANGED comment present at line 121. ✓
8. `deleteFlag` — removes edge.sideEffects scan: CHANGED comment present at line 179. ✓
9. `deleteFlag` — node scan uses sub-collections: CHANGED comment present at line 182. ✓
10. `loadGraph`: CHANGED comment present at line 214. ✓
11. `newGraph`: CHANGED comment present at line 229. ✓
12. `exportGraph` — schemaVersion 2: MIGRATION comment present at line 253. CHANGED comment present at line 260. ✓
13. `simulationStore.start()`: CHANGED comment present at line 48. ✓
14. `simulationStore.advance()` — sub-collection lookup: CHANGED comment present at line 88. ✓
15. `simulationStore.advance()` — removes edge.sideEffects application: CHANGED comment present at line 95. ✓

**MIGRATION comment audit:**
- `addNode` carries MIGRATION: Parallel Support S03. ✓
- `addEdge` carries MIGRATION: Parallel Support S03. ✓
- `addFlag` carries MIGRATION: Parallel Support S03. ✓
- `deleteNode` carries MIGRATION: S25. ✓
- `deleteEdge` carries MIGRATION: S25. ✓
- `loadGraph` carries MIGRATION: S25 and Parallel Support S03. ✓
- `newGraph` carries MIGRATION: S25. ✓
- `exportGraph` carries MIGRATION comment. ✓

**Planned behavior not implemented:**

1. **MISSING BEHAVIOR** — `meta` schema fields `commonNodeTypes: []` and `endingTypes: []` are not added.
   - `ran_0303_behaviordelta.md` (Meta Storage section) explicitly states: *"meta gains two new fields: `commonNodeTypes: []` and `endingTypes: []`"*.
   - Neither the initial state, `newGraph()`, `loadGraph()`, nor `exportGraph()` include these fields.
   - The execute report (`ran_0304_execute_01.md`) does not mention this omission.
   - Flag as: **PLAN OMISSION** — `meta.commonNodeTypes` and `meta.endingTypes` were not implemented.

---

### Section B — Containment Check

1. **UNPLANNED CHANGE** — `src/components/TopBar.jsx` was not in the Phase 1 `Produces` list and not referenced in `ran_0303_phase_01.md`. The file has three references to `state.nodes` which no longer exists:
   - Line 11: `const nodes = useNarrativeStore(s => s.nodes);` — subscribes to undefined.
   - Line 44: `const storeNodes = useNarrativeStore.getState().nodes;` — `undefined` at runtime.
   - Line 150: `disabled={nodes.length === 0}` — crashes with `Cannot read properties of undefined (reading 'length')`.

   **This is the direct cause of the cascade of console errors reported by the user.** This file was not in the Phase 1 scope. However, the crash is a direct consequence of Phase 1 removing `nodes` from state. This is the documented temporary inconsistency ("GraphCanvas.jsx still destructures `nodes`..."), but `TopBar.jsx` was not listed as an affected file in `ran_0303_phase_01.md`.
   - The previous 0306 fix report noted the `TopBar.jsx` out-of-band change was flagged with `// PLAN GAP` — but the PLAN GAP comment is **not present** in the current file. The fix was not applied.

2. All other changes in `narrativeStore.js` and `simulationStore.js` are within the planned delta. No unplanned logic changes detected.

---

### Section C — Preservation Check

1. **Visual Canvas State Segregation via `useMemo`**: Cannot verify — `GraphCanvas.jsx` is out of Phase 1 scope and was not reviewed. Phase 1 plan acknowledges this is temporarily broken. PRESERVATION DEFERRED (by plan).

2. **Robust Flag Reference Checking**: Behavior intact. `deleteFlag` scans sub-collections and returns `{ blocked: true, references }`. `// PRESERVED: Robust Flag Reference Checking` comment present at line 169 of `narrativeStore.js`. ✓

3. **Reliable Cross-Store Deletion Synchronization**: Behavior intact. `clearIfSelected` is called after `set()` in both `deleteNode` (line 83) and `deleteEdge` (line 143). `// PRESERVED: Reliable Cross-Store Deletion Synchronization` comment present in both. `// INVARIANT: BI-04` and `// INVARIANT: BI-05` retained. ✓

4. **Strict Deterministic Side Effect Application**: `applySideEffects()` function is unchanged — same signature, same logic. `// PRESERVED: Strict Deterministic Side Effect Application` comment present at line 15 of `simulationStore.js`. ✓

5. **Safely Rejecting Terminus Edges**: `addEdge()` correctly checks `sourceId in state.ending`. `// PRESERVED: Safely Rejecting Terminus Edges` comment present at line 106 of `narrativeStore.js`. ✓

---

### Summary

| # | Type | Item |
|---|------|------|
| 1 | PLAN OMISSION | `meta.commonNodeTypes` and `meta.endingTypes` not implemented in initial state, `newGraph`, `loadGraph`, or `exportGraph` |
| 2 | UNPLANNED CHANGE (open) | `TopBar.jsx` still references `state.nodes` (undefined); causes runtime crash — `// PLAN GAP` comment was not added as noted in prior fix report |

**User note addressed:** The cascade of console errors when one is resolved and another appears is confirmed to originate from `TopBar.jsx` line 150 (`nodes.length` on undefined). This is a Phase 1 casualty that was not included in the fix scope. Resolution path: Phase 3 fixes `GraphCanvas.jsx` and all components reading node state — `TopBar.jsx` must be included in that scope.
