# Branching Routes — Development Change Journal

This document serves as a permanent, version-controlled baseline log of all step-by-step changes made to the Branching Routes codebase during development.

---

## Change Log

### Change 1 — Default Collapse of Right Sidebar on Start/Reload
- **Description**: Changed the default state of `activePanel` in the `RightSidebar` component from `'Nodes'` to `null`. This prevents the "Nodes" tab from automatically opening and crowding the view when the application is started or reloaded, matching the collapsed behavior of the left sidebar.
- **Files Modified**:
  - [RightSidebar.jsx](file:///f:/Projects/Web/branching-routes/src/components/layout/RightSidebar.jsx)

### Change 2 — Prevent Sidebar Tabs Overflowing on Small Screens
- **Description**: Resolved issues where sidebar tabs (nameplates) overflowed off the bottom of the screen on smaller viewport heights:
  1. Added `overflow-y: auto` to both `.br-left-sidebar__rail` and `.br-right-sidebar__rail`, setting appropriate styles to hide scrollbars (`scrollbar-width: none` and `::-webkit-scrollbar { display: none }`). This allows scrolling the rails vertically if screen height is constrained.
  2. Reduced the vertical padding of `.nameplate-tab` from `var(--space-6)` (24px) to `var(--space-4)` (16px), making the tab buttons more compact and saving significant vertical screen estate.
- **Files Modified**:
  - [LeftSidebar.css](file:///f:/Projects/Web/branching-routes/src/components/layout/LeftSidebar.css)
  - [RightSidebar.css](file:///f:/Projects/Web/branching-routes/src/components/layout/RightSidebar.css)
  - [NameplateTab.css](file:///f:/Projects/Web/branching-routes/src/components/layout/NameplateTab.css)

### Change 3 — Retain Previous Settings for Sequential Flags Creation
- **Description**: Enabled the application to remember and persist the settings used for sequential flag generation (Start At, Ends At, and Padding) across modal opens and page reloads:
  1. Added `seqStart`, `seqEnd`, and `seqPad` configuration values to the Zustand `uiStore` state, along with setters (`setSeqStart`, `setSeqEnd`, `setSeqPad`) that save the values to `localStorage` on update.
  2. Modified `NameModal.jsx` to bind these properties to `useUIStore` instead of local React component state, ensuring they persist across mounts and page reloads.
- **Files Modified**:
  - [uiStore.js](file:///f:/Projects/Web/branching-routes/src/store/uiStore.js)
  - [NameModal.jsx](file:///f:/Projects/Web/branching-routes/src/components/NameModal.jsx)

### Change 4 — Copy & Paste Node Feature
- **Description**: Added a fully integrated "Copy / Paste" capability for narrative nodes:
  1. Updated `uiStore.js` to store a `copiedNode` clone structure and its setter action.
  2. Added a `pasteNode(copiedNode, position)` action in `narrativeStore.js` that duplicates the node structure, appends ` (Copy)` to its label, prevents start node propagation, and regenerates unique nested IDs for Choice options (`opt-` prefix) and Common variants (`v-` prefix).
  3. Modified `GraphCanvas.jsx` to register a `canvas-paste-node` event listener which maps viewport/cursor locations into flow-coordinates and dispatches the store's paste action.
  4. Configured keyboard hotkeys `Ctrl+C` (copy) and `Ctrl+V` (paste) inside `useKeyboardShortcuts.js`. To resolve modifier key clashes (where `Ctrl+C`/`Ctrl+V` were intercepted by single-key shortcuts like `c` for Choice Node and `v` for Snap to Grid), relocated the copy/paste shortcut logic to run immediately after the text-input check, and introduced a global modifier key guard (`if (e.ctrlKey || e.metaKey || e.altKey) return;`) directly preceding the single-character key blocks.
  5. Implemented context menu extensions in `ContextMenu.jsx`: right-clicking a node reveals "Copy Node", and right-clicking empty canvas space displays "Paste Node" when a node is in the copy buffer.
- **Files Modified**:
  - [uiStore.js](file:///f:/Projects/Web/branching-routes/src/store/uiStore.js)
  - [narrativeStore.js](file:///f:/Projects/Web/branching-routes/src/store/narrativeStore.js)
  - [GraphCanvas.jsx](file:///f:/Projects/Web/branching-routes/src/components/GraphCanvas.jsx)
  - [useKeyboardShortcuts.js](file:///f:/Projects/Web/branching-routes/src/hooks/useKeyboardShortcuts.js)
  - [ContextMenu.jsx](file:///f:/Projects/Web/branching-routes/src/components/ContextMenu.jsx)

### Change 5 — Warp Portal Node Feature
- **Description**: Implemented the Warp Portal Node feature to prevent visual spaghetti in VN character-selection loop structures:
  1. Created two new React Flow node types: `WarpEntranceNode.jsx` (left target handle only, forced square shape) and `WarpExitNode.jsx` (right source handle only, forced square shape).
  2. Registered node mappings inside `GraphCanvas.jsx` and added custom purple accent styles in `global.css` with forced square border radius.
  3. Created `WarpConfigModal.jsx`, a specialized single-column configuration modal following `EdgeConfigModal.jsx` design language. It replaces raw configuration within the main node config modal, displaying only Title, Description, a searchable dropdown selector to connect to warp portals of the opposite type (automatically sharing/generating a unique portal channel), an optional text input for raw connection channel name, and a danger zone Delete button.
  4. Cleaned up all leftover warp config code and layout toggles from `NodeConfigModal.jsx`.
  5. Updated `GraphCanvas.jsx` to import and conditionally render `WarpConfigModal` for warp nodes and `NodeConfigModal` for normal narrative nodes during creation and editing.
  6. Integrated creation triggers across the UI: a dedicated "Warp" tab in `NodesPanel.jsx`, and context triggers in `ContextMenu.jsx`, `CommandPalette.jsx`, and `FloatingMiddleBar.jsx`.
  7. Added shortcut keys: `W` (open creation modal for Warp Entrance) and `Ctrl+W` (open creation modal for Warp Exit with browser tab closing prevented via `e.preventDefault()`) in `useKeyboardShortcuts.js`.
  8. Resolved simulation jumps and structural reachability analysis in `simulationStore.js`: evaluate matching `warp_exit` in campaign mode and teleport the active state to the exit node's ID, pushing both the entrance and exit nodes to the seen/visited lists to maintain correct history undo snapshots; also updated `computePassiveAnalysis`'s BFS traversal queue to check for `warp_entrance` nodes and queue matching `warp_exit` nodes, preventing active warp portals from being incorrectly flagged as unreachable.
  9. Enhanced pathfinder traversal in `routeTracer.js`:
     - Treated portal transitions as virtual jumps (without increasing path lengths or edge lists).
     - Integrated a `depthLimit` check to restrict maximum search depth during path BFS queue expansion (with `-1` representing unlimited).
     - Built a state-aware cycle guard hashing active flags and status points, enabling paths to revisit nodes if and only if the status points or flags change, which resolves character selection loops without infinite cycles.
  10. Connected the pathfinder limit parameter in the UI by rendering a "Search Depth Limit" field in `RouteTracingPanel.jsx` and forwarding this configuration value to `computeRoutesFromStart` inside `simulationStore.js`.
- **Files Modified**:
  - [WarpEntranceNode.jsx](file:///f:/Projects/Web/branching-routes/src/components/nodes/WarpEntranceNode.jsx) [NEW]
  - [WarpExitNode.jsx](file:///f:/Projects/Web/branching-routes/src/components/nodes/WarpExitNode.jsx) [NEW]
  - [WarpConfigModal.jsx](file:///f:/Projects/Web/branching-routes/src/components/modals/WarpConfigModal.jsx) [NEW]
  - [index.js](file:///f:/Projects/Web/branching-routes/src/components/index.js)
  - [GraphCanvas.jsx](file:///f:/Projects/Web/branching-routes/src/components/GraphCanvas.jsx)
  - [global.css](file:///f:/Projects/Web/branching-routes/src/styles/global.css)
  - [NodeConfigModal.jsx](file:///f:/Projects/Web/branching-routes/src/components/modals/NodeConfigModal.jsx)
  - [NodeConfigModal.css](file:///f:/Projects/Web/branching-routes/src/components/modals/NodeConfigModal.css)
  - [NodesPanel.jsx](file:///f:/Projects/Web/branching-routes/src/components/panels/NodesPanel.jsx)
  - [FloatingMiddleBar.jsx](file:///f:/Projects/Web/branching-routes/src/components/floating/FloatingMiddleBar.jsx)
  - [FloatingMiddleBar.css](file:///f:/Projects/Web/branching-routes/src/components/floating/FloatingMiddleBar.css)
  - [ContextMenu.jsx](file:///f:/Projects/Web/branching-routes/src/components/ContextMenu.jsx)
  - [CommandPalette.jsx](file:///f:/Projects/Web/branching-routes/src/components/CommandPalette.jsx)
  - [useKeyboardShortcuts.js](file:///f:/Projects/Web/branching-routes/src/hooks/useKeyboardShortcuts.js)
  - [narrativeStore.js](file:///f:/Projects/Web/branching-routes/src/store/narrativeStore.js)
  - [simulationStore.js](file:///f:/Projects/Web/branching-routes/src/store/simulationStore.js)
  - [RouteTracingPanel.jsx](file:///f:/Projects/Web/branching-routes/src/components/panels/RouteTracingPanel.jsx)

### Change 6 — Viewport Following Toggle in Campaign Mode
- **Description**: Added a viewport "Follow" toggle in the editor's floating campaign toolbar, allowing the canvas viewport to automatically track the player's position when nodes are activated:
  1. Extended `uiStore.js` with the `followActiveNode` boolean state and `setFollowActiveNode` setter action.
  2. Rendered a "Follow: ON/OFF" toggle action button in `FloatingMiddleBar.jsx` next to the overlay controls.
  3. Implemented a reactive `useEffect` hook in `GraphCanvas.jsx` that watches `activeNodeId`. When campaign simulation is active and the "Follow" toggle is enabled, it automatically centers and zooms the viewport onto the active node's coordinates.
- **Files Modified**:
  - [uiStore.js](file:///f:/Projects/Web/branching-routes/src/store/uiStore.js)
  - [FloatingMiddleBar.jsx](file:///f:/Projects/Web/branching-routes/src/components/floating/FloatingMiddleBar.jsx)
  - [GraphCanvas.jsx](file:///f:/Projects/Web/branching-routes/src/components/GraphCanvas.jsx)
