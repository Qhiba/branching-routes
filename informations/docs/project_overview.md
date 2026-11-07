# Branching Routes — Project Overview

A visual graph-based editor for branching narrative games with live simulation, built entirely for the browser.

Layout (since the 2026-11 redesign): **left = project data** (Flags, Status, Collectibles, Tags, Chapters, Paths, Types), **canvas = navigation** (zoom/fit/start/minimap controls), **right = nodes** (Browse search + filters, Inspector). Campaign mode and Route Tracing are hidden behind the Settings switch "Campaign and Route Tracing" (AR-36). Design system: `src/styles/system.css` ("Night route map", AR-37).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 19 | Component rendering and state-driven UI |
| **Build Tool** | Vite 8 | Dev server, bundling, path alias resolution |
| **Canvas** | React Flow (`@xyflow/react`) | Interactive node/edge graph visualisation |
| **State Management** | Zustand 5 | Global stores for graph data and simulation state |
| **Icon** | Lucide-React | UI icons for rails, panels, toolbars, menus and dialogs |
| **Language** | JavaScript (`.jsx` / `.js`) | No TypeScript |
| **Backend** | None | Zero network requests; primary persistence via IndexedDB auto-save; explicit export/import via dev-server `saves/` folder (Save/Load; JSON for narrative-only projects, ZIP for projects with campaigns) with browser File System Access API / download as fallback |
| **Drag & Drop** | @hello-pangea/dnd | Drag-and-drop reordering for entity lists (nodes, flags, statuses) |
| **ZIP Bundling** | JSZip | Browser-only ZIP creation/extraction for multi-campaign project export/import |

---

## Folder Structure

```
branching-routes/
├── index.html              # Entry point HTML shell without external font CDNs
├── vite.config.js          # Build config with src/ path aliases, manualChunks vendor code-splitting, and savesPlugin (dev-only /__saves endpoint for Save/Load)
├── start-app.bat           # Windows launcher: installs dependencies on first run, then npm run dev -- --open
├── saves/                  # Created by Save (Ctrl+S): <project title>.json or .zip; git-ignored
├── package.json            # Dependencies and scripts
│
├── public/                 # Static assets served as-is
│   └── favicon.svg
│
├── src/
│   ├── main.jsx            # Bootstrap: initPersistence() restores the IndexedDB autosave through migrateGraph(), starts undo history (initHistory), restores campaigns, wires debounced auto-save, then renders <App /> in ErrorBoundary; dev-only #design opens the design-system sheet
│   ├── App.jsx             # Root layout: TopBar + LeftSidebar (data) + canvas (FloatingMiddleBar overlay) + RightSidebar (Browse / Inspect) + StatusStrip; overlays Toast, CommandPalette, SettingsModal, ShortcutsDialog
│   ├── App.css             # Grid shell (48px top bar, data | canvas | nodes, 28px status strip); regions use z-index 1–3 only
│   │
│   ├── styles/
│   │   ├── buttons.css     # Legacy .btn classes (frozen; new UI uses .br-btn)
│   │   ├── tokens.css      # Legacy tokens; since Redesign Step 8 the surface/text/border/primary values follow the design system; z-index scale; node identity colours; keyframes
│   │   ├── system.css      # Design system (Redesign Step 3): --br-* tokens + .br-* primitives (buttons, inputs, switch, segmented, rows, chips, menu, dialog, route marks)
│   │   └── global.css      # Reset + legacy component styles (node cards, campaign states, edges, snap guides, context menu, palette, toasts, NameModal) aligned with the design system; imports tokens, buttons, system
│   │
│   ├── store/
│   │   ├── narrativeStore.js # Zustand store: canonical graph (common, choice, ending, edges, flag, status, path, chapter, tag, commonType, endingType, collectibleCategory, collectible, meta); schema v5; persistent editor-level seen marks (editorSeenNodeIds, editorSeenOptionIds) with toggle, clear, and applySeenFromCampaign actions; tag CRUD; load-bearing cross-store comments
│   │   ├── uiStore.js      # UI state: selection, snap / display settings, minimap, canvas filters (chapter, path, tags AND/OR, node type, collectible category), featureCampaign, searchIncludeEdges, Settings / shortcut sheet visibility, campaign overlays, batch flag settings (persisted via safeStorage)
│   │   ├── uiStore.test.js # Unit test for selection equality
│   │   ├── toastStore.js   # Zustand store: ephemeral toast notifications (toasts[], addToast, removeToast, auto-dismiss timer); never persisted to IndexedDB
│   │   ├── simulationStore.js  # Zustand store: campaign-mode lifecycle, six-state node enum, campaign-only seen tracking (seenNodeIds), traversal records capped at MAX_TRAVERSAL_DEPTH=1000, async computeRoutesFromStart, selected option, passive analysis, sequence pathfinding (Route Finder), sandbox overrides, campaign snapshotting
│   │   ├── simulationStore.test.js # Unit test for traversal depth cap
│   │   ├── narrativeStore.collectibles.test.js # Collectible CRUD, cascade and v5 round-trip
│   │   ├── historyStore.js # Undo / redo for narrativeStore: snapshots, bursts, groups, reset on load (Redesign Step 5)
│   │   ├── historyStore.test.js
│   │   ├── campaignStore.js    # Zustand store: campaign dictionary (CRUD, IndexedDB persistence, ZIP import restore)
│   │   └── index.js        # Barrel re-export for all stores
│   │
│   ├── utils/
│   │   ├── uuid.js         # UUID v4 generation wrapper with crypto.randomUUID() fallback for non-secure contexts
│   │   ├── uuid.test.js    # Unit test for UUID generation
│   │   ├── conditionEvaluator.js  # Pure functions for AND/OR condition evaluation
│   │   ├── migrateGraph.test.js # v4→v5 migration and sanitizer tests
│   │   ├── fileSystem.js   # migrateGraph() v1→v5 migration + sanitization pipeline (import and boot restore); IndexedDB auto-save; campaign IndexedDB persistence; browser File System Access API export/import with fallback; ZIP bundling via JSZip; import validation (with structural checks), sanitization, and migration chain
│   │   ├── routeTracer.js  # Algorithm utilities: DFS dead-end scanning, BFS forward-reachability marking, k-shortest-paths sequence pathfinding (computeShortestPathsAsync), cancelRouteWorker, flag-state replay, convergent route merge grouping, and route-to-campaign snapshot building
│   │   ├── routeTracer.worker.js # Web Worker for off-thread route tracing
│   │   ├── safeStorage.js  # Safe localStorage wrapper with try/catch
│   │   ├── safeStorage.test.js # Unit test for safe localStorage wrapper
│   │   ├── dialogKeys.js   # isConfirmEnter: shared Enter-to-confirm rule
│   │   ├── nodeColors.js   # Route colours for JS-painted canvas elements (minimap)
│   │   ├── redesignStep4.test.js # Tests for dialogKeys, nodeColors
│   │   ├── alignNodes.js   # computeAlignment: align / distribute math for multi-selection (Redesign Step 5)
│   │   ├── alignNodes.test.js
│   │   ├── searchIndex.js  # searchGraph, describeCondition, nodeMatchesFilters (Redesign Step 6)
│   │   ├── searchIndex.test.js
│   │   ├── snapGuides.js   # Smart Snap Assist pure math: computeSnapGuides (binary-search guide cache), getSnappedPosition, getActiveGuides, applyAxisLock
│   │   └── index.js        # Barrel re-export for all utilities
│   │
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.js  # Global shortcuts: undo/redo, select all, duplicate, arrow nudge, zoom/fit, Ctrl+S save, copy/paste, add-node and add-entity keys, ? shortcut sheet; input and campaign guards; exports duplicateSelection / nudgeSelection
│   │   ├── useFocusTrap.js          # Custom hook for modal focus trapping + ARIA
│   │   └── useFocusTrap.test.js     # Unit test for useFocusTrap
│   │
│   └── components/
│       ├── dev/
│       │   └── DesignSystemPreview.jsx # Dev-only design-system reference sheet at /#design (excluded from production)
│       ├── ModalPortal.jsx      # Portal into <body> used by every dialog (AR-38)
│       ├── CanvasControls.jsx   # Zoom / fit / go-to-start / origin / minimap toolbar (replaces React Flow Controls)
│       ├── CanvasControls.css
│       ├── CollectibleManager.jsx # Left "Collectibles" panel: categories, items, granted-by nodes, orphans, drag reorder
│       ├── CollectibleManager.css
│       ├── CollectibleDialog.jsx  # Create / rename a collectible or category
│       ├── ErrorBoundary.jsx    # React class component error boundary with emergency export + storage reset
│       ├── TopBar.jsx           # Brand + project title | "Add node" group (labelled, route dots) | campaign selector + Start (Campaign switch on), undo / redo, File menu (New / Load / Save, Ctrl+S), Settings
│       ├── GraphCanvas.jsx      # React Flow canvas: derives nodes/edges, shared filter predicate, campaign guards, modals, undo groups, Inspector on click, canvas events (view, select, align, focus…), CanvasControls + minimap, Snap Assist
│       ├── SandboxPanel.jsx     # Campaign-only flag/status override panel (Sandbox Overrides section only); mounted in RightSidebar Sandbox tab; never writes to narrativeStore
│       ├── StatusStrip.jsx      # Bottom strip: node counts (route colours) and entity counts; campaign coverage numbers while a campaign runs
│       ├── ConfirmModal.jsx     # Confirmation dialog through ModalPortal; Enter confirms, Esc cancels; danger variant
│       ├── FlagManager.jsx      # Flag CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── StatusManager.jsx    # Status CRUD with name validation and reference checking; restyled with EntityList.css and lucide-react icons
│       ├── PathChapterManager.jsx # Path and Chapter CRUD management UI; restyled with EntityList.css; filterType prop selects path vs chapter view
│       ├── EntityList.css       # Shared CSS for FlagManager, StatusManager, PathChapterManager list views; includes drag-and-drop affordances
│       ├── ContextMenu.jsx      # Right-click menu: add nodes / paste (pane), edit / start / copy / duplicate / delete (node), edit / delete (edge), align / distribute / duplicate / delete (multi); Esc closes
│       ├── NameModal.jsx        # Name / rename flags, statuses, paths, chapters, tags, types; spaces → _ for flags and statuses; batch flags; Enter confirms; through ModalPortal
│       ├── CommandPalette.jsx   # Ctrl+K searchable overlay using per-slice selectors and functional state updates; entity search index across all narrative types; navigate-to-entity via canvas-navigate-to-node DOM event
│       ├── Toast.jsx            # Top-right corner of the canvas area (mounted inside .app__canvas), reading toastStore; renders stacked auto-dismiss notifications with info/success/warning/error variants
│       ├── layout/
│       │   ├── SideRail.jsx     # Shared icon+label rail + docked panel (Redesign Step 4); replaces NameplateTab
│       │   ├── SideRail.css
│       │   ├── LeftSidebar.jsx  # Project data rail (SideRail): Flags, Status, Collectibles, Tags, Chapters, Paths, Types; dims during campaigns
│       │   ├── RightSidebar.jsx # Nodes rail (SideRail): Browse, Inspect (+ Routes, Campaigns, Sandbox when the Campaign switch is on); listens for switch-right-panel
│       ├── panels/
│       │   ├── BrowsePanel.jsx         # Right "Browse": unified search (labels, flags, statuses, collectibles, options, edge conditions) + filters that dim the canvas
│       │   ├── BrowsePanel.css
│       │   ├── InspectorPanel.jsx      # Right "Inspect": quick-edit node / edge / multi-selection; opens full modals for complex parts
│       │   ├── InspectorPanel.css
│       │   ├── RouteTracingPanel.jsx   # Route tracing panel (config → results view); flag and status priority groups; store-driven results via shortestRouteResults; convergent routes merged into grouped cards via findMergeGroups; Save to Campaign button with multi-axis node-navigator modal; searchAll checkbox (uncapped BFS) with warning and Cancel button; clickable route items navigate canvas via canvas-navigate-to-node; freeze-at-waypoint stores prefix edge IDs in uiStore.frozenWaypointEdgeIds for green overlay; re-route clears waypoints before recomputing
│       │   ├── CampaignListPanel.jsx   # Campaign list with icon-only Enter/Edit/Delete buttons; create/rename/delete via campaignStore; Clear All Seen button (clears narrativeStore editorSeenNodeIds/editorSeenOptionIds)
│       │   └── RightPanels.css        # Shared CSS for all right-sidebar panel components
│       ├── fields/
│       │   ├── ChipsField.jsx          # Removable chips + "Add…" select (tags, flags, collectibles)
│       │   ├── StatusEffectsField.jsx  # Edit status changes (status, ± / =, amount)
│       │   └── fields.css
│       ├── floating/
│       │   ├── FloatingMiddleBar.jsx   # Centered overlay above canvas; hidden in authoring mode (functions moved to TopBar); displays exclusively in campaign mode: active-campaign pill with Overlay/Follow/Undo/Reset/Save/Load/Autosave/Save Seen/Exit controls
│       │   └── FloatingMiddleBar.css
│       ├── modals/
│       │   ├── NodeConfigModal.jsx     # Full node editor (Common / Choice two columns, Ending single, Hub compact): text, chapter/path/type, collectibles, start node, on-enter changes, Choice options + conditions, tags; Enter saves
│       │   ├── NodeConfigModal.css
│       │   ├── WarpConfigModal.jsx     # Warp editor: label, text, connected warp / channel, delete; Enter saves
│       │   ├── EdgeConfigModal.jsx     # Edge editor: from → to, label, AND/OR condition builder, delete; Enter saves
│       │   ├── EdgeConfigModal.css
│       │   ├── LoadProjectDialog.jsx   # Load project dialog: lists saves/ (name, size, date), "Browse other file…" fallback
│       │   ├── ShortcutsDialog.jsx     # Keyboard shortcut sheet ("?" or Settings)
│       │   └── SettingsModal.jsx       # Editor preferences (snap, display modes, search edge toggle, Campaign & Route Tracing switch); built on system.css primitives; applies live
│       ├── nodes/
│       │   ├── CommonNode.jsx          # Common node card: subtype or "Common" label, effects + collectible badges, warnings; reads isFilteredOut
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
