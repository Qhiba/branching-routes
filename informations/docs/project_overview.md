# Project Overview: branching-routes

## What This System Is
branching-routes is a web-based visual editor and simulator for creating complex branching narratives, such as visual novels, text adventures, or game dialogue trees. It allows writers and game designers to build a story using a directed graph interface, track and modify state (like boolean flags and numeric status points), and test their logic interactively using an integrated simulator.

## The Problem It Solves
This system solves the problem of organizing, visualizing, and debugging non-linear stories, ensuring that narrative requirements (conditions) don't result in dead ends or impossible routes. It addresses the complexity of managing branching narratives where choices affect future story elements and state changes must be tracked consistently.

## The Solution Approach
The solution provides a visual graph-based interface where narrative elements (scenes, choices, endings) are represented as nodes connected by edges. Users can:
- Visually construct story graphs with drag-and-drop functionality
- Define conditional logic for narrative branches
- Track boolean flags and numeric status points across the story
- Simulate story progression to test logic and identify dead ends
- Analyze reachability to ensure all narrative paths are accessible

## Tech Stack Table

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | JavaScript (JSX/ES6+) | - | Core development language |
| Framework | React | 19.2.4 | UI components and state management |
| Build Tool | Vite | 8.0.1 | Development server and bundling |
| Graph Library | @xyflow/react | 12.10.1 | Interactive node-based graph visualization |
| Layout Engine | @dagrejs/dagre | 2.0.4 | Automatic node positioning |
| State Management | React Context | - | Global state management |
| Persistence | localforage | 1.10.0 | Client-side IndexedDB storage |
| Icons | lucide-react | 0.577.0 | SVG icon library |
| UI Components | React Flow | - | Graph interaction and rendering |
| Styling | Tailwind CSS | 4.2.2 | Utility-first CSS framework |

## Core Architecture Description

The system follows a client-side architecture with a centralized state management pattern. The core architecture consists of:

1. **Global State Store** (`EditorContext.jsx`): A React Context provider that manages all narrative data (scenes, choices, flags, status points, etc.) and provides CRUD operations.

2. **Graph Visualization Layer** (`RouteViewer.jsx`): Uses React Flow to render the narrative graph, with automatic layout via Dagre and manual drag-and-drop positioning.

3. **Simulation Engine** (`useSimulator.js`): A custom hook that evaluates conditions and traces story paths based on the current state.

4. **Utility Layer**: Pure functions for condition evaluation, graph building, reachability analysis, and route tracing.

5. **Form/Modal System**: A comprehensive set of forms for creating and editing all narrative entities.

## Core Entities and Their Relationships

### Primary Entities
- **Scenes**: Narrative moments with text, variants, state mutations, and routing targets
- **Choices**: Decision points with options, conditions, and state changes
- **Endings**: Terminal story conclusions with requirements

### State Management Entities
- **Flags**: Boolean variables (true/false) that track story state
- **Status Points**: Numeric variables (e.g., health, relationship scores)

### Organizational Entities
- **Chapters**: High-level story groupings
- **Paths**: Mid-level organizational categories
- **Quests**: Quest structures (schema exists but usage unclear)

### Relationships
- Scenes connect to other scenes/choices/endings via `next` arrays
- Choices contain options that target other nodes
- Flags and status points are set/modified by scenes and choices
- Conditions on choices/scenes determine narrative flow

## Data Model with Field-Level Detail

### Scenes
```javascript
{
  id: string,           // e.g., "S001" - Scene ID
  name: string,         // Display name
  description: string,  // Story text
  variants: [           // Conditional text variants
    {
      requires: { operator: 'and', conditions: [...] },
      text: string
    }
  ],
  flags_set: [          // State mutations
    { flag: string, state: boolean }
  ],
  status_set: [         // Numeric state changes
    { status: string, value: number }
  ],
  next: [               // Routing targets
    {
      requires: { operator: 'and', conditions: [...] },
      target: string
    }
  ],
  type: string|null,    // Node type (optional)
  flags_set: [],        // Array of flag mutations
  status_set: [],       // Array of status mutations
  path: string|null,    // Path reference
  chapter: string|null  // Chapter reference
}
```

### Choices
```javascript
{
  id: string,           // e.g., "CH001" - Choice ID
  text: string,         // Choice prompt
  options: [            // Choice options
    {
      label: string,    // Option text
      requires: { operator: 'and', conditions: [...] },
      flags_set: [],
      status_set: [],
      next: [           // Array of conditional targets
        { requires: { operator: 'and', conditions: [...] }, target: string }
      ]
    }
  ]
}
```

### Flags
```javascript
{
  id: string,           // e.g., "F001" - Flag ID
  name: string,         // Display name
  state: boolean,       // Default state
  path: string|null,    // Path reference
  chapter: string|null  // Chapter reference
}
```

### Status Points
```javascript
{
  id: string,           // e.g., "SP001" - Status ID
  name: string,         // Display name
  value: number,        // Starting value
  minValue: number,     // Minimum value
  path: string|null,    // Path reference
  chapter: string|null  // Chapter reference
}
```

### Endings
```javascript
{
  id: string,           // e.g., "E001" - Ending ID
  name: string,         // Ending name
  requires: { operator: 'and', conditions: [...] }  // Requirements
}
```

## Implicit Rules and Constraints Discovered

### Entity ID Conventions
- Scene IDs: `S` + 3-digit number (e.g., `S001`)
- Choice IDs: `CH` + 3-digit number (e.g., `CH001`)
- Flag IDs: `F` + 3-digit number (e.g., `F001`)
- Status Point IDs: `SP` + 3-digit number (e.g., `SP001`)
- Path IDs: `P` + 3-digit number (e.g., `P001`)
- Chapter IDs: `C` + 3-digit number (e.g., `C001`)
- Quest IDs: `Q` + 3-digit number (e.g., `Q001`)
- Ending IDs: `E` + 3-digit number (e.g., `E001`)

### Data Structure Rules
- All `requires` fields must be condition groups: `{ operator: 'and'|'or', conditions: [...] }`
- All `next` fields must be arrays of `{ requires, target }` objects (post-migration)
- `flags_set` and `status_set` are always arrays, never null
- Entity names are sanitized to lowercase with underscores

### State Management Rules
- Auto-save occurs every 500ms after state changes
- All CRUD operations trigger a single debounced save
- IndexedDB is the primary persistence layer
- JSON export/import handles ID collisions and data migration

## Output Files or External Interfaces

### Export Format
```json
{
  "scenes": { ... },
  "choices": { ... },
  "flags": { ... },
  "status": { ... },
  "endings": { ... },
  "paths": { ... },
  "chapters": { ... },
  "quests": { ... },
  "entryNode": string
}
```

### Import Format
- Accepts the same JSON structure as export
- Performs data migration and ID collision resolution
- Validates entity structure but not cross-references

### External Dependencies
- Browser IndexedDB API (via localforage)
- HTML5 File API for import/export
- @xyflow/react and @dagrejs/dagre for graph visualization

### Browser Compatibility
- Requires ES module support
- Requires IndexedDB support
- Requires HTML5 File API support