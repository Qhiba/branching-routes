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

---

## Folder Structure

```
branching-routes/
├── index.html              # Entry point HTML shell
├── vite.config.js          # Build config with src/ path aliases (components, store, utils, styles, hooks)
├── package.json            # Dependencies and scripts
│
├── public/                 # Static assets served as-is
│   └── favicon.svg
│
├── src/
│   ├── main.jsx            # React bootstrap — async boot: restores graph and campaigns from IndexedDB, wires debounced auto-save subscriptions for both stores, then renders <App />
│   ├── App.jsx             # Root layout: TopBar + LeftSidebar + Canvas (with FloatingMiddleBar overlay) + RightSidebar; mount points for <Toast /> and <CommandPalette /> fixed overlays
│   ├── App.css             # Grid layout styles for the three regions
│   │
│   ├── styles/
│   │   ├── tokens.css      # Design system CSS custom properties (colours, spacing, typography); explicit z-index scale (--z-cluster, --z-context-menu, --z-modal, --z-palette, --z-toast); cluster palette color tokens; indigo accent scale; shadow and animation keyframe tokens
│   │   ├── utilities.css   # Shared UI-v2 primitive classes (pill, nameplate, floating-bar, modal-shell, segmented-control); imported by global.css
│   │   └── global.css      # CSS reset, base styles, component styles, simulation mode overrides; Toast overlay; CommandPalette overlay; cluster overlay SVG regions
│   │
│   ├── store/
│   │   ├── narrativeStore.js # Zustand store: canonical graph (common, choice, ending, edges, flag, status, path, chapter, meta)
│   │   ├── uiStore.js      # Zustand store: UI state (selection, multi-select, snap-to-grid, choice display mode, label display mode, cluster mode, shortest route overlays, selected route index)
│   │   ├── toastStore.js   # Zustand store: ephemeral toast notifications (toasts[], addToast, removeToast, auto-dismiss timer); never persisted to IndexedDB
│   │   ├── simulationStore.js  # Zustand store: campaign-mode lifecycle, six-state node enum, seen tracking, traversal records/undo, forward-reachability pass, selected option, passive analysis, sequence pathfinding (Route Finder), sandbox overrides, campaign snapshotting
│   │   ├── campaignStore.js    # Zustand store: campaign dictionary (CRUD, IndexedDB persistence, ZIP import restore)
│   │   └── index.js        # Barrel re-export for all stores
│   │
│   ├── utils/
│   │   ├── uuid.js         # UUID v4 generation wrapper
│   │   ├── conditionEvaluator.js  # Pure functions for AND/OR condition evaluation
│   │   ├── fileSystem.js   # IndexedDB auto-save; campaign IndexedDB persistence; browser File System Access API export/import with fallback; ZIP bundling via JSZip; import validation, sanitization, and migration chain
│   │   ├── routeTracer.js  # Algorithm utilities: DFS dead-end scanning, BFS forward-reachability marking, and sequence pathfinding (k-shortest paths) over simulated graph states
│   │   └── index.js        # Barrel re-export for all utilities
│   │
│   ├── hooks/
│   │   └── useKeyboardShortcuts.js  # Global keydown handler: shortcut dispatch for node/edge CRUD, view actions, label mode toggle, Ctrl+K palette toggle (before input-field guard), and G cluster mode cycle; input-field and campaign-mode guards
│   │
│   └── components/
│       ├── TopBar.jsx           # Project title input + icon-button clusters (Tidy/Snap/Clusters) + file ops (New/Import/Export); no campaign controls; ConfirmModal for destructive New action
│       ├── GraphCanvas.jsx      # React Flow canvas wrapper; double-click node → canvas-edit-node-modal event; double-click edge → canvas-edit-edge-modal event; context menu with Edit Node/Edge actions; NodeConfigModal + EdgeConfigModal mounts; keyboard shortcut hook; multi-select; passive analysis; cluster overlay; shortest route overlay; canvas-navigate-to-node listener
│       ├── SandboxPanel.jsx     # Campaign-only flag/status override panel (Sandbox Overrides section only); mounted in RightSidebar Sandbox tab; never writes to narrativeStore
│       ├── StatusStrip.jsx      # Bottom strip with lucide-react icons; live coverage metrics (Nodes/Endings/Edges/Dead-ends traversal fractions); reads from simulationStore and narrativeStore via per-slice selectors
│       ├── ConfirmModal.jsx     # Reusable confirmation dialog (title, message, confirmLabel, danger flag); replaces browser window.confirm() for destructive actions
│       ├── FlagManager.jsx      # Flag CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── StatusManager.jsx    # Status CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── PathChapterManager.jsx # Path and Chapter CRUD management UI; restyled with EntityList.css; filterType prop selects path vs chapter view
│       ├── EntityList.css       # Shared CSS for FlagManager, StatusManager, PathChapterManager list views
│       ├── ContextMenu.jsx      # Right-click context menu at cursor; pane/node/edge/multi-select action lists; Edit Node and Edit Edge actions dispatch canvas-edit-node-modal / canvas-edit-edge-modal events; viewport-edge flip; dismisses on Escape, click-outside, pan, and drag
│       ├── NameModal.jsx        # Naming modal for quick-create of flags, statuses, paths, and chapters; ESC stopPropagation prevents canvas selection clear on dismiss
│       ├── CommandPalette.jsx   # Ctrl+K searchable overlay; entity search index across all narrative types; navigate-to-entity via canvas-navigate-to-node DOM event; static action dispatch; disambiguation context inline in results; authoring actions hidden during campaign mode
│       ├── Toast.jsx            # Top-right fixed overlay reading toastStore; renders stacked auto-dismiss notifications with info/success/warning/error variants
│       ├── layout/
│       │   ├── LeftSidebar.jsx  # Nameplate-tab sidebar: Flags / Status / Chapter / Paths tabs; dims to opacity 0.4 + grayscale during campaign mode
│       │   ├── LeftSidebar.css
│       │   ├── RightSidebar.jsx # Nameplate-tab sidebar: Nodes / Route Tracing / Campaign List / Sandbox tabs; dims during campaign mode; mounts SandboxPanel directly in Sandbox tab
│       │   ├── RightSidebar.css
│       │   ├── NameplateTab.jsx # Reusable vertical nameplate tab component with rotation animation
│       │   └── NameplateTab.css
│       ├── panels/
│       │   ├── NodesPanel.jsx          # Segmented Common/Choice/Ending filter + search; node list from narrativeStore; edit pencil dispatches canvas-edit-node-modal event
│       │   ├── RouteTracingPanel.jsx   # Route tracing panel (config → results view); flag and status priority groups; store-driven results via shortestRouteResults; clickable route items navigate canvas via canvas-navigate-to-node
│       │   ├── CampaignListPanel.jsx   # Campaign list with icon-only Enter/Edit/Delete buttons; create/rename/delete via campaignStore
│       │   └── RightPanels.css        # Shared CSS for all right-sidebar panel components
│       ├── floating/
│       │   ├── FloatingMiddleBar.jsx   # Centered overlay above canvas; authoring mode: node-type quick-create buttons + campaign selector + Start; campaign mode: active-campaign pill with Overlay/Undo/Reset/Exit + Save/Load/Autosave controls
│       │   └── FloatingMiddleBar.css
│       ├── modals/
│       │   ├── NodeConfigModal.jsx     # Full-screen 2-column node editor (Common/Choice) or narrow single-column (Ending); label, chapter/path, node subtype, start-node button, on-enter modifiers, variants/options with condition builder; atomic creation flow (cancel deletes uncommitted node)
│       │   ├── NodeConfigModal.css
│       │   ├── EdgeConfigModal.jsx     # Full-screen edge editor; label, AND/OR condition builder with flag and status clauses; edge deletion
│       │   └── EdgeConfigModal.css
│       ├── nodes/
│       │   ├── CommonNode.jsx          # Custom React Flow node; type bar displays user-defined subtype name when assigned; verbose label mode renders side-effect names inline
│       │   ├── ChoiceNode.jsx          # Custom React Flow node for player choices with per-option source handles; verbose label display mode renders side-effect names inline
│       │   └── EndingNode.jsx          # Custom React Flow node for terminal states (no source handle)
│       ├── edges/
│       │   └── ConditionalEdge.jsx     # Custom React Flow edge with condition badges; verbose label display mode resolves flag/status names in condition clauses
│       └── index.js                    # Barrel re-export for all components
│
├── tests/                  # Phase-specific test scripts (run via vite-node)
│
└── informations/           # Project documentation and run artifacts
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
