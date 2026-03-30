# System Reconstruction

### 1. What This System Is
This system is a web-based visual editor and simulator for creating complex branching narratives, such as visual novels, text adventures, or game dialogue trees. It allows writers and game designers to build a story using a directed graph interface, track and modify state (like boolean flags and numeric status points), and test their logic interactively using an integrated simulator. It solves the problem of organizing, visualizing, and debugging non-linear stories, ensuring that narrative requirements (conditions) don't result in dead ends or impossible routes.

### 2. Core Entities
- **Scenes**: Represents a narrative moment or a chunk of story text. Has `name`, `description`, conditional `variants` (for alternate text), `flags_set` / `status_set` (state mutations), and a `next` array defining routes to the succeeding nodes.
- **Choices**: Represents an interactive player decision point. Contains `text` and a list of `options`. Each option has a `label`, conditions (`requires`), state mutations (`flags_set`/`status_set`), and targets (`next`).
- **Endings**: Represents a terminal state or conclusion of a story route. Contains a `name` and conditional requirements (`requires`).
- **Flags**: Represents boolean state variables (true/false) used across the story. Contains `id`, `name`, and default `state`. Relates to Chapters and Paths for organization.
- **Status Points**: Represents numeric state variables (e.g., health, relationship score). Contains `id`, `name`, `value` (starting value), and `minValue`. 
- **Chapters**: Represents a high-level organizational structure or grouping for Scenes and Choices.
- **Paths**: Represents a mid-level organizational category for nodes and variables.
- **Quests**: Represents quest structures (schema not deeply detailed, but stored in the global state).

### 3. Core Operations
- **Node Graph Visualization**: 
  - *Trigger*: On load or when nodes/edges change.
  - *Step-by-step*: Calculates node positions automatically using Dagre or uses manual drag positions, feeds them to React Flow, and applies dynamic styling based on reachability and conditions limits.
  - *Produces*: A visual, interactive node canvas.
- **Story Simulation**:
  - *Trigger*: User clicks "Start simulation" with a chosen entry node.
  - *Step-by-step*: Evaluates conditions from the current node's requirements based on the active state context, displays valid forward routes or options, mutates state if transitions have `flags_set`/`status_set`, and logs a history stack.
  - *Produces*: Interactive preview interface and trace highlights on the graph.
- **Static Reachability Analysis**:
  - *Trigger*: On dependent state changes, conditions updates, or graph updates.
  - *Step-by-step*: Traverses the entire graph from the entry node calculating possible states to flag impossible branches or missing targets.
  - *Produces*: A warnings list (e.g., "Unreachable Nodes") overlaying the graph.
- **Data Persistence & Hydration**:
  - *Trigger*: App mount (load) and debounced editor changes (save).
  - *Step-by-step*: Reads/writes the full JSON state to local database instances securely via IndexedDB.
  - *Produces*: Ongoing persistent session state within the local browser.
- **JSON Import/Export**:
  - *Trigger*: User clicks Import or Export options in the top nav loop.
  - *Step-by-step*: For Export, constructs a JSON blob using the current state and triggers a browser download. For Import, reads a file, validates its schema, handles ID collisions, and overwrites the application state contexts.
  - *Produces*: A `.json` file containing the whole story tree data architecture.

### 4. Tech Stack
- **Language**: JavaScript (JSX/ES6+)
- **Framework**: React (v19.2.4)
- **Key Libraries**: 
  - `@xyflow/react` (v12.10.1): Renders the interactive node-based graph wrapper context.
  - `@dagrejs/dagre` (v2.0.4): Auto positions nodes with directed graph layout logic.
  - `localforage` (v1.10.0): Deals with browser-based client-side storage wrapping IndexedDB.
  - `lucide-react`: Lightweight SVG icon supplier.
- **Build Tool**: Vite (v8.0.1)
- **Persistence Layer**: Client-side IndexedDB database operations alongside localized manual file `.json` operations.

### 5. Entry Points
- **System Start**: The application logic bundles off starting at `index.html`, which triggers `src/main.jsx`, ultimately rendering the `<App />` component.
- **Data Entry**: Story nodes logic data enters primarily through user interactions via the UI (react forms, canvas dragging, sidebar buttons). It also enters when the user triggers a "JSON Import".
- **Data Exit**: State context data unloads out locally to an autosaving IndexedDB instance in `EditorContext.jsx`, or downloads manually when a user runs the export function to write a `.json` flatfile.

### 6. Configuration
- Configuration details are mainly maintained as hardcoded literals within internal application modules (`STORAGE_KEY = 'branching-routes-data'` in `EditorContext`).
- Auto-layout directions are instantiated via a state variable hook setup in `RouteViewer.jsx` (`layoutConfig`).
- App compilation configurations stay inside `vite.config.js` and `eslint.config.js`.
- There are no visible top-level environment configurations (`.env`), as it's fully client-sided rendering UI data structure.

### 7. Gaps and Unknowns
- **Quests Entity Concept (ASSUMED)**: The `quests` collections object exists mapped alongside other structural globals, but I couldn't observe actual user usages within `RouteViewer` or specific logic within contexts. I assumed it's still currently being created or has minimal surface coverage thus far.
- **Custom Theme Definition (UNCLEAR)**: Elements dynamically reference css properties (e.g., `var(--color-surface-panel)`). Yet the precise tokens matrix source from `src/index.css` is something that wasn't retrieved. Unclear exactly how extensive theme structures get compiled across the user interfaces natively.
- **focusNodeTrigger Flow Structure (ASSUMED)**: Found focus node hook logic existing explicitly in the graph window handler via `RouteViewer.jsx`, but the exact event invocation paths externally aren't entirely established for absolute certainty. Assumed it is executed dynamically when clients filter or identify structural items inside right or left sidebar containers.
- **sceneTypes Array Structure Array (ASSUMED)**: Found `sceneTypes` being structured in global context variables mapping into export configurations contexts, yet active implementation examples were missing within direct graph displays. Assumed these objects act functionally as an extensible node structure taxonomy categorizer property.
