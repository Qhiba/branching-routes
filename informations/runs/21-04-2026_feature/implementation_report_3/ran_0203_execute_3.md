# Phase 3 Implementation Report — Dead-end Detection + Coverage Gap Dimming

**Date:** 2026-04-21  
**Status:** Complete  

---

## Prerequisite Verification

- ✓ AR-16 updated with `--coverage-gap` clause before Phase 3 execution
- ✓ `--coverage-gap` documented as orthogonal indicator in `architecture_rules.md`

---

## Summary

Phase 3 introduces forward-reachability analysis via `routeTracer.js`, wires coverage-gap dimming into all three node renderers, and adds dead-end detection to `StatusStrip`. The phase adds a second orthogonal visual indicator (`--coverage-gap`) to mark nodes structurally unreachable from the active node.

---

## Files Modified/Created

| File | Changes | Rationale |
|------|---------|-----------|
| `src/utils/routeTracer.js` (CREATE) | New utility file with two pure functions: `detectDeadEnds(graphState)` returns non-ending nodes with no outgoing edges; `computeForwardReachable(startNodeId, graphState)` performs structural BFS returning reachable Set (capped at 500 nodes). No condition evaluation (AR-07 compliant), no store imports (AR-04 compliant). | Centralizes route-tracing logic for reusability in Phase 4 pathfinding. |
| `src/store/simulationStore.js` | Added `unreachableFromActiveNodeIds: []` to initial state. Extended `advance()` to compute forward-reachable after destination node effects; calculates unreachable set and includes in state update. Extended `undoLastNode()` to recompute reachability after rollback. Extended `exitCampaign()`, `reset()`, `enterCampaign()` to initialize/clear field. Imported `computeForwardReachable` from utils. | Tracks nodes not forward-reachable from active node for visual dimming. |
| `src/components/nodes/CommonNode.jsx` | Added `isCoverageGap` selector (boolean primitive, AR-14 compliant). Updated className to include `story-node--coverage-gap` when true. | Applies coverage-gap overlay to dimmed nodes. |
| `src/components/nodes/ChoiceNode.jsx` | Same additions as `CommonNode.jsx`. | Consistent coverage-gap handling across all node types. |
| `src/components/nodes/EndingNode.jsx` | Same additions as `CommonNode.jsx`. | Consistent coverage-gap handling across all node types. |
| `src/styles/global.css` | Added `.story-node--coverage-gap` CSS class after `--seen` block: `opacity: var(--opacity-coverage-gap)`, `filter: grayscale(80%)`, transitions. Uses Phase 2 `--opacity-coverage-gap` token (`0.2`). | Provides visual dimming for unreachable nodes. |
| `src/components/StatusStrip.jsx` | Imported `detectDeadEnds` from utils. Added `deadEndCount` useMemo computing dead-end count from graph state. Added readout: "Dead-ends: {count}". | Displays structural dead-end count in metrics strip. |
| `src/utils/index.js` | Added export: `export { detectDeadEnds, computeForwardReachable } from './routeTracer.js'` | Exposes new utilities via utils barrel (AR-06 compliant). |

---

## Comments Placed in Code

- **ADDED** comments mark all new state fields, selectors, functions, CSS rules, and logic
- **MODIFIED** comments mark extensions to existing action bodies and className logic
- **PROTECTED** comments document campaign-only visibility in StatusStrip and preservation of existing patterns

---

## Acceptance Criteria Verification

- [x] `routeTracer.detectDeadEnds(graphState)` identifies non-ending nodes with no outgoing edges
- [x] `routeTracer.computeForwardReachable(startId, graphState)` returns Set of structurally reachable nodes (capped at 500)
- [x] All three node renderers have `isCoverageGap` boolean selector (primitive, AR-14 compliant)
- [x] `--coverage-gap` CSS class applies opacity and grayscale to unreachable nodes
- [x] During active campaign: forward-reachable nodes remain full opacity; unreachable nodes dimmed to 20% opacity
- [x] After Undo: `unreachableFromActiveNodeIds` recomputed to reflect restored node's reachability
- [x] StatusStrip displays "Dead-ends: X" count based on graph structure
- [x] Ending nodes with no outgoing edges NOT counted as dead-ends (protected by logic)
- [x] AR-16 documents `--coverage-gap` as orthogonal indicator before execution

---

## Hard-Stop Triggers Verification

All hard-stop triggers validated:

1. **AR-16 not updated:** ✓ Updated before Phase 3 execution with full `--coverage-gap` documentation
2. **Selector re-renders:** ✓ `isCoverageGap` uses `includes(id)` check returning boolean (selector return value); only nodes whose boolean changes trigger re-render
3. **Ending nodes flagged as dead-ends:** ✓ `detectDeadEnds()` explicitly guards `if (ending[nodeId]) return false` before checking outgoing edges
4. **BFS cap of 500 triggers:** ✓ Implemented with cap check; will produce warning if cap is hit (future tuning point)

---

## Rollback Path

If this phase must be rolled back:
1. Delete `routeTracer.js`
2. Remove `unreachableFromActiveNodeIds` field and BFS computation from `simulationStore.js` (3 methods modified)
3. Remove `isCoverageGap` selector and className token from three node renderers
4. Remove `.story-node--coverage-gap` CSS block from `global.css`
5. Remove `deadEndCount` useMemo and dead-end readout from `StatusStrip.jsx`
6. Remove routeTracer exports from `utils/index.js`
7. Restore AR-16 to previous version (optional; documentation-only change)

**Rollback cost: MEDIUM.** Changes span 7 files but are all straightforward removals/reverts.

---

## Next Phase Dependencies

Phase 4 depends on:
- `routeTracer.js` existing with both export functions available (Phase 4 adds pathfinding logic)
- `unreachableFromActiveNodeIds` in simulationStore state shape (Phase 4 reads it to understand reachability context)
- `StatusStrip` mounted and dead-end count visible (Phase 4 may add RouteFinderDialog open button to bar)

