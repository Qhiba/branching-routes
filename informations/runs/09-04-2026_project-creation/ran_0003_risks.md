# Risk Register

## RISK-01 — Real-Time Simulation Causes React Flow Re-Render Storms

**Description:** The "live checker" simulation needs to update node/edge highlight state on every user action (advance to next node). If `simulationStore` changes cause all nodes and edges to re-render simultaneously on each update, the canvas will lag noticeably at even modest graph sizes (50+ nodes).

**What could go wrong:** Designer advances the simulation; the entire canvas freezes or flickers. At 200+ nodes it becomes unusable.

**Early detection:** During Phase 5 (simulation), manually advance through a 30-node graph. Open Chrome DevTools → Performance tab. If a single "advance" action triggers >100 component re-renders or takes >32ms per frame, this risk has materialised.

**Mitigation:** `StoryNode` and `ConditionalEdge` must use `React.memo` and derive only their own highlight state from `simulationStore` using a targeted selector (e.g., `useSimulationStore(s => s.visitedNodeIds.includes(id))`), not the entire store object. This ensures only the nodes whose status actually changed re-render.

---

## RISK-02 — Flag Name Collisions Break Condition Evaluation

**Description:** The condition evaluator looks up flags by `flagId` (UUID). However, if the designer renames a flag or deletes a flag that is referenced in an edge condition or node side-effect, those references become orphaned and the evaluator will silently return the wrong result or crash.

**What could go wrong:** Designer deletes `HasKey` flag. Edges that depended on `HasKey` now reference a non-existent ID. The simulation evaluates those edges as always-false or throws an uncaught exception.

**Early detection:** In Phase 4 (condition editing), attempt to delete a flag that is currently referenced by an edge condition. If no warning is shown and the deletion succeeds, this risk has materialised.

**Mitigation:** Before deleting a flag, `graphStore` must scan all `edges[].condition.clauses` and `nodes[].sideEffects` for references to that `flagId`. If references exist, display a blocking confirmation dialog listing the affected edges/nodes. The deletion must not proceed silently.

---

## RISK-03 — File System Access API Browser Compatibility Breaks Save/Open

**Description:** The File System Access API (`showSaveFilePicker`, `showOpenFilePicker`) is not available in Firefox or Safari as of mid-2025. The scope document assumes designers run the app in their browser of choice.

**What could go wrong:** A designer using Firefox cannot save or open any files. Clicking "Save" does nothing or throws an uncaught error.

**Early detection:** During Phase 2 (file system utilities), open the app in Firefox. Click Save. If the browser throws `TypeError: window.showSaveFilePicker is not a function`, this risk has materialised.

**Mitigation:** `fileSystem.js` must check for API support (`typeof window.showSaveFilePicker === 'function'`) and fall back to a `<a download>` programmatic download + `<input type="file">` upload approach. The fallback must be implemented in Phase 2, not deferred, since every subsequent phase depends on file I/O.

---

## RISK-04 — Graph Becomes Visually Unreadable at Medium Scale

**Description:** The scope accepts the "visual spaghetti" risk from the brainstorm and defers route-tracing features, but even a 20-node graph with multiple crossing edges and long condition labels can become difficult to read without some form of layout assistance.

**What could go wrong:** During Phase 6 (acceptance testing), the designer builds a 20-node graph and finds it impossible to follow which path leads where. The tool feels worse than pen-and-paper.

**Early detection:** During Phase 5, manually build a 15-node graph with at least 3 flag conditions. If edges visually overlap and there is no way to untangle them, the risk has materialised.

**Mitigation:** Phase 3 must implement React Flow's built-in `Background` grid and ensure edges use the `smoothstep` or `bezier` edge type (not straight lines) by default. A Dagre-based auto-layout action ("Tidy Layout" button) should be included in Phase 5 as a first-class feature, not a nice-to-have, since it is the minimum defence against spaghetti at scale.

---

## RISK-05 — Simulation "Live Checker" UX is Ambiguous Without a Clear Mode Indicator

**Description:** The scope defines a "live checker" mode where the designer interacts with the graph directly to advance the simulation. If there is no obvious visual difference between "editing mode" and "simulation mode", the designer will accidentally add/delete nodes while simulating, or not understand why node-drag suddenly doesn't work.

**What could go wrong:** Designer clicks a node expecting to move it, but instead "advances" the simulation to that node. They are confused about what the tool is doing.

**Early detection:** During Phase 5 usability check: start the simulation, then attempt to drag a node. If drag works during simulation, the mode separation is not enforced. If drag is inexplicably blocked with no explanation, the UX is still broken.

**Mitigation:** During Phase 5, `GraphCanvas` must visually shift modes when `simulationStore.isRunning === true`: apply a global CSS class (`.simulation-mode`) to the canvas root that dims the toolbar, changes the cursor to `pointer` on reachable nodes, disables all node/edge drag interactions, and shows a persistent banner reading "Simulation Active — click a highlighted node to advance."
