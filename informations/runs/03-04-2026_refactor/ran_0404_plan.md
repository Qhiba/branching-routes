# Refactor Plan — Branching Routes Schema & Sub-ID Restructure

> **Date:** 03-04-2026  
> **Role:** Senior Architect  
> **Scope:** Scene entity rename (`S###` → `N###`, `scene` → `common`, `scene_types` → `common_node_types`) + internal state slice rename (`scenes` → `common` across all consumers) + hierarchical sub-entity ID migration (condition IDs, option IDs, next-entry IDs)  
> **Inputs:**  
> - Structure map: `ran_0401_understand.md`  
> - Pre-refactor contract: `ran_0402_first-audit.md`  
> - Refactor scope: `0403_scope-user.md`  
> - Architecture rules: `architecture_rules.md`

---

## §1. Structural Delta

### Before (Current State)

**Export top-level keys:**
```
{ metadata, path, chapter, flags, choices, scenes, status, quests, endings }
```
- `metadata.scene_types: string[]` — scene type tags
- `scenes` object: keyed by `S###` IDs

**Entity ID formats:**
- Scenes: `S###` (e.g. `S001`, `S002`)
- Choices: `CH###`
- Endings: `E###`

**Sub-entity ID formats (opaque, timestamp/counter-based):**
- Condition IDs: `cond_N_xxxx` (e.g. `cond_12_qnu5`)
- Option IDs: `opt_timestamp_random` (e.g. `opt_1774788016987idv6g`)
- Next-entry IDs: `route_timestamp_random` (e.g. `route_1774791893774_rwa3`)
- Variant IDs: `variant_timestamp_random` (e.g. `variant_1774792299148_nqhoo`)

**Internal state slice name:** `scenes` (keyed by `S###`)  
**Export key for scenes:** `scenes`  
**IndexedDB save key for scenes slice:** `scenes` (inside `branching-routes-data` object)

**`generateId` prefix for scenes:** `'S'`  
**`reorderScenes` reassigns with prefix:** `` `S${...}` ``

---

### After (Target State)

**Export top-level keys:**
```
{ metadata, path, chapter, flags, choices, common, status, quests, endings }
```
- `metadata.common_node_types: string[]` — replaces `scene_types`
- `common` object: keyed by `N###` IDs

**Entity ID formats:**
- Scenes (now "common nodes"): `N###` (e.g. `N001`, `N002`)
- Choices: `CH###` — **UNCHANGED**
- Endings: `E###` — **UNCHANGED**

**Sub-entity ID formats (hierarchical, self-describing):**
- Condition IDs: `{PARENT_ID}_COND{###}` (e.g. `CH001_COND001`, `N001_NE001_COND001`)
- Option IDs: `{CHOICE_ID}_OPT{###}` (e.g. `CH001_OPT001`)
- Next-entry IDs: `{PARENT_ID}_NE{###}` (e.g. `N001_NE001`, `CH001_OPT001_NE001`)
- Variant IDs: `{SCENE_ID}_VAR{###}` (e.g. `N002_VAR001`) — **NEW FORMAT**

**Internal state slice name:** `common` — **CHANGED** (renamed from `scenes` to match export key and eliminate the split)  
**Export key for scenes:** `common`  
**IndexedDB save key for scenes slice:** `common` (inside `branching-routes-data` object)  
**Import key accepted:** `common` (new) AND `scenes` (old — backward compat for exports AND for existing IndexedDB data)

**`generateId` prefix for scenes:** `'N'`  
**`reorderScenes` reassigns with prefix:** `` `N${...}` ``

---

### What Is Identical in Both

| Area | Status |
|---|---|
| `requires` group structure `{ operator, conditions }` | UNCHANGED |
| `next` array entry structure `{ id, requires, target }` (only `id` value changes) | STRUCTURE UNCHANGED |
| `options` array key on choices | UNCHANGED |
| All other entity collections: `paths`, `chapters`, `flags`, `statusPoints`, `choices`, `endings`, `quests` | UNCHANGED (internal names, persisted keys, IDs, formats) |
| `_position` field convention `{ x, y }` | UNCHANGED |
| `flags_set`, `status_set` structures | UNCHANGED |
| `evaluateGroup` logic, `conditionUtils.js` | UNCHANGED |
| `useSimulator.js` type detection mechanism (collection membership lookup) | MECHANISM UNCHANGED — variable renamed from `scenes` to `common`, lookup becomes `common[targetId]` |
| Edge ID format patterns (`${id}-next-${routeIdPart}`, `${id}-opt-${optId}-${target}`) | UNCHANGED in format — route IDs and opt IDs change values |
| IndexedDB storage key `branching-routes-data` | UNCHANGED |
| Export keys: `path`, `chapter`, `flags`, `status`, `quests`, `endings` | UNCHANGED |

---

## §2. Phase Breakdown

> **Constraint:** Each phase must be independently shippable. A broken phase must not break the prior phase. Every phase has a rollback path.

---

### Phase A — Export/Import Bridge (Backward-Compat Layer)

**Files modified in this phase:**
- `src/App.jsx`

**What it restructures:**  
`App.jsx` `handleExport` and `handleImport`/`loadData` only. No entity data changes.

- `handleExport`: Add `common: scenes` (keyed by current `S###`) and `metadata.common_node_types: sceneTypes` in addition to (then replacing) `scenes` and `metadata.scene_types`
- `handleImport` / `loadData`: Accept `data.common || data.scenes` as the scenes slice; accept `metadata.common_node_types || metadata.scene_types` as the scene types

**What it leaves temporarily inconsistent:**  
Export still contains `S###` IDs. Reads from old `.json` files still work. The key rename happens here, but IDs stay `S###` until Phase B. Old exports (`scenes` key) import fine.

**Rollback cost if this phase fails:** **LOW**  
Only `App.jsx` modified. Revert is a single file rollback. IndexedDB untouched.

**Hard stop triggers:**
- `handleImport` maps `data.common` to internal `scenes` state but simulation fails to find nodes → stop, the internal key mapping is broken
- Export now missing either `common` or correct `metadata.common_node_types` → stop

---

### Phase B — Scene ID Migration (`S###` → `N###`) + Internal Slice Rename (`scenes` → `common`)

**Files modified in this phase** (⚠️ atomic commit — all files must be committed together):
- `src/context/EditorContext.jsx`
- `src/hooks/useSimulator.js`
- `src/utils/graphLayout.js`
- `src/App.jsx`
- `src/components/routeviewer/RouteViewer.jsx` *(if it references `scenes` from context)*
- `src/components/layout/LeftSidebar.jsx` *(if it references `scenes` from context)*
- *Any additional consumers found by pre-condition grep*

**What it restructures:**  
`EditorContext.jsx` + all consumers — **this is an atomic commit covering all files simultaneously**:

**In `EditorContext.jsx`:**
1. State variable: `const [scenes, setScenes] = useState({})` → `const [common, setCommon] = useState({})`
2. Ref: `scenesRef` → `commonRef`; `useEffect` syncing it → `commonRef.current = common`
3. All internal usages of `scenes`/`setScenes`/`scenesRef` renamed to `common`/`setCommon`/`commonRef`
4. `generateId` call site in `addScene`: prefix `'S'` → `'N'`
5. `reorderScenes`: reassignment template `` `S${...}` `` → `` `N${...}` ``
6. Auto-save `useEffect`: `{ ..., scenes, ... }` → `{ ..., common, ... }`
7. Hydration `useEffect`: `saved.scenes` → `saved.common || saved.scenes` (backward-compat: users have existing IndexedDB data stored under the `scenes` key)
8. `dataValue` export: `scenes` → `common` in the context value object
9. New migration function `migrateSceneIds(common, choices, endings, entryNode)`:
   - Renames all `S###` keys to `N###` in the common-nodes object
   - Updates all `scene.id` fields inside
   - Updates all `target` values that are `S###` across `common[*].next[]`, `choices[*].options[].next[]`
   - Returns `{ common: newCommon, idMap }` for the caller to also update `entryNode`
   - Idempotent: no-op if no keys start with `S` + numeric suffix
10. Migration injected into hydration chain (after `migrateEndingRequires`) and `loadData`

**In `useSimulator.js`:**
- `const { ..., scenes, ... } = useEditorData()` → `const { ..., common, ... } = useEditorData()`
- All `scenes[targetId]` lookups → `common[targetId]`
- All `scenes[from.nodeId]` references → `common[from.nodeId]`
- Return value: `scenes` → `common` in the returned object

**In `src/utils/graphLayout.js`:**
- `buildNodesAndEdges(choices, scenes, endings, opts)` signature → `buildNodesAndEdges(choices, common, endings, opts)`
- All internal references to `scenes` parameter → `common`
- `computeLayout(choices, scenes, endings, opts)` → `computeLayout(choices, common, endings, opts)`
- `computeLayoutWithPositions(choices, scenes, endings, opts)` → `computeLayoutWithPositions(choices, common, endings, opts)`

**In `src/App.jsx`:**
- `const { ..., scenes, ... } = useEditor()` → `const { ..., common, ... } = useEditor()`
- `entryPointOptions` useMemo: `Object.values(scenes)` → `Object.values(common)`
- `entryNodeType` useMemo: `scenes[entryNode]` → `common[entryNode]`
- All other `scenes` usages → `common`

**In `src/components/routeviewer/RouteViewer.jsx`:**
- Any `scenes` prop or destructure from context → `common`

**In `src/components/layout/LeftSidebar.jsx`:**
- Any `scenes` destructure from context → `common`

**In any other component receiving `scenes` from context or props:**
- Audit and rename (grep for `scenes` in context destructuring as pre-condition)

**What it leaves temporarily inconsistent:**  
Sub-entity IDs (conditions, options, next-entry IDs) remain in old opaque format. Edge IDs computed from `N###` + old route `_id` format still work correctly — the edge ID format `${entity.id}-next-${route._id}` uses the new `N###` ID combined with the existing old `route._id`, producing a unique valid edge ID that matches between `graphLayout.js` and `useSimulator.takenEdgeIds`.

**Rollback cost if this phase fails:** **HIGH**  
Multiple files modified atomically. If IndexedDB has partially migrated data (stored under `common` key but code reverted to read `scenes`), users see an empty canvas on next load. Required recovery: clear IndexedDB + reimport from the pre-push JSON backup. A staged rollback (revert all files simultaneously via `git reset --hard`) is clean at the code level.

**Hard stop triggers:**
- Any `S###` string remains in any `next.target` field after migration → stop
- `useSimulator.js` node-type resolution returns `undefined` for any `N###` node → stop — HS-3 equivalent
- `entryNode` still holds an `S###` value after migration → stop
- `graphLayout.js` produces 0 edges after rename (indicates `common` parameter not wired correctly) → stop
- Existing IndexedDB data (stored under `scenes` key) fails to load after rename — hydration backward-compat shim missing → stop — HS-6

---

### Phase C — Sub-ID Migration (Condition, Option, Next-Entry IDs)

**Files modified in this phase:**
- `src/context/EditorContext.jsx`
- `src/components/shared/ConditionEditor.jsx` *(only if it generates condition IDs — verify in pre-condition audit)*

**What it restructures:**  
`EditorContext.jsx` new migration functions only:

1. `migrateConditionIds(condGroup, parentPath)` — recursive
   - Traverses any `requires` group, renaming each leaf `id` field to `{PARENT_PATH}_COND{###}` pattern
   - Counter is per-parent-scope (restarts at 001 for each new parent)
   - Idempotent: skips IDs already matching the hierarchical pattern
2. `migrateOptionIds(choices)` — renames option `id` fields
   - `opt_timestamp_random` → `{CHOICE_ID}_OPT{###}`
   - Idempotent: skips IDs already matching `{ID}_OPT{###}`
3. `migrateNextEntryIds(entities)` — renames `_id` fields on `next[]` entries
   - `route_timestamp_random` → `{PARENT_ID}_NE{###}`
   - Idempotent: skips IDs already matching `{ID}_NE{###}`
4. `migrateVariantIds(scenes)` — renames variant `id` fields
   - `variant_timestamp_random` → `{SCENE_ID}_VAR{###}`
   - Idempotent

All four functions run on hydration (after Phase B's `migrateSceneIds`) and in `loadData`.

**`addChoiceOption` signature update:**
- Old: `` `opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` ``
- New: `{CHOICE_ID}_OPT{max_existing_opt_index + 1}` with zero-padded 3-digit suffix

**New route `_id` generation in `addSceneRoute` / form handlers:**
- Old: `route_${Date.now()}_${random}`
- New: `{SCENE_ID}_NE{###}`

**What it leaves temporarily inconsistent:**  
Nothing structural — this is a same-shape rename. Edge IDs change values (since `route._id` values change), but they change atomically in both `graphLayout.js` (reads `route._id`) and `useSimulator.takenEdgeIds` (reads `route._id`) from the same data source. Both sides read the current entity data, so as long as the entity has consistent new IDs, both sides produce matching edge IDs.

**Rollback cost if this phase fails:** **MEDIUM**  
Migration functions are additive in `EditorContext.jsx`. If partial migration produces inconsistent IDs, reload from pre-push backup. The opaque format is still accepted by the app (no hard dependency on the new format in the evaluation layer).

**Hard stop triggers:**
- Any condition ID in any `requires.conditions[]` at any nesting depth still in old `cond_N_xxxx` format after migration completes (spot-check several nested cases) → stop
- Edge highlighting breaks in simulation after option/route ID migration (verify `takenEdgeIds` still matches `graphLayout` edges) → stop — HS-5
- `_position` on any node reads differently after migration (lost or reset) → stop — HS-7

---

### Phase D — Field Order Normalization (Export Shape)

**Files modified in this phase:**
- `src/App.jsx` *(only the `handleExport` function)*

**What it restructures:**  
`handleExport` in `App.jsx` only — reorders fields in the output JSON to match the agreed target schema. No data values change.

Agreed export field order per entity type (from scope):
- Scene/common node entity: `id`, `name`, `description`, `variants`, `chapter`, `path`, `requires`, `next`, `type`, `flags_set`, `status_set`, `_position`
- Choice entity: `id`, `text`, `chapter`, `path`, `requires`, `options`, `_position`
- Option sub-entity: `id`, `label`, `requires`, `flags_set`, `status_set`, `next`
- Next-entry sub-entity: `id`, `requires`, `target`
- Condition leaf: `id`, `flag`/`status`, `state`/`min`/`max`

Field ordering in JSON is cosmetic — it does not affect `JSON.parse` behavior in `handleImport` or `loadData`. No runtime impact.

**What it leaves temporarily inconsistent:** Nothing — purely cosmetic.

**Rollback cost if this phase fails:** **LOW**  
Only `App.jsx` `handleExport` function. Revert is trivial.

**Hard stop triggers:**
- Export/import round-trip test fails after ordering → stop (indicates accidental field omission, not ordering issue)

---

### Phase E — Cleanup & Self-Consistency Pass

**Files modified in this phase:**
- `src/App.jsx`
- Any display component that renders the entity type label `'scene'` as a user-facing string *(audit `NavBar`, modal type strings; confirm display-only)*

**What it restructures:**
1. Remove the backward-compat `data.scenes` fallback from `handleImport` (or retain it as a permanent compatibility shim — decision point, see Risk Register R3)
2. Update `metadata.scene_types` backward-compat read to log a deprecation warning
3. Update any string literals that reference `'scene'` as an entity type label in display components (e.g. `NavBar`, `EditModal` type strings) — confirm that `scene` type string in `openModal('scene', ...)` call sites is display-only and does not affect the data contract
4. Update `topbar` version display from `Phase 5` → appropriate new phase label if applicable

**What it leaves temporarily inconsistent:** Nothing structural.

**Rollback cost if this phase fails:** **LOW**

**Hard stop triggers:** None — this phase is cleanup only. Any breakage here is UI-only.

---

## §3. Migration Strategy

**Strategy chosen: In-place migration with backward-compat import**

### Rationale

**Option A (In-place migration):** Every migration function runs on hydration and import. Data is transparently upgraded to the new format on next load. Users never know a migration happened.

**Option B (Parallel support):** Accept both old and new formats indefinitely. Code complexity doubles. Rejected.

**Option C (Clean break):** Old exports become non-importable. Rejected — violates HS-2 and BI-3. Users have live backups we cannot break.

**Chosen:** In-place migration for all sub-entity IDs (Phase C) and scene IDs (Phase B). Backward-compat import shim in Phase A (accepting `data.scenes` and `data.common` in parallel) to handle existing user `.json` exports.

**Migration chain execution order (on hydration):**
```
migrateOptionNext
→ migrateSceneFields
→ migrateFlagFields
→ migrateChoiceRequires
→ migrateSceneRequires
→ migrateEndingRequires
→ migrateSceneIds          ← NEW (Phase B)
→ migrateOptionIds         ← NEW (Phase C)
→ migrateNextEntryIds      ← NEW (Phase C)
→ migrateVariantIds        ← NEW (Phase C)
→ migrateConditionIds      ← NEW (Phase C)
```

**Idempotency guarantee:**
- All new migration functions must be no-ops when run on already-migrated data
- Detection: `migrateSceneIds` checks if ANY key still starts with `S` and has a numeric suffix — if none, skips
- Detection: `migrateOptionIds` checks if opt.id matches `^.+_OPT\d{3}$` — if all match, skips
- Detection: `migrateNextEntryIds` checks if entry._id matches `^.+_NE\d{3}$` — if all match, skips
- Detection: `migrateConditionIds` checks if leaf.id matches hierarchical pattern — if all match, skips

---

## §4. File Map

### `src/App.jsx`

| What changes | What must not change |
|---|---|
| `handleExport`: `scenes` key → `common`; `metadata.scene_types` → `metadata.common_node_types` | Export keys for all other slices (`path`, `chapter`, `flags`, `status`, `quests`, `endings`) |
| `handleImport`: accept `data.common \|\| data.scenes`; accept `metadata.common_node_types \|\| metadata.scene_types`; validate `data.common` or `data.scenes` whichever is present | Import validation logic for all other entity types; `loadData` call signature |
| `handleImport` `sliceKeys` array: `'scenes'` → `'common'` (with fallback logic) | All other validation entries |
| `handleExport` field order normalization (Phase D) | All behavioral export logic |

**No new files. No deleted files.**

---

### `src/context/EditorContext.jsx`

| What changes | What must not change |
|---|---|
| `const [scenes, setScenes]` → `const [common, setCommon]`; `scenesRef` → `commonRef` | Public API function signatures: `addScene`, `updateScene`, `deleteScene`, `reorderScenes` |
| `addScene`: `generateId('S', ...)` → `generateId('N', ...)`; uses `commonRef` | Entity shape created by `addScene` — unchanged |
| `reorderScenes`: `` `S${...}` `` → `` `N${...}` ``; uses `commonRef` | `reorderScenes` function name — unchanged |
| Auto-save: `{ ..., scenes, ... }` → `{ ..., common, ... }` | Auto-save timing, debounce, `isInitialMount` guard |
| Hydration: `saved.scenes` → `saved.common \|\| saved.scenes` (backward-compat shim) | Migration chain order for existing functions |
| `dataValue` export: `scenes` field → `common` field | All other fields in `dataValue` and `actionsValue` |
| `addChoiceOption`: option ID generation → `{CHOICE_ID}_OPT{###}` | Option sub-structure shape: `{ id, label, requires, flags_set, status_set, next }` |
| New migration functions: `migrateSceneIds`, `migrateOptionIds`, `migrateNextEntryIds`, `migrateVariantIds`, `migrateConditionIds` | Existing migration functions (must not be modified, only extended) |
| `loadData`: chain new migrations; accept `s` parameter as common-nodes input | `loadData` parameter names (internally: `s` → `common nodes` data) |
| Route `_id` generation: `route_${Date.now()}` → `{PARENT_ID}_NE{###}` | `requires` group structure passed to any newly created route |

---

### `src/utils/graphLayout.js`

| What changes | What must not change |
|---|---|
| `buildNodesAndEdges(choices, scenes, endings)` → `buildNodesAndEdges(choices, common, endings)` | Edge ID construction format: `${entity.id}-next-${routeIdPart}` and `${choice.id}-opt-${optIdPart}-${target}` |
| `computeLayout(choices, scenes, endings, opts)` → `computeLayout(choices, common, endings, opts)` | All internal layout algorithm logic |
| `computeLayoutWithPositions(choices, scenes, endings, opts)` → same with `common` | All position-merging logic |
| All internal `scenes` parameter references → `common` | Node shape produced — unchanged |

**Rationale:** The rename is a parameter and local variable rename only. The entity data shape (and therefore all layout logic) is unchanged.

---

### `src/hooks/useSimulator.js`

| What changes | What must not change |
|---|---|
| `const { ..., scenes, ... } = useEditorData()` → `common` | Type detection MECHANISM: still collection membership lookup |
| All `scenes[targetId]` → `common[targetId]`; `scenes[from.nodeId]` → `common[from.nodeId]` | `takenEdgeIds` construction logic — unchanged |
| Return value: `scenes` property → `common` property | All other returned values |

**Rationale:** The rename is a variable rename only. The mechanism (checking `common[id]`, `choices[id]`, `endings[id]` in priority order) is identical.

---

### Files changed in Phase B (consumer rename — atomic with `EditorContext.jsx`)

| File | Change |
|---|---|
| `src/App.jsx` | `scenes` → `common` in destructure; `Object.values(scenes)` → `Object.values(common)`; `scenes[entryNode]` → `common[entryNode]` |
| `src/utils/graphLayout.js` | `scenes` parameter → `common` throughout |
| `src/hooks/useSimulator.js` | `scenes` destructure + usages → `common`; return value renamed |
| `src/components/routeviewer/RouteViewer.jsx` | `scenes` prop/destructure → `common` if present |
| `src/components/layout/LeftSidebar.jsx` | `scenes` destructure from context → `common` if present |
| Any other consumer | Identified by pre-condition grep — rename to `common` |

### Files with NO changes

| File | Why |
|---|---|
| `src/utils/routeTracer.js` | Receives `scenes` (now `common`) as an argument — caller renames the argument; internal parameter name may also be renamed for consistency but logic is untouched. |
| `src/utils/dependencyGraph.js` | Same pattern — receives collections as arguments; internal logic is untouched. |
| `src/utils/reachabilityAnalyzer.js` | Pure graph algorithm — IDs are node labels only. |
| `src/utils/conditionUtils.js` | Does not inspect condition `id` fields in evaluation. Only reads `flag`, `state`, `status`, `min`, `max`. |
| `src/components/routeviewer/nodes/SceneNode.jsx` | Displays entity data. Type is determined by React Flow node `type` property, not entity ID prefix. |
| `src/components/modals/SceneModalForm.jsx` | Produces entity shapes on submit. Shape unchanged — IDs generated by `EditorContext`. |
| `src/components/layout/forms/SceneForm.jsx` | Same as above. |
| `src/components/shared/ConditionEditor.jsx` | Edits condition `id` field values if it generates IDs — **VERIFICATION REQUIRED before Phase C.** If it generates `cond_N_xxxx` IDs, update to `{PARENT_ID}_COND{###}`. |

---

### New Files Created

| File | Purpose |
|---|---|
| None in this refactor | All changes are in-place migrations and export key renames |

### Files Deleted or Merged

| File | Action |
|---|---|
| None | No files are deleted or merged |

---

## §5. Invariant Preservation Plan

### BI-1: Hydration with Migration

**How preserved:**  
The new migration functions (`migrateSceneIds`, `migrateOptionIds`, `migrateNextEntryIds`, `migrateVariantIds`, `migrateConditionIds`) are appended to the existing migration chain. When a user loads an old `S###`-format IndexedDB payload, the chain runs transparently and produces a fully migrated in-memory state. The migrated state is then immediately written back to IndexedDB on the next save cycle.

**Test confirms it:**  
Load a legacy `S###`-format IndexedDB payload (or the `example_main_structure.json` file imported via the app's Import function, using the old `scenes` key). Verify all entities hydrate with `N###` IDs. Verify `entryNode` updates from `S001` → `N001`. Verify no `S###` remains in any `next.target`.

---

### BI-2: Auto-Save Debounce

**How preserved:**  
The auto-save `useEffect` saves `{ flags, choices, common, paths, chapters, statusPoints, quests, endings, entryNode, sceneTypes }`. After Phase B rename, `common` holds `N###`-keyed entities. The auto-save writes them under the key `common` in IndexedDB. The hydration path reads `saved.common || saved.scenes` — the `|| saved.scenes` fallback handles existing IndexedDB data stored before the rename. No changes to the debounce mechanism or the `isInitialMount` guard.

**Test confirms it:**  
Trigger a migration by loading old data. Watch IndexedDB writes. Confirm: (1) one write occurs after the 500ms debounce, (2) the write contains `N###` keys under the `common` key in IndexedDB, (3) initial hydration load itself does not trigger a write.

**Edge case:** Migration functions produce "anyChanged = true", causing state updates (via `setCommon`, `setChoices`, etc.), which WILL trigger a save. This is correct — migrated data must be persisted. The `isInitialMount` guard is bypassed because these are reactive state updates, not the initial mount render.

---

### BI-3: Export/Import Round-Trip

**How preserved:**  
Phase A adds backward-compat import: `handleImport` accepts `data.common || data.scenes`. A file exported with the new `common` key can be re-imported because `handleImport` reads `data.common`. A file exported with the old `scenes` key can still be imported because the fallback `data.scenes` is accepted.

Round-trip fidelity: Export → Import → Export must yield identical JSON. After Phase B+C migration runs on import, the second export produces `N###` IDs. The first export (from old data) also has `N###` IDs (if migration ran before export). Therefore both exports are structurally identical.

**Test confirms it:**  
Export current project (after migration) → clear data → import exported file → export again → diff. Structural identity expected.

---

### BI-4: Simulation Traversal

**How preserved:**  
After Phase B, `useSimulator` destructures `common` (renamed from `scenes`) from `useEditorData()`. Type detection becomes `common[targetId]`, `choices[targetId]`, `endings[targetId]`. The `common` map is keyed by `N###`. When traversal resolves a `target` field (now `N###`), `common['N001']` correctly returns the entity. The mechanism is identical — only the variable name changed.

The `takenEdgeIds` computation reads `route._id` from the entity's `next[]` and `opt.id` from `choice.options[]`. After Phase C migration, these are hierarchical IDs. `graphLayout.js` reads the same fields from the same entity data. Both sides construct edge IDs from identical source values → edge IDs match.

**Test confirms it:**  
Start simulation at entry node. Traverse: N001 → CH001 → N002 → E001. Verify: flags accumulate, `takenEdgeIds` highlights the correct edges on the graph, undo restores previous state.

---

### BI-5: Condition Evaluation

**How preserved:**  
`evaluateGroup` reads `condition.flag`, `condition.state`, `condition.status`, `condition.min`, `condition.max`. It does NOT read `condition.id`. The `id` field is only used for edge ID construction and display. Renaming condition `id` values does not affect evaluation.

**Test confirms it:**  
After Phase C migration: run existing `conditionUtils.test.js` test suite. All tests must pass. No changes are made to `conditionUtils.js`.

---

### BI-6: Graph Layout & Position Persistence

**How preserved:**  
`graphLayout.js` reads `entity._position` from the entity object. The migration functions operate on `id`, entity map keys, and `target` values — they do not touch `_position`. Position data passes through migrations untouched.

`resetAllPositions` uses destructuring `const { _position, ...rest } = v` — this field name is unchanged.

**Test confirms it:**  
Drag a node in the pre-migration state. Force migration (load old data file). Verify the node is in the same position after migration. Export. Import. Verify positions preserved.

---

### BI-7: Entity Deletion with Reference Protection

**How preserved:**  
`deleteScene`, `deleteChoice`, `deleteEnding` check if the entity `id` appears as a `route.target`. After migration, scene IDs are `N###`. The deletion check iterates `scene.next[].target` values — these have been migrated from `S###` to `N###` in Phase B. So when checking if `N001` is referenced, the scan correctly finds `target === 'N001'`. No change needed to the deletion logic.

**Test confirms it:**  
After migration, create a link from N002 → N001. Attempt to delete N001. Verify it is blocked with N002 listed as referencing. Delete the link. Delete N001. Verify success.

---

### BI-8: ID Generation with Prefix Convention

**How preserved:**  
`generateId('N', scenesRef.current)` correctly scans keys starting with `'N'`, finds the max numeric suffix, and increments. The existing mechanism is unchanged — only the prefix argument changes from `'S'` to `'N'`.

`reorderScenes` reassigns to `` `N${...}` `` — consistent with the new prefix.

**Test confirms it:**  
After migration: create a new scene. Verify its ID is `N{max+1}`. Reorder scenes. Verify all IDs are `N001`, `N002`, ... in order. Verify cross-references update correctly.

---

### BI-9: Name Sanitization

**How preserved:**  
`sanitizeName` and `sanitizeCollection` operate on the `name`/`text` fields of entities. These are unchanged. Migration functions do not touch name fields.

**Test confirms it:**  
Import a file with mixed-case scene names. Verify names are sanitized. No change to sanitization logic.

---

## §6. Risk Register

### R1 — Export/Import Key Asymmetry (Phase A)

**Risk:** `handleExport` renames `scenes` → `common` but `handleImport` still validates for `scenes`. Existing old `.json` backups become non-importable.  
**Severity:** HIGH  
**Early detection signal:** Attempt to import an old `.json` backup immediately after Phase A lands. If it fails validation, the backward-compat shim is incomplete.  
**Mitigation:** Phase A must update both `handleExport` AND `handleImport` atomically. The `sliceKeys` validation array in `handleImport` must accept both `common` and `scenes` (use whichever is present). The `validateEntities` calls must also check the correct key. Write the Phase A change as a single commit covering both directions.

---

### R2 — `useSimulator` Silent Failure on `N###` Type Detection (Phase B)

**Risk:** If any code path between Phase A and Phase B partially renames `S###` to `N###` without updating all `target` cross-references, `useSimulator`'s `common['N001']` lookup may succeed but the simulation may encounter a `target` value still in `S###` format, returning `undefined` from the `common` map.  
**Severity:** HIGH  
**Early detection signal:** Start simulation. Attempt to traverse from a scene to any next node. If the next step resolves as `type === 'unknown'` or throws "Target ID not found", `target` cross-references are incomplete.  
**Mitigation:** `migrateSceneIds` must atomically update: (1) the `common` map keys, (2) all `entity.id` fields inside, (3) all `next.target` values in common nodes, (4) all `choice.options[].next[].target` values, (5) `entryNode`. No partial migration is safe. The function must process ALL entities in a single pass before returning.

---

### R3 — Backward-Compat Import Shim Permanence (Phase A/E)

**Risk:** If the `data.scenes` fallback import path is removed in Phase E, users with old `.json` backups exported before this refactor can never import them again.  
**Severity:** MEDIUM  
**Early detection signal:** Ask: "Does any user have a `.json` backup that uses the `scenes` key?" Answer: YES — any backup exported before this push.  
**Mitigation:** **Keep the `data.scenes` fallback shim permanently.** The cost is three lines of code. The benefit is permanent backward-compatibility for all existing user backups. This is explicitly supported by HS-2 exemption logic — the import path must continue to accept the OLD format. Phase E must NOT remove the shim.

---

### R4 — Hierarchical Condition ID Migration Depth (Phase C)

**Risk:** Condition IDs are nested arbitrarily deep (`requires.conditions` → each entry can be a leaf OR a sub-group with its own `conditions`). A non-recursive migration will silently miss nested condition IDs at depth > 1.  
**Severity:** HIGH  
**Early detection signal:** After Phase C, inspect a scene or choice that has an `OR` sub-group inside its `requires`. Check if the IDs inside the nested `OR` group have been migrated. Example: `CH001.requires.conditions[2]` is an OR group containing two conditions with IDs `cond_14_t5ta` and `cond_15_uaro`. If these still have the old format after migration, the migration is shallow.  
**Mitigation:** `migrateConditionIds` MUST be recursive. The function signature must accept the current parent path (for building the hierarchical ID) and a counter per parent scope. Test explicitly on the `example_main_structure.json` data which contains 2-level nested OR groups.

---

### R5 — `ConditionEditor.jsx` Generates New Condition IDs (Phase C)

**Risk:** The `ConditionEditor.jsx` component may generate new condition IDs when adding conditions to a `requires` group. If it still uses the old `cond_N_xxxx` format after Phase C, newly added conditions will have inconsistent IDs. This would be invisible at runtime (evaluation ignores `id`) but violates the schema invariant and causes confusion in debugging.  
**Severity:** MEDIUM  
**Early detection signal:** After Phase C, open a scene or choice form, add a new condition to its `requires`. Inspect the entity in export JSON. If the new condition ID is `cond_N_xxxx`, the `ConditionEditor` was not updated.  
**Mitigation:** Before Phase C begins, audit `ConditionEditor.jsx` for any code that generates condition IDs. If it generates them, update to the hierarchical format. If it does not (if IDs are generated only at migration time or by a separate utility), no change needed. **This audit is a Phase C pre-condition.**

---

### R6 — `replaceIdReferences` Coverage After Scene ID Changes (Phase B)

**Risk:** `replaceIdReferences` (EditorContext.jsx:457-476) traverses the object tree replacing values of specific keys (`flag`, `status`, `target`, `flags_set`, `status_set`). It does NOT handle the `entryNode` value (which is a top-level string, not a nested key). If `migrateSceneIds` delegates to `replaceIdReferences`, the `entryNode` will be missed.  
**Severity:** MEDIUM  
**Early detection signal:** After Phase B migration, check if `entryNode` is still `S001`. If so, the `entryNode` update was missed.  
**Mitigation:** `migrateSceneIds` must explicitly handle `entryNode` renewal separately from `replaceIdReferences`. This pattern already exists in `reorderScenes` (line 585-587) — follow the same pattern:  
```js  
if (entryNodeRef.current && idMap[entryNodeRef.current]) setEntryNode(idMap[entryNodeRef.current]);  
```

---

### R7 — IndexedDB Data Loss After Internal Slice Rename (Phase B)

**Risk:** After Phase B, the auto-save writes `{ common: {...} }` to IndexedDB. But users who load the app for the first time after the rename still have data stored as `{ scenes: {...} }` in IndexedDB. If the hydration `useEffect` only reads `saved.common`, existing user data silently disappears — the canvas shows empty.  
**Severity:** CRITICAL  
**Early detection signal:** Load the app after Phase B without clearing IndexedDB. If the canvas is empty and no error is shown, the hydration backward-compat shim is missing.  
**Mitigation:** The hydration `useEffect` MUST read `saved.common || saved.scenes`. This is a one-line change: the `|| saved.scenes` fallback ensures existing IndexedDB data under the old key is still loaded. On next save, data is written under `common`, permanently migrating the IndexedDB key. This shim can be kept permanently (zero cost, zero risk).

---

### R8 — Phase B Commit Atomicity (Multiple Files)

**Risk:** Phase B now touches `EditorContext.jsx`, `useSimulator.js`, `graphLayout.js`, `App.jsx`, `RouteViewer.jsx`, `LeftSidebar.jsx`, and potentially other components. If any one file is missed in the commit, the app is broken until the missing file is updated. Unlike previous plans where Phase B was a single-file change, the blast radius is now larger.  
**Severity:** HIGH  
**Early detection signal:** Run the app immediately after committing Phase B. Any `undefined is not iterable` or `Cannot read properties of undefined` errors at the graph/simulation layer indicate a missed consumer.  
**Mitigation:** Use the pre-condition grep (`grep -r "scenes" src/ --include="*.jsx" --include="*.js"`) to enumerate ALL consumers before writing a single line of code. Complete the rename across ALL files in a single commit. Do not commit partial renames.

---

## §7. Save Task Completion Report

**Report location:** `/informations/runs/03-04-2026_refactor/ran_0404_plan.md` ← this file

---

## Appendix A: Phase Execution Order Summary

```
Phase A: Export/Import Bridge    [App.jsx only]                              Rollback: LOW
Phase B: Scene ID + Slice Rename [EditorContext + ALL consumers — ATOMIC]    Rollback: HIGH
Phase C: Sub-ID Migration        [EditorContext.jsx]                         Rollback: MEDIUM
Phase D: Field Order             [App.jsx handleExport only]                 Rollback: LOW
Phase E: Cleanup                 [App.jsx, minor components]                 Rollback: LOW
```

Each phase boundary is a safe stop point. The system remains fully functional between phases (migrations are backward-compatible within each phase boundary).

---

## Appendix B: Pre-Conditions Checklist Before Execution

- [ ] Export current project data to `.json` file (creates the `S###`-keyed rollback backup)
- [ ] Verify `conditionUtils.test.js` all pass (baseline)
- [ ] Audit `ConditionEditor.jsx` for condition ID generation (Phase C pre-condition)
- [ ] Confirm no entity type currently uses `N` as a prefix (confirmed safe per scope document — no `N###` prefix exists)
- [ ] Confirm that the IC1 edge ID fix from Push 1 is preserved: the edge ID format `${id}-next-${routeIdPart}` and `${id}-opt-${optId}-${target}` is not changed — only the values fed into those patterns change
- [ ] **Phase B pre-condition:** Run `grep -r "scenes" src/ --include="*.jsx" --include="*.js" -l` to enumerate every consumer. Every file in that list must be in the Phase B atomic commit.

---

## Appendix C: Manual Test Checklist (Verification After Each Phase)

### After Phase A
- [ ] Export produces `common` key (not `scenes`) for scene entities
- [ ] Export produces `metadata.common_node_types` (not `metadata.scene_types`)
- [ ] Import of old `.json` backup (using `scenes` key) succeeds without data loss
- [ ] Import of new `.json` (using `common` key) succeeds
- [ ] Simulation still works normally (no ID changes yet)

### After Phase B
- [ ] All common-node IDs in IndexedDB are `N###` — no `S###` remains in `id` fields
- [ ] `entryNode` updated from `S###` to `N###` if it was a scene
- [ ] No `S###` string in any `next.target` field across any entity
- [ ] IndexedDB data stored as `{ common: {...} }` (not `scenes`) — verify with browser DevTools
- [ ] Existing pre-Phase-B IndexedDB data (stored under `scenes` key) loads correctly — test by manually setting IndexedDB to old format and reloading
- [ ] Simulation: start at entry, traverse through scene → choice → ending — works
- [ ] Graph: all edges render, none missing
- [ ] `useSimulator` returns `common` (not `scenes`) in its return value — verify callsites updated

### After Phase C
- [ ] All condition IDs follow `{PARENT_ID}_COND{###}` pattern at ALL nesting depths
- [ ] All option IDs follow `{CHOICE_ID}_OPT{###}` pattern
- [ ] All next-entry IDs follow `{PARENT_ID}_NE{###}` pattern
- [ ] Simulation: traverse path — edge highlighting still works (`takenEdgeIds` matches `graphLayout` edges)
- [ ] `conditionUtils.test.js` all still pass

### After Phase D
- [ ] Exported JSON field order matches agreed target schema
- [ ] Import of Phase-D-exported file succeeds (round-trip test)

### After Phase E
- [ ] No regressions: full simulation run, export/import, position persistence
