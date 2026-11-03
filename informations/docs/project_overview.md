# Branching Routes — Project Overview

A visual graph-based editor for branching narrative games with live simulation, built entirely for the browser.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 19 | Component rendering and state-driven UI |
| **Build Tool** | Vite 8 | Dev server, bundling, path alias resolution |
| **Canvas** | React Flow (`@xyflow/react`) | Interactive node/edge graph visualisation |
| **State Management** | Zustand 5 | Global stores for graph data and simulation state |
| **Auto-Layout** | Dagre | One-click left-to-right graph tidying |
| **Icon** | Lucide-React | UI icons for sidebars, panels, modals, and floating bar |
| **Language** | JavaScript (`.jsx` / `.js`) | No TypeScript |
| **Backend** | None | Zero network requests; primary persistence via IndexedDB auto-save; explicit export/import via browser File System Access API (JSON for narrative-only projects, ZIP for projects with campaigns) |
| **Drag & Drop** | @hello-pangea/dnd | Drag-and-drop reordering for entity lists (nodes, flags, statuses) |
| **ZIP Bundling** | JSZip | Browser-only ZIP creation/extraction for multi-campaign project export/import |

---

## Folder Structure

```
branching-routes/
├── index.html              # Entry point HTML shell without external font CDNs
├── vite.config.js          # Build config with src/ path aliases and manualChunks vendor code-splitting
├── package.json            # Dependencies and scripts
│
├── public/                 # Static assets served as-is
│   └── favicon.svg
│
├── src/
│   ├── main.jsx            # React bootstrap — async boot: wrapped App with ErrorBoundary, restores graph and campaigns from IndexedDB, wires debounced auto-save subscriptions for both stores, then renders <App />
│   ├── App.jsx             # Root layout: TopBar + LeftSidebar + Canvas (with FloatingMiddleBar overlay) + RightSidebar; mount points for <Toast /> and <CommandPalette /> fixed overlays
│   ├── App.css             # Grid layout styles for the three regions
│   │
│   ├── styles/
│   │   ├── buttons.css     # Shared interactive button style classes
│   │   ├── tokens.css      # Design system CSS custom properties (colours, spacing, typography using system font stack); explicit z-index scale (--z-cluster, --z-context-menu, --z-modal, --z-palette, --z-toast); cluster palette color tokens; indigo accent scale; shadow and animation keyframe tokens; node type color tokens (--color-node-common, --color-node-choice, --color-node-ending)
│   │   ├── utilities.css   # Shared UI-v2 primitive classes (pill, nameplate, floating-bar, modal-shell, segmented-control); imported by global.css
│   │   └── global.css      # CSS reset, base styles, component styles, simulation mode overrides (!important); Toast overlay; CommandPalette overlay; cluster overlay SVG regions; node type box-shadow glows; hover-only React Flow handles; frozen-prefix edge overlay; ErrorBoundary styles; ending-node active halo
│   │
│   ├── store/
│   │   ├── narrativeStore.js # Zustand store: canonical graph (common, choice, ending, edges, flag, status, path, chapter, tag, commonType, endingType, meta); persistent editor-level seen marks (editorSeenNodeIds, editorSeenOptionIds) with toggle, clear, and applySeenFromCampaign actions; tag CRUD; load-bearing cross-store comments
│   │   ├── uiStore.js      # Zustand store: UI state (selection, multi-select, snap-to-grid, choice display mode, label display mode, canvas filters (chapter/path/tag with AND/OR logic), shortest route overlays, selected route index, frozenWaypointEdgeIds, mergedGroupEdgeIds, copiedNode buffer, followActiveNode toggle, sequential flag batch settings persistent to localStorage via safeStorage)
│   │   ├── uiStore.test.js # Unit test for selection equality
│   │   ├── toastStore.js   # Zustand store: ephemeral toast notifications (toasts[], addToast, removeToast, auto-dismiss timer); never persisted to IndexedDB
│   │   ├── simulationStore.js  # Zustand store: campaign-mode lifecycle, six-state node enum, campaign-only seen tracking (seenNodeIds), traversal records capped at MAX_TRAVERSAL_DEPTH=1000, async computeRoutesFromStart, selected option, passive analysis, sequence pathfinding (Route Finder), sandbox overrides, campaign snapshotting
│   │   ├── simulationStore.test.js # Unit test for traversal depth cap
│   │   ├── campaignStore.js    # Zustand store: campaign dictionary (CRUD, IndexedDB persistence, ZIP import restore)
│   │   └── index.js        # Barrel re-export for all stores
│   │
│   ├── utils/
│   │   ├── uuid.js         # UUID v4 generation wrapper with crypto.randomUUID() fallback for non-secure contexts
│   │   ├── uuid.test.js    # Unit test for UUID generation
│   │   ├── conditionEvaluator.js  # Pure functions for AND/OR condition evaluation
│   │   ├── fileSystem.js   # IndexedDB auto-save; campaign IndexedDB persistence; browser File System Access API export/import with fallback; ZIP bundling via JSZip; import validation (with structural checks), sanitization, and migration chain
│   │   ├── routeTracer.js  # Algorithm utilities: DFS dead-end scanning, BFS forward-reachability marking, k-shortest-paths sequence pathfinding (computeShortestPathsAsync), cancelRouteWorker, flag-state replay, convergent route merge grouping, and route-to-campaign snapshot building
│   │   ├── routeTracer.worker.js # Web Worker for off-thread route tracing
│   │   ├── safeStorage.js  # Safe localStorage wrapper with try/catch
│   │   ├── safeStorage.test.js # Unit test for safe localStorage wrapper
│   │   ├── snapGuides.js   # Smart Snap Assist pure math: computeSnapGuides (binary-search guide cache), getSnappedPosition, getActiveGuides, applyAxisLock
│   │   └── index.js        # Barrel re-export for all utilities
│   │
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.js  # Global keydown handler: shortcut dispatch using dynamic getState() without top-level store hook; input-field and campaign-mode guards
│   │   ├── useFocusTrap.js          # Custom hook for modal focus trapping + ARIA
│   │   └── useFocusTrap.test.js     # Unit test for useFocusTrap
│   │
│   └── components/
│       ├── ErrorBoundary.jsx    # React class component error boundary with emergency export + storage reset
│       ├── TopBar.jsx           # Project title input + edit mode controls (node quick-create buttons & campaign start selector, disabled in campaign mode) + file ops (New/Import/Export); structural import validation error handling
│       ├── GraphCanvas.jsx      # React Flow canvas wrapper; centralized canvas filter evaluation; declarative campaign mode guards; nodeTypes/edgeTypes in module scope
│       ├── SandboxPanel.jsx     # Campaign-only flag/status override panel (Sandbox Overrides section only); mounted in RightSidebar Sandbox tab; never writes to narrativeStore
│       ├── StatusStrip.jsx      # Bottom strip with lucide-react icons; live coverage metrics (Nodes/Endings/Edges/Dead-ends traversal fractions); reads from simulationStore and narrativeStore via per-slice selectors
│       ├── ConfirmModal.jsx     # Reusable confirmation dialog (title, message, confirmLabel, danger flag) with ARIA attributes + useFocusTrap
│       ├── FlagManager.jsx      # Flag CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── StatusManager.jsx    # Status CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── PathChapterManager.jsx # Path and Chapter CRUD management UI; restyled with EntityList.css; filterType prop selects path vs chapter view
│       ├── EntityList.css       # Shared CSS for FlagManager, StatusManager, PathChapterManager list views; includes drag-and-drop affordances
│       ├── ContextMenu.jsx      # Right-click context menu at cursor; pane/node/edge/multi-select action lists; Edit Node and Edit Edge actions dispatch canvas-edit-node-modal / canvas-edit-edge-modal events; viewport-edge flip; dismisses on Escape, click-outside, pan, and drag
│       ├── NameModal.jsx        # Naming modal for quick-create of flags, statuses, paths, and chapters with ARIA attributes + useFocusTrap
│       ├── CommandPalette.jsx   # Ctrl+K searchable overlay using per-slice selectors and functional state updates; entity search index across all narrative types; navigate-to-entity via canvas-navigate-to-node DOM event
│       ├── Toast.jsx            # Top-right fixed overlay reading toastStore; renders stacked auto-dismiss notifications with info/success/warning/error variants
│       ├── layout/
│       │   ├── LeftSidebar.jsx  # Nameplate-tab sidebar: Flags / Status / Chapter / Paths tabs; dims to opacity 0.4 + grayscale during campaign mode
│       │   ├── LeftSidebar.css
│       │   ├── RightSidebar.jsx # Nameplate-tab sidebar: Filters / Nodes / Route Tracing / Campaign List / Sandbox tabs; dims during campaign mode; mounts SandboxPanel directly in Sandbox tab
│       │   ├── RightSidebar.css
│       │   ├── NameplateTab.jsx # Reusable vertical nameplate tab component with rotation animation
│       │   └── NameplateTab.css
│       ├── panels/
│       │   ├── FiltersPanel.jsx         # Global canvas filter panel: chapter, path, tag filtering with AND/OR logic and reset; mounted in RightSidebar Filters tab
│       │   ├── NodesPanel.jsx          # Segmented Common/Choice/Ending filter + search; drag-and-drop node reordering via @hello-pangea/dnd; edit pencil dispatches canvas-edit-node-modal event
│       │   ├── RouteTracingPanel.jsx   # Route tracing panel (config → results view); flag and status priority groups; store-driven results via shortestRouteResults; convergent routes merged into grouped cards via findMergeGroups; Save to Campaign button with multi-axis node-navigator modal; searchAll checkbox (uncapped BFS) with warning and Cancel button; clickable route items navigate canvas via canvas-navigate-to-node; freeze-at-waypoint stores prefix edge IDs in uiStore.frozenWaypointEdgeIds for green overlay; re-route clears waypoints before recomputing
│       │   ├── CampaignListPanel.jsx   # Campaign list with icon-only Enter/Edit/Delete buttons; create/rename/delete via campaignStore; Clear All Seen button (clears narrativeStore editorSeenNodeIds/editorSeenOptionIds)
│       │   └── RightPanels.css        # Shared CSS for all right-sidebar panel components
│       ├── floating/
│       │   ├── FloatingMiddleBar.jsx   # Centered overlay above canvas; hidden in authoring mode (functions moved to TopBar); displays exclusively in campaign mode: active-campaign pill with Overlay/Follow/Undo/Reset/Save/Load/Autosave/Save Seen/Exit controls
│       │   └── FloatingMiddleBar.css
│       ├── modals/
│       │   ├── NodeConfigModal.jsx     # Full-screen 2-column node editor (Common/Choice) or narrow single-column (Ending); disabled save button when label empty
│       │   ├── NodeConfigModal.css
│       │   ├── WarpConfigModal.jsx     # Narrow single-column configuration modal for warp entrance/exit node connections (portalChannel selector, delete button); disabled save button when label empty
│       │   ├── EdgeConfigModal.jsx     # Full-screen edge editor with ARIA attributes; label, AND/OR condition builder with flag and status clauses; edge deletion
│       │   └── EdgeConfigModal.css
│       ├── nodes/
│       │   ├── CommonNode.jsx          # Custom React Flow node; reads isFilteredOut from data; type bar displays user-defined subtype name when assigned
│       │   ├── ChoiceNode.jsx          # Custom React Flow node for player choices with per-option source handles; reads isFilteredOut from data; options with unmet requirements show a lock pill and are dimmed/click-gated in campaign mode
│       │   ├── EndingNode.jsx          # Custom React Flow node for terminal states (no source handle); reads isFilteredOut from data; green border glow and corner badge (story-node--seen) from narrativeStore.editorSeenNodeIds in edit mode
│       │   ├── WarpEntranceNode.jsx    # Custom React Flow node for warp entrance (left target handle, purple type bar, square shape); reads isFilteredOut from data
│       │   ├── WarpExitNode.jsx        # Custom React Flow node for warp exit (right source handle, purple type bar, square shape); reads isFilteredOut from data
│       │   ├── HubNode.jsx             # Custom React Flow node for HUB / Bridge router junction (Teal diamond shape, GitMerge icon only display, target and source handles); instant pass-through evaluation during campaign simulation
│       │   └── VerboseEffects.jsx      # Isolated sub-components for flag/status verbose rendering
│       ├── edges/
│       │   └── ConditionalEdge.jsx     # Custom React Flow edge deriving isFilteredOut from source/target data; condition badges and draggable labels; verbose label display mode resolves flag/status names in condition clauses; edge bend control via data.bendX ratio
│       └── index.js                    # Barrel re-export for all components
│
└── informations/
    ├── bit_bit_prompt.md    # Development protocol
    └── docs/
        ├── project_overview.md          ← this file
        ├── codebase_features.md
        ├── architecture_rules.md
        ├── risk_register.md
        └── example_datamodel.json
```

---

## Related Documentation

| Document | Description |
|---|---|
| [codebase_features.md](codebase_features.md) | File-by-file reference of all components, stores, and utilities with exports and dependencies |
| [architecture_rules.md](architecture_rules.md) | The single source of truth for all architecture rules governing this project |
| [risk_register.md](risk_register.md) | Known risks with descriptions, mitigation strategies, and current status |
| [example_datamodel.json](example_datamodel.json) | A realistic example of the JSON save/export format |
