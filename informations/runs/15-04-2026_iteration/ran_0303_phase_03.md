# Phase 3 — Form Layer UI Adaptation

## Goal
Update all inspector and manager components to read from and write to the new `flag{}` / `status{}` store shape, restore the form layer to a fully functional state, and introduce a new `StatusManager` component with its Sidebar tab.

## What It Changes
- **`FlagManager.jsx`**: Reads `Object.values(state.flag)` instead of `state.flags`. Calls `addFlag(name, state)` — no `type` selector (boolean only). Delete calls `deleteFlag(id)`. Name uniqueness check runs against `Object.values(flag).some(f => f.name === newName)`.
- **`NodeInspector.jsx`**: Side effects section completely replaced. Removed: `sideEffects[]` rows, operation selector, flag-type-based value input. Added: `flags_set` UI (list of flag checkboxes or multi-select from `flag{}`) and `status_set` UI (rows of status picker + numeric amount input). Calls `updateNode(id, { data: { ...data, flags_set: [...], status_set: [...] } })`.
- **`EdgeInspector.jsx`**: Condition clause rows updated. `addClause` creates a typed clause prompt (flag or status). Flag clause row: flag picker + boolean state toggle (true/false). Status clause row: status picker + min input (optional) + max input (optional). `condition.conditions[]` used throughout (not `clauses`). `operator` values are lowercase `'and'`/`'or'`.
- **`StatusManager.jsx`** *(NEW)*: Standalone CRUD panel for `status{}`. Lists `Object.values(state.status)`: name, value, minValue, maxValue. Add-status form: name (same validation), value (number), minValue (number or empty = null), maxValue (number or empty = null). Delete with referential integrity display pattern identical to `FlagManager`.
- **`Sidebar.jsx`**: Third tab **Status** added. Imports `StatusManager`. `activeTab` state includes `'status'` as valid value.
- **`src/components/index.js`**: Export `StatusManager` added.

## Produces
- `src/components/FlagManager.jsx` — modified
- `src/components/NodeInspector.jsx` — modified
- `src/components/EdgeInspector.jsx` — modified
- `src/components/Sidebar.jsx` — modified
- `src/components/StatusManager.jsx` — created
- `src/components/index.js` — modified (add StatusManager export)

## Migration Step
NONE — phase operates on runtime UI only. No persisted keys introduced.

## What It Leaves Temporarily Inconsistent
- `simulationStore` still applies old side effect format. Simulation will not apply `flags_set` / `status_set` during node traversal. Resolved by Phase 4.

## What the Next Phase Depends on From This Phase
- Phase 4 (simulation) depends on nodes having valid `flags_set[]` and `status_set[]` that can be edited via the UI. It does not depend on UI code directly — only on store data shape, which was already correct after Phase 1.

## Reference Files Needed
- `src/components/FlagManager.jsx` (current implementation)
- `src/components/NodeInspector.jsx` (current implementation)
- `src/components/EdgeInspector.jsx` (current implementation)
- `src/components/Sidebar.jsx` (current implementation)
- `src/components/index.js` (current barrel)
- `src/store/narrativeStore.js` (Phase 1 output — to verify store action signatures)

## Rollback Cost If This Phase Fails
**MEDIUM** — Five files changed. Reverting restores the Phase 1/2 state. The store and evaluator remain correct; only the UI regresses. The gap from Phase 1 (store changed, UI not updated) reopens temporarily.

## Hard Stop Triggers
- `FlagManager` renders an error or empty state when `flag{}` is populated.
- `NodeInspector` crashes when rendering a node created after Phase 1 (which has `flags_set`/`status_set` but no `sideEffects`).
- `EdgeInspector` crashes when rendering an edge with a v3-shaped condition.
- `StatusManager` renders but `addStatus` does not persist to `status{}` in the store.
- Referential integrity block does not trigger when deleting a flag/status that is in use.

## Acceptance Criteria
Done when: All three inspector panels render without crashes for any combination of node/edge selection. `FlagManager` and `StatusManager` successfully create, display, and delete their respective entity types with referential integrity enforced. `NodeInspector` side effect section shows `flags_set` and `status_set` editors. `EdgeInspector` condition builder supports both clause types. The Sidebar shows three tabs (Inspector, Flags, Status).

## Verification
Open the app. Perform the following actions in sequence:

1. **Status Tab**: Click the **Status** tab in the sidebar. Confirm it renders without crash.
2. **Add Status**: Add a status named `courage` with default value `0`. Confirm it appears in the Status list.
3. **Add Flag**: Go to Flags tab. Add a flag named `has_lantern`. Confirm it appears in the Flags list. Confirm **no Type selector is present** in the add form.
4. **Node side effects**: Double-click the canvas to create a node. Select it. In the Inspector, confirm the side effects section shows `flags_set` and `status_set` editors (not the old sideEffects rows).
5. **Apply flag**: In `flags_set`, select `has_lantern`. Confirm it saves (deselect + reselect node, value persists).
6. **Edge condition**: Connect two nodes. Select the edge. Click **Add Condition**. Confirm two clause types are available (flag clause and status clause).
7. **Delete blocked**: Set `courage` as a status clause on the edge. Attempt to delete `courage` from the Status tab. Confirm the deletion is blocked with the edge ID listed.
