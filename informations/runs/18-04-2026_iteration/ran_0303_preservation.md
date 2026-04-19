# 5. Preservation Plan

## PROTECTED items

No items were labelled PROTECTED in `ran_0302_scope.md` after the user acknowledged Option ID stamping. The PROTECTED status remains for **architecture-rule invariants** that were not directly in the Section 7 list but apply transitively:

### AR-05 — Single Source of Truth
- **Preservation:** No new store is created. `narrativeStore` remains the canonical graph owner. All new state additions land in `simulationStore` which reads `narrativeStore` via `getState()` only.
- **Confirmation:** Grep-check after each phase — no new Zustand `create(...)` calls outside `simulationStore.js`, `narrativeStore.js`, `uiStore.js`. Export round-trip (import then export a save file) produces a byte-identical `schemaVersion: 4` payload.

### AR-07 — Condition Evaluation in Evaluator
- **Preservation:** `conditionEvaluator.js` is not modified. All new condition checks (selected-option filter, passive reachability, sandbox re-evaluation) call `evaluateCondition` — none inline their own clause logic.
- **Confirmation:** Grep for `clauses` / `operator === 'AND'` / `operator === 'OR'` — must match only `conditionEvaluator.js` after each phase.

### AR-08 — Simulation Isolation
- **Preservation:** `simulationStore` never calls `narrativeStore` mutation actions. Sandbox overrides write only to `simulationStore.currentFlagValues`. `exitCampaign()` and `reset()` both produce clean state transitions. No simulation field is serialised to disk.
- **Confirmation:** Run an authored campaign end-to-end, exit campaign, export the save — the exported `flag` / `status` defaults must equal the pre-campaign values. Automated check: diff the `narrativeStore` state before and after a campaign run; must be identical except for explicit user authoring mutations.

### AR-11 — Side Effect Placement
- **Preservation:** Edges remain side-effect-free. Option side effects (`options[].flags_set` / `status_set`) continue to live on the option definition in `narrativeStore`, fired at option click by `simulationStore.selectOption()`. Node side effects continue to fire on entry via `advance()`. No side effects are added to edges.
- **Confirmation:** Grep edges for `sideEffects` / `flags_set` / `status_set` — must return no matches in `narrativeStore.js` edge-construction paths or in any edge-related code.

### AR-14 — Zustand Selector Stability
- **Preservation:** Every new selector added in phases 2–4 returns a primitive, an existing array reference (`state.foo`), or `undefined` / `null`. No selector returns `[]`, `{}`, or a newly-built object literal on miss. Components default outside the hook.
- **Confirmation:** After each phase, UI renders without infinite-loop crashes when the simulation store is empty (e.g., cold load of the app before entering campaign). Open any node inspector → should not trigger a re-render storm.

### AR-15 — Edge Uniqueness Tuple
- **Preservation:** `narrativeStore.addEdge()` duplicate-check logic is not touched. The new routing filter on the *read* side does not alter edge creation semantics.
- **Confirmation:** Author two options on the same choice node both pointing at the same target — both edges save successfully. Existing tuple check still rejects true duplicates.

---

## ACKNOWLEDGED RISK items

### Live State Decoration
- **Accepted impact:** The `--active` / `--visited` / `--reachable` CSS class vocabulary is being retired and replaced with a six-state enum plus a separate `--seen` overlay. Any user muscle memory tied to the old visuals breaks on Phase 2 ship.
- **Blast radius containment:**
  - The rename lands in a single phase (Phase 2) — no prolonged inconsistency window.
  - `--active` survives under the new enum (same class name, same semantic meaning for the currently focused node), reducing visual churn.
  - Old `--visited` / `--reachable` rules stay in `global.css` until Phase 2 swaps them out, so Phase 1 ships with zero visual change.
  - Rollback: if Phase 2 ships with a visual regression, reverting Phase 2 only restores the three-state model without touching the campaign-mode boundary from Phase 1.

### Pure Condition Routing
- **Accepted impact:** Reachable edges from a choice node now depend on `selectedOptionId`. If the player has not selected an option, the choice node shows no outgoing reachability. This is a semantic shift: "reachable" is now conditional on player intent, not just flag state.
- **Blast radius containment:**
  - Non-choice nodes (common / ending) preserve the old semantic exactly: all outgoing edges evaluated against flag state, no option filter.
  - The change lands in Phase 3 after the six-state enum is already proven — isolates routing semantics from visual refactor.
  - Rollback: Phase 3 is the smallest of the four phases; reverting restores the edge-find-by-target fallback used today.
  - `conditionEvaluator.js` is untouched — routing changes sit in the caller, not the evaluator.

### Simulation/Editor Isolation
- **Accepted impact:** The `isRunning` guard is being renamed and resemantic'd. Any external tooling or test hook relying on the exact string `isRunning` breaks.
- **Blast radius containment:**
  - All `isRunning` references are in a small surface: `TopBar.jsx`, `GraphCanvas.jsx`, `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`, `ConditionalEdge.jsx`, `simulationStore.js`. The rename is mechanical.
  - Phase 1 performs the rename atomically across all these files — no "partial rename" window.
  - Rollback: the rename is reversible by search-and-replace.

### Option ID stamping
- **Accepted impact:** `optionId` is promoted from a visual anchor to a routing key. The `"opt-"` prefix assumption at `GraphCanvas.jsx:139` becomes a correctness requirement, not just a visual nicety. Edges with a missing or mis-prefixed `optionId` that used to render correctly may now fail to route.
- **Blast radius containment:**
  - Edge creation is not touched — new edges stamp `optionId` exactly as they do today.
  - Phase 3 adds a defensive read: if the active choice node has no `selectedOptionId` set yet, fall through to "no edges reachable" rather than a legacy evaluate-all-outgoing. This is explicit, not silent.
  - Legacy save files where a choice node has edges with `optionId: null` (pre-options-feature saves) will surface via the Phase 4 passive reachability warnings — authors see the issue rather than silently failing during campaign.
  - Rollback: reverting Phase 3 restores edge-find-by-target advance, which ignores `optionId` entirely.
