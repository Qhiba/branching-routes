# Pre-Refactor Contract — Branching Routes Structural Refactor

> **Date:** 03-04-2026
> **Auditor Role:** Senior Pre-Refactor Assessor
> **Scope:** Export Schema / Data Contract, State Management & Migration Layer, Canvas / Graph Rendering, Simulation Engine, Form Layer
> **Source Map:** [ran_0401_understand.md](file:///f:/Projects/Web/branching-routes/informations/runs/03-04-2026_refactor/ran_0401_understand.md)
> **Architecture Rules:** [architecture_rules.md](file:///f:/Projects/Web/branching-routes/informations/docs/architecture_rules.md)

---

## §0. Migration Declaration

**Does this refactor touch any persisted key, field name, or export format?**

### **YES**

The refactor explicitly targets the Export Schema and Data Contract. The following persisted keys and structures are touched or at risk:

| # | Persisted Key / Field | Storage Layer | Current Format | Risk Level |
|---|---|---|---|---|
| 1 | `flags` | `localforage` key `branching-routes-data` | `Object<F*: {id, name, state, path, chapter}>` | HIGH |
| 2 | `choices` | `localforage` key `branching-routes-data` | `Object<CH*: {id, text, options[], requires, ...}>` | HIGH |
| 3 | `scenes` | `localforage` key `branching-routes-data` | `Object<S*: {id, name, next[], requires, variants[], ...}>` | HIGH |
| 4 | `paths` | `localforage` key `branching-routes-data` | `Object<P*: {id, name}>` | MEDIUM |
| 5 | `chapters` | `localforage` key `branching-routes-data` | `Object<C*: {id, name}>` | MEDIUM |
| 6 | `statusPoints` | `localforage` key `branching-routes-data` | `Object<SP*: {id, name, value, minValue}>` | HIGH |
| 7 | `quests` | `localforage` key `branching-routes-data` | `Object<Q*: {id, name}>` | LOW |
| 8 | `endings` | `localforage` key `branching-routes-data` | `Object<E*: {id, name, requires, ...}>` | HIGH |
| 9 | `entryNode` | `localforage` key `branching-routes-data` | `String` (ID reference e.g. `"S001"`) | MEDIUM |
| 10 | `sceneTypes` | `localforage` key `branching-routes-data` | `Array<String>` | LOW |
| 11 | Export blob | `.json` file download | Full document with `metadata`, `path`, `chapter`, `flags`, `choices`, `scenes`, `status`, `quests`, `endings` | CRITICAL |

> **Migration sub-phase is MANDATORY for all 11 keys listed above before Self-Review proceeds.**
>
> Undeclared keys remain under full hard stop protection.

### Export Key Name Asymmetry (Pre-Existing)

The export blob uses different key names than the internal state in two places:

| Internal State Key | Export Key | Import Mapping (in `loadData`) |
|---|---|---|
| `statusPoints` | `status` | `data.status → sp` |
| `paths` | `path` | `data.path → paths` |
| `chapters` | `chapter` | `data.chapter → chapters` |

This asymmetry is load-bearing. Any refactor that normalizes these names must update both `handleExport` (App.jsx:97-113) and `handleImport` (App.jsx:139-204) simultaneously, plus the `loadData` signature (EditorContext.jsx:1104).

---

## §1. Behavioral Invariants

These behaviors must be identical before and after the refactor. Non-negotiable.

### BI-1: Hydration with Migration

- **What:** On mount, `EditorContext` loads from IndexedDB key `branching-routes-data` and runs all migration functions (`migrateOptionNext`, `migrateSceneFields`, `migrateFlagFields`, `migrateChoiceRequires`, `migrateSceneRequires`, `migrateEndingRequires`) in sequence. A project saved under any prior schema version must load without data loss.
- **Why:** Users have live data in IndexedDB. Silent upgrade on hydration (Architecture Rule 12) is the only backward-compatibility mechanism.
- **Test:** Load a pre-migration IndexedDB blob. Verify all entities hydrate correctly with new fields populated and legacy structures normalized.

### BI-2: Auto-Save Debounce

- **What:** Every state mutation saves the full state dictionary to `localforage` after a 500ms debounce. No partial saves. The first render after hydration does NOT trigger a save.
- **Why:** Architecture Rules 5 + 6. Breaking debounce order or adding partial saves corrupts data.
- **Test:** Make a state change, wait <500ms, make another. Confirm only one IndexedDB write occurs. Confirm initial mount does not write.

### BI-3: Export/Import Round-Trip

- **What:** `handleExport` produces a JSON blob with exact top-level keys `{ metadata, path, chapter, flags, choices, scenes, status, quests, endings }`. `handleImport` reads this blob, validates it, and feeds it to `loadData`. The round-trip must be lossless: export → import → export yields identical JSON (ignoring `metadata.created_at` / `metadata.updated_at` timestamps).
- **Why:** This is the user's DATA BACKUP mechanism (Architecture Rule 45). Breaking it means permanent data loss with no recovery path.
- **Test:** Export. Clear data. Import the exported file. Export again. Diff the two files — they must be structurally identical.

### BI-4: Simulation Traversal

- **What:** `useSimulator` advances through nodes by reading `scene.next[].target` and `choice.options[].next[].target`, evaluating `requires` via `evaluateGroup`, and accumulating `flags_set` / `status_set` mutations into `activeState`. History stack enables undo/revive.
- **Why:** This is the core interactive feature. The simulator's type detection (`scenes[targetId]`, `choices[targetId]`, `endings[targetId]`) and its edge ID formats for `takenEdgeIds` are tightly coupled to entity shapes.
- **Test:** Start simulation at entry node. Traverse through Scene → Choice → Ending. Verify flags/status accumulate correctly. Verify `takenEdgeIds` highlight the correct edges. Verify undo restores previous state.

### BI-5: Condition Evaluation

- **What:** `evaluateGroup` recursively evaluates `{ operator: 'and'|'or', conditions: [...] }` structures where leaves are `{ flag, state }` or `{ status, min, max }`. Empty AND group = always true (fallback). This is used by both the simulator and route tracer.
- **Why:** Condition evaluation drives ALL branching logic. An incorrect evaluation silently corrupts narrative outcomes.
- **Test:** Existing test suite in `conditionUtils.test.js`. All tests must pass unchanged.

### BI-6: Graph Layout & Position Persistence

- **What:** `graphLayout.js` reads `_position` from entities. Nodes with `_position` use stored coordinates; nodes without get Dagre-computed positions. Position updates flow through `updateNodePosition` and are stored as `_position` on the entity object (persisted to IndexedDB + export).
- **Why:** Users manually arrange nodes and expect layouts to survive across sessions (Architecture Rule 8). Losing `_position` destroys hours of manual arrangement.
- **Test:** Drag a node. Reload the page. Verify the node is in the same position. Export. Import into a clean state. Verify positions are preserved.

### BI-7: Entity Deletion with Reference Protection

- **What:** `deleteScene`, `deleteChoice`, `deleteEnding` check if the entity is referenced as a `target` in any `scene.next` or `choice.options[].next` entry. If referenced, deletion is blocked with an `alert()` listing all referencing entities. `deleteFlag` and `deleteStatusPoint` perform cascading cleanup instead (removing all references from `requires`, `flags_set`, `status_set` across all entities).
- **Why:** Orphaned references cause simulation crashes and graph rendering errors. Different entity types require different deletion strategies — nodes are protected, metadata items are cascaded.
- **Test:** Create a scene chained to another scene. Attempt to delete the target scene. Verify it is blocked. Delete the referencing route first, then delete the scene. Verify success.

### BI-8: ID Generation with Prefix Convention

- **What:** `generateId(prefix, collection)` scans existing keys, finds the max numeric suffix, and increments by 1 with zero-padded 3-digit formatting. Prefixes: `S` (scenes), `CH` (choices), `E` (endings), `F` (flags), `P` (paths), `C` (chapters), `SP` (status points), `Q` (quests).
- **Why:** ID prefixes are used for type identification in `useSimulator` (lines 97-103, 121-127) and for edge ID construction in `takenEdgeIds` (lines 221-250). The `reorder*` functions assume specific prefix formats for remapping (e.g., `F${(index+1).toString().padStart(3, '0')}`).
- **Test:** Add multiple entities of each type. Verify IDs follow the expected pattern. Verify reorder produces contiguous IDs.

### BI-9: Name Sanitization

- **What:** `sanitizeName` converts to lowercase and replaces spaces with underscores, stripping non-alphanumeric characters. Applied on every create/update and on import via `sanitizeCollection`.
- **Why:** Architecture Rule 4. Entity names are used as cross-reference keys in some contexts. Inconsistent naming breaks lookups.
- **Test:** Create a flag named "Hello World!". Verify it becomes "hello_world". Import data with mixed-case names. Verify they are sanitized.

---

## §2. Data Contract Invariants

These data structures, formats, and conventions must survive unchanged.

### DC-1: `requires` Group Structure

- **Format:** `{ operator: 'and'|'or', conditions: Array<LeafCondition | ConditionGroup> }`
- **Leaf types:** `{ flag: string, state: boolean }` OR `{ status: string, min?: number, max?: number }`
- **Consumed by:** `evaluateGroup` (conditionUtils.js), `flattenConditions`, `filterConditions`, `conditionsSummary`, all migration functions, `dependencyGraph.js`, `routeTracer.js`, `graphLayout.js`, all form components that edit conditions
- **Breaks if changed:** Every condition evaluation in the app — simulation, route tracing, dependency graph, reachability analysis, UI condition display

### DC-2: Scene `next` Array

- **Format:** `Array<{ _id?: string, target: string, requires: ConditionGroup }>`
- **Consumed by:** `useSimulator.handleSceneContinue`, `graphLayout.buildNodesAndEdges`, `dependencyGraph.addEdge`, `routeTracer.annotatePath`, all scene form components
- **Breaks if changed:** Simulation stops advancing from scenes. Graph edges disappear. Route tracer produces empty paths. Export/import loses routing.

### DC-3: Choice `options` Array

- **Format:** `Array<{ id: string, label: string, requires: ConditionGroup, flags_set: string[], status_set: Array<{status, amount}>, next: Array<{requires, target}> }>`
- **Consumed by:** `useSimulator.handleOptionSelect`, `graphLayout.buildNodesAndEdges` (edges from choice options), `dependencyGraph` (setter/getter scanning), `routeTracer.getOptionTargets`, all choice form components
- **Breaks if changed:** Simulation cannot process choice selections. Graph loses choice → target edges. Dependency analysis misses flag/status mutations.

### DC-4: Entity ID Prefix Convention

- **Convention:** `S###` (Scenes), `CH###` (Choices), `E###` (Endings), `F###` (Flags), `P###` (Paths), `C###` (Chapters), `SP###` (Status Points), `Q###` (Quests)
- **Consumed by:** `generateId`, all `reorder*` functions, `useSimulator` type detection (lines 97-103), edge ID construction in both `graphLayout.js` and `useSimulator.takenEdgeIds`
- **Breaks if changed:** Type detection fails (simulator can't identify nodes). Reorder produces corrupt IDs. Edge highlighting breaks.

### DC-5: Edge ID Format

- **Scene edges:** `${scene.id}-next-${route._id || 'route_fallback_' + idx}`
- **Choice edges:** `${choice.id}-opt-${opt.id || 'opt_fallback_' + idx}-${target}`
- **Consumed by:** `graphLayout.js` (edge generation, lines 142-196), `useSimulator.takenEdgeIds` (lines 221-250), `RouteViewer` (edge highlighting)
- **Breaks if changed:** Simulation highlighting breaks — edges won't match between `takenEdgeIds` and the edges array. Visual simulation feedback becomes completely non-functional.

### DC-6: `_position` Field Convention

- **Format:** `{ x: number, y: number }` stored as `_position` on scene, choice, and ending entities
- **Consumed by:** `graphLayout.buildNodesAndEdges` (reads `entity._position`), `computeLayoutWithPositions`, `updateNodePosition` (EditorContext.jsx:861-879), `resetAllPositions`
- **Breaks if changed:** Manual node positions lost. Layout reverts to auto-Dagre on every render. `nudgeTargetIfNeeded` stops working.

### DC-7: `flags_set` / `status_set` Arrays

- **`flags_set`:** `string[]` — array of flag IDs
- **`status_set`:** `Array<{ status: string, amount: number }>` — status point mutations
- **Present on:** Scene entities, Choice option sub-objects
- **Consumed by:** `useSimulator.traverseNext` (pushes to active state), `dependencyGraph` (setter/mutator detection), `routeTracer.annotatePath`, `deleteFlag`/`deleteStatusPoint` cascading cleanup
- **Breaks if changed:** Simulation stops accumulating flag/status state. Dependency graph loses mutation edges. Cascading delete misses references.

### DC-8: IndexedDB Storage Key

- **Key:** `branching-routes-data`
- **Database name:** `branching-routes`
- **Store name:** `editor_data`
- **Driver:** `localforage.INDEXEDDB`
- **Consumed by:** `EditorContext.jsx` hydration (line 213) and auto-save (line 264)
- **Breaks if changed:** All existing user data becomes inaccessible. Users lose their projects with no recovery path except manual `.json` exports they may not have.

### DC-9: Export Blob Top-Level Keys

- **Keys:** `metadata`, `path`, `chapter`, `flags`, `choices`, `scenes`, `status`, `quests`, `endings`
- **Note:** Internal keys `statusPoints`, `paths`, `chapters` map to export keys `status`, `path`, `chapter` respectively
- **Consumed by:** `handleExport` (App.jsx:97-113), `handleImport` (App.jsx:126-211), `loadData` (EditorContext.jsx:1104)
- **Breaks if changed:** Existing exported `.json` files become non-importable. Users lose their data backups.

### DC-10: `metadata` Sub-Structure

- **Format:** `{ version: string, created_at: string, updated_at: string, entry_node: string, scene_types: string[] }`
- **Consumed by:** `handleExport`, `handleImport`, `loadData` (reads `metadata.entry_node` and `metadata.scene_types`)
- **Breaks if changed:** Entry node lost on import. Scene types lost on import.

### DC-11: Option ID Format

- **Format:** `opt_${Date.now()}_${random}` — generated in `addChoiceOption` (EditorContext.jsx:969)
- **Consumed by:** Edge ID construction (DC-5), `sourceHandle` in graph edges, `takenEdgeIds` in simulator
- **Breaks if changed:** Edge ID mismatches between graph layout and simulator.

### DC-12: Route `_id` Field

- **Format:** Auto-generated string, stored as `_id` on `scene.next[]` route entries
- **Consumed by:** Edge ID construction (DC-5), `sourceHandle` in graph edges, `takenEdgeIds` in simulator
- **Breaks if changed:** Same as DC-11 — edge highlighting breaks.

### DC-13: `entryNode` Value

- **Format:** String ID of a Scene or Choice entity. Never an Ending.
- **Consumed by:** `useSimulator.handleStart`, `handleExport` validation, `NavBar` entry point dropdown, `routeTracer` as start node
- **Breaks if changed:** Export fails validation. Simulation cannot start. Route tracing produces empty results.

### DC-14: Active State Shape in Simulator

- **Format:** `{ flags: { [flagId]: boolean }, status: { [statusPointId]: number } }`
- **Consumed by:** `evaluateGroup` (expects this exact shape), `useSimulator.activeState`
- **Breaks if changed:** All condition evaluation produces wrong results. Simulation becomes non-functional.

---

## §3. Load-Bearing Assumptions Inventory

These assumptions are load-bearing and must remain true after the refactor.

### LBA-1: Entity maps are keyed by entity ID

All entity collections (`flags`, `scenes`, `choices`, etc.) are plain objects keyed by the entity's own `id` field. The key always equals `entity.id`. Assumed globally by every CRUD operation, `generateId`, all `reorder*` functions, and all graph/simulation utilities.

### LBA-2: Simulator type detection relies on collection membership

`useSimulator` determines node type by checking `scenes[id]`, `choices[id]`, `endings[id]` in that priority order (lines 97-103, 121-127). This is the ONLY type detection mechanism — there is no stored `type` field on the entity that the simulator reads.

### LBA-3: Route evaluation is sequential with first-match semantics

Both `useSimulator.handleSceneContinue` and `handleOptionSelect` use `.find()` on the `next` array, returning the FIRST route whose `requires` passes. The last entry in `next` with an empty `requires` group acts as a fallback. Changing to `.filter()` or `.findLast()` would alter narrative outcomes.

### LBA-4: Migration functions are idempotent

All migration functions (`migrateOptionNext`, `migrateSceneFields`, etc.) run on every hydration and every import. They must be safe to run on already-migrated data (no-op if data is already in the correct format). The `anyChanged` flag pattern ensures no unnecessary state updates.

### LBA-5: `replaceIdReferences` is a recursive deep-replace

The `replaceIdReferences` function (EditorContext.jsx:457-476) traverses the entire object tree, replacing values of keys named `flag`, `status`, `target`, `flags_set` entries, and `status_set[].status`. This is how `reorder*` functions update cross-references. It must visit every nesting level.

### LBA-6: `_position` is stripped by `resetAllPositions`

The `resetAllPositions` function destructures each entity to remove `_position`, which triggers Dagre to re-layout all nodes. The `_position` field MUST be an optional add-on — removing it must not break any entity.

### LBA-7: Edge IDs must match between graphLayout and useSimulator

`graphLayout.js` generates edge IDs using DC-5 format. `useSimulator.takenEdgeIds` reconstructs the same ID format from the history stack. If these formats diverge, edge highlighting breaks silently (no error, just no visual feedback).

### LBA-8: Empty requires group means "always passes"

`evaluateGroup` returns `true` for `{ operator: 'and', conditions: [] }`. This is how fallback routes work. Every place that creates a new entity initializes `requires` to `{ operator: 'and', conditions: [] }`. Changing this default would make all new entities unreachable.

---

## §4. Acceptable Change Surface

The following are genuinely safe to restructure without risk:

### Safe to Change

| Area | What Can Change | Why It's Safe |
|---|---|---|
| **File organization** | Move files, rename files, split components into sub-components | No runtime dependency on file paths. Vite handles resolution. |
| **CSS / Styling** | Restyle all UI components, change class names, restructure stylesheets | No CSS is persisted. No component tests depend on styling. |
| **Internal component state** | Refactor `useState` to `useReducer`, restructure component local state | Not persisted. Not part of the data contract. |
| **Ref management** | Change how refs are passed, use `forwardRef`, restructure ref patterns | Implementation detail, not persisted. |
| **Memoization strategy** | Add/remove `useMemo`/`useCallback`, change dependency arrays | Performance optimization, not behavioral. |
| **Form component structure** | Restructure modal forms, change form validation patterns, add new form fields | As long as they produce the same entity shape on submit. |
| **UI layout** | Restructure sidebar/panel layout, change navigation patterns | No runtime behavior dependency. |
| **Error messages** | Change alert text, replace `alert()` with custom dialogs | UX improvement, not behavioral. |
| **Code comments** | Add, remove, or modify comments | No runtime effect. |
| **Import/require paths** | Restructure module boundaries, move utilities, change barrel exports | Build-time concerns only. |
| **NavBar / LeftSidebar / RightSidebar** | Restructure these components internally | They only consume/dispatch context — they don't define the data contract. |
| **`reachabilityAnalyzer.js`** | Refactor internal algorithm | Pure utility, no side effects, output format can change if consumers are updated. |

### Safe ONLY With Coordination

| Area | Condition |
|---|---|
| **Adding new fields to entities** | Must add with `undefined`/`null` default. Must add migration function. Must not break `_position` stripping. |
| **Renaming internal state variables** | Must update ALL consumers simultaneously. Must not change persisted key names. |
| **Splitting `EditorContext.jsx`** | Must preserve the exact same public API (hooks `useEditorData`, `useEditorActions`, `useEditor`). Must preserve auto-save covering ALL state slices. |

---

## §5. Hard Stop Conditions

Immediately stop the refactor if any of these conditions occur.

> **Note:** Keys declared in §0 are exempt — they follow the Migration sub-phase rule.

### HS-1: Data Model Breakage (SUSPENDED for declared keys)

**Condition:** Any change to the shape of persisted entities that cannot be reversed by a migration function.

**Exemption:** §0 declared keys may be changed IF a migration function is provided that:
1. Converts old format → new format losslessly
2. Is idempotent (safe to run on already-migrated data)
3. Runs on both hydration AND import

### HS-2: Export Format Change (SUSPENDED for declared keys)

**Condition:** Any change to the export blob key names or top-level structure that would make existing `.json` exports non-importable.

**Exemption:** The import path must continue to accept the OLD format. Migration can happen inside `loadData` or `handleImport`.

### HS-3: ID Format Change (HARD STOP — NO EXEMPTION)

**Condition:** Any change to the ID prefix convention (`S###`, `CH###`, `E###`, `F###`, `P###`, `C###`, `SP###`, `Q###`).

**Why no exemption:** ID format is consumed by too many systems simultaneously (simulator type detection, edge ID construction, reorder functions, form components). A migration would need to update every cross-reference in the entire document atomically. The blast radius is the entire codebase.

### HS-4: Condition Format Change (HARD STOP — NO EXEMPTION)

**Condition:** Any change to the `{ operator, conditions }` group structure or the leaf condition shapes `{ flag, state }` / `{ status, min, max }`.

**Why no exemption:** Condition evaluation is the core branching mechanism. It is consumed by 6+ utilities, the simulator, and every form component. Changing it requires simultaneous updates to the entire stack. The existing test suite for `conditionUtils.js` would all break.

### HS-5: Edge ID Format Divergence

**Condition:** `graphLayout.js` edge ID format diverges from `useSimulator.takenEdgeIds` reconstruction format.

**Detection:** Enable simulation, traverse a path, and check if edge highlighting appears. If not, the formats have diverged.

### HS-6: Hydration → Save Cycle

**Condition:** The refactored code writes to IndexedDB during initial hydration (before `isInitialMount` guard trips).

**Detection:** Watch IndexedDB writes during page load. Zero writes expected before user interaction.

### HS-7: Loss of `_position` Data

**Condition:** Any code path that drops `_position` from entities during migration, save, or import (other than `resetAllPositions` which is user-initiated).

**Detection:** Drag a node. Reload. If the node has moved, `_position` was lost.

---

## §6. Pre-Refactor Verdict

### **PROCEED WITH CAUTION**

The refactor explicitly touches the data export format and persisted data structures (§0 Migration Declaration = YES). Per the constraint rules, this is automatically PROCEED WITH CAUTION minimum.

### Specific Risks to Watch

| Risk | Severity | Mitigation |
|---|---|---|
| **Export/Import asymmetry** — Internal keys (`statusPoints`, `paths`, `chapters`) differ from export keys (`status`, `path`, `chapter`). Any normalization must update both directions. | HIGH | Create a key-mapping constant. Never hardcode key names in more than one place. |
| **Migration chain ordering** — Migrations run in a specific order (`migrateOptionNext` → `migrateSceneFields` → `migrateChoiceRequires` → etc.). Adding new migrations must slot into this chain correctly. | MEDIUM | Document migration order explicitly. Add integration test for legacy data hydration. |
| **Edge ID coupling** — `graphLayout.js` and `useSimulator.js` independently construct the same edge ID strings. Any change to one MUST be mirrored in the other. | HIGH | Extract edge ID construction into a shared utility function before refactoring. |
| **Silent failure mode** — IndexedDB errors are silently caught (`.catch(() => {})`). If a migration produces corrupt data, the save will succeed but the data will be wrong, and no error will be visible. | MEDIUM | Add a migration validation step that logs warnings (not errors) to console. |
| **No automated component testing** — Only utility functions have tests. All behavioral invariants for the full stack (BI-1 through BI-9) must be verified manually. | MEDIUM | Write a manual test checklist derived from this contract before starting. |
| **`reorder*` functions perform global ID replacement** — If entity shapes change, `replaceIdReferences` must be updated to traverse the new shapes. This function is fragile because it hardcodes key names (`flag`, `status`, `target`, `flags_set`, `status_set`). | MEDIUM | Audit `replaceIdReferences` after every entity shape change. |
| **`loadData` accepts a different parameter object shape than the export blob** — It expects `{ paths, chapters, status }` but the export blob uses `{ path, chapter, status }`. The mapping happens in `handleImport`. This indirection is easy to get wrong. | MEDIUM | Add static assertion or comment-level documentation showing the mapping. |

### Pre-Conditions for Proceeding

1. Structural map is current (ran_0401_understand.md) — DONE
2. All existing tests pass (verify before first change) — VERIFY
3. Manual test checklist derived from this contract exists — PENDING
4. Backup of current IndexedDB data exported as `.json` — PENDING
5. Edge ID extraction utility created (recommended before refactor) — PENDING

### Contract Binding Statement

This contract defines the boundaries of the refactor. Any change that violates a Behavioral Invariant, Data Contract Invariant, or Hard Stop Condition without documented justification and an approved migration plan is a refactor failure, regardless of whether the code compiles and runs.

---

## §7. Untestable Risks

None of the invariants listed above are untestable. However, the following carry elevated testing difficulty:

| Item | Testing Difficulty | Issue |
|---|---|---|
| **BI-1 (Hydration with Migration)** | Moderate | Requires crafting legacy-format IndexedDB data manually. No automated test infrastructure exists for this. |
| **LBA-5 (`replaceIdReferences` depth)** | Moderate | Deeply nested data structures make exhaustive testing impractical. Edge cases in nested `requires` groups within `options[].next[].requires` are particularly risky. |
| **HS-6 (Hydration → Save Cycle)** | Moderate | Requires monitoring IndexedDB at the browser level. No automated test can verify this without a full browser environment. |
