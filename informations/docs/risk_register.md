# Branching Routes — Risk Register

---

| # | Risk | Likelihood | Impact | Mitigation Strategy | Status |
|---|---|---|---|---|---|
| RISK-01 | Real-Time Simulation Causes React Flow Re-Render Storms | Medium | High | See details below | OPEN |
| RISK-02 | Flag Name Collisions Break Condition Evaluation | High | High | See details below | OPEN |
| RISK-03 | File System Access API Browser Compatibility Breaks Save/Open | High | Medium | See details below | RESOLVED |
| RISK-04 | Graph Becomes Visually Unreadable at Medium Scale | Medium | Medium | See details below | OPEN |
| RISK-05 | Simulation "Live Checker" UX is Ambiguous Without a Clear Mode Indicator | Medium | Medium | See details below | OPEN |
| RISK-06 | Simulation state CSS overrides conflict with new accent borders | Medium | Medium | See details below | MITIGATED |
| RISK-07 | Option count indicator in ChoiceNode requires store access | Medium | Low | See details below | MITIGATED |
| RISK-08 | Badge styling overlaps with existing `story-node__badge` | High | Low | See details below | MITIGATED |
| RISK-09 | `choice-node` and `ending-node` classes already exist | Medium | Low | See details below | MITIGATED |
| RISK-10 | EndingNode accent color visually clashes with active state | High | Low | See details below | ACKNOWLEDGED |
| RISK-PCE-01 | Orphaned Node References After Path/Chapter Deletion | High | Medium | Cascading nullification in `deletePath`/`deleteChapter` | RESOLVED |
| RISK-PCE-02 | Schema Version Guard Breaks Legacy Imports | High | High | v3→v4 migration in `fileSystem.js` | RESOLVED |
| RISK-PCE-03 | `loadGraph`/`newGraph` Omit New Collections | High | High | Both functions initialise `path`/`chapter` | RESOLVED |
| RISK-PCE-04 | NodeInspector Dropdown Re-Render Storms | Medium | Medium | Targeted Zustand selectors | RESOLVED |
| RISK-PCE-05 | Empty Path/Chapter Names | Medium | Low | Store validation + UI guard | RESOLVED |
| RISK-VNO-01 | Referential integrity gap in deleteFlag/deleteStatus | High | High | Extended scans in deleteFlag/deleteStatus | RESOLVED |
| RISK-VNO-02 | ChoiceNode crash on legacy nodes without data.options | High | High | Default to `[]` with `?? []` guard | RESOLVED |
| RISK-VNO-03 | React Flow handle ID collision breaks connect events | Low | High | `opt-` prefix for all option IDs | RESOLVED |
| RISK-VNO-04 | deleteOption leaves dangling optionId on edges | Medium | Medium | deleteOption cascades edge removal | RESOLVED |
| RISK-VNO-05 | ChoiceNode re-render storms from data.options | Medium | Medium | Options read from React Flow `data` prop | RESOLVED |
| RISK-VNO-06 | Zustand selector returns new array literal causing infinite re-render | Medium | High | Return `undefined` from selector; default outside hook (AR-14) | RESOLVED |
| RISK-CM-01 | `computeReachable` filter applied unconditionally breaks non-choice paths | Medium | High | Gate filter on choice-node identity check | RESOLVED |
| RISK-CM-02 | Legacy null-`optionId` edges on choice nodes silently break campaign | Medium | High | Passive reachability warnings surface the issue at authoring time | RESOLVED |
| RISK-CM-03 | Sandbox overrides leak into `narrativeStore` (AR-08) | Medium | High | `applySandboxOverride` writes only to `simulationStore.currentFlagValues` | RESOLVED |
| RISK-CM-04 | New `simulationStore` selectors return `[]`/`{}` triggering AR-14 loop | Medium | High | All selectors return primitives or existing references; AR-14 verified | RESOLVED |
| RISK-CM-05 | `.simulation-mode` → `.campaign-mode` CSS class swap breaks authoring controls | Low | Medium | Search-and-replace verified by grep; no `.simulation-mode` remains | RESOLVED |
| RISK-IDB-01 | Migration chain port introduces silent regression on legacy files | Medium | High | Test suite against v1 fixture before and after port | RESOLVED |
| RISK-IDB-02 | Auto-save subscription fires too frequently and causes write storms | Medium | High | Debounced subscribe at 1000ms in `main.jsx` | RESOLVED |
| RISK-IDB-03 | Boot restore bypasses or duplicates teardown side effects | Medium | High | `exitCampaign()` called explicitly after `loadGraph()` on boot | RESOLVED |
| RISK-IDB-04 | `handleNew` auto-save race condition restores deleted graph | Medium | Medium | `clearIndexedDB()` awaited before `newGraph()` in `TopBar.jsx` | RESOLVED |
| RISK-IDB-05 | Schema version emitter and import version guard diverge after Phase 2 | Low | High | No schema bump; accepted versions list and emitter remain `4` | RESOLVED |
| RISK-CSH-01 | Campaign auto-save write storm on every `advance()` | Medium | High | Debounced `campaignStore` subscriber at 1000ms in `main.jsx` | RESOLVED |
| RISK-CSH-02 | Dangling flag/status IDs in campaign snapshots | Medium | High | `enterCampaign` filters snapshot IDs against current `narrativeStore` on hydration | RESOLVED |
| RISK-CSH-03 | `handleNew` leaves orphaned campaign data in IndexedDB | Medium | High | `handleNew` calls `clearCampaignsIndexedDB()` before `clearIndexedDB()` | RESOLVED |
| RISK-CSH-04 | `exitCampaign()` circular import with `campaignStore` | Medium | High | `simulationStore` uses direct import of `useCampaignStore`; `campaignStore` does not import `simulationStore` | RESOLVED |
| RISK-CSH-05 | Campaign boot restore auto-resumes an active campaign | Medium | Medium | `loadCampaignsFromIndexedDB` always calls `setActiveCampaign(null)` after restore | RESOLVED |
| RISK-CSH-06 | `SandboxPanel` scope creep beyond original protection boundary | Low | Low | Campaign Save controls added additively; no existing functionality altered | ACKNOWLEDGED |
| RISK-CMK-01 | Keyboard shortcut fires inside input fields | High | Medium | Input-field guard in `useKeyboardShortcuts.js:11-18` | RESOLVED |
| RISK-CMK-02 | Context menu conflicts with React Flow pane event handling | Medium | Medium | `event.preventDefault()` as first line in all three context menu handlers | RESOLVED |
| RISK-CMK-03 | `selectedNodeId` vs `selectedNodeIds` consumer mismatch breaks NodeInspector | Medium | High | `selectedNodeId` preserved; `setSelectedNodeIds` called only from `onSelectionChange`, never `onNodeClick` | RESOLVED |
| RISK-CMK-04 | Context menu stays open after canvas scroll or node drag | Low | Low | `onPaneClick`, `onNodeDragStart`, `onMoveStart` all call `closeContextMenu` | RESOLVED |
| RISK-CMK-05 | Context menu renders off-screen near viewport edges | Medium | Low | Viewport-flip logic in `ContextMenu.jsx:15-26` | RESOLVED |
| RISK-CMK-06 | ESC key double-handling between GraphCanvas inline handler and new hook | Medium | Medium | Inline ESC handler removed from GraphCanvas; hook is sole ESC handler | RESOLVED |
| RISK-CMK-07 | CreationBar / shortcut node creation positions at canvas origin | Medium | Low | `canvas-add-node` event; GraphCanvas calls `addNode(screenToFlowPosition(viewportCenter), type)` | RESOLVED |
| RISK-CMK-08 | ESC inside NameModal simultaneously clears canvas selection | High | Medium | `NameModal.jsx:61` calls `event.stopPropagation()` before close | RESOLVED |
| RISK-CMK-09 | NameModal opens during campaign mode | Low | Medium | Triple-layer guard: hook bails, CreationBar disabled, GraphCanvas listener independently guards | MITIGATED |
| RISK-CMK-10 | `addNode` signature change is silent for existing callers | Low | Low | See details below | OPEN |
| RISK-CMK-11 | Scope expansion across 7 additional files bypasses per-phase file map | Low | Low | See details below | OPEN |
| RISK-CMK-12 | `onSelectionChange` fires synchronously inside React Flow render | Low | Medium | See details below | OPEN |
| RISK-CP-01 | Cluster overlay coordinate space mismatch (flow vs screen coords) | High | High | `ClusterOverlay` inside `ReactFlowProvider` applying `useViewport()` CSS transform | RESOLVED |
| RISK-CP-02 | AR-14 Toast infinite re-render loop | Medium | High | `toasts` initialised as `[]`; `addToast` called only from event handlers or stable effects | RESOLVED |
| RISK-CP-03 | ESC double-handling in CommandPalette | High | Medium | Palette attaches own `keydown` listener on `window`, calls `stopPropagation()` before close | RESOLVED |
| RISK-CP-04 | `Ctrl+K` blocked when palette input is focused | High | Medium | `Ctrl+K` check inserted before input-field guard in `useKeyboardShortcuts.js` | RESOLVED |
| RISK-CP-05 | Cluster bounding box re-computation per viewport frame | Medium | Medium | Bounding boxes computed in `GraphCanvasInner` via `useMemo`; passed as props; `ClusterOverlay` applies only CSS transform per pan frame | RESOLVED |
| RISK-CPT-01 | Whole-store destructure in CommandPalette causes unnecessary re-renders | Low | Low | See details below | OPEN |
| RISK-CPT-02 | Stale `isOpen` closure in palette-toggle effect | Low | Low | See details below | OPEN |

---

## RISK-01 — Real-Time Simulation Causes React Flow Re-Render Storms

**Description:** The "live checker" simulation needs to update node/edge highlight state on every user action (advance to next node). If `simulationStore` changes cause all nodes and edges to re-render simultaneously on each update, the canvas will lag noticeably at even modest graph sizes (50+ nodes).

**What could go wrong:** Designer advances the simulation; the entire canvas freezes or flickers. At 200+ nodes it becomes unusable.

**Likelihood:** Medium — React Flow manages its own internal rendering, but custom nodes with store subscriptions can trigger cascading renders.

**Impact:** High — A laggy simulation defeats the core value proposition of real-time path highlighting.

**Mitigation Strategy:** `StoryNode` and `ConditionalEdge` must use `React.memo` and derive only their own highlight state from `simulationStore` using a targeted selector (e.g., `useSimulationStore(s => s.visitedNodeIds.includes(id))`), not the entire store object. This ensures only the nodes whose status actually changed re-render.

**Early detection:** During Phase 5 (simulation), manually advance through a 30-node graph. Open Chrome DevTools → Performance tab. If a single "advance" action triggers >100 component re-renders or takes >32ms per frame, this risk has materialised.

---

## RISK-02 — Flag Name Collisions Break Condition Evaluation

**Description:** The condition evaluator looks up flags by `flagId` (UUID). However, if the designer renames a flag or deletes a flag that is referenced in an edge condition or node side-effect, those references become orphaned and the evaluator will silently return the wrong result or crash.

**What could go wrong:** Designer deletes `HasKey` flag. Edges that depended on `HasKey` now reference a non-existent ID. The simulation evaluates those edges as always-false or throws an uncaught exception.

**Likelihood:** High — Flag deletion is a natural editing action; it's almost certain designers will do this.

**Impact:** High — Silent evaluation errors produce incorrect simulation behaviour with no visible cause.

**Mitigation Strategy:** Before deleting a flag, `graphStore` must scan all `edges[].condition.clauses` and `nodes[].sideEffects` for references to that `flagId`. If references exist, display a blocking confirmation dialog listing the affected edges/nodes. The deletion must not proceed silently.

**Early detection:** In Phase 4 (condition editing), attempt to delete a flag that is currently referenced by an edge condition. If no warning is shown and the deletion succeeds, this risk has materialised.

---

## RISK-03 — File System Access API Browser Compatibility Breaks Save/Open

**Description:** The File System Access API (`showSaveFilePicker`, `showOpenFilePicker`) is not available in Firefox or Safari as of mid-2025. The scope document assumes designers run the app in their browser of choice.

**What could go wrong:** A designer using Firefox cannot save or open any files. Clicking "Save" does nothing or throws an uncaught error.

**Likelihood:** High — Firefox and Safari together represent a significant share of developer browser usage.

**Impact:** Medium — The app is still fully functional for editing; only persistence is blocked, and Chromium browsers work fine.

**Mitigation Strategy:** `fileSystem.js` must check for API support (`typeof window.showSaveFilePicker === 'function'`) and fall back to a `<a download>` programmatic download + `<input type="file">` upload approach. The fallback must be implemented in Phase 2, not deferred, since every subsequent phase depends on file I/O.

**Early detection:** During Phase 2 (file system utilities), open the app in Firefox. Click Save. If the browser throws `TypeError: window.showSaveFilePicker is not a function`, this risk has materialised.

**Status:** RESOLVED — IndexedDB auto-save (`fileSystem.js` `saveToIndexedDB`, L23–36; `main.jsx` `initPersistence`, L9–23) now provides universal automatic persistence on all browsers including Firefox and Safari. The `<a download>` / `<input type="file">` fallback paths are retained for the explicit Export/Import actions (audit pass 1, §2, items 5–6). Work is now safe on all browsers even without interacting with file dialogs.

---

## RISK-04 — Graph Becomes Visually Unreadable at Medium Scale

**Description:** The scope accepts the "visual spaghetti" risk from the brainstorm and defers route-tracing features, but even a 20-node graph with multiple crossing edges and long condition labels can become difficult to read without some form of layout assistance.

**What could go wrong:** During acceptance testing, the designer builds a 20-node graph and finds it impossible to follow which path leads where. The tool feels worse than pen-and-paper.

**Likelihood:** Medium — Inevitable for complex narratives; partially addressable with layout tools.

**Impact:** Medium — Doesn't break functionality, but severely degrades usability.

**Mitigation Strategy:** Phase 3 must implement React Flow's built-in `Background` grid and ensure edges use the `smoothstep` or `bezier` edge type (not straight lines) by default. A Dagre-based auto-layout action ("Tidy Layout" button) should be included in Phase 5 as a first-class feature, not a nice-to-have, since it is the minimum defence against spaghetti at scale.

**Early detection:** During Phase 5, manually build a 15-node graph with at least 3 flag conditions. If edges visually overlap and there is no way to untangle them, the risk has materialised.

---

## RISK-05 — Simulation "Live Checker" UX is Ambiguous Without a Clear Mode Indicator

**Description:** The scope defines a "live checker" mode where the designer interacts with the graph directly to advance the simulation. If there is no obvious visual difference between "editing mode" and "simulation mode", the designer will accidentally add/delete nodes while simulating, or not understand why node-drag suddenly doesn't work.

**What could go wrong:** Designer clicks a node expecting to move it, but instead "advances" the simulation to that node. They are confused about what the tool is doing.

**Likelihood:** Medium — Mode-based UIs are a well-known source of confusion; first-time users are especially vulnerable.

**Impact:** Medium — Doesn't cause data loss but creates a frustrating and confusing experience.

**Mitigation Strategy:** During Phase 5, `GraphCanvas` must visually shift modes when `simulationStore.isRunning === true`: apply a global CSS class (`.simulation-mode`) to the canvas root that dims the toolbar, changes the cursor to `pointer` on reachable nodes, disables all node/edge drag interactions, and shows a persistent banner reading "Simulation Active — click a highlighted node to advance."

**Early detection:** During Phase 5 usability check: start the simulation, then attempt to drag a node. If drag works during simulation, the mode separation is not enforced. If drag is inexplicably blocked with no explanation, the UX is still broken.

---

## RISK-06 — Simulation state CSS overrides conflict with new accent borders

**Description:** The simulation state classes override `border-color`. If type accent styling uses `border-color` with higher or equal specificity, simulation states could be lost.

**Mitigation Strategy:** Simulation classes use `!important` and are placed at the bottom of the CSS file.

**Status:** MITIGATED — Audit BD-6 confirms simulation overrides appear after type rules with `!important` in `global.css` L256–270.

---

## RISK-07 — Option count indicator in ChoiceNode requires store access

**Description:** Displaying outgoing edge count on ChoiceNode requires filtering `narrativeStore` edges, causing possible render cycles.

**Mitigation Strategy:** Use a targeted, memoized `useNarrativeStore` selector inside `ChoiceNode`.

**Status:** MITIGATED — Audit BD-2 confirms `ChoiceNode.jsx` L16 derives its specific outgoing edge count cleanly.

---

## RISK-08 — Badge styling overlaps with existing `story-node__badge`

**Description:** Adding a new type badge might conflict with the existing side-effect badge if class names bleed.

**Mitigation Strategy:** Use distinct class names (`.story-node__type-label` vs `.story-node__meta-badge`) and encapsulated styles.

**Status:** MITIGATED — Audit DoD-5 confirms distinct CSS blocks were implemented in `global.css`.

---

## RISK-09 — `choice-node` and `ending-node` classes already exist

**Description:** Suffix classes already exist in `global.css` leading to possible rule collisions when expanding their definitions.

**Mitigation Strategy:** Treat blocks as purely additive during the iteration without overwriting unrelated layout structures.

**Status:** MITIGATED — Style updates applied safely.

---

## RISK-10 — EndingNode accent color visually clashes with simulation `--color-active`

**Description:** `--color-node-ending` (orange) and `--color-active` (orange) are too similar, meaning an active EndingNode border won't clearly show an active state change.

**Mitigation Strategy:** Acknowledged as acceptable design overlap for now; no code mitigation was planned.

**Status:** ACKNOWLEDGED — Audit Preservation AR-2 confirms this visual impact was contained and accepted.

---

## RISK-PCE-01 — Orphaned Node References After Path/Chapter Deletion

**Description:** When a designer deletes a path or chapter, any node whose `data.pathId` or `data.chapterId` matches the deleted ID becomes invalid unless the cascade sweep nullifies those references.

**Likelihood:** High

**Impact:** Medium

**Mitigation Strategy:** `deletePath` and `deleteChapter` perform a full sweep of `common`, `choice`, and `ending` within the same `set()` call, nullifying matching references before removing the entity.

**Status:** RESOLVED — `narrativeStore.js` L305–329 (path) and L351–375 (chapter) implement cascading nullification. Verified in Phase 1 tests.

---

## RISK-PCE-02 — Schema Version Guard Breaks Legacy Imports

**Description:** The version guard in `fileSystem.js` must accept `schemaVersion: 4` after the bump, and existing v1–v3 files must still import correctly.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Add `4` to the accepted versions array and add a v3→v4 migration branch.

**Status:** RESOLVED — `fileSystem.js` L73 accepts `[1, 2, 3, 4]`; L234–239 initialises `path: {}` and `chapter: {}` for v3 files. Verified in Phase 1 tests.

---

## RISK-PCE-03 — `loadGraph` and `newGraph` Omit New Collections, Causing Undefined State

**Description:** If `loadGraph` or `newGraph` are not updated to initialise `path: {}` and `chapter: {}`, those keys will be `undefined` and components reading them will crash.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Both functions must initialise both keys in the same commit as the initial state addition.

**Status:** RESOLVED — `narrativeStore.js` L403–404 (`loadGraph`) and L423–424 (`newGraph`) both initialise `path` and `chapter`.

---

## RISK-PCE-04 — `NodeInspector` Dropdown Triggers Unnecessary Re-Renders

**Description:** If the Zustand selector subscribes to the full store instead of a targeted key, every store mutation will trigger `NodeInspector` re-renders.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Use targeted selectors: `useNarrativeStore(state => state.path)` and `useNarrativeStore(state => state.chapter)`.

**Status:** RESOLVED — `NodeInspector.jsx` L25–26 use targeted selectors. Verified in Phase 3 self-review.

---

## RISK-PCE-05 — Path Name Validation Not Applied, Allowing Empty Names

**Description:** Without validation, designers can create empty-named paths/chapters, degrading the dropdown UX.

**Likelihood:** Medium

**Impact:** Low

**Mitigation Strategy:** Store actions validate `name.trim().length > 0`; UI disables the confirm button when input is empty.

**Status:** RESOLVED — `narrativeStore.js` L287–289 (path) and L333–335 (chapter) validate; `PathChapterManager.jsx` disables confirm on empty input.

---

## RISK-VNO-01 — Referential Integrity Gap in deleteFlag/deleteStatus

**Description:** The `variants[].requires`, `options[].requires`, `options[].flags_set`, and `options[].status_set` fields create new locations that reference flag and status IDs. Without extending the scan, deletions silently orphan references.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** `deleteFlag` and `deleteStatus` scans extended to cover `variants[].requires.conditions`, `options[].requires.conditions`, `options[].flags_set`, and `options[].status_set`.

**Status:** RESOLVED — `narrativeStore.js` L232–254 (deleteFlag) and L298–320 (deleteStatus) implement the extended scans. Verified in Phase 1 tests.

---

## RISK-VNO-02 — ChoiceNode Crash on Legacy Nodes Without data.options

**Description:** Existing choice nodes in saved files have no `options` field. Reading `data.options.map()` without a guard crashes the canvas.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Every consumer of `data.options` uses `data.options ?? []`.

**Status:** RESOLVED — `ChoiceNode.jsx` defaults to `[]`; `NodeInspector.jsx` passes `data.options ?? []` to `OptionEditor`. Verified in Phase 2 self-review.

---

## RISK-VNO-03 — React Flow Handle ID Collision Breaks Connect Events

**Description:** Per-option source handles use `handleId` equal to the option's `id`. If IDs collide with React Flow internal keys, connect events misroute.

**Likelihood:** Low

**Impact:** High

**Mitigation Strategy:** Use the `opt-` prefix for all option IDs, distinct from all other entity prefixes.

**Status:** RESOLVED — `generateId('opt')` produces `opt-{uuid}`. Verified in Phase 2 by creating multiple options.

---

## RISK-VNO-04 — deleteOption Leaves Dangling optionId References on Edges

**Description:** Deleting an option without cleaning up edges leaves orphaned `optionId` references. `EdgeInspector` shows broken metadata.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `deleteOption` cascades to remove all edges where `edge.optionId === optionId` within the same `set()` call.

**Status:** RESOLVED — `narrativeStore.js` L431–L455 (`deleteOption`) filters edges in the same mutation. Verified in Phase 1 tests.

---

## RISK-VNO-05 — ChoiceNode Re-Render Storms from data.options Subscription

**Description:** Subscribing to `data.options` via a Zustand selector that returns a new array reference risks breaking `React.memo`.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `ChoiceNode` reads `data.options` from the React Flow `data` prop (already memoized by React Flow), not from a new `useNarrativeStore` selector.

**Status:** RESOLVED — `ChoiceNode.jsx` reads from `data` prop. Verified in Phase 2 self-review.

---

## RISK-VNO-06 — Zustand Selector Returns New Array Literal Causing Infinite Re-Render

**Description:** `EdgeInspector` initially crashed with an infinite re-render loop because a selector returned `[]` (new reference every call). Zustand detected a "change" on every cycle.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Selectors return `undefined` for absent data; consuming components default outside the hook. Formalized as AR-14.

**Status:** RESOLVED — `EdgeInspector.jsx` L10–L16 returns `undefined` from selector, defaults to `[]` outside. Verified in Bug 3 fix.

---

## RISK-CM-01 — `computeReachable` Semantic Shift Leaks Into Non-Choice Paths

**Description:** Phase 3 rewrote `computeReachable` to apply the selected-option filter. Applying the filter unconditionally — instead of only on choice nodes — would silently make common and ending nodes unreachable because they have no `selectedOptionId`.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Gate the filter on `activeNode` being present in `narrativeStore.choice`. Common node paths skip the `optionId` filter entirely.

**Status:** RESOLVED — `simulationStore.js` L12 checks `isChoice` before applying the `optionId` filter (`if (isChoice && e.optionId !== selectedOptionId) return false`). Confirmed in test Group B: `computeReachable` on a non-choice start node returns all condition-passing edges without option filtering.

---

## RISK-CM-02 — Legacy `null`-`optionId` Edges on Choice Nodes Silently Break Campaign

**Description:** Pre-options-feature save files may contain edges sourced from a choice node with `optionId: null`. Under the new routing filter these edges never match any `selectedOptionId`, making the choice node a dead end.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Passive reachability warnings (Phase 4) surface this at authoring time — an author sees a warning badge on the choice node indicating unreachable outgoing edges. No auto-migration.

**Status:** RESOLVED — `simulationStore.js` `computePassiveAnalysis` (L102–L133) identifies unreachable nodes including those blocked by stale null-`optionId` edges. Warning badges rendered via `story-node__warning-badge` on all three node types. Verified in Group B tests: passive analysis detects unreachable nodes.

---

## RISK-CM-03 — Sandbox Overrides Leak Into `narrativeStore` (AR-08 Violation)

**Description:** If `applySandboxOverride` accidentally calls `updateFlag`/`updateStatus` on `narrativeStore` instead of mutating `simulationStore.currentFlagValues`, authored defaults are overwritten silently.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `applySandboxOverride` is a single-line `set()` on `simulationStore` state only. Code review: no `useNarrativeStore.getState().updateFlag`/`.updateStatus` calls appear in the sandbox path.

**Status:** RESOLVED — `simulationStore.js` L194–L216 (`applySandboxOverride`) writes only to `currentFlagValues` within `simulationStore` via `set()`. `SandboxPanel.jsx` imports `useSimulationStore` only for write actions. Audit AR-08 grep: no `narrativeStore` mutation calls in `simulationStore`. AR-08 body updated to explicitly cover sandbox overrides.

---

## RISK-CM-04 — AR-14 Selector Infinite-Loop on New Store Fields

**Description:** New selectors for `nodeStates[id]`, `seenNodeIds.includes(id)`, `orphanedNodeIds.includes(id)` could accidentally return `[]` or `{}` on empty state, triggering Zustand's infinite re-render loop.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Every new selector returns a stable reference or a primitive (`state.nodeStates[id]` returns `undefined` on miss). `runPassiveAnalysis` checks equality before calling `set()` to avoid spurious updates.

**Status:** RESOLVED — All node component selectors confirmed returning primitives: `CommonNode.jsx:6` (`s.nodeStates[id]` → string or undefined), `:7` (`.includes(id)` → boolean). `simulationStore.js:181–184` checks equality before `set()`. No AR-14 violations found during audit §5.

---

## RISK-CM-05 — `.simulation-mode` CSS Class Swap Breaks Authoring Controls

**Description:** Renaming `.simulation-mode` → `.campaign-mode` in `global.css` and `GraphCanvas.jsx` must be atomic. Any missed reference leaves handles visible during campaign mode or locked during edit mode.

**Likelihood:** Low (after mitigation)

**Impact:** Medium

**Mitigation Strategy:** Mechanical search-and-replace followed by grep assertion: `simulation-mode` must return zero matches in the repo after Phase 1.

**Status:** RESOLVED — Grep result: the string `isRunning` appears only in `CHANGED:` comments (3 comment-only matches). No functional `.simulation-mode` references remain. `global.css:530–535` confirms `.campaign-mode` rules are in place. Verified during Phase 1 acceptance.

---

## RISK-IDB-01 — Migration Chain Port Introduces Silent Regression on Legacy Files

**Description:** The v1–v4 migration functions in `fileSystem.js` are ~150 lines of branching transformation logic. When the file is partially rewritten in Phase 2, these functions must be ported verbatim. A subtle difference produces a migration that appears to succeed but silently corrupts node data, edge conditions, or flag references on import.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** A test suite was written against the pure migration logic before and after the port. The suite covers v1→v4 chain identity, defaults injection for missing collections, node structure injection, and unsupported schema rejection.

**Status:** RESOLVED — `tests/test_iteration_phase_02.js` ran 4/4 tests passing (REGRESSION: CLEAN). v1→v4 migration chain confirmed identical to pre-iteration output (audit pass 1, §2, item 9; §4, Migration 2).

---

## RISK-IDB-02 — Auto-Save Subscription Fires Too Frequently and Causes Write Storms

**Description:** The Zustand `subscribe` call wired in Phase 1 fires on every state change to `narrativeStore`. Without debouncing, this could issue hundreds of IndexedDB writes per second during active editing.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** The subscribe callback uses a debounce with a 1000ms interval. The Phase 1 hard stop blocked progress if uncontrolled subscription performance was observed.

**Status:** RESOLVED — `main.jsx` L16–22: `clearTimeout(timeoutId)` + `setTimeout(..., 1000)` debounce. Write storm is structurally impossible — each store change only schedules one pending write and resets the timer on subsequent changes within the window (audit pass 1, §2, item 3).

---

## RISK-IDB-03 — Boot Restore Bypasses or Duplicates Teardown Side Effects

**Description:** Phase 1's `loadFromIndexedDB()` → `loadGraph()` boot sequence could allow a prior campaign session to bleed into the restored state if `exitCampaign()` is not called, or if simulation state were somehow serialized into IndexedDB.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `simulationStore` state is ephemeral and is never written to IndexedDB — only `narrativeStore.exportGraph()` output (which contains no simulation state per AR-08) is passed to `saveToIndexedDB`. `exitCampaign()` is called explicitly after `loadGraph()` at boot.

**Status:** RESOLVED — `main.jsx` L12–13: `loadGraph(data)` then `exitCampaign()` called in sequence at boot. `exportGraph()` output confirmed to contain no `simulationStore` fields (audit pass 1, §3, ACKNOWLEDGED RISK 3).

---

## RISK-IDB-04 — `handleNew` Auto-Save Race Condition Restores Deleted Graph

**Description:** After clicking New, `newGraph()` fires and sets the store to empty. The debounced auto-save subscription then writes this empty state to IndexedDB — which is the correct outcome. Without an explicit `clearIndexedDB()` before `newGraph()`, a timing window exists where the old IndexedDB data survives a mid-debounce tab close.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `handleNew` sequence: (1) await `clearIndexedDB()`, (2) call `newGraph()`, (3) allow the debounced subscribe to write the blank state. If the tab closes during the debounce window after step 1, the app opens blank — the correct post-New state.

**Status:** RESOLVED — `TopBar.jsx` L89–90: `await clearIndexedDB()` called before `newGraph()`. Ordering verified in Phase 3 execution report (audit pass 1, §2, item 11).

---

## RISK-IDB-05 — Schema Version Emitter and Import Version Guard Diverge After Phase 2

**Description:** `narrativeStore.exportGraph()` emits a `schemaVersion` number. `importProject()` validates against an accepted-versions array. If Phase 2 increments the emitter but the import guard is not updated, every file exported after the update is immediately rejected on re-import.

**Likelihood:** Low (after mitigation)

**Impact:** High

**Mitigation Strategy:** The Phase 2 decision to not bump the schema version (sanitization is additive-only) meant no action was required. The emitter and guard both remain at `4`.

**Status:** RESOLVED — No schema bump was introduced. `narrativeStore.js` L568 emits `schemaVersion: 4`; `fileSystem.js` L138 accepts `[1, 2, 3, 4]`. Pairing verified by test Group A and B in `test_iteration_phase_02.js` (audit pass 1, §4, Migration 2).

---

## RISK-CSH-01 — Campaign Auto-Save Write Storm on Every `advance()`

**Description:** `advance()` updates `activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, and `currentFlagValues` on every node transition. If the campaign auto-save subscriber fires on each set without debouncing, the `campaigns` IndexedDB store receives N sequential write requests during rapid playback.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Apply the same 1000ms debounce pattern used for the narrative subscriber. The `useCampaignStore.subscribe(...)` wiring in `main.jsx` uses a shared `campaignTimeoutId` variable, identical in structure to the narrative subscriber.

**Status:** RESOLVED — `main.jsx` L29–35: debounced subscribe on `useCampaignStore` at 1000ms. Mirror of the narrative subscriber pattern. Verified in Phase 1 execution.

---

## RISK-CSH-02 — Dangling Flag/Status IDs in Campaign Snapshots

**Description:** If the designer deletes a flag or status after saving a campaign snapshot, re-entering that campaign will attempt to seed `currentFlagValues` with IDs that no longer exist in `narrativeStore`.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `enterCampaign(payload)` filters `snapshot.flagOverrides` and `snapshot.statusOverrides` against currently-existing IDs in `narrativeStore.getState().flag` and `.status`. Unknown IDs are silently dropped.

**Status:** RESOLVED — `simulationStore.js` L263–274: hydration iterates `narrativeStore.flag` and `narrativeStore.status` values (not the snapshot keys), so deleted IDs are never seeded. Verified in Phase 2 tests.

---

## RISK-CSH-03 — `handleNew` Leaves Orphaned Campaign Data in IndexedDB

**Description:** Clicking New without clearing the campaigns IndexedDB store leaves stale campaign data referencing the previous project's node IDs, which would be restored on next boot.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `handleNew` calls `clearCampaignsIndexedDB()` before `clearIndexedDB()`, then `clearCampaigns()` on the store before `newGraph()`.

**Status:** RESOLVED — `TopBar.jsx` L88–90: `clearCampaignsIndexedDB()` awaited first, then `clearIndexedDB()`, then `clearCampaignsStore()` + `newGraph()`. Verified in Phase 3 execution.

---

## RISK-CSH-04 — `exitCampaign()` Circular Import With `campaignStore`

**Description:** `exitCampaign()` in `simulationStore` must call `campaignStore.updateCampaign(...)`. If this creates a circular import at module level, Zustand store init fails at runtime.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `simulationStore.js` imports `useCampaignStore` directly at module level (not via the barrel) — confirmed `campaignStore.js` does not import `simulationStore.js` in return (AR-06).

**Status:** RESOLVED — `simulationStore.js` L4: `import { useCampaignStore } from './campaignStore.js'`. `campaignStore.js` imports only from `../utils`. No circular dependency. Verified by cold-boot test in Phase 2.

---

## RISK-CSH-05 — Campaign Boot Restore Auto-Resumes an Active Campaign

**Description:** If `activeCampaignId` is restored from IndexedDB, components may incorrectly show a campaign as "active" without user action, or boot logic could auto-call `enterCampaign`.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `loadCampaignsFromIndexedDB()` calls `setActiveCampaign(null)` unconditionally after restoring the campaign list. Only `campaigns{}` is persisted — `activeCampaignId` is always `null` on cold load.

**Status:** RESOLVED — `campaignStore.js` L77: `set({ activeCampaignId: null })` called inside `loadCampaignsFromIndexedDB` after restore. Verified in Phase 1 tests.

---

## RISK-CSH-06 — `SandboxPanel` Scope Creep Beyond Original Protection Boundary

**Description:** `SandboxPanel.jsx` was listed as PROTECTED in the original scope but was modified in Phase 3 to add Campaign Save controls (autosave toggle, Save Progression, Load Last Save). This crosses the original protection boundary.

**Likelihood:** Low

**Impact:** Low

**Mitigation Strategy:** The modification was additive — new controls were added without altering existing override functionality. Verified no regression in sandbox override behaviour.

**Status:** ACKNOWLEDGED — Additive changes only. No existing sandbox functionality altered. Accepted as a conscious scope extension.

---

## RISK-CMK-01 — Keyboard Shortcut Fires Inside Input Fields

**Description:** Single-letter shortcuts (N, C, E, F, S, P, H) are indistinguishable from normal typing. Pressing N while editing a node label in NodeInspector would create an unwanted Common Node.

**Likelihood:** High — designers constantly type in node label/content fields, flag name inputs, and the TopBar title field.

**Impact:** Medium — creates an unwanted entity but does not corrupt data.

**Mitigation Strategy:** Guard at the top of the `keydown` handler: check `event.target.tagName` and `event.target.isContentEditable`; return early if the event originates from an input context.

**Status:** RESOLVED — `useKeyboardShortcuts.js:11-18` checks `tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable` and returns early. Verified in Phase 2 tests.

---

## RISK-CMK-02 — Context Menu Conflicts With React Flow Pane Event Handling

**Description:** Without `event.preventDefault()`, the browser's native context menu appears on top of the custom menu. React Flow's event pipeline could also transform event coordinates.

**Likelihood:** Medium

**Impact:** Medium — wrong menu position or overlapping browser menu makes the feature unusable.

**Mitigation Strategy:** Call `event.preventDefault()` as the first line of all three context menu handlers. Use `event.clientX`/`clientY` for position.

**Status:** RESOLVED — `GraphCanvas.jsx:207-224` confirms `event.preventDefault()` at the top of all three handlers. Menu positions correctly verified in Phase 3 tests.

---

## RISK-CMK-03 — `selectedNodeId` vs `selectedNodeIds` Consumer Mismatch Breaks NodeInspector

**Description:** If `onSelectionChange` cleared `selectedNodeId`, `NodeInspector` would lose its single-node editing target and show an empty state during normal single-click selection.

**Likelihood:** Medium

**Impact:** High — `NodeInspector` becomes non-functional for single-node editing, the primary authoring workflow.

**Mitigation Strategy:** `setSelectedNodeIds` called only from `onSelectionChange`; single-node `onNodeClick` continues to call `selectNode(id)` (setting `selectedNodeId`) exclusively. The two fields are fully independent.

**Status:** RESOLVED — `GraphCanvas.jsx:315-317` wires `onSelectionChange` to `setSelectedNodeIds`; `GraphCanvas.jsx:261-277` `onNodeClick` calls `selectNode` unchanged. Verified in Phase 1 tests.

---

## RISK-CMK-04 — Context Menu Stays Open After Canvas Scroll or Node Drag

**Description:** A context menu left open while the user pans or drags would float at a stale position, leading to misaligned actions.

**Likelihood:** Low

**Impact:** Low — confusing but not data-corrupting.

**Mitigation Strategy:** Dismiss menu from `onMoveStart`, `onNodeDragStart`, and `onPaneClick` handlers in `GraphCanvas`.

**Status:** RESOLVED — `GraphCanvas.jsx:300,320,424` all call `closeContextMenu`. Verified in Phase 3 tests.

---

## RISK-CMK-05 — Context Menu Renders Off-Screen Near Viewport Edges

**Description:** A context menu opened near the right or bottom edge of the viewport would overflow and be partially hidden.

**Likelihood:** Medium

**Impact:** Low — menu actions become inaccessible.

**Mitigation Strategy:** After positioning at cursor, compare `rect.right` against `window.innerWidth` and `rect.bottom` against `window.innerHeight`; flip to left/up if overflow detected.

**Status:** RESOLVED — `ContextMenu.jsx:15-26` implements the viewport-flip check via `useLayoutEffect`. Verified in Phase 3 tests.

---

## RISK-CMK-06 — ESC Key Double-Handling

**Description:** `GraphCanvas.jsx` previously had an inline `useEffect` adding a `keydown` listener for Escape → `clearSelection()`. The new hook also handles Escape. Coexistence would call `clearSelection()` twice per keypress — structurally wrong and masking future bugs.

**Likelihood:** Medium

**Impact:** Medium — double-call is functionally benign now but breaks the single-authoritative-handler invariant.

**Mitigation Strategy:** Delete the inline `useEffect` block from `GraphCanvas` atomically with adding the hook mount.

**Status:** RESOLVED — Inline ESC handler removed from `GraphCanvas`; `useKeyboardShortcuts.js:21-24` is the sole ESC handler. Verified in Phase 1 tests.

---

## RISK-CMK-07 — Node Creation at Canvas Origin

**Description:** If `addNode({ x: 0, y: 0 }, type)` is called, the new node appears at the canvas origin — possibly off-screen if the designer has panned away.

**Likelihood:** Medium

**Impact:** Low — node is created but invisible without tidy layout.

**Mitigation Strategy:** Keyboard hook and CreationBar dispatch `canvas-add-node` DOM events rather than calling `addNode` directly; `GraphCanvas` handles the event and calls `addNode(screenToFlowPosition(viewportCenter), type)` using its `useReactFlow()` context.

**Status:** RESOLVED — Custom DOM event pattern in place per AR-19. `GraphCanvas` positions new nodes at viewport center. Verified in Phase 2 and Phase 4 tests.

---

## RISK-CMK-08 — ESC Inside NameModal Simultaneously Clears Canvas Selection

**Description:** The global keyboard hook handles Escape → `clearSelection()` on `window keydown`. Pressing ESC to dismiss `NameModal` fires the same event, producing a double side-effect where canvas selection is also cleared.

**Likelihood:** High — ESC is the intuitive dismiss gesture.

**Impact:** Medium — functionally harmless but inconsistent UX.

**Mitigation Strategy:** `NameModal` attaches its own `keydown` listener that calls `event.stopPropagation()` before `onClose()`, preventing the event from reaching the window listener.

**Status:** RESOLVED — `NameModal.jsx:61` implements `stopPropagation` on ESC. Verified in Phase 2 tests.

---

## RISK-CMK-09 — NameModal Opens During Campaign Mode

**Description:** If the `canvas-open-name-modal` listener in `GraphCanvas` does not independently guard on `isCampaignActive`, a timing or render race could open the modal during an active campaign.

**Likelihood:** Low — two guard layers (hook bailout, CreationBar disabled) already exist.

**Impact:** Medium — unexpected entity creation during campaign.

**Mitigation Strategy:** Three guard layers: (1) keyboard hook bails on `isCampaignActive`; (2) CreationBar buttons are `disabled={isCampaignActive}`; (3) `GraphCanvas` `canvas-open-name-modal` listener independently reads `isCampaignActive` and bails.

**Status:** MITIGATED — All three guard layers confirmed in audit §2. No campaign-mode modal opening observed in Phase 2 and Phase 4 tests.

---

## RISK-CMK-10 — `addNode` Signature Change Is Silent for Existing Callers

**Description:** `narrativeStore.addNode` gained an optional `label` parameter (defaults to `'Node'`) and now returns the new node ID. Existing callers that ignore the return value continue to work, but the extended contract is not declared in any formal document.

**Likelihood:** Low — signature is additive and backward compatible.

**Impact:** Low — future callers expecting void return could be surprised; the return-id contract is useful but undiscovered.

**Mitigation Strategy:** Document the current `addNode` signature in the codebase features entry for `narrativeStore.js`. Future features that extend action signatures must declare them in the data model impact document per AR-20.

**Status:** OPEN — No code mitigation required; documentation updated in `codebase_features.md`. AR-20 formalises the process rule to prevent recurrence.

---

## RISK-CMK-11 — Scope Expansion Across 7 Additional Files Bypasses Per-Phase File Map

**Description:** Implementation pass 4b (`ran_0205_fix_04b.md`) modified `narrativeStore.js`, `NodeInspector.jsx`, `FlagManager.jsx`, `StatusManager.jsx`, and several phase-2/3 files outside the original phase file maps. These changes are user-approved but invisible to future auditors reviewing per-phase file maps.

**Likelihood:** Low — changes are user-approved; impact already accepted.

**Impact:** Low — future auditors may not discover the out-of-scope edits when reviewing individual phase reports.

**Mitigation Strategy:** Scope expansions approved during implementation should be recorded in an addendum to the relevant phase file map or in the audit report. No code change needed; process improvement only.

**Status:** OPEN — Accepted. Surfaced in audit §6. No regression detected. AR-20 and AR-21 partially address the documentation discipline that would prevent this class of issue.

---

## RISK-CMK-12 — `onSelectionChange` Fires Synchronously Inside React Flow Render

**Description:** The earlier implementation required a `queueMicrotask` wrapper to prevent an infinite-loop bug triggered by `onSelectionChange` → `setSelectedNodeIds` → re-render → `onSelectionChange`. The microtask wrapper was removed after the order-independent equality check in `setSelectedNodeIds` provided the fix. If a future React Flow upgrade changes its selection emission pattern, the loop could re-emerge.

**Likelihood:** Low — current implementation is stable; risk is contingent on upstream React Flow changes.

**Impact:** Medium — if it re-emerges, the canvas re-render loop crashes the UI.

**Mitigation Strategy:** The `setSelectedNodeIds` action compares the incoming array against current state (order-independent) before calling `set()`, preventing spurious updates. Watch item: verify stability after each React Flow version upgrade.

**Status:** OPEN — No action required now. Monitor during future React Flow upgrades.

---

## RISK-CPT-01 — Whole-Store Destructure in CommandPalette Causes Unnecessary Re-Renders

**Description:** `CommandPalette.jsx:10` subscribes to `narrativeStore` via a whole-store destructure (e.g., `const { common, choice, ending, flag, ... } = useNarrativeStore()`). Any mutation to `narrativeStore` — including node drags, label edits, and side-effect changes — triggers a re-render of the palette component even when the search index memo is still valid. Low impact when the palette is closed (React bails on the hidden subtree), but tightening to per-slice selectors would eliminate the unnecessary subscription entirely.

**Likelihood:** Low — palette is almost always closed; React's hidden subtree optimisation limits actual render cost.

**Impact:** Low — re-renders are suppressed by the `useMemo` search index; no user-visible behaviour degradation under normal use.

**Mitigation Strategy:** Refactor `CommandPalette.jsx` to use per-slice selectors (`useNarrativeStore(s => s.common)`, `useNarrativeStore(s => s.choice)`, etc.) per AR-23. Schedule as a future cleanup, not a blocking issue.

**Status:** OPEN — Surfaced in audit pass 2 §6. Non-blocking; deferred to future cleanup.

---

## RISK-CPT-02 — Stale `isOpen` Closure in Palette-Toggle Effect

**Description:** `CommandPalette.jsx:14-24` has a `useEffect` whose closure captures `isOpen` at the time the effect is registered. If the `palette-toggle` DOM event fires and the closure holds a stale reference to `isOpen`, the toggle logic (`if (isOpen) close() else open()`) may act on the wrong state — e.g., re-opening a palette that is already open.

**Likelihood:** Low — functional today; the effect dependency array includes `isOpen` which causes re-registration on each state change, keeping the closure fresh in practice.

**Impact:** Low — if the bug manifests, the palette flickers or fails to toggle; no data is affected.

**Mitigation Strategy:** Refactor the effect to use a `useRef` for `isOpen` (ref stays current without causing re-registration) or a functional-set pattern (`setIsOpen(prev => !prev)`) dispatched from the event listener without reading closed-over state. Either removes the staleness risk entirely.

**Status:** OPEN — Surfaced in audit pass 2 §6. Non-blocking; deferred to future cleanup.
