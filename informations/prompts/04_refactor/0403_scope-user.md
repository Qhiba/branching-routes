## REFACTOR SCOPE

### What is being restructured
The scene entity system — its export collection key, metadata type key, entity ID prefix, all cross-references to scene IDs, and all sub-entity ID formats for conditions, options, and next-route entries across the entire data model.

### Current state (the problem)
Scene entities are identified as `S###`, exported under `"scene"`, typed under `"scene_types"`, and their nested sub-entities carry opaque timestamp- or counter-based IDs (`cond_12_qnu5`, `opt_1774788016987idv6g`, `route_1774791893774_rwa3`) with no relationship to their parent — making cross-referencing, debugging, and the IC1 edge ID alignment problem structurally worse over time.

### Target state (the goal)
Scene entities are exported under `"common"` as `N###`, metadata types live under `"common_node_types"`, and every nested sub-entity ID encodes its full parent hierarchy (`CH001_COND001`, `CH001_OPT001_NE001`, `CH001_OPT001_NE001_COND001`), making every ID self-describing and traceable without lookup.

### What changes structurally
1. Export top-level key `"scene"` → `"common"`
2. Export metadata key `"scene_types"` → `"common_node_types"`
3. All scene entity IDs: `S###` → `N###`
4. All cross-references pointing to scene IDs (`next.target` fields across scenes, choices, and options) updated from `S###` to `N###`
5. `generateId` prefix for scenes: `"S"` → `"N"` in `EditorContext.jsx`
6. `handleExport` key mapping: `scenes` → `common` in `App.jsx`
7. `handleImport` / `loadData` key mapping: `data.common` → internal state, `data.common_node_types` → metadata in `App.jsx` and `EditorContext.jsx`
8. Condition IDs: `cond_N_xxxx` → `{PARENT_ID}_COND{###}` — affects every `requires.conditions` array in choices, scenes, options, next entries, endings, and variants
9. Option IDs: `opt_timestamp_xxxx` → `{CHOICE_ID}_OPT{###}`
10. Next-entry IDs: `route_timestamp_xxxx` → `{PARENT_ID}_NE{###}`
11. Field order reordered across all entity types in the export schema per the agreed target structure

### What must not change externally
- The internal shape of a condition object: `{ id, flag, state }` or `{ id, status, min, max }` — only the `id` value changes, not the surrounding structure
- The `requires` group structure: `{ operator, conditions: [...] }` — untouched
- The `next` array entry structure: `{ id, requires, target }` — only `id` value changes
- The `options` array key on choices — confirmed kept as `options` (plural)
- All other entity collections: `path`, `chapter`, `flag`, `status`, `choice`, `ending`, `quest` — structurally identical, no key or ID changes in this push
- `_position` data on all entities — must survive the migration pass without loss or reset
- Simulation behavior — which paths are valid, which conditions evaluate to true, which edges are highlighted, must be identical before and after
- Graph topology — every edge that existed before must exist after, connecting the same logical nodes
- The IC1 fix from Push 1 — taken-edge highlighting in `useSimulator.js` / `graphLayout.js` must still pass after sub-ID format changes touch the same construction code

### Audit First verdict accepted
[ ] SAFE TO PROCEED
[x] PROCEED WITH CAUTION — risks acknowledged:
Inside `/informations/docs/risk_register.md`
- F6 import/export asymmetry risk: The `"scene"` → `"common"` rename must be mirrored in both `handleExport` AND `loadData`'s key mapping. The risk register explicitly flags this pattern as a developer error trap. Both directions must be updated atomically.

Other possible risks:
- `replaceIdReferences` scope risk: This function deep-walks the data tree to update ID cross-references. It currently targets specific field names (`flag`, `status`, `target`, `flags_set`, `status_set`). If target fields inside `next` arrays still hold `S###` after migration, the graph silently breaks with no runtime error — dangling targets return `undefined` from map lookups, not exceptions.

- `generateId` collision risk: Changing the scene prefix from `S` to `N` is safe by convention, but must be verified that no other entity type uses `N` as a prefix. Confirmed from documentation: no current entity uses `N`. Safe.

- Hierarchical sub-ID migration depth: Conditions are nested arbitrarily deep (conditions inside groups inside groups). The migration must be recursive, not a shallow pass. A flat migration will silently miss nested condition IDs.

- `useSimulator.js` node-type resolution: The simulator resolves node type by checking `scenes[id]`, then `choices[id]`, then `endings[id]`. After renaming, the internal state key for scenes must also update (or the lookup key must update). If the internal state slice is still called `scenes` but the export key is `common`, this is fine — but must be explicitly confirmed as a non-change. If `loadData` renames the internal slice too, the simulator will fail to find any common nodes.
  ~~**[AMENDED 03-04-2026]** This risk is now resolved by design: the internal slice IS being intentionally renamed to `common` as part of Phase B. `useSimulator.js` is updated atomically in the same commit to use `common[id]`. This is a Safe-With-Coordination refactor change, not an accidental alignment. See `ran_0404_plan.md` §2 Phase B.~~

### Hard stops I am setting
If any of these happen during execution, work stops immediately:
[x] Any unplanned export format change beyond the four planned renames (`scene`→`common`, `scene_types`→`common_node_types`, `S###`→`N###`, sub-ID format)
[x] Any change to the data INSIDE a `requires` object other than the `id` field value
[x] Any `_position` value on any node reads differently after migration than before
[x] Any `next.target` field still contains an `S###` value after migration completes
~~[x] The internal state slice name for scenes changes in `EditorContext.jsx` — the internal name (`scenes`) and the export name (`common`) must diverge intentionally and explicitly; accidental alignment of both to `common` breaks the simulator~~
**[AMENDED 03-04-2026]** The internal state slice IS being renamed to `common`. This hard-stop is superseded. The coordinated rename across all consumers is now part of Phase B scope. The hard-stop for this item is now: internal slice rename committed without updating ALL consumers simultaneously.
[x] `useSimulator.js` node-type resolution returns `undefined` for any node that was previously a scene

### Rollback plan
**Before starting**: Export the current project data to a JSON file using the app's own export function. This creates a `S###`-keyed backup that can be re-imported after a code revert.

**If something breaks mid-execution**: `git reset --hard`. The code reverts cleanly. IndexedDB will still contain whatever partially-migrated state was written — on next load, the reverted migration functions will re-run against it. If the partial migration left data in an inconsistent state, reimport from the pre-push JSON backup using the reverted import handler.

**No feature flag needed**: This is a client-side-only refactor with no server state. A hard git reset plus JSON reimport is a complete recovery.

### Definition of done
[ ] All scene entity IDs in IndexedDB read back as `N###` — no `S###` remains in any entity's `id` field
[ ] No `S###` string appears in any `next.target` field across any entity in the data model
[ ] Export JSON top-level key for scene entities is `"common"`; metadata key is `"common_node_types"`
[ ] `handleImport` correctly maps `data.common` and `data.common_node_types` into internal state without data loss
[ ] `useSimulator.js` resolves node type correctly for all `N###` IDs — simulation runs start to finish without hitting `undefined` on node lookup
[ ] All condition IDs follow `{PARENT_ID}_COND{###}` pattern; all option IDs follow `{CHOICE_ID}_OPT{###}`; all next-entry IDs follow `{PARENT_ID}_NE{###}`
[ ] Nested condition groups (conditions inside OR/AND sub-groups) have correct hierarchical IDs — not just top-level conditions
[ ] Field order in export matches the agreed target schema for all entity types

---

## AMENDMENT — 03-04-2026

**Decision:** The internal state slice `scenes` in `EditorContext.jsx` is also being renamed to `common` as part of Phase B. This reverses the original intent to keep internal and export names diverged.

**Rationale:** Maintaining `scenes` internally while exporting as `common` creates permanent cognitive overhead for all future development. A coordinated rename is a safe, behavioral no-op refactor when all consumers are updated atomically.

**Impact on this document:**
- The risk note about `useSimulator.js` node-type resolution (above) is superseded — the rename is intentional and coordinated, not accidental.
- Hard-stop item about internal/export name divergence is superseded — the new hard-stop is: internal rename committed without ALL consumers updated simultaneously.
- Additional scope added to Phase B: `useSimulator.js`, `graphLayout.js`, `App.jsx`, `RouteViewer.jsx`, `LeftSidebar.jsx` and any other consumer of `scenes` from context must be updated in the same atomic commit.
- R7 (IndexedDB data loss) added to risk register: hydration must read `saved.common || saved.scenes` as backward-compat shim for existing user data.

**Updated Definition of Done (additions):**
[ ] Internal state slice in `EditorContext.jsx` is named `common` (not `scenes`)
[ ] `useSimulator.js` destructures `common` from context and uses `common[id]` for type detection
[ ] `graphLayout.js` `buildNodesAndEdges` accepts `common` parameter (not `scenes`)
[ ] IndexedDB hydration reads `saved.common || saved.scenes` (backward-compat shim present)
[ ] No remaining references to `scenes` as a context-destructured variable in any component