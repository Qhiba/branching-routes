# Risk Register

## Immediate Concerns

### IC1. Choice edge IDs mismatch between `graphLayout.js` and `useSimulator.js`
- **The concern**: As detailed in F5: `graphLayout.js` generates edge IDs with format `${choiceId}-opt-${optIdPart}-${targetId}`, but `useSimulator.js` constructs taken-edge IDs as `${choiceId}-opt-${optIdPart}` (without the target suffix). These will never match, meaning choice-edge "taken" highlighting during simulation is silently broken.
- **Why it must be resolved first**: This is a user-visible bug in the core simulation visualization feature. Every simulation run shows incorrect edge states for choice transitions, undermining trust in the tool's primary purpose.
- **Suggested work type**: **Hotfix** — align the edge ID format in one of the two files.
- **Priority**: HIGH
- **Impact**: User experience, core functionality
- **Likelihood**: Certain (currently broken)

### IC2. ✅ RESOLVED - `handleEdgesDelete` sets `next: null` instead of `next: []`
- **The concern**: As detailed in D2: deleting a choice edge on the canvas sets `opt.next = null`, which violates the post-migration contract that `next` is always an array. This can cause runtime errors in the simulator, graph layout, and dependency graph until the next page reload triggers migration.
- **Why it must be resolved first**: This is a data corruption vector reachable through a common user action (deleting an edge on the canvas). Any subsequent interaction with the affected choice option can crash or produce incorrect behavior.
- **Suggested work type**: **Hotfix** — change `next: null` to `next: []` on line 405 of `RouteViewer.jsx`.
- **Priority**: HIGH
- **Impact**: Data integrity, application stability
- **Likelihood**: High (common user action)

### IC3. Silent IndexedDB error swallowing with no user feedback
- **The concern**: As detailed in D6: all `localforage` errors are silently caught. In private browsing mode or when quota is exceeded, users edit with no awareness that their work isn't being saved.
- **Why it must be resolved first**: This is a data loss risk for any user in private browsing mode, which is a non-trivial usage scenario. The fix is minimal — detect the first save failure and show a persistent warning banner.
- **Suggested work type**: **Iteration** — add a `saveError` state flag that shows a non-blocking warning when auto-save fails.
- **Priority**: MEDIUM
- **Impact**: Data loss, user trust
- **Likelihood**: Medium (private browsing usage)

## Fragility Register

### F1. `EditorContext.jsx` — `reorderChoices()` double-writes to `setChoices`
- **Location**: `EditorContext.jsx`, `reorderChoices` (~lines 535–560)
- **Why it is fragile**: The function calls `setChoices(newChoices)` with the reordered map, then immediately calls `setChoices(prev => applyMap(prev))` again to replace ID references. Because React batches state updates, the second call's `prev` is the result of the first call — but this is an implementation detail of React's batching behavior. If batching semantics change or if this runs in a context where updates are flushed synchronously (e.g., inside a `flushSync`, or React changes batching rules), the second call could operate on stale state.
- **What specifically could break**: Choice ID references across the entire data model could fail to update, leaving dangling pointers in scenes, endings, and the entry node.
- **Severity**: MEDIUM (currently works under React 19 batching, but is a landmine for future changes)
- **Priority**: MEDIUM
- **Impact**: Data integrity, cross-references
- **Likelihood**: Low (current React behavior)

### F2. `EditorContext.jsx` — `deleteFlag` / `deleteStatusPoint` cascading cleanup uses `JSON.stringify` for equality checks
- **Location**: `EditorContext.jsx`, `deleteFlag` (~lines 391–454), `deleteStatusPoint` (~lines 743–806)
- **Why it is fragile**: Both functions use `JSON.stringify(newReqs) !== JSON.stringify(choice.requires)` to detect whether conditions changed. JSON.stringify is order-sensitive — if any upstream code reorders object keys (or a migration adds/removes properties), this comparison silently fails, causing the function to skip necessary cleanup or perform unnecessary re-renders.
- **What specifically could break**: Deleted flags/status points could remain as phantom references inside condition trees, causing evaluation errors when the simulator tries to look them up.
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Impact**: Data integrity, evaluation errors
- **Likelihood**: Low (current data structure stable)

### F3. `EditorContext.jsx` — `generateId` relies on sequential numeric parsing
- **Location**: `EditorContext.jsx`, `generateId` (~lines 12–20)
- **Why it is fragile**: The function parses existing IDs by stripping a prefix and calling `parseInt`. It then takes `Math.max(...existingIds)` and adds 1. If a collection has many items, `Math.max(...existingIds)` spreads all IDs as arguments — this will throw a `RangeError` on very large datasets (browser-dependent, typically >100K items). More practically, if IDs are ever manually edited or imported with non-standard patterns, `parseInt` may produce `NaN`, which is filtered, but the function could then generate a colliding ID like `S001` if all existing IDs fail parsing.
- **What specifically could break**: ID collisions during entity creation, silently overwriting existing entities.
- **Severity**: LOW (unlikely for typical use, but unguarded)
- **Priority**: LOW
- **Impact**: Data corruption, entity loss
- **Likelihood**: Very low (typical use cases)

### F4. `routeTracer.js` — `annotatePath` uses `flatReqs.every` for static flag satisfaction check
- **Location**: `routeTracer.js`, `annotatePath` (~lines 177–184)
- **Why it is fragile**: The `satisfiesNext` check evaluates flag requirements by checking if `flagIdsSetSoFar.has(req.flag)`. This treats all flags_set entries along the path as `true` — but the actual condition system supports `flag = false` as a requirement. If a node requires a flag to be `false`, and a prior step sets it to `true`, `satisfiesNext` will incorrectly report `true` (because it checks `!flagIdsSetSoFar.has(req.flag)`, meaning a flag NOT set yet — but this doesn't account for the case where a flag starts `false` by default and the path doesn't touch it).
- **What specifically could break**: Route trace annotations could show misleading "satisfies" indicators for paths that actually fail at runtime.
- **Severity**: LOW (informational UI only, doesn't affect actual simulation)
- **Priority**: LOW
- **Impact**: Misleading UI, user confusion
- **Likelihood**: Low (edge case)

### F5. `graphLayout.js` — Edge ID format is tightly coupled to `useSimulator.js` taken-edge detection
- **Location**: `graphLayout.js` edge generation (~lines 142–196), `useSimulator.js` `takenEdgeIds` computation (~lines 221–261)
- **Why it is fragile**: The edge IDs are constructed as `${sourceId}-next-${routeIdPart}` for scenes and `${choiceId}-opt-${optIdPart}-${targetId}` for choices in `graphLayout.js`. The simulator's `takenEdgeIds` constructs them as `${sourceId}-next-${routeIdPart}` and `${choiceId}-opt-${optIdPart}`. These two formats **don't match** for choice edges — `graphLayout` appends `-${entry.target}` but `useSimulator` does not. This means taken-edge highlighting for choice edges may fail to highlight.
- **What specifically could break**: Choice option edges may never display the "taken" visual style during simulation.
- **Severity**: HIGH
- **Priority**: HIGH
- **Impact**: Core functionality, user experience
- **Likelihood**: Certain (currently broken)

### F6. `EditorContext.jsx` — Import/Export key name asymmetry (`path`/`paths`, `chapter`/`chapters`, `status`/`statusPoints`)
- **Location**: `App.jsx` `handleExport` (~lines 91–124), `handleImport` (~lines 126–211), `EditorContext.jsx` `loadData` (~lines 1104–1123)
- **Why it is fragile**: Export uses `path`, `chapter`, `status` as top-level keys, while internal state uses `paths`, `chapters`, `statusPoints`. The `loadData` function maps `paths: data.path`, `chapters: data.chapter`, `status: data.status`. A developer adding a new slice could easily miss this asymmetry and export with the wrong key name.
- **What specifically could break**: An import/export round-trip could silently drop data for a new entity type if the key mapping isn't correctly mirrored in both directions.
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Impact**: Data loss, import/export failures
- **Likelihood**: Medium (developer error)

### F7. `EditModal.jsx` — Escape key closes modal without checking for unsaved changes
- **Location**: `EditModal.jsx` (~lines 20–28)
- **Why it is fragile**: The `handleKeyDown` handler calls `onClose()` directly on Escape. The unsaved-changes guard (`isDirty` check + confirm dialog) lives inside each individual form component's `handleCancel`, not in the modal shell. Pressing Escape bypasses the form's cancel logic entirely.
- **What specifically could break**: Users lose unsaved form edits without warning when pressing Escape.
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Impact**: User data loss, frustration
- **Likelihood**: High (common user action)

### F8. `ConditionEditor.jsx` — Module-level mutable counter `conditionIdCounter`
- **Location**: `ConditionEditor.jsx`, line 7
- **Why it is fragile**: `let conditionIdCounter = 0` is a module-level mutable variable shared across all component instances. It resets to 0 on hot module reload (during development). If two ConditionEditor instances add conditions simultaneously, the counter increments correctly, but on page reload the counter resets, potentially producing IDs that collide with existing `_id` values in the persisted data.
- **What specifically could break**: Condition `_id` collisions after page reload, potentially causing React key conflicts (duplicate keys in lists) which produce rendering bugs.
- **Severity**: LOW (mitigated by the random suffix, but still a structural smell)
- **Priority**: LOW
- **Impact**: Rendering bugs, React warnings
- **Likelihood**: Low (development scenario)

### F9. `RouteViewer.jsx` — `computeLayoutWithPositions` is called inside `useMemo` but triggers position-persist side effects via `useEffect`
- **Location**: `RouteViewer.jsx` (~lines 80–115)
- **Why it is fragile**: The `baseLayout` useMemo computes layout and produces `positionUpdates`. A separate `useEffect` watches `baseLayout.positionUpdates` and calls `updateNodePosition` (which writes to EditorContext state). This state change triggers a re-render, which re-computes `baseLayout`, producing new `positionUpdates`. The `persistedPositionIds` ref-based dedup prevents an infinite loop — but if anything clears that ref at the wrong time (e.g., `handleResetLayout` clears it), there's a narrow window for a render storm.
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Impact**: Performance, potential infinite loops
- **Likelihood**: Low (edge case)

## Load-Bearing Code

### L1. `migrateOptionNext`, `migrateSceneFields`, `migrateFlagFields`, `migrateChoiceRequires`, `migrateSceneRequires`, `migrateEndingRequires`
- **Location**: `EditorContext.jsx` (~lines 25–168)
- **What it actually does**: These functions silently upgrade legacy data formats on every hydration and import. They convert flat arrays to group structures, add missing fields, and normalize null/undefined values to proper defaults. Without them, any data saved before the condition-group refactor would crash the entire application on load.
- **What breaks if removed or simplified**: Every component that reads `requires` expects `{ operator, conditions }` — raw arrays or nulls would throw at render time. Missing `flags_set`, `status_set`, `type`, `path`, `chapter` fields on scenes/flags would cause undefined property errors throughout the form components.
- **Priority**: CRITICAL
- **Impact**: Application startup, data compatibility
- **Likelihood**: Certain (legacy data exists)

### L2. `sanitizeCollection` applied during `loadData`
- **Location**: `EditorContext.jsx`, `loadData` (~lines 1104–1123), `sanitizeCollection` (~lines 171–182)
- **What it actually does**: Forces all entity names through `sanitizeName` (lowercase, underscores, strip special chars) on every import. This is the only place where imported data is normalized — without it, entity names from external sources could contain spaces, uppercase, or special characters that break ID-based lookups elsewhere.
- **What breaks if removed**: Imported flag/path/chapter names could contain characters that don't match what the UI forms produce, causing lookup failures when cross-referencing entities.
- **Priority**: HIGH
- **Impact**: Data integrity, cross-references
- **Likelihood**: Medium (import usage)

### L3. `isInitialMount` ref guard in the auto-save `useEffect`
- **Location**: `EditorContext.jsx` (~lines 256–269)
- **What it actually does**: Prevents a redundant write-back to IndexedDB immediately after hydration. On mount, the hydration `useEffect` sets state, which triggers the save `useEffect`. Without `isInitialMount`, the app would immediately overwrite the database with potentially partial state (if hydration set some fields but not others within a single tick).
- **What breaks if removed**: A race condition where partial state overwrites fully hydrated state in IndexedDB. On next page load, the user sees missing data.
- **Priority**: HIGH
- **Impact**: Data loss, user experience
- **Likelihood**: Low (current implementation)

### L4. `persistedPositionIds` ref in `RouteViewer.jsx`
- **Location**: `RouteViewer.jsx` (~lines 104–115)
- **What it actually does**: Prevents infinite re-render loops. When `computeLayoutWithPositions` assigns positions to unpositioned nodes, those positions are persisted back to EditorContext via `updateNodePosition`. This state change triggers a re-render, recomputing the layout. Without the dedup set, each render would try to persist the same positions again, causing another state change and re-render.
- **What breaks if removed**: Infinite render loop, browser tab freezes.
- **Priority**: CRITICAL
- **Impact**: Application stability, performance
- **Likelihood**: Certain (current implementation)

### L5. `spawnOffsetRef` and `SPAWN_OFFSET` in `EditorContext.jsx`
- **Location**: `EditorContext.jsx` (~lines 242–243, used in `addScene`, `addChoice`, `addEnding`)
- **What it actually does**: Offsets the spawn position of consecutively created nodes by 24px each, cycling every 5 nodes. Without this, all new nodes created at the viewport center would stack at exactly the same position, appearing as a single node.
- **What breaks if removed**: All new nodes pile up at the exact same coordinates, requiring the user to manually drag each one apart.
- **Priority**: MEDIUM
- **Impact**: User experience, usability
- **Likelihood**: Low (current implementation)

### L6. `replaceIdReferences` deep recursive traversal
- **Location**: `EditorContext.jsx` (~lines 457–476)
- **What it actually does**: When reordering entities (flags, scenes, choices, etc.), this function recursively walks the entire data tree to replace old IDs with new IDs in every nested `flag`, `status`, `target`, `flags_set`, and `status_set` field. It's the only thing preventing reorder operations from leaving dangling references everywhere.
- **What breaks if removed**: After reordering, all cross-references break — conditions reference deleted IDs, `next` targets point to non-existent nodes, `flags_set` contains unknown flag IDs.
- **Priority**: CRITICAL
- **Impact**: Data integrity, cross-references
- **Likelihood**: Low (current implementation)

## Implicit Contracts

### C1. Entity IDs follow strict prefix conventions
- **The assumption**: Scene IDs start with `S`, Choice IDs with `CH`, Flag IDs with `F`, Status Point IDs with `SP`, Path IDs with `P`, Chapter IDs with `C`, Quest IDs with `Q`, Ending IDs with `E`, followed by zero-padded 3-digit numbers (e.g., `S001`, `CH003`).
- **Where it is made**: `generateId` in `EditorContext.jsx` (line 12–20), reorder functions (lines 479–615).
- **Where it is relied upon**: `useSimulator.js` determines node type by checking `scenes[id]` / `choices[id]` / `endings[id]` (not by parsing the prefix). `graphLayout.js` does not parse prefixes. The `dependencyGraph.js` `setBy` array uses `choiceId` as a key name even for scene setters (line 138), relying on the fact that the property name is just a label, not actually validated as a choice.
- **What breaks if violated**: `generateId` would produce colliding IDs if two entity types share a prefix. Import of data with non-standard IDs works because lookups are by map key, not prefix — but `reorder` functions would produce garbled new IDs.
- **Priority**: HIGH
- **Impact**: ID collisions, data corruption
- **Likelihood**: Low (current conventions)

### C2. `opt.next` is always an array of `{ requires, target }` objects (post-migration)
- **The assumption**: After `migrateOptionNext` runs, every `opt.next` field in choices is either `[]` or an array of `{ requires: { operator, conditions }, target: string }` objects.
- **Where it is made**: `migrateOptionNext` in `EditorContext.jsx` (lines 25–50).
- **Where it is relied upon**: Virtually everywhere — `graphLayout.js` (line 96–100), `useSimulator.js` (lines 140–144), `dependencyGraph.js` (lines 96–100), `routeTracer.js` (line 200–204), `RouteViewer.jsx` `handleConnect`, every modal form.
- **What breaks if violated**: Any code path that receives a string or null for `opt.next` would crash with "`.find` is not a function" or similar errors. The migration only runs on hydration and import — if code writes a string directly to `opt.next` at runtime (bypassing migrations), it would corrupt the data model silently until the next page load.
- **Priority**: CRITICAL
- **Impact**: Application crashes, data corruption
- **Likelihood**: Low (current migration)

### C3. `requires` is always a condition group `{ operator, conditions }` (post-migration)
- **The assumption**: Every `requires` field on scenes, choices, choice options, next entries, variants, and endings is a properly structured condition group.
- **Where it is made**: `migrateRequires`, `migrateChoiceRequires`, `migrateSceneRequires`, `migrateEndingRequires` in `EditorContext.jsx`.
- **Where it is relied upon**: `conditionUtils.js` `normalizeRequires`, `evaluateGroup`, `flattenConditions`; `ConditionEditor.jsx`; every form that renders conditions.
- **What breaks if violated**: `normalizeRequires` has fallback handling for arrays and nulls, so the utility layer is somewhat resilient. But `GroupEditor` in `ConditionEditor.jsx` directly accesses `group.conditions` — if `requires` were a bare array, the component would crash.
- **Priority**: HIGH
- **Impact**: Application crashes, form errors
- **Likelihood**: Low (current migration)

### C4. The auto-save debounce timer is 500ms — all state setters are assumed to batch within this window
- **The assumption**: All state changes from a single user action (e.g., reordering, which calls multiple setters like `setFlags`, `setChoices`, `setScenes`, `setEndings`, `setEntryNode`) complete within 500ms so that only one save occurs.
- **Where it is made**: `EditorContext.jsx` auto-save `useEffect` (line 263).
- **Where it is relied upon**: Every CRUD operation in the context assumes a single debounced save captures the complete state.
- **What breaks if violated**: A partial state could be saved to IndexedDB — e.g., flags are renumbered but choices still reference old flag IDs. On reload, the app loads an inconsistent state.
- **Priority**: HIGH
- **Impact**: Data corruption, inconsistent state
- **Likelihood**: Low (React 19 batching)

### C5. `_position` is a private field excluded from export
- **The assumption**: Fields prefixed with `_` (like `_position`, `_id`) are internal metadata not meant for the exported JSON schema.
- **Where it is made**: Implicitly — `handleExport` in `App.jsx` exports the raw collections which include `_position` and `_id` fields.
- **Where it is relied upon**: `graphLayout.js` reads `_position` from entities. `resetAllPositions` destructures it out.
- **What breaks if violated**: Actually, `_position` IS currently exported and imported. This is not necessarily a bug, but it means the export format includes implementation details. If a consuming system doesn't understand `_position`, it's noise. If it does, it preserves layout — but this was never explicitly designed.
- **Priority**: LOW
- **Impact**: Export format, data compatibility
- **Likelihood**: Low (current implementation)

### C6. `entryNode` can only be a Scene or Choice ID, never an Ending
- **The assumption**: The entry point dropdown in `NavBar.jsx` only offers scenes and choices as options (line 214–217 of `App.jsx`).
- **Where it is relied upon**: `useSimulator.js` determines the type of the entry node by checking `scenes[nodeId]` first, then `choices[nodeId]`, then `endings[nodeId]`. If an ending were set as the entry node, simulation would start on a terminal node and immediately hit a dead end — not a crash, but functionally broken.
- **What breaks if violated**: Simulation starts on an ending node, which has no `next` or `options`, so every "continue" action would `alert('End of the line')`.
- **Priority**: MEDIUM
- **Impact**: User experience, simulation functionality
- **Likelihood**: Low (UI constraints)

### C7. `dependencyGraph.js` uses `choiceId` as the property name for scene flag setters
- **The assumption**: The `setBy` array entries in the flag graph use `{ choiceId, optionIndex }` even when the setter is a scene (line 138). `optionIndex` is `undefined` for scenes.
- **Where it is made**: `dependencyGraph.js` lines 135–140.
- **Where it is relied upon**: `reachabilityAnalyzer.js` reads `data.setBy` to build `choiceFlagSets` (lines 49–57), keying by `setter.choiceId`. This means scene-set flags are included in the `choiceFlagSets` map, keyed by the scene ID.
- **What breaks if violated**: The naming is misleading but functionally correct. However, the `areMutuallyExclusive` check (lines 62–71) compares `settersA[0].choiceId !== settersB[0].choiceId` — this would incorrectly flag two scene-set flags as non-exclusive even if they're set by the same scene, but that scenario is harmless since scenes always set all their flags.
- **Priority**: LOW
- **Impact**: Misleading naming, minor logic issues
- **Likelihood**: Low (current implementation)

## Data Integrity Risks

### D1. No validation of `target` values in `next` arrays
- **Location**: `SceneModalForm.jsx`, `ChoiceModalForm.jsx`, `RouteViewer.jsx` `handleConnect`
- **What data could become inconsistent**: A `next` entry's `target` can reference any string — including IDs that don't exist in `scenes`, `choices`, or `endings`. The delete guards check for incoming references before allowing deletion, but there's no validation that a target ID is valid when it's SET.
- **Under what condition**: User types or pastes a non-existent ID into the target dropdown, or an entity is deleted from a different tab/import while the form is open.
- **Priority**: MEDIUM
- **Impact**: Data integrity, runtime errors
- **Likelihood**: Medium (user input)

### D2. ✅ RESOLVED - `handleEdgesDelete` in `RouteViewer.jsx` sets `next: null` for choice options
- **Location**: `RouteViewer.jsx` line 405
- **What data could become inconsistent**: When deleting an edge from the canvas, the code sets `next: null` on the choice option. But the rest of the codebase expects `next` to be an array (post-migration). This `null` won't be migrated until the next hydration cycle (page reload or import), so during the current session, any code that does `Array.isArray(opt.next)` will get `false` and fall through to legacy string handling.
- **Under what condition**: User deletes a choice edge on the canvas, then immediately interacts with that choice in the simulator or opens it in a form.
- **Priority**: HIGH
- **Impact**: Data corruption, runtime errors
- **Likelihood**: High (common user action)

### D3. Auto-save can persist partially-updated state during reorder operations
- **Location**: `EditorContext.jsx` reorder functions (lines 479–615) and auto-save effect (lines 257–269)
- **What data could become inconsistent**: Reorder operations call multiple state setters sequentially (e.g., `setFlags(newFlags)`, then `setChoices(prev => applyMap(prev))`, then `setScenes(prev => applyMap(prev))`). If the 500ms debounce fires between any two of these calls, the saved state has renumbered entities but stale cross-references.
- **Under what condition**: Unlikely under React 19's automatic batching within event handlers, but possible if a reorder triggers from an async context or if the debounce timer from a previous edit fires during the reorder window.
- **Priority**: MEDIUM
- **Impact**: Data corruption, inconsistent state
- **Likelihood**: Low (current React behavior)

### D4. Import does not validate structural integrity of nested data
- **Location**: `App.jsx` `handleImport` (lines 126–211)
- **What data could become inconsistent**: The import validation only checks that top-level slice values are objects and that each entry has an `id` field. It does not validate:
  - That `next` targets reference valid entity IDs
  - That `flags_set` entries reference valid flag IDs
  - That `status_set.status` references valid status point IDs
  - That `requires` conditions reference valid flag/status IDs
  - That `path` and `chapter` references are valid
- **Under what condition**: User imports a file where entities reference IDs that don't exist in the imported data (e.g., a partial export, or manually edited JSON).
- **Priority**: MEDIUM
- **Impact**: Data integrity, runtime errors
- **Likelihood**: Medium (import usage)

### D5. `clearData` deletes IndexedDB but page state persists until reload
- **Location**: `EditorContext.jsx` `clearData` (lines 1125–1139)
- **What data could become inconsistent**: `clearData` sets all state to empty objects AND calls `localforage.removeItem`. But the auto-save `useEffect` will immediately re-trigger (because all dependencies changed) and save `{}` to IndexedDB — which is correct. The risk is if the `removeItem` call and the subsequent `setItem` call from the auto-save race each other.
- **Under what condition**: On very slow IndexedDB implementations, the `setItem` from auto-save could execute before `removeItem` completes, meaning the "cleared" state gets saved and then immediately deleted, leaving the user with no persisted empty state. On next load, the old data reappears.
- **Priority**: LOW
- **Impact**: Data loss, user confusion
- **Likelihood**: Very low (slow IndexedDB)

### D6. Silent error swallowing on IndexedDB operations
- **Location**: `EditorContext.jsx` lines 227 (`.catch(() => {})`), 266 (`.catch(() => {})`), 1137 (`.catch(() => {})`)
- **What data could become inconsistent**: If IndexedDB fails (quota exceeded, database locked, browser private mode), the user continues editing with no indication that their work isn't being saved. They could lose hours of work on page reload.
- **Under what condition**: Browser runs out of IndexedDB quota, user is in private/incognito mode (where some browsers limit or disable IndexedDB), or the database gets corrupted.
- **Priority**: MEDIUM
- **Impact**: Data loss, user trust
- **Likelihood**: Medium (private browsing usage)

## Unknown Unknowns

### U1. `@dnd-kit` usage in `LeftSidebar.jsx`
- **The area**: The drag-and-drop reorder system using `@dnd-kit/core` and `@dnd-kit/sortable`.
- **What specifically is unclear**: The dependency is imported and used, but `@dnd-kit` is NOT listed in `package.json` as shown in the inventory. It may be a transitive dependency, or the inventory may be incomplete. If it's not a declared dependency, it could break on a clean install.
- **What information would resolve the uncertainty**: Checking `package.json` for `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` as explicit dependencies.
- **Priority**: LOW
- **Impact**: Build failures, missing functionality
- **Likelihood**: Low (dependency management)

### U2. `DynamicTracker.jsx` — full behavior when simulation is running
- **The area**: `DynamicTracker.jsx` (304 lines) renders when `sim.isRunning` is true, replacing the entire left sidebar content.
- **What specifically is unclear**: I have not fully read this file. Its interaction with the sidebar's entity editing state, the backtrack system, and the route trace highlighting is not clear. If it accesses the same EditorContext actions as the sidebar, there could be state conflicts.
- **What information would resolve the uncertainty**: Reading `DynamicTracker.jsx` fully to understand its state management and side effects.
- **Priority**: MEDIUM
- **Impact**: State conflicts, unexpected behavior
- **Likelihood**: Low (current implementation)

### U3. `Simulator.jsx` — standalone mode vs. integrated mode
- **The area**: `Simulator.jsx` (544 lines) exists in `src/components/simulator/` and is imported by `LeftSidebar.jsx`, but the reconstruction report notes it's used within the left sidebar.
- **What specifically is unclear**: I have not read `Simulator.jsx`. There appear to be two simulation UIs — `Simulator.jsx` and `SimulatorPanel.jsx` (in `routeviewer/`). How they share state via `useSimulator`, and whether one supersedes the other, is unclear.
- **What information would resolve the uncertainty**: Reading both `Simulator.jsx` and `SimulatorPanel.jsx` to confirm they don't conflict.
- **Priority**: MEDIUM
- **Impact**: State conflicts, unexpected behavior
- **Likelihood**: Low (current implementation)

### U4. `SearchableDropdown.jsx` — 405 lines for a dropdown component
- **The area**: `src/components/shared/SearchableDropdown.jsx`
- **What specifically is unclear**: A 405-line dropdown component is unusually large. It's used in every form and the `ConditionEditor`. Without reading it, I cannot assess whether it manages internal state that could conflict with the form draft state, or whether it handles edge cases (empty lists, very long lists, rapid typing) correctly.
- **What information would resolve the uncertainty**: Reading the component to assess its state management and edge-case handling.
- **Priority**: LOW
- **Impact**: Performance, edge case failures
- **Likelihood**: Low (current implementation)

## Data Loss Scenarios

### Scenario 1: Private Browsing Mode
- **Description**: User works in private browsing mode where IndexedDB is disabled or limited
- **Impact**: All work lost on page reload
- **Likelihood**: Medium (private browsing usage)
- **Mitigation**: Add warning banner when IndexedDB fails

### Scenario 2: Quota Exceeded
- **Description**: Browser runs out of IndexedDB quota
- **Impact**: Auto-save fails silently, work lost on reload
- **Likelihood**: Low (typical usage)
- **Mitigation**: Add quota monitoring and user warnings

### Scenario 3: Import Corruption
- **Description**: User imports file with invalid references
- **Impact**: Runtime errors, broken narrative
- **Likelihood**: Medium (import usage)
- **Mitigation**: Add import validation and error handling

### Scenario 4: Edge Deletion Corruption
- **Description**: User deletes choice edge, causing `next: null` corruption
- **Impact**: Runtime errors, broken narrative
- **Likelihood**: High (common user action)
- **Mitigation**: Fix edge deletion to use `next: []`

### Scenario 5: Reorder Race Condition
- **Description**: Auto-save fires during reorder operation
- **Impact**: Inconsistent state, broken references
- **Likelihood**: Low (current React behavior)
- **Mitigation**: Ensure atomic reorder operations

## Recommendations

### Immediate Actions (This Week)
1. Fix choice edge ID mismatch in `graphLayout.js` or `useSimulator.js`
2. Fix edge deletion to use `next: []` instead of `next: null`
3. Add IndexedDB error handling with user warnings

### Short-term Actions (This Month)
1. Add import validation for cross-references
2. Add target ID validation in forms
3. Add data loss warnings for private browsing

### Long-term Actions (Next Quarter)
1. Refactor ID generation to be more robust
2. Add comprehensive data integrity checks
3. Implement backup/restore functionality

## Risk Matrix

| Risk | Priority | Impact | Likelihood | Mitigation Status |
|------|----------|--------|------------|-------------------|
| Choice edge ID mismatch | HIGH | HIGH | Certain | Not started |
| Edge deletion corruption | HIGH | HIGH | High | ✅ RESOLVED |
| Silent IndexedDB errors | MEDIUM | MEDIUM | Medium | Not started |
| Import validation | MEDIUM | MEDIUM | Medium | Not started |
| Reorder race condition | MEDIUM | MEDIUM | Low | Not started |
| ID generation collisions | LOW | LOW | Very low | Not started |
| Private browsing data loss | MEDIUM | MEDIUM | Medium | Not started |
| Fragility F1-F9 | MEDIUM | MEDIUM | Low | Not started |