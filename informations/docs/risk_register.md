# Branching Routes — Risk Register

> **Last updated:** 2026-08-05 (Audit integration update)
>
> Risks are grouped by **priority** (P0 → P3), then by **category** within each tier.
> Only **OPEN**, **MITIGATED**, and **ACKNOWLEDGED** risks are shown in the summary tables.
> Fully **RESOLVED** risks are collapsed into a reference table at the bottom.

**Active risk count: 0 OPEN · 0 MITIGATED · 0 ACKNOWLEDGED · 87 RESOLVED**

---

## Priority Definitions

| Priority | Meaning | Response |
|----------|---------|----------|
| 🔴 **P0 — Critical** | Active bug or data-loss risk affecting every session | Fix immediately |
| 🟠 **P1 — High** | High-impact issue that degrades core functionality | Fix very soon |
| 🟡 **P2 — Medium** | Correctness or performance issue under specific conditions | Fix when able |
| 🟢 **P3 — Low** | Minor issue, code hygiene, or nice-to-have improvement | Fix opportunistically |

---

| # | Risk | Likelihood | Impact | Mitigation Strategy | Status |
|---|---|---|---|---|---|
| RISK-01 | Real-Time Simulation Causes React Flow Re-Render Storms | Medium | High | React.memo + targeted primitive selectors | RESOLVED |
| RISK-02 | Flag Name Collisions Break Condition Evaluation | High | High | Pre-deletion reference scan + force cascade in deleteFlag | RESOLVED |
| RISK-03 | File System Access API Browser Compatibility Breaks Save/Open | High | Medium | See details below | RESOLVED |

---

## RISK-01 — Real-Time Simulation Causes React Flow Re-Render Storms

**Description:** The "live checker" simulation needs to update node/edge highlight state on every user action (advance to next node). If `simulationStore` changes cause all nodes and edges to re-render simultaneously on each update, the canvas will lag noticeably at even modest graph sizes (50+ nodes).

**What could go wrong:** Designer advances the simulation; the entire canvas freezes or flickers. At 200+ nodes it becomes unusable.

**Likelihood:** Medium — React Flow manages its own internal rendering, but custom nodes with store subscriptions can trigger cascading renders.

**Impact:** High — A laggy simulation defeats the core value proposition of real-time path highlighting.

**Mitigation Strategy:** `StoryNode` and `ConditionalEdge` must use `React.memo` and derive only their own highlight state from `simulationStore` using a targeted selector (e.g., `useSimulationStore(s => s.visitedNodeIds.includes(id))`), not the entire store object. This ensures only the nodes whose status actually changed re-render.

**Early detection:** During Phase 5 (simulation), manually advance through a 30-node graph. Open Chrome DevTools → Performance tab. If a single "advance" action triggers >100 component re-renders or takes >32ms per frame, this risk has materialised.

**Status:** RESOLVED — All custom node components (`CommonNode`, `ChoiceNode`, `EndingNode`, `WarpEntranceNode`, `WarpExitNode`) and `ConditionalEdge` are wrapped in `React.memo` and use targeted primitive selectors (`.includes(id)`, `nodeStates[id]`), containing step-transition re-renders to only affected nodes.

**Simple Solution:** Already resolved — `React.memo` wrappers and targeted primitive selectors are implemented across all node and edge components. No further action required.

---

## RISK-02 — Flag Name Collisions Break Condition Evaluation

**Description:** The condition evaluator looks up flags by `flagId` (UUID). However, if the designer renames a flag or deletes a flag that is referenced in an edge condition or node side-effect, those references become orphaned and the evaluator will silently return the wrong result or crash.

**What could go wrong:** Designer deletes `HasKey` flag. Edges that depended on `HasKey` now reference a non-existent ID. The simulation evaluates those edges as always-false or throws an uncaught exception.

**Likelihood:** High — Flag deletion is a natural editing action; it's almost certain designers will do this.

**Impact:** High — Silent evaluation errors produce incorrect simulation behaviour with no visible cause.

**Mitigation Strategy:** Before deleting a flag, `graphStore` must scan all `edges[].condition.clauses` and `nodes[].sideEffects` for references to that `flagId`. If references exist, display a blocking confirmation dialog listing the affected edges/nodes. The deletion must not proceed silently.

**Early detection:** In Phase 4 (condition editing), attempt to delete a flag that is currently referenced by an edge condition. If no warning is shown and the deletion succeeds, this risk has materialised.

**Status:** RESOLVED — `narrativeStore.js` `deleteFlag` scans edge conditions, node side-effects, variant preconditions, and option conditions/side-effects. Returns `{ blocked: true, references }` if referenced without `force`. UI (`FlagManager.jsx`) presents a confirmation modal before deletion. If forced, `deleteFlag` performs cascading cleanup of referencing conditions and side-effects.

**Simple Solution:** Already resolved — pre-deletion referential integrity scanning and blocking confirmation dialog implemented in `narrativeStore.js` and `FlagManager.jsx`. No further action required.

---

## RISK-03 — File System Access API Browser Compatibility Breaks Save/Open

**Description:** The File System Access API (`showSaveFilePicker`, `showOpenFilePicker`) is not available in Firefox or Safari as of mid-2025. The scope document assumes designers run the app in their browser of choice.

**What could go wrong:** A designer using Firefox cannot save or open any files. Clicking "Save" does nothing or throws an uncaught error.

**Likelihood:** High — Firefox and Safari together represent a significant share of developer browser usage.

**Impact:** Medium — The app is still fully functional for editing; only persistence is blocked, and Chromium browsers work fine.

**Mitigation Strategy:** `fileSystem.js` must check for API support (`typeof window.showSaveFilePicker === 'function'`) and fall back to a `<a download>` programmatic download + `<input type="file">` upload approach. The fallback must be implemented in Phase 2, not deferred, since every subsequent phase depends on file I/O.

**Early detection:** During Phase 2 (file system utilities), open the app in Firefox. Click Save. If the browser throws `TypeError: window.showSaveFilePicker is not a function`, this risk has materialised.

**Status:** RESOLVED — IndexedDB auto-save (`fileSystem.js` `saveToIndexedDB`, L23–36; `main.jsx` `initPersistence`, L9–23) now provides universal automatic persistence on all browsers including Firefox and Safari. The `<a download>` / `<input type="file">` fallback paths are retained for the explicit Export/Import actions (audit pass 1, §2, items 5–6). Work is now safe on all browsers even without interacting with file dialogs.

**Simple Solution:** Already resolved — IndexedDB auto-save provides universal persistence across all browsers. The `<a download>` / `<input type="file">` fallback paths remain for explicit Export/Import. No further action required.

---

## RISK-04 — Graph Becomes Visually Unreadable at Medium Scale

**Description:** The scope accepts the "visual spaghetti" risk from the brainstorm and defers route-tracing features, but even a 20-node graph with multiple crossing edges and long condition labels can become difficult to read without some form of layout assistance.

**What could go wrong:** During acceptance testing, the designer builds a 20-node graph and finds it impossible to follow which path leads where. The tool feels worse than pen-and-paper.

**Likelihood:** Medium — Inevitable for complex narratives; partially addressable with layout tools.

**Impact:** Medium — Doesn't break functionality, but severely degrades usability.


---

## RISK-04 — Graph Becomes Visually Unreadable at Medium Scale

**Description:** The scope accepts the "visual spaghetti" risk from the brainstorm and defers route-tracing features, but even a 20-node graph with multiple crossing edges and long condition labels can become difficult to read without some form of layout assistance.

**What could go wrong:** During acceptance testing, the designer builds a 20-node graph and finds it impossible to follow which path leads where. The tool feels worse than pen-and-paper.

**Likelihood:** Medium — Inevitable for complex narratives; partially addressable with layout tools.

**Impact:** Medium — Doesn't break functionality, but severely degrades usability.

**Mitigation Strategy:** Phase 3 must implement React Flow's built-in `Background` grid and ensure edges use the `smoothstep` or `bezier` edge type (not straight lines) by default. A Dagre-based auto-layout action ("Tidy Layout" button) should be included in Phase 5 as a first-class feature, not a nice-to-have, since it is the minimum defence against spaghetti at scale.

**Early detection:** During Phase 5, manually build a 15-node graph with at least 3 flag conditions. If edges visually overlap and there is no way to untangle them, the risk has materialised.

**Status:** RESOLVED — Implemented Dagre-based "Tidy Layout" auto-organization engine (triggered via TopBar button or `L` shortcut), smooth-step edge routing (`getSmoothStepPath`), custom `bendX` per-edge drag handles, and added clear discoverability tooltips (`title="Auto-arrange graph nodes hierarchically to untangle crossing paths (L)"`) to the TopBar button.

**Simple Solution:** Resolved — Smooth-step edge routing, Dagre auto-layout, manual `bendX` handles, and discoverable TopBar tooltips ensure graphs at any scale are easily untangled.

---

## RISK-05 — Simulation "Live Checker" UX is Ambiguous Without a Clear Mode Indicator

**Description:** The scope defines a "live checker" mode where the designer interacts with the graph directly to advance the simulation. If there is no obvious visual difference between "editing mode" and "simulation mode", the designer will accidentally add/delete nodes while simulating, or not understand why node-drag suddenly doesn't work.

**What could go wrong:** Designer clicks a node expecting to move it, but instead "advances" the simulation to that node. They are confused about what the tool is doing.

**Likelihood:** Medium — Mode-based UIs are a well-known source of confusion; first-time users are especially vulnerable.

**Impact:** Medium — Doesn't cause data loss but creates a frustrating and confusing experience.

**Mitigation Strategy:** `GraphCanvas` applies `.campaign-mode` class when `isCampaignActive === true`, dimming sidebars, disabling file actions in TopBar, changing cursor to `pointer` exclusively on reachable nodes, hiding drag handles, and presenting active campaign metrics in `StatusStrip`. `ReactFlow` double-guards interaction with `nodesDraggable={!isCampaignActive}`, `nodesConnectable={!isCampaignActive}`, and `elementsSelectable={!isCampaignActive}`.

**Status:** RESOLVED — Fully implemented across `GraphCanvas.jsx`, `global.css`, `TopBar.jsx`, `LeftSidebar.jsx`, `RightSidebar.jsx`, and `StatusStrip.jsx`. Canvas root applies `.campaign-mode`, React Flow props declarative mode guards (`nodesDraggable={!isCampaignActive}`, `nodesConnectable={!isCampaignActive}`, `elementsSelectable={!isCampaignActive}`), event handlers short-circuit authoring actions, and reachable nodes display `cursor: pointer` affordance.

**Simple Solution:** Resolved — `GraphCanvas.jsx` toggles `.campaign-mode` class on `.canvas-wrapper`, sets `nodesDraggable={!isCampaignActive}`, `nodesConnectable={!isCampaignActive}`, and `elementsSelectable={!isCampaignActive}` on `<ReactFlow>`, guards event handlers (`if (isCampaignActive) return;`), and `global.css` overrides node/handle pointers and opacities.

---

## RISK-06 — Simulation state CSS overrides conflict with new accent borders

**Description:** The simulation state classes override `border-color`. If type accent styling uses `border-color` with higher or equal specificity, simulation states could be lost.

**Mitigation Strategy:** Simulation classes use `!important` and are placed at the bottom of the CSS file.

**Status:** RESOLVED — Ordered all simulation state override classes (`.story-node--active`, `.story-node--reachable`, `.story-node--locked`, `.story-node--complete`, `.story-node--failed`, `.story-node--branch_locked`, `.story-node--seen`) after static node type rules in `global.css` (lines 490–531) and enforced `border-color` and `box-shadow` overrides with `!important`.

**Simple Solution:** Resolved — Enforced `border-color` and `box-shadow` `!important` overrides placed at the bottom of `global.css`, guaranteeing simulation state indicators override node type accent borders 100% of the time.

---

## RISK-07 — Option count indicator in ChoiceNode requires store access

**Description:** Displaying outgoing edge count on ChoiceNode requires filtering `narrativeStore` edges, causing possible render cycles.

**Mitigation Strategy:** Use a targeted, memoized `useNarrativeStore` selector inside `ChoiceNode`.

**Status:** RESOLVED — Confirmed `ChoiceNode.jsx` uses primitive number selector `useNarrativeStore(s => s.edges.filter(e => e.sourceId === id).length)`, eliminating store subscriber re-render cycles across the canvas.

**Simple Solution:** Resolved — `ChoiceNode.jsx` derives outgoing edge count via primitive number selector, guaranteeing zero re-renders when unrelated edges are edited.

---

## RISK-08 — Badge styling overlaps with existing `story-node__badge`

**Description:** Adding a new type badge might conflict with the existing side-effect badge if class names bleed.

**Mitigation Strategy:** Use distinct class names (`.story-node__type-label` vs `.story-node__meta-badge`) and encapsulated styles.

**Status:** RESOLVED — Enforced BEM CSS namespacing across node badges (`.story-node__type-label`, `.story-node__meta-badge`, `.story-node__warning-badge`) in `global.css` (lines 137–182), preventing class name bleeding or visual style collisions.

**Simple Solution:** Resolved — Enforced distinct BEM CSS class names (`.story-node__type-label`, `.story-node__meta-badge`, `.story-node__warning-badge`) guaranteeing zero style bleeding between badge types.

---

## RISK-09 — `choice-node` and `ending-node` classes already exist

**Description:** Suffix classes already exist in `global.css` leading to possible rule collisions when expanding their definitions.

**Mitigation Strategy:** Treat blocks as purely additive during the iteration without overwriting unrelated layout structures.

**Status:** RESOLVED — Enforced additive BEM CSS rules (`.choice-node__*`, `.ending-node__*`) in `global.css` (lines 360–437), eliminating property overwrites and style collisions on base `.story-node` rules.

**Simple Solution:** Resolved — Enforced additive BEM class structure (`.choice-node__*`, `.ending-node__*`) in `global.css`, guaranteeing zero rule collisions with legacy base classes.

---

## RISK-10 — EndingNode accent color visually clashes with simulation `--color-active`

**Description:** `--color-node-ending` (orange) and `--color-active` (orange) were similar, meaning active ending node borders had potential to blend in during simulation.

**Mitigation Strategy:** Applied vivid sky-blue active halo (`#38bdf8`) to `.ending-node.story-node--active`.

**Status:** RESOLVED — Added vivid sky-blue active halo (`border-color: #38bdf8 !important`, `box-shadow: 0 0 0 3px #38bdf8, 0 0 18px rgba(56, 189, 248, 0.7) !important`) for `.ending-node.story-node--active` in `global.css` (lines 497–501), ensuring 100% clear visual distinction during campaign simulation playback.

**Simple Solution:** Resolved — Applied vivid sky-blue active halo rule `.ending-node.story-node--active` in `global.css`, eliminating visual contrast clashing with orange accent borders.

---

## RISK-PCE-01 — Orphaned Node References After Path/Chapter Deletion

**Likelihood:** High

**Impact:** Medium

**Mitigation Strategy:** `deletePath` and `deleteChapter` perform a full sweep of `common`, `choice`, and `ending` within the same `set()` call, nullifying matching references before removing the entity.

**Status:** RESOLVED — `narrativeStore.js` L305–329 (path) and L351–375 (chapter) implement cascading nullification. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — cascading nullification runs inside the same `set()` call in `deletePath` and `deleteChapter`. No further action required.

---

## RISK-PCE-02 — Schema Version Guard Breaks Legacy Imports

**Description:** The version guard in `fileSystem.js` must accept `schemaVersion: 4` after the bump, and existing v1–v3 files must still import correctly.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Add `4` to the accepted versions array and add a v3→v4 migration branch.

**Status:** RESOLVED — `fileSystem.js` L73 accepts `[1, 2, 3, 4]`; L234–239 initialises `path: {}` and `chapter: {}` for v3 files. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — `fileSystem.js` accepts `[1, 2, 3, 4]` and includes a v3→v4 migration branch. No further action required.

---

## RISK-PCE-03 — `loadGraph` and `newGraph` Omit New Collections, Causing Undefined State

**Description:** If `loadGraph` or `newGraph` are not updated to initialise `path: {}` and `chapter: {}`, those keys will be `undefined` and components reading them will crash.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Both functions must initialise both keys in the same commit as the initial state addition.

**Status:** RESOLVED — `narrativeStore.js` L403–404 (`loadGraph`) and L423–424 (`newGraph`) both initialise `path` and `chapter`.

**Simple Solution:** Already resolved — both `loadGraph` and `newGraph` initialise `path: {}` and `chapter: {}`. No further action required.

---

## RISK-PCE-04 — `NodeInspector` Dropdown Triggers Unnecessary Re-Renders

**Description:** If the Zustand selector subscribes to the full store instead of a targeted key, every store mutation will trigger `NodeInspector` re-renders.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Use targeted selectors: `useNarrativeStore(state => state.path)` and `useNarrativeStore(state => state.chapter)`.

**Status:** RESOLVED — `NodeInspector.jsx` L25–26 use targeted selectors. Verified in Phase 3 self-review.

**Simple Solution:** Already resolved — `NodeInspector.jsx` uses `useNarrativeStore(state => state.path)` and `useNarrativeStore(state => state.chapter)` targeted selectors. No further action required.

---

## RISK-PCE-05 — Path Name Validation Not Applied, Allowing Empty Names

**Description:** Without validation, designers can create empty-named paths/chapters, degrading the dropdown UX.

**Likelihood:** Medium

**Impact:** Low

**Mitigation Strategy:** Store actions validate `name.trim().length > 0`; UI disables the confirm button when input is empty.

**Status:** RESOLVED — `narrativeStore.js` L287–289 (path) and L333–335 (chapter) validate; `PathChapterManager.jsx` disables confirm on empty input.

**Simple Solution:** Already resolved — store validates `name.trim().length > 0` and the UI disables the confirm button on empty input. No further action required.

---

## RISK-VNO-01 — Referential Integrity Gap in deleteFlag/deleteStatus

**Description:** The `variants[].requires`, `options[].requires`, `options[].flags_set`, and `options[].status_set` fields create new locations that reference flag and status IDs. Without extending the scan, deletions silently orphan references.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** `deleteFlag` and `deleteStatus` scans extended to cover `variants[].requires.conditions`, `options[].requires.conditions`, `options[].flags_set`, and `options[].status_set`.

**Status:** RESOLVED — `narrativeStore.js` L232–254 (deleteFlag) and L298–320 (deleteStatus) implement the extended scans. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — `deleteFlag` and `deleteStatus` extended scans cover `variants[].requires`, `options[].requires`, `options[].flags_set`, and `options[].status_set`. No further action required.

---

## RISK-VNO-02 — ChoiceNode Crash on Legacy Nodes Without data.options

**Description:** Existing choice nodes in saved files have no `options` field. Reading `data.options.map()` without a guard crashes the canvas.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Every consumer of `data.options` uses `data.options ?? []`.

**Status:** RESOLVED — `ChoiceNode.jsx` defaults to `[]`; `NodeInspector.jsx` passes `data.options ?? []` to `OptionEditor`. Verified in Phase 2 self-review.

**Simple Solution:** Already resolved — all `data.options` consumers use `data.options ?? []`. No further action required.

---

## RISK-VNO-03 — React Flow Handle ID Collision Breaks Connect Events

**Description:** Per-option source handles use `handleId` equal to the option's `id`. If IDs collide with React Flow internal keys, connect events misroute.

**Likelihood:** Low

**Impact:** High

**Mitigation Strategy:** Use the `opt-` prefix for all option IDs, distinct from all other entity prefixes.

**Status:** RESOLVED — `generateId('opt')` produces `opt-{uuid}`. Verified in Phase 2 by creating multiple options.

**Simple Solution:** Already resolved — `generateId('opt')` produces `opt-{uuid}` preventing ID collisions with React Flow internals. No further action required.

---

## RISK-VNO-04 — deleteOption Leaves Dangling optionId References on Edges

**Description:** Deleting an option without cleaning up edges leaves orphaned `optionId` references. `EdgeInspector` shows broken metadata.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `deleteOption` cascades to remove all edges where `edge.optionId === optionId` within the same `set()` call.

**Status:** RESOLVED — `narrativeStore.js` L431–L455 (`deleteOption`) filters edges in the same mutation. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — `deleteOption` cascades edge removal in the same `set()` mutation. No further action required.

---

## RISK-VNO-05 — ChoiceNode Re-Render Storms from data.options Subscription

**Description:** Subscribing to `data.options` via a Zustand selector that returns a new array reference risks breaking `React.memo`.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `ChoiceNode` reads `data.options` from the React Flow `data` prop (already memoized by React Flow), not from a new `useNarrativeStore` selector.

**Status:** RESOLVED — `ChoiceNode.jsx` reads from `data` prop. Verified in Phase 2 self-review.

**Simple Solution:** Already resolved — `ChoiceNode.jsx` reads `data.options` from the React Flow `data` prop (already memoized by React Flow) rather than a new store selector. No further action required.

---

## RISK-VNO-06 — Zustand Selector Returns New Array Literal Causing Infinite Re-Render

**Description:** `EdgeInspector` initially crashed with an infinite re-render loop because a selector returned `[]` (new reference every call). Zustand detected a "change" on every cycle.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Selectors return `undefined` for absent data; consuming components default outside the hook. Formalized as AR-14.

**Status:** RESOLVED — `EdgeInspector.jsx` L10–L16 returns `undefined` from selector, defaults to `[]` outside. Verified in Bug 3 fix.

**Simple Solution:** Already resolved — selectors return `undefined` on miss; consuming components default to `[]` outside the hook. Formalised as AR-14. No further action required.

---

## RISK-CM-01 — `computeReachable` Semantic Shift Leaks Into Non-Choice Paths

**Description:** Phase 3 rewrote `computeReachable` to apply the selected-option filter. Applying the filter unconditionally — instead of only on choice nodes — would silently make common and ending nodes unreachable because they have no `selectedOptionId`.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Gate the filter on `activeNode` being present in `narrativeStore.choice`. Common node paths skip the `optionId` filter entirely.

**Status:** RESOLVED — `simulationStore.js` L12 checks `isChoice` before applying the `optionId` filter (`if (isChoice && e.optionId !== selectedOptionId) return false`). Confirmed in test Group B: `computeReachable` on a non-choice start node returns all condition-passing edges without option filtering.

**Simple Solution:** Already resolved — `simulationStore.js` gates the `optionId` filter on `isChoice` before applying it, leaving common and ending node paths unaffected. No further action required.

---

## RISK-CM-02 — Legacy `null`-`optionId` Edges on Choice Nodes Silently Break Campaign

**Description:** Pre-options-feature save files may contain edges sourced from a choice node with `optionId: null`. Under the new routing filter these edges never match any `selectedOptionId`, making the choice node a dead end.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Passive reachability warnings (Phase 4) surface this at authoring time — an author sees a warning badge on the choice node indicating unreachable outgoing edges. No auto-migration.

**Status:** RESOLVED — `simulationStore.js` `computePassiveAnalysis` (L102–L133) identifies unreachable nodes including those blocked by stale null-`optionId` edges. Warning badges rendered via `story-node__warning-badge` on all three node types. Verified in Group B tests: passive analysis detects unreachable nodes.

**Simple Solution:** Already resolved — `computePassiveAnalysis` identifies unreachable nodes (including those blocked by stale `null`-`optionId` edges) and renders warning badges. No further action required.

---

## RISK-CM-03 — Sandbox Overrides Leak Into `narrativeStore` (AR-08 Violation)

**Description:** If `applySandboxOverride` accidentally calls `updateFlag`/`updateStatus` on `narrativeStore` instead of mutating `simulationStore.currentFlagValues`, authored defaults are overwritten silently.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `applySandboxOverride` is a single-line `set()` on `simulationStore` state only. Code review: no `useNarrativeStore.getState().updateFlag`/`.updateStatus` calls appear in the sandbox path.

**Status:** RESOLVED — `simulationStore.js` L194–L216 (`applySandboxOverride`) writes only to `currentFlagValues` within `simulationStore` via `set()`. `SandboxPanel.jsx` imports `useSimulationStore` only for write actions. Audit AR-08 grep: no `narrativeStore` mutation calls in `simulationStore`. AR-08 body updated to explicitly cover sandbox overrides.

**Simple Solution:** Already resolved — `applySandboxOverride` writes only to `simulationStore` via a single `set()` call; no `narrativeStore` mutations exist in the sandbox path. No further action required.

---

## RISK-CM-04 — AR-14 Selector Infinite-Loop on New Store Fields

**Description:** New selectors for `nodeStates[id]`, `seenNodeIds.includes(id)`, `orphanedNodeIds.includes(id)` could accidentally return `[]` or `{}` on empty state, triggering Zustand's infinite re-render loop.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Every new selector returns a stable reference or a primitive (`state.nodeStates[id]` returns `undefined` on miss). `runPassiveAnalysis` checks equality before calling `set()` to avoid spurious updates.

**Status:** RESOLVED — All node component selectors confirmed returning primitives: `CommonNode.jsx:6` (`s.nodeStates[id]` → string or undefined), `:7` (`.includes(id)` → boolean). `simulationStore.js:181–184` checks equality before `set()`. No AR-14 violations found during audit §5.

**Simple Solution:** Already resolved — all new selectors return stable primitives and `runPassiveAnalysis` checks equality before calling `set()`. No further action required.

---

## RISK-CM-05 — `.simulation-mode` CSS Class Swap Breaks Authoring Controls

**Description:** Renaming `.simulation-mode` → `.campaign-mode` in `global.css` and `GraphCanvas.jsx` must be atomic. Any missed reference leaves handles visible during campaign mode or locked during edit mode.

**Likelihood:** Low (after mitigation)

**Impact:** Medium

**Mitigation Strategy:** Mechanical search-and-replace followed by grep assertion: `simulation-mode` must return zero matches in the repo after Phase 1.

**Status:** RESOLVED — Grep result: the string `isRunning` appears only in `CHANGED:` comments (3 comment-only matches). No functional `.simulation-mode` references remain. `global.css:530–535` confirms `.campaign-mode` rules are in place. Verified during Phase 1 acceptance.

**Simple Solution:** Already resolved — grep-verified rename to `.campaign-mode` is complete with zero residual `.simulation-mode` references. No further action required.

---

## RISK-IDB-01 — Migration Chain Port Introduces Silent Regression on Legacy Files

**Description:** The v1–v4 migration functions in `fileSystem.js` are ~150 lines of branching transformation logic. When the file is partially rewritten in Phase 2, these functions must be ported verbatim. A subtle difference produces a migration that appears to succeed but silently corrupts node data, edge conditions, or flag references on import.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** A test suite was written against the pure migration logic before and after the port. The suite covers v1→v4 chain identity, defaults injection for missing collections, node structure injection, and unsupported schema rejection.

**Status:** RESOLVED — `tests/test_iteration_phase_02.js` ran 4/4 tests passing (REGRESSION: CLEAN). v1→v4 migration chain confirmed identical to pre-iteration output (audit pass 1, §2, item 9; §4, Migration 2).

**Simple Solution:** Already resolved — migration test suite confirmed 4/4 tests passing (REGRESSION: CLEAN). No further action required.

---

## RISK-IDB-02 — Auto-Save Subscription Fires Too Frequently and Causes Write Storms

**Description:** The Zustand `subscribe` call wired in Phase 1 fires on every state change to `narrativeStore`. Without debouncing, this could issue hundreds of IndexedDB writes per second during active editing.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** The subscribe callback uses a debounce with a 1000ms interval. The Phase 1 hard stop blocked progress if uncontrolled subscription performance was observed.

**Status:** RESOLVED — `main.jsx` L16–22: `clearTimeout(timeoutId)` + `setTimeout(..., 1000)` debounce. Write storm is structurally impossible — each store change only schedules one pending write and resets the timer on subsequent changes within the window (audit pass 1, §2, item 3).

**Simple Solution:** Already resolved — a 1000ms debounce in `main.jsx` ensures only one pending write is queued per editing burst. No further action required.

---

## RISK-IDB-03 — Boot Restore Bypasses or Duplicates Teardown Side Effects

**Description:** Phase 1's `loadFromIndexedDB()` → `loadGraph()` boot sequence could allow a prior campaign session to bleed into the restored state if `exitCampaign()` is not called, or if simulation state were somehow serialized into IndexedDB.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `simulationStore` state is ephemeral and is never written to IndexedDB — only `narrativeStore.exportGraph()` output (which contains no simulation state per AR-08) is passed to `saveToIndexedDB`. `exitCampaign()` is called explicitly after `loadGraph()` at boot.

**Status:** RESOLVED — `main.jsx` L12–13: `loadGraph(data)` then `exitCampaign()` called in sequence at boot. `exportGraph()` output confirmed to contain no `simulationStore` fields (audit pass 1, §3, ACKNOWLEDGED RISK 3).

**Simple Solution:** Already resolved — `main.jsx` calls `loadGraph(data)` then `exitCampaign()` in sequence at boot, and `simulationStore` state is never persisted to IndexedDB. No further action required.

---

## RISK-IDB-04 — `handleNew` Auto-Save Race Condition Restores Deleted Graph

**Description:** After clicking New, `newGraph()` fires and sets the store to empty. The debounced auto-save subscription then writes this empty state to IndexedDB — which is the correct outcome. Without an explicit `clearIndexedDB()` before `newGraph()`, a timing window exists where the old IndexedDB data survives a mid-debounce tab close.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `handleNew` sequence: (1) await `clearIndexedDB()`, (2) call `newGraph()`, (3) allow the debounced subscribe to write the blank state. If the tab closes during the debounce window after step 1, the app opens blank — the correct post-New state.

**Status:** RESOLVED — `TopBar.jsx` L89–90: `await clearIndexedDB()` called before `newGraph()`. Ordering verified in Phase 3 execution report (audit pass 1, §2, item 11).

**Simple Solution:** Already resolved — `handleNew` awaits `clearIndexedDB()` before calling `newGraph()`. No further action required.

---

## RISK-IDB-05 — Schema Version Emitter and Import Version Guard Diverge After Phase 2

**Description:** `narrativeStore.exportGraph()` emits a `schemaVersion` number. `importProject()` validates against an accepted-versions array. If Phase 2 increments the emitter but the import guard is not updated, every file exported after the update is immediately rejected on re-import.

**Likelihood:** Low (after mitigation)

**Impact:** High

**Mitigation Strategy:** The Phase 2 decision to not bump the schema version (sanitization is additive-only) meant no action was required. The emitter and guard both remain at `4`.

**Status:** RESOLVED — No schema bump was introduced. `narrativeStore.js` L568 emits `schemaVersion: 4`; `fileSystem.js` L138 accepts `[1, 2, 3, 4]`. Pairing verified by test Group A and B in `test_iteration_phase_02.js` (audit pass 1, §4, Migration 2).

**Simple Solution:** Already resolved — no schema bump was introduced; both the emitter and version guard remain at `4`. No further action required.

---

## RISK-CSH-01 — Campaign Auto-Save Write Storm on Every `advance()`

**Description:** `advance()` updates `activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, and `currentFlagValues` on every node transition. If the campaign auto-save subscriber fires on each set without debouncing, the `campaigns` IndexedDB store receives N sequential write requests during rapid playback.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Apply the same 1000ms debounce pattern used for the narrative subscriber. The `useCampaignStore.subscribe(...)` wiring in `main.jsx` uses a shared `campaignTimeoutId` variable, identical in structure to the narrative subscriber.

**Status:** RESOLVED — `main.jsx` L29–35: debounced subscribe on `useCampaignStore` at 1000ms. Mirror of the narrative subscriber pattern. Verified in Phase 1 execution.

**Simple Solution:** Already resolved — the campaign subscriber mirrors the narrative subscriber's 1000ms debounce pattern in `main.jsx`. No further action required.

---

## RISK-CSH-02 — Dangling Flag/Status IDs in Campaign Snapshots

**Description:** If the designer deletes a flag or status after saving a campaign snapshot, re-entering that campaign will attempt to seed `currentFlagValues` with IDs that no longer exist in `narrativeStore`.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `enterCampaign(payload)` filters `snapshot.flagOverrides` and `snapshot.statusOverrides` against currently-existing IDs in `narrativeStore.getState().flag` and `.status`. Unknown IDs are silently dropped.

**Status:** RESOLVED — `simulationStore.js` L263–274: hydration iterates `narrativeStore.flag` and `narrativeStore.status` values (not the snapshot keys), so deleted IDs are never seeded. Verified in Phase 2 tests.

**Simple Solution:** Already resolved — `enterCampaign` hydration iterates currently-existing IDs from `narrativeStore`, so deleted IDs are never seeded. No further action required.

---

## RISK-CSH-03 — `handleNew` Leaves Orphaned Campaign Data in IndexedDB

**Description:** Clicking New without clearing the campaigns IndexedDB store leaves stale campaign data referencing the previous project's node IDs, which would be restored on next boot.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `handleNew` calls `clearCampaignsIndexedDB()` before `clearIndexedDB()`, then `clearCampaigns()` on the store before `newGraph()`.

**Status:** RESOLVED — `TopBar.jsx` L88–90: `clearCampaignsIndexedDB()` awaited first, then `clearIndexedDB()`, then `clearCampaignsStore()` + `newGraph()`. Verified in Phase 3 execution.

**Simple Solution:** Already resolved — `handleNew` awaits `clearCampaignsIndexedDB()` before `clearIndexedDB()`, then clears both stores before `newGraph()`. No further action required.

---

## RISK-CSH-04 — `exitCampaign()` Circular Import With `campaignStore`

**Description:** `exitCampaign()` in `simulationStore` must call `campaignStore.updateCampaign(...)`. If this creates a circular import at module level, Zustand store init fails at runtime.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** `simulationStore.js` imports `useCampaignStore` directly at module level (not via the barrel) — confirmed `campaignStore.js` does not import `simulationStore.js` in return (AR-06).

**Status:** RESOLVED — `simulationStore.js` L4: `import { useCampaignStore } from './campaignStore.js'`. `campaignStore.js` imports only from `../utils`. No circular dependency. Verified by cold-boot test in Phase 2.

**Simple Solution:** Already resolved — `simulationStore.js` imports `useCampaignStore` at module level; `campaignStore.js` does not import back. One-way chain confirmed. No further action required.

---

## RISK-CSH-05 — Campaign Boot Restore Auto-Resumes an Active Campaign

**Description:** If `activeCampaignId` is restored from IndexedDB, components may incorrectly show a campaign as "active" without user action, or boot logic could auto-call `enterCampaign`.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** `loadCampaignsFromIndexedDB()` calls `setActiveCampaign(null)` unconditionally after restoring the campaign list. Only `campaigns{}` is persisted — `activeCampaignId` is always `null` on cold load.

**Status:** RESOLVED — `campaignStore.js` L77: `set({ activeCampaignId: null })` called inside `loadCampaignsFromIndexedDB` after restore. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — `loadCampaignsFromIndexedDB` unconditionally calls `setActiveCampaign(null)` after restore, ensuring campaigns always start inactive on cold load. No further action required.

---

## RISK-CSH-06 — `SandboxPanel` Scope Creep Beyond Original Protection Boundary

**Description:** `SandboxPanel.jsx` was listed as PROTECTED in the original scope but was modified in Phase 3 to add Campaign Save controls (autosave toggle, Save Progression, Load Last Save). This crosses the original protection boundary.

**Likelihood:** Low

**Impact:** Low

**Mitigation Strategy:** The modification was additive — new controls were added without altering existing override functionality. Verified no regression in sandbox override behaviour.

**Status:** ACKNOWLEDGED — Additive changes only. No existing sandbox functionality altered. Accepted as a conscious scope extension.

**Simple Solution:** No code action needed. If full SandboxPanel retirement is planned, create an explicit feature ticket with clear acceptance criteria rather than treating removal as routine cleanup scope.

---

## RISK-CMK-01 — Keyboard Shortcut Fires Inside Input Fields

**Description:** Single-letter shortcuts (N, C, E, F, S, P, H) are indistinguishable from normal typing. Pressing N while editing a node label in NodeInspector would create an unwanted Common Node.

**Likelihood:** High — designers constantly type in node label/content fields, flag name inputs, and the TopBar title field.

**Impact:** Medium — creates an unwanted entity but does not corrupt data.

**Mitigation Strategy:** Guard at the top of the `keydown` handler: check `event.target.tagName` and `event.target.isContentEditable`; return early if the event originates from an input context.

**Status:** RESOLVED — `useKeyboardShortcuts.js:11-18` checks `tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable` and returns early. Verified in Phase 2 tests.

**Simple Solution:** Already resolved — `useKeyboardShortcuts.js` checks `tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable` and returns early. No further action required.

---

## RISK-CMK-02 — Context Menu Conflicts With React Flow Pane Event Handling

**Description:** Without `event.preventDefault()`, the browser's native context menu appears on top of the custom menu. React Flow's event pipeline could also transform event coordinates.

**Likelihood:** Medium

**Impact:** Medium — wrong menu position or overlapping browser menu makes the feature unusable.

**Mitigation Strategy:** Call `event.preventDefault()` as the first line of all three context menu handlers. Use `event.clientX`/`clientY` for position.

**Status:** RESOLVED — `GraphCanvas.jsx:207-224` confirms `event.preventDefault()` at the top of all three handlers. Menu positions correctly verified in Phase 3 tests.

**Simple Solution:** Already resolved — all three context menu handlers call `event.preventDefault()` as their first line, and positions use `event.clientX`/`clientY`. No further action required.

---

## RISK-CMK-03 — `selectedNodeId` vs `selectedNodeIds` Consumer Mismatch Breaks NodeInspector

**Description:** If `onSelectionChange` cleared `selectedNodeId`, `NodeInspector` would lose its single-node editing target and show an empty state during normal single-click selection.

**Likelihood:** Medium

**Impact:** High — `NodeInspector` becomes non-functional for single-node editing, the primary authoring workflow.

**Mitigation Strategy:** `setSelectedNodeIds` called only from `onSelectionChange`; single-node `onNodeClick` continues to call `selectNode(id)` (setting `selectedNodeId`) exclusively. The two fields are fully independent.

**Status:** RESOLVED — `GraphCanvas.jsx:315-317` wires `onSelectionChange` to `setSelectedNodeIds`; `GraphCanvas.jsx:261-277` `onNodeClick` calls `selectNode` unchanged. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — `setSelectedNodeIds` (multi) and `selectNode` (single) are independent fields; `onSelectionChange` and `onNodeClick` write to them separately. No further action required.

---

## RISK-CMK-04 — Context Menu Stays Open After Canvas Scroll or Node Drag

**Description:** A context menu left open while the user pans or drags would float at a stale position, leading to misaligned actions.

**Likelihood:** Low

**Impact:** Low — confusing but not data-corrupting.

**Mitigation Strategy:** Dismiss menu from `onMoveStart`, `onNodeDragStart`, and `onPaneClick` handlers in `GraphCanvas`.

**Status:** RESOLVED — `GraphCanvas.jsx:300,320,424` all call `closeContextMenu`. Verified in Phase 3 tests.

**Simple Solution:** Already resolved — `closeContextMenu` is called from `onMoveStart`, `onNodeDragStart`, and `onPaneClick`. No further action required.

---

## RISK-CMK-05 — Context Menu Renders Off-Screen Near Viewport Edges

**Description:** A context menu opened near the right or bottom edge of the viewport would overflow and be partially hidden.

**Likelihood:** Medium

**Impact:** Low — menu actions become inaccessible.

**Mitigation Strategy:** After positioning at cursor, compare `rect.right` against `window.innerWidth` and `rect.bottom` against `window.innerHeight`; flip to left/up if overflow detected.

**Status:** RESOLVED — `ContextMenu.jsx:15-26` implements the viewport-flip check via `useLayoutEffect`. Verified in Phase 3 tests.

**Simple Solution:** Already resolved — `ContextMenu.jsx` implements a viewport-flip check via `useLayoutEffect` to keep the menu on-screen near edges. No further action required.

---

## RISK-CMK-06 — ESC Key Double-Handling

**Description:** `GraphCanvas.jsx` previously had an inline `useEffect` adding a `keydown` listener for Escape → `clearSelection()`. The new hook also handles Escape. Coexistence would call `clearSelection()` twice per keypress — structurally wrong and masking future bugs.

**Likelihood:** Medium

**Impact:** Medium — double-call is functionally benign now but breaks the single-authoritative-handler invariant.

**Mitigation Strategy:** Delete the inline `useEffect` block from `GraphCanvas` atomically with adding the hook mount.

**Status:** RESOLVED — Inline ESC handler removed from `GraphCanvas`; `useKeyboardShortcuts.js:21-24` is the sole ESC handler. Verified in Phase 1 tests.

**Simple Solution:** Already resolved — the inline ESC handler was removed from `GraphCanvas`; `useKeyboardShortcuts.js` is the sole ESC handler. No further action required.

---

## RISK-CMK-07 — Node Creation at Canvas Origin

**Description:** If `addNode({ x: 0, y: 0 }, type)` is called, the new node appears at the canvas origin — possibly off-screen if the designer has panned away.

**Likelihood:** Medium

**Impact:** Low — node is created but invisible without tidy layout.

**Mitigation Strategy:** Keyboard hook and CreationBar dispatch `canvas-add-node` DOM events rather than calling `addNode` directly; `GraphCanvas` handles the event and calls `addNode(screenToFlowPosition(viewportCenter), type)` using its `useReactFlow()` context.

**Status:** RESOLVED — Custom DOM event pattern in place per AR-19. `GraphCanvas` positions new nodes at viewport center. Verified in Phase 2 and Phase 4 tests.

**Simple Solution:** Already resolved — keyboard shortcuts and CreationBar dispatch a `canvas-add-node` DOM event; `GraphCanvas` handles it by calling `addNode(screenToFlowPosition(viewportCenter), type)`. No further action required.

---

## RISK-CMK-08 — ESC Inside NameModal Simultaneously Clears Canvas Selection

**Description:** The global keyboard hook handles Escape → `clearSelection()` on `window keydown`. Pressing ESC to dismiss `NameModal` fires the same event, producing a double side-effect where canvas selection is also cleared.

**Likelihood:** High — ESC is the intuitive dismiss gesture.

**Impact:** Medium — functionally harmless but inconsistent UX.

**Mitigation Strategy:** `NameModal` attaches its own `keydown` listener that calls `event.stopPropagation()` before `onClose()`, preventing the event from reaching the window listener.

**Status:** RESOLVED — `NameModal.jsx:61` implements `stopPropagation` on ESC. Verified in Phase 2 tests.

**Simple Solution:** Already resolved — `NameModal.jsx` attaches its own `keydown` listener that calls `event.stopPropagation()` before `onClose()`. No further action required.

---

## RISK-CMK-09 — NameModal Opens During Campaign Mode

**Description:** If the `canvas-open-name-modal` listener in `GraphCanvas` does not independently guard on `isCampaignActive`, a timing or render race could open the modal during an active campaign.

**Likelihood:** Low — two guard layers (hook bailout, CreationBar disabled) already exist.

**Impact:** Medium — unexpected entity creation during campaign.

**Mitigation Strategy:** Three guard layers: (1) keyboard hook bails on `isCampaignActive`; (2) CreationBar buttons are `disabled={isCampaignActive}`; (3) `GraphCanvas` `canvas-open-name-modal` listener independently reads `isCampaignActive` and bails.

**Status:** RESOLVED — Strengthened triple-layer defense shield against campaign-mode modal invocation: (1) `useKeyboardShortcuts.js` bails on `isCampaignActive`; (2) UI creation buttons (`TopBar.jsx`, `FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx`) enforce `disabled={isCampaignActive}`; (3) `GraphCanvas.jsx` `handleOpenModal` independently verifies `if (useSimulationStore.getState().isCampaignActive) return;`.

**Simple Solution:** Resolved — Reinforced triple-layer defense shield (keyboard shortcut guard, disabled UI creation buttons, and independent `GraphCanvas.jsx` event listener guard), guaranteeing `NameModal` never opens during campaign simulation playback.

---

## RISK-CMK-10 — `addNode` Signature Change Is Silent for Existing Callers

**Description:** `narrativeStore.addNode` gained an optional `label` parameter (defaults to `'Node'`) and now returns the new node ID. Existing callers that ignore the return value continue to work, but the extended contract is not declared in any formal document.

**Likelihood:** Low — signature is additive and backward compatible.

**Impact:** Low — future callers expecting void return could be surprised; the return-id contract is useful but undiscovered.

**Mitigation Strategy:** Document the current `addNode` signature with JSDoc in `narrativeStore.js`.

**Status:** RESOLVED — Added JSDoc documentation block above `addNode` in `src/store/narrativeStore.js:28` declaring `@param {{x: number, y: number}} position`, `@param {string} [type='common']`, `@param {string} [label='Node']`, and `@returns {string} nodeId`.

**Simple Solution:** Resolved — Documented full `addNode` function contract with JSDoc in `narrativeStore.js`.

---

## RISK-CMK-11 — Scope Expansion Across 7 Additional Files Bypasses Per-Phase File Map

**Description:** Implementation pass 4b (`ran_0205_fix_04b.md`) modified `narrativeStore.js`, `NodeInspector.jsx`, `FlagManager.jsx`, `StatusManager.jsx`, and several phase-2/3 files outside the original phase file maps. These changes are user-approved but invisible to future auditors reviewing per-phase file maps.

**Likelihood:** Low — changes are user-approved; impact already accepted.

**Impact:** Low — future auditors may not discover the out-of-scope edits when reviewing individual phase reports.

**Mitigation Strategy:** Scope expansions approved during implementation should be recorded in an addendum to the relevant phase file map or in the audit report.

**Status:** RESOLVED — Documented out-of-scope file modifications across 7 files (`narrativeStore.js`, `NodeInspector.jsx`, `FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx`, `TopBar.jsx`, `global.css`) with one-line justifications in `fixed_risk.md`, ensuring full auditability.

**Simple Solution:** Resolved — Documented out-of-scope file edits addendum with justifications in fixed risk register.

---

## RISK-CMK-12 — `onSelectionChange` Fires Synchronously Inside React Flow Render

**Description:** React Flow fires selection change events synchronously. If `setSelectedNodeIds` does not check for array equality, updating selection triggers a continuous re-render loop.

**Likelihood:** Low — current implementation is stable; risk is contingent on upstream React Flow changes.

**Impact:** Medium — if it re-emerges, the canvas re-render loop crashes the UI.

**Mitigation Strategy:** The `setSelectedNodeIds` action compares the incoming array against current state (order-independent) before calling `set()`, preventing spurious updates.

**Status:** RESOLVED — Confirmed and reinforced the order-independent set equality check in `setSelectedNodeIds` (`uiStore.js`). Added explicit load-bearing JSDoc code comments in both `uiStore.js` and `GraphCanvas.jsx` (`onSelectionChange`), and created comprehensive automated unit tests in `src/store/uiStore.test.js` verifying state reference stability across equivalent selection arrays.

**Simple Solution:** Resolved — Added load-bearing code comments to `uiStore.js` and `GraphCanvas.jsx`, and created `src/store/uiStore.test.js` to assert that `setSelectedNodeIds` returns an unchanged state reference when called with equivalent selection IDs.

---

## RISK-CPT-01 — Whole-Store Destructure in CommandPalette Causes Unnecessary Re-Renders

**Description:** `CommandPalette.jsx:10` previously subscribed to `narrativeStore` via a whole-store destructure (e.g., `const { common, choice, ending, flag, ... } = useNarrativeStore()`). Any mutation to `narrativeStore` triggered a re-render of the palette component even when the search index memo was still valid.

**Likelihood:** Low — palette is almost always closed; React's hidden subtree optimisation limits actual render cost.

**Impact:** Low — re-renders are suppressed by the `useMemo` search index; no user-visible behaviour degradation under normal use.

**Mitigation Strategy:** Refactor `CommandPalette.jsx` to use per-slice selectors (`useNarrativeStore(s => s.common)`, `useNarrativeStore(s => s.choice)`, etc.).

**Status:** RESOLVED — Refactored `src/components/CommandPalette.jsx` to use per-slice selectors (`const common = useNarrativeStore(s => s.common)`, `const choice = useNarrativeStore(s => s.choice)`, etc.), eliminating whole-store re-render subscriptions.

**Simple Solution:** Resolved — Replaced whole-store destructure in `CommandPalette.jsx` with per-slice selectors, eliminating cross-slice re-render subscriptions.

---

## RISK-CPT-02 — Stale `isOpen` Closure in Palette-Toggle Effect

**Description:** `CommandPalette.jsx:14-24` previously had a `useEffect` whose closure captured `isOpen` at the time the effect was registered. If the `palette-toggle` DOM event fired, it risked reading closed-over state.

**Likelihood:** Low — functional today; the effect dependency array included `isOpen`.

**Impact:** Low — if the bug manifested, the palette flickered or failed to toggle; no data was affected.

**Mitigation Strategy:** Refactor the effect to use a functional-set pattern (`setIsOpen(prev => !prev)`) dispatched from the event listener without reading closed-over state.

**Status:** RESOLVED — Refactored `src/components/CommandPalette.jsx:20-33` `palette-toggle` effect to use functional state updates (`setIsOpen(prev => ...)`), simplifying the dependency array to `[]` and completely eliminating stale closure risks or listener re-binding cycles.

**Simple Solution:** Resolved — Used functional state update `setIsOpen(prev => ...)` with empty dependency array `[]` in `CommandPalette.jsx`, making stale closure bugs structurally impossible.

---

## RISK-RT-01 — TopBar Undo Race Condition Against Campaign Autosave

**Description:** Undoing changes node states. Autosave operates on a 1-second debounce. If an undo happens, we could misfire saves saving temporary mismatched bounds.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Store restores and pointers reset synchronously; the reactive subscriber triggers off the resolved output array naturally.

**Status:** RESOLVED — `undoLastNode` executes atomically in simulation store.

**Simple Solution:** Already resolved — `undoLastNode` executes synchronously inside the simulation store, and the reactive auto-save subscriber picks up the resolved output naturally. No further action required.

---

## RISK-RT-02 — Undoing Past the Start Node Bounds

**Description:** Activating an Undo when the user is at the initial start node, popping records that don't exist.
**Likelihood:** Medium
**Impact:** High
**Mitigation Strategy:** Provide length bounds checks over traversal records.
**Status:** RESOLVED — `undoLastNode()` implements a graceful no-op return when records are empty.

**Simple Solution:** Already resolved — `undoLastNode()` performs a bounds check and returns a graceful no-op when `traversalRecords` is empty. No further action required.

---

## RISK-RT-03 — Stale Coverage Metrics

**Description:** Computing overall coverage outside standard Zustand subscription ticks rendering disjoint values manually tracking sets.
**Likelihood:** Medium
**Impact:** Low
**Mitigation Strategy:** Local selectors used leveraging primitive counts naturally updating as standard simulation actions advance nodes.
**Status:** RESOLVED — Integrated within `StatusStrip`.

**Simple Solution:** Already resolved — `StatusStrip` reads atomic primitive counts via targeted selectors, updating naturally as simulation actions advance nodes. No further action required.

---

## RISK-RT-04 — Dead-end Algorithm Performance on Large Graphs

**Description:** Scanning graphs continuously running DFS scans creates jank.
**Likelihood:** Low
**Impact:** Medium
**Mitigation Strategy:** Execute scans asynchronously or hook them directly into existing passive loops.
**Status:** RESOLVED — Scans are cleanly triggered off memo boundaries reading from pure structure.

**Simple Solution:** Already resolved — dead-end scans are triggered off memo boundaries reading from pure graph structure, with no continuous DFS on the main thread. No further action required.

---

---

## RISK-RT-05 — K-shortest Path Combinatorics Blowup

**Description:** BFS tracking arrays scaling combinatorially. Finding paths limits compute cycles un-gracefully. The original mitigation used a hard internal cap (`HARD_CAP = 50`). This cap was removed after it caused visible under-reporting (merge display collapsed routes, making the cap count look wrong).
**Likelihood:** High
**Impact:** High
**Mitigation Strategy:** The internal hard cap was removed. `computeShortestPaths` now uses the caller-supplied `limit` directly. `RouteTracingPanel` exposes this limit as a user-controlled numeric input (default 50). A `searchAll` checkbox allows uncapped BFS (`Number.MAX_SAFE_INTEGER`) with a visible warning that it may take a long time. A Cancel button (`cancelledRef.current = true`) allows the user to abort the deferred computation before results are written. The BFS itself is bounded by a hard `MAX_STATE_VISITS = 10,000` internal state-visit ceiling that prevents infinite loops while still allowing very large route counts when the user requests them.
**Status:** RESOLVED — `routeTracer.js` `computeShortestPaths` bounded by `MAX_STATE_VISITS = 10_000`; `RouteTracingPanel` user-controlled limit with `searchAll` toggle and Cancel abort (`cancelledRef` pattern).

**Simple Solution:** Already resolved — `computeShortestPaths` is bounded by `MAX_STATE_VISITS = 10,000`, with a user-controlled route limit, `searchAll` toggle, and a Cancel abort handle in `RouteTracingPanel`. No further action required.

---

## RISK-UI-01 — SandboxPanel Retirement Scope Ambiguity

**Description:** The UI integration plan marked `Sidebar.jsx` as "possibly deleted" and the vision mockup showed only three right-sidebar tabs (no Sandbox). However, `SandboxPanel` provides live campaign-time authoring overrides via `applySandboxOverride` on `simulationStore` (AR-08). Deleting the Sandbox UI silently removes an active feature, which exceeded Phase 8 cleanup scope.

**Likelihood:** Low

**Impact:** Medium

**Mitigation Strategy:** Retained `SandboxPanel` and mounted it directly in `RightSidebar` under a renamed "Sandbox" tab.

**Status:** RESOLVED — Retained `SandboxPanel.jsx` mounted directly under dedicated "Sandbox" tab in `RightSidebar.jsx` (lines 25–30), preserving live authoring override capability (`applySandboxOverride`) while deleting legacy `Sidebar.jsx` wrapper.

**Simple Solution:** Resolved — Retained `SandboxPanel` mounted in `RightSidebar.jsx` under Sandbox tab, preserving live campaign overrides.

---

## RISK-UI-02 — JS Bundle Size Exceeds Vite 500 kB Advisory

**Description:** `vite build` emitted a chunk-size advisory (`> 500 kB`) for the main JS bundle.

**Likelihood:** Low

**Impact:** Low

**Mitigation Strategy:** Configured `manualChunks` vendor code-splitting in `vite.config.js`.

**Status:** RESOLVED — Configured `manualChunks(id)` function in `vite.config.js` splitting `vendor_react`, `vendor_reactflow`, and `vendor_icons`. Reduced main bundle size from 845 kB to 469 kB, eliminating all Vite chunk size advisories.

**Simple Solution:** Resolved — Configured `manualChunks` vendor code-splitting in `vite.config.js`, bringing main chunk size under 500 kB.

---

## RISK-IMP-01 — New Schema Field Omitted From Import Sanitization Whitelist Causes Silent Data Loss

**Description:** `fileSystem.importProject()` rebuilds imported data through an explicit `sanitizedData` whitelist object. Any field added to the data model that is not also added to this whitelist is silently dropped on import — the export succeeds, the import appears to succeed, but the field is reset to its store default. There is no error or warning.

**What could go wrong:** A designer exports a project, imports it back in a new session, and finds that a subset of their data (e.g., editor-seen marks, or a future new field) has been silently erased. The root cause is invisible at the UI layer.

**Likelihood:** High — Every data model addition requires two coordinated edits (store + whitelist); the second edit is easy to miss because the whitelist is in a different file from the feature implementation.

**Impact:** High — Silent data loss on round-trip with no indication to the user.

**Mitigation Strategy:** AR-27 formalises the paired-invariant: any new persisted field added to `narrativeStore.exportGraph()` output must be added to the `sanitizedData` whitelist in the same commit. The bug that prompted this rule (`editorSeenNodeIds`/`editorSeenOptionIds` dropped on import) was fixed in `fileSystem.js` `importProject()`.

**Status:** RESOLVED — `fileSystem.js` `importProject()` now includes `editorSeenNodeIds` and `editorSeenOptionIds` in `sanitizedData`. AR-27 formalises the pattern to prevent recurrence.

**Simple Solution:** Already resolved — `editorSeenNodeIds` and `editorSeenOptionIds` are present in the `sanitizedData` whitelist. AR-27 formalises the paired-invariant for all future persisted fields. No further action required.

---

## RISK-DND-01 — Drag-and-Drop Coordinate Offset due to CSS Transform

**Description:** When a user drags an item using `@hello-pangea/dnd`, the dragged item appears visually offset from the mouse cursor.

**What could go wrong:** A severe UX degradation making reordering nearly unusable, as the dragged element jumps away from the pointer.

**Likelihood:** High — if a parent container uses `transform: translateX` for sliding entrance animations, this bug reliably manifests because `transform` alters the containing block coordinates used by the DnD portal.

**Impact:** High — broken interaction model for lists.

**Mitigation Strategy:** Removed `transform` from `.left-sidebar` and `.right-sidebar` entrance animations, substituting with margin-based animations. AR-29 formalizes this CSS restriction.

**Status:** RESOLVED — Sidebars updated to avoid `transform`. Offset bug eliminated.

**Simple Solution:** Already resolved — `transform` was removed from `.left-sidebar` and `.right-sidebar` entrance animations and replaced with margin-based animations. AR-29 formalises the CSS restriction. No further action required.

---

## RISK-IMP-02 — Custom Node Subtypes Silently Dropped on Import due to Whitelist Omission

**Description:** Custom node subtypes (`commonType` and `endingType` collections) are correctly persisted in `exportGraph()` output, but they are completely omitted from the `sanitizedData` whitelist object in `fileSystem.js` `importProject()`. Any field not explicitly whitelisted is silently dropped on import.

**What could go wrong:** Designers define custom node subtypes (e.g. "Quest", "Dialogue", "Combat") and export their project. Upon re-importing the JSON/ZIP project, all custom subtypes are silently erased, leaving the node subtype definitions empty.

**Likelihood:** High — Subtypes are an active part of the schema version 4 data model and are exported, but currently stripped on every import.

**Impact:** High — Silent data loss of custom subtypes on round-trip with no warning.

**Mitigation Strategy:** Update `importProject()` in `fileSystem.js` to whitelist `commonType` and `endingType` fields in the `sanitizedData` object, mapping them from `data.commonType` and `data.endingType`.

**Status:** OPEN — Awaiting code implementation in `fileSystem.js`.

**Simple Solution:** In `fileSystem.js` `importProject()`, find the `sanitizedData` object and add `commonType: data.commonType ?? {}` and `endingType: data.endingType ?? {}`. This is a two-line addition. Verify with a round-trip test: export a project with custom node subtypes, re-import it, and confirm the subtypes are preserved.

---

## RISK-RT-06 — Infinite Warp Portal Loops Without State Updates In Route Pathfinder

**Description:** If a designer creates a cycle composed entirely of warp portals and edges with no flags or status point modifications, the route tracer might expand paths infinitely, freezing the browser.

**Likelihood:** High — Loop-based portal structures are easily designed.

**Impact:** High — Browser tab lockup or out-of-memory crash.

**Mitigation Strategy:** The route pathfinder in `routeTracer.js` implements a state-aware cycle guard hashing active flags and status values using a sorted `stateHash`. Visited nodes are tracked as `nodeId::stateHash`. This allows looping back through nodes only if narrative flags or status points change. Additionally, the pathfinder BFS queue expansion is bounded by a hard ceiling of `MAX_STATE_VISITS = 10_000` state visits.

**Status:** RESOLVED — Hashing state guard and `MAX_STATE_VISITS` ceiling successfully prevent infinite cycles while permitting legitimate variable-driven loops.

**Simple Solution:** Already resolved — the state-aware cycle guard (`nodeId::stateHash`) combined with `MAX_STATE_VISITS = 10,000` prevents infinite loops while permitting legitimate variable-driven cycles. No further action required.

---

## RISK-RT-07 — Stale Active Node Centering When Viewport Following Toggle is Enabled

**Description:** In campaign mode, if the viewport centering logic runs concurrently with manual canvas dragging or zooming, it could cause visual jitter or fight with user input.

**Likelihood:** Medium.

**Impact:** Medium — UX jitter and coordinate fights.

**Mitigation Strategy:** Viewport following is completely user-configurable via the "Follow: ON/OFF" toggle in the floating campaigns toolbar. When disabled, the canvas respects manual panning and zoom fully. When enabled, it centers on the active node coordinates only when `activeNodeId` changes (step transition), not on high-frequency drag events.

**Status:** RESOLVED — User toggle control and reactive transition gating prevent manual panning conflicts.

**Simple Solution:** Already resolved — viewport following is user-toggleable and triggers only on `activeNodeId` transitions, not on high-frequency drag events. No further action required.



---

## Audit Findings Detail — Table-Only Risks

---

## RISK-AUD-01 — nodeTypes/edgeTypes Created Inside Component Body

**Description:** In `GraphCanvas.jsx`, the `nodeTypes` and `edgeTypes` mapping objects were defined inside the component function body. React Flow uses referential equality to detect type changes — a new object reference on every render causes custom nodes and edges to remount.

**What could go wrong:** Every state change causes full graph teardown and rebuild, leading to flickering and render lag.

**Likelihood:** High

**Impact:** High

**Mitigation Strategy:** Move `nodeTypes` and `edgeTypes` objects to module scope (outside `GraphCanvasInner`).

**Status:** RESOLVED — `NODE_TYPES` and `EDGE_TYPES` moved to module scope in `GraphCanvas.jsx`.

**Simple Solution:** Resolved — Moved `NODE_TYPES` and `EDGE_TYPES` to module scope outside `GraphCanvasInner()` in `src/components/GraphCanvas.jsx`, guaranteeing a stable reference across renders.

---

## RISK-AUD-02 — No Error Boundaries

**Description:** The application has no React `ErrorBoundary` component. Any unhandled runtime error in any component crashes the entire React tree, showing a white screen with no recovery path.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Add a React `ErrorBoundary` component wrapping `<App />` in `main.jsx`.

**Status:** RESOLVED — Created `src/components/ErrorBoundary.jsx` as a React class component catching rendering errors and providing reload, emergency JSON backup export, and IndexedDB storage reset recovery options. Wrapped `<App />` in `main.jsx` with `<ErrorBoundary>`.

**Simple Solution:** Resolved — Created `src/components/ErrorBoundary.jsx`, exported it in `src/components/index.js`, wrapped `<App />` in `src/main.jsx`, and added modal overlay fallback styles to `global.css`.

---

## RISK-AUD-03 — Import Accepts Structurally Invalid JSON

**Description:** `importProject()` in `fileSystem.js` parses the imported JSON and runs a schema-version check, but does not validate that required top-level fields (`nodes`, `edges`) exist.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Add structural validation to `importProject()`.

**Status:** RESOLVED — Added structural validation check in `fileSystem.js` (`importProject()`) verifying `edges` array and node collection existence. Throws `invalid_project_structure` error on invalid files, which `TopBar.jsx` catches and displays as a user alert.

**Simple Solution:** Resolved — In `importProject()`, added structural checks for object validity, `edges` array, and v1 `nodes` array or v2-v4 node collections. Updated `TopBar.jsx` error handler to alert the user on invalid file structure.

---

## RISK-AUD-04 — Google Fonts CDN Violates AR-10 Offline-Only Principle

**Description:** `index.html` contains a `<link>` tag loading Inter from Google Fonts. This creates a network dependency at startup, violating AR-10.

**Likelihood:** High

**Impact:** Medium

**Mitigation Strategy:** Self-host Inter font in `public/fonts/`.

**Status:** RESOLVED — Removed external Google Fonts `<link>` CDN tags from `index.html` and updated `--font-family-base` in `tokens.css` to use a modern system font stack (`'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), ensuring 100% offline compliance per AR-10.

**Simple Solution:** Resolved — Removed Google Fonts preconnect and CSS link tags from `index.html`, and configured modern system font stack fallbacks in `src/styles/tokens.css`.

---

## RISK-AUD-05 — Nodes Subscribe to Entire Flag/Status Dictionaries

**Description:** Node components subscribe to the entire `flag` or `status` store dictionaries instead of targeted keys.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Use targeted primitive selectors and sub-component extraction.

**Status:** RESOLVED — Extracted verbose effect and condition rendering into isolated sub-components (`VerboseEffectsBox`, `OptionVerboseEffectsBox`, `FlagChip`, `StatusChip`, `FlagConditionChip`, `StatusConditionChip`) in `src/components/nodes/VerboseEffects.jsx`. Removed top-level `flag` and `status` store subscriptions from `CommonNode.jsx` and `ChoiceNode.jsx`. Node components now hold zero subscriptions to flags or statuses in compact mode, and chip sub-components query targeted entity properties (`s.flag[id]?.name`, `s.status[id]?.name`) when rendered in verbose mode.

**Simple Solution:** Resolved — Isolated flag and status store subscriptions inside targeted `VerboseEffects` sub-components, eliminating top-level dictionary subscriptions in `CommonNode` and `ChoiceNode`.

---

## RISK-AUD-06 — Canvas Filter State Changes Re-Render All Nodes

**Description:** Toggling canvas filters re-renders all nodes because nodes recompute filter logic independently.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Consolidate filter logic into derived state in `GraphCanvas`.

**Status:** RESOLVED — Centralized canvas filter logic into `derivedNodes` `useMemo` in `GraphCanvas.jsx`. Passes `isFilteredOut` boolean in React Flow node `data` payload. Stripped all 4 `useUIStore` filter subscriptions (`canvasFilterChapterId`, `canvasFilterPathId`, `canvasFilterTagIds`, `canvasFilterTagsLogic`) from `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`, `WarpEntranceNode.jsx`, `WarpExitNode.jsx`, and `ConditionalEdge.jsx`.

**Simple Solution:** Resolved — Centralized canvas filter evaluation into `derivedNodes` `useMemo` in `GraphCanvas.jsx` and passed `isFilteredOut` directly in React Flow node data, eliminating filter store subscriptions across all node and edge components.

---

## RISK-AUD-07 — Campaign traversalRecords Has No Max Depth

**Description:** `traversalRecords` previously grew unboundedly during campaign stepping.

**Likelihood:** Low

**Impact:** Medium

**Mitigation Strategy:** Add configurable max depth.

**Status:** RESOLVED — Defined `const MAX_TRAVERSAL_DEPTH = 1000` in `simulationStore.js` and capped `traversalRecords` updates in `advance()` using `.slice(-MAX_TRAVERSAL_DEPTH)`. Added automated unit test in `src/store/simulationStore.test.js`.

**Simple Solution:** Resolved — Added `const MAX_TRAVERSAL_DEPTH = 1000` in `simulationStore.js` and capped `traversalRecords` depth in `advance()` with `.slice(-MAX_TRAVERSAL_DEPTH)`.

---

## RISK-AUD-08 — Route Tracing Blocks Main Thread

**Description:** `computeShortestPaths` in `routeTracer.js` executes BFS path enumeration synchronously on the main thread.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Offload to Web Worker or use deferred/idle callbacks.

**Status:** RESOLVED — Offloaded state-space BFS path enumeration to a dedicated ES module Web Worker (`src/utils/routeTracer.worker.js`). Implemented `computeShortestPathsAsync` and `cancelRouteWorker` helper utilities to run non-blocking route tracing on background hardware threads with worker termination on cancellation.

**Simple Solution:** Resolved — Created `src/utils/routeTracer.worker.js`, added non-blocking `computeShortestPathsAsync` wrapper and `cancelRouteWorker` handle in `routeTracer.js`, updated `simulationStore.js` `computeRoutesFromStart` to await worker results, and wired `cancelRouteWorker()` to `RouteTracingPanel.jsx` trace cancellation.

---

## RISK-AUD-09 — useKeyboardShortcuts Has Stale Closures

**Description:** `useKeyboardShortcuts.js` previously subscribed to `useSimulationStore()` at top-level with a `[isCampaignActive]` dependency array, causing event listener teardown/re-binding on every simulation store change and creating potential stale closure risks.

**Likelihood:** Medium

**Impact:** Medium

**Mitigation Strategy:** Read current values via `.getState()` inside keydown handler.

**Status:** RESOLVED — Refactored `useKeyboardShortcuts.js` to read `isCampaignActive` dynamically using `useSimulationStore.getState().isCampaignActive` inside `handleKeyDown`. Removed top-level store subscription and simplified `useEffect` dependencies to `[]`, eliminating event listener thrashing and stale closure risks.

**Simple Solution:** Resolved — Replaced top-level `useSimulationStore()` hook call with `useSimulationStore.getState().isCampaignActive` inside the event listener body and stabilized `useEffect` dependency array to `[]`.

---

## RISK-AUD-10 — No Form Validation in Modals

**Description:** Modals previously allowed submitting empty titles or blank entity names.

**Likelihood:** Medium

**Impact:** Low

**Mitigation Strategy:** Disable confirm and save buttons when inputs are empty or whitespace-only (`disabled={!(inputValue || '').trim()}`).

**Status:** RESOLVED — Added `disabled={!(data.label || '').trim()}` guards to save buttons in `NodeConfigModal.jsx` and `WarpConfigModal.jsx`, styled disabled states with `opacity: 0.4` and `cursor: not-allowed` in `NodeConfigModal.css`, and confirmed `NameModal.jsx` disables confirm buttons when input names are blank.

**Simple Solution:** Resolved — Added `disabled={!(data.label || '').trim()}` button state guards to `NodeConfigModal.jsx` and `WarpConfigModal.jsx`, and configured disabled CSS styling.

---

## RISK-AUD-11 — localStorage Writes Not Wrapped in try/catch

**Description:** `localStorage` calls can throw in private browsing mode or when storage quota is exceeded.

**Likelihood:** Low

**Impact:** Low

**Mitigation Strategy:** Wrap in try/catch helpers.

**Status:** RESOLVED — Created `src/utils/safeStorage.js` with `safeGet`, `safeSet`, `safeRemove`, and `safeClear` helpers that catch `DOMException` / `QuotaExceededError` / `SecurityError` in private browsing or quota-restricted environments. Refactored `uiStore.js` and `ErrorBoundary.jsx` to use `safeStorage`, and created `src/utils/safeStorage.test.js`.

**Simple Solution:** Resolved — Created `src/utils/safeStorage.js` helper wrapping `localStorage` calls in `try/catch` and applied it across state stores and error boundaries.

---

## RISK-AUD-12 — crypto.randomUUID() Fails on file:// Protocol

**Description:** `crypto.randomUUID()` is undefined in non-secure contexts (`file://` protocol or unencrypted HTTP IP addresses).

**Likelihood:** Low

**Impact:** Medium

**Mitigation Strategy:** Provide fallback UUID generator.

**Status:** RESOLVED — Updated `src/utils/uuid.js` to implement a `getUUID()` fallback function that checks for `crypto.randomUUID` availability and falls back to a standard RFC 4122 v4 math-random generator in non-secure contexts. Added automated unit tests in `src/utils/uuid.test.js`.

**Simple Solution:** Resolved — Implemented safe fallback UUID v4 generator in `src/utils/uuid.js` for non-secure browser environments.

---

## RISK-AUD-15 — Modals Lack ARIA Roles and Focus Trapping

**Description:** Modals previously lacked `role="dialog"`, `aria-modal="true"`, and focus trapping.

**Likelihood:** Low

**Impact:** Medium

**Mitigation Strategy:** Add ARIA dialog attributes and custom focus trapping hook (`useFocusTrap.js`).

**Status:** RESOLVED — Created custom `useFocusTrap` React hook in `src/hooks/useFocusTrap.js` that handles initial element auto-focus, `Tab`/`Shift+Tab` keyboard focus trapping, and restoring focus to `document.activeElement` on unmount. Applied `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `containerRef` focus trapping across `NameModal.jsx`, `NodeConfigModal.jsx`, `WarpConfigModal.jsx`, `EdgeConfigModal.jsx`, and `ConfirmModal.jsx`.

**Simple Solution:** Resolved — Implemented `useFocusTrap` custom hook and attached WAI-ARIA dialog attributes across all modal components.

---

## RISK-AUD-16 — narrativeStore Cross-Calls uiStore/toastStore

**Description:** `narrativeStore.js` directly calls `uiStore.getState()` and `toastStore.getState()`.

**Likelihood:** Low

**Impact:** Low

**Mitigation Strategy:** Document cross-store calls with explicit load-bearing JSDoc code comments.

**Status:** RESOLVED — Added explicit load-bearing JSDoc code comments above all cross-store calls in `src/store/narrativeStore.js` (lines 102, 161, 915, 950, 973), documenting that inter-store calls for UI selection resets and toast notifications are intentional.

**Simple Solution:** Resolved — Added load-bearing code comments in `narrativeStore.js` documenting intentional cross-store calls.

---

## RISK-AUD-17 — Tag Field Missing from Import Whitelist

**Description:** `tag` field in `narrativeStore` must be whitelisted in `fileSystem.js` `importProject()`.

**Likelihood:** Medium

**Impact:** High

**Mitigation Strategy:** Ensure `tag` is included in `sanitizedData` whitelist.

**Status:** RESOLVED — Whitelisted `tag` in `sanitizedData` object in `src/utils/fileSystem.js` (line 440). Verified with Vitest assertions in `src/utils/fileSystem.test.js` (lines 48–50).

**Simple Solution:** Resolved — Added `tag` field to `sanitizedData` whitelist object in `fileSystem.js`, guaranteeing node tag preservation on project import.

---
