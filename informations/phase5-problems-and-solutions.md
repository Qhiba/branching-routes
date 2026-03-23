# Phase 5 — Post-Overhaul Problems & Solutions

**Status:** Found in production use after Phase 5 overhaul.  
**Scope:** Mix of UI improvements, one data format addition, and bug fixes.  
**Rule:** Logic engine and JSON format remain frozen — except Problem 1 which requires a new *optional* field on scenes (additive only, does not break existing data).

---

## Problem 1 — Conditional Text Variants Inside a Scene

### The Pain
Some scenes differ only slightly in dialogue depending on a flag or status state. The difference is minimal — a single sentence, a name, a reaction. Creating two near-identical scene nodes just to handle this is overkill and pollutes the canvas.

### The Solution — Scene Text Variants
Add an optional `variants` field to the scene data structure. A scene has a **base description** (always shown) and an optional array of **text variant blocks**, each with their own `requires` condition and override text.

The renderer evaluates variants top-to-bottom. The first variant whose `requires` passes replaces or appends to the base description. If no variant matches, the base description plays as-is.

```json
{
  "id": "S001",
  "name": "stranger_accepts_food",
  "description": "The stranger looks up at you with weary eyes.",
  "variants": [
    {
      "requires": [{ "flag": "F001", "state": true }],
      "text": "He recognizes the emblem on your coat and bows his head in gratitude."
    },
    {
      "requires": [{ "status": "SP001", "min": 5 }],
      "text": "Your confident posture makes him straighten up despite his exhaustion."
    }
  ]
}
```

### Data Format Impact
- Adds optional `variants: []` to scene objects. Empty array = no variants = existing behavior unchanged.
- Fully additive. Does not break any existing scene data.
- `variants` entries use the same `requires` condition format already used everywhere else — no new condition logic needed.

### UI Changes
- `SceneForm.jsx` (left sidebar) — adds a "Text Variants" section below the base description textarea
- Each variant has: `ConditionEditor` (reused as-is) + a textarea for the variant text
- "Add variant" button, remove button per row
- Variant rows are ordered — first match wins, same as scene `next`
- `ConditionEditor.jsx` — no changes needed, reused directly

### Canvas Node Display
- If a scene has variants, show a small badge on the node: `◈ N variants` in `text-muted`
- Clicking the node still opens the full form in the left sidebar

---

## Problem 2 — Edge-Based Next Wiring

### The Pain
The `next` field on choice options and scene routing requires the target node to already exist. Building forward means constantly going back to wire connections after creating new nodes, breaking creative flow.

### The Solution — Canvas Edge Connections
Leverage React Flow's native connection system. Each connectable point gets its own **output handle**. Drawing an edge on the canvas writes directly to the `next` field in the data.

### Handle Mapping

| Node type | Output handles |
|-----------|---------------|
| Choice node | One handle per option (keyed by option's unique ID) |
| Scene node | One handle per `next` entry (keyed by next entry's `_id`) |
| Ending node | No output handles — terminal |

All nodes have one **input handle** (the "into" point).

### Data Flow
React Flow's `onConnect` callback provides:
- `source` — the node ID
- `sourceHandle` — the option ID or next-entry `_id`
- `target` — the destination node ID

On connect:
- Find the matching option (by `sourceHandle`) → set `option.next = target`
- Or find the matching next entry (by `sourceHandle`) → set `nextEntry.target = target`

On disconnect (edge deleted):
- Set `option.next = null` or `nextEntry.target = null`

### Coexistence with the Form Dropdown
The `next` dropdown in the sidebar form still exists and still works. The two are always in sync — changing one updates the other. Edge on canvas = dropdown selection in form. They are two views of the same data.

### Changes Required
- `src/components/routeviewer/RouteViewer.jsx` — add `onConnect` and `onEdgesDelete` handlers. Wire to `EditorContext` update actions.
- Choice node component — render one output handle per option, keyed by option ID
- Scene node component — render one output handle per next entry, keyed by `_id`
- Existing edge rendering already reads `next` references — this just makes it bidirectional (edges become interactive, not just visual)

### Notes
- A `null` next on an option renders as an unconnected handle — visually open, inviting a connection
- The `__LOOP__` sentinel for loop-to-self still works — it just means the edge loops back to the same node (React Flow supports self-connecting edges)

---

## Problem 3 — Node Information Density

### The Pain
A node on the canvas shows almost nothing useful. To know if it has requirements, sets flags, or modifies status, you must open the sidebar form. At scale this becomes a constant chore.

### The Solution — Enriched Node Display
Each node renders a compact info strip showing the most important logic at a glance, without needing to open it.

### What to Show Per Node Type

**Choice node:**
```
┌─────────────────────────────────────────┐
│ ▓▓ [CHOICE]  CH001  offer_shelter       │
├─────────────────────────────────────────┤
│ Req: [ F001=true ] [ SP001≥2 ]         │  ← root requires (if any)
├─────────────────────────────────────────┤
│ ○ Yes, offer shelter                    │
│   → sets F003  +3 SP001                │  ← flags_set + status_set inline
│ ○ Refuse                                │
│   → -2 SP001                           │
│ ○ Ask for payment  🔒 F002=true        │  ← locked option shows its requirement
└─────────────────────────────────────────┘
```

**Scene node:**
```
┌─────────────────────────────────────────┐
│ ▓▓ [SCENE]  S001  stranger_accepts      │
├─────────────────────────────────────────┤
│ Req: [ F001=true ]                      │
│ ◈ 2 variants                           │  ← if variants exist
└─────────────────────────────────────────┘
```

**Ending node:**
```
┌─────────────────────────────────────────┐
│ ▓▓ [ENDING]  E001  good_ending          │
├─────────────────────────────────────────┤
│ Req: [ F001=true ] [ SP001≥5 ]         │
│ ◆ Terminal                              │
└─────────────────────────────────────────┘
```

### Display Rules
- Condition chips use the existing `ConditionChip` component spec from the design system — `[ F001=true ]` `[ SP001≥2 ]`
- Flag sets shown as: `sets F003` in `accent-variable`
- Status changes shown as: `+3 SP001` (`accent-success`) or `-2 SP001` (`accent-error`)
- If a choice option has its own `requires`, show a `🔒` with the condition inline
- If `requires` is empty, show nothing — silence means always accessible
- Node width may need to increase slightly to accommodate: from 240px to 280px

### Changes Required
- Choice node component — add option rows with inline flag/status summary
- Scene node component — add requires chips + variant badge
- Ending node component — add requires chips
- `src/components/routeviewer/RouteViewer.jsx` — pass full entity data into node `data` prop (it may already do this — verify)

---

## Problem 4 — Auto-Pan After Save

### The Pain
Saving a node causes the canvas camera to reposition, pulling focus away from the current working area. Forces a manual zoom-in after every save.

### The Solution
Preserve the camera viewport position on save. Do not call `setCenter` or `fitView` as a side effect of saving a node.

### Root Cause (likely)
After save, a new node is added to the canvas and dagre re-runs layout, which recalculates all node positions and triggers a `fitView` or `setCenter` call.

### Fix
- `src/components/routeviewer/RouteViewer.jsx` — identify where `fitView` or `setCenter` is called after layout
- Capture current viewport with `getViewport()` before layout runs
- After layout completes, restore viewport with `setViewport()` — only if this is a save-triggered layout, not an initial load
- Initial load and the "Layout" button should still call `fitView` as normal

### Notes
- This is a **bug fix**, not a feature change
- The "Layout" button in the canvas toolbar should still trigger `fitView` as expected — only automatic post-save layout should preserve position

---

## Problem 5 — Dynamic Tracker Too Large

### The Pain
During simulation, the Dynamic Tracker in the left sidebar shows all flags and status points as full rows. With many variables this fills the entire sidebar and becomes hard to scan quickly.

### The Solution — Compact Tracker Mode
Replace full-row variable display with a denser two-column grid layout. Only show variables that are **active or non-zero** by default, with a toggle to show all.

### New Layout

```
FLAGS                          [ Show all ]
─────────────────────────────────────────
● F001  gave_food_to_stranger
● F003  gave_shelter

STATUS
─────────────────────────────────────────
SP001  strength      5
SP002  suspicion     2
```

**Default (compact):**
- Flags: only show flags where `state === true`. Hidden flags shown as count: "14 inactive"
- Status: only show status points where `value !== startingValue`. Hidden ones shown as count: "3 unchanged"
- "Show all" toggle reveals everything

**Full mode (show all):**
- Flags: two-column grid. Each cell: dot indicator + ID + truncated name
- Status: same two-column grid. Each cell: ID + name + current value

### Specific Changes
- Extract Dynamic Tracker into `src/components/layout/DynamicTracker.jsx` (already planned in Phase 5.6)
- Add `showAll` boolean toggle state inside the component
- Default: `showAll = false` — only active/changed variables visible
- Flag row height reduced: from full card to a single compact line (28px per row)
- Status row height reduced: same treatment
- Animation on flag flip retained — brief row background flash

---

## Canvas Density Solution (Ghosting / Dimming)

**Decision Resolved:** To solve the issue of canvas density on large projects without losing the mental map of the graph structure, we will implement negative filtering via opacity (Ghosting/Dimming) instead of completely removing or hiding nodes.

### Approach:
- Unmatched nodes (via Nav Bar filters) or unconnected nodes (via Focus Mode in Phase 5.5) will apply a `dimmed: true` or equivalent property.
- These nodes will drop to a low opacity (e.g., `opacity-30`) and include `pointer-events-none` so they cannot be accidentally selected or dragged while ghosted.
- Connecting edges to dimmed nodes will also shift to a ghosted style.
- This preserves the physical layout calculations (avoiding graph shifting and snapping) while instantly dropping visual noise.

### Future Enhancements (Post-Phase 5.6):
- Path/chapter filter toggles in the nav bar that dim nodes not matching the active filter.
- Zoom-to-fit capability framing the non-dimmed nodes.
- A "focus mode" triggered on node selection that dims all nodes except those logically connected to the selected node.

---

## Implementation Order

| # | Problem | Type | Risk | Touches Data Format |
|---|---------|------|------|-------------------|
| 4 | Auto-pan after save | Bug fix | Low | No |
| 5 | Dynamic Tracker size | UI change | Low | No |
| 3 | Node information density | UI change | Medium | No |
| 2 | Edge-based Next wiring | Feature | Medium | No |
| 1 | Conditional text variants | Feature | Medium | Yes (additive only) |
| 6 | Other bug fixes | TBD | TBD | TBD |

Start with Problem 4 (bug fix, isolated) then Problem 5 (self-contained component). Problems 3 and 2 can be done in parallel since they both touch node components. Problem 1 last since it's the only one touching the data format.
