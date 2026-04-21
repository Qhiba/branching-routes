# Integration Points — Route_Tracing

---

## `simulationStore.advance(edgeId)`

**What it currently does:** Validates the edge is reachable; resolves the destination node; applies destination node `flags_set`/`status_set` to `currentFlagValues`; appends the from-node to `seenNodeIds`; appends `edgeId` to `traversedEdgeIds`; recomputes `reachableEdgeIds`, `reachableNodeIds`, `nodeStates`; resets `selectedOptionId` to null.

**How Route_Tracing connects to it:**
- Phase 1: Before applying destination node effects, capture `{ sequence, edgeId, optionId, fromNodeId, toNodeId, flagSnapshot: state.preAdvanceFlagSnapshot ?? { ...state.currentFlagValues } }` and push to `traversalRecords`. Clear `preAdvanceFlagSnapshot` to null within the same `set()` call.
- Phase 3: After the existing reachability recompute, call `routeTracer.computeForwardReachable(edge.targetId, graphState)` and write result to `unreachableFromActiveNodeIds`.

**What must not change:** The edge reachability guard. The destination node effect application order (AR-11). The `seenNodeIds` and `traversedEdgeIds` append logic. The `persistedLocked` carry-forward. The ending-node branch. The non-ending branch. The `selectedOptionId` reset to null.

---

## `simulationStore.selectOption(optionId)`

**What it currently does:** Validates the active node is a choice node; finds the option; applies option `flags_set`/`status_set` to `currentFlagValues`; recomputes reachable edges/nodes and node states; sets `selectedOptionId`.

**How Route_Tracing connects to it:**
- Phase 1: At the very start of `selectOption()`, before any option effect is applied, write `preAdvanceFlagSnapshot = { ...state.currentFlagValues }` as part of the `set()` call. This snapshot captures the state before option effects — it is later consumed by `advance()` to produce a complete traversal record.

**What must not change:** Option lookup and validation. Option effect application (`applyFlagsSet`, `applyStatusSet`). Reachability recompute with `optionId` filter. `selectedOptionId` assignment.

---

## `simulationStore.exitCampaign()`

**What it currently does:** Conditionally auto-snapshots the campaign if `autosaveCampaign` is true; unconditionally zeroes all simulation state fields.

**How Route_Tracing connects to it:**
- Phase 1: Add `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to the unconditional tear-down `set()` call.
- Phase 3: Add `unreachableFromActiveNodeIds: []` to the tear-down `set()` call.
- Phase 4: Add `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false` to the tear-down `set()` call.

**What must not change:** The auto-snapshot sequence (must run before state zeroing, not after). The `useCampaignStore.getState().updateCampaign()` call. The separation of `flagOverrides`/`statusOverrides` in the snapshot (AR-18). All fields already in the tear-down `set()` call.

---

## `simulationStore.reset()`

**What it currently does:** Reinitialises from the start node with default flag/status values; zeroes traversal fields; sets `isCampaignActive: true`.

**How Route_Tracing connects to it:**
- Phase 1: Add `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to the `set()` call.
- Phase 3: Add `unreachableFromActiveNodeIds: []` to the `set()` call.
- Phase 4: Add `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false` to the `set()` call.

**What must not change:** The "payload-free" restart semantics (PROTECTED comment in code). The start-node lookup. The default flag/status seeding from `narrativeStore`. The existing fields already zeroed in the `set()` call.

---

## `simulationStore.enterCampaign(campaignPayload?)`

**What it currently does:** Resolves the start node; seeds `currentFlagValues` from `campaignPayload.snapshot` (filtering stale IDs) or from `narrativeStore` defaults; resumes from snapshot `activeNodeId` if valid; computes initial reachability and node states; writes all fields in one `set()` call.

**How Route_Tracing connects to it:**
- Phase 1: Add `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to the `set()` call (both always start empty on enter).
- Phase 3: Add `unreachableFromActiveNodeIds: []` to the `set()` call.
- Phase 4: Add `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false` to the `set()` call.

**What must not change:** The stale-ID filtering for `flagOverrides`/`statusOverrides`. The `resumeNodeId` / `resumeSeenNodeIds` / `resumeTraversedEdgeIds` restore logic. The start-node guard. The snapshot hydration branch vs. the zero-arg default branch.

---

## `conditionEvaluator.js` — `evaluateCondition`, `evaluateClause`

**What it currently does:** Pure functions that evaluate a `Condition` object against a `flagState` map. Called exclusively by `simulationStore.advance()` via the `utils` barrel (AR-07).

**How Route_Tracing connects to it:**
- Phase 3/4: `routeTracer.js` imports `evaluateCondition` from the `utils` barrel to check edge gate conditions during pathfinding. It is the only permitted location for gate evaluation logic (AR-07).

**What must not change:** The function signatures. The AND/OR evaluation semantics. The file itself is PROTECTED — `routeTracer.js` is a caller, not a modifier.

---

## `ConditionalEdge.jsx`

**What it currently does:** Reads `isTraversed` (boolean) and `isConditionPass` (boolean) from `simulationStore` via per-edge primitive selectors. Applies `--traversed` or `--condition-pass` CSS class. Renders label and condition badge with verbose/compact display mode support.

**How Route_Tracing connects to it:**
- Phase 2: Adds a third boolean selector `isTraversedOverlay` gated on `uiStore.showTraversalOverlay`. When true, applies `--traversal-overlay` instead of `--traversed`. The existing `--traversed` class is superseded by the overlay class when the overlay is on; when the overlay is off, traversed edges render as inert (no traversal marking). The `--condition-pass` pulse is unaffected.
- Phase 4: Adds `isRouteOverlay` boolean (derived from `shortestRouteResults[selectedRouteIndex]` path membership). Applies `--route-overlay` when true.

**What must not change:** `isConditionPass` selector and `--condition-pass` class. The verbose label rendering. `React.memo`. `getSmoothStepPath` geometry. The `BaseEdge` + `EdgeLabelRenderer` structure. The `--unselected-option-dim` and `--condition-fail` classes (those are for option-based dimming, not traversal).

---

## Node renderers — `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`

**What they currently do:** Read `nodeState` (string), `isSeen` (boolean), `isOrphaned` (boolean), `isUnreachable` (boolean) from `simulationStore` via per-node primitive selectors. Apply composed `className` string with these as CSS modifier tokens. The `--seen` overlay is the existing orthogonal indicator.

**How Route_Tracing connects to them:**
- Phase 3: Each renderer adds a fifth boolean selector `isCoverageGap: s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id)`. This boolean is appended to the `className` string as `story-node--coverage-gap`. It is orthogonal to the six-state enum and to `--seen` — a node can simultaneously be `--active` and `--coverage-gap` if (somehow) it is the active node but also structurally unreachable from itself (a pathological case; in practice `--coverage-gap` is suppressed on the active node by the BFS starting from it).

**What must not change:** All existing selectors. The six-state CSS class application. `--seen` class. Warning badge render. `React.memo`. ChoiceNode option render and per-option handle. EndingNode no-source-handle constraint (AR-12).

---

## `App.jsx` + `App.css`

**What they currently do:** `App.jsx` composes a three-region layout (TopBar / GraphCanvas / Sidebar) plus two fixed-position overlays (Toast, CommandPalette). `App.css` defines the grid: `48px 1fr` rows, `1fr 300px` columns.

**How Route_Tracing connects to them:**
- Phase 2: `App.jsx` mounts `<StatusStrip />` in a new `<footer className="app__statusbar">` element. `App.css` adds a third row `28px` and a `statusbar` grid area spanning both columns.

**What must not change:** The TopBar 48px row. The canvas / sidebar column split (`1fr 300px`). The `Toast` and `CommandPalette` fixed overlays (they use `position: fixed`, no grid impact). The `height: 100vh` / `overflow: hidden` contract.

---

## `uiStore.js`

**What it currently does:** Owns UI state: selection, snap-to-grid, choice display mode, label display mode, cluster mode. All fields have simple toggle/set actions. `setSelectedNodeIds` has an order-independent equality check (RISK-CMK-12 mitigation).

**How Route_Tracing connects to it:**
- Phase 1: Adds three boolean overlay toggles and (Phase 4) a route index selector. These are simple additions — no interaction with existing fields.

**What must not change:** `setSelectedNodeIds` equality-check pattern. `clearSelection` / `resetSelection` both must continue to reset `selectedNodeIds` to `[]`. All existing fields and their initial values.
