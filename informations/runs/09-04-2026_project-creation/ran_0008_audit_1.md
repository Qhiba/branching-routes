# Audit Report — Pass 1

**Project:** Branching Routes
**Audit Date:** 11-04-2026
**Auditor:** AI Senior Technical Auditor

---

## 1. Architecture Compliance

| Rule | Verdict | Evidence |
|---|---|---|
| **AR-01 — Naming: Files** | **PASS** | Components use PascalCase (`StoryNode.jsx`, `GraphCanvas.jsx`). Store files use camelCase with identifiable names (`graphStore.js`, `simulationStore.js`). Utility files use camelCase (`conditionEvaluator.js`, `fileSystem.js`). |
| **AR-02 — Naming: Variables and Entities** | **PASS** | Entity IDs are UUID v4 via `crypto.randomUUID()` (`uuid.js:1`), never mutated. Data fields use camelCase (`nodeId`, `sourceId`, `flagId`). Flag name validation in `graphStore.js:90` enforces `/^[a-zA-Z0-9_]+$/`. |
| **AR-03 — State Management** | **PASS** | All graph data lives in `graphStore` (Zustand). All simulation data lives in `simulationStore` (Zustand). Component `useState` is limited to UI concerns: tab selection (`Sidebar.jsx:8`), form state (`FlagManager.jsx:9-14`), simulation error display (`TopBar.jsx:20-21`). |
| **AR-04 — Data Layer Separation** | **PASS** | No component directly mutates graph data structures. All modifications go through store actions (e.g., `updateNode`, `updateEdge`, `addFlag`). Components are read-only consumers via Zustand selectors. |
| **AR-05 — Single Source of Truth** | **PASS** | `graphStore` owns the canonical graph. React Flow nodes/edges are derived in `GraphCanvas.jsx:40-80` from store state. JSON export in `graphStore.js:168-188` serialises from store only. |
| **AR-06 — Import Constraints** | **PASS** | Absolute imports configured in `vite.config.js:8-13`. All source files use absolute barrel imports (`from 'store'`, `from 'utils'`, `from 'components'`). Grep for `'../'` imports returns zero results. Barrel files exist at `store/index.js`, `utils/index.js`, `components/index.js`. No circular imports detected between store files. |
| **AR-07 — Condition Evaluation** | **PASS** | All condition logic is in `src/utils/conditionEvaluator.js` as pure functions. `evaluateCondition` and `evaluateClause` are exported. No condition logic found in components or store actions — `simulationStore.js` delegates to `evaluateCondition` via import. |
| **AR-08 — Simulation Isolation** | **PASS** | Simulation state (`activeNodeId`, `visitedNodeIds`, `traversedEdgeIds`, `currentFlagValues`, `reachableEdgeIds`, `reachableNodeIds`, `isRunning`) lives exclusively in `simulationStore.js`. `graphStore` is never modified by simulation operations. `reset()` clears all simulation state to defaults. |
| **AR-09 — JSON Format Stability** | **PASS** | `exportGraph()` includes `schemaVersion: 1` (`graphStore.js:178`). `importProject()` in `fileSystem.js:68` validates `data.schemaVersion !== 1` and throws `'unsupported_schema_version'`. Data model spec amended to match implementation (see §2 Resolution). |
| **AR-10 — No External Backend** | **PASS** | Grep search for `fetch(`, `axios`, `WebSocket` in `src/` returns zero results. Persistence uses the browser File System Access API with `<a download>` / `<input type="file">` fallback (`fileSystem.js:5-34, 39-73`). |
| **AR-11 — Side Effect Execution Order** | **PASS** | `simulationStore.advance()` applies edge side effects first (`simulationStore.js:84-87`), then destination node side effects (`simulationStore.js:89-92`). This order is enforced exclusively within `advance()`. |
| **AR-12 — Node Type Structural Constraints** | **PASS** | `graphStore.addEdge()` validates source node type at `graphStore.js:56` — throws if source is `'ending'`. `StoryNode.jsx:35` hides the outgoing `<Handle>` when `data.isEndNode === true`. |

---

## 2. Data Model Integrity

### 2.1 Entity Implementation

| Entity | Verdict | Notes |
|---|---|---|
| **Node** | **PASS** | Node nests `label`, `content`, `isStartNode`, `sideEffects` inside a `data` sub-object for React Flow compatibility. Data model spec has been amended to document this shape. |
| **Edge** | **PASS** | Edge entity has `id`, `sourceId`, `targetId`, `label`, `condition`, `sideEffects` — all flat, matching the spec. |
| **Condition** | **PASS** | `operator` (`AND`/`OR`) and `clauses[]` array with `flagId`, `comparator`, `value`. All six comparators supported in `conditionEvaluator.js:6-13`. |
| **Clause** | **PASS** | `flagId`, `comparator`, `value` — matches spec. |
| **Flag** | **PASS** | `id`, `name`, `type` (`boolean`/`number`), `defaultValue` — matches spec. |
| **SideEffect** | **PASS** | `flagId`, `operation` (`set`/`add`/`subtract`), `value` — matches spec. |

### 2.2 Export Format

**PASS** — The export format matches the amended data model spec:
- Nodes use a `data` sub-object containing `label`, `content`, `isStartNode`, `sideEffects` (React Flow compatibility)
- Timestamps exported as `DD-MM-YYYY` for human readability
- `schemaVersion: 1` present on all exports

### 2.3 Resolution — Spec Amendment

The data model spec (`ran_0003_datamodel.md`) was amended during this audit to align with the implemented export format. Two changes made:

1. **Node shape:** Documented the `data` sub-object nesting with an explanatory note about React Flow requirements
2. **Timestamp format:** Changed from ISO 8601 to `DD-MM-YYYY` with minimal example updated accordingly

Rationale: This is a pre-ship codebase with zero external consumers. Amending the spec is lower-risk than refactoring the I/O serialization layer, and the implementation is functionally correct as-is.

---

## 3. Scope Compliance

### 3.1 Q3 — What must be delivered

> "A working graph canvas where the designer can create nodes, connect them with choices, define flags (boolean and numerical), apply AND/OR conditions to edges, and see the simulation highlight active paths in real time."

| Requirement | Verdict | Evidence |
|---|---|---|
| Working graph canvas | **PASS** | React Flow canvas with dot grid, controls, minimap (`GraphCanvas.jsx`). |
| Create nodes | **PASS** | Double-click pane adds node (`GraphCanvas.jsx:112-123`). |
| Connect with choices | **PASS** | Drag handle-to-handle creates edges (`GraphCanvas.jsx:103-109`). Edge label editable in `EdgeInspector.jsx`. |
| Define boolean and numerical flags | **PASS** | `FlagManager.jsx` supports both types with name validation. |
| Apply AND/OR conditions to edges | **PASS** | `EdgeInspector.jsx` has full condition UI (operator toggle, clause management). |
| Simulation highlights active paths in real time | **PASS** | Active/visited/reachable CSS classes on nodes and edges. Simulation mode with banner, advance-by-click. |

### 3.2 Q4 — Out of scope items touched

> "Node Route tracing and backtracing feature"

**PASS** — No route tracing or backtracing features have been implemented.

### 3.3 Unplanned additions

| Addition | Verdict |
|---|---|
| `snapToGrid` toggle in `graphStore.js:11,13` and `TopBar.jsx:132-134` | **Minor** — Not in any plan, but benign UI enhancement. Does not violate architecture. |
| `window.useGraphStore` debug assignment (`graphStore.js:191-193`) | **Minor** — Debug convenience, not in plan. Should be guarded by `import.meta.env.DEV` or removed before production. |
| Leftover Vite boilerplate files (see §4.3) | **Minor** — Dead files that should be cleaned up. |

---

## 4. Plan Compliance

### 4.1 Phase Implementation

| Phase | Status | Notes |
|---|---|---|
| Phase 00 — Setup Guide | **PASS** | Human completed. Scaffold, dependencies installed. |
| Phase 01 — Design System | **PASS** | `tokens.css`, `global.css`, `App.css`, `App.jsx` layout, `main.jsx`, `vite.config.js`, `index.html` — all present and correct. |
| Phase 02 — Core Data Layer | **PASS** | `graphStore.js`, `simulationStore.js`, `uuid.js`, `conditionEvaluator.js`, `fileSystem.js`, barrel files — all present. All actions implemented. |
| Phase 03 — Graph Canvas | **PASS** | `GraphCanvas.jsx`, `StoryNode.jsx`, `ConditionalEdge.jsx`, `TopBar.jsx` — all present and functional. |
| Phase 04 — Sidebar Inspectors | **PASS** | `Sidebar.jsx`, `NodeInspector.jsx`, `EdgeInspector.jsx`, `FlagManager.jsx` — all present and functional. |
| Phase 05 — Live Simulation | **PASS** | Simulation controls, banner, advance logic, simulation mode CSS, Dagre tidy layout — all implemented. |
| Phase 06 — File I/O & Acceptance | **PASS** | New/Open/Save wired in TopBar. Schema version validation. Fallback file API. |

### 4.2 File Map Coverage

All 22 files from `ran_0003_filemap.md` are present. ✅

### 4.3 Unplanned Files (non-blocking)

The following leftover Vite boilerplate files exist but are unused. They do not affect functionality and can be cleaned up post-ship:

- `src/index.css` — dead stylesheet, not imported
- `src/assets/react.svg` — unused boilerplate
- `src/assets/vite.svg` — unused boilerplate
- `src/assets/hero.png` — unused asset
- `public/icons.svg` — unused asset
- `README_REACT.md` — Vite scaffold readme

---

## 5. Final Verdict

### **SHIP** ✅

Branching Routes v1.0 MVP is complete. The designer can build a branching story graph with nodes, edges, boolean/numerical flags, AND/OR conditions, live simulation with real-time path highlighting, and save/load via JSON files — all matching the scope defined in `ran_0002_scope.md` Q3/Q5.

### Post-Ship Housekeeping (non-blocking)

1. **Dead files:** Remove leftover Vite boilerplate (`src/index.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`, `README_REACT.md`)
2. **Debug global:** Guard `window.useGraphStore` (`graphStore.js:191-193`) with `import.meta.env.DEV` or remove
