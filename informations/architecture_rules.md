# Branching Routes — Architecture Rules

> **This file is the single source of truth for all architecture rules in this project.**
> All future work — iterations, refactors, new features — must reference and comply with these rules.

---

## AR-01 — Naming: Files

All component files use PascalCase (e.g., `NodeCard.jsx`). All store files use camelCase with a `store` suffix (e.g., `graphStore.js`). All utility files use camelCase with no suffix (e.g., `conditionEvaluator.js`).

**Rationale:** Consistent naming conventions make files immediately identifiable by their role (component vs. store vs. utility) without opening them.

---

## AR-02 — Naming: Variables and Entities

Graph entity IDs are UUID v4 strings generated at creation time and never mutated. Node data fields use camelCase (e.g., `nodeId`, `nodeLabel`). Flag/variable names defined by the designer must be alphanumeric + underscore only (validated on input).

**Rationale:** Immutable UUIDs prevent accidental ID collisions and referential integrity breakage. Restricted flag names avoid injection risks and ensure safe use in condition evaluation.

---

## AR-03 — State Management

All global application state (graph nodes, edges, flags, simulation state) lives exclusively in Zustand stores. React component local state (`useState`) is limited to UI-only concerns (e.g., modal open/closed, hover state) and must never hold graph data.

**Rationale:** A single state management pattern prevents data duplication and makes the entire application state inspectable and serializable from one place.

---

## AR-04 — Data Layer Separation

No component file may directly mutate the graph data structure. All mutations must go through a Zustand store action. Components are read-only consumers of store state.

**Rationale:** Enforcing unidirectional data flow prevents scattered, hard-to-trace mutations and ensures all state changes are auditable through store actions.

---

## AR-05 — Single Source of Truth

The canonical graph representation is the Zustand `graphStore`. The React Flow `nodes` and `edges` arrays are derived from this store and re-synced on every store change. The JSON export/import format is the serialised form of `graphStore` state only.

**Rationale:** A single canonical source eliminates synchronisation bugs between the store, the canvas, and the saved file.

---

## AR-06 — Import Constraints

Absolute imports are resolved from `src/` (configured in `vite.config.js`). Barrel files (`index.js`) are used only at the top level of each directory (`components/`, `store/`, `utils/`). Circular imports between store files are forbidden.

**Rationale:** Absolute imports improve readability and refactoring safety. Barrel files simplify imports without creating deep re-export chains. Circular imports cause runtime errors in Zustand's module initialisation.

---

## AR-07 — Condition Evaluation

All condition logic (AND/OR flag evaluation for edges) must live in `src/utils/conditionEvaluator.js` and be pure functions: `evaluateCondition(condition, flagState) => boolean`. No condition logic may be embedded in components or store actions.

**Rationale:** Centralising condition logic makes it independently testable, prevents duplication, and ensures consistent evaluation semantics everywhere conditions are checked.

---

## AR-08 — Simulation Isolation

Simulation state (active node, traversed edges, current flag values mid-simulation) must live in a dedicated Zustand store (`simulationStore`) and must never pollute `graphStore`. Starting and stopping a simulation must reset `simulationStore` to a clean initial state.

**Rationale:** Isolation guarantees that running a simulation never modifies the designer's graph data. The graph is always in its "authored" state regardless of simulation activity.

---

## AR-09 — JSON Format Stability

The exported JSON structure is versioned via a top-level `"schemaVersion"` field (starting at `1`). Any breaking change to the data model increments this field. The import function must validate and reject files with an unrecognised schema version.

**Rationale:** Schema versioning enables safe evolution of the data format while preserving backward-compatible import of older files.

---

## AR-10 — No External Backend

This application makes zero network requests at runtime. No fetch, axios, or WebSocket calls are permitted in application code. All persistence is via the browser's File System Access API (`showSaveFilePicker` / `showOpenFilePicker`).

**Rationale:** The project is scoped as a fully offline, localhost tool. Eliminating network dependencies ensures the app works without internet access and avoids all privacy/data-residency concerns.

---

## AR-11 — Side Effect Execution Order

When the simulation advances along an edge, side effects must execute in this strict order: (1) edge `sideEffects` fire first (the consequence of the choice), then (2) destination node `sideEffects` fire (the consequence of entering the scene). This order must be enforced inside `simulationStore.advance()` and nowhere else.

**Rationale:** Deterministic execution order prevents subtle flag-mutation bugs. Centralising the logic in one function ensures the order cannot be accidentally violated by a UI change.

---

## AR-12 — Node Type Structural Constraints

A node of `type: 'ending'` must never be the `sourceId` of any edge. `graphStore.addEdge()` must validate this and throw if the source node is an ending node. The UI must also hide the outgoing handle on `EndingNode` to prevent accidental connection.

**Rationale:** Ending nodes are terminal by definition. Allowing outgoing edges from an ending node would create an impossible simulation state and confuse the designer.
