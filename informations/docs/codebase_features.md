# Codebase Features Documentation

## Core Application Files

### `src/App.jsx` (Core Shell)
- **Purpose**: Main application component that orchestrates all UI components and state
- **Key Responsibilities**:
  - Manages modal state for entity editing
  - Handles route tracing and backtracking
  - Coordinates between sidebar components and graph viewer
  - Manages import/export functionality
- **Dependencies**: React, RouteViewer, EditorContext, useSimulator, ErrorBoundary, NavBar, LeftSidebar, RightSidebar, EditModal, SettingsModal, dependencyGraph, routeTracer
- **Notable Behaviors**:
  - Uses useMemo for route trace computation to avoid unnecessary recalculations
  - Implements useCallback for modal handlers to prevent re-renders
  - Manages complex state for editing operations and simulation tracking

### `src/main.jsx` (Entry Point)
- **Purpose**: Application bootstrap and React root mounting
- **Key Responsibilities**:
  - Creates React root with StrictMode
  - Wraps App in EditorProvider for global state
- **Dependencies**: React, react-dom, App, EditorContext
- **Notable Behaviors**:
  - Simple, clean entry point following React 18+ patterns
  - Uses StrictMode for development-time warnings

### `src/context/EditorContext.jsx` (Global State Store)
- **Purpose**: Centralized state management for all narrative data
- **Key Responsibilities**:
  - Manages CRUD operations for all entity types
  - Handles data migration and sanitization
  - Provides auto-save to IndexedDB
  - Implements ID generation and collision resolution
- **Dependencies**: React, localforage, dependencyGraph, conditionUtils
- **Notable Behaviors**:
  - Uses debounced auto-save (500ms) to prevent excessive writes
  - Implements comprehensive data migration for legacy formats
  - Provides ID generation with prefix conventions
  - Handles cascading deletes and reference updates

## Graph Visualization Components

### `src/components/routeviewer/RouteViewer.jsx` (Graph Visualization)
- **Purpose**: Interactive graph canvas for narrative visualization
- **Key Responsibilities**:
  - Renders narrative graph using React Flow
  - Handles node positioning and layout
  - Manages drag-and-drop interactions
  - Integrates with reachability analysis
- **Dependencies**: React, @xyflow/react, EditorContext, graphLayout, reachabilityAnalyzer, conditionUtils, SceneNode, ChoiceNode, EndingNode, lucide-react
- **Notable Behaviors**:
  - Uses Dagre for automatic layout calculations
  - Implements manual drag positioning with persistence
  - Handles edge creation and deletion
  - Integrates with simulation highlighting

### `src/components/routeviewer/nodes/*` (Node Components)
- **Purpose**: Individual node renderers for different entity types
- **Key Responsibilities**:
  - SceneNode: Renders scene nodes with text and variants
  - ChoiceNode: Renders choice nodes with options and conditions
  - EndingNode: Renders ending nodes with requirements
- **Dependencies**: React, lucide-react, conditionUtils
- **Notable Behaviors**:
  - Each node type has specific rendering logic
  - Handles conditional styling based on state
  - Integrates with graph interaction system

## Simulation Components

### `src/hooks/useSimulator.js` (Simulation Engine Logic)
- **Purpose**: Core simulation engine for story progression
- **Key Responsibilities**:
  - Evaluates conditions and determines valid paths
  - Tracks simulation state and history
  - Manages active flags and status points
  - Handles backtracking and route tracing
- **Dependencies**: React, EditorContext, conditionUtils
- **Notable Behaviors**:
  - Pure function-based condition evaluation
  - State management for simulation runs
  - Integration with graph visualization for highlighting
  - History stack management for backtracking

### `src/components/simulator/Simulator.jsx` (Simulator UI)
- **Purpose**: User interface for story simulation
- **Key Responsibilities**:
  - Renders simulation controls and state display
  - Handles user interactions during simulation
  - Displays available choices and story text
  - Manages simulation lifecycle
- **Dependencies**: React, lucide-react, SearchableDropdown, useSimulator, conditionUtils
- **Notable Behaviors**:
  - Integrates with useSimulator hook for state
  - Provides real-time feedback during simulation
  - Handles edge cases like dead ends and endings

## Layout Components

### `src/components/layout/LeftSidebar.jsx` (Primary Navigation)
- **Purpose**: Main sidebar for entity management and simulation
- **Key Responsibilities**:
  - Renders entity lists (flags, status, paths, chapters, quests)
  - Provides CRUD operations for entities
  - Integrates with drag-and-drop reordering
  - Hosts simulation interface
- **Dependencies**: React, lucide-react, EditorContext, useLongPress, @dnd-kit/utilities, FlagForm, StatusForm, PathForm, ChapterForm, QuestForm, DynamicTracker, NodeInspector
- **Notable Behaviors**:
  - Uses @dnd-kit for drag-and-drop functionality
  - Implements dynamic content switching based on simulation state
  - Provides comprehensive entity management
  - Handles complex state interactions

### `src/components/layout/RightSidebar.jsx` (Secondary Navigation)
- **Purpose**: Right sidebar for simulation and search
- **Key Responsibilities**:
  - Renders simulation panel
  - Provides search and navigation functionality
  - Displays node inspector
- **Dependencies**: React, lucide-react, SimulatorPanel, SearchableDropdown, conditionUtils
- **Notable Behaviors**:
  - Integrates with simulation engine
  - Provides quick navigation to nodes
  - Displays detailed node information

### `src/components/layout/NavBar.jsx` (Top Navigation)
- **Purpose**: Application header with global controls
- **Key Responsibilities**:
  - Provides import/export functionality
  - Manages entry node selection
  - Handles settings and help
- **Dependencies**: React, lucide-react
- **Notable Behaviors**:
  - Simple, focused on global operations
  - Integrates with file system for import/export
  - Provides quick access to settings

## Form Components

### `src/components/layout/forms/*` (Entity Forms)
- **Purpose**: Form components for creating and editing entities
- **Key Responsibilities**:
  - SceneForm: Creates/edits scenes with text and variants
  - ChoiceForm: Creates/edits choices with options and conditions
  - FlagForm: Creates/edits flags with state management
  - StatusForm: Creates/edits status points with numeric values
  - ChapterForm: Creates/edits chapters for organization
  - PathForm: Creates/edits paths for categorization
  - QuestForm: Creates/edits quests (schema unclear)
  - EndingForm: Creates/edits endings with requirements
  - FormFooter: Common form footer with save/cancel
- **Dependencies**: React, EditorContext, conditionUtils, various shared components
- **Notable Behaviors**:
  - Consistent validation and error handling
  - Integration with global state for CRUD operations
  - Conditional rendering based on entity type
  - Support for complex nested data structures

### `src/components/modals/*` (Modal Forms)
- **Purpose**: Modal-based forms for entity editing
- **Key Responsibilities**:
  - EditModal: Generic modal wrapper for forms
  - ChoiceModalForm: Modal for choice editing
  - SceneModalForm: Modal for scene editing
  - EndingModalForm: Modal for ending editing
  - SettingsModal: Modal for application settings
- **Dependencies**: React, EditorContext, various form components
- **Notable Behaviors**:
  - Modal state management
  - Form validation and error handling
  - Integration with global state
  - Support for complex nested data structures

## Entity Management Components

### `src/components/chapters/ChapterManager.jsx`
- **Purpose**: Manages chapter entities and organization
- **Key Responsibilities**:
  - Renders chapter list and details
  - Provides CRUD operations for chapters
  - Integrates with scene organization
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Support for chapter-scene relationships

### `src/components/choices/ChoiceEditor.jsx`
- **Purpose**: Comprehensive choice editing interface
- **Key Responsibilities**:
  - Renders choice list and details
  - Provides advanced editing for choice options
  - Handles complex condition management
  - Integrates with graph visualization
- **Dependencies**: React, EditorContext, conditionUtils
- **Notable Behaviors**:
  - Complex nested data management
  - Advanced condition editing
  - Integration with graph for visual feedback
  - Support for multiple options and targets

### `src/components/endings/EndingManager.jsx`
- **Purpose**: Manages ending entities
- **Key Responsibilities**:
  - Renders ending list and details
  - Provides CRUD operations for endings
  - Handles requirement management
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Support for conditional requirements

### `src/components/flags/FlagManager.jsx`
- **Purpose**: Manages boolean flag entities
- **Key Responsibilities**:
  - Renders flag list and details
  - Provides CRUD operations for flags
  - Handles flag state management
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Support for flag-chapter relationships

### `src/components/paths/PathManager.jsx`
- **Purpose**: Manages path entities
- **Key Responsibilities**:
  - Renders path list and details
  - Provides CRUD operations for paths
  - Integrates with scene organization
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Support for path-scene relationships

### `src/components/quests/QuestManager.jsx`
- **Purpose**: Manages quest entities
- **Key Responsibilities**:
  - Renders quest list and details
  - Provides CRUD operations for quests
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Schema unclear but structure exists

### `src/components/status/StatusManager.jsx`
- **Purpose**: Manages numeric status point entities
- **Key Responsibilities**:
  - Renders status list and details
  - Provides CRUD operations for status points
  - Handles numeric value management
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Simple list-based management
  - Integration with global state
  - Support for status-chapter relationships

### `src/components/scenes/SceneEditor.jsx`
- **Purpose**: Comprehensive scene editing interface
- **Key Responsibilities**:
  - Renders scene list and details
  - Provides advanced editing for scene content
  - Handles variants and conditional text
  - Integrates with graph visualization
- **Dependencies**: React, EditorContext, conditionUtils
- **Notable Behaviors**:
  - Complex nested data management
  - Advanced text editing with variants
  - Integration with graph for visual feedback
  - Support for multiple next targets

## Shared Components

### `src/components/shared/ConditionEditor.jsx`
- **Purpose**: Reusable condition editing component
- **Key Responsibilities**:
  - Renders condition groups and individual conditions
  - Provides operators (AND/OR) and condition management
  - Handles complex nested condition structures
- **Dependencies**: React, conditionUtils
- **Notable Behaviors**:
  - Modular condition editing
  - Support for complex logical structures
  - Integration with condition evaluation utilities
  - Reusable across all form components

### `src/components/shared/SearchableDropdown.jsx`
- **Purpose**: Advanced searchable dropdown component
- **Key Responsibilities**:
  - Renders searchable dropdown with filtering
  - Handles large datasets efficiently
  - Provides keyboard navigation
- **Dependencies**: React
- **Notable Behaviors**:
  - Optimized for performance with large lists
  - Support for keyboard navigation
  - Debounced search for responsiveness
  - Reusable across all form components

### `src/components/shared/DebouncedInput.jsx` and `DebouncedTextarea.jsx`
- **Purpose**: Input components with debounced change events
- **Key Responsibilities**:
  - Renders input/textarea with debounced onChange
  - Prevents excessive re-renders during typing
  - Integrates with form validation
- **Dependencies**: React
- **Notable Behaviors**:
  - Debounced change events (500ms default)
  - Prevents excessive state updates
  - Improves performance during text input
  - Reusable across all form components

### `src/components/shared/FlagsSetEditor.jsx` and `StatusSetEditor.jsx`
- **Purpose**: Editors for flag and status set arrays
- **Key Responsibilities**:
  - Renders arrays of flag/status mutations
  - Provides add/remove operations
  - Integrates with global state
- **Dependencies**: React, EditorContext
- **Notable Behaviors**:
  - Array management with add/remove
  - Integration with global state for validation
  - Support for complex nested data structures
  - Reusable across form components

### `src/components/shared/ErrorBoundary.jsx`
- **Purpose**: Error boundary component for graceful error handling
- **Key Responsibilities**:
  - Catches JavaScript errors in child components
  - Displays fallback UI on error
  - Logs errors for debugging
- **Dependencies**: React
- **Notable Behaviors**:
  - Prevents entire app crash on component errors
  - Provides user-friendly error messages
  - Logs errors for debugging
  - Reusable across application

### `src/components/shared/QuickNav.jsx`
- **Purpose**: Quick navigation component
- **Key Responsibilities**:
  - Provides quick access to common navigation targets
  - Integrates with search functionality
  - Improves user navigation efficiency
- **Dependencies**: React
- **Notable Behaviors**:
  - Quick access to common targets
  - Integration with search functionality
  - Improves user navigation efficiency
  - Reusable across application

## Utility Components

### `src/hooks/useLongPress.js`
- **Purpose**: Custom hook for long press detection
- **Key Responsibilities**:
  - Detects long press gestures on elements
  - Provides callback for long press events
  - Handles timing and cancellation
- **Dependencies**: React
- **Notable Behaviors**:
  - Custom gesture detection
  - Configurable timing
  - Handles edge cases like mouse leave
  - Reusable across components

### `src/hooks/useSimulator.js`
- **Purpose**: Custom hook for simulation state management
- **Key Responsibilities**:
  - Manages simulation state and history
  - Provides simulation control functions
  - Integrates with condition evaluation
- **Dependencies**: React, EditorContext, conditionUtils
- **Notable Behaviors**:
  - Complex state management
  - Integration with condition evaluation
  - History stack management
  - Reusable across simulation components

## Utility Functions

### `src/utils/conditionUtils.js`
- **Purpose**: Pure functions for condition evaluation and manipulation
- **Key Responsibilities**:
  - Evaluates condition groups and individual conditions
  - Normalizes condition structures
  - Provides utility functions for condition manipulation
- **Dependencies**: None (pure functions)
- **Notable Behaviors**:
  - Pure, stateless functions
  - Comprehensive condition evaluation
  - Support for complex logical structures
  - Reusable across entire application

### `src/utils/dependencyGraph.js`
- **Purpose**: Builds dependency graph for narrative elements
- **Key Responsibilities**:
  - Creates graph structure from narrative data
  - Tracks flag and status dependencies
  - Provides adjacency information for traversal
- **Dependencies**: conditionUtils
- **Notable Behaviors**:
  - Graph-based dependency tracking
  - Support for complex dependency chains
  - Integration with condition evaluation
  - Reusable for analysis and simulation

### `src/utils/graphLayout.js`
- **Purpose**: Automatic graph layout using Dagre
- **Key Responsibilities**:
  - Calculates node positions using Dagre
  - Handles manual positioning overrides
  - Provides layout configuration
- **Dependencies**: @dagrejs/dagre, conditionUtils
- **Notable Behaviors**:
  - Automatic layout calculation
  - Support for manual positioning
  - Integration with React Flow
  - Reusable for graph visualization

### `src/utils/reachabilityAnalyzer.js`
- **Purpose**: Analyzes graph reachability and identifies dead ends
- **Key Responsibilities**:
  - Traverses graph to find reachable nodes
  - Identifies unreachable nodes and dead ends
  - Provides warnings for narrative issues
- **Dependencies**: dependencyGraph, conditionUtils
- **Notable Behaviors**:
  - Graph traversal algorithms
  - Dead end detection
  - Integration with condition evaluation
  - Provides actionable warnings

### `src/utils/routeTracer.js`
- **Purpose**: Traces paths through narrative graph
- **Key Responsibilities**:
  - Finds all paths between nodes
  - Evaluates path conditions
  - Provides path highlighting for simulation
- **Dependencies**: conditionUtils
- **Notable Behaviors**:
  - Path finding algorithms
  - Condition evaluation for paths
  - Integration with simulation highlighting
  - Reusable for analysis and debugging

## Testing Files

### `src/utils/conditionUtils.test.js`, `src/utils/dependencyGraph.test.js`, `src/utils/routeTracer.test.js`
- **Purpose**: Unit tests for core utility functions
- **Key Responsibilities**:
  - Tests condition evaluation logic
  - Tests graph building and traversal
  - Tests path finding and analysis
- **Dependencies**: Various utility functions
- **Notable Behaviors**:
  - Comprehensive test coverage
  - Edge case testing
  - Integration testing for related utilities
  - Ensures reliability of core functions

## Configuration Files

### `eslint.config.js`, `vite.config.js`, `package.json`
- **Purpose**: Build and development configuration
- **Key Responsibilities**:
  - ESLint configuration for code quality
  - Vite configuration for build and dev server
  - Package management and dependencies
- **Dependencies**: Various build tools
- **Notable Behaviors**:
  - Modern JavaScript tooling
  - Development and production build configurations
  - Dependency management for React ecosystem
  - Build optimization and bundling

## Asset Files

### `public/favicon.svg`, `src/index.css`, `src/index.html`
- **Purpose**: Static assets and styling
- **Key Responsibilities**:
  - Favicon for browser tab
  - Global CSS styling with Tailwind
  - HTML entry point for application
- **Dependencies**: Various static assets
- **Notable Behaviors**:
  - Modern CSS with Tailwind utility classes
  - Responsive design considerations
  - Accessibility features
  - Browser compatibility considerations