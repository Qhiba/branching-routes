# Branching Narrative Editor — Phase-Expanded UI/UX Design Spec
**Version:** 2.0  
**Intended reader:** AI implementation agent  
**Usage:** Feed `SECTION 0` as persistent context in every session. Feed only the relevant `SECTION` for the phase currently being built.

---

# SECTION 0 — Global Design System (always include)

## 0.1 Design Philosophy

This is a **power tool for narrative engineers**, not a marketing surface. Writers spend 4–8 hour sessions inside it. Every decision must serve two goals simultaneously:

1. **Information density** — show as much logic as possible without clutter
2. **State legibility** — the type or status of any entity must be readable at a glance, without hover

The aesthetic is **Dark Engineering Console**: obsidian surfaces, muted neutrals, color reserved exclusively for semantic meaning. Nothing is highlighted unless it means something in context.

---

## 0.2 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React v19.2.0 |
| Build Tool | Vite v7.2.4 |
| Styling | Tailwind CSS v4.1.18 (via `@tailwindcss/vite`) |
| Icons | Lucide React v0.562.0 |
| Node Graph (Phase 4 only) | `@xyflow/react` v12.10.0 |
| Auto Layout (Phase 4 only) | `@dagrejs/dagre` |

---

## 0.3 Color Token System

Define all tokens as Tailwind CSS custom properties in `tailwind.config`. Use these token names verbatim in all component classes.

### Surfaces

| Token | Hex | Role |
|---|---|---|
| `surface-canvas` | `#0e0e0e` | React Flow canvas background (Phase 4) |
| `surface-workspace` | `#131313` | Main app background |
| `surface-panel` | `#1c1b1b` | Sidebars, toolbars, nav |
| `surface-card` | `#2a2a2a` | Nodes, accordion cards, inspector sections |
| `surface-card-low` | `#201f1f` | Nested fields, inputs inside cards |
| `surface-elevated` | `#353534` | Modals, dropdowns, popovers |
| `surface-bright` | `#3a3939` | Tooltips |

### Text

| Token | Hex | Role |
|---|---|---|
| `text-primary` | `#e8e8e8` | All primary labels |
| `text-secondary` | `#bbc9cf` | Subtitles, descriptions |
| `text-muted` | `#6b8a93` | IDs, metadata, section headers |
| `text-disabled` | `#3a3939` | Locked/unreachable content |

> **Never** use `#ffffff` or `#000000`. Never use `text-primary` for secondary information.

### Borders

| Token | Value | Usage |
|---|---|---|
| `border-ghost` | `rgba(60,73,78,0.2)` | Default separator inside panels |
| `border-subtle` | `rgba(60,73,78,0.45)` | Hover states, secondary emphasis |
| `border-active` | `#00d1ff` | Focused inputs, active sim node |

### Semantic Accent Colors

Each token maps to exactly one semantic concept. Never use an accent color for decoration.

| Token | Hex | Meaning | Where used |
|---|---|---|---|
| `accent-primary` | `#00d1ff` | Active / current / focused | Current sim node, focused inputs, primary CTA |
| `accent-primary-dim` | `#4cd6ff` | Choice node type | Node header stripe, type badge |
| `accent-visited` | `#1d9e75` | Sim path taken | Visited node border, traversed edges |
| `accent-terminal` | `#c8770a` | Story ending | Ending node, terminal state badge |
| `accent-variable` | `#eaa9ff` | Flag identifiers | Flag ID text color only |
| `accent-success` | `#abf900` | Condition met / validation pass | Condition-met badge only |
| `accent-error` | `#ff6b6b` | Error / false state | `false` boolean value, validation error |
| `accent-scene` | `#a78bfa` | Scene node type | Scene node header stripe, type badge |

> **`accent-success` (lime) is NOT a general accent.** It appears only on validation badges and `true` boolean values. Ports do not glow by default.

---

## 0.4 Typography

### Typefaces

```
Display / module titles : Space Grotesk 600
UI labels / body        : DM Sans 400 / 500 / 600
Logic identifiers       : IBM Plex Mono 400 / 500
```

Load via Google Fonts: `Space+Grotesk:wght@600`, `DM+Sans:wght@400;500;600`, `IBM+Plex+Mono:wght@400;500`

> Do NOT use Inter, Roboto, or system fonts.

### Type Scale (workspace context)

| Role | Font | Size | Weight | Color token |
|---|---|---|---|---|
| Module title | Space Grotesk | 14px | 600 | `text-primary` |
| Section label | DM Sans | 10px | 600 | `text-muted` (uppercase, tracking-widest) |
| Card / node title | DM Sans | 13px | 500 | `text-primary` |
| Entity ID | IBM Plex Mono | 10px | 400 | `text-muted` |
| Field label / body | DM Sans | 12px | 400 | `text-secondary` |
| Logic identifier | IBM Plex Mono | 11px | 400 | varies by type — see §0.5 |
| Tooltip | DM Sans | 11px | 400 | `text-secondary` |

> No font size below 10px. No font size above 16px inside the workspace.

---

## 0.5 Logic Identifier Color Map

When rendering logic strings inline (inside nodes, inspector, condition chips), use these text colors.

| Data type | Color token | Example |
|---|---|---|
| Flag ID | `accent-variable` (#eaa9ff) | `F001` |
| Boolean `true` | `accent-success` (#abf900) | `true` |
| Boolean `false` | `accent-error` (#ff6b6b) | `false` |
| Status ID | `accent-primary-dim` (#4cd6ff) | `SP001` |
| Numeric value | `accent-primary` (#00d1ff) | `3`, `≥2` |
| Target ID | `accent-primary-dim` (#4cd6ff) | `S004`, `CH002` |

---

## 0.6 Elevation & Depth

No box-shadows. No `backdrop-filter: blur()`. Depth is tonal contrast only.

| Layer | Surface token |
|---|---|
| Canvas | `surface-canvas` |
| App background | `surface-workspace` |
| Panels / sidebars | `surface-panel` |
| Cards / nodes | `surface-card` |
| Inactive / archived | `surface-card-low` |
| Modals / dropdowns | `surface-elevated` |

**The No-Line Rule:** The boundary between canvas and panel is defined by tonal shift alone — no border. Inside panels, use `1px solid border-ghost` to separate sections.

---

## 0.7 Shared Component Specs

### Condition Chips

Render `requires[]` entries as inline pill chips, not table rows.

```
[ F001 = true ]   [ SP001 ≥ 2 ]
```

- Background: `surface-card-low`
- Border: `1px solid border-ghost`
- Border-radius: full pill (rounded-full)
- Padding: 2px 8px
- Font: IBM Plex Mono 10px
- Flag ID: `accent-variable`
- Operator: `text-muted`
- Value: `accent-success` (true) / `accent-error` (false) / `accent-primary` (number)

> One `<ConditionChip>` component handles both flag and status conditions. It reads `c.flag` vs `c.status` to choose the render path. Used in nodes AND inspector — single source of truth.

### Entity ID Badges

```
[ CH001 ]  [ F003 ]  [ SP002 ]
```

- Font: IBM Plex Mono 10px
- Color: `text-muted`
- No background — inline text only unless used as a navigation chip

### Path / Chapter Chips

```
[ P002 vigilante ]  [ C001 prologue ]
```

- Background: `surface-card-low`
- Border-radius: 4px
- Font: IBM Plex Mono 10px
- Color: `text-muted`
- Padding: 2px 6px

### Primary Button

```css
background: linear-gradient(135deg, #a4e6ff, #00d1ff);
color: #0a1a1f;
border-radius: 24px;
font: 600 11px 'DM Sans';
letter-spacing: 0.04em;
text-transform: uppercase;
padding: 5px 14px;
```

> Gradient is permitted **only** on the primary CTA. Nothing else uses gradients.

### Ghost Button

- Background: none
- Border: `1px solid border-ghost`
- Border-radius: 6px
- Color: `text-secondary`
- Hover: border → `border-subtle`, color → `text-primary`

### Input Field

- Background: `surface-card-low`
- Border: `1px solid transparent`
- Border-radius: 6px
- Font: DM Sans 13px
- Padding: 7px 10px
- Focus: border → `1px solid accent-primary`
- Placeholder color: `text-muted`
- No bottom-border-only style

---

## 0.8 Global Prohibited Patterns

These must never appear anywhere in the implementation.

| Prohibited | Reason |
|---|---|
| `backdrop-filter: blur()` on any panel | GPU overdraw on React Flow canvas — causes jank |
| `box-shadow` on nodes, cards, or panels | Replaced by tonal contrast |
| Glowing ports in default (non-sim) state | Color reserved for active simulation only |
| Font size above 16px in workspace | Type scale violation |
| `#ffffff` or `#000000` as a color value | Must use token system |
| 3 accent colors visible simultaneously on one node | Visual hierarchy collapse |
| Gradients anywhere except the primary CTA button | Decoration without function |
| Standard `1px solid` borders as layout dividers | Violates No-Line Rule |
| `display-lg` (3.5rem) headlines inside any panel | Marketing scale, not tool scale |
| Hardcoded hex values inside component CSS | All colors must reference tokens |

---
---

# SECTION 1 — Phase 1: Core Editor

## 1.1 Scope

Phase 1 delivers the full logic engine: Flags, Status Points, Choices, Scenes, Paths, Chapters, Import, and Export. No simulation. No graph canvas. This is the data-entry layer.

---

## 1.2 Layout Shell — Phase 1

```
┌──────────────────────────────────────────────────────┐
│ TOPBAR (40px)                                        │
├──────────────┬───────────────────────────────────────┤
│              │                                        │
│  TOP NAV     │   MAIN CONTENT AREA                   │
│  (tab bar)   │   (editor panels — scrollable)        │
│              │                                        │
└──────────────┴───────────────────────────────────────┘
```

- **Topbar:** `surface-panel`, 40px, contains logo + project filename + Import + Export buttons. No border — tonal shift defines it.
- **Top Nav:** Horizontal tab bar, `surface-panel`. One tab per section: Flags · Status Points · Choices · Scenes · Paths · Chapters.
- **Main content area:** `surface-workspace`, fills remaining space, scrollable vertically.
- **QuickNav:** Floating sticky panel on the right edge of Choices and Scenes editors. Renders a list of entity IDs. Clicking any ID calls `scrollIntoView()` on that entity.

---

## 1.3 Topbar

| Element | Spec |
|---|---|
| Logo | Space Grotesk 600, 13px, `accent-primary-dim` |
| Project filename | DM Sans 12px, `text-secondary` |
| Phase badge | Chip: `surface-card-low` bg, `text-muted`, 10px uppercase monospace |
| Import button | Ghost button |
| Export button | Primary button — disabled + tooltip if `entry_node` not set |

---

## 1.4 Top Navigation Tabs

- Height: 36px
- Active tab: `text-primary`, bottom border `2px solid accent-primary`, background `rgba(0,209,255,0.06)`
- Inactive tab: `text-muted`, no border
- Hover: `text-secondary`
- Font: DM Sans 12px 500
- No icons — text labels only

---

## 1.5 Flag Manager

### Layout

Full-width panel. Toolbar row at top, then a scrollable list of flag cards.

### Toolbar

- Search input (full-width or 320px max): placeholder "Search by name or ID…"
- "New Flag" ghost button (right-aligned)
- Result count: `text-muted` 11px, e.g. "31 flags"

### Flag Card

```
┌─────────────────────────────────────────────┐
│  F001  ·  gave_food_to_stranger              │  ← ID (mono, muted) + name (DM Sans 13px)
│  state: false                                │  ← state badge
│  [used in: CH001, CH003]  🔒                │  ← reference chips + lock icon if in use
└─────────────────────────────────────────────┘
```

- Background: `surface-card`
- Border: `1px solid border-ghost`
- Border-radius: 8px
- Padding: 10px 12px
- Name: DM Sans 13px 500 `text-primary`, `snake_case` enforced on input
- ID: IBM Plex Mono 10px `text-muted`
- State badge: pill chip — `accent-error` bg tint + text for `false`, `accent-success` bg tint + text for `true`
- State is read-only in this view — `false` always on creation, only simulator changes it
- Reference chips: `surface-card-low` bg, IBM Plex Mono 10px, `text-muted`
- Lock icon (Lucide `Lock`, 12px, `text-muted`): shown when flag is actively referenced — delete button hidden
- Delete button: shown only when unreferenced. Lucide `Trash2`, 14px, `text-muted`, hover `accent-error`

---

## 1.6 Status Point Manager

Same layout pattern as Flag Manager.

### Status Point Card

```
┌──────────────────────────────────────────────────┐
│  SP001  ·  strength                              │
│  starting value: 0   (global — no path/chapter)  │
│  [used in: CH001, S003]  🔒                      │
└──────────────────────────────────────────────────┘
```

- Starting value: editable number input, `surface-card-low` bg, IBM Plex Mono 12px
- "global" label: always shown, DM Sans 10px `text-muted` italic — no path or chapter field
- Same lock/delete behavior as Flag Manager

---

## 1.7 Choice Editor

### List View

Scrollable list of choice accordion cards. Each choice is a collapsible accordion.

**Collapsed state (summary header):**

```
┌──────────────────────────────────────────────────────┐
│  ▶  CH001  give_food_to_stranger  [P002] [C001]       │
│     2 conditions · 3 options · refs: S002            │
└──────────────────────────────────────────────────────┘
```

- Background: `surface-card`
- Left border accent: `3px solid accent-primary-dim`
- Path/chapter chips displayed inline
- Stats line: DM Sans 11px `text-muted`
- Expand icon: Lucide `ChevronRight` → `ChevronDown`

**Expanded state:**

```
┌──────────────────────────────────────────────────────┐
│  ▼  CH001  [name input]  [path dropdown] [ch dropdown]│
├──────────────────────────────────────────────────────┤
│  REQUIRES                                            │
│  [ ConditionEditor ]                                 │
├──────────────────────────────────────────────────────┤
│  OPTIONS                                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ [option label input]                           │  │
│  │ REQUIRES  [ ConditionEditor ]                  │  │
│  │ FLAGS SET [ flag multiselect dropdown ]        │  │
│  │ STATUS SET [ status + amount rows ]            │  │
│  │ NEXT → [ searchable dropdown ]                 │  │
│  └────────────────────────────────────────────────┘  │
│  + Add option                                        │
├──────────────────────────────────────────────────────┤
│  [ Delete choice ]              [ Collapse ]         │
└──────────────────────────────────────────────────────┘
```

- Section labels: 10px 600 DM Sans `text-muted` uppercase tracking-widest
- Option cards: `surface-card-low` bg, `border-ghost` border, 8px radius
- `next: null` option in dropdown: labeled "Loop (disable this option)" — renders in `text-muted` italic
- Safety lock: if choice is referenced as a `next` target, Delete button is hidden and a `🔒 referenced` label shows

### ConditionEditor (shared component)

Renders a `requires[]` array. Used in: Choice root, Choice options, Scenes.

```
[ + Add condition ]
[ flag ▾ ] [ F001 ▾ ] [ = ▾ ] [ true ▾ ]   [ × ]
[ status ▾ ] [ SP001 ▾ ] [ min ] [2] [ max ] [—]  [ × ]
```

- Each row: `surface-card-low` bg, `border-ghost` border, 6px radius, 8px padding
- Type selector: "flag" / "status" — DM Sans 12px dropdown
- Flag selector: searchable dropdown, shows `F001 · name`
- Status selector: searchable dropdown, shows `SP001 · name`
- Min/max inputs: IBM Plex Mono 12px number inputs, inline
- Remove button: Lucide `X` 12px `text-muted`

---

## 1.8 Scene Editor

### List View

Same accordion pattern as Choice Editor.

**Collapsed state:**

```
┌───────────────────────────────────────────────────────┐
│  ▶  S001  stranger_accepts_food  [P002] [C001]         │
│     2 conditions · next: 2 targets · refs: CH001      │
└───────────────────────────────────────────────────────┘
```

- Left border accent: `3px solid accent-scene`

**Expanded state:**

```
┌───────────────────────────────────────────────────────┐
│  ▼  S001  [name input]  [description textarea]        │
│           [path dropdown] [chapter dropdown]          │
├───────────────────────────────────────────────────────┤
│  REQUIRES                                             │
│  [ ConditionEditor ]                                  │
├───────────────────────────────────────────────────────┤
│  NEXT TARGETS · ordered list — first match wins       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 1. REQUIRES [ ConditionEditor ] → [ dropdown ]  │  │
│  │ 2. REQUIRES [ ConditionEditor ] → [ dropdown ]  │  │
│  │ 3. FALLBACK (requires: []) → [ dropdown ]  ← ⚠  │  │
│  └─────────────────────────────────────────────────┘  │
│  + Add target (inserts above fallback)                │
├───────────────────────────────────────────────────────┤
│  [ Delete scene ]              [ Collapse ]           │
└───────────────────────────────────────────────────────┘
```

- The last `next` entry is always the fallback — it cannot be deleted, its ConditionEditor is hidden and replaced with "Fallback · always matches" label
- If the fallback row is missing, show a warning badge: `⚠ No fallback — scene may get stuck`
- `next` target dropdown: searchable, includes scenes + choices + endings, shows type badge per result

---

## 1.9 Path & Chapter Manager

Minimal editors — organizational only, no logic fields.

**Path card:**
```
[ P001 ]  [ name input: "common" ]  [ × delete ]
```

**Chapter card:**
```
[ C001 ]  [ name input: "prologue" ]  [ × delete ]
```

- IDs auto-assigned and never editable
- Both can always be deleted (paths/chapters have no safety lock — they are purely organizational)
- "New Path" / "New Chapter" ghost buttons at top

---

## 1.10 QuickNav (Phase 1 shared utility)

- Floating fixed panel, right edge of the viewport
- Appears inside Choice Editor and Scene Editor
- Renders a vertical list of entity IDs: `CH001`, `CH002`, `S001`…
- Font: IBM Plex Mono 11px `text-muted`
- Hover: `text-secondary`
- Click: `scrollIntoView({ behavior: 'smooth' })` on that entity's accordion
- Width: 72px
- Background: `surface-panel` with `border-ghost` left border

---

## 1.11 Import / Export

### Import
- File picker accepting `.json`
- After file load, validate for ID conflicts
- If conflicts found: show a modal listing conflicting IDs with "Merge anyway" / "Cancel" options
- Modal: `surface-elevated` bg, 480px max-width, `border-ghost` border

### Export
- Validates before writing: no broken references, no empty IDs, no scene missing a fallback `next`, `entry_node` must be set
- If validation fails: show inline error list in a modal — each error is a row with the offending entity ID and a "Go to" link that scrolls to it
- On success: triggers browser download of `branching-routes.json`

---
---

# SECTION 2 — Phase 2: Simulation Sandbox

## 2.1 Scope

Phase 2 adds a live simulator that steps through the narrative via choices. No graph canvas. No raw flag toggling. All state derived from a choice history stack.

---

## 2.2 Layout Shell — Phase 2

```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR                                                   │
├──────────────┬───────────────────────┬───────────────────┤
│              │                       │                   │
│  TOP NAV     │   CHOICE/SCENE        │   SIMULATOR       │
│              │   EDITOR (existing)   │   PANEL           │
│              │                       │   (320px fixed)   │
│              │                       │                   │
└──────────────┴───────────────────────┴───────────────────┘
```

- Simulator panel: 320px fixed right sidebar, `surface-panel`, always visible when simulator is active
- Non-collapsible during an active simulation session
- Editor content area shrinks to fill remaining space

---

## 2.3 Simulator Panel

### Header

```
┌──────────────────────────────────┐
│  SIMULATOR          [ Reset ]    │
│  Starting from: [ CH001 ▾ ]     │
│  [ ▶ Start simulation ]         │
└──────────────────────────────────┘
```

- "Start simulation" is primary button
- Starting node: searchable dropdown, accepts any scene or choice ID
- Reset: ghost button — clears history stack and restarts from selected starting node
- Module title: Space Grotesk 14px 600

### Active Simulation — Choice Display

```
┌──────────────────────────────────────────────────────┐
│  CH002 · offer_shelter_tonight                       │
│  Step 3 of session                                   │
├──────────────────────────────────────────────────────┤
│  [ Option A: Yes, offer shelter ]   ← available      │
│  [ Option B: Refuse ]               ← available      │
│  [ Option C: Ask for payment ] 🔒   ← locked (req.)  │
└──────────────────────────────────────────────────────┘
```

- Current choice title: DM Sans 13px 500 `text-primary`
- Step counter: DM Sans 11px `text-muted`
- Available option: `surface-card` bg, `border-ghost` border, 8px radius, DM Sans 12px `text-secondary`, hover → `border-subtle` + `text-primary`
- Locked option: `surface-card-low` bg, `text-disabled`, cursor not-allowed, `🔒` icon — condition not met
- Infinite-loop protection: options already selected in the current loop are permanently disabled with a `↺ already chosen` label in `text-muted`

### Active Simulation — Scene Display

```
┌──────────────────────────────────────────────────────┐
│  S001 · stranger_accepts_food                        │
│  Scene — displaying narrative moment                 │
├──────────────────────────────────────────────────────┤
│  Description text here...                            │
│                                                      │
│  Next: CH002 (condition met)                         │
│  [ → Continue ]                                      │
└──────────────────────────────────────────────────────┘
```

- Scene description: DM Sans 13px `text-secondary`, line-height 1.6
- Next resolution shown inline: "Next: CH002 (condition met)" in `text-muted` 11px
- Continue button: ghost button

### Undo

- "⟲ Undo last choice" ghost button, below the choice display
- Pops last entry from history stack, recalculates all flags and status from scratch
- Disabled (with tooltip "Nothing to undo") when history stack is empty

---

## 2.4 Live Dynamic Tracker

Displayed below the choice/scene display, inside the simulator panel.

### Flags Section

```
FLAGS
─────────────────────────────
F001  gave_food_to_stranger    ● true
F002  rejected_stranger        ○ false
F003  gave_shelter             ○ false
```

- Section label: 10px uppercase `text-muted`
- Flag row: `surface-card-low` bg, `border-ghost` border, 4px radius, padding 4px 8px
- ID: IBM Plex Mono 10px `accent-variable`
- Name: DM Sans 11px `text-secondary`
- State: dot icon + value — `accent-success` for `true`, `text-muted` for `false`
- Animates when a flag flips: brief background flash to `rgba(171,249,0,0.12)` on the row

### Status Section

```
STATUS
─────────────────────────────
SP001  strength      current: 5  (started: 0)
SP002  suspicion     current: 2  (started: 0)
```

- Current value: IBM Plex Mono 13px `accent-primary` 500
- Started value: DM Sans 10px `text-muted`
- Row background flashes `rgba(0,209,255,0.1)` on value change

---

## 2.5 Ending Detection

When the simulator reaches a node with `type: ending`:

```
┌──────────────────────────────────────────────────────┐
│  ◆  ENDING REACHED                                   │
│                                                      │
│  E001 · good_ending                                  │
│                                                      │
│  All conditions met:                                 │
│  ✓ F001 = true                                      │
│  ✓ SP001 ≥ 5  (current: 7)                          │
│                                                      │
│  [ ↺ Start new simulation ]   [ ✕ Close ]           │
└──────────────────────────────────────────────────────┘
```

- Full-panel state replace: ending display takes over the simulator panel
- Background: `surface-card-low`
- Ending title: Space Grotesk 14px 600 `accent-terminal`
- Condition list: DM Sans 12px, each row with `✓` in `accent-success` or `✗` in `accent-error`
- "Start new simulation" restarts with same starting node; "Close" collapses simulator panel

---
---

# SECTION 3 — Phase 3: Structure & Usability Layer

## 3.1 Scope

Phase 3 adds organizational editors (Quests, Endings, Entry Node) and usability upgrades (searchable dropdowns, collapsible nav). No logic changes — Phase 1 data format is unchanged.

---

## 3.2 Layout Shell — Phase 3

Same as Phase 1, with additions:

- Nav panel gains collapsibility: collapse to 48px icon-only rail, expand to 200px. Collapse toggle: Lucide `PanelLeftClose` / `PanelLeftOpen`.
- Top Nav gains new tabs: **Quests** · **Endings** · **Entry Node**

---

## 3.3 Quest Editor

Organizational only — a Quest is an ID + name container for dialogues and scenes.

**Quest card:**
```
┌─────────────────────────────────────────────────────┐
│  Q001  [name input: "road_to_refuge"]               │
│  Scenes: S001, S003  ·  Chapter: C001              │
└─────────────────────────────────────────────────────┘
```

- IDs auto-assigned (`Q001`, `Q002`, …), never editable
- No conditions, no flags, no logic fields
- Chapter assignment: dropdown, optional
- Scene assignment: multi-select searchable dropdown

---

## 3.4 Ending Editor

Endings are terminal nodes with a `requires[]` condition array.

**Ending card:**
```
┌─────────────────────────────────────────────────────┐
│  E001  [name input: "good_ending"]                  │
├─────────────────────────────────────────────────────┤
│  REQUIRES · first ending whose conditions pass wins  │
│  [ ConditionEditor ]                                │
│                                                     │
│  ◆ Terminal — no Next field                         │
└─────────────────────────────────────────────────────┘
```

- Left border accent: `3px solid accent-terminal`
- "Terminal" indicator: Lucide `Diamond` icon 12px `accent-terminal` + "Terminal — no Next field" label `text-muted` 11px
- IDs auto-assigned (`E001`, `E002`, …)
- Endings appear in `next` target dropdowns across Scene and Choice editors

---

## 3.5 Entry Node Selector

Displayed as a dedicated tab or as a top-level settings row in the Topbar area.

```
ENTRY NODE
───────────────────────────────
The game starts at:  [ CH001 · give_food_to_stranger  ▾ ]

Only one entry node can be active. Export is blocked without one.
⚠ No entry node set — export disabled
```

- Searchable dropdown: accepts any scene or choice ID
- Shows current entry node as a selected chip with entity type badge
- Warning badge shown when `entry_node` is null: `accent-error` tint bg, `accent-error` text
- Setting a new entry node automatically clears the previous

---

## 3.6 Searchable Dropdowns (all dropdowns upgraded)

All flag, status, `next`, and condition reference dropdowns gain:

- Search input at top of dropdown popover
- Pre-filter by path and/or chapter before searching
- Each result row shows: entity ID (IBM Plex Mono 10px `text-muted`) + entity name (DM Sans 12px `text-secondary`) + type badge
- Keyboard navigable (arrow keys + enter)
- Popover: `surface-elevated` bg, `border-ghost` border, 8px radius, max-height 280px scrollable

---

## 3.7 Nav Panel — Collapsed State

When collapsed (48px):

- Each section becomes an icon-only button (Lucide icons)
- Hover tooltip shows section name
- Active section: icon uses `accent-primary-dim`
- Expand toggle at bottom of rail

---
---

# SECTION 4 — Phase 4: Route Viewer & Integrated Simulation

## 4.1 Scope

Phase 4 adds the node graph canvas, integrated simulator, live graph tracking, and route backtracking. This is the most visually complex phase — the simulation state system is its primary communication layer.

---

## 4.2 Layout Shell — Phase 4

```
┌──────────────────────────────────────────────────────────────────┐
│ TOPBAR (40px)                                                    │
├─────────────┬────────────────────────────────────┬──────────────┤
│             │                                    │              │
│  NAV PANEL  │   GRAPH CANVAS (React Flow)        │  INSPECTOR   │
│  (200px or  │   surface-canvas (#0e0e0e)         │  PANEL       │
│  48px rail) │                                    │  (280px)     │
│             │   [ MINIMAP — bottom right ]       │              │
│             │   [ SIM CONTROLS — bottom right ]  │              │
└─────────────┴────────────────────────────────────┴──────────────┘
```

- Inspector panel: 280px fixed right. Appears when a node is clicked. Non-collapsible during active simulation.
- Minimap: React Flow built-in `<MiniMap>`. Position: bottom-right corner of canvas. Node color in minimap reflects simulation state (see §4.4).
- Canvas fills remaining width between nav and inspector.

---

## 4.3 Node Components (React Flow custom nodes)

All nodes share this base structure:

```
┌─────────────────────────────────────────┐
│ ▓▓▓ TYPE STRIPE (3px) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├─────────────────────────────────────────┤
│ ID (mono 10px muted) · [TYPE BADGE]    │
│                          [STATE BADGE] │
│ Node title (DM Sans 13px 500)           │
├─────────────────────────────────────────┤
│ [ cond chip ] [ cond chip ]            │
│                                        │
│ ○ ○      (ports)              ○ (port) │
└─────────────────────────────────────────┘
```

**Dimensions:**
- Width: 240px fixed
- Min-height: auto (content-driven)
- Type stripe: 3px, top edge only
- Header padding: 10px 12px
- Body padding: 8px 12px 9px
- Border-radius: 10px

**Type stripe colors:**

| Node type | Stripe token |
|---|---|
| Choice | `accent-primary-dim` (#4cd6ff) |
| Scene | `accent-scene` (#a78bfa) |
| Ending | `accent-terminal` (#c8770a) |

**Node receives a `simulationState` prop:**
```
'idle' | 'current' | 'visited' | 'reachable' | 'unreachable' | 'terminal'
```

Node applies styles from a `STATE_STYLES` map — never conditionally inline.

---

## 4.4 Simulation Node States

The 5 states are the primary communication layer of the graph. All must be legible without hover.

| State | Border | Background | Text | Badge |
|---|---|---|---|---|
| `idle` | `0.5px border-ghost` | `surface-card` | `text-primary` | None |
| `current` | `1.5px solid #00d1ff` | `#001e2e` | `text-primary` | Blue pill "CURRENT" |
| `visited` | `0.5px solid #1d9e75` | `#0a1e1a` | `#7ab89a` | Green pill "VISITED" |
| `reachable` | `0.5px border-ghost` | `surface-card` | `text-secondary` | None |
| `unreachable` | `0.5px solid #252525` | `#181818` | `text-disabled` + `line-through` | Gray pill "LOCKED" |
| `terminal` | `1.5px solid #c8770a` | `#1e1400` | `#e8b96a` | Amber pill "TERMINAL" |

**MiniMap node color function:**
```js
const minimapColor = (node) => ({
  idle:        '#2a2a2a',
  current:     '#00d1ff',
  visited:     '#1d9e75',
  reachable:   '#2a2a2a',
  unreachable: '#181818',
  terminal:    '#c8770a',
}[node.data.simulationState] ?? '#2a2a2a');
```

---

## 4.5 Graph Edges

| Edge state | Stroke | Width | Style |
|---|---|---|---|
| Taken / visited path | `#1d9e75` | 2px | solid |
| Default / possible | `border-subtle` | 1px | solid |
| Blocked / unreachable | `#252525` | 1px | dashed |
| Active (to current node) | `rgba(0,209,255,0.5)` | 2px | dashed animated |

---

## 4.6 Connection Ports

Default state (non-simulation):
- 8px circle
- Fill: `surface-card-low`
- Border: `1px solid border-subtle`
- Cursor: crosshair

During active simulation — output of the current node:
- Border: `1px solid accent-primary`
- Subtle pulse animation on the active output port

> No color-coded port types in default state. Ports are muted by design.

---

## 4.7 Auto Layout

- Layout engine: `@dagrejs/dagre`
- Direction: top-to-bottom (`TB`)
- Node size passed to dagre: `{ width: 240, height: 100 }` (approximate — dagre uses this for spacing)
- Recalculated fresh every session — node positions are **never saved to JSON**
- Manual drag is display-only: drag handler updates React Flow internal position, but never writes back to `branching-routes.json`
- Filter by path and/or chapter: re-runs dagre layout on the filtered node set

---

## 4.8 Inspector Panel (Phase 4)

Inspector renders the full data structure of the selected node. The panel slides in from the right on node click. During active simulation, it is non-collapsible.

### Inspector Header

```
┌────────────────────────────────────────────────┐
│ [CHOICE]  CH002  ·  offer_shelter_tonight      │
│ [P002 vigilante] [C001 prologue]               │
└────────────────────────────────────────────────┘
```

- Background: `surface-card`
- Type badge + ID (mono) + title
- Path/chapter chips on second row

### Inspector Sections — Section Order by Node Type

**Choice node:**
1. Header
2. Requires (condition chips)
3. Flags set (flag rows)
4. Status changes (delta rows)
5. Next targets (conditional chain)
6. Footer bar (validation + reference count)

**Scene node:**
1. Header
2. Requires
3. Next targets (conditional fallback chain)
4. Footer bar

**Ending node:**
1. Header
2. Requires
3. Terminal indicator (no Next section)
4. Footer bar

### Section Styles

- Section label: 10px 600 DM Sans `text-muted` uppercase tracking-widest, padding 8px 13px 5px
- Section body padding: 4px 13px 10px
- Section separator: `1px solid border-ghost`

### Flag Row Spec

```
↑ F→T   F003 (accent-variable)   gave_shelter (text-muted)
```

- `↑ F→T`: IBM Plex Mono 10px `accent-success`
- Flag ID: IBM Plex Mono 11px `accent-variable`
- Flag name: DM Sans 11px `text-muted`

### Status Row Spec

```
[  +3   SP001   strength   global  ]
```

- Background: `surface-card-low`, 6px radius, padding 5px 8px
- Delta: IBM Plex Mono 12px 500 `accent-primary` (positive) / `accent-error` (negative)
- Status ID: IBM Plex Mono 11px `accent-primary-dim`
- Name: DM Sans 11px `text-secondary`
- "global": DM Sans 10px `text-muted`, right-aligned

### Next Target Row Spec

```
[ if   F002=true (accent-variable)        → S004 (accent-primary-dim) ]
[ if   SP001≥5                            → S003                       ]
[ fallback · requires: []   (text-muted)  → S002                       ]
```

- Background: `surface-card-low`, `border-ghost` border, 6px radius
- "if": DM Sans 10px `text-muted`
- Condition: IBM Plex Mono 10px using logic color map (§0.5)
- Target: IBM Plex Mono 11px 500 `accent-primary-dim`, right-aligned
- Fallback row: "fallback · requires: []" in italic `text-muted`

### Inspector Footer Bar

```
[ ✓ 2 conditions met ]                [ referenced by 1 scene ]
```

- Background: `surface-card-low`
- Border-top: `1px solid border-ghost`
- Padding: 8px 13px
- Validation badge: `accent-visited` tint bg + text on pass; `accent-error` tint on fail
- Reference count: DM Sans 11px `text-muted`, right-aligned

---

## 4.9 Simulation Controls

Floating controls in bottom-right corner of the canvas (above minimap).

```
[ ● Simulation active  ]
[ ⟲ Undo last choice   ]
[ ◼ End simulation     ]
[ ⇲ Follow camera  ON  ]
```

- Background: `surface-elevated`
- Border: `1px solid border-subtle`
- Border-radius: 6px
- Font: DM Sans 11px 500 `text-secondary`
- Active state (e.g. "Follow camera ON"): border → `accent-primary`, color → `accent-primary-dim`, bg → `rgba(0,209,255,0.08)`
- "Simulation active" indicator: `●` dot in `accent-primary`, animated pulse

---

## 4.10 Simulator Start Panel (above canvas or in inspector pre-selection)

```
START SIMULATION
────────────────────────────────────────
[ ▶ Start from beginning ]   ← pre-fills entry_node

  — or —

  Starting node:  [ searchable dropdown ▾ ]
  [ ▶ Start ]
```

- "Start from beginning" primary button: pre-fills the dropdown with `entry_node` value
- On start: camera animates to starting node via React Flow `setCenter`
- Camera follow: `setCenter` with `{ duration: 600 }` smooth transition follows current node as simulation progresses
- Follow mode toggle: turns off camera auto-follow, allowing free pan

---

## 4.11 Route Backtracking

Triggered from a "Trace route" button in the Inspector footer when an ending or scene is selected.

```
ROUTE BACKTRACKING
────────────────────────────────────────────────
Target: E001 · good_ending

Required path (optimal):
  1. CH001 → option "Yes, give food" (sets F001)
  2. CH002 → option "Offer shelter" (sets F003, SP001+3)
  3. CH004 → option "Stay the night" (SP001+3)

Minimum choices: 3
[ Highlight on graph ]   [ Close ]
```

- Panel renders inside the Inspector when backtracking result is ready
- Required choices listed as numbered rows: choice ID + option label + what it sets
- "Highlight on graph": applies a distinct gold (`#d4a017`) edge overlay on the optimal path edges in the graph
- Highlighted path edges: `2px solid #d4a017`, z-index above default edges

---

## 4.12 Graph Filtering

Filter controls sit in the nav panel or as a toolbar above the canvas.

```
Filter by:  [ Path ▾ ]  [ Chapter ▾ ]   [ Clear filters ]
```

- Selecting a filter: re-runs dagre layout on filtered node subset
- Filtered-out nodes are hidden (not greyed out — they are removed from the canvas)
- Clear filters: restores full graph and recalculates layout
- Filter state persists through simulation

---

## 4.13 Implementation Notes for Phase 4

1. **`simulationState` is a prop, not derived in the node.** The parent simulation controller computes state for all nodes on every step and passes it down via React Flow `setNodes`. Nodes are purely presentational.

2. **Flags and status are never stored directly in simulator.** All state is derived by replaying `choiceHistory`:
   ```js
   function recalcState(choiceHistory, allChoices) {
     const flags = {};
     const status = {};
     choiceHistory.forEach(entry => {
       const option = getOption(entry, allChoices);
       option.flags_set.forEach(f => flags[f] = true);
       option.status_set.forEach(s => {
         status[s.status] = (status[s.status] ?? getStartingValue(s.status)) + s.amount;
       });
     });
     return { flags, status };
   }
   ```

3. **dagre layout recalculates every session.** Never persist node positions to `branching-routes.json`. React Flow internal drag state is ephemeral.

4. **MiniMap node color function** must reference the `simulationState` on `node.data` — not the node type. See §4.4.

5. **Route backtracking is a graph traversal, not a simulation.** It works backwards from the target node through the `next` reference graph, finding the minimum set of choices whose `flags_set` satisfies all conditions on the path. This requires the full flag dependency graph to exist — only meaningful with a sufficient number of defined flags, choices, and scenes.

6. **Infinite-loop protection (inherited from Phase 2)** remains active in Phase 4 simulator. Options already chosen in the current loop remain permanently disabled.
