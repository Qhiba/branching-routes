# Branching Routes V2 — Rebuild Specification

> **Status:** Draft  
> **Created:** 2026-04-04  
> **Source:** Synthesized from V1 project overview, architecture rules, risk register, and design discussion.

---

## 1. Project Vision

### What This System Is
Branching Routes V2 is a **graph-based narrative flow engine** for designing, visualizing, and debugging branching narratives (visual novels, text adventures, game dialogue trees). It provides a live, always-running simulation on an interactive graph canvas where designers can build story structures and immediately see how player state affects narrative flow.

### Philosophy Shift from V1
| Aspect | V1 | V2 |
|--------|----|----|
| Core identity | Editor with optional simulator | **Live simulation engine** with editing |
| UI model | Fixed sidebars + graph viewport | **Graph viewport is the entire app** |
| Simulation | Start/stop/step-through | **Always running**, reacts to state changes |
| Node vocabulary | "Scene" | **"Common Node"** |
| Sub-element IDs | Random, not traceable to parent | **Hierarchical on export**, random at runtime |
| State testing | Linear step-through | **Sandbox** — toggle any flag/status/node state |
| Route analysis | Basic trace | **Goal-directed pathfinding** with constraint analysis |

### The Problem It Solves
This system solves the problem of organizing, visualizing, and debugging non-linear stories — ensuring that narrative requirements (conditions) don't result in dead ends or impossible routes. V2 specifically addresses the inability to quickly test "what if" scenarios and find optimal paths through complex conditional narratives.

---

## 2. Data Model

### 2.1 Field Ordering Principle

All entities follow a consistent field ordering based on **authoring sequence** — what the designer thinks about first:

1. **Identity** — `id`, `name` / `text` / `label`
2. **Classification** — `type`, `chapter`, `path`
3. **Content** — `description`, `variants`
4. **Prerequisites** — `requires`
5. **Side Effects** — `flags_set`, `status_set`
6. **Routing** — `next`
7. **Internal Metadata** — `_position`, prefixed with `_`

### 2.2 ID System

#### Top-Level Entity IDs
Sequential, prefixed, zero-padded:

| Entity | Prefix | Example |
|--------|--------|---------|
| Common Node | `N` | `N001`, `N002` |
| Choice | `CH` | `CH001`, `CH002` |
| Ending | `E` | `E001`, `E002` |
| Flag | `F` | `F001`, `F002` |
| Status Point | `SP` | `SP001`, `SP002` |
| Path | `P` | `P001`, `P002` |
| Chapter | `C` | `C001`, `C002` |
| Quest | `Q` | `Q001`, `Q002` (reserved) |

#### Sub-Element IDs — Dual Format

| Context | Format | Example | Purpose |
|---------|--------|---------|---------|
| **Runtime** | Random | `"cond_a7x9k3"` | Stable across reorders, no regeneration needed |
| **Export** | Hierarchical | `"CH001_COND001"` | Human-readable, self-documenting |
| **Import** | → Random | `"cond_m4b8z2"` | Fresh random ID generated, import ID discarded |

Both formats use the **same `id` field** — no separate field needed. The hierarchical form is a **view transformation** generated at export time.

#### Export Hierarchical ID Examples

```
Common Node sub-elements:
  N001_COND001              — condition on node requires
  N001_VAR001               — variant
  N001_VAR001_COND001       — condition on variant
  N001_NE001                — next entry
  N001_NE001_COND001        — condition on next entry

Choice sub-elements:
  CH001_COND001             — condition on choice requires
  CH001_OPT001              — option
  CH001_OPT001_COND001      — condition on option requires
  CH001_OPT001_NE001        — next entry on option
  CH001_OPT001_NE001_COND001 — condition on option next entry

Ending sub-elements:
  E001_COND001              — condition on ending requires
```

> [!IMPORTANT]
> Maximum nesting depth is **4 levels** (e.g., `CH001_OPT001_NE001_COND001`). Do not allow deeper nesting.

### 2.3 Entity Schemas

#### Metadata
```json
{
  "version": "2.0",
  "created_at": "2026-04-04",
  "updated_at": "2026-04-04",
  "entry_node": "N001",
  "common_node_types": ["interaction", "cg", "cutscene"],
  "ending_types": ["good_end", "bad_end", "true_end", "neutral"]
}
```

#### Common Node (`N###`) — replaces "Scene"
```json
{
  "id": "N001",
  "name": "opening_scene",
  "type": "interaction",
  "chapter": "C001",
  "path": "P001",
  "description": "The story begins...",
  "variants": [
    {
      "id": "<random_runtime | N001_VAR001_export>",
      "requires": { "operator": "and", "conditions": [] },
      "text": "Alternate text when flag is set"
    }
  ],
  "requires": {
    "operator": "and",
    "conditions": [
      {
        "id": "<random_runtime | N001_COND001_export>",
        "flag": "F001",
        "state": true
      }
    ]
  },
  "flags_set": ["F001", "F002"],
  "status_set": [
    { "status": "SP001", "amount": 5 }
  ],
  "next": [
    {
      "id": "<random_runtime | N001_NE001_export>",
      "target": "CH001",
      "requires": {
        "operator": "and",
        "conditions": []
      }
    }
  ],
  "_position": { "x": 100, "y": 200 }
}
```

#### Choice (`CH###`)
```json
{
  "id": "CH001",
  "text": "What do you do?",
  "chapter": "C001",
  "path": "P001",
  "requires": {
    "operator": "and",
    "conditions": []
  },
  "options": [
    {
      "id": "<random_runtime | CH001_OPT001_export>",
      "label": "Fight the dragon",
      "requires": {
        "operator": "and",
        "conditions": []
      },
      "flags_set": ["F003"],
      "status_set": [
        { "status": "SP001", "amount": -2 }
      ],
      "next": [
        {
          "id": "<random_runtime | CH001_OPT001_NE001_export>",
          "target": "N005",
          "requires": {
            "operator": "and",
            "conditions": []
          }
        }
      ]
    }
  ],
  "_position": { "x": 300, "y": 200 }
}
```

#### Ending (`E###`)
```json
{
  "id": "E001",
  "name": "the_hero_falls",
  "type": "bad_end",
  "chapter": "C003",
  "path": "P001",
  "requires": {
    "operator": "and",
    "conditions": []
  },
  "_position": { "x": 500, "y": 200 }
}
```

#### Flag (`F###`)
```json
{
  "id": "F001",
  "name": "met_the_merchant",
  "state": false,
  "path": null,
  "chapter": "C001"
}
```

> [!NOTE]
> `flags_set` on nodes can only set flags to `true`. The `state` field on the flag entity defines the **default** (always `false`). There is no mechanism to set a flag back to `false` via narrative flow.

#### Status Point (`SP###`)
```json
{
  "id": "SP001",
  "name": "relationship_score",
  "value": 0,
  "minValue": null,
  "maxValue": null,
  "path": null,
  "chapter": null
}
```

> [!NOTE]
> `status_set` uses **delta** semantics: `"amount": 5` means "add 5 to current value." The result is clamped to `[minValue, maxValue]`.

#### Path (`P###`)
```json
{
  "id": "P001",
  "name": "main_route"
}
```

#### Chapter (`C###`)
```json
{
  "id": "C001",
  "name": "prologue"
}
```

#### Quest (`Q###`) — Reserved
```json
{}
```
> Quest is reserved in the schema but not implemented in this iteration. Keep the empty slot in the export format for forward compatibility.

### 2.4 Condition Structure

All `requires` fields follow the same recursive structure:

```json
{
  "operator": "and",
  "conditions": [
    { "id": "...", "flag": "F001", "state": true },
    { "id": "...", "status": "SP001", "min": 0 },
    { "id": "...", "status": "SP002", "min": -5, "max": 5 },
    {
      "operator": "or",
      "conditions": [
        { "id": "...", "flag": "F002", "state": true },
        { "id": "...", "status": "SP003", "max": 0 }
      ]
    }
  ]
}
```

**Condition types:**
| Type | Fields | Meaning |
|------|--------|---------|
| Flag condition | `flag`, `state` | Flag must be `true` (state is always `true`) |
| Status condition (min only) | `status`, `min` | Status ≥ min |
| Status condition (max only) | `status`, `max` | Status ≤ max |
| Status condition (range) | `status`, `min`, `max` | min ≤ Status ≤ max |
| Nested group | `operator`, `conditions` | Recursive AND/OR group |

### 2.5 Data Structure Rules

1. All `requires` fields **must** be condition groups: `{ operator, conditions }`. Never null, never a bare array.
2. All `next` fields **must** be arrays of `{ id, requires, target }`. Never null, never a string.
3. `flags_set` is always an array of flag IDs (strings). Never null.
4. `status_set` is always an array of `{ status, amount }`. Never null.
5. `variants` is always an array. Never null.
6. `options` is always an array. Never null.
7. Entity names are sanitized to lowercase with underscores.
8. Fields prefixed with `_` are internal metadata (e.g., `_position`).

---

## 3. UI Architecture

### 3.1 Design Philosophy
The graph viewport is the **entire application**. There are no persistent sidebars. All editing happens through on-demand panels, context menus, and keyboard shortcuts. The design prioritizes **zero distraction** and **maximum canvas space**. The UI theme is focusing on deep charcoal background, neon accents, and sleek typography for a professional, high-end feel. 

### 3.2 UI Components

#### Full-Viewport Graph Canvas
- Takes 100% of the screen
- Interactive node-based graph (React Flow / @xyflow/react)
- Always shows the live simulation state
- Supports pan, zoom, multi-select, drag-and-drop

#### Minimal Top Bar
- **Thin, single-line strip** — not a full navbar
- Contents: Project name (editable) | Settings gear | Reset simulation | Import/Export 
- Can be auto-hidden or toggled with a keyboard shortcut

#### Right-Click Context Menu
Context-sensitive menus:

| Right-click on... | Menu options |
|-------------------|--------------|
| Empty canvas | Create Common Node, Create Choice, Create Ending, Create Flag, Create Status Point, Create Path, Create Chapter, Paste |
| A node | Edit, Delete, Duplicate, Connect to..., Toggle State (active/locked/complete/failed/branch_locked), Toggle Seen (unseen/partial/seen), Copy |
| An edge | Delete, Edit Conditions |
| Multiple selected | Delete All, Group into Chapter, Group into Path |

#### Floating Inspector Panel
- Appears when a node is **clicked/selected**
- Draggable, dismissible, pinnable (like Figma's floating panels)
- Shows all editable fields for the selected entity
- Follows the field ordering principle (identity → classification → content → prerequisites → side effects → routing)
- Can be toggled with `Escape` to dismiss or `I` to open

#### Command Palette (`Ctrl+K`)
- Search nodes by name or ID
- Search flags, status points by name
- Execute actions: "Create Node", "Export Project", "Reset Simulation", "Find path to N010"
- Navigate to any entity

#### Bottom Status Strip
- **Thin, always-visible bar** at the bottom
- Shows: Active node count | Active flags summary | Status point values | Simulation warnings
- Clicking on any item opens relevant detail panel

#### Toast Notifications
- Route trace results ("Shortest path: N001 → CH002 → N005 → E001, 4 nodes")
- Warnings ("Node N003 is unreachable with current flags")
- Import/export confirmations
- Appears top-right, auto-dismisses

### 3.3 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Create new Common Node at cursor position |
| `C` | Create new Choice at cursor position |
| `E` | Create new Ending at cursor position |
| `F` | Create new Flag (opens quick-create dialog) |
| `S` | Create new Status Point (opens quick-create dialog) |
| `Del` / `Backspace` | Delete selected elements |
| `Space` | Cycle node state (active → locked → complete → failed → branch_locked) |
| `V` | Cycle seen state (unseen → partially_seen → seen) |
| `I` | Toggle inspector panel for selected node |
| `Ctrl+K` | Open command palette |
| `Ctrl+E` | Export project |
| `Ctrl+Shift+E` | Import project |
| `Ctrl+Z` | Undo (if implemented) |
| `Ctrl+Shift+Z` | Redo (if implemented) |
| `Ctrl+A` | Select all nodes |
| `Escape` | Deselect / Close panel |
| `R` | Reset simulation state |
| `L` | Auto-layout graph (Dagre) |
| `Ctrl+F` | Open route finder dialog |

---

## 4. Simulation Engine

### 4.1 Core Concept
The simulation engine runs **continuously** in the background. There is no start/stop button. The graph is always a live view of the current narrative state. When any flag, status point, or node state changes, the engine recalculates:
- Which edges are valid (conditions met)
- Which nodes are reachable
- Which nodes should auto-lock (unreachable due to state)

### 4.2 Node States

| State | Visual | Meaning |
|-------|--------|---------|
| `active` | Pulsing highlight, bright edges | Node is currently in play, outgoing edges highlighted |
| `locked` | Dimmed, grayed out | Node is unreachable with current state |
| `complete` | Checkmark, solid border | Node has been visited/completed |
| `failed` | Red tint, X mark | Node was reached but failed (e.g., conditions not met for desired outcome) |
| `branch_locked` | Dashed border, dimmed | Node is locked because an alternative branch was chosen |
| `default` | Normal rendering | No simulation state assigned |

### 4.3 Seen Tracking

| State | Visual | Meaning |
|-------|--------|---------|
| `unseen` | No indicator | Node has not been visited in this playthrough |
| `partially_seen` | Half-filled eye icon | Node visited but not all content experienced (variants, achievements, CGs) |
| `seen` | Filled eye icon | Node fully experienced |

> Seen state is **manually toggled** by the user in V2. Future versions may auto-derive from variant/branch coverage.

### 4.4 Campaign Sheet

A campaign sheet is a **saved simulation state** — a snapshot of all node states, flag overrides, and status overrides. It represents one "test playthrough" or scenario.

#### Campaign Schema
```json
{
  "campaign_name": "test_good_ending_path",
  "created_at": "2026-04-04",
  "updated_at": "2026-04-04",
  "node_states": {
    "N001": { "status": "complete", "seen": "seen" },
    "N002": { "status": "active", "seen": "partially_seen" },
    "CH001": { "status": "active", "seen": "unseen" },
    "E001": { "status": "locked", "seen": "unseen" }
  },
  "flag_overrides": {
    "F001": true,
    "F003": true
  },
  "status_overrides": {
    "SP001": 15,
    "SP002": -3
  }
}
```

#### Campaign Features
- **Multiple campaigns** per project — test different scenarios independently
- **Campaign selector** — UI to switch between campaigns or create new ones
- **Reset button** — clears all node states, flag overrides, and status overrides for active campaign
- **Saved independently** from the data model — editing the narrative structure doesn't affect campaigns
- **State persistence** — campaigns auto-save to IndexedDB alongside the data model

### 4.5 Live Simulation Behavior

When the simulation engine runs:

1. **Edge evaluation** — For each node with outgoing edges, evaluate all `requires` conditions against current flags and status points. Edges whose conditions pass are highlighted; edges that fail are dimmed/dashed.

2. **Auto-lock propagation** — If a node's *only* incoming edges all fail their conditions, the node is auto-suggested as `locked` (visual indicator, not forced — user can override).

3. **Active node highlighting** — Nodes marked `active` pulse and their valid outgoing edges glow, showing the designer "where can the player go from here?"

4. **Reachability warnings** — Nodes that are unreachable from `entry_node` given current state get a warning badge. Toast notification summarizes unreachable count.

---

## 5. Route Tracing

### 5.1 Basic Route Trace
Find all paths between two nodes and annotate with:
- **Path** (which `P###` paths are traversed)
- **Chapter** (which `C###` chapters are traversed)
- **Flags set along the way** (which flags become `true`)
- **Status changes** (net delta for each status point)
- **Node count** (length of path)

### 5.2 Shortest Path Finder
Find the path with the **fewest nodes traversed** between two nodes.
- Uses BFS with condition evaluation at each step
- Respects current flag/status state when evaluating conditions
- Reports if no valid path exists

### 5.3 Goal-Directed Pathfinding
Two modes:

#### Mode A: "How do I reach node X?"
Given the current flag/status state, find a valid path to the target node.
- If possible: show the path and highlight it on the graph
- If impossible: show a notification explaining **why** (which conditions fail, which flags/statuses are missing)

#### Mode B: "What do I need to reach node X?"
Reverse analysis — determine what flags must be `true` and what status point thresholds must be met to make the target node reachable.
- Output: list of required flag states and status ranges
- Bonus: show which nodes along a potential path *set* those required flags/statuses

### 5.4 Filtered Route Trace
Filter routes by:
- **Path** — "Show routes that stay on Path P001"
- **Chapter** — "Show routes that pass through Chapter C002"
- **Flag** — "Show routes where F003 becomes true"
- **Status** — "Show routes where SP001 ends above 10"

### 5.5 Route Trace Output
Results displayed as:
- **Graph overlay** — highlighted path on the canvas with numbered steps
- **Toast summary** — "Shortest path: N001 → CH002 → N005 → E001 (4 nodes)"
- **Detail panel** — expandable breakdown of each step (flags set, status changes, conditions evaluated)

---

## 6. Import / Export

### 6.1 Export Format

Export produces a **`.zip` file** containing:

```
project_name.zip
├── datamodel.json          ← always present
└── campaigns/              ← present if campaigns exist
    ├── test_run_1.json
    └── speedrun_check.json
```

During export:
1. All sub-element IDs are **transformed** from random runtime format to hierarchical format (`cond_a7x9k3` → `CH001_COND001`)
2. Top-level entity IDs remain as-is (`N001`, `CH001`, etc.)
3. Internal metadata fields (`_position`) are included
4. Active campaign state is saved to its campaign file

### 6.2 Import Rules

| Input | Behavior |
|-------|----------|
| `.json` file | Treat as `datamodel.json` only |
| `.zip` without `datamodel.json` | **Reject** with error: "No data model found in archive" |
| `.zip` with `datamodel.json` only | Import data model, start with fresh campaign |
| `.zip` with `datamodel.json` + campaigns | Import both, prompt user to select which campaign to load (or start fresh) |

During import:
1. All sub-element IDs are **replaced** with fresh random IDs (hierarchical import IDs discarded)
2. Top-level entity IDs are preserved (with collision resolution if merging)
3. Data migration runs to add missing fields with defaults
4. Entity names are sanitized (lowercase, underscores)
5. Data structure rules are enforced (all `requires` → condition groups, all `next` → arrays, etc.)

### 6.3 Export Schema (datamodel.json)

```json
{
  "metadata": { ... },
  "path": { ... },
  "chapter": { ... },
  "flag": { ... },
  "status": { ... },
  "common": { ... },
  "choice": { ... },
  "ending": { ... },
  "quest": {}
}
```

> [!IMPORTANT]
> The top-level key for common nodes in the export is `"common"`, not `"scene"`. This is a breaking change from V1.

---

## 7. Tech Stack

| Category | Technology | Purpose | Notes |
|----------|------------|---------|-------|
| Language | JavaScript (JSX/ES6+) | Core development | No TypeScript for V2 initial |
| Framework | React 19+ | UI components | Functional components, hooks |
| Build Tool | Vite | Dev server, bundling | Latest stable |
| Graph Library | @xyflow/react | Interactive graph canvas | Core visualization |
| Layout Engine | @dagrejs/dagre | Automatic node positioning | Auto-layout feature |
| State Management | **Zustand** | Global state | Replaces React Context — lighter, no re-render cascades, middleware support |
| Persistence | localforage | IndexedDB storage | Client-side, offline-capable |
| Icons | lucide-react | SVG icon library | Consistent iconography |
| Styling | **Vanilla CSS** | Styling | Replaces Tailwind — full control, no utility class noise |
| Archive | JSZip | ZIP file creation/extraction | Import/export format |
| DnD | @dnd-kit | Drag-and-drop reordering | Array reorder UX (no ID regeneration needed) |

### Why Zustand over React Context
The monolithic `EditorContext.jsx` was V1's biggest architectural pain point:
- Every state change re-rendered the entire component tree
- Debugging was difficult — all state in one Provider
- No middleware support (auto-save was a fragile `useEffect`)
- With Zustand: granular subscriptions, built-in middleware (persist, devtools), simpler API

### Why Vanilla CSS over Tailwind
- Full control over design system tokens
- No dependency on Tailwind version or config
- Cleaner component code (no utility class strings)
- Easier to implement the premium dark-mode graph engine aesthetic

---

## 8. Architecture Rules (V2)

### Carried From V1 (Still Valid)
1. All `requires` fields must be condition groups `{ operator, conditions }`
2. All `next` fields must be arrays of `{ id, requires, target }`
3. Entity names are sanitized to lowercase with underscores
4. Missing fields are added with safe defaults during migration
5. No external API calls — all data stays client-side
6. Auto-save with debounce (500ms) to IndexedDB
7. Error boundary for graceful crash recovery

### New for V2
8. **Sub-element IDs are random at runtime** — only hierarchical on export. Never regenerate sub-IDs for reorder operations.
9. **Simulation engine is always active** — no start/stop lifecycle. Recalculates on every state change.
10. **Campaign state is separate from data model** — editing narrative structure does not modify campaign state.
11. **State management via Zustand stores** — split into logical slices (narrative store, simulation store, UI store), not one monolithic context.
12. **No persistent sidebars** — all editing through floating panels, context menus, and keyboard shortcuts.
13. **Fields prefixed with `_` are internal metadata** — included in export but not part of the narrative contract.
14. **Top-level entity IDs are sequential and can be renumbered** — but only top-level IDs require reference replacement. Sub-element IDs are unaffected.
15. **IndexedDB errors must surface to the user** — show a persistent warning banner when auto-save fails. Never silently swallow.

---

## 9. Anti-Patterns (Lessons from V1)

> [!WARNING]
> These are specific things that went wrong in V1. Do not repeat them.

### AP1. Monolithic State Provider
**V1:** Single `EditorContext.jsx` with 1100+ lines managing all state, CRUD, migrations, persistence.  
**V2:** Split into focused Zustand stores: `useNarrativeStore`, `useSimulationStore`, `useUIStore`.

### AP2. Silent Error Swallowing
**V1:** `.catch(() => {})` on all IndexedDB operations. User loses work without knowing.  
**V2:** Surface save failures with a persistent warning banner. Log errors for debugging.

### AP3. `JSON.stringify` for Equality Checks
**V1:** Used `JSON.stringify(a) !== JSON.stringify(b)` for detecting condition changes. Order-sensitive, fragile.  
**V2:** Use deep equality utility or structural comparison.

### AP4. `replaceIdReferences` Deep Recursive Traversal
**V1:** Reordering any entity required walking the entire data tree to update references.  
**V2:** Sub-element IDs are random and independent of parent IDs — reorder only affects top-level entity IDs, dramatically reducing blast radius.

### AP5. Edge Deletion Setting `next: null`
**V1:** Deleting a choice edge set `opt.next = null`, violating the array contract.  
**V2:** All mutations must maintain data structure invariants. `next` is always `[]` or an array.

### AP6. Import/Export Key Asymmetry
**V1:** Export used `path`, `chapter`, `status` but internal state used `paths`, `chapters`, `statusPoints`. Easy to get wrong.  
**V2:** Use the **same keys** in export and internal state. No mapping layer.

### AP7. Module-Level Mutable Counters
**V1:** `let conditionIdCounter = 0` — module-level state that resets on HMR.  
**V2:** Use pure ID generation functions (timestamp + random suffix) with no module-level state.

### AP8. Escape Key Bypassing Unsaved Changes
**V1:** Pressing Escape closed the modal without checking for dirty state.  
**V2:** All dismissal paths (Escape, click-outside, close button) must route through the same dirty-check logic.

---

## 10. Concerns

> [!CAUTION]
> Known risks and complexity areas that need attention during implementation.

### C1. Simulation Performance at Scale
**Risk:** If the graph has 200+ nodes, recalculating reachability and condition evaluation on every flag/status toggle could cause UI lag.  
**Mitigation:** 
- Use incremental updates — only recalculate affected subgraph, not the entire graph
- Debounce simulation recalculation (100-200ms)
- Consider Web Worker for heavy pathfinding computations
- Profile early with 200+ node test data

### C2. Goal-Directed Pathfinding Complexity
**Risk:** Finding "what flags/statuses do I need to reach node X?" is a constraint satisfaction problem. With complex nested AND/OR conditions and mutual dependencies, worst-case is exponential.  
**Mitigation:**
- Practically, narrative graphs stay small enough (< 500 nodes) that brute-force BFS with condition evaluation works
- Set a computation timeout (e.g., 5 seconds) and report "analysis too complex" if exceeded
- Start with Mode A ("how do I reach X given current state") which is simpler BFS, implement Mode B ("what do I need") as a stretch goal

### C3. Campaign State Consistency
**Risk:** If the user edits the data model (renames a node ID, deletes a flag), existing campaign sheets may reference stale IDs.  
**Mitigation:**
- When a top-level entity is deleted or renamed, scan active campaign for stale references and clean them
- Show a warning if campaign references unknown entities
- Campaign is advisory (visual states), not structural — stale references degrade gracefully (unknown nodes just don't render state)

### C4. ZIP Import/Export Browser Support
**Risk:** ZIP creation/extraction in the browser requires a library (JSZip) and has file size limitations.  
**Mitigation:**
- JSZip is well-established and handles this reliably
- For very large projects, the ZIP will still be small (JSON is text, compresses well)
- Maintain backward compatibility: accept plain `.json` import for data-model-only

### C5. Top-Level ID Renumbering Still Requires Reference Replacement
**Risk:** Although sub-element IDs are now random, renumbering `N001` → `N003` still requires updating every `target`, `flag`, `status` reference to that entity across the data model.  
**Mitigation:**
- Scope is much smaller than V1 (only top-level IDs, not nested sub-IDs)
- Consider whether renumbering is actually needed — if IDs are permanent, this problem disappears entirely
- If kept, implement as a single-pass transformation with clear before/after mapping

---

## 11. Implementation Phases (Suggested)

### Phase 1: Core Foundation
- [ ] Project setup (Vite + React + Zustand + Vanilla CSS)
- [ ] Zustand stores: narrative store, UI store
- [ ] Data model: CRUD for all entity types
- [ ] IndexedDB persistence with error surfacing
- [ ] Import/export (JSON only, no ZIP yet)

### Phase 2: Graph Viewport
- [ ] React Flow integration — full-viewport canvas
- [ ] Custom node renderers (Common Node, Choice, Ending)
- [ ] Edge rendering with connection logic
- [ ] Right-click context menu
- [ ] Floating inspector panel
- [ ] Keyboard shortcuts
- [ ] Dagre auto-layout

### Phase 3: Simulation Engine
- [ ] Node state management (active/locked/complete/failed/branch_locked)
- [ ] Seen tracking (unseen/partially_seen/seen)
- [ ] Live condition evaluation on state change
- [ ] Edge highlighting based on condition results
- [ ] Reachability analysis with visual warnings
- [ ] Campaign sheet: create, save, load, reset, switch

### Phase 4: Route Tracing
- [ ] Basic route trace (all paths between two nodes)
- [ ] Shortest path (fewest nodes)
- [ ] Path/Chapter/Flag/Status annotations on routes
- [ ] Goal-directed pathfinding Mode A ("how to reach X?")
- [ ] Filtered route trace (by path, chapter, flag, status)
- [ ] Route trace visual overlay on graph

### Phase 5: Polish & Advanced
- [ ] ZIP export/import with campaign files
- [ ] Goal-directed pathfinding Mode B ("what do I need for X?")
- [ ] Command palette
- [ ] Minimal top bar + bottom status strip
- [ ] Toast notification system
- [ ] Performance optimization for large graphs
- [ ] Data migration from V1 format (if needed)

---

## 12. Open Questions

1. **Undo/Redo** — 
Q: V1 did not have it. Should V2 implement undo/redo? Zustand has middleware that makes this feasible.
A: V2 doesn't not need it, there are no reason for it.

2. **Multi-select operations** — 
Q: Can the user multi-select nodes and batch-change their chapter/path/state?
A: Multi-select nodes by using `ctrl`. No need for batch-change but for moving multiple nodes. 

3. **Node grouping/clustering** — 
Q: Should nodes in the same chapter/path visually cluster or have a background color grouping on the canvas?
A: Let's go with visually cluster which is toggleable.

4. **Minimap** — 
Q: React Flow supports a minimap. Include it for large graphs?
A: Yes.

5. **Dark mode only?** — 
Q: Given the "graph engine" aesthetic, should this be dark-mode-only, or support both light and dark?
A: Dark mode only for now.

6. **V1 data migration** — 
Q: Do you need to import V1 `.json` exports into V2? If so, a migration layer is needed (rename `scene` → `common`, `S###` → 
`N###`, add `maxValue` to status, etc.)
A: No need, start from a clean state.