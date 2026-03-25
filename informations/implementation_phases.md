# Branching Narrative Editor: Implementation Phases

---

## Phase 1 — Core Editor ✅ Complete

The full logic engine. Everything in later phases is built on top of what is defined here.

**Top Navigation**
- Sticky left sidebar with buttons to navigate all 9 tabbed views
- `ErrorBoundary` wraps the main stage — runtime errors in any manager view are isolated without crashing the entire editor

**Persistence**
- 500ms debounced auto-save to `IndexedDB` via `localforage` — state persists between sessions without manual saving
- Unified `loadData` parser deserializes incoming JSON into active state correctly on import or session restore

**Path & Chapter Manager** (`PathManager.jsx`, `ChapterManager.jsx`)
- Create, edit, and delete paths and chapters for categorization
- Both are referenced by ID on choices and scenes
- Global workspace filtering — scoping by chapter or path condenses high-density projects across all editors
- Integrated with `QuickNav` for rapid jumping between dense lists

**Flag Manager** (`FlagManager.jsx`)
- Create, name, and browse all flags
- `snake_case` enforced globally across all entities via `sanitizeName`
- IDs auto-assigned and never change after creation
- State starts as `false` on creation — only the simulator via choices can change it
- `flagReferenceMap` — real-time dependency map tracking exactly where every flag is used
- "In Use" badges — show the total count of referencing nodes at a glance
- Smart deletion — triggers a confirmation modal showing all referencing nodes before allowing deletion. Deleting a flag cascades automatically

**Status Point Manager** (`StatusManager.jsx`)
- Create and name status points with a starting value (defaults to 0)
- No path or chapter — status points are global
- Deletion cascades — automatically removes all references

**Quest Manager** (`QuestManager.jsx`)
- Create and name quests — ID and name only
- Thematic grouping layer mapped against scene components
- Deletion cascades

**Choice Editor** (`ChoiceEditor.jsx`)
- Build choices with a visual form
- Two-tier collapsible accordion layout
- `requires` conditions on the choice root and on each option via `ConditionEditor`
- `flags_set` per option via `SearchableDropdown`
- `status_set` per option — status point and signed amount
- `next` per option via `SearchableDropdown` (scene, choice, or ending ID)
- `next: null` supported via `__LOOP__` sentinel
- "Set as Entry Node" button on each choice
- Deletion blocked if the choice is referenced as a `next` target anywhere

**Scene Editor** (`SceneEditor.jsx`)
- Write scene name and description
- `requires` conditions using flag and status condition objects
- `next` as an ordered conditional array — each entry has its own `ConditionEditor` and `target`
- Last `next` entry should always be a fallback with empty `requires`
- "Set as Entry Node" button on each scene
- Deletion blocked if the scene is referenced as a `next` target anywhere

**Ending Manager** (`EndingManager.jsx`)
- Create and name endings with full `requires` condition matrix
- Terminal nodes — no `next` field
- Appear in `next` target dropdowns across Scene and Choice editors
- Deletion blocked if the ending is referenced as a `next` target anywhere

**Shared Utilities**
- `ConditionEditor.jsx` — reusable condition builder across Choice, Scene, and Ending editors
- `SearchableDropdown.jsx` — unified dropdown supporting scenes, choices, and endings. Virtualized via `react-virtuoso`. Full keyboard navigation. Loop-to-self via `__LOOP__` sentinel
- `QuickNav.jsx` — floating sticky minimap. Clicking any ID scrolls to that entity via `scrollIntoView()`
- `ErrorBoundary.jsx` — isolates rendering failures in any manager view

**Entry Node**
- `entryNode` field in `metadata` — holds a single scene or choice ID
- Configured via a top-level header dropdown beside Import/Export
- Export is blocked if `entryNode` is not set

**Import / Export** (`App.jsx`)
- Accept `branching-routes.json`
- Advanced validation — recursive type-checking, structural integrity verification, ID collision detection
- Export validates before writing — no broken references, no empty IDs, no missing fallbacks on scene `next`, `entryNode` must be set

---

## Phase 2 — Simulation Sandbox ✅ Complete

Simulates a playthrough through choices. Flags and status are only changed by making choices — never toggled or set directly.

**`useSimulator` Hook** (`hooks/useSimulator.js`)
- Shared simulation engine extracted into a reusable hook
- Powers both the standalone `Simulator` tab and the integrated `RouteViewer` panel simultaneously
- Manages the active `historyStack` chronologically
- Flags and status derived in real time with snapshot caching

**Choice Simulator** (`Simulator.jsx`)
- Pre-flight initialization — maps onto `entryNode` for click-to-start, or supports custom node selection
- Step through choices sequentially as a player would
- Infinite-loop protection — options already selected in a loop are permanently greyed out
- Terminal outcome detection — recognizes ending nodes and triggers Award UI

**Live Dynamic Tracker**
- Shows live flags (true/false) and derived status totals in real time
- Updates instantly as choices are made

**Undo / Replay**
- "Start from the beginning" button — pre-fills with `entryNode` and begins immediately
- Starting node dropdown — manual pick for isolated testing
- Undo — steps backward through the history stack, recalculates all flags and status
- Reset/Revive — restarts from the user-selected starting node

---

## Phase 3 — Structure & Usability Layer ✅ Complete

Organizational metadata and editor quality-of-life. No logic changes.

- All `next` and condition reference dropdowns support search, type filtering, path filtering, and chapter filtering
- Global `entryNode` configured at the project level
- Quest, Path, Chapter, Ending editors all live

---

## Phase 4 — Route Viewer & Integrated Simulation ✅ Complete

**Layout**
- Node graph canvas occupies the main center stage
- `SimulatorPanel` sidebar on the right — fixed width, powered by the shared `useSimulator` hook
- Built-in React Flow minimap

**Node Graph Viewer** (`RouteViewer.jsx`)
- Nodes generated automatically from `branching-routes.json` — choices, scenes, and endings each become a node
- Edges generated automatically from `next` references
- Auto layout by `@dagrejs/dagre` — Top-Bottom or Left-Right orientation options
- Node types are visually distinct
- Filter graph by `path` and `chapter`
- Clicking a node opens a read-only summary in an inspector panel
- Static reachability analysis — provably unreachable nodes rendered as disabled

**Live Graph Tracking**
- Synchronizes with `useSimulator` — current node highlighted, camera follows, edges colored
- Follow mode toggle — camera tracking can be turned off for free exploration
- Visited nodes show distinct completed color
- Ending nodes highlighted as terminal when reached

**Node States**

| State | Description |
|-------|-------------|
| Current | Bright highlight — the active node in the simulation |
| Visited | Muted color — part of the taken path |
| Reachable | Neutral default — not yet visited but conditions could still be met |
| Unreachable | Greyed out — conditions provably cannot be met given current flags |
| Terminal | Distinct ending highlight — simulation stops here |

**Route Backtracking**
- Select a target scene or ending as the destination
- System traces backwards through the flag dependency graph
- Outputs the required choices and their order
- Highlights the optimal path directly on the node graph canvas

---

## Phase 5 — UI Overhaul ✅ Complete

**Problem:** The tab-based accordion editor was organized around entity type, but the actual workflow is organized around narrative moments. Writers had to fragment what is one connected act across multiple tabs.

**Solution:** Canvas-first, sidebar-driven workspace.

### New Layout Shell

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (40px)  — logo · project name · import · export     │
├─────────────────────────────────────────────────────────────┤
│  NAV BAR (36px) — Flags · Status · Choices · Scenes ·       │
│                   Paths · Chapters · Quests · Endings        │
├──────────────────┬──────────────────────┬───────────────────┤
│                  │                      │                   │
│  LEFT SIDEBAR    │   CANVAS (React Flow)│  RIGHT SIDEBAR    │
│  (320px fixed)   │   permanent          │  (320px fixed)    │
│                  │                      │  Simulator        │
│  [ SAVE ]        │                      │  always visible   │
│  (footer)        │                      │                   │
└──────────────────┴──────────────────────┴───────────────────┘
```

### Left Sidebar — Four Modes

**Mode 1 — Default (nothing selected)**
Entity count dashboard. Shows count of each entity type. Entry node displayed prominently with warning if unset.

**Mode 2 — Nav bar item clicked**
List view for that entity type. Search/filter at top. "New [Entity]" button. Clicking an item loads Mode 3. For canvas entities (Choices, Scenes, Endings), clicking also calls `setCenter` to focus that node on the canvas.

**Mode 3 — Edit / Creation form**
Full form for creating or editing a specific entity. Save commits to data. New nodes only appear on canvas after Save. Cancel discards draft and returns to Mode 2.

**Mode 4 — Node clicked on canvas**
Same edit form as Mode 3, triggered from the graph. Save commits. Cancel returns to Mode 1.

**Simulation active — sidebar override**
Left sidebar switches to Dynamic Tracker showing live flags and status. Returns to previous mode when simulation ends.

### Interaction Rules
- **Unsaved edits + context switch** — warns before switching. Does not discard silently.
- **Unsaved edits + simulation start** — blocks simulation. Prompts Save or Cancel.
- **New node placement** — dropped at Dagre-calculated default position after Save.

### What Was Retired
- Sticky left sidebar tab navigation → replaced by nav bar + sidebar modes
- Accordion list editors → forms now live in left sidebar
- `QuickNav.jsx` floating panel → absorbed into sidebar Mode 2 list
- Phase 4 Route Viewer as a separate tab → canvas is now the permanent workspace
- Phase 2 Simulator as a separate tab → permanently in right sidebar
- Read-only inspector panel inside `RouteViewer.jsx` → replaced by editable sidebar Mode 4

### What Was Preserved Untouched
- `EditorContext.jsx` — all state, CRUD, `flagReferenceMap`, debounced save, `loadData`
- `useSimulator.js` — simulation engine, `historyStack`, snapshot caching
- `ConditionEditor.jsx` — re-embedded in sidebar forms
- `SearchableDropdown.jsx` — re-embedded in sidebar forms
- `ErrorBoundary.jsx` — re-used in new shell
- `RouteViewer.jsx` canvas logic — only inspector and embedded SimulatorPanel removed
- All JSON export/import logic

---

## Phase 5 Post-Overhaul — Active Improvements

Found in production use after the Phase 5 overhaul. Logic engine frozen. UI layer and one additive data format change only.

### Fix 1 — Auto-Pan After Save ✅ Resolved

**Problem:** Saving a node caused the canvas camera to reposition, pulling focus away from the current working area.

**Root cause:** Post-save dagre layout recalculation triggered `fitView` automatically.

**Fix:** Capture viewport with `getViewport()` before layout runs. Restore with `setViewport()` after save-triggered layout. Initial load and the manual "Layout" button still call `fitView` as normal.

**File:** `src/components/routeviewer/RouteViewer.jsx`

---

### Fix 2 — Dynamic Tracker Size ✅ Resolved

**Problem:** During simulation, the Dynamic Tracker shows all flags and status as full rows. With many variables the sidebar fills up and becomes hard to scan.

**Solution — Compact Tracker Mode**
- Default: show only flags where `state === true` and status where `value !== startingValue`
- Hidden variables shown as a count: "14 inactive flags" / "3 unchanged"
- "Show all" toggle reveals everything
- Two-column grid layout for full mode
- Individual row height reduced from full card to a compact 28px line

**File:** `src/components/layout/DynamicTracker.jsx`

---

### Fix 3 — Node Information Density ✅ Resolved

**Problem:** Canvas nodes show almost no useful information. Requires opening the sidebar form to know if a node has requirements, sets flags, or modifies status.

**Solution — Enriched Node Display**

Each node renders a compact info strip:

- **Choice node:** root `requires` chips + per-option summary showing `flags_set` and `status_set` inline. Locked options show their requirement with a `🔒`.
- **Scene node:** `requires` chips + variant count badge if variants exist (`◈ N variants`)
- **Ending node:** `requires` chips + `◆ Terminal` indicator

Condition chips use the existing `ConditionChip` component. Flag sets shown as `sets F003` in `accent-variable`. Status changes shown as `+3 SP001` / `-2 SP001`.

Node width increases from 240px to 280px to accommodate.

**Files:** Choice node component, Scene node component, Ending node component, `RouteViewer.jsx`

---

### Fix 4 — Edge-Based Next Wiring ✅ Resolved

**Problem:** The `next` field requires the target node to already exist. Building forward means constantly going back to wire connections after creating new nodes.

**Solution — Canvas Edge Connections**

Leverage React Flow's native connection system. Each connectable output point gets its own handle. Drawing an edge on the canvas writes directly to the `next` field.

**Handle mapping:**

| Node type | Output handles |
|-----------|---------------|
| Choice node | One handle per option (keyed by option's unique randomized ID) |
| Scene node | One handle per `next` entry (keyed by `_id`) |
| Ending node | No output handles — terminal |

All nodes have one input handle.

**Data flow via `onConnect`:**
- `sourceHandle` (option ID or next-entry `_id`) → find matching entry → set `next = target`
- On edge delete → set `next = null`

**Coexistence:** The `next` dropdown in the sidebar form still works. Edge on canvas and dropdown are always in sync — two views of the same data.

**Files:** `src/components/routeviewer/RouteViewer.jsx`, Choice node component, Scene node component

---

### Fix 5 — Conditional Text Variants ✅ Resolved

**Problem:** Some scenes differ only slightly in dialogue based on a flag or status. Creating two near-identical scene nodes just for a minor text difference is overkill and pollutes the canvas.

**Solution — Scene `variants` Field**

Add optional `variants: []` to scene objects. Each variant has a `requires` condition array and a `text` field. The renderer evaluates variants top-to-bottom — the first match replaces or extends the base description. Empty or absent `variants` = base description plays as-is. Existing scene data is fully unaffected.

```json
{
  "id": "S001",
  "description": "The stranger looks up at you with weary eyes.",
  "variants": [
    {
      "requires": [{ "flag": "F001", "state": true }],
      "text": "He recognizes the emblem on your coat and bows his head in gratitude."
    }
  ]
}
```

**Data format impact:** Additive only. Does not break any existing scene data.

**UI changes:**
- `SceneForm.jsx` — adds "Text Variants" section below the base description textarea
- Each variant row: `ConditionEditor` (reused) + variant text textarea + remove button
- Variants are ordered — first match wins
- Canvas node shows `◈ N variants` badge when variants exist

**Files:** `SceneForm.jsx`, Scene node component, `ConditionEditor.jsx` (no changes needed — reused directly)

---

## Open Question — ✅ Resolved

With no accordion lists and enriched node display (nodes now taller), visual density on large projects is a growing concern.

Possible approaches:
- Path/chapter filter toggles that hide non-matching nodes entirely from the canvas
- "Focus mode" showing only nodes connected to the selected node
- Node clustering by chapter
- Zoom-to-fit shortcut

**Deferred until Fixes 2–5 are complete.**
