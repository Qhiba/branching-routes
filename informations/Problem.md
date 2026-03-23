# How to Update this file
- Add a title
- breakdown the information into 2 section:
- Problem: Explain the possible problem, potential challanges, or considerations that need to be address inside the project.
- Solution: Propose a possilbe solustion to access the problem.

# Considerations & Potential Challenges

## With Phase 4


**Problem: AND-Only Condition Logic**
All `requires` arrays are evaluated with `.every()` — meaning all conditions must pass simultaneously. There is currently no way to express OR logic (e.g. a scene that appears when the player is either strong or smart). The workaround is duplicating scenes with different `requires`, which creates maintenance overhead as content grows.
**Solution:** Deferred — the current narrative complexity does not require OR logic yet, and the schema is backward-compatible when ready. When needed, add an optional `"operator": "or"` field to the `requires` array (defaulting to `"all"` if absent). The only changes required at that point are: a toggle in `ConditionEditor`, swapping `.every()` for `.some()` in the evaluator, and updating the `flagReferenceMap` logic if needed. No existing data is affected.

## With Build Tooling

**Problem: Large Chunk Size Warning from Vite**
When building the project (`npm run build`), Vite emits a warning that the main JavaScript chunk is larger than 500kB after minification. This is primarily due to the inclusion of heavy dependencies for the Route Viewer in Phase 4, specifically `@xyflow/react` (React Flow) and `@dagrejs/dagre` (Auto-layout).
**Solution:** For a local editor tool, this is not a practical problem as assets load instantly from the filesystem or local network. However, to resolve the terminal warning in the future, configure Vite (`vite.config.js`) with `build.rolldownOptions.output.manualChunks` to split `xyflow` and `dagre` into separate vendor chunks, or increase the `chunkSizeWarningLimit`.

## UI & Performance Constraints

**Problem: RouteViewer Layout Recomputation Freezes**
The `RouteViewer.jsx` relies on `computeLayout` and `analyzeReachability` inside a `useMemo` hook that constantly monitors the global `scenes` and `choices` contexts. Because `EditorContext` processes state all the way up to the root, having the RouteViewer open in a split-pane while typing a scene description will force the graph to recalculate its entire node layout and reachability matrix on every single debounced keystroke. Executing an `O(V+E)` DAG layout algorithm continuously will completely freeze the browser for large graphs.
**Solution:** Offload the layout computation (`computeLayout`) to a Web Worker so it doesn't block the main UI thread, or replace the reactive state subscription with a manual "Refresh Graph" button.

**Problem: React Flow Mass Rendering on Fit View**
`@xyflow/react` maintains high performance by virtualizing nodes that are outside the viewport. However, `RouteViewer` automatically calls `fitView()` on load. For a massive project (e.g. 5,000 nodes), `fitView()` will zoom all the way out to force all 5,000 nodes onto the screen simultaneously. This completely bypasses virtualization, forcing React to render thousands of heavy DOM elements at once, leading to a massive initial render spike that can crash the tab.
**Solution:** Cap the maximum zoom-out scale (`minZoom`) or add a threshold (e.g., if nodes > 500, skip `fitView()` and just center the camera on the `entry_node` at zoom level 1).

**Problem: Non-Virtual List Rendering for Main Editors**
Older components like `SceneEditor` and `ChoiceEditor` map directly over the entire `scenes` and `choices` collections to render their collapsible accordion lists. While individual text inputs are properly debounced, rendering 5,000 individual `<div className="scroll-mt-4 rounded-lg...">` DOM blocks simultaneously (even when collapsed) causes extreme performance degradation, layout thrashing, and lag during tab navigation.
**Solution:** Implement list virtualization (via `react-window` or `react-virtuoso`) for the main `SceneEditor` and `ChoiceEditor` list wrappers, so only the ~15 currently visible accordion rows are rendered in the DOM at any given time.
