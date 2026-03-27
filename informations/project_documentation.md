# Branching Routes — Project Documentation

---

## Purpose

Branching Routes is a local web application for authoring, visualizing, and testing branching narrative logic for interactive fiction and visual novel games. It provides a canvas-first visual editor where designers define scenes, choices, flags (boolean state variables), status points (numeric state variables), and endings, then connect them into a directed graph with conditional routing.

The core problem it solves: branching narratives grow in complexity exponentially. Manually managing flag dependencies across hundreds of nodes in raw JSON is error-prone, hard to visualize, and nearly impossible to test. Branching Routes acts as the single source of truth for a game's branching logic, offering:

- A node-graph canvas with drag-and-drop positioning and Dagre auto-layout
- Conditional routing with flag and status requirements at every connection
- A built-in simulator to walk through the story and verify reachability
- Route tracing (backtracking) to find all paths from the entry point to any node
- Static reachability analysis to detect structurally unreachable nodes
- JSON import/export for integration with external game engines

---

## Codebase Overview

### Repository Structure (File Tree)

```
branching-routes/
├── index.html                          # Vite entry point
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite configuration (React + Tailwind plugins)
├── eslint.config.js                    # ESLint flat config
├── .gitignore
├── README.md                           # Boilerplate Vite+React readme
├── public/
│   └── favicon.svg
├── dist/                               # Production build output
├── saved/                              # Example JSON project files
│   ├── example_main_structure.json
│   ├── the-letter.json
│   └── making-lovers.json
├── informations/                       # Design docs and specifications
│   ├── README.md                       # Documentation index
│   ├── project_overview.md             # Conceptual overview + data model
│   ├── project_documentation.md        # Primary project reference
│   ├── implementation_plan.md          # Data model overhaul phases (all implemented)
│   ├── ui_design-spec-phases.md        # UI/UX design system specs
│   ├── codebase_features.md            # Component-level feature reference
│   └── ui-prototype.html              # Legacy static HTML prototype
└── src/
    ├── main.jsx                        # React entry: StrictMode + EditorProvider
    ├── App.jsx                         # Root component: layout orchestration
    ├── index.css                       # Global styles + Tailwind theme tokens
    ├── context/
    │   └── EditorContext.jsx           # Central state management (React Context)
    ├── hooks/
    │   ├── useSimulator.js             # Simulation engine (walk through the story)
    │   └── useLongPress.js             # Long-press interaction hook
    ├── utils/
    │   ├── dependencyGraph.js          # Builds flag/status/navigation dependency graph
    │   ├── dependencyGraph.test.js     # Standalone Node test for dependencyGraph
    │   ├── routeTracer.js              # BFS backward traversal + path annotation
    │   ├── routeTracer.test.js         # Standalone Node test for routeTracer
    │   ├── graphLayout.js              # Dagre auto-layout + position-aware layout
    │   └── reachabilityAnalyzer.js     # Static analysis of structurally unreachable nodes
    └── components/
        ├── layout/
        │   ├── NavBar.jsx              # Top navigation bar with entity type tabs
        │   ├── LeftSidebar.jsx         # Entity browser, forms, dashboard, dynamic tracker
        │   ├── RightSidebar.jsx        # Simulator controls + route trace panel
        │   ├── NodeInspector.jsx       # Read-only inspector panels (Scene/Choice/Ending)
        │   └── forms/                  # Inline CRUD forms (Flag, Status, Path, Chapter, Quest)
        ├── routeviewer/
        │   ├── RouteViewer.jsx         # Main React Flow canvas (node graph editor)
        │   ├── SimulatorPanel.jsx      # Simulation UI within the canvas sidebar
        │   ├── InspectorPanel.jsx      # In-canvas node inspector
        │   └── nodes/
        │       ├── SceneNode.jsx       # Custom React Flow node for scenes
        │       ├── ChoiceNode.jsx      # Custom React Flow node for choices
        │       └── EndingNode.jsx      # Custom React Flow node for endings
        ├── modals/
        │   ├── EditModal.jsx           # Generic modal shell (create/edit)
        │   ├── SceneModalForm.jsx      # Scene create/edit form
        │   ├── ChoiceModalForm.jsx     # Choice create/edit form
        │   └── EndingModalForm.jsx     # Ending create/edit form
        ├── shared/
        │   ├── SearchableDropdown.jsx  # Virtualized searchable dropdown (react-virtuoso)
        │   ├── ConditionEditor.jsx     # Flag/status condition builder UI
        │   ├── DebouncedInput.jsx      # Debounced text input
        │   ├── DebouncedTextarea.jsx   # Debounced textarea
        │   ├── QuickNav.jsx            # Quick navigation widget
        │   └── ErrorBoundary.jsx       # React error boundary
        ├── simulator/
        │   └── Simulator.jsx           # Standalone simulator tab (legacy)
        ├── paths/
        │   └── PathManager.jsx         # Path entity management
        ├── scenes/
        │   └── SceneEditor.jsx         # Scene entity management
        ├── quests/
        │   └── QuestManager.jsx        # Quest entity management
        └── status/
            └── StatusManager.jsx       # Status point entity management
```

### Most Important Modules and Their Responsibilities

| Module | File(s) | Responsibility |
|--------|---------|----------------|
| **EditorContext** | `src/context/EditorContext.jsx` | Central state store. Manages all entities (flags, choices, scenes, endings, paths, chapters, status points, quests) as plain objects keyed by ID. Provides CRUD actions, auto-save to IndexedDB via `localforage`, import/export, and reference maps. Split into `DataContext` (reactive) and `ActionsContext` (stable callbacks). |
| **RouteViewer** | `src/components/routeviewer/RouteViewer.jsx` | Main canvas. Renders the node graph using `@xyflow/react` (React Flow). Handles node/edge CRUD via drag-and-drop, edge connections, Dagre auto-layout, simulation state visualization, route trace highlighting, and reachability warnings. |
| **useSimulator** | `src/hooks/useSimulator.js` | Simulation engine. Walks through the story graph by evaluating flag/status conditions at each step. Tracks history stack with undo support, derives active flag/status state, and computes visited nodes and taken edges for canvas highlighting. |
| **dependencyGraph** | `src/utils/dependencyGraph.js` | Builds a three-layer directed graph: flag dependencies (setters/getters), status dependencies (mutators/requirements), and navigation adjacency (forward/reverse edges). Pure function, no React dependency. |
| **routeTracer** | `src/utils/routeTracer.js` | BFS backward traversal from a target node to the entry node. Finds all valid paths, then annotates each path step with the required option pick, flags set, status changes, and condition satisfaction analysis. |
| **graphLayout** | `src/utils/graphLayout.js` | Converts editor data into React Flow `nodes` and `edges` arrays. Supports full Dagre layout (reset) and position-aware layout (preserves existing positions, Dagre only for new nodes). |
| **reachabilityAnalyzer** | `src/utils/reachabilityAnalyzer.js` | Static analysis that detects structurally unreachable nodes by checking if required flags can ever be set, if mutually exclusive flags are both required, and if status thresholds have any setter. |

### Coding Standards and Patterns

- **Component style**: Functional components with hooks throughout. Class components only for `ErrorBoundary`.
- **State management**: React Context with split data/actions pattern. `DataContext` provides reactive state; `ActionsContext` provides stable callback references (avoids unnecessary re-renders).
- **Ref pattern for stable closures**: Mutable refs (`useRef`) mirror every state slice to avoid stale closures in callbacks (`flagsRef`, `choicesRef`, etc.).
- **ID generation**: Prefixed sequential IDs (`S001`, `CH001`, `F001`, `E001`, `P001`, `C001`, `SP001`, `Q001`) with zero-padded 3-digit counters.
- **Name sanitization**: All entity names are lowercased, spaces replaced with underscores, non-alphanumeric characters stripped.
- **Pure utility functions**: `dependencyGraph.js`, `routeTracer.js`, `reachabilityAnalyzer.js` are pure functions with no React or side-effect dependencies.
- **Inline styles + Tailwind**: Components use Tailwind utility classes for layout and inline style objects for theme-sensitive values (using CSS custom properties from `index.css`).
- **CSS theme tokens**: Dark theme defined via Tailwind `@theme` block with semantic color tokens (`--color-surface-*`, `--color-text-*`, `--color-accent-*`, `--color-border-*`).
- **ESLint**: Flat config with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. Unused vars rule ignores uppercase/underscore prefixed identifiers.
- **No TypeScript**: The project uses plain JavaScript (`.jsx` / `.js`) with no type annotations.

### Testing Strategy

Tests are standalone Node.js scripts (not integrated with a test framework like Jest or Vitest). They inline the function implementations to avoid ESM/CJS module resolution issues.

- `src/utils/dependencyGraph.test.js` — Tests the dependency graph builder with a fixture containing flags, status points, choices, scenes, and endings. Validates flag setter tracking, status mutation tracking, and navigation adjacency (forward/reverse).
- `src/utils/routeTracer.test.js` — Tests BFS pathfinding (`findAllPathsTo`) and path annotation (`annotatePath`). Validates shortest-path ordering, option picking, flag/status annotation, condition satisfaction checks, and edge cases (empty path, single node, array-style `next`).

Run tests with:
```bash
node src/utils/dependencyGraph.test.js
node src/utils/routeTracer.test.js
```

Coverage is informal; there is no configured coverage tool. The test fixtures exercise core happy paths and key edge cases.

### Build and Release Process

- **Development**: `npm run dev` starts Vite dev server with HMR.
- **Build**: `npm run build` produces a static bundle in `dist/`.
- **Preview**: `npm run preview` serves the production build locally.
- **Lint**: `npm run lint` runs ESLint across the project.
- **No CI/CD**: There is no configured CI pipeline, automated testing, or release automation. Builds are manual.
- **No versioning**: `package.json` version is `0.0.0`. There is no git tagging or changelog discipline.

---

## Architecture and Design

The application follows a **single-page React architecture** with a three-column layout:

1. **Top Bar** — Project title, phase indicator, Reset/Import/Export controls
2. **NavBar** — Entity type tabs (Flags, Status, Choices, Scenes, Paths, Chapters, Quests, Endings) + Entry Node selector
3. **Body** — Three-panel layout:
   - **Left Sidebar** — Entity browser with CRUD forms, dashboard rows, dynamic tracker, and node inspector
   - **Center Canvas** — React Flow node graph with custom node types, edge connections, minimap, filter bar, and simulation controls
   - **Right Sidebar** — Simulator start/stop controls and route trace results

### Data Model

All data lives in `EditorContext` as plain objects keyed by entity ID:

| Entity | ID Prefix | Key Fields |
|--------|-----------|------------|
| Flag | `F` | `id`, `name` (snake_case), `state` (boolean) |
| Status Point | `SP` | `id`, `name`, `value` (number), `minValue` (number) |
| Choice | `CH` | `id`, `text`, `chapter`, `path`, `requires[]`, `options[]` |
| Scene | `S` | `id`, `name`, `description`, `variants[]`, `chapter`, `path`, `requires[]`, `next[]` |
| Ending | `E` | `id`, `name`, `requires[]`, `path`, `chapter` |
| Path | `P` | `id`, `name` |
| Chapter | `C` | `id`, `name` |
| Quest | `Q` | `id`, `name` |

**Choice options** have: `id`, `label`, `requires[]`, `flags_set[]`, `status_set[]`, `next[]` (array of `{ requires[], target }` conditional routes).

**Scene `next` routes** have: `_id`, `requires[]`, `target`.

### Condition System

Conditions are arrays of requirement objects. Each requirement is either:
- `{ flag: "F001", state: true }` — requires a flag to be true/false
- `{ status: "SP001", min: 5 }` or `{ status: "SP001", max: 10 }` — requires a status point to meet a threshold

Conditions can be applied at:
- Choice/Scene/Ending level (`requires` — node visibility gate)
- Choice option level (`requires` — option availability)
- Choice option `next` routes (`requires` — conditional routing)
- Scene `next` routes (`requires` — conditional routing)

### Persistence

Data auto-saves to IndexedDB via `localforage` with a 500ms debounce. On load, data is hydrated from IndexedDB. A migration function (`migrateOptionNext`) converts legacy string-format `option.next` to the current array-of-routes format.

---

## Modules and Responsibilities

### State Layer (`src/context/EditorContext.jsx`)

- **EditorProvider** — Root provider wrapping the app. Manages 8 entity collections, entry node, loading state, and focus triggers.
- **generateId(prefix, collection)** — Produces sequential IDs like `S001`, `CH012`.
- **sanitizeName(name)** — Normalizes entity names to `snake_case`.
- **migrateOptionNext(choices)** — Migrates legacy `opt.next: string` to `opt.next: [{ requires, target }]`.
- **CRUD actions** — `add*`, `update*`, `delete*` for each entity type. Deletion cascades to remove references from dependent entities.
- **getFlagReferenceMap() / getStatusReferenceMap()** — On-demand maps showing which entities reference each flag/status.
- **getDependencyGraph()** — Builds the full dependency graph on demand.

### Graph & Analysis Layer (`src/utils/`)

- **dependencyGraph.js** — Pure function `buildDependencyGraph(flags, statusPoints, choices, scenes, endings)` returns `{ flags, status, adjacency }`.
- **routeTracer.js** — `findAllPathsTo()` does BFS backward traversal with cycle detection and path limits (max 20 paths, max depth 50). `annotatePath()` determines which option/route is picked at each step and verifies condition satisfaction.
- **graphLayout.js** — Converts editor data to React Flow format. `computeLayout()` runs full Dagre. `computeLayoutWithPositions()` preserves existing positions and only Dagre-layouts new nodes.
- **reachabilityAnalyzer.js** — `analyzeReachability()` checks for: flags with no setters, mutually exclusive flag requirements, and status points with no mutators.

### Simulation Layer (`src/hooks/useSimulator.js`)

- Manages a `historyStack` of steps with flag/status deltas.
- Derives `activeState` (current flags and status values) by replaying the stack from the nearest snapshot.
- Snapshots are cached every 50 steps for performance.
- `passesRequires()` evaluates conditions against the active state.
- `handleOptionSelect()` applies flag/status changes and traverses to the next node.
- `handleSceneContinue()` finds the first valid route from a scene.
- Exposes `visitedNodeIds` and `takenEdgeIds` for canvas highlighting.

### UI Layer (`src/components/`)

- **Layout components** — `NavBar`, `LeftSidebar`, `RightSidebar` handle the top-level three-panel layout and navigation.
- **Canvas components** — `RouteViewer` wraps React Flow with custom node types (`SceneNode`, `ChoiceNode`, `EndingNode`), edge management, layout computation, and simulation/trace visualization.
- **Modal forms** — `EditModal` shells out to `SceneModalForm`, `ChoiceModalForm`, `EndingModalForm` for full entity editing.
- **Shared components** — `SearchableDropdown` (virtualized list), `ConditionEditor` (flag/status condition builder), `DebouncedInput`/`DebouncedTextarea`, `ErrorBoundary`.

---

## Data and Workflows

### Authoring Workflow

1. Create flags and status points to define the game's state space
2. Create scenes (narrative beats) and choices (decision points)
3. Connect nodes by wiring edges on the canvas or editing `next` routes in forms
4. Add conditional requirements to nodes and routes using the ConditionEditor
5. Set an entry node (starting point)
6. Run the simulator to verify story flow
7. Use route tracing to check if specific endings are reachable
8. Export to JSON for the game engine

### Simulation Workflow

1. Click "Start Entry Node" in the right sidebar or simulator panel
2. The simulator evaluates conditions at the current node
3. For scenes: click "Continue" to follow the first valid route
4. For choices: select an available option (conditions evaluated in real-time)
5. Flag and status state updates are applied and tracked
6. Undo step-by-step or stop and restart
7. Canvas highlights visited nodes (green), current node (cyan), and taken edges

### Route Trace Workflow

1. Select a node in the left sidebar or on the canvas
2. Click "Trace Route" in the right sidebar
3. The system finds all paths from the entry node to the target via BFS
4. Results show annotated steps: which option to pick, what flags/status changes occur
5. Multiple paths are ranked shortest-first; select between them
6. The traced path highlights in gold on the canvas

### Import/Export Format

Export produces a JSON file with structure:
```json
{
  "metadata": { "version": "1.0", "created_at": "...", "updated_at": "...", "entry_node": "S001" },
  "path": { "P001": { "id": "P001", "name": "common" } },
  "chapter": { "C001": { "id": "C001", "name": "chapter_1" } },
  "flags": { "F001": { "id": "F001", "name": "met_king", "state": false } },
  "choices": { ... },
  "scenes": { ... },
  "status": { "SP001": { "id": "SP001", "name": "strength", "value": 0, "minValue": -999999 } },
  "quests": { ... },
  "endings": { ... }
}
```

**Example files** are available in `saved/`:
- `example_main_structure.json` — Minimal structure example
- `the-letter.json` — Full example project
- `making-lovers.json` — Full example project

Import validates structure, checks for required `id` fields, warns on ID collisions, and merges into existing state.

---

## Setup and Configuration

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build config with `@vitejs/plugin-react` and `@tailwindcss/vite` plugins |
| `eslint.config.js` | ESLint flat config targeting `**/*.{js,jsx}`, extends recommended + react-hooks + react-refresh |
| `index.css` | Tailwind theme tokens (colors, fonts), global base styles, utility animations |
| `.gitignore` | Ignores `node_modules`, `dist`, `saved`, editor files, logs |

---

## Build, Run, and Test

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |
| `node src/utils/dependencyGraph.test.js` | Run dependency graph unit tests |
| `node src/utils/routeTracer.test.js` | Run route tracer unit tests |

---

## Dependencies and Tech Stack

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.4 | UI framework |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `@xyflow/react` | ^12.10.1 | Node graph canvas (React Flow) |
| `@dagrejs/dagre` | ^2.0.4 | Directed graph auto-layout |
| `tailwindcss` | ^4.2.2 | Utility-first CSS |
| `@tailwindcss/vite` | ^4.2.2 | Tailwind Vite plugin |
| `lucide-react` | ^0.577.0 | Icon library |
| `localforage` | ^1.10.0 | IndexedDB/localStorage abstraction for persistence |
| `react-virtuoso` | ^4.18.3 | Virtualized list rendering (SearchableDropdown) |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop core |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list extension |
| `@dnd-kit/utilities` | ^3.2.2 | DnD utilities |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^8.0.1 | Build tool and dev server |
| `@vitejs/plugin-react` | ^6.0.1 | React Fast Refresh for Vite |
| `eslint` | ^9.39.4 | Linter |
| `eslint-plugin-react-hooks` | ^7.0.1 | React hooks linting rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | React Refresh linting |
| `@eslint/js` | ^9.39.4 | ESLint recommended config |
| `globals` | ^17.4.0 | Global variable definitions for ESLint |
| `@types/react` | ^19.2.14 | React type definitions (editor support only) |
| `@types/react-dom` | ^19.2.3 | React DOM type definitions (editor support only) |

---

## Environment and Secrets

- **No environment variables** are used. The application runs entirely client-side.
- **No API keys, tokens, or secrets** are required or stored.
- **IndexedDB** (via `localforage`) stores project data locally in the browser under the database `branching-routes`, store `editor_data`.
- **No backend** — the app is a static single-page application.

---

## Versioning and Changelog

- Current version: `0.0.0` (pre-release)
- No git tags or formal versioning scheme
- The JSON export format uses `"version": "1.0"` in metadata
- No CHANGELOG file exists

---

## Deployment and Operations

- **Build output**: Static files in `dist/` (HTML, JS, CSS, assets)
- **Deployment**: Deploy `dist/` to any static hosting (Netlify, Vercel, GitHub Pages, etc.)
- **No server-side component**: The app is fully client-side
- **No CI/CD pipeline** configured
- **No Docker or containerization**

---

## Quality Assurance

- **Linting**: ESLint with react-hooks and react-refresh plugins. Run with `npm run lint`.
- **Testing**: Two standalone Node.js test scripts covering core utilities. No test framework integration.
- **Error handling**: `ErrorBoundary` component catches render errors in the canvas area. IndexedDB errors are silently caught. Import validation checks file structure and entity integrity.
- **No type checking**: The project uses plain JavaScript. `@types/react` is installed for editor IntelliSense only.
- **No E2E or integration tests**.

---

## Documentation and Comments

- **This file** serves as the primary project documentation.
- **`informations/`** directory contains:
  - `README.md` — Documentation index
  - `project_overview.md` — Conceptual overview
  - `implementation_plan.md` — Data model overhaul phases (all implemented)
  - `ui_design-spec-phases.md` — UI/UX specifications
  - `codebase_features.md` — Component reference
  - `ui-prototype.html` — Legacy prototype
- **`saved/`** directory contains example JSON files
- **Code comments** are used sparingly in utility functions and context logic (section dividers, migration notes).
- **JSDoc** is present on exported functions in `dependencyGraph.js`, `routeTracer.js`, and `reachabilityAnalyzer.js`.

---

## Contributing

No formal contributing guidelines exist. The project is a single-developer tool. If contributing:

1. Follow the existing code style (functional components, Tailwind + inline styles, snake_case entity names)
2. Run `npm run lint` before committing
3. Run the standalone test scripts to verify utility function changes
4. Test import/export round-tripping with the `saved/` example files

---

## Licensing

No license file is present in the repository. All rights reserved by default.

---

## Glossary

| Term | Definition |
|------|------------|
| **Flag** | A boolean state variable (e.g., `met_king: true/false`). Set by choice options, required by nodes/routes. |
| **Status Point** | A numeric state variable (e.g., `strength: 0`). Mutated by choice options with delta amounts. |
| **Scene** | A narrative beat with a name and description. Has conditional routes to other nodes. |
| **Choice** | A decision point offering multiple options. Each option can set flags, mutate status, and route to different nodes. |
| **Ending** | A terminal node representing a story conclusion. Has requirements but no outgoing edges. |
| **Path** | A named grouping for organizing nodes (e.g., "common", "romance_route"). |
| **Chapter** | A named grouping for organizing nodes by story progression. |
| **Quest** | A named grouping for tracking side objectives. |
| **Entry Node** | The starting node of the story graph. Must be set before simulation or export. |
| **Requires** | A condition array evaluated against current flag/status state. Determines if a node, option, or route is available. |
| **Route Trace** | BFS backward traversal finding all paths from entry to a target node, annotated with required choices and state changes. |
| **Reachability** | Whether a node can theoretically be reached given the graph structure and flag/status dependency constraints. |
| **Dagre** | A directed graph layout algorithm used for automatic node positioning. |
| **React Flow** | The `@xyflow/react` library providing the interactive node graph canvas. |

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Create your first entities:**
   - Open the **Flags** tab in the NavBar and add flags (e.g., `met_king`)
   - Open the **Scenes** tab and create a scene (e.g., `village_square`)
   - Open the **Choices** tab and create a choice (e.g., `talk_to_king`)
   - Add options to the choice, set flags, and wire `next` routes

4. **Connect nodes on the canvas:**
   - Drag from a node's handle (source) to another node's handle (target)
   - Or edit `next` routes in the modal forms

5. **Set an entry node:**
   - Use the "ENTRY NODE" dropdown in the NavBar to select a starting scene or choice

6. **Simulate:**
   - Open the right sidebar and click "Start Entry Node"
   - Walk through your story, make choices, and verify flag/status state

7. **Trace routes:**
   - Select any node, then click "Trace Route" in the right sidebar to find all paths from entry

8. **Export:**
   - Click "Export JSON" in the top bar to download the story data file

---

## Additional Documentation Notes

The following design documents are maintained separately in `informations/`:
- `project_overview.md` — Core architecture and data model concepts
- `implementation_plan.md` — Data model overhaul phases (all implemented)
- `ui_design-spec-phases.md` — Detailed UI/UX design system specifications
- `codebase_features.md` — Component-level feature reference

## Changelog Entry Template

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- Description of new features

### Changed
- Description of changed behavior

### Fixed
- Description of bug fixes

### Removed
- Description of removed features

### Technical
- Internal/refactoring changes
```
