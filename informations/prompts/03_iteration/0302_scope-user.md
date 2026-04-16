## ROLE
You are a behavioral analyst helping scope an iteration.
You translate the user's decisions into a technical foundation
for the plan.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the change must respect
4. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0301_understand.md` — current state map

## TASK
Read Part 1. Fill Part 2 based on the user's decisions cross-referenced
against the loaded files. Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely based on your reading of
> `ran_0301_understand.md`. Then feed this file to the AI.
> Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_iteration/ran_0302_scope.md`

---

## Part 1 — User fills

### What I am changing
Data Model, Condition Evaluation, Form Layer

### Why this needs to change
The current `flags[]` array needs to be refactored into distinct `flag{}` and `status{}` objects to better separate boolean flags from stateful statuses. Because of this structural change, the condition evaluator must be extended to support status-based conditions. Additionally, node side-effects will be updated to explicitly apply state changes using `flags_set[]` and `status_set[]`.

### New behavior after this push
Split `flags[]` into `flag{}` + `status{}`. Extend condition evaluator for status conditions. Side effects use `flags_set[]` + `status_set[]` on nodes.

### Accepted blast radius
<!-- Which dependencies from ran_0301 are you okay with changing —
even if they appear in the preservation list?
These are conscious decisions, not oversights. -->
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
<!-- Pull from Section 7 of ran_0301_understand.md.
Then cross-reference against "Accepted blast radius" in Part 1.
- Items NOT in the accepted blast radius → PROTECTED
- Items the user explicitly accepted → ACKNOWLEDGED RISK
Present the full list with each item labeled accordingly. -->

### Affected file list
<!-- Cross-reference the user's decisions against the dependency map
in ran_0301_understand.md. For each file state:
CHANGES / PROTECTED / MONITOR -->

### Migration flags
<!-- Cross-reference against the Persistence Inventory in
ran_0301_understand.md. For each risk or conflict raised by
the user's decisions:
- What the user decided
- Which behavior or persisted item it touches
- Flag as: MIGRATION REQUIRED / PROCEED WITH CAUTION / SAFE -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0303 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Rewire input handling without changing output format
- Phase 2: Update output format and all callers -->