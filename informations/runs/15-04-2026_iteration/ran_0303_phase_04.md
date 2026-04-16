# Phase 4 — Simulation Hook-up

## Goal
Rewire `simulationStore` to read `flag{}` / `status{}` for initial values and apply `flags_set[]` / `status_set[]` from destination nodes during traversal, restoring full simulation side-effect execution under the new data model.

## What It Changes
- **`simulationStore.start()`**:
  - Reads `graphState.flag` and `graphState.status` (objects) instead of `graphState.flags` (array).
  - Builds `initialFlagValues{}` from `Object.entries(flag)` → `{ [id]: f.state }` and `Object.entries(status)` → `{ [id]: sp.value }`.
  - Combined into single `currentFlagValues{}` map keyed by entity ID.
- **`applySideEffects()` helper** — removed.
- **`applyFlagsSet(flagsSet, currentFlagValues)`** *(new internal helper)*: Sets `currentFlagValues[flagId] = true` for each `flagId` in `flagsSet[]`.
- **`applyStatusSet(statusSet, currentFlagValues)`** *(new internal helper)*: For each `{ statusId, amount }` in `statusSet[]`: `currentFlagValues[statusId] += amount` (with number type guard).
- **`simulationStore.advance(edgeId)`**:
  - After resolving `destNode`, applies `applyFlagsSet(destNode.data.flags_set, nextFlagValues)` and `applyStatusSet(destNode.data.status_set, nextFlagValues)`.
  - Passes updated `nextFlagValues` to `computeReachable()` — which calls the Phase 2 updated `evaluateCondition()`.
- **`computeReachable()`** — signature and logic unchanged; relies on the updated evaluator returning correct results for both flag and status clause types.

## Produces
- `src/store/simulationStore.js` — modified

## Migration Step
NONE — simulation state is runtime-only. No persisted keys changed.

## What It Leaves Temporarily Inconsistent
Nothing — this is the final phase. All systems should be consistent after this phase completes.

## What the Next Phase Depends on From This Phase
Nothing further — Phase 4 is the terminal phase of this push.

## Reference Files Needed
- `src/store/simulationStore.js` (current implementation)
- `src/store/narrativeStore.js` (Phase 1 output — store shape reference)
- `src/utils/conditionEvaluator.js` (Phase 2 output — updated evaluator)
- `ran_0303_behaviordelta.md` (target simulation behavior)

## Rollback Cost If This Phase Fails
**LOW** — Only `simulationStore.js` changes. Reverting restores Phase 3 state. UI, store data shape, and evaluator all remain correct. The only regression is that simulation side effects do not fire — the same state as after Phase 3.

## Hard Stop Triggers
- `start()` throws when `graphState.flag` or `graphState.status` is undefined.
- `advance()` crashes when `destNode.data.flags_set` is undefined (guard: default to `[]`).
- `computeReachable()` stops returning correct reachable edges (all edges should be reachable if conditions are met).
- `reset()` produces incorrect state (should not be touched by this phase).

## Acceptance Criteria
Done when: Starting a simulation sets `currentFlagValues` with entries from both `flag{}` and `status{}`. Advancing through a node with `flags_set: ['f-x']` sets `currentFlagValues['f-x']` to `true`. Advancing through a node with `status_set: [{ statusId: 'sp-y', amount: 2 }]` increments `currentFlagValues['sp-y']` by 2. Edge conditions referencing flag/status IDs evaluate correctly against the live flag values.

## Verification
Open the app. Build the following graph:
1. Create two nodes: **Start** (common) and **End** (common).
2. Create a flag `met_hero` (boolean, default false).
3. Create a status `courage` (value 0).
4. On **Start** node: add `met_hero` to `flags_set`. Add `courage` `+3` to `status_set`.
5. Connect Start → End. Add a condition: `courage >= 3`.
6. Start simulation. Confirm Start is highlighted as active. Confirm the edge to End is **highlighted as reachable** (condition passes because entering Start fires `courage +3`).
7. Click the edge/End node to advance. Confirm End becomes active and visited.
8. Open browser console: run `useSimulationStore.getState().currentFlagValues`. Confirm `met_hero: true` and `courage: 3`.
