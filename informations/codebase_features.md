# Branching Routes - Codebase Features Overview

This document provides a high-level overview of the major React components, context providers, and features implemented across the application architecture.

## Core State & Management

### `src/context/EditorContext.jsx`
- **Purpose**: The "Brain" of the editor. This React Context manages the application's entire global state and handles the complete CRUD (Create, Read, Update, Delete) lifecycle for all narrative entities.
- **Split Context Architecture**: Utilizes a dual-provider system (`DataContext` and `ActionsContext`) to decouple reactive state from stable callbacks, preventing unnecessary re-renders across the editor.
- **State Collections Managed**: `flags`, `statusPoints`, `paths`, `chapters`, `choices`, `scenes`, `quests`, `endings`.
- **Automatic Sanitization**: Enforces strict `snake_case` naming conventions globally across all entities via `sanitizeName` to ensure consistent data IDs and easier integration with external game engines.
- **Global Anchor**: `entryNode` defines the strictly enforced initial node representing where the core game logic begins evaluating.
- **ID Generation**: Automatically generates sequential, prefix-based IDs (`F`, `CH`, `S`, `P`, `C`, `SP`, `Q`, `E`) for main nodes, and randomized unique string IDs for nested `Choice Options` to ensure stable UI state.
- **Dual-Mode Data Protection**: 
  - **Blocking Deletion**: `Endings`, `Choices`, and `Scenes` are strictly blocked from deletion if referenced as a target elsewhere.
  - **Cascading Cleanup**: `Flags`, `Paths`, `Chapters`, `Stats`, and `Quests` perform automatic recursive cleanup, removing themselves from all requirements and modifiers upon deletion.
- **Persistence & Logic Tracking**: 
  - **Debounced Save**: Houses a 500ms debounced `localStorage` auto-save engine.
  - **Dependency Mapping**: Maintains a real-time `flagReferenceMap` to track exactly where every flag is utilized across the entire project graph.
- **Save/Load**: Houses the unified `loadData` parsing function to serialize incoming `JSON` formats correctly into the active state.

### `src/App.jsx`
- **Purpose**: The main Layout and Routing wrapper application.
- **Unified JSON Export/Import**: Contains the `handleExport` and `handleImport` mechanisms that serialize all 8 entity nodes into a single, cohesive `branching-routes.json` save structure.
- **Advanced Import Validation**: Performs recursive type-checking, structural integrity verification (ensuring `id` fields), and active **ID Collision Detection** that prompts users before overwriting local data.
- **Global Entry Configurator**: Provides a top-level header dropdown to configure the project's global initialization node (`entryNode`) with filtered search.
- **Error Boundary Protection**: The main dynamic stage is wrapped in a React `ErrorBoundary` to gracefully isolate and handle runtime logic failures in specific manager views without crashing the entire editor.
- **Expansive Workspace UI**: Provides the dedicated sticky left sidebar for high-density navigation between all 9 tabbed views and a wide, flex-based main canvas.

## Narrative Structure Modules

### `src/components/paths/PathManager.jsx`
- **Purpose**: Defines broad, high-level story branches or specialized character routes (e.g., "Vigilante Route", "Romance Route").
- **Features**: 
  - **Inline CRUD**: Creation, deletion, and real-time name editing of Paths.
  - **Dynamic Assignment**: Assignable to Choices and Scenes to categorize and filter logic sequences.
  - **QuickNav Tracking**: Fully integrated with the `QuickNav` floating index for rapid jumping between dense path lists.
  - **Logic Status**: Acts as a high-level organizational filter with no direct internal logical requirements.

### `src/components/chapters/ChapterManager.jsx`
- **Purpose**: Defines massive chronological milestones over the story span (e.g., "Prologue", "Act 1", "Epilogue").
- **Features**: 
  - **Timeline Organization**: Acts as a grouping tag for Scenes and Choices to harmonize story progression.
  - **QuickNav Tracking**: Fully integrated with the `QuickNav` floating index for rapid jumping between dense chapter lists.
  - **Global Workspace Filtering**: Enables specific Chapter-based scoping across all logic editors to condense high-density projects.

### `src/components/quests/QuestManager.jsx`
- **Purpose**: Groups dialogue and narrative moments into highly visible thematic blocks (e.g., "Bank Heist", "Dinner Date").
- **Features**: 
  - **Thematic Structuring**: Provides a high-level grouping layer mapped directly against individual Scene components.
  - **QuickNav Synchronization**: Hooked into the floating index for rapid jumping across complex quest-based logic maps.
  - **Inline CRUD**: Instant creation and `snake_case` name updates for rapid project sketching.

### `src/components/endings/EndingManager.jsx`
- **Purpose**: Distinct endpoint goals mapping specifically against narrative closures.
- **Features**: 
  - **Accordion-Based Workflow**: Detailed individual ending configurations wrapped in a collapsible layout with global "Expand/Collapse All" controls to manage dense outcome lists.
  - **Condition Matrix**: Integrates `ConditionEditor` instances to construct complex Flag and Status requirements a player must meet to achieve the designated ending.
  - **Dependency Summary**: Provides a real-time count of attached requirements directly on the entity header for high-level logic monitoring.
  - **QuickNav Tracking**: Fully integrated with the `QuickNav` floating index for rapid jumping across project endpoints.

## Logic Variables & Condition Managers

### `src/components/flags/FlagManager.jsx`
- **Purpose**: The definitive list of boolean conditions (`true`/`false`) tracked over the narrative lifecycle.
- **Features**: 
  - **Reference Tracking**: Utilizes the global `flagReferenceMap` to monitor exactly how many Scenes and Choices utilize each specific flag.
  - **Smart Deletion Safety**: Triggers a detailed confirmation modal if a user attempts to delete a flag currently active in the logic graph, preventing unintentional logic breaks.
  - **"In Use" Badging**: Provides high-visibility badges on active flags, indicating the total count of referencing nodes at a glance.
  - **QuickNav Tracking**: Fully integrated with the `QuickNav` floating index for rapid jumping between dense variable lists.

### `src/components/status/StatusManager.jsx`
- **Purpose**: Defines quantitative numeric statistics (`Strength`, `Money`, `Health`) for non-binary narrative tracking.
- **Features**: 
  - **Baseline Configuration**: Establishes the initial numerical starting value for each variable, which serves as the anchor point for all subsequent modifications in the Sandbox engine.
  - **Inline CRUD**: Rapid creation, deletion, and renaming of global status points.
  - **QuickNav Tracking**: Fully integrated with the `QuickNav` floating index for rapid jumping between dense numeric variable pools.

## Event Editors (The Core Logic Builders)

### `src/components/choices/ChoiceEditor.jsx`
- **Purpose**: Design complex player decisions and define immediate narrative consequences.
- **Features**:
  - **Dynamic Structuring**: Individual Options configure distinct `next` destination targets uniformly handled via `SearchableDropdowns`, including dedicated support for **Loop-to-Self** logic.
  - **Modifier Engines**: Every choice option integrates a `FlagsSetEditor` (for flipping boolean states) and a `StatusSetEditor` (for incremental numeric modifications).
  - **Requirements**: Options support localized boolean or numerical requirements (`min`/`max`) via a nested `ConditionEditor` instance acting as lock criteria for the player.
  - **Global Entry Point Integration**: Incorporates "Set as Entry Node" buttons mapping anchor IDs locally across the tree.
  - **Nested Accordion Layout**: Utilizes a two-tier collapsible UI for both top-level Choices and their individual Options. Unfocused nodes collapse into high-density **Summary Headers** showing Chapter, Path, and Option counts for rapid navigation.

### `src/components/scenes/SceneEditor.jsx`
- **Purpose**: Creates narrative text sequences mapping directly onto logic variables.
- **Features**:
  - **Sequential Logic Engine**: Manages two distinct logic layers: **Visibility Conditions** (determining when a scene is triggered) and **Scene Routing** (governing the destination after completion).
  - **Conditional Destinations**: Can possess multiple `Next` targets with their own `ConditionEditor` instances for complex sequential branching, with dedicated support for **Fallback Routes**.
  - **Rich Text Entry**: Provides a dedicated high-density `textarea` for the core narrative story content.
  - **Collapsible UI**: Individual Scenes utilize an Accordion layout with high-density **Summary Headers** showing Chapter/Path tags and route counts for rapid project browsing.
  - **Global Entry Point Integration**: Incorporates "Set as Entry Node" buttons mapping anchor IDs locally across the tree.

## Utility & Simulation Core

### `src/components/simulator/Simulator.jsx`
- **Purpose**: The active "Playtest Sandbox" mapping strictly against how an external Game Engine would load the `.json` structure natively.
- **Features**: 
  - **Pre-Flight Initialization**: Maps natively onto the active `entryNode` allowing click-to-start, while supporting custom selection of specific Scenes/Choices for isolated testing.
  - **Derivation-Based State Engine**: Flags and Status points are not stored as static variables; they are mathematically derived in real-time from the chronological `historyStack`.
  - **Loop & Lock Detection**: Automatically greys out previously selected loop-back options on Choice nodes to prevent infinite recursion and ensure player progression.
  - **Terminal Outcome Detection**: Recognizes terminal "Ending" nodes and triggers a specialized Award-themed UI presenting narrative closure.
  - **Undo & Revive Workflow**: Enables users to step backward through the history stack or restart from the initial starting node without a full session reset.
  - **Live Logic Sidebar**: Provides a high-visibility real-time mapping of all global scenes, highlighting which nodes are "reachable" under the current derived state.

### `src/components/shared/ConditionEditor.jsx`
- **Purpose**: Powerful shared requirement-builder UI component natively embedded across all major components.
- **Features**: 
  - **Matrix Constraints**: Modularly maps constraints parsing boolean `True/False` (Flags) or numeric matrices (`Min/Max` Status Points) on the same array structure.
  - **Stable ID Mapping**: Automatically generates and persists unique IDs (`_id`) for every rule to ensure stable React list rendering and reliable state updates.
  - **Unconditional Access Logic**: Explicitly handles empty rulesets as "inherently accessible," ensuring narrative continuity when no locks are defined.
  - **Visual Feedback**: Provides immediate contextual styling (Indigo for Flags, Emerald for Status) and utilizes `SearchableDropdown` hooks for rapid variable assignment.

### `src/components/shared/SearchableDropdown.jsx`
- **Purpose**: The primary mechanism managing highly-scalar variable pools scaling structurally securely.
- **Features**: 
  - **Multi-Type Logic**: Supports unified selection of Scenes, Choices, and Endings within a single interface.
  - **Dynamic Filtering**: Presents quick-toggle filtering by **Type**, **Path**, and **Chapter** scopes to manage high-density entity lists.
  - **Sticky Headers**: Utilizes a backdrop-blur sticky header system to visually group items by their entity type for easier navigation.
  - **Search & Highlighting**: Inject deep string-matching across IDs and names with full **Keyboard Navigation** support (Arrow keys, Enter, Escape).
  - **Loop-to-Self Support**: Employs specialized sentinel logic (`__LOOP__`) to natively support null-ID routing targets for recursive decision loops.

### `src/components/shared/QuickNav.jsx`
- **Purpose**: The structural "Minimap" floating sticky index for high-density editors.
- **Features**: 
  - **Native DOM Synchronization**: Directly hooks into the `document.getElementById` API for precise, jump-to-source navigation.
  - **Smooth Positional Focus**: Utilizes the `.scrollIntoView()` native API to seamlessly translate the workspace view to the target node's coordinates.
  - **Visual Indicator Pulse**: Temporarily applies high-visibility `ring-4` styling (1500ms) to the target element upon arrival to provide immediate visual focus.
  - **Safe DOM Cleanup**: Incorporates `activeTimerRef` and `isConnected` guards to prevent stale DOM manipulation if elements are removed during a transition.

### `src/components/shared/ErrorBoundary.jsx`
- **Purpose**: A defensive wrapper that isolates rendering failures to preserve application stability.
- **Features**: 
  - **Graceful Fault Isolation**: Prevents local logic errors in complex manager views from crashing the entire persistence engine.
  - **Recovery UI**: Provides a specialized fallback interface with error reporting and a "Try Again" state reset mechanism.

## Styling & Entry Point

### `src/index.css`
- **Purpose**: Global style definition and design token configuration.
- **Features**: 
  - **Tailwind Integration**: Houses the `@import "tailwindcss"` layer for utility-first styling.
  - **Base Aesthetic Normalization**: Enforces the project's premium anti-aliased typography and background tokens across the root body.

### `src/main.jsx`
- **Purpose**: The immutable application entry point.
- **Features**: 
  - **Provider Orchestration**: Bootstraps the `EditorProvider` context wrapper around the core `App` component to enable global logic persistence.
  - **StrictMode Enforcement**: Activates React's `StrictMode` to identify potential logic side-effects during development.
