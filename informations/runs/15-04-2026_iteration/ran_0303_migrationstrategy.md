# ran_0303_migrationstrategy — Migration Strategy

## Flagged Items From ran_0302_scope.md

| Item | Flag |
|---|---|
| `nodes` array and its nested schema | MIGRATION REQUIRED |
| `edges` array and its nested schema (`sideEffects` removal) | MIGRATION REQUIRED |
| `meta` object schema (`commonNodeTypes`, `endingTypes`) | PROCEED WITH CAUTION |
| Simulation and evaluation paths | PROCEED WITH CAUTION |

---

## Item 1 — `nodes[]` → Split Into `common{}` / `choice{}` / `ending{}`

**Strategy: Parallel Support**

**Rationale:**  
Files saved by the current system contain a flat `nodes[]` array. These files must still be openable after the migration. The new schema uses three keyed object maps. The import path (`fileSystem.js` → `narrativeStore.loadGraph()`) must accept both the old flat-array format and the new sub-collection format, and normalize them into the new shape transparently.

**How parallel support works:**
- `fileSystem.js` detects whether the loaded file contains `nodes` (legacy) or `common`/`choice`/`ending` (new schema).
- If legacy: distribute each entry into the correct sub-collection by reading its `type` field.
- If new: pass through directly.
- `narrativeStore.loadGraph()` always receives the normalized shape.

**Schema version boundary:**  
Legacy files carry `schemaVersion: 1`. New files carry `schemaVersion: 2`. The import function must accept both. `schemaVersion: 2` files do not require remapping.

---

## Item 2 — `edges[].sideEffects` Removal

**Strategy: In-place migration during import**

**Rationale:**  
Edge `sideEffects` must be discarded from any loaded file because the new system does not support them. The migration cannot silently drop authored data without user awareness. The import path will strip `sideEffects` from each edge entry on load. Since effects were already present on destination nodes in the old schema, no net data loss occurs for most graphs — edge effects were an additional authoring surface, not a substitute.

**At import time:**  
For each edge in the loaded data, delete the `sideEffects` property before patching store state. Log a warning to the console listing the count of discarded effects if any non-empty arrays are found.

**Clean break boundary:**  
The field is gone from the schema. Re-exporting a converted file will not include `sideEffects` on edges. This is a one-way migration.

---

## Item 3 — `meta` Schema Addition (`commonNodeTypes`, `endingTypes`)

**Strategy: In-place migration (additive, non-breaking)**

**Rationale:**  
Adding new fields to `meta` does not break existing file loading. If the fields are absent in a loaded file, they default to `[]`. No detection or remapping logic is needed. `schemaVersion: 2` exports will include these fields.

---

## Item 4 — Simulation and Evaluation Paths (PROCEED WITH CAUTION)

**Strategy: In-place migration**

**Rationale:**  
`simulationStore.advance()` currently applies edge side effects first, then node side effects. After this iteration, only node side effects remain. The function body changes but the behavioral contract of `applySideEffects()` itself does not. No persisted state is involved — simulation state is runtime-only and resets on each run.

---

## Per-Phase Application

Migration steps belong to the phases that trigger them. See individual phase files for the exact migration action within each phase.
