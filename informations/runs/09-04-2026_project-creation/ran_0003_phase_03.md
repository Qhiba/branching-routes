# Phase 03 — Graph Canvas & Base Node/Edge Rendering

## Goal
Render a working, interactive React Flow canvas that reads from the graph store, supports adding/deleting/connecting nodes via the UI, and applies correct visual state classes. This is the core interactive surface.

## Produces
- `src/components/GraphCanvas.jsx`
- `src/components/nodes/StoryNode.jsx`
- `src/components/edges/ConditionalEdge.jsx`
- `src/components/TopBar.jsx` (initial structure; simulation controls are stubs)
- `src/App.jsx` (updated to wire real components)

## Dependencies Required Before This Phase
- Phase 01 complete (scaffold, styles)
- Phase 02 complete (`graphStore`, `simulationStore` exist and are functional)

## Reference Documents
- `ran_0003_architecture.md` — AR-03 (state in stores), AR-04 (no component mutation), AR-05 (single source of truth)
- `ran_0003_datamodel.md` — Node, Edge entity shapes
- `ran_0003_filemap.md` — `GraphCanvas`, `StoryNode`, `ConditionalEdge`, `TopBar`
- `ran_0003_risks.md` — RISK-04 (visual spaghetti — use smoothstep edges + grid background)

## Steps

### 1. `src/components/nodes/StoryNode.jsx`

Custom React Flow node. Receives `data` prop (the node's data object from the store, spread into React Flow's `data` field).

Display:
- Node `label` as a heading
- Truncated `content` preview (max 2 lines, CSS `-webkit-line-clamp`)
- Side effect count badge if `sideEffects.length > 0` (e.g., "2 effects")
- React Flow `Handle` components on left (target) and right (source) for connecting edges

Visual state classes derived from `simulationStore` using **targeted selectors only** (wrap with `React.memo` — RISK-01 mitigation):
- `.story-node--active` when `activeNodeId === id`
- `.story-node--visited` when `visitedNodeIds.includes(id)`
- `.story-node--reachable` when `reachableNodeIds.includes(id)` (and not active)

CSS token usage: background uses `--color-bg-elevated`, border uses `--color-accent` (active state), handle circles use `--color-accent`.

### 2. `src/components/edges/ConditionalEdge.jsx`

Custom React Flow edge using `BaseEdge` + `EdgeLabelRenderer` from React Flow.

Display:
- Edge `label` inline on the edge path (centered)
- Condition badge: small pill showing `AND` or `OR` if `condition !== null`

Visual state classes (targeted selectors, `React.memo`):
- `.conditional-edge--traversed` when `traversedEdgeIds.includes(id)`
- `.conditional-edge--reachable` when `reachableEdgeIds.includes(id)`

Edge type: `smoothstep` (default in React Flow config — RISK-04 first mitigation).

### 3. `src/components/GraphCanvas.jsx`

React Flow canvas wrapper. Responsibilities:
- Pull `nodes` and `edges` from `graphStore`, transform into React Flow format:
  ```js
  // Each node:
  { id, type: 'storyNode', position, data: { ...nodeData } }
  // Each edge:
  { id, source: sourceId, target: targetId, type: 'conditionalEdge', data: { ...edgeData } }
  ```
- Register custom types: `nodeTypes = { storyNode: StoryNode }`, `edgeTypes = { conditionalEdge: ConditionalEdge }`
- Handle `onNodeClick`: call `graphStore.selectNode(id)`; if simulation running and node is reachable, delegate to a local helper that finds the edge and calls `simulationStore.advance(edgeId)` (simulation advance is wired here but simulation UI lives in Phase 05)
- Handle `onEdgeClick`: call `graphStore.selectEdge(id)`
- Handle `onConnect`: call `graphStore.addEdge(source, target)`
- Handle `onPaneClick` (click on empty canvas): call `graphStore.clearSelection()`
- Handle `onNodeDragStop`: call `graphStore.updateNode(id, { position })` to persist canvas position back to store
- Double-click on canvas pane: call `graphStore.addNode(position)` at the click coordinates (use React Flow's `screenToFlowPosition`)
- Simulation mode class (`.simulation-mode`) applied to canvas wrapper div when `simulationStore.isRunning` (RISK-05 mitigation — CSS-only enforcement of locked drag)
- React Flow configuration:
  - `defaultEdgeOptions={{ type: 'conditionalEdge' }}`
  - `<Background variant="dots" gap={16} />` (grid — RISK-04 second mitigation)
  - `<Controls />` (zoom in/out/fit)
  - `<MiniMap />` (optional but valuable for larger graphs — include)

When `.simulation-mode` is active: CSS must set `pointer-events: none` on the drag handles of nodes and disable the connect line, but keep `pointer-events: auto` on the node bodies (for advancing simulation by click).

### 4. `src/components/TopBar.jsx` (initial)

Horizontal bar with:
- Left: App title "Branching Routes" (text, not a logo)
- Centre: Project title (editable `<input>` bound to `graphStore.meta.title` via `updateMeta` action — add this action to `graphStore`)
- Right: Three buttons — **New**, **Open**, **Save** (all wired in Phase 06, placeholder `onClick` console.log for now) + **Start Simulation** button (wired in Phase 05, stub for now)

### 5. Wire `src/App.jsx`
Replace placeholder regions with:
```jsx
<header><TopBar /></header>
<main><GraphCanvas /></main>
<aside><Sidebar /></aside>  {/* Sidebar is a stub div until Phase 04 */}
```

CSS Grid layout:
```css
.app {
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 320px;
  height: 100vh;
}
header { grid-column: 1 / -1; }
main   { overflow: hidden; }
aside  { overflow-y: auto; border-left: 1px solid var(--color-bg-elevated); }
```

## Acceptance Criteria
- Done when:
  - Double-clicking the canvas adds a visible node
  - Dragging from one node's handle to another creates an edge with the correct `smoothstep` curve
  - The canvas shows a dot grid background
  - Clicking a node highlights it (a styled selection ring, not a browser blue outline)
  - No console errors

## Verification
1. Run `npm run dev`
2. Double-click the canvas three times — three nodes appear
3. Drag from the right handle of Node 1 to the left handle of Node 2 — a curved edge appears
4. Click Node 1 — it shows a visual selection state
5. Open DevTools Console — zero errors

## Next Phase Dependency
Phase 04 requires a functioning canvas and selection system (`selectedNodeId`, `selectedEdgeId` in `graphStore`) to know which entity the Sidebar inspector should display.
