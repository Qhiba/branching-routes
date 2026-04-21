# Phase 4 Test Report — Shortest-Route Pathfinding + RouteFinderDialog

**Date:** 2026-04-21  
**Test file:** `tests/test_route_tracing_phase_4.js`  
**Run command:** `node tests/test_route_tracing_phase_4.js`

---

## Test Coverage

### Group A — Feature Verification (18 tests)

| ID | Description |
|----|-------------|
| A-01 | Result has correct shape: `{ paths, exhausted }`, path has `pathEdgeIds`, `length`, `priorityRank` |
| A-02 | Happy path — linear graph finds the single correct path with correct edges |
| A-03 | Branching graph finds both paths |
| A-04 | Paths sorted shortest-to-longest |
| A-05 | Gate-respecting — path requiring unset flag is excluded |
| A-06 | Gate-respecting — path requiring pre-set flag is included |
| A-07 | Flag set by intermediate node unlocks downstream gated edge |
| A-08 | Priority tie-breaking — path satisfying priority appears first among equal-length paths |
| A-09 | No priority spec — paths returned in length order only (no crash) |
| A-10 | limit parameter caps returned paths |
| A-11 | HARD_CAP=50 — limit 999 is clamped, never exceeds 50 |
| A-12 | Unreachable target returns empty paths array |
| A-13 | start===target yields path with 0 edges |
| A-14 | Cycle in graph does not produce infinite loop or repeated nodes in a path |
| A-15 | exhausted is false for small graph |
| A-16 | setShortestRouteResults fix — stores paths without isCampaignActive guard |
| A-17 | computeRoutes (campaign-mode action) still guards on isCampaignActive |
| A-18 | priorityRank assigned within same-length groups starting at 0 |

### Group B — Integration Suite (9 tests)

| ID | Description |
|----|-------------|
| B-01 | evaluateCondition(null) returns true (no gate = always passable) |
| B-02 | evaluateCondition flag gate blocks/passes path traversal correctly |
| B-03 | ConditionalEdge routeEdgeSet logic — edge on selected route returns true; off-route returns false |
| B-04 | selectedRouteIndex resets to 0 when overlay toggled off |
| B-05 | selectedRouteIndex preserved when overlay toggled on |
| B-06 | shortestRouteResults cleared on exitCampaign/reset/enterCampaign |
| B-07 | undoLastNode marks isShortestRouteStale=true when results exist |
| B-08 | Path cap at boundary — result never exceeds HARD_CAP of 50 |
| B-09 | RouteFinderDialog auto-close contract — handleRun stores results, activates overlay, closes dialog |

---

## What is NOT tested here

- RouteFinderDialog JSX rendering (UI)
- ESC key stopPropagation behavior (event/DOM)
- Priority list add/remove in dialog (UI interaction)
- CSS: `--route-overlay` cyan dashed stroke (visual)
- MAX_STATE_VISITS exhaustion on adversarial graph (would require a carefully crafted exponential graph)

---

## Fix Coverage

This test suite covers the three bugs fixed in `ran_0204_fix_4.md`:

| Bug | Test |
|-----|------|
| BUG-01: Results stored in local state instead of simulationStore | A-16, B-09 |
| BUG-02: Dialog did not auto-close on Run | B-09 |
| BUG-03: No edit-mode setter (setShortestRouteResults) | A-16, A-17 |

---

## Test Defect Fixed

**B-03 first run:** 3 assertions failed — `isRouteOverlay` was returning `false` correctly but asserts were missing `=== false`, causing them to fail on a falsy value. Fixed by adding explicit `=== false` comparisons to the three negative-case asserts.

## Result

**50 tests — 50 passed, 0 failed**  
**INTEGRATION: CLEAN**
