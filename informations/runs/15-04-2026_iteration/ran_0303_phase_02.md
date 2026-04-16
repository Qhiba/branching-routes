# Phase 2 — Condition Evaluator Extension

## Goal
Extend the pure condition evaluator to support the new typed clause schemas (flag clause and status range clause) and recursive nested condition groups, without changing its exported interface.

## What It Changes
- `evaluateClause(clause, flagState)`:
  - Detects clause type by key presence: `clause.flag` → flag clause; `clause.status` → status clause; `clause.operator` → recursive nested group.
  - Flag clause: checks `flagState[clause.flag] === clause.state` (boolean equality).
  - Status clause: checks `flagState[clause.status]` against `clause.min` (if present, `>=`) and `clause.max` (if present, `<=`).
  - Nested group: calls `evaluateCondition(clause, flagState)` recursively.
- `evaluateCondition(condition, flagState)`:
  - If `condition` is null → returns `true` (unchanged).
  - If `condition.conditions` is absent or empty → returns `true` (unchanged).
  - Iterates `condition.conditions[]` (renamed from `clauses`) using `operator` (`'and'` / `'or'`, lowercase).
  - `'or'` → `some()`, default (`'and'`) → `every()`.
- `src/utils/index.js`: re-verify `evaluateCondition` and `evaluateClause` exports are correct after rewrite.

## Produces
- `src/utils/conditionEvaluator.js` — modified
- `src/utils/index.js` — verified/modified if needed

## Migration Step
NONE — this file operates on runtime data only; no persisted keys change in this phase.

## What It Leaves Temporarily Inconsistent
- `simulationStore.js` will call the new evaluator, but still passes old-shaped flag state (array-sourced). Results may be incorrect for status conditions. Resolved by Phase 4.
- Edge condition UI in `EdgeInspector.jsx` still shows old clause shape inputs. Resolved by Phase 3.

## What the Next Phase Depends on From This Phase
- Phase 3 (UI): `EdgeInspector.jsx` uses `evaluateCondition`-compatible shapes when building clause objects.
- Phase 4 (simulation): `simulationStore` passes `flagState` keyed by flag/status IDs to the updated evaluator.

## Reference Files Needed
- `src/utils/conditionEvaluator.js` (current implementation)
- `src/utils/index.js` (current barrel)
- `ran_0303_migrationstrategy.md` (clause shape specification)
- `ran_0303_behaviordelta.md` (target behavior description)

## Rollback Cost If This Phase Fails
**LOW** — Only `conditionEvaluator.js` is changed. Reverting this single file restores all previous behavior. No store or UI files are touched.

## Hard Stop Triggers
- `evaluateCondition(null, {})` returns anything other than `true`.
- `evaluateCondition({ operator: 'and', conditions: [] }, {})` returns anything other than `true`.
- `evaluateCondition({ operator: 'or', conditions: [{ flag: 'f-x', state: true }] }, { 'f-x': false })` returns `true` (should be `false`).

## Acceptance Criteria
Done when: The evaluator handles all three clause types (flag, status, nested group) and the null/empty pass-through cases remain correct. The `evaluateCondition` and `evaluateClause` export names are unchanged.

## Verification
Open browser console after Phase 2. Run:
```js
import { evaluateCondition } from 'utils';
// Flag clause — false flag should block
evaluateCondition({ operator: 'and', conditions: [{ id: 'c1', flag: 'f-abc', state: true }] }, { 'f-abc': false });
// Expected: false

// Status clause — value in range should pass
evaluateCondition({ operator: 'and', conditions: [{ id: 'c2', status: 'sp-abc', min: 3 }] }, { 'sp-abc': 5 });
// Expected: true

// Null condition — always pass
evaluateCondition(null, {});
// Expected: true
```
All three must return the expected values.
