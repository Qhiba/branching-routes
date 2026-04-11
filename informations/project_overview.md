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
| **Language** | JavaScript (`.jsx` / `.js`) | No TypeScript |
| **Backend** | None | Zero network requests; all persistence via browser File System Access API |

---

## Folder Structure

```
branching-routes/
├── index.html              # Entry point HTML shell
├── vite.config.js          # Build config with src/ path aliases
├── package.json            # Dependencies and scripts
│
├── public/                 # Static assets served as-is
│   └── favicon.svg
│
├── src/
│   ├── main.jsx            # React bootstrap — renders <App />
│   ├── App.jsx             # Root layout: TopBar + Canvas + Sidebar
│   ├── App.css             # Grid layout styles for the three regions
│   │
│   ├── styles/
│   │   ├── tokens.css      # Design system CSS custom properties (colours, spacing, typography)
│   │   └── global.css      # CSS reset, base styles, component styles, simulation mode overrides
│   │
│   ├── store/
│   │   ├── graphStore.js   # Zustand store: canonical graph (nodes, edges, flags, meta)
│   │   ├── simulationStore.js  # Zustand store: simulation state (active node, flags, reachable sets)
│   │   └── index.js        # Barrel re-export for all stores
│   │
│   ├── utils/
│   │   ├── uuid.js         # UUID v4 generation wrapper
│   │   ├── conditionEvaluator.js  # Pure functions for AND/OR condition evaluation
│   │   ├── fileSystem.js   # Browser File System Access API with fallback
│   │   └── index.js        # Barrel re-export for all utilities
│   │
│   └── components/
│       ├── TopBar.jsx       # App title, file actions, simulation controls, tidy layout
│       ├── GraphCanvas.jsx  # React Flow canvas wrapper with interaction handlers
│       ├── Sidebar.jsx      # Tab panel: Inspector / Flags
│       ├── NodeInspector.jsx    # Form for editing node label, content, side effects
│       ├── EdgeInspector.jsx    # Form for editing edge label, conditions, side effects
│       ├── FlagManager.jsx      # Flag CRUD with name validation and reference checking
│       ├── nodes/
│       │   └── StoryNode.jsx    # Custom React Flow node with simulation state classes
│       ├── edges/
│       │   └── ConditionalEdge.jsx  # Custom React Flow edge with condition badges
│       └── index.js         # Barrel re-export for all components
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
