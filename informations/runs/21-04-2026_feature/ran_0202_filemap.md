# File Map — Route_Tracing

---

## Legend
- **Phase** — which phase first touches this file (subsequent phases may also touch it)
- **Status** — EXISTING or NEW
- **Must NOT change** — constraints on the file during this feature

---

## `src/store/simulationStore.js`
- **Status:** EXISTING
- **Phases:** 1, 3, 4
- **What changes:**
  - Phase 1: Add `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to initial state. Extend `selectOption()` to write `preAdvanceFlagSnapshot` before applying option side effects. Extend `advance()` to append a `TraversalRecord` using `preAdvanceFlagSnapshot || { ...state.currentFlagValues }`, then clear `preAdvanceFlagSnapshot`. Extend `exitCampaign()`, `reset()`, `enterCampaign()` to zero `traversalRecords` and `preAdvanceFlagSnapshot`. Add `undoLastNode()` action.
  - Phase 3: Add `unreachableFromActiveNodeIds: []` to state. Extend `advance()` to call `routeTracer.computeForwardReachable()` and write result. Extend `exitCampaign()`, `reset()`, `enterCampaign()` to zero `unreachableFromActiveNodeIds`.
  - Phase 4: Add `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false` to state. Add `computeRoutes()`, `clearRouteResults()`, `setShortestRouteStale()` actions. `undoLastNode()` amended to also call `setShortestRouteStale()` if results exist.
- **Must NOT change:** `advance()` signature. `exitCampaign()`, `reset()`, `enterCampaign()` signatures. `snapshotCampaign()` output shape. `computeReachable()`, `computeNodeStates()`, `applyFlagsSet()`, `applyStatusSet()`, `computePassiveAnalysis()` internal functions. AR-08: no new fields may be written to `narrativeStore` or persisted to IndexedDB.

---

## `src/store/uiStore.js`
- **Status:** EXISTING
- **Phase:** 1
- **What changes:** Add `showTraversalOverlay: true`, `showRouteFinderDialog: false`, `showShortestRouteOverlay: false` to state. Add `toggleTraversalOverlay()`, `toggleRouteFinderDialog()`, `toggleShortestRouteOverlay()` actions. Phase 4 adds `selectedRouteIndex: 0` and `setSelectedRouteIndex(n)` action.
- **Must NOT change:** All existing state fields (`selectedNodeId`, `selectedEdgeId`, `selectedNodeIds`, `snapToGrid`, `choiceDisplayMode`, `labelDisplayMode`, `clusterMode`) and their actions. `setSelectedNodeIds` equality-check logic (RISK-CMK-12 mitigation). `clearSelection`/`resetSelection` must continue to reset `selectedNodeIds`.

---

## `src/components/TopBar.jsx`
- **Status:** EXISTING
- **Phase:** 1
- **What changes:** Add Undo Active Node Button inside the `{isCampaignActive && (...)}` block alongside Reset Simulation / Exit Campaign Mode. Button calls `undoLastNode()` from `simulationStore`. Button is `disabled` when `traversalRecords.length === 0`. Add `traversalRecords` length selector and `undoLastNode` action to the component's store subscriptions using per-slice selectors (AR-23).
- **Must NOT change:** All existing button handlers (`handleExitCampaign`, `handleResetSimulation`, `handleTidyLayout`, `handleNew`, `handleImport`, `handleExport`). Campaign status indicator. `CreationBar` disabled wiring. Cluster mode button. All non-campaign-mode controls.

---

## `src/styles/tokens.css`
- **Status:** EXISTING
- **Phase:** 2
- **What changes:** Add three tokens under the existing campaign-state tokens section: `--color-traversal-overlay` (a distinct warm color for traversed-edge highlight, e.g. `#f97316` orange), `--color-route-overlay` (a distinct cool color for shortest-route edge highlight, e.g. `#22d3ee` cyan), `--opacity-coverage-gap` (e.g. `0.25` — controls how dim unreachable-from-active nodes appear).
- **Must NOT change:** All existing tokens. The INVARIANT comment `DC-07` and the dark-mode-only contract. Existing z-index scale. Existing cluster palette tokens.

---

## `src/styles/global.css`
- **Status:** EXISTING
- **Phases:** 2, 3, 4
- **What changes:**
  - Phase 2: Add `.conditional-edge--traversal-overlay` CSS class (stroke: `--color-traversal-overlay`, stroke-width: 3px). Add `.status-strip` component block (layout, campaign-mode-only visibility). This CSS block must be listed as an explicit file entry in the phase file map per AR-21.
  - Phase 3: Add `.story-node--coverage-gap` CSS class (opacity: `--opacity-coverage-gap`, filter: `grayscale(80%)`; must be placed AFTER the existing simulation state overrides block to avoid specificity conflicts with `--seen`, `--locked`, etc.). This CSS block must be listed explicitly per AR-21.
  - Phase 4: Add `.conditional-edge--route-overlay` CSS class (stroke: `--color-route-overlay`, stroke-width: 3px, stroke-dasharray for visual distinction from traversal overlay). Add `.route-finder-dialog` component block (overlay panel styles). These CSS blocks must be listed explicitly per AR-21.
- **Must NOT change:** All existing simulation state CSS classes and their `!important` declarations. `.campaign-mode` block. `.conditional-edge--traversed` must remain in place (existing behavior preserved). `.story-node--seen` and its `::after` pseudo-element. All existing component blocks (context menu, toast, palette, cluster overlay).

---

## `src/components/edges/ConditionalEdge.jsx`
- **Status:** EXISTING
- **Phases:** 2, 4
- **What changes:**
  - Phase 2: Add `showTraversalOverlay` selector from `uiStore`. Add `isTraversedOverlay` selector: `s.isCampaignActive && showTraversalOverlay && s.traversedEdgeIds.includes(id)` — returns boolean primitive (AR-14). Replace the static `--traversed` class application with conditional: when `isTraversedOverlay` is true apply `--traversal-overlay`; when `isTraversed` is true but overlay is hidden, apply no traversal class (keep inert). This preserves the existing `--condition-pass` logic unchanged.
  - Phase 4: Add `isRouteOverlay` selector: `s.isCampaignActive && showShortestRouteOverlay && routeEdgeIds.has(id)` — where `routeEdgeIds` is a `Set` derived from `shortestRouteResults[selectedRouteIndex].pathEdgeIds` (computed once in component, not passed as a selector). Apply `--route-overlay` class when true. Route overlay takes precedence over traversal overlay in class ordering (last class wins).
- **Must NOT change:** `isConditionPass` selector and `--condition-pass` class. `isTraversed` selector (used for existing `--traversed`). Verbose label display mode rendering. `React.memo` wrapper. `getSmoothStepPath` call and edge geometry. `BaseEdge` + `EdgeLabelRenderer` structure.

---

## `src/components/nodes/CommonNode.jsx`
- **Status:** EXISTING
- **Phase:** 3
- **What changes:** Add `isCoverageGap` selector: `useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id))` — returns boolean primitive (AR-14). Append `story-node--coverage-gap` to `className` when true. This is additive — it sits after the existing `story-node--seen` token in the className string.
- **Must NOT change:** All existing selectors (`nodeState`, `isSeen`, `isOrphaned`, `isUnreachable`). Warning badge render logic. Verbose label display. `React.memo`. The six-state CSS class application pattern.

---

## `src/components/nodes/ChoiceNode.jsx`
- **Status:** EXISTING
- **Phase:** 3
- **What changes:** Same pattern as `CommonNode.jsx` — add `isCoverageGap` boolean selector, append `story-node--coverage-gap` to className.
- **Must NOT change:** Option rendering. `selectOption` click handler. `choiceDisplayMode` rendering. Per-option source handles. All existing selectors. `React.memo`.

---

## `src/components/nodes/EndingNode.jsx`
- **Status:** EXISTING
- **Phase:** 3
- **What changes:** Same pattern — add `isCoverageGap` boolean selector, append `story-node--coverage-gap` to className.
- **Must NOT change:** Footer terminal bar. No source handle (AR-12). All existing selectors. `React.memo`.

---

## `src/App.jsx`
- **Status:** EXISTING
- **Phase:** 2
- **What changes:** Import `StatusStrip` from `components` barrel. Add `<StatusStrip />` as a new `<footer className="app__statusbar">` element after `<aside className="app__sidebar">`. `StatusStrip` renders null when `!isCampaignActive` so it has no visual footprint in edit mode.
- **Must NOT change:** `<Toast />` and `<CommandPalette />` fixed-position overlays (no grid impact). TopBar / GraphCanvas / Sidebar layout. Existing import list for other components.

---

## `src/App.css`
- **Status:** EXISTING
- **Phase:** 2
- **What changes:** Expand `grid-template-rows` from `48px 1fr` to `48px 1fr 28px`. Add `statusbar` to `grid-template-areas` as a full-width bottom row spanning both columns. Add `.app__statusbar` rule (`grid-area: statusbar; background: var(--color-bg-surface); border-top: 1px solid var(--color-border); overflow: hidden`).
- **Must NOT change:** Existing `topbar`, `canvas`, `sidebar` area definitions and their classes. `height: 100vh` and `width: 100vw`. `overflow: hidden` on `.app`.

---

## `src/utils/routeTracer.js`
- **Status:** NEW
- **Phases:** 3 (dead-end + forward BFS), 4 (k-shortest-paths)
- **What changes (Phase 3):** Create file. Export `detectDeadEnds(graphState): string[]` — returns IDs of nodes with no outgoing edges that are not in `graphState.ending`. Export `computeForwardReachable(activeNodeId, graphState): string[]` — returns IDs of all nodes reachable from `activeNodeId` via any forward graph path (ignoring conditions; pure structural BFS).
- **What changes (Phase 4):** Add `computeShortestPaths(startNodeId, targetNodeId, graphState, currentFlagValues, priorities, limit): RouteResult[]` — gate-respecting bounded BFS; calls `evaluateCondition` from `utils` barrel for all gate checks; returns sorted array of `RouteResult` objects capped at `min(limit, HARD_CAP)` where `HARD_CAP = 50`; returns empty array if no paths found within budget.
- **Must NOT change:** AR-07 — no inline condition logic; all gate checks go through `evaluateCondition`/`evaluateClause` from `conditionEvaluator.js` via the `utils` barrel. AR-04 — pure functions only; no Zustand store imports. AR-06 — imports from `utils` barrel, not direct file paths.

---

## `src/components/RouteFinderDialog.jsx`
- **Status:** NEW
- **Phase:** 4
- **What changes:** Create file. Renders a centered fixed overlay (similar to CommandPalette). Three sections:
  1. Target node selector — searchable list of all nodes with chapter/path disambiguation per AR-22 (reuses `resolveNodeContext` pattern from CommandPalette)
  2. Priority list — ordered `{flagOrStatusId, preferredValue}` pairs with add/remove controls; flags show as boolean dropdowns, statuses show as number inputs
  3. Path cap input — number input defaulting to 5, hard ceiling 50 enforced client-side; "Run" button calls `computeRoutes(targetNodeId, priorities, limit)` from `simulationStore`
  4. Results panel — sorted list of computed routes; clicking a route calls `setSelectedRouteIndex(n)` and enables `showShortestRouteOverlay`; stale-result re-run prompt shown when `isShortestRouteStale === true`
- All store reads use per-slice selectors (AR-23). Node list reads from `narrativeStore` per-slice selectors. Open/close toggled via `uiStore.toggleRouteFinderDialog`. ESC attaches own `stopPropagation` listener per RISK-CP-03 precedent. Campaign-mode only — renders null when `!isCampaignActive`.
- **Must NOT change (design constraints):** AR-19 — if target-node selection is implemented via canvas click, must dispatch DOM event; `RouteFinderDialog` must not call `useReactFlow()`. AR-22 — disambiguation context mandatory on node results. AR-23 — no whole-store destructures.

---

## `src/components/StatusStrip.jsx`
- **Status:** NEW
- **Phase:** 2 (basic counts), 3 (dead-end count added)
- **What changes (Phase 2):** Create file. Reads six primitives using per-slice selectors (AR-23): `seenNodeIds.length` (visited node count), `traversedEdgeIds.length` (traversed edge count) from `simulationStore`; `Object.keys(common).length + Object.keys(choice).length + Object.keys(ending).length` (total node count), `Object.keys(ending).length` (total endings), `edges.length` (total edges) from `narrativeStore`. Endings reached computed via `useMemo` from `seenNodeIds` + `ending` dict. Renders three readouts: "Nodes: X / Y", "Endings: X / Y", "Edges: X / Y". Renders null when `!isCampaignActive`. No side effects in render (AR-14). Includes traversal overlay toggle button reading `showTraversalOverlay` / `toggleTraversalOverlay` from `uiStore`.
- **What changes (Phase 3):** Add dead-end count readout sourced from a selector or `useMemo` deriving from `routeTracer.detectDeadEnds()` result stored in `simulationStore`, or computed inline from `graphState`.
- **Must NOT change (design constraints):** AR-14 — selectors must return primitives only. AR-23 — per-slice selectors throughout. No `useState` for coverage data (AR-03).

---

## `src/utils/index.js`
- **Status:** EXISTING
- **Phase:** 3
- **What changes:** Add re-exports for `routeTracer.js`: `export { detectDeadEnds, computeForwardReachable } from './routeTracer.js'`. Phase 4 adds `computeShortestPaths` to this re-export.
- **Must NOT change:** All existing re-exports (`generateId`, `evaluateCondition`, `evaluateClause`, all `fileSystem` exports).

---

## `src/components/index.js`
- **Status:** EXISTING
- **Phase:** 2 (StatusStrip), 4 (RouteFinderDialog)
- **What changes:** Phase 2 adds `export { default as StatusStrip } from './StatusStrip'`. Phase 4 adds `export { default as RouteFinderDialog } from './RouteFinderDialog'`.
- **Must NOT change:** All existing exports. Barrel-only file — no logic, no imports.
