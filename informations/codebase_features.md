# Branching Routes - Codebase Features Overview

This document provides a high-level overview of the major React components, context providers, and features implemented across the application architecture, reflecting the current Phase 5 Canvas-First UI Overhaul state.

## Core State & Management

### `src/context/EditorContext.jsx`
- **Purpose**: The "Brain" of the editor. Manages the application's entire global state and handles the complete CRUD lifecycle for all narrative entities.
- **Split Context Architecture**: Uses `useEditorData()` and `useEditorActions()` hooks to decouple reactive state from stable callbacks, preventing unnecessary re-renders.
- **State Collections Managed**: `flags`, `statusPoints`, `paths`, `chapters`, `choices`, `scenes`, `quests`, `endings`.
- **ID Generation**: Automatically generates sequential, prefix-based IDs (`F`, `CH`, `S`, `P`, `C`, `SP`, `Q`, `E`) for main nodes, and randomized unique string IDs for nested `Choice Options`.
- **Entry Node**: `entryNode` defines the starting node for the entire narrative.
- **Dual-Mode Data Protection**: 
  - **Blocking Deletion**: `Endings`, `Choices`, and `Scenes` are blocked from deletion if referenced as a target elsewhere.
  - **Cascading Cleanup**: `Flags`, `Paths`, `Chapters`, `StatusPoints`, and `Quests` perform automatic recursive cleanup upon deletion.
- **Debounced Save**: 500ms debounced `IndexedDB` auto-save via `localforage`.
- **Dependency Mapping**: Provides `getFlagReferenceMap`, `getStatusReferenceMap`, and `getDependencyGraph` for tracking entity usage.
- **Migration Functions**: `migrateOptionNext` (legacy string-format next to array-of-routes), `migrateSceneFields` (adds `type`, `flags_set`, `status_set` defaults), `migrateFlagFields` (adds `path`, `chapter` defaults). Applied during IndexedDB hydration and data import.
- **Scene Types**: Manages a `sceneTypes` string array for project-level scene type definitions. CRUD via `addSceneType`, `removeSceneType`, `setSceneTypesAction`. Cascading cleanup on type removal nullifies referencing scenes.

### `src/App.jsx`
- **Purpose**: Main application orchestrator with 3-column layout.
- **State Management**: Manages `activeNavItem`, `activeEditId`, `backtrackTargetId`, `tracedPath` for synchronization between sidebar and canvas.
- **Unified JSON Export/Import**: Serializes all 8 entity types to `branching-routes.json`.
- **Advanced Import Validation**: Recursive type-checking, structural integrity, and ID collision detection.
- **E Key Shortcut**: Opens modal for editing selected canvas node.
- **Route Tracing**: Integrates `traceRoute` from `routeTracer.js` for backtracking analysis.

## Core Layout Components (The 3-Column UI)

### `src/components/layout/NavBar.jsx`
- **Purpose**: Top horizontal navigation with entity type tabs.
- **Tabs**: Flags, Status, Choices, Scenes, Paths, Chapters, Quests, Endings, Entry Node.
- **Features**: Entity counts, active tab indicator, entry node selector.

### `src/components/layout/LeftSidebar.jsx`
- **Purpose**: Dynamic contextual command center.
- **4 Modes**:
  - **Dashboard**: Shows entity counts, entry node status.
  - **Entity List**: Searchable, filterable lists by NavBar selection.
  - **Forms/Inspector**: CRUD forms for non-canvas entities; read-only inspector for Scenes/Choices/Endings.
  - **Dynamic Tracker**: During simulation, shows live flag/status changes.
- **Features**: Unsaved draft guardrails, node selection sync with canvas.

### `src/components/routeviewer/RouteViewer.jsx`
- **Purpose**: Central workspace with visual node graph using `@xyflow/react`.
- **Features**:
  - **Interactive Canvas-First Editing**: Click node to edit in sidebar.
  - **Dynamic Auto-Layout**: `dagre` integration with layout options UI (TB/LR direction, node/rank spacing).
  - **Graph Filtering**: Filter by Path and/or Chapter.
  - **Static Reachability Analysis**: Renders unreachable nodes as disabled.
  - **Live Graph Tracking**: Synchronizes with simulator - current node highlighted, visited routes in green, camera follow.
  - **Node States**: `idle`, `current`, `visited`, `reachable`, `unreachable`, `terminal`.
  - **Route Trace Highlighting**: Gold highlight overlay on traced paths.
  - **Camera Preservation**: Restores viewport after layout recalculation.
  - **Custom Nodes**: `SceneNode`, `ChoiceNode`, `EndingNode` with state-based styling.
  - **Edge Connections**: Canvas edge wiring syncs with `next` field.

### `src/components/layout/RightSidebar.jsx`
- **Purpose**: Simulator and route trace controls.
- **Features**:
  - **SimulatorPanel**: Playtest sandbox with start/undo/reset controls.
  - **Route Trace Panel**: Backtracking results display with path highlighting.
  - **Filter Controls**: Path and chapter filters.

### `src/components/routeviewer/InspectorPanel.jsx`
- **Purpose**: In-canvas inspector for selected nodes.
- **Features**: Read-only view of node data, requires display, trace route button, reference count.

### `src/components/layout/NodeInspector.jsx`
- **Purpose**: Read-only inspector panels for Scene, Choice, and Ending entities in the sidebar.
- **Features**: Displays full entity data (requires, flags_set, status_set, next targets), condition satisfaction badges, reference counts. Synchronized with canvas node selection.

## Entity Managers (Legacy Tab-Based Editors)

These components remain for backward compatibility but are largely superseded by the sidebar forms:

### `src/components/flags/FlagManager.jsx`
### `src/components/status/StatusManager.jsx`
### `src/components/choices/ChoiceEditor.jsx`
### `src/components/scenes/SceneEditor.jsx`
### `src/components/paths/PathManager.jsx`
### `src/components/chapters/ChapterManager.jsx`
### `src/components/quests/QuestManager.jsx`
### `src/components/endings/EndingManager.jsx`

## Sidebar Forms (Phase 5 Architecture)

### `src/components/layout/forms/FlagForm.jsx`
- **Features**: Name editing, reference tracking, global state toggle for debugging.

### `src/components/layout/forms/StatusForm.jsx`
- **Features**: Starting value, minimum value (floor) configuration.

### `src/components/layout/forms/PathForm.jsx` & `ChapterForm.jsx`
- **Features**: Name editing, global workspace filtering support.

### `src/components/layout/forms/QuestForm.jsx` & `EndingForm.jsx`
- **Features**: Name editing, condition matrix for endings.

### `src/components/layout/forms/SceneForm.jsx` & `ChoiceForm.jsx`
- **Features**: Modal-driven editing, draft state workflow.

## Modal Editors

### `src/components/modals/EditModal.jsx`
- **Purpose**: Universal 600px modal shell for canvas entities.
- **Features**: Unsaved changes guard, E key shortcut support, initial position from canvas viewport.

### `src/components/modals/SceneModalForm.jsx`
- **Features**: Name, description, path/chapter, requires conditions, next targets with fallback, narrative variants support.

### `src/components/modals/ChoiceModalForm.jsx`
- **Features**: Text, path/chapter, requires, options with flags_set, status_set, next targets, localized requirements.

### `src/components/modals/EndingModalForm.jsx`
- **Features**: Name, requires conditions, terminal indicator.

### `src/components/modals/SettingsModal.jsx`
- **Purpose**: Project-level configuration panel (Scene Types management).
- **Features**: Add/remove scene types as string chips, usage count badges, confirmation dialog when removing a type in use. Accessed from the top bar.

## Utility & Simulation Core

### `src/hooks/useSimulator.js`
- **Purpose**: Reusable simulation engine with history stack.
- **Features**:
  - Snapshot caching every 50 steps for performance.
  - Derivation-based state (flags/status recalculated from history).
  - Entry node mapping, loop detection, undo support.
  - Exposes `visitedNodeIds`, `takenEdgeIds`, `currentNodeId`.

### `src/hooks/useLongPress.js`
- **Purpose**: Long-press interaction hook for touch and mouse input.
- **Features**: Configurable delay threshold, distinguishes between long-press and tap callbacks. Used in LeftSidebar entity list items.

### `src/utils/graphLayout.js`
- **Purpose**: Converts editor data to React Flow nodes/edges.
- **Features**:
  - `computeLayoutWithPositions()`: Position-aware Dagre layout.
  - Filter support (path/chapter).
  - Custom node dimensions (280px width).
  - Edge handling for choice options and scene next targets.

### `src/utils/dependencyGraph.js`
- **Purpose**: Builds 3-layer directed dependency graph.
- **Features**: Flag setters/getters, status mutators/requirements, navigation adjacency (forward/reverse).

### `src/utils/routeTracer.js`
- **Purpose**: BFS backward traversal for route analysis.
- **Features**:
  - `findAllPathsTo()`: Finds all paths from entry to target (max 20 paths, max depth 50).
  - `annotatePath()`: Annotates path with required options, flags_set, status_set, condition satisfaction.
  - `traceRoute()`: Unified function used by App.jsx.

### `src/utils/reachabilityAnalyzer.js`
- **Purpose**: Static analysis of unreachable nodes.
- **Features**: Detects flags with no setters, mutually exclusive requirements, status points with no mutators.

### `src/components/routeviewer/SimulatorPanel.jsx`
- **Purpose**: Right sidebar playtest controls.
- **Features**: Start/reset, undo, history display, ending detection, option locking for loops.

### `src/components/layout/DynamicTracker.jsx`
- **Purpose**: HUD showing live flags and status during simulation.
- **Features**: Real-time updates, compact mode for many variables.

## Shared System Components

### `src/components/shared/ConditionEditor.jsx`
- **Purpose**: Reusable condition builder for flag/status requirements.
- **Features**: Boolean (flag) and numeric (status min/max) conditions, visual chips.

### `src/components/shared/SearchableDropdown.jsx`
- **Purpose**: Virtualized dropdown for large entity lists.
- **Features**: `react-virtuoso` virtualization, search, loop-to-self via `__LOOP__` sentinel.

### `src/components/shared/ErrorBoundary.jsx`
- **Purpose**: Defensive wrapper for canvas isolation.
- **Features**: Graceful fault isolation, recovery UI.

### `src/components/shared/QuickNav.jsx`
- **Purpose**: Floating minimap for entity navigation.
- **Features**: Click to scroll, entity ID list.

### `src/components/shared/DebouncedInput.jsx` & `DebouncedTextarea.jsx`
- **Purpose**: Debounced form inputs for performance.
