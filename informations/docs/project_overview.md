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
| **Backend** | None | Zero network requests; primary persistence via IndexedDB auto-save; explicit export/import via browser File System Access API (JSON for narrative-only projects, ZIP for projects with campaigns) |

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
│   ├── main.jsx            # React bootstrap — async boot: restores graph and campaigns from IndexedDB, wires debounced auto-save subscriptions for both stores, then renders <App />
│   ├── App.jsx             # Root layout: TopBar + Canvas + Sidebar
│   ├── App.css             # Grid layout styles for the three regions
│   │
│   ├── styles/
│   │   ├── tokens.css      # Design system CSS custom properties (colours, spacing, typography)
│   │   └── global.css      # CSS reset, base styles, component styles, simulation mode overrides
│   │
│   ├── store/
│   │   ├── narrativeStore.js # Zustand store: canonical graph (common, choice, ending, edges, flag, status, path, chapter, meta)
│   │   ├── uiStore.js      # Zustand store: UI state (selection, snap-to-grid, choice display mode)
│   │   ├── simulationStore.js  # Zustand store: campaign-mode lifecycle, six-state node enum, seen tracking, selected option, passive analysis, sandbox overrides, campaign snapshotting
│   │   ├── campaignStore.js    # Zustand store: campaign dictionary (CRUD, IndexedDB persistence, ZIP import restore)
│   │   └── index.js        # Barrel re-export for all stores
│   │
│   ├── utils/
│   │   ├── uuid.js         # UUID v4 generation wrapper
│   │   ├── conditionEvaluator.js  # Pure functions for AND/OR condition evaluation
│   │   ├── fileSystem.js   # IndexedDB auto-save; campaign IndexedDB persistence; browser File System Access API export/import with fallback; ZIP bundling via JSZip; import validation, sanitization, and migration chain
│   │   └── index.js        # Barrel re-export for all utilities
│   │
│   └── components/
│       ├── TopBar.jsx       # App title, file actions, Enter/Exit Campaign Mode + Reset controls, campaign status indicator, tidy layout
│       ├── GraphCanvas.jsx  # React Flow canvas wrapper with interaction handlers, passive analysis trigger, and option-aware edge stamping
│       ├── Sidebar.jsx      # Tab panel: Inspector / Flags / Status / Paths / Sandbox (campaign only)
│       ├── SandboxPanel.jsx # Campaign-only flag/status override panel and campaign save/load controls (never writes to narrativeStore)
│       ├── CampaignSelector.jsx  # Campaign management UI: list, create, switch, delete campaigns; mounts in TopBar when not in campaign mode
│       ├── NodeInspector.jsx    # Form for editing node label, content, side effects, path/chapter, variants (common), options (choice)
│       ├── EdgeInspector.jsx    # Form for editing edge label, conditions, and option provenance display
│       ├── VariantEditor.jsx    # Variant list editor for common nodes (label, text, requires)
│       ├── OptionEditor.jsx     # Option list editor for choice nodes (label, requires, flags_set, status_set)
│       ├── FlagManager.jsx      # Flag CRUD with name validation and reference checking
│       ├── StatusManager.jsx    # Status CRUD with name validation and reference checking
│       ├── PathChapterManager.jsx # Path and Chapter CRUD management UI
│       ├── nodes/
│       │   ├── CommonNode.jsx   # Custom React Flow node for standard narrative stops
│       │   ├── ChoiceNode.jsx   # Custom React Flow node for player choices with per-option source handles
│       │   └── EndingNode.jsx   # Custom React Flow node for terminal states (no source handle)
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
