# Migration Strategy — Branching Routes Refactor

---

## Flags from `ran_0403_scope.md`

Two items are flagged **MIGRATION REQUIRED**:

| Scope Item | Flag | Concern |
|---|---|---|
| S03 — Prefixed UUID system | MIGRATION REQUIRED | New IDs use `n-{uuid}` / `e-{uuid}` / `f-{uuid}`. Old saved files contain bare UUID v4. Import must not break. |
| S25 — Create `uiStore`, move selection out of narrative store | MIGRATION REQUIRED | `deleteNode` / `deleteEdge` / `loadGraph` clear selection in the same `set()` call. Moving selection to a separate store fractures this atomicity (LBA-05). Cross-store coordination must be re-established. |

---

## Strategy Declarations

### S03 — ID Format Change

**Strategy: Parallel Support**

**Why:**  
The ID format change is additive — new entities get prefixed IDs, old entities in saved files keep their bare UUIDs. String-comparison lookups (`find(n => n.id === id)`) work on both formats without modification. The `loadGraph` function does not need to transform old IDs; it simply accepts them as-is.

**Scope of parallel support:**  
- `generateId(prefix)` always emits prefixed IDs at creation time.
- `loadGraph` performs no ID migration on imported data — both formats coexist at runtime.
- `fileSystem.importProject()` does not validate or transform ID format — it only validates `schemaVersion`.
- No schema version bump is required because the ID value format is not a versioned key — only the structure of the object matters (DC-05 states ID format, but does not mandate form at import).

**Per-phase migration step:** Phase 3 — ID System Migration.

---

### S25 — UI State Extraction / Cross-Store Coordination

**Strategy: In-place migration**

**Why:**  
The selection-clearing logic currently runs in the same Zustand `set()` call as the delete action (LBA-05). This atomicity cannot be replicated exactly across two stores — Zustand does not offer cross-store transactions. The replacement must be an explicit sequential call: after the narrative store completes its deletion `set()`, it synchronously calls `useUIStore.getState().clearIfSelected(id, type)`. This is functionally equivalent because:

1. Both are synchronous.
2. No component renders between the two calls during the same event loop tick (React batches updates in event handlers).
3. The end state after both `set()` calls is identical to the original single `set()`.

**Affected actions in `narrativeStore.js`:**
- `deleteNode(id)` → after `set(...)`, call `useUIStore.getState().clearIfSelected(id, 'node')`
- `deleteEdge(id)` → after `set(...)`, call `useUIStore.getState().clearIfSelected(id, 'edge')`
- `loadGraph(graphData)` → after `set(...)`, call `useUIStore.getState().resetSelection()`
- `newGraph()` → after `set(...)`, call `useUIStore.getState().resetSelection()`

**`uiStore.js` must expose:**
- `clearIfSelected(id, type)` — clears `selectedNodeId` if type is `'node'` and id matches; clears `selectedEdgeId` if type is `'edge'` and id matches.
- `resetSelection()` — sets both selection fields to null.

**Circular import note:** `narrativeStore.js` calling `useUIStore.getState()` directly introduces a cross-store dependency. This is one-directional (narrative → ui), not circular. AR-06 forbids circular imports between store files. This direction is safe: `uiStore` must not import from `narrativeStore`.

**Per-phase migration step:** Phase 2 — UI State Extraction.
