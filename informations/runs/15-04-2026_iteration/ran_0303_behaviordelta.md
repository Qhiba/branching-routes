# Behavior Delta — Push 4: Flag/Status Split + Condition Evaluator

## Current Behavior (Before)

- `narrativeStore` holds a single `flags[]` array containing both boolean and numeric variables under a unified schema: `{ id, name, type, defaultValue }`.
- Node side effects are stored as `data.sideEffects[]` on every node, with each item shaped as `{ flagId, operation, value }`. Supported operations: `set`, `add`, `subtract`.
- `conditionEvaluator.js` evaluates edge conditions using two functions: `evaluateClause(clause, flagState)` and `evaluateCondition(condition, flagState)`. Clauses are shaped as `{ flagId, comparator, value }` with standard operators (`==`, `!=`, `>`, `>=`, `<`, `<=`).
- `simulationStore` reads `currentFlagValues{}` (keyed by `flagId`) and applies side effects from `sideEffects[]` using the `applySideEffects()` helper.
- Import/export (`fileSystem.js`) reads/writes `flags: [...]` arrays in the JSON payload at `schemaVersion: 2`.
- `FlagManager.jsx` manages both boolean and numeric flags in a unified form (type selector: `boolean` / `number`).
- `EdgeInspector.jsx` builds conditions using `flagId` + `comparator` + `value` clause rows.
- `NodeInspector.jsx` manages side effects as `flagId` + `operation` + `value` rows.
- `Sidebar.jsx` has two tabs: **Inspector** and **Flags**.

---

## Target Behavior (After)

- `narrativeStore` replaces `flags[]` with two separate dictionaries: `flag{}` (boolean-only) and `status{}` (numeric, with optional `minValue`/`maxValue`). IDs use existing `f-` prefix for flags and new `sp-` prefix for statuses.
- Node side effects are replaced by two distinct arrays on each node: `flags_set[]` (list of flag IDs to toggle true) and `status_set[]` (list of `{ statusId, amount }` objects for delta operations).
- `conditionEvaluator.js` is extended to evaluate two clause types:
  - Flag clause: `{ id, flag, state }` — boolean equality check.
  - Status clause: `{ id, status, min?, max? }` — range check with optional bounds.
  - Recursive condition group: `{ operator, conditions[] }`.
- `simulationStore` applies `flags_set[]` and `status_set[]` when entering nodes. Condition evaluation uses the extended evaluator.
- Import/export emits `flag: {}` and `status: {}` at `schemaVersion: 3`. The importer handles `schemaVersion: 2` by transparently redistributing `flags[]` into the new `flag{}` and `status{}` collections.
- `FlagManager.jsx` is restricted to boolean flags only — no type selector.
- `StatusManager.jsx` (NEW) manages numeric status points with `name`, `value`, `minValue`, `maxValue`.
- `EdgeInspector.jsx` condition builder supports two clause types: flag clauses and status clauses.
- `NodeInspector.jsx` side effect section is replaced by `flags_set` (flag picker checkboxes or multi-select) and `status_set` (status + amount rows).
- `Sidebar.jsx` adds a third tab: **Status** (renders `StatusManager`).

---

## What Behavior Is Identical In Both

- Node CRUD (`addNode`, `updateNode`, `deleteNode`, `setStartNode`) — unchanged.
- Edge CRUD (`addEdge`, `updateEdge`, `deleteEdge`) — unchanged.
- Edge condition evaluation produces a `boolean` — the signature of `evaluateCondition` remains the same name and return type; only the internal clause shape changes.
- Simulation lifecycle (`start`, `advance`, `reset`) — unchanged structure; internal payload reading adapts.
- `uiStore` selection management (`selectedNodeId`, `selectedEdgeId`) — unchanged.
- Canvas rendering (all node/edge visual components) — unchanged.
- Referential integrity check on flag/status deletion — behavior preserved, extended to cover both collections.
- Name validation rule: alphanumeric + underscore only (AR-02) — unchanged.
- Graph import fallback logic for `schemaVersion: 1` — preserved and extended.
- File System Access API + `<a download>` fallback pattern — unchanged.
