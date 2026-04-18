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

The canonical graph representation is the Zustand `narrativeStore`. It holds `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, and `meta`. The React Flow `nodes` and `edges` arrays are derived from the typed node sub-collections and re-synced on every store change. The JSON export/import format is the serialised form of `narrativeStore` state only.

**Rationale:** A single canonical store ensures every consumer reads the same data. Enumerating the full shape prevents drift between the rule and the implementation.

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

## AR-11 — Side Effect Placement

Side effects exist only on nodes. When the simulation advances along an edge, only the destination node's `sideEffects` fire upon entry. This must be enforced inside `simulationStore.advance()` and nowhere else. Edges carry no `sideEffects` field.

**Rationale:** The rule existed to manage execution order ambiguity caused by effects on both edges and nodes. Removing edge side effects eliminates the ambiguity entirely, so the ordering concern no longer applies.

---

## AR-12 — Node Type Structural Constraints

Ending nodes are stored in a dedicated ending{} sub-collection. Because they are structurally separated from connectable node types, narrativeStore.addEdge() must validate that the source ID does not belong to the ending collection and throw if it does. The UI must hide the outgoing handle on EndingNode to reinforce this at the interaction layer.

**Rationale:** The enforcement mechanism is the same but the lookup target changed — from a type field on a flat array entry to sub-collection identity.
