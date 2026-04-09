# Phase 05 — Live Simulation (Live Checker)

## Goal
Implement the simulation mode where the designer can start a session, advance through the graph by clicking reachable nodes, and see paths highlight in real time as flags are applied. This is the core differentiating feature.

## Produces
- Wired simulation controls in `src/components/TopBar.jsx` (replacing Phase 03 stubs)
- Simulation mode banner component (inline in `GraphCanvas.jsx`)
- Visual simulation state CSS classes in all node and edge components (fully activated)
- Auto-layout action ("Tidy Layout" button in `TopBar`) using Dagre

## Dependencies Required Before This Phase
- Phase 01 complete (styles)
- Phase 02 complete (`simulationStore` implemented — `start`, `advance`, `reset` actions)
- Phase 03 complete (canvas ready; `GraphCanvas` has onClick wiring; visual state CSS classes already applied to `StoryNode` and `ConditionalEdge` — Phase 03 implemented the CSS classes but simulation wasn't running to trigger them)
- Phase 04 complete (`graphStore` has a start node set via `setStartNode`, flags exist, conditions are on edges)

## Reference Documents
- `ran_0003_architecture.md` — AR-03 (simulation state in `simulationStore`), AR-08 (simulation isolation)
- `ran_0003_datamodel.md` — SideEffect, Condition, Flag shapes
- `ran_0003_filemap.md` — `TopBar`, `GraphCanvas`, `StoryNode`, `ConditionalEdge`
- `ran_0003_risks.md` — RISK-01 (re-render performance), RISK-04 (visual spaghetti → auto-layout), RISK-05 (simulation mode UX)

## Steps

### 1. Wire simulation controls in `TopBar.jsx`

Replace the Phase 03 stubs with real logic:

- **Start Simulation** button:
  - Visible when `simulationStore.isRunning === false`
  - `onClick`: calls `simulationStore.start()`. Wrap in try/catch — if it throws (no start node), display an inline alert in the TopBar: "Set a Start Node first. Right-click a node → Set as Start Node."
  - Disable the button if there are zero nodes in `graphStore`

- **Stop Simulation** button:
  - Visible when `simulationStore.isRunning === true` (replaces Start button)
  - `onClick`: calls `simulationStore.reset()`

- **Simulation status indicator:**
  - When running: a small orange/amber dot + text "Simulation Active" to the left of the Stop button (reinforces RISK-05 mode clarity)

### 2. Simulation Mode Banner in `GraphCanvas.jsx`

Add an absolutely-positioned banner at the top of the canvas (inside the React Flow wrapper div) that appears only when `simulationStore.isRunning`:

```
⚡ Simulation Active — click a highlighted node to advance
```

Styled with `--color-active` background, dark text, full canvas width, `z-index: 10`. This banner is the primary RISK-05 mode indicator.

### 3. Simulation Advance Logic in `GraphCanvas.jsx`

The `onNodeClick` handler (from Phase 03) must be extended:

```js
const handleNodeClick = (event, rfNode) => {
  if (simulationStore.isRunning) {
    const { reachableNodeIds, reachableEdgeIds, edges } = simulationStore
    if (reachableNodeIds.includes(rfNode.id)) {
      // Find the edge connecting activeNode → this node
      const edge = graphStore.edges.find(
        e => e.sourceId === simulationStore.activeNodeId && e.targetId === rfNode.id
          && reachableEdgeIds.includes(e.id)
      )
      if (edge) simulationStore.advance(edge.id)
    }
    return  // Do not select node during simulation
  }
  graphStore.selectNode(rfNode.id)
}
```

Note: When `isRunning`, node clicks advance simulation. When not running, they select for editing. The two behaviours must never coexist.

### 4. `.simulation-mode` CSS in `GraphCanvas.jsx`

When `simulationStore.isRunning`, apply class `simulation-mode` to the top-level wrapper div of the canvas. CSS rules (in `global.css` or a canvas-specific stylesheet):

```css
/* Prevent node/edge drag and handle interactions in simulation mode */
.simulation-mode .react-flow__node { cursor: default; }
.simulation-mode .react-flow__node.story-node--reachable { cursor: pointer; }
.simulation-mode .react-flow__node-drag-handle { pointer-events: none; }
.simulation-mode .react-flow__handle { pointer-events: none; opacity: 0; }
.simulation-mode .react-flow__edge { pointer-events: none; }
/* Dim the TopBar file actions */
.simulation-mode header .file-actions { opacity: 0.4; pointer-events: none; }
```

### 5. Simulation State CSS Classes (fully activated)

In Phase 03 these classes were written but never triggered (simulation was not running). In Phase 05 they become live. Confirm the following visual states render correctly:

**`StoryNode.jsx` classes:**
- `.story-node` — default dark card
- `.story-node--active` — highlighted with `--color-active` border + subtle glow (this is where the simulation is currently at)
- `.story-node--visited` — muted, dimmed `opacity: 0.6`, greyscale tint
- `.story-node--reachable` — pulsing/animated border using `--color-reachable`, indicates "you can go here next"

**`ConditionalEdge.jsx` classes:**
- `.conditional-edge` — default faint edge
- `.conditional-edge--traversed` — solid colour `--color-visited` (you went this way)
- `.conditional-edge--reachable` — animated `--color-reachable` dashed stroke

`--color-reachable` animation: a subtle `@keyframes pulse-border` that cycles opacity between 0.6 and 1.0 over 1.2s. Defined in `global.css`.

### 6. Auto-Layout ("Tidy Layout") in `TopBar.jsx`

Install Dagre: `npm install dagre`

Add a **Tidy Layout** button to the TopBar (visible always, disabled during simulation). `onClick`:
1. Get `graphStore.nodes` and `graphStore.edges`
2. Build a Dagre directed graph and run `dagre.layout(g)` with `rankdir: 'LR'` (left-to-right preferred for narrative flow)
3. For each node, call `graphStore.updateNode(id, { position: { x: nodeWithPosition.x, y: nodeWithPosition.y } })`
4. Call React Flow's `fitView()` (use the `useReactFlow` hook inside `GraphCanvas` and expose a `triggerFitView` callback via a Zustand-managed flag or a custom event)

(RISK-04 mitigation — gives the designer a way to untangle visual spaghetti with one click)

## Acceptance Criteria
- Done when:
  1. Marking a node as Start Node, then clicking Start Simulation transitions the canvas to simulation mode
  2. The simulation banner appears across the canvas
  3. The start node glows with `--color-active` style
  4. Adjacent reachable nodes pulse with `--color-reachable` animation
  5. Clicking a reachable node advances the simulation to that node
  6. SideEffects on the entered node are applied (visible by checking `simulationStore.currentFlagValues` in console)
  7. An edge with `player_score >= 5` condition is NOT reachable when `player_score` defaults to `0`
  8. Stop Simulation resets all highlights
  9. Tidy Layout button rearranges nodes in a readable left-to-right flow

## Verification
1. Build a graph: 3 nodes, 1 flag (`player_score` number, default 0), Node 1 as start
2. Edge A: Node 1 → Node 2, condition: `player_score >= 5` (should be locked)
3. Edge B: Node 1 → Node 3, no condition (should be reachable)
4. Node 1: side effect — set `player_score = 10` (optional test for chaining)
5. Click **Start Simulation** — Node 1 glows active, Node 3 pulses reachable, Node 2 does not pulse
6. Click Node 3 — simulation advances, Node 1 becomes visited (dimmed), Node 3 becomes active
7. Click **Stop Simulation** — all highlights clear, canvas returns to edit mode
8. Click **Tidy Layout** — nodes rearrange horizontally, no overlaps

## Next Phase Dependency
Phase 06 (File I/O) requires a complete, runnable graph state in `graphStore` to test Save and Open, which in turn requires Phases 03–05 to demonstrate a working 5-node story.
