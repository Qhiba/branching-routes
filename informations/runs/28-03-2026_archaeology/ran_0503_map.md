# Structural System Map

### 1. Module Dependency Graph

*Note: Relative paths have been condensed to module names for readability.*

**src/main.jsx (Entry Point)**
  depends on: [react, react-dom, App, EditorContext]
  depended on by: []

**src/App.jsx (Core Shell)**
  depends on: [react, RouteViewer, EditorContext, useSimulator, ErrorBoundary, NavBar, LeftSidebar, RightSidebar, EditModal, SettingsModal, dependencyGraph, routeTracer]
  depended on by: [main.jsx]

**src/context/EditorContext.jsx (Global State Store)**
  depends on: [react, localforage, dependencyGraph, conditionUtils]
  depended on by: [main.jsx, App.jsx, RouteViewer, LeftSidebar, NodeInspector, ChapterManager, ChoiceEditor, EndingManager, FlagManager, PathManager, QuestManager, SceneEditor, StatusManager, useSimulator, nearly all Form/Modal components]

**src/hooks/useSimulator.js (Simulation Engine Logic)**
  depends on: [react, EditorContext, conditionUtils]
  depended on by: [App.jsx, Simulator, LeftSidebar, RightSidebar]

**src/components/routeviewer/RouteViewer.jsx (Graph Visualization)**
  depends on: [react, @xyflow/react, EditorContext, graphLayout, reachabilityAnalyzer, conditionUtils, SceneNode, ChoiceNode, EndingNode, lucide-react]
  depended on by: [App.jsx]

**src/components/simulator/Simulator.jsx (Simulator UI)**
  depends on: [react, lucide-react, SearchableDropdown, useSimulator, conditionUtils]
  depended on by: [LeftSidebar]

**src/utils/conditionUtils.js (Condition Evaluation Engine)**
  depends on: []
  depended on by: [EditorContext, useSimulator, RouteViewer, Simulator, dependencyGraph, graphLayout, reachabilityAnalyzer, routeTracer, ChoiceEditor, NodeInspector, RightSidebar, SceneEditor, various Forms and Modals]

**src/utils/graphLayout.js (Auto Layout Engine)**
  depends on: [@dagrejs/dagre, conditionUtils]
  depended on by: [RouteViewer]

**src/utils/reachabilityAnalyzer.js (Static Analyzer)**
  depends on: [dependencyGraph, conditionUtils]
  depended on by: [RouteViewer]

**src/utils/routeTracer.js (Path Tracing Engine)**
  depends on: [conditionUtils]
  depended on by: [App.jsx]

**src/utils/dependencyGraph.js (Graph Model Builder)**
  depends on: [conditionUtils]
  depended on by: [EditorContext, reachabilityAnalyzer, App.jsx]

**src/components/layout/LeftSidebar.jsx**
  depends on: [react, lucide-react, EditorContext, useLongPress, @dnd-kit/utilities, FlagForm, StatusForm, PathForm, ChapterForm, QuestForm, DynamicTracker, NodeInspector]
  depended on by: [App.jsx]

**src/components/layout/RightSidebar.jsx**
  depends on: [react, lucide-react, SimulatorPanel, SearchableDropdown, conditionUtils]
  depended on by: [App.jsx]

### 2. Data Flow Map

- **Data Entry**: 
  - User interacts with Forms/Modals (`SceneForm.jsx`, `ChoiceForm.jsx`, etc.) or drag-and-drops nodes on `RouteViewer.jsx`.
  - JSON File blob is parsed via `App.jsx` handles (Import). 
- **Data Transformation**: 
  - Input strings are sanitized (e.g., snake_case keys in contexts).
  - Conditions and nested requires structures are formatted through helper sets via `EditorContext.jsx` reducers/dispatch approximations.
  - Complex positional graph transformation occurs in `graphLayout.js` via `Dagre` before rendering to `ReactFlow`.
- **Data Storage**: 
  - **Memory Space**: Primary representation exists as massive centralized React state dictionaries (`scenes`, `choices`, `flags`, `statusPoints`) within `<EditorProvider>` (`EditorContext.jsx`).
  - **Client DB Shell**: State maps are continuously serialized via debounced persistence into the browser's `IndexedDB` handled by `localforage`.
- **Data Exit**:
  - Automatically flushed to IndexedDB on debounced intervals.
  - Exported forcefully as an explicit `.json` file download triggered within `App.jsx` (`handleExport`).

### 3. State Map

- **Editor Data (scenes, choices, flags, statusPoints, endings, paths, chapters, quests)**
  - *Holds it*: React Memory (`EditorContext.jsx`), browser persistence (`IndexedDB`).
  - *Written*: Debounced inside `EditorContext.js` through user CRUD actions in modal forms.
  - *Read*: Consumed globally via `useEditor()` hook by visualizer (`RouteViewer.jsx`), `Simulator.js`, and all UI forms.
  - *Consequence if lost*: Full project data is eradicated. Since it only lives locally on the client layer, manual `.json` exports are the only external safety nets.
- **Graph Visual State (Nodes, Edges, Zoom Panning)**
  - *Holds it*: Local React state bound to `@xyflow/react` instances inside `RouteViewer.jsx`.
  - *Written*: Node drag drops (`onNodeDragStop`) push to specific context position maps. Edge drops push logical routing connections back to context state variables.
  - *Read*: Read continuous per-frame by the ReactFlow instance.
  - *Consequence if corrupted*: Graph layout breaks or renders out of viewport. Users can trigger "Reset Layout" as a fallback.
- **Simulation Run State (currentNodeId, historyStack, active Flags/Statuses)**
  - *Holds it*: React Component Memory (`useSimulator.js`).
  - *Written*: Through linear interactions clicking choices or scene progressions inside `Simulator.jsx` or right sidebar overlays.
  - *Read*: Used by `Simulator.jsx` to render active logic routes, and dynamically alters node shading/colors within `RouteViewer.jsx`.
  - *Consequence if lost*: Active simulation run halts or resets; does not damage the underlying narrative data structurally.

### 4. Coupling Map

- **RouteViewer.jsx & EditorContext.jsx**
  - *Why*: RouteViewer visually renders direct schema objects managed completely by EditorContext. It assumes exact payload structures (e.g., `options`, `next`, `flags_set`) to formulate nodes and calculate edge mappings.
  - *What breaks*: Altering the story data model (e.g. changing `next` to `routes`) instantly breaks visual node generation and edge binding configurations inside ReactFlow mappings.
- **EditorContext.jsx & conditionUtils.js**
  - *Why*: Context uses utilities heavily to normalize, filter, and modify logical deep requirements structures directly within its CRUD hooks (`migrateRequires`, deleting cascading flags).
  - *What breaks*: Overhauling conditional structural paradigms breaks cascading deletion actions and legacy entity migrations inside the core provider loops.
- **Forms/Modals & EditorContext.jsx**
  - *Why*: Form validations and initial mounting shapes precisely mimic `EditorContext.jsx` data structures.
  - *What breaks*: Changing Editor object architectures (keys, types) breaks specific nested form component fields (like mapping over `flags_set`).

### 5. Isolation Map

- **src/utils/conditionUtils.js**
  - *Why*: A pure, stateless utility library designed solely for evaluating and transforming logical AST-like conditionals. It has zero external package imports and relies on nothing else in the application logic. 
  - ORPHAN: Relies on no other modules inside or outside the source schema.
- **src/utils/graphLayout.js**
  - *Why*: Highly focused algorithmic module. It accepts a raw dump of serialized nodes/edges, pipes it through isolated Dagre logic, and spits back populated node sets with X/Y locations. It doesn't query global states or directly invoke side-effects itself.
- **src/utils/routeTracer.js**
  - *Why*: Functional and deterministic pathfinder. Computes routes given fixed adjacency matrix and state constraints without polling React hooks or observing DOM structures.

### 6. External Dependencies Map

- **Browser IndexedDB API (via localforage)**
  - *What breaks*: If unavailable, private mode sweeps, or disabled natively by browsers, the editor defaults to only ephemeral memory, throwing away all node setups on hard refresh.
- **Client File System Operations (HTML5 download/upload logic)**
  - *What breaks*: If the environment fails filesystem access configurations logic (`URL.createObjectURL(blob)`, `FileReader()`), importing or exporting raw static JSON trees breaks, causing permanent data trapping.
- **@xyflow/react & @dagrejs/dagre ecosystem**
  - *What breaks*: If node structures drift between XYFlow component expectations and Dagre algorithmic capabilities, visual node graph processing halts, causing canvas crashes or total overlay failures.
- **Vite & React 19 Toolchains**
  - *What breaks*: Running this in environments omitting ES module capabilities or without Vite's particular JSX factory handlers leads to immediate fatal application build faults.
