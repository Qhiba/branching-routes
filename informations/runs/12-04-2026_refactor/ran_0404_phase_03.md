# Phase 3 — ID System Migration

---

**Goal**
Update `uuid.js` to emit entity-prefixed IDs at creation time, while proving that legacy saved files with bare UUID IDs remain fully loadable and functional.

---

**What it restructures**

- `src/utils/uuid.js`: `generateId()` signature changes to `generateId(prefix: string)`. Output becomes `"${prefix}-${crypto.randomUUID()}"`.
- `src/store/graphStore.js` (still named `graphStore.js` — rename is Phase 4): All three `generateId()` call sites updated to pass a prefix:
  - `addNode`: `generateId('n')`
  - `addEdge`: `generateId('e')`
  - `addFlag`: `generateId('f')`

No other files call `generateId()` (confirmed via `ran_0401_understand.md §3`: only `graphStore.js` depends on `uuid.js`).

---

**Produces**

- `src/utils/uuid.js` — modified
- `src/store/graphStore.js` — modified (3 call sites updated)

---

**Migration step**

S03 — Parallel Support (per `ran_0404_migrationstrategy.md §S03`).

- `generateId(prefix)` always emits prefixed IDs for newly created entities.
- `loadGraph` accepts the imported data exactly as-is, with no ID transformation. Old files with bare UUID IDs load without modification.
- `fileSystem.importProject()` does not validate ID format — only `schemaVersion`. No change needed.
- No schema version bump. The value format of `id` fields is not a versioned key.
- **Explicit test required before phase complete:** Export a saved file before Phase 3. Load it after Phase 3. Confirm nodes, edges, flags, and simulation all function correctly.

---

**What it leaves temporarily inconsistent**

- A mixed-ID session is possible at runtime: if a legacy file is loaded, its entities have bare UUIDs; newly created entities in the same session will have prefixed IDs. All lookups use string comparison, so both coexist safely. This is by design (Parallel Support strategy).

---

**What the next phase depends on from this phase**

Phase 4's rename does not depend on Phase 3. However, after Phase 4, the renamed `narrativeStore.js` must preserve the updated `generateId('n')` / `generateId('e')` / `generateId('f')` call sites from Phase 3.

---

**Reference files needed**

- `ran_0404_migrationstrategy.md §S03`
- `ran_0402_first-audit.md §2 DC-05`
- `ran_0402_first-audit.md §3 LBA-02`
- `ran_0402_first-audit.md §5 HS-04`
- `src/utils/uuid.js`
- `src/store/graphStore.js`
- `informations/docs/example_datamodel.json`

---

**Rollback cost if this phase fails:** LOW
Revert `uuid.js` and `graphStore.js` to the pre-Phase-3 commit. No persisted data is changed by this phase.

---

**Hard stop triggers for this phase**

- HS-04: Loading a pre-Phase-3 saved file causes any error (nodes missing, edges missing, simulation fails to start) — STOP. The Parallel Support invariant is broken.
- HS-03: Any consumer of `generateId()` outside `graphStore.js` receives a prefixed ID it does not expect — STOP. Audit all consumers before proceeding.
- `generateId` called without a prefix argument (returns `"undefined-{uuid}"`) — STOP. Enforce that all call sites pass a prefix.

---

**Acceptance Criteria**

Done when:
1. `uuid.js` exports `generateId(prefix)` and its output matches `/^[nef]-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`.
2. `graphStore.js` has exactly three `generateId` calls, each with the correct prefix (`'n'`, `'e'`, `'f'`).
3. No other file calls `generateId` without a prefix.
4. A pre-Phase-3 saved file loads without error and all its cross-references (edge→node, condition→flag) resolve correctly.
5. A simulation started on a legacy-loaded file completes without error.

---

**Verification**

1. Create a new graph: add two nodes, one edge, one flag. Export it. Open the JSON and confirm all `id` fields begin with `n-`, `e-`, or `f-` respectively.
2. Load the pre-Phase-3 saved file (with bare UUID IDs). Confirm nodes and edges appear on the canvas. Start a simulation → confirm it advances correctly.
3. In the loaded legacy graph, add a new node. Confirm the new node's ID begins with `n-`. The existing nodes still have bare UUID IDs. Confirm edges can still connect old and new nodes without error.
