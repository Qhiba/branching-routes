# Phase 3 — Choice option interaction and selected-option routing

- **Goal** — During campaign mode, make options on the active choice node clickable, fire their side effects, set a `selectedOptionId`, and filter reachable edges to those matching the selected option's handle. Visually highlight the selected option and dim the unselected.

- **What it changes** — The routing model. Until now, reachable edges from any active node are "all outgoing edges where condition passes". After Phase 3, when the active node is a choice, reachable edges are additionally filtered to `edge.optionId === selectedOptionId`. For common / ending active nodes, behaviour is unchanged. Option clicks acquire meaning during play: they fire `options[].flags_set` / `status_set` on the narrativeStore's option definition (read-only — applied to `simulationStore.currentFlagValues`, never to `narrativeStore`), set `selectedOptionId`, and recompute reachable edges.

- **Produces** — Files modified:
  - `src/store/simulationStore.js` — add `selectedOptionId: string | null` to state. Add `selectOption(optionId)` action: validates that `activeNodeId` is a choice and the option belongs to it (read via `useNarrativeStore.getState()`), reads the option definition, applies its `flags_set` and `status_set` to `currentFlagValues` via the existing `applyFlagsSet` / `applyStatusSet` helpers, sets `selectedOptionId`, and recomputes reachable edges with the new filter. Modify `computeReachable` signature to take an optional `selectedOptionId` parameter and filter outgoing edges from a choice node to those whose `optionId === selectedOptionId`; leave non-choice nodes' behaviour untouched. Modify `advance(edgeId)` to clear `selectedOptionId` after advancing. Extend the `nodeStates` computation to consider option-filtered routing when determining `branch_locked` — a downstream node reachable only via a currently-selected option whose condition fails is `branch_locked`. (Note: this computation is only possible *after* an option is selected; without a selection the state defers to `locked` or undefined.)
  - `src/components/nodes/ChoiceNode.jsx` — add click handler on each option sub-div. Only active during campaign mode AND when this choice is `isActive`. On click, call `useSimulationStore.getState().selectOption(opt.id)`. Add `selectedOptionId` subscription: `const selectedOptionId = useSimulationStore(s => s.selectedOptionId)`. Apply `choice-node__option--selected` class to the option matching `selectedOptionId`. Apply `choice-node__option--dimmed` class to the other options. Keep the option source handles in place — they carry no new behaviour here, only the visual divs change.
  - `src/components/edges/ConditionalEdge.jsx` — add a selector: if the edge's source is the active choice node and `edge.optionId !== selectedOptionId` (and `selectedOptionId` is non-null), apply `.conditional-edge--unselected-option-dim`. If `edge.optionId === selectedOptionId` and the condition fails, apply `.conditional-edge--condition-fail`. If both match and condition passes, `--condition-pass`. Precedence order: `traversed` > `condition-pass` > `condition-fail` > `unselected-option-dim` > plain.
  - `src/components/GraphCanvas.jsx` — adjust `onNodeClick` advance logic: if the active node is a choice, advance only via `storeEdges.find(e => e.sourceId === active && e.targetId === clicked && e.optionId === selectedOptionId && reachableEdgeIds.includes(e.id))`. For common / ending active nodes, keep the existing edge-find logic. If no match, the click is a no-op (don't throw). The logic continues to assume that the click came from a reachable node and the `edge.id` lookup via `reachableEdgeIds.includes` acts as the final guard.
  - `src/styles/global.css` — add `.choice-node__option--selected` (accent border / filled background), `.choice-node__option--dimmed` (reduced opacity), `.conditional-edge--condition-pass`, `.conditional-edge--condition-fail`, `.conditional-edge--unselected-option-dim`.

- **Migration step** — NONE.

- **What it leaves temporarily inconsistent** — `branch_locked` state becomes fully computable now, but the Phase 4 passive analysis (unreachable nodes in edit mode) is still missing. Nothing user-visible breaks from this.

- **What the next phase depends on from this phase** — `selectedOptionId` cleared on advance (needed for Phase 4's sandbox logic to re-evaluate cleanly). Edge `--condition-fail` class (needed for Phase 4 if passive warnings reuse the style).

- **Reference files needed** — listed in `ran_0303_phases.md`. Plus `ran_0303_phase_02.md` for the state enum. `conditionEvaluator.js` read-only for call-site verification.

- **Rollback cost if this phase fails** — **LOW.** The change is additive — `selectedOptionId` is a new field with no consumers outside Phase 3 code. Reverting the `computeReachable` signature change is mechanical. Reverting the `onNodeClick` change restores the old edge-find-by-target behaviour. The CSS additions are independent and do not affect Phase 2 visuals.

- **Hard stop triggers for this phase**
  - Advancing from a common node in campaign mode fails — no edges reachable. Stop, confirm the option-filter is gated on `activeNode` being a choice (see R-01).
  - Option click fires side effects twice (once on click, once on advance). Stop, audit the action ordering in `selectOption` and `advance`.
  - Sandbox-style flag mutation leaks: after an option click, `narrativeStore.flag[id].state` shows the post-click value. Stop, audit `selectOption` for any `updateFlag` call — must write only to `simulationStore.currentFlagValues`.
  - Legacy save with `optionId: null` edges on a choice node fails silently (no dev warning). Stop, add the dev-console warning per R-02 mitigation.

- **Acceptance Criteria — Done when:**
  - `simulationStore` exposes `selectedOptionId` state and `selectOption(optionId)` action.
  - Clicking an option on the active choice node during campaign: highlights that option, dims the others, fires the option's authored side effects, recomputes reachable edges to only those matching the selected option's handle.
  - Advancing along a reachable edge from a choice node moves to the next node and clears `selectedOptionId`.
  - Non-choice active nodes behave identically to Phase 2 (no option filter applied).
  - Edges show `--condition-pass` / `--condition-fail` / `--unselected-option-dim` states per the precedence order during campaign.
  - Multi-option → same-target edges (AR-15 case) route along the player's clicked option, not by first-found edge.
  - Exiting campaign clears `selectedOptionId` to `null`.
  - Grep confirms no direct mutation of `narrativeStore.flag` or `narrativeStore.status` from simulation actions.

- **Verification** — In edit mode, author a choice node with three options. Option A has `flags_set: [flag1]`. Option B has `status_set: [{statusId: hp, amount: -5}]`. Each option's source handle connects to a distinct common node. Enter campaign mode, advance to the choice node. Initially no option is selected — no outgoing edges should light up as `condition-pass`. Click Option A — it should highlight, the other two dim, Option A's outgoing edge lights up, the flag value shifts. Click Option B instead — the highlight moves to B, A's edge un-highlights and dims, B's edge lights up. Click Option A's target node — the simulation advances along A's edge, `selectedOptionId` resets, the new active node shows only its own outgoing edges. Create two options on a choice node that both route to the same target — clicking each should respect the authored side effects of that specific option, not the other.
