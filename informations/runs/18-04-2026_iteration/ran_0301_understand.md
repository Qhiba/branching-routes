# Behavioral Map: Simulation Engine & Canvas

## 1. What It Does Now
The Canvas (`GraphCanvas.jsx` and `nodes/edges` components) renders the canonical graph structure (`common`, `choice`, `ending`, `edges`) onto an interactive React Flow canvas. It translates canonical data into React Flow nodes and edges, handles dragging nodes (syncing `position` back to the store), pane clicks to add nodes, and connection dragging to create edges. Notably, it stamps connections originating from a choice option with the corresponding `optionId` to support per-option routing.

The Simulation Engine (`simulationStore.js`) manages an isolated live-play view of the graph context. On `start()`, it pulls initial flag and status default values. It determines reachability iteratively: the `activeNodeId` computes its outgoing edges and evaluates their `condition` properties against the `currentFlagValues` using `utils/conditionEvaluator.js`. Upon `advance(edgeId)`, it moves the active state to the destination node and applies any `flags_set` and `status_set` state mutations authored on that node.

The Canvas subscribes to the simulation state to dynamically apply CSS classes (`--active`, `--reachable`, `--visited`) to nodes and edges. It intercepts clicks during simulation runs to trigger the `advance(edgeId)` action instead of selecting the node for inspection.

## 2. Input / Output Contract
**Canvas (`GraphCanvas.jsx`)**
- **Input:** Canonical narrative state (`common`, `choice`, `ending`, `edges`) via `useNarrativeStore`. UI state (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`, `choiceDisplayMode`) via `useUIStore`. Simulation state bounds via `useSimulationStore`. User pointer events.
- **Output:** Store mutation actions (`addNode`, `addEdge`, `updateNode`, `selectNode`, `selectEdge`, `clearSelection`, `advance`).
- **Format:** React component returning React Flow context; mutates via functional Zustand calls.

**Simulation Engine (`simulationStore.js`)**
- **Input:** `start()`, `advance(edgeId)`, `reset()`. Reads current graph topology statically via `useNarrativeStore.getState()` directly to avoid reactivity loops.
- **Output:** Managed isolated state: `isRunning`, `activeNodeId`, `visitedNodeIds`, `traversedEdgeIds`, `currentFlagValues`, `reachableNodeIds`, `reachableEdgeIds`.
- **Format:** Bound Zustand states updated via internally derived `set()` calls.

## 3. Full Dependency Map
**`src/store/simulationStore.js`**
- **Upstream:** `TopBar` (start/stop buttons), `GraphCanvas` (click to advance node), `CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge` (reads derived visual state).
- **Downstream:** `narrativeStore` (read canonical data), `utils/conditionEvaluator.js` (reachability logic).
- **Breakage if changed:** Visual highlights in the canvas crash; gameplay simulation feature breaks entirely.

**`src/components/GraphCanvas.jsx`**
- **Upstream:** `App.jsx` (parent container).
- **Downstream:** `@xyflow/react`, `useNarrativeStore`, `useUIStore`, `useSimulationStore`, custom React Flow node/edge renderers.
- **Breakage if changed:** Graph is no longer interactive, nodes cannot be added or dragged; edge connections fail.

**Node / Edge Renderers (`CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge`)**
- **Upstream:** `GraphCanvas.jsx` (mounts them via ReactFlow).
- **Downstream:** `useSimulationStore` (for CSS states), `useNarrativeStore` & `useUIStore` (ChoiceNode only).
- **Breakage if changed:** Visual canvas presentation breaks.

**`src/utils/conditionEvaluator.js`**
- **Upstream:** `simulationStore.js` (for computeReachable).
- **Downstream:** None (pure functions).
- **Breakage if changed:** Routing logic falsifies conditions, making valid paths unreachable or invalid paths traversable.

## 4. Implicit Assumptions
- **First Reachable Edge Picking:** In `GraphCanvas.jsx:119`, when clicking a reachable node during simulation, it uses `storeEdges.find()` to select the *first* edge connecting the active node to the clicked node. If multiple option handles point to the identical target node (valid via AR-15), the simulation blindly advances using the first one found in the edges array, which might execute incorrect side-effects on entry. [OBSERVATION]
- **UUID Prefixes:** `GraphCanvas` explicitly assumes option IDs begin with `"opt-"` to determine whether an edge needs an option stamp (`params.sourceHandle.startsWith('opt-')`). [OBSERVATION]
- **State Read Isolation (LBA-01):** `simulationStore` assumes that calls to `useNarrativeStore.getState()` mid-evaluation are safe and preferable to subscribing to the graph, decoupling authored edits from the active simulation run.
- **Start Node Exclusivity:** `start()` assumes there is exactly one node with `isStartNode: true` and will throw a fatal error if none exists.
- **Layout Tidy Binding:** The canvas listens to an event listener string `'graph-layout-tidy'` rather than a standard store action to run the `fitView` padding adjustment after Dagre calculations. [OBSERVATION]

## 5. Change Surface
If the Canvas / Simulation system is modified, the following are affected:
- **Input Contract:** How React Flow nodes extract configuration (e.g. `choiceDisplayMode`).
- **Output Contract:** Parameters for `advance(edgeId)` or edge connection handlers.
- **Side Effects:** How flag values accumulate over simulation runs or how `GraphCanvas` stamps `optionId` onto edges.
- **Data model fields:** Nothing persistent defaults from simulation, but positional metrics rely tightly on `GraphCanvas` sync.
- **Entity ID format:** Changes to handle IDs impact `onConnect`.

## 6. Persistence Inventory
Since `simulationStore` runs entirely ephemerally (AR-08), it persists nothing. The canvas manages node metadata specifically related to React Flow.

**`position` (Node positional coordinates)**
- **Where it is written:** `GraphCanvas.jsx` > `onNodeDragStop` (line 172)
- **Where it is read back:** `GraphCanvas.jsx` > `derivedNodes` memoization (lines 60, 68, 75)
- **Storage layer:** `narrativeStore` (updates via `updateNode`)
- **Current format:** Object `{ x: number, y: number }`
- **Is the key name itself persisted:** YES
- **Label:** MIGRATION REQUIRED

**`optionId` (Edge source handle linking)**
- **Where it is written:** `GraphCanvas.jsx` > `onConnect` (line 139)
- **Where it is read back:** `GraphCanvas.jsx` > `reactFlowEdges` memoization (line 99)
- **Storage layer:** `narrativeStore` (creates via `addEdge`)
- **Current format:** String UUID prefix (`"opt-{uuid}"`)
- **Is the key name itself persisted:** YES
- **Label:** MIGRATION REQUIRED

## 7. What Currently Works
- **Live State Decoration:** `GraphCanvas` successfully combines raw `narrativeStore` data with `simulationStore` overrides to map `--active`, `--visited`, and `--reachable` class names dynamically.
    - *Depends on:* Component re-renders on Zustand hooks inside individual nodes.
    - *Breakage:* Simulation runs without providing the player with visual feedback.
- **Pure Condition Routing:** `computeReachable` correctly parses the `flagState` mapping to allow routing based on nested `applyFlagsSet`/`applyStatusSet` operations during the `advance` cycle.
    - *Depends on:* `conditionEvaluator.js` remaining side-effect free.
    - *Breakage:* Simulation stops properly enforcing conditional routes.
- **Option ID stamping:** The `onConnect` property correctly delegates option linking logic back into `narrativeStore`.
    - *Depends on:* React Flow `params.sourceHandle` validation.
    - *Breakage:* Multiple option handles collapse back down to single source rules, violating AR-15 and breaking feature intent.
- **Simulation/Editor Isolation:** Double clicking or dragging the canvas during simulation does not mutate the `graphStore`.
    - *Depends on:* Guard clauses stopping mutations via `isRunning` flags.
    - *Breakage:* `graphStore` inadvertently gets dragged or manipulated mid-simulation, corrupting narrative source data.
