# Phase 05 Test Report

## Test Output

```
=== Phase 05 Tests ===
PASS: Start simulation fails when no start node is present
PASS: Start simulation succeeds and computes initial reachable edges
FAIL: Advancing simulation to a reachable node updates active state
  -> n1 should be visited
PASS: Advancing via an unreachable edge fails
PASS: Resetting simulation clears all state

Summary: 4 passed, 1 failed.
```

## Failure Analysis

1. **`Advancing simulation to a reachable node updates active state`** Failed. 
   - **What happened**: When advancing the simulation between nodes (e.g. crossing edge from `n1` to `n2`), the store failed to assert that `n1` is stored inside `visitedNodeIds`.
   - **Root Cause**: Investigating `src/store/simulationStore.js` shows that in `advance(edgeId)`, the state mutation logic incorrectly adds `destNode.id` (the node being entered) to `visitedNodeIds` rather than `state.activeNodeId` (the node being exited).
   - **What it should do**: It should append `state.activeNodeId` to `visitedNodeIds` as we traverse away from it.

## Conclusion
The data schema correctly matched the assumptions inside the UI logic, but there is a logic flaw inside `simulationStore.advance()` regarding how `visitedNodeIds` is populated, creating a failure case detected during the headless simulation progression tests. This bug will need to be fixed in the `Fix` phase (Phase 06 pipeline or next available phase).
