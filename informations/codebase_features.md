# Branching Routes - Codebase Features Overview

This document provides a high-level overview of the major React components, context providers, and features implemented across the application architecture, reflecting the Phase 5 Canvas-First UI Overhaul.

## Core State & Management

### `src/context/EditorContext.jsx`
- **Purpose**: The "Brain" of the editor. This React Context manages the application's entire global state and handles the complete CRUD lifecycle for all narrative entities.
- **Split Context Architecture**: Utilizes a dual-provider system (`DataContext` and `ActionsContext`) to decouple reactive state from stable callbacks, preventing unnecessary re-renders.
- **State Collections Managed**: `flags`, `statusPoints`, `paths`, `chapters`, `choices`, `scenes`, `quests`, `endings`.
- **Targeted Sanitization**: Enforces strict `snake_case` naming conventions globally across system variables (`Flags`, `Paths`, `Chapters`, `Status Points`, `Quests`) via `sanitizeName`, while explicitly protecting `Scenes`, `Choices`, and `Endings` to support free-form capitalization and spacing.
- **Global Anchor**: `entryNode` defines the strictly enforced initial node representing where the core game logic begins evaluating.
- **ID Generation**: Automatically generates sequential, prefix-based IDs (`F`, `CH`, `S`, `P`, `C`, `SP`, `Q`, `E`) for main nodes, and randomized unique string IDs for nested `Choice Options`.
- **Dual-Mode Data Protection**: 
  - **Blocking Deletion**: `Endings`, `Choices`, and `Scenes` are strictly blocked from deletion if referenced as a target elsewhere.
  - **Cascading Cleanup**: `Flags`, `Paths`, `Chapters`, `Stats`, and `Quests` perform automatic recursive cleanup, removing themselves from all requirements and modifiers upon deletion.
  - **Debounced Save**: Houses a 500ms debounced `IndexedDB` auto-save engine via `localforage` for persistent, non-blocking asynchronous state storage.
  - **Dependency Mapping**: Provides on-demand getter functions (`getFlagReferenceMap`, `getStatusReferenceMap`, and `getDependencyGraph`) to track exactly where every entity is utilized across the active project graph.
- **Save/Load/Reset**: Houses the unified `loadData` parsing function to serialize incoming `JSON`, and `clearData` to instantly baseline the entire project workspace.

### `src/App.jsx`
- **Purpose**: The main Layout and Routing wrapper application orchestrating the 3-column UI.
- **Global Layout State**: Manages `activeNavItem` and `activeEditId` to synchronize interactions between the Left Sidebar and the RouteViewer canvas.
- **Unified JSON Export/Import**: Contains the `handleExport` and `handleImport` mechanisms that serialize all 8 entity nodes into a single `branching-routes.json` file.
- **Advanced Import Validation**: Performs recursive type-checking, structural integrity verification, and **ID Collision Detection** that prompts users before overwriting local data.
- **Error Boundary Protection**: The main dynamic stage is wrapped in a React `ErrorBoundary` to gracefully isolate and handle runtime logic failures.

## Core Layout Components (The 3-Column UI)

### `src/components/layout/LeftSidebar.jsx`
- **Purpose**: High-density contextual command center dynamically transforming based on the active user intent.
- **Features (4 Modes)**:
  - **Mode 1 (Dashboard)**: Default view showing total counts of all narrative entities.
  - **Mode 2 (Entity List)**: Renders searchable, filterable lists of project entities based on the selected NavBar tab. Replaces the legacy `QuickNav` system.
  - **Mode 3 (Read-Only Inspector & Forms)**: Renders a comprehensive Read-Only Inspector for `Scenes`, `Choices`, and `Endings` (dynamically displaying condition blocks, narrative variants, option sets, and structured two-row next-target layouts). For other entities, dynamically mounts the appropriate inline CRUD form extracted from `src/components/layout/forms/`. Includes un-saved draft discarding guardrails.
  - **Mode 4 (Live Simulator HUD)**: When a simulation is active, automatically overrides all editing modes to display the `DynamicTracker`, showing live variable and status logic changes.

### `src/components/routeviewer/RouteViewer.jsx`
- **Purpose**: The permanent central workspace displaying a comprehensive visual node graph mapping the entire structural project logic using `@xyflow/react` (React Flow).
- **Features**: 
  - **Interactive Canvas-First Editing**: Clicking any node on the graph instantly signals `App.jsx` to load the corresponding edit form in the Left Sidebar.
  - **Dynamic Auto-Layout**: Integrates `dagre` to automatically format dense logic trees. Features a "Layout Options" interface giving users real-time control to toggle between Top-to-Bottom or Left-to-Right layout directions, alongside customizable Node/Rank spacing sliders.
  - **Draggable Workspace**: Employs React Flow's `useNodesState` to ensure logic nodes are draggable and intelligently preserved during active simulation state changes.
  - **Static Reachability Analysis**: Proactively scans the logic structure for "Mutually Exclusive Conditions", rendering unreachable nodes as fully disabled blockages.
  - **Live Graph Tracking**: Synchronizes with `useSimulator` to visually represent active plays. Highlights the `currentNodeId`, turns visited routes green, pulses active edges, and utilizes an automatic dynamic camera.
  - **Custom Nodes (`SceneNode`, `ChoiceNode`, `EndingNode`)**: Visually customized components that support granular state styling (`idle`, `current`, `visited`, `reachable`, `unreachable`, `terminal`). `SceneNode`s feature a 2-line visual preview of narrative content.

### `src/components/layout/RightSidebar.jsx`
- **Purpose**: Contextual workspace sidebar serving as the permanent home for the Live Simulator.
- **Features**: 
  - **Simulator Context**: Safely isolated rendering of the `SimulatorPanel` to allow authors to track simulation history side-by-side with the visual logic logic without cluttering the center canvas.

## Narrative Structure Modules (The Form Engine)
*(Note: Individual CRUD managers for Flags, Paths, Chapters, Stats, and Quests have been decoupled into dedicated components under `src/components/layout/forms/`. Scenes, Choices, and Endings now utilize a robust Modal-driven editing architecture, leaving the Left Sidebar purely for read-only inspection.)*

### `src/components/layout/forms/PathForm.jsx` & `ChapterForm.jsx`
- **Purpose**: Defines broad, high-level story branches or specific chapters to group narrative moments.
- **Features**: 
  - **Draft State Workflow**: Local tracking of name updates with explicit Save/Cancel logic.
  - **Global Workspace Filtering**: Paths and Chapters can be used in the `RouteViewer` to filter the graph canvas down to highly specific scopes.

### `src/components/layout/forms/QuestForm.jsx` & `EndingForm.jsx`
- **Purpose**: Thematic goals and distinct endpoints mapping against closure conditions.
- **Features**: 
  - **Condition Matrix (Endings)**: Integrates `ConditionEditor` instances to construct complex Flag and Status requirements a player must meet to achieve the designated ending.
  - **Requirement Dependency Summary**: Tracks how many active flags lock an ending.

## Logic Variables & Condition Managers

### `src/components/layout/forms/FlagForm.jsx`
- **Purpose**: The definitive editor for boolean conditions (`true`/`false`) tracked over the narrative lifecycle.
- **Features**: 
  - **Global State Toggle**: Includes a dedicated testing switch to forcibly flip the flag's global true/false state from within the editor, drastically accelerating simulation debugging.
  - **Reference Tracking**: Utilizes the global `flagReferenceMap` to monitor exactly how many Scenes and Choices utilize each specific flag, warning the author before deletion.

### `src/components/layout/forms/StatusForm.jsx`
- **Purpose**: Defines quantitative numeric statistics (`Strength`, `Money`, `Health`) for non-binary narrative tracking.
- **Features**: 
  - **Baseline Configuration**: Establishes initial numerical starting values which serve as the anchor point for all Sandbox operations.
  - **Customizable Floors**: Exposes a `Minimum Value` configuration that securely truncates bounds, gracefully and natively supporting negative minimum ceilings (e.g. allowing relationship statuses to drop below 0).

## Event Editors (The Core Logic Builders)

### `src/components/modals/EditModal.jsx` (Modal Editor Flow)
- **Purpose**: A universal 600px modal shell overlay acting as the sole entry point for editing and creating complex narrative nodes.
- **Features**:
  - **Unsaved Changes Guard**: Prevents accidental closure (via clicking outside, Cancel button, or `Escape` key) when drafts differ from global state.
  - **Keyboard Native Workflow**: Instantly opened by hitting the `E` shortcut when an applicable node is selected on the canvas.

### `src/components/modals/ChoiceModalForm.jsx`
- **Purpose**: Design complex player decisions and define immediate narrative consequences.
- **Features**:
  - **Dynamic Structuring**: Individual Options configure distinct `next` destination targets uniformly handled via `SearchableDropdowns`, including dedicated support for **Loop-to-Self** logic.
  - **Modifier Engines**: Every choice option integrates a `FlagsSetEditor` (for flipping boolean states) and a `StatusSetEditor` (for incremental numeric modifications).
  - **Requirements**: Options support localized boolean or numerical requirements (`min`/`max`) via a nested `ConditionEditor` instance.

### `src/components/modals/SceneModalForm.jsx`
- **Purpose**: Creates narrative text sequences mapping directly onto logic variables.
- **Features**:
  - **Sequential Logic Engine**: Manages two distinct logic layers: **Visibility Conditions** (determining when a scene is triggered) and **Scene Routing** (governing the destination after completion).
  - **Rich Text Entry**: Provides a dedicated high-density `textarea` for the core narrative story content, seamlessly bridged to the canvas preview.
  - **Fallback Routes**: Complex sequencing supports intelligent routing fallbacks when requirements are mutually skipped.
  - **Narrative Variants**: Supports additive scene variants with isolated conditions mapped via the same constraints engine, enabling dynamic descriptive variations without rebuilding shared logic.

## Utility & Simulation Core

### `src/hooks/useSimulator.js`
- **Purpose**: A reusable, decoupled simulation engine that manages the active chronological `historyStack`.
- **Features**: 
  - **Derivation-Based State Engine**: Flags and Status points are derived in real-time with an active **Snapshot Caching** system to optimize performance on long logic chains.
  - **Shared Provider**: Globally executed in `App.jsx` and injected downward to simultaneously power the visual `RouteViewer`, the `RightSidebar` controls, and the `LeftSidebar` HUD.

### `src/utils/` (Core Graph Utilities)
- **Purpose**: Pure JavaScript utilities responsible for abstract data operations decoupled from React's render cycle.
- **Features**:
  - **`dependencyGraph.js`**: Parses the raw JSON logic matrix into a 3-layer Directed Dependency Graph. Crucially separates mutators (`setBy`) from getters (`requiredBy`).
  - **`reachabilityAnalyzer.js`**: Consumes the dependency graph to statically warn authors against structurally impossible states directly within the graphical viewer.
  - **`graphLayout.js`**: Translates the raw Scene/Choice/Ending data arrays into calculated coordinates. Extracts nested description properties for UI rendering.

### `src/components/routeviewer/SimulatorPanel.jsx`
- **Purpose**: The active "Playtest Sandbox" controls residing in the Right Sidebar.
- **Features**: 
  - **Pre-Flight Initialization**: Maps natively onto the active `entryNode` allowing click-to-start, while supporting custom selection of specific Scenes/Choices.
  - **Loop & Lock Detection**: Automatically greys out previously selected loop-back options to prevent infinite recursion and ensure player progression.
  - **History Stack**: Granularly maps backward-compatible tracking of all past navigation steps. Supports explicit "Undo" and manual "Restart" hooks.

### `src/components/layout/DynamicTracker.jsx`
- **Purpose**: Integrated HUD replacing normal sidebar views during active simulations.
- **Features**: 
  - **Variable Isolation**: Bubbles up locally altered active flags and explicitly adjusted status points directly to the top of the view.
  - **Reactive Readouts**: Immediately reflects Sandbox modifier mutations in real-time.

## Shared System Components

### `src/components/shared/ConditionEditor.jsx`
- **Purpose**: Powerful shared requirement-builder UI natively embedded across all major node components.
- **Features**: 
  - **Matrix Constraints**: Modularly maps constraints parsing boolean `True/False` (Flags) or numeric matrices (`Min/Max` Status Points) on the same sequential layout.
  - **Visual Feedback**: Provides immediate contextual styling (Indigo for Flags, Emerald for Status).

### `src/components/shared/SearchableDropdown.jsx`
- **Purpose**: The primary dropdown mechanism scaled for highly massive narrative pools.
- **Features**: 
  - **Virtualization**: Employs `react-virtuoso` for smooth list rendering against hundreds of nodes.
  - **Search & Highlighting**: Deep string-matching natively integrated over IDs and descriptive text.
  - **Loop-to-Self Support**: Utilizes specialized sentinel (`__LOOP__`) routing targets for recursive trees.

### `src/components/shared/ErrorBoundary.jsx`
- **Purpose**: A defensive wrapper built natively around the central RouteViewer.
- **Features**: 
  - **Graceful Fault Isolation**: Prevents total editor collapse if the custom D3/Flow routing topologies throw an unrecognized parser error.
  - **Recovery UI**: Provides an active reset state.
