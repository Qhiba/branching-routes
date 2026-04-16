## Part 1 — User fills

### What I am changing
Data Model, Condition Evaluation, Form Layer

### Why this needs to change
The current `flags[]` array needs to be refactored into distinct `flag{}` and `status{}` objects to better separate boolean flags from stateful statuses. Because of this structural change, the condition evaluator must be extended to support status-based conditions. Additionally, node side-effects will be updated to explicitly apply state changes using `flags_set[]` and `status_set[]`.

### New behavior after this push
Split `flags[]` into `flag{}` + `status{}`. Extend condition evaluator for status conditions. Side effects use `flags_set[]` + `status_set[]` on nodes.

### Accepted blast radius
**Simulation Sandbox Logic:**
**Inspector Binding:**

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/narrativeStore.js` | Replace `flags[]` with `flag{}` + `status{}` CRUD; update node side effect fields |
| MODIFY | `src/utils/conditionEvaluator.js` | Add status clause evaluation: `min`, `max`, range |
| MODIFY | `src/components/FlagManager.jsx` | Boolean flags only |
| ADD | `src/components/StatusManager.jsx` | Status point CRUD: name, value, minValue, maxValue |
| MODIFY | `src/components/NodeInspector.jsx` | `flags_set` + `status_set` UI |
| MODIFY | `src/components/EdgeInspector.jsx` | Condition builder with flag + status clause types |
| MODIFY | `src/components/Sidebar.jsx` | Add Status tab or section |
| MODIFY | `src/utils/fileSystem.js` | Export/import flag{} + status{} |
| MODIFY | `src/utils/index.js` | Re-exports |

### Assumptions I am making
It need a `migration` for `flags[]` → `flag{}` + `status{}`; side effect format changes from `sideEffects[]` to `flags_set[]` + `status_set[]`

---

## Part 2 — AI fills, user does not edit

### What must stay exactly the same
- **Simulation Sandbox Logic**: ACKNOWLEDGED RISK (User accepted changes to this behavior)
- **Inspector Binding**: ACKNOWLEDGED RISK (User accepted changes to this behavior)
- **Referential Integrity**: PROTECTED (Ensuring graph integrity on flag/status deletions must be preserved)

### Affected file list
- `src/store/narrativeStore.js`: CHANGES
- `src/utils/conditionEvaluator.js`: CHANGES
- `src/components/FlagManager.jsx`: CHANGES
- `src/components/StatusManager.jsx`: CHANGES
- `src/components/NodeInspector.jsx`: CHANGES
- `src/components/EdgeInspector.jsx`: CHANGES
- `src/components/Sidebar.jsx`: CHANGES
- `src/utils/fileSystem.js`: CHANGES
- `src/utils/index.js`: CHANGES
- `src/store/simulationStore.js`: MONITOR (Likely requires updates to read `flags_set` / `status_set` and test new condition clauses)
- `src/store/uiStore.js`: PROTECTED
- `src/utils/uuid.js`: PROTECTED
- `src/components/GraphCanvas.jsx`: PROTECTED
- `src/components/TopBar.jsx`: PROTECTED

### Migration flags
- `flags[]` conversion to `flag{}` + `status{}` in `narrativeStore` export/import: **MIGRATION REQUIRED** (User acknowledged)
- `node.data.sideEffects` conversion to `flags_set[]` and `status_set[]`: **MIGRATION REQUIRED** (User acknowledged)
- Edge `condition` structure update to support flag and status clause types: **MIGRATION REQUIRED**

### Suggested phase shape
- **Phase 1: State & Import/Export Data Model**
  Update `narrativeStore.js` to manage `flag{}` and `status{}` objects instead of an array. Add data migration steps in `fileSystem.js` for `.json` imports.
- **Phase 2: Conditions & Logic Update**
  Upgrade `conditionEvaluator.js` to evaluate new `min`, `max`, and range clauses for statuses alongside boolean checks for flags. Update referential integrity in `narrativeStore` for flag/status deletions.
- **Phase 3: UI & Form Layer Adaptation**
  Update inspectors (`NodeInspector`, `EdgeInspector`, `FlagManager`) to read/write the correct format. Add `StatusManager`. Ensure components bind accurately to the separated fields.
- **Phase 4: Simulation Hook-up (Monitor)**
  Monitor and adapt `simulationStore.js` so it processes new side-effect arrays (`flags_set` / `status_set`) appropriately during narrative execution.
