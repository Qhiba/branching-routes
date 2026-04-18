# Branching Routes — Risk Register

---

| # | Risk | Likelihood | Impact | Mitigation Strategy | Status |
|---|---|---|---|---|---|
| RISK-01 | Real-Time Simulation Causes React Flow Re-Render Storms | Medium | High | See details below | OPEN |
| RISK-02 | Flag Name Collisions Break Condition Evaluation | High | High | See details below | OPEN |
| RISK-03 | File System Access API Browser Compatibility Breaks Save/Open | High | Medium | See details below | OPEN |
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
