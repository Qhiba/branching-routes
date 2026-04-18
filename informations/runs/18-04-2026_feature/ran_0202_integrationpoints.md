# ran_0202_integrationpoints.md — Integration Points

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

## `narrativeStore.js` — Zustand canonical store

**What it currently does:**
Owns `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, and `meta`. Exposes CRUD for all entity types. `exportGraph()` serialises the full store. `loadGraph()` / `newGraph()` initialise all collections.

**How the new feature connects:**
- Six new actions are added (`addVariant`, `updateVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption`). All write through the same `set()` pattern as existing actions, patching `node.data` in the appropriate sub-collection.
- `addEdge` gains an optional third `optionId` argument, stamped on the edge when provided.
- `deleteFlag` and `deleteStatus` scan logic extended to cover new fields.

**What must not change in how it works:**
All existing action signatures, the referential-integrity return format from `deleteFlag`/`deleteStatus` (`{ blocked, references }`), the `schemaVersion: 4` export value (unless a v5 bump decision is made), the `uiStore` coordination on `deleteNode`/`deleteEdge`, the window debug hook.

---

## `uiStore.js` — UI state store

**What it currently does:**
Holds `selectedNodeId`, `selectedEdgeId`, `snapToGrid`. Provides selection management actions and a `toggleSnapToGrid` toggle.

**How the new feature connects:**
- Receives new state field `choiceDisplayMode` and `setChoiceDisplayMode` action. `ChoiceNode` reads this via a targeted selector to choose between compact and expanded rendering.

**What must not change in how it works:**
All existing state and actions unmodified. The new field is purely additive.

---

## `NodeInspector.jsx` — Node form panel

**What it currently does:**
Renders a form for the selected node: Label, Content, Path, Chapter, Start Node toggle, Set Flags (checkboxes), Status Modifiers (select + amount rows), Delete button. Derives `node`, `nodeType`, `flags`, `statuses`, `paths`, `chapters` from targeted store selectors.

**How the new feature connects:**
- `VariantEditor` is conditionally mounted below the existing sections when `nodeType === 'common'`.
- `OptionEditor` is conditionally mounted below the existing sections when `nodeType === 'choice'`.
- Both editors receive `nodeId` and their respective data arrays as props; they own their own store interactions internally.

**What must not change in how it works:**
Existing field order, handlers, and selectors. The `if (!node) return null` guard. Adding editor sections below — not replacing or reordering — existing fields.

---

## `EdgeInspector.jsx` — Edge form panel

**What it currently does:**
Renders a form for the selected edge: Label, Condition (operator + flag/status clauses), Delete button.

**How the new feature connects:**
- Reads `edge.optionId`. If present, performs a secondary lookup in `narrativeStore.choice[edge.sourceId].data.options` to find the option label, then renders a read-only field.
- Requires one new targeted selector: `useNarrativeStore(s => s.choice[edge.sourceId]?.data?.options ?? [])`.

**What must not change in how it works:**
Label editing, condition add/remove, clause editing, Delete behavior. The new display is purely read-only and additive.

---

## `ChoiceNode.jsx` — Canvas choice node renderer

**What it currently does:**
Renders the choice node with a single target handle (left), a single source handle (right), node header bar with `CHOICE` badge and outgoing-edge count, and body with label and content preview. Uses `React.memo` with targeted selectors.

**How the new feature connects:**
- Per-option source handles replace (or supplement with fallback) the single source handle.
- Option labels are rendered in the body.
- `choiceDisplayMode` from `uiStore` controls display density.

**What must not change in how it works:**
`React.memo` wrapping, simulation state CSS class logic, target handle, `outgoingEdgeCount` badge, class names `story-node choice-node`. The per-option handles use `handleId` to communicate option identity back to `GraphCanvas.onConnect`; this must be consistent.

---

## `GraphCanvas.jsx` — React Flow canvas wrapper

**What it currently does:**
Registers custom node/edge types, derives React Flow nodes from the three sub-collections, handles all canvas interactions (select, connect, drag, double-click-to-add). The `onConnect` handler calls `narrativeStore.addEdge(source, target)`.

**How the new feature connects:**
- `onConnect` receives `connection.sourceHandle` from React Flow when a drag originates from a named handle. If the `sourceHandle` value starts with `opt-`, the handler passes it as the `optionId` third argument to `addEdge`.

**What must not change in how it works:**
All other interaction handlers, simulation advance logic, custom type registration, CSS class application. The change to `onConnect` is a single additive guard — it must not alter behavior for edges that do not originate from option handles.

---

## `conditionEvaluator.js` — Pure condition evaluation

**What it currently does:**
Evaluates `{ operator, conditions[] }` objects against a `flagState` map. Used by `simulationStore`.

**How the new feature connects:**
`VariantEditor` and `OptionEditor` build `requires` objects in the same format. The evaluator is not called by this feature in this iteration (simulation of variants is out of scope). It is listed here because future phases will call it to activate variants.

**What must not change in how it works:**
Nothing. File is PROTECTED and not touched.

---

## `fileSystem.js` — Import/export and migration chain

**What it currently does:**
Validates `schemaVersion` (1–4), runs migration chains, wraps the File System Access API.

**How the new feature connects:**
`variants` and `options` are optional arrays in `node.data`. Absent fields default to `[]` at the UI layer, so no migration is required for correctness. A `schemaVersion: 5` migration pass (stamping `options: []` on all choice nodes and `variants: []` on all common nodes) is optional and deferred to Phase 1 decision.

**What must not change in how it works:**
Existing migration chain, version guard, fallback download logic.
