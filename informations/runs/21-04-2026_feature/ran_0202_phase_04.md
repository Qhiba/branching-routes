# Phase 4 — Shortest-Route Pathfinding + RouteFinderDialog

---

**Goal:** Implement gate-respecting k-shortest-paths in `routeTracer.js`, wire the results into `simulationStore`, build `RouteFinderDialog` for the full author-facing UI, and add the route overlay to `ConditionalEdge`. This is the highest-complexity phase.

---

## What it adds

**`src/utils/routeTracer.js`** (MODIFY — add pathfinder to Phase 3 base)

Export `computeShortestPaths(startNodeId, targetNodeId, graphState, currentFlagValues, priorities, limit): RouteResult[]`

Approach: bounded state-space BFS with explicit flag/status state tracking.
- Each BFS node is a `(nodeId, flagState)` pair, not just `nodeId`, because a different flag state at the same graph node is a distinct state-space position.
- BFS queue entries: `{ nodeId, flagState, pathEdgeIds: string[], visitedGraphNodes: Set<string> }`. The `visitedGraphNodes` set prevents simple cycles (a node can only appear once per path).
- On each BFS step: expand all outgoing edges from `nodeId` whose gate passes `evaluateCondition(edge.condition, flagState)`. For each valid edge, compute `nextFlagState` by applying destination node effects. Push new queue entry.
- Stop when `nodeId === targetNodeId`: record the path.
- Hard limits: `MAX_STATE_VISITS = 10_000` (total state-space nodes dequeued), `HARD_CAP = 50` (maximum returned paths regardless of `limit`). When `MAX_STATE_VISITS` is reached, return collected paths so far with `{ paths: [...], exhausted: true }`.
- After collecting all paths within budget: sort by `pathEdgeIds.length` (ascending). For equal-length paths, apply `priorities` tie-breaking: score each path by how many priority `{id, preferredValue}` conditions it satisfies; higher score = better rank. Return top `min(limit, HARD_CAP)` paths.
- Return type: `{ paths: RouteResult[], exhausted: boolean }`. `RouteResult = { pathEdgeIds: string[], length: number, priorityRank: number }`.
- AR-07: all gate checks via `evaluateCondition`/`evaluateClause` imported from `utils` barrel. No inline flag comparison logic.
- AR-04: no Zustand imports.

**`src/store/simulationStore.js`** (MODIFY — add route result state and actions)
- Add to initial state: `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false`
- Add action `computeRoutes(targetNodeId, priorities, limit)`:
  1. Guard: requires `isCampaignActive`.
  2. Calls `routeTracer.computeShortestPaths(state.activeNodeId, targetNodeId, graphState, state.currentFlagValues, priorities, limit)`.
  3. Writes `shortestRouteResults = result.paths`, `shortestRouteTargetNodeId = targetNodeId`, `isShortestRouteStale = false` in a single `set()`.
  4. If `result.exhausted`, stores the flag in result metadata for `RouteFinderDialog` to display.
- Add action `clearRouteResults()`: resets `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false`.
- Add action `setShortestRouteStale()`: sets `isShortestRouteStale: true` without clearing results.
- Amend `undoLastNode()` from Phase 1: after the main rollback `set()` call, if `shortestRouteResults !== null`, also call `setShortestRouteStale()`.
- Add `shortestRouteResults: null`, `shortestRouteTargetNodeId: null`, `isShortestRouteStale: false` to `exitCampaign()`, `reset()`, `enterCampaign()` tear-down set calls.
- Import `computeShortestPaths` from `utils` barrel (added to `utils/index.js` in this phase).

**`src/store/uiStore.js`** (MODIFY — add route index)
- Add `selectedRouteIndex: 0` to state.
- Add `setSelectedRouteIndex(n)` action: `set({ selectedRouteIndex: n })`.
- When `toggleShortestRouteOverlay()` is called to turn the overlay OFF: also reset `selectedRouteIndex: 0`.

**`src/components/edges/ConditionalEdge.jsx`** (MODIFY)
- Add `showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay)` selector (boolean).
- Add `selectedRouteIndex = useUIStore(s => s.selectedRouteIndex)` selector (number).
- Add `shortestRouteResults = useSimulationStore(s => s.shortestRouteResults)` selector (array or null).
- Derive `routeEdgeSet` via `useMemo`: when `showShortestRouteOverlay && shortestRouteResults && shortestRouteResults[selectedRouteIndex]`, compute `new Set(shortestRouteResults[selectedRouteIndex].pathEdgeIds)`. Otherwise `null`.
- Add `isRouteOverlay = routeEdgeSet?.has(id) ?? false` — boolean.
- Update className priority order (last class wins in CSS, so order matters): `isRouteOverlay` takes precedence → apply `--route-overlay`. Else `isTraversedOverlay` → apply `--traversal-overlay`. Else `isConditionPass` → apply `--condition-pass`. This ensures route overlay is always visible on top of traversal overlay.
- AR-14: `isRouteOverlay` returns a primitive boolean. The `routeEdgeSet` is recomputed only when `shortestRouteResults`, `selectedRouteIndex`, or `showShortestRouteOverlay` changes — all selectors return stable primitives or stable array/null references.

**`src/styles/tokens.css`** (already has `--color-route-overlay` from Phase 2 — confirm, no change needed)

**`src/styles/global.css`** (MODIFY)
- Add `.conditional-edge--route-overlay` CSS class AFTER `.conditional-edge--traversal-overlay`:
  ```css
  .conditional-edge--route-overlay {
    stroke: var(--color-route-overlay) !important;
    stroke-width: 3px !important;
    stroke-dasharray: 8 4;
  }
  ```
  The dashed stroke visually distinguishes route overlay from the solid traversal overlay.
- Add `.route-finder-dialog` component block: a fixed centered overlay panel, similar to `name-modal` structure but wider (520px), with sections for target selection, priority list, path cap input, and results list. Include `.route-finder-dialog__stale-banner` for the stale-results notice.
- Per AR-21, both CSS blocks must be listed as explicit file entries.

**`src/components/RouteFinderDialog.jsx`** (CREATE)
- Renders when `showRouteFinderDialog === true && isCampaignActive`. Returns null otherwise.
- Structure:
  1. **Target selector section** — searchable input filtering all narrative nodes. Each result row shows label + chapter/path context per AR-22 (reuse `resolveNodeContext` helper identical to `CommandPalette`). Clicking a row sets `targetNodeId` local state.
  2. **Priority list section** — "Add Priority" button opens a flag/status picker; each priority entry shows `{name, preferredValue}` with a remove button. Stored in component `useState` (transient UI — not in Zustand until "Run" is clicked).
  3. **Path cap input** — number input, default 5, max enforced at 50 client-side (hard ceiling, no matter what the user types).
  4. **Run button** — disabled when no target selected. On click: calls `computeRoutes(targetNodeId, priorities, cap)` from `simulationStore`. Also sets `showShortestRouteOverlay: true` via `toggleShortestRouteOverlay` (if currently off) — enables the canvas overlay automatically after computing.
  5. **Results section** — visible when `shortestRouteResults` is not null. Shows a list/tabs of paths sorted by length. Each item shows path length and edge count. Clicking a path calls `setSelectedRouteIndex(n)`. When `isShortestRouteStale` is true, shows a yellow banner: "Route may be outdated — click Run to recompute." When `exhausted` flag is in the result, shows: "Search budget reached. Showing best paths found."
- Store reads: all via per-slice selectors (AR-23). Node lists from `narrativeStore` per-slice selectors.
- Open/close: controlled by `uiStore.toggleRouteFinderDialog`. ESC key dismisses with `stopPropagation()` before calling `toggleRouteFinderDialog` (same RISK-CP-03 / RISK-CMK-08 pattern as `NameModal` and `CommandPalette`).
- AR-19: `RouteFinderDialog` does NOT call `useReactFlow()`. It renders outside `ReactFlowProvider` (mounted in `App.jsx` or alongside `CommandPalette`).
- AR-22: every node result row displays chapter and/or path name when available.

**`src/App.jsx`** (MODIFY)
- Import and mount `<RouteFinderDialog />` alongside `<Toast />` and `<CommandPalette />` as a fixed viewport overlay.

**`src/utils/index.js`** (MODIFY)
- Add `computeShortestPaths` to the `routeTracer.js` re-export line.

**`src/components/index.js`** (MODIFY)
- Add `export { default as RouteFinderDialog } from './RouteFinderDialog'`

---

## Produces

| Action | File |
|--------|------|
| MODIFY | `src/utils/routeTracer.js` |
| MODIFY | `src/store/simulationStore.js` |
| MODIFY | `src/store/uiStore.js` |
| MODIFY | `src/components/edges/ConditionalEdge.jsx` |
| MODIFY | `src/styles/global.css` |
| MODIFY | `src/App.jsx` |
| MODIFY | `src/utils/index.js` |
| MODIFY | `src/components/index.js` |
| CREATE | `src/components/RouteFinderDialog.jsx` |

---

## What it leaves temporarily incomplete

Nothing — this is the final phase. The feature is complete after Phase 4.

---

## What the next phase depends on from this phase

No further phases. Phase 4 is the terminal phase of Route_Tracing.

---

## Reference files needed

- `ran_0202_phase_03.md` — confirms `routeTracer.js` base and `unreachableFromActiveNodeIds` exist
- `ran_0202_datamodelimpact.md` — `RouteResult` shape, all new action signatures
- `src/store/simulationStore.js` — current state after Phase 1 and Phase 3 additions
- `src/components/edges/ConditionalEdge.jsx` — current selector and className structure after Phase 2
- `src/utils/conditionEvaluator.js` — `evaluateCondition(condition, flagState): boolean` signature
- `src/components/CommandPalette.jsx` — `resolveNodeContext` pattern to reuse in RouteFinderDialog

---

## Rollback cost if this phase fails: MEDIUM

- `routeTracer.js` additions are isolated to the new `computeShortestPaths` export — remove the function only
- `simulationStore.js` additions are new state fields and new actions — revert
- `uiStore.js` additions are `selectedRouteIndex` and `setSelectedRouteIndex` — revert
- `ConditionalEdge.jsx` route overlay logic — revert the three new selectors and the className priority change (restore Phase 2 state)
- `global.css` route overlay CSS blocks — revert
- `App.jsx` `RouteFinderDialog` mount — remove the import and JSX
- `RouteFinderDialog.jsx` — delete new file
- MEDIUM because of the coordination across many files, not because individual rollbacks are hard

---

## Hard stop triggers for this phase

1. **`computeShortestPaths` blocks the main thread.** Test on a 30-node graph with 3 interacting flag gates and `limit=50`. If the computation takes >500ms (measured in DevTools Performance), the `MAX_STATE_VISITS` cap is insufficient for this graph. Lower the cap, or implement a chunked async search. Do not ship a version that can hang the browser.
2. **AR-14 violation from `shortestRouteResults` subscription in `ConditionalEdge`.** The `routeEdgeSet` `useMemo` in `ConditionalEdge` depends on `shortestRouteResults` (array or null). If `computeRoutes` replaces the array reference, all edges re-render once (acceptable — a deliberate user action triggered the compute). Verify: edges only re-render when `computeRoutes` is called, not on `advance()` steps.
3. **Route overlay stale banner missing.** If the narrative changes (topology edit) while a route is displayed, `isShortestRouteStale` must be set to true. However, narrative edits are blocked during campaign mode — `TopBar` disables authoring controls and `useKeyboardShortcuts` bails on `isCampaignActive`. The stale trigger from `undoLastNode()` is the primary case. Verify Undo marks results as stale; verify narrative edits in edit mode clear results entirely on next campaign enter (since `enterCampaign` resets `shortestRouteResults: null`).
4. **`RouteFinderDialog` calls `useReactFlow()` directly.** If target-node selection is implemented as a canvas click, this is forbidden (AR-19). The selection must be list-based (search + click in the dialog), or a canvas click must go through a `uiStore` field or DOM event. Hard stop if any `useReactFlow` call appears in `RouteFinderDialog.jsx`.
5. **Path cap input allows values >50.** Verify the hard ceiling is enforced: user types 999, presses Run — actual `limit` passed to `computeRoutes` must be clamped to 50 before calling `computeShortestPaths`.

---

## Acceptance Criteria

- [ ] `computeShortestPaths(startId, endId, graphState, flagValues, [], 5)` returns correct gate-respecting paths on a sample narrative with at least one flag gate
- [ ] Paths are sorted shortest-to-longest
- [ ] When priority `{id: flagId, preferredValue: true}` is set and two equal-length paths exist — one where the flag is `true` and one where it is `false` — the priority path appears first
- [ ] `limit` is clamped to 50 regardless of user input
- [ ] RouteFinderDialog opens via a button (in TopBar or StatusStrip) during campaign mode
- [ ] Target node selector shows chapter/path disambiguation context (AR-22)
- [ ] Selecting a path from the result list highlights its edges on the canvas in cyan dashed stroke, distinct from the orange traversal overlay
- [ ] Stale banner appears in the dialog after pressing Undo while a route is displayed
- [ ] Clicking Run on a stale result recomputes and clears the stale banner
- [ ] `isShortestRouteStale` is reset to `false` after `computeRoutes` completes
- [ ] ESC dismisses the dialog without clearing canvas selection (stopPropagation)
- [ ] `shortestRouteResults` is null after `exitCampaign()`, `reset()`, or `enterCampaign()`

---

## Verification

Open the app. Build a narrative: Start → Gate Node (sets `hasKey = true`) → Ending A; Start → Ending B (gate: `hasKey = true`, fails without visiting Gate Node). Enter campaign mode. Open RouteFinderDialog. Select "Ending A" as target. Set limit to 5. Click Run. Verify the dialog shows one path (Start → Gate Node → Ending A). The canvas shows cyan dashed edges on this path. Click Undo one step — a stale banner appears in the dialog. Click Run again — banner clears and the path recomputes from the new current position. Close the dialog (ESC) — canvas route overlay disappears.
