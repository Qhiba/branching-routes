# Phase 3 — Dead-end Detection + Coverage Gap Dimming

---

> ⚠️ **RULE CONFLICT — AR-16**
>
> AR-16 states: *"No new visual state may be introduced outside this enum without updating this rule."*
>
> This phase introduces `--coverage-gap` as a second orthogonal indicator on node renderers, analogous to the existing `--seen` overlay. AR-16 must be updated in `informations/docs/architecture_rules.md` to document `--coverage-gap` before this phase begins execution.
>
> **Required amendment:** Add a clause to AR-16 stating: "A second orthogonal indicator `--coverage-gap` may be applied independently of the six-state enum. It marks nodes that have no forward graph path from the current active node. It does not replace the enum value; it is applied additively. Dimmed = not forward-reachable from the active position, not proven permanently unreachable."
>
> **Update `architecture_rules.md` before proceeding.**

---

**Goal:** Create `routeTracer.js` with dead-end detection and forward-reachability BFS, wire the unreachable-from-active set into all three node renderers, and add the dead-end count to `StatusStrip`.

---

## What it adds

**`src/utils/routeTracer.js`** (CREATE — partial; Phase 4 adds the pathfinder)
- `detectDeadEnds(graphState): string[]` — pure function. Returns IDs of nodes where: (a) no outgoing edges exist in `graphState.edges` with `sourceId === nodeId`, AND (b) the node is NOT in `graphState.ending`. Nodes in `graphState.ending` with no outgoing edges are correct terminals, not dead-ends (per scope boundary).
- `computeForwardReachable(startNodeId, graphState): Set<string>` — pure function. Performs a plain BFS (no gate evaluation) from `startNodeId` through forward edges. Returns a `Set` of all node IDs reachable from `startNodeId`. If `startNodeId` is not in the graph, returns an empty Set. Caps at 500 visited nodes; returns partial set if cap reached.
- Both functions are pure: no store imports, no side effects, no condition evaluation.
- AR-07 compliance: no gate evaluation in this file (forward BFS is structural, not conditional).
- AR-04 compliance: no Zustand imports.

**`src/store/simulationStore.js`**
- Add `unreachableFromActiveNodeIds: []` to initial state.
- Extend `advance()` `set()` call: after computing `reachableEdgeIds`/`reachableNodeIds`/`nodeStates`, call `routeTracer.computeForwardReachable(edge.targetId, graphState)` to get `forwardReachable: Set<string>`. Compute `unreachableFromActiveNodeIds` as all node IDs NOT in `forwardReachable`. Store as `[...allNodeIds.filter(id => !forwardReachable.has(id))]`.
- Extend `undoLastNode()` to recompute `unreachableFromActiveNodeIds` after rollback (same BFS from `record.fromNodeId`).
- Extend `exitCampaign()`, `reset()`, `enterCampaign()` to zero `unreachableFromActiveNodeIds: []`.
- Import `computeForwardReachable` from `utils` barrel (added in this phase).

**`src/components/nodes/CommonNode.jsx`**
- Add `isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id))` — boolean primitive selector (AR-14).
- Append `story-node--coverage-gap` to `className` string when `isCoverageGap` is true. Position after `story-node--seen` in the string.

**`src/components/nodes/ChoiceNode.jsx`**
- Same addition as `CommonNode.jsx`.

**`src/components/nodes/EndingNode.jsx`**
- Same addition as `CommonNode.jsx`.

**`src/styles/global.css`**
- Add `.story-node--coverage-gap` CSS class AFTER the existing simulation state override block (to preserve specificity order):
  ```css
  .story-node--coverage-gap {
    opacity: var(--opacity-coverage-gap);
    filter: grayscale(80%);
    transition: opacity var(--transition-normal), filter var(--transition-normal);
  }
  ```
- This class must be declared after `.story-node--seen` to avoid specificity conflicts. It uses the `--opacity-coverage-gap` token added in Phase 2 (`0.2`).
- Per AR-21 this CSS addition must be listed as an explicit file entry.

**`src/components/StatusStrip.jsx`** (MODIFY)
- Add dead-end count readout. Import `detectDeadEnds` from `utils` barrel.
- Add `common = useNarrativeStore(s => s.common)`, `choice = useNarrativeStore(s => s.choice)`, `ending = useNarrativeStore(s => s.ending)`, `edges = useNarrativeStore(s => s.edges)` (already present from Phase 2).
- Add `deadEndCount = useMemo(() => detectDeadEnds({ common, choice, ending, edges }).length, [common, choice, ending, edges])`.
- Add "Dead-ends: {deadEndCount}" readout to the strip. This is a static structural count (does not change during simulation unless the narrative is modified; `isCampaignActive` blocks narrative edits so this is effectively stable during a campaign).

**`src/utils/index.js`**
- Add `export { detectDeadEnds, computeForwardReachable } from './routeTracer.js'`

---

## Produces

| Action | File |
|--------|------|
| CREATE | `src/utils/routeTracer.js` |
| MODIFY | `src/store/simulationStore.js` |
| MODIFY | `src/components/nodes/CommonNode.jsx` |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` |
| MODIFY | `src/components/nodes/EndingNode.jsx` |
| MODIFY | `src/styles/global.css` |
| MODIFY | `src/components/StatusStrip.jsx` |
| MODIFY | `src/utils/index.js` |

---

## What it leaves temporarily incomplete

- `routeTracer.js` has dead-end detection and forward BFS only; the k-shortest-paths function is added in Phase 4
- `showShortestRouteOverlay` and `RouteFinderDialog` open button exist in `uiStore` but are unwired to any UI (Phase 4)

---

## What the next phase depends on from this phase

- Phase 4 depends on `routeTracer.js` existing and exports being available via `utils` barrel
- Phase 4 depends on `unreachableFromActiveNodeIds` in `simulationStore` state (to understand the existing state shape before adding route results)

---

## Reference files needed

- `ran_0202_phase_02.md` — confirms `StatusStrip.jsx` and `tokens.css` tokens exist
- `ran_0202_datamodelimpact.md` — `computeForwardReachable` return type and cap
- `src/store/simulationStore.js` — current `advance()` body (insertion point for BFS call)
- `src/utils/conditionEvaluator.js` — confirm it exports `evaluateCondition` (routeTracer.js is a caller in Phase 4; reviewed now to confirm the interface)
- `informations/docs/architecture_rules.md` — confirm AR-16 has been updated (PREREQUISITE CHECK)

---

## Rollback cost if this phase fails: MEDIUM

- `routeTracer.js` is a new file — delete it
- `simulationStore.js` additions are localised — revert the `unreachableFromActiveNodeIds` field and the BFS call in `advance()`
- Node renderer changes are a single selector + className token each — revert three files
- `global.css` addition is one CSS block — revert
- `StatusStrip.jsx` dead-end count is one `useMemo` + one readout — revert
- `utils/index.js` one-line re-export change — revert
- MEDIUM because of the number of files touched (7), not because any single change is complex

---

## Hard stop triggers for this phase

1. **AR-16 not updated.** Grep `architecture_rules.md` for `coverage-gap`. If absent: hard stop. Do not add the CSS class to node renderers until the rule is updated.
2. **`unreachableFromActiveNodeIds.includes(id)` subscriptions in node renderers cause re-renders.** Each `includes(id)` call evaluates on every `advance()` but returns the same boolean for nodes whose reachability hasn't changed. Zustand compares the selector return value (boolean). Only nodes whose boolean changes will re-render. Verify: advance once; open DevTools React profiler; confirm only the active node and its immediate neighbors highlight.
3. **Dead-end detection incorrectly flags ending nodes.** Verify: create an ending node with no outgoing edges. `detectDeadEnds()` must NOT include it. Only non-ending nodes with no outgoing edges are dead-ends.
4. **`computeForwardReachable` cap of 500 triggers on a normal graph.** If your test graph has >500 nodes, the BFS returns partial results and dimming is incorrect. Hard stop: log a warning when the cap is hit; adjust the cap value if 500 is too low for the project's typical graph size.

---

## Acceptance Criteria

- [ ] `routeTracer.detectDeadEnds(graphState)` returns correct IDs for nodes with no outgoing edges that are not of type ending
- [ ] `routeTracer.computeForwardReachable(startId, graphState)` returns all structurally reachable nodes from the given start, ignoring conditions
- [ ] During an active campaign: nodes not forward-reachable from the active node appear dimmed (lower opacity, greyscale)
- [ ] Nodes that ARE forward-reachable from the active node retain full opacity
- [ ] After Undo: dimming updates to reflect reachability from the restored node
- [ ] StatusStrip shows "Dead-ends: X" count that matches actual dead-end node count in the narrative
- [ ] Ending nodes with no outgoing edges are NOT counted as dead-ends
- [ ] AR-16 in `architecture_rules.md` documents `--coverage-gap` before this phase ships

---

## Verification

Open the app. Build a small graph: Start → Choice → (Option A) → Common → Ending; plus a separate Common node connected from Start but with no outgoing edges (dead-end). Enter campaign mode. The disconnected dead-end node and nodes not reachable from Start appear dimmed immediately on enter. Advance to the Choice node — nodes only reachable via Option B (if you haven't selected it) start to dim as you progress away from them. The StatusStrip shows "Dead-ends: 1". Check: the Ending node is NOT counted in the dead-end readout.
