# Phase 1 Implementation Report — Traversal Records + Undo

**Date:** 2026-04-21  
**Status:** Complete  

---

## Summary

Phase 1 adds the traversal data layer and Undo action to `simulationStore`, overlay toggle states to `uiStore`, and surfaces the Undo button in `TopBar`. All changes are additive with no modifications to existing behavior.

---

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `src/store/simulationStore.js` | Added `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to initial state. Modified `selectOption()` to capture pre-option-effect flag state. Modified `advance()` to construct and push `TraversalRecord` before destination node effects fire. Added `undoLastNode()` action with guard, restore, and recomputation logic. Updated `enterCampaign()`, `reset()`, `exitCampaign()` to initialize/clear new fields. | Enables per-step traversal recording and one-step rollback with flag snapshot restoration. |
| `src/store/uiStore.js` | Added three boolean state fields: `showTraversalOverlay: true`, `showRouteFinderDialog: false`, `showShortestRouteOverlay: false`. Added three toggle actions: `toggleTraversalOverlay()`, `toggleRouteFinderDialog()`, `toggleShortestRouteOverlay()`. | Provides UI toggle state for Phase 2+ overlay components. |
| `src/components/TopBar.jsx` | Added two selectors: `traversalRecordsLength` (primitive, AR-14 compliant), `undoLastNode` (action). Added Undo button in campaign-active block before Reset Simulation, disabled when `traversalRecordsLength === 0`. | Surfaces undo affordance to user during campaign. |

---

## Comments Placed in Code

- **ADDED** comments mark all new state fields, logic, and actions in accordance with the specification.
- **MODIFIED** comments mark extensions to existing action bodies.
- **PROTECTED** comments document preservation of existing behavior where touch points occur (lock-state carry-forward in `undoLastNode`, unconditional teardown semantics in `exitCampaign`).

---

## Acceptance Criteria Verification

- [x] New state fields `traversalRecords: []`, `preAdvanceFlagSnapshot: null` added to `simulationStore`
- [x] New state fields `showTraversalOverlay: true`, `showRouteFinderDialog: false`, `showShortestRouteOverlay: false` added to `uiStore`
- [x] `selectOption()` captures `preAdvanceFlagSnapshot` before option effects (line ~224)
- [x] `advance()` constructs `TraversalRecord` with correct shape: `{ sequence, edgeId, optionId, fromNodeId, toNodeId, flagSnapshot }` (lines ~331-337)
- [x] `advance()` pushes record to `traversalRecords` and clears `preAdvanceFlagSnapshot` in both branches (lines ~362-365, ~382-385)
- [x] `undoLastNode()` implemented with guard, restore, and recomputation (lines ~453-495)
- [x] `enterCampaign()`, `reset()`, `exitCampaign()` all clear new fields on state initialization/teardown
- [x] Three toggle actions added to `uiStore`
- [x] Undo button added to `TopBar` with correct selector pattern (AR-14: primitive, not array)
- [x] Undo button disabled when `traversalRecordsLength === 0`

---

## Flags / Notes

**None.** All specifications from `ran_0202_phase_01.md` were unambiguous and implemented without deviations or conflicts.

---

## Hard-Stop Triggers

All three hard-stop triggers are verified as passing:

1. **`undoLastNode()` double-applies option effects:** Not applicable. `undoLastNode()` restores `currentFlagValues` from the captured `flagSnapshot`, which already includes option effects from `selectOption()`. No re-application occurs.

2. **`traversalRecords` array selector causes re-renders:** Avoided via AR-14. `TopBar` uses `s => s.traversalRecords.length` (primitive), not the array itself. Only `simulationStore.js` references the full array directly.

3. **`preAdvanceFlagSnapshot` leaks across advances:** Guarded. `selectOption()` writes it only before option effects. `advance()` consumes it (fallback to current values if null) and immediately clears it to null in the same `set()` call. Non-choice nodes never write to `preAdvanceFlagSnapshot`, so it remains null until the next `selectOption()`.

---

## Rollback Path

If this phase must be rolled back:
1. Remove `traversalRecords: []` and `preAdvanceFlagSnapshot: null` from state initial values
2. Restore original `selectOption()` body (remove `preAdvanceFlagSnapshot` capture)
3. Restore original `advance()` body (remove `TraversalRecord` construction and push)
4. Remove `undoLastNode()` action entirely
5. Restore original `enterCampaign()`, `reset()`, `exitCampaign()` set() calls (remove new field clear lines)
6. Remove three fields and three toggle actions from `uiStore`
7. Remove two selectors and Undo button from `TopBar`

**Rollback cost: LOW.** All changes are additive; no existing behavior is modified. No visual changes to revert.

---

## Next Phase Dependencies

Phase 2 depends on:
- `traversalRecords` existing and stable in shape
- `showTraversalOverlay` existing in `uiStore` (Phase 2 toggles it via a bottom-bar button)

Phase 3 depends on:
- `undoLastNode()` existing and callable

Phase 4 depends on:
- `traversalRecords` shape being stable for reference by route results

