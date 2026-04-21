# Phase 1 — Traversal Records + Undo

---

**Goal:** Build the rich traversal data layer and the Undo action inside `simulationStore`, surface the Undo button in `TopBar`, and add overlay toggle state to `uiStore` — with no new visual canvas output. The feature is verifiable by observing store state and button behavior.

---

## What it adds

**`simulationStore.js`**
- New state fields: `traversalRecords: []`, `preAdvanceFlagSnapshot: null`
- `selectOption()` extended: at the very start, before applying option effects, write `preAdvanceFlagSnapshot: { ...state.currentFlagValues }` in the same `set()` call that applies option effects. This captures the pre-option-effect state for use by the traversal record.
- `advance()` extended: at the start, construct `TraversalRecord = { sequence: state.traversalRecords.length, edgeId, optionId: edge.optionId ?? null, fromNodeId: state.activeNodeId, toNodeId: edge.targetId, flagSnapshot: state.preAdvanceFlagSnapshot ?? { ...state.currentFlagValues } }`. Push to `traversalRecords` and clear `preAdvanceFlagSnapshot: null` within the same `set()` call as all other advance mutations.
- New action `undoLastNode()`:
  1. Guard: if `traversalRecords.length === 0` or `!isCampaignActive`, return immediately.
  2. Read last record: `const record = state.traversalRecords[state.traversalRecords.length - 1]`.
  3. Compute restored state: `activeNodeId = record.fromNodeId`, `currentFlagValues = { ...record.flagSnapshot }`, `seenNodeIds = state.seenNodeIds.slice(0, -1)`, `traversedEdgeIds = state.traversedEdgeIds.slice(0, -1)`, `traversalRecords = state.traversalRecords.slice(0, -1)`.
  4. Recompute: call `computeReachable(record.fromNodeId, graphState, record.flagSnapshot)` and `computeNodeStates(record.fromNodeId, graphState, reachableNodeIds, null, restoredSeenNodeIds)`.
  5. Write single `set()` call with all restored + recomputed fields plus `selectedOptionId: null`, `preAdvanceFlagSnapshot: null`.
  6. If `isShortestRouteStale` is not yet a state field (Phase 4 adds it), skip stale marking — it will be added in Phase 4.
- `exitCampaign()`, `reset()`, `enterCampaign()` each add `traversalRecords: []`, `preAdvanceFlagSnapshot: null` to their `set()` calls.

**`uiStore.js`**
- New state fields: `showTraversalOverlay: true`, `showRouteFinderDialog: false`, `showShortestRouteOverlay: false`
- New actions: `toggleTraversalOverlay()`, `toggleRouteFinderDialog()`, `toggleShortestRouteOverlay()`
- All three are simple boolean flips. No interaction with existing fields.

**`TopBar.jsx`**
- Add two new `simulationStore` selectors: `traversalRecordsLength = useSimulationStore(s => s.traversalRecords.length)` (number primitive, AR-14) and `undoLastNode = useSimulationStore(s => s.undoLastNode)`.
- Inside the `{isCampaignActive && (...)}` render block, add an Undo button before the Reset Simulation button: `<button onClick={undoLastNode} disabled={traversalRecordsLength === 0} className="topbar__btn">Undo Step</button>`

---

## Produces

| Action | File |
|--------|------|
| MODIFY | `src/store/simulationStore.js` |
| MODIFY | `src/store/uiStore.js` |
| MODIFY | `src/components/TopBar.jsx` |

---

## What it leaves temporarily incomplete

- No visual canvas overlay for traversed edges (Phase 2 completes)
- No StatusStrip coverage metrics UI (Phase 2 completes)
- No `--coverage-gap` dimming (Phase 3 completes)
- No shortest-route UI or `isShortestRouteStale` (Phase 4 completes — `undoLastNode` will be amended in Phase 4 to also set `isShortestRouteStale: true`)

---

## What the next phase depends on from this phase

- Phase 2 depends on `traversalRecords` existing in the store (to confirm traversal state is present)
- Phase 2 depends on `showTraversalOverlay` existing in `uiStore` (toggled by the StatusStrip button)
- Phase 3 depends on `undoLastNode` existing (to amend it with `unreachableFromActiveNodeIds` clear)
- Phase 4 depends on `traversalRecords` shape being stable (declared in `ran_0202_datamodelimpact.md`)

---

## Reference files needed

- `ran_0202_datamodelimpact.md` — `TraversalRecord` shape, all new action signatures
- `src/store/simulationStore.js` — current `advance()`, `selectOption()`, `exitCampaign()`, `reset()`, `enterCampaign()` bodies
- `src/store/uiStore.js` — current state and action list
- `src/components/TopBar.jsx` — current `isCampaignActive` block structure

---

## Rollback cost if this phase fails: LOW

All changes are additive store fields and a new button. Rolling back means removing the three new `simulationStore` fields (never read by any existing consumer), the three new `uiStore` fields, and the Undo button from TopBar. No visual changes to roll back.

---

## Hard stop triggers for this phase

1. **`undoLastNode()` double-applies option effects.** If the author undoes, then re-selects the same option, and the flag/status values are wrong (e.g. a flag is set twice), the `preAdvanceFlagSnapshot` capture in `selectOption()` is not working correctly. Stop and fix before proceeding.
2. **`traversalRecords` array selector causes re-renders.** If any component is accidentally reading `s.traversalRecords` (the full array) rather than a primitive derived from it, this will produce spurious re-renders. Check during Phase 1 acceptance: grep for `s.traversalRecords` or `state.traversalRecords` in any component file. Only `simulationStore.js` itself should reference it directly.
3. **`preAdvanceFlagSnapshot` leaks across advances.** After a non-choice-node advance (where `selectOption` was not called), `preAdvanceFlagSnapshot` must be null, and `advance()` must fall back to `{ ...state.currentFlagValues }`. Verify: advance through a non-choice node, check that the traversal record's `flagSnapshot` matches `currentFlagValues` before the destination node's effects were applied.

---

## Acceptance Criteria

- [ ] After entering a campaign and advancing 3 nodes, `simulationStore.getState().traversalRecords.length === 3`
- [ ] Each record has `sequence`, `edgeId`, `optionId`, `fromNodeId`, `toNodeId`, `flagSnapshot` fields
- [ ] Pressing Undo returns `activeNodeId` to the previous node; `traversalRecords.length` decrements by 1
- [ ] `currentFlagValues` after Undo matches `flagSnapshot` of the popped record (before destination node effects)
- [ ] Undo button is disabled when `traversalRecords.length === 0` (first node of campaign)
- [ ] Pressing Undo from a choice node: `selectedOptionId` is null after undo (re-selection required)
- [ ] `traversalRecords` is `[]` after `exitCampaign()`, after `reset()`, and on `enterCampaign()`
- [ ] `uiStore` has `showTraversalOverlay: true`, `showRouteFinderDialog: false`, `showShortestRouteOverlay: false` as initial values
- [ ] All three toggle actions flip their respective boolean

---

## Verification

Open the app. Enter campaign mode. Advance through 3 nodes (including at least one choice node where you select an option). Open browser DevTools → Application → (no IndexedDB viewer needed; use the React DevTools Zustand inspector if available, or add a temporary `console.log` in the action). Confirm `traversalRecords` has 3 entries with the correct `fromNodeId` and `toNodeId` values. Click "Undo Step" — confirm the active node returns to the previous node, the campaign-active status indicator still shows (you're still in campaign mode), and the Undo button becomes disabled after undoing back to the first node.
