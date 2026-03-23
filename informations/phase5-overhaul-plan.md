# Phase 5 — UI Overhaul Implementation Plan

**Scope:** UI layer only. All logic, data architecture, context, hooks, and JSON format are frozen.  
**Goal:** Replace the tab-based accordion editor with a canvas-first, sidebar-driven workspace.

---

## What Is Frozen (Do Not Touch)

| File | Reason |
|------|--------|
| `src/context/EditorContext.jsx` | All CRUD, state, `flagReferenceMap`, debounced save, `loadData`, `sanitizeName` — untouched |
| `src/hooks/useSimulator.js` | Simulation engine, `historyStack`, snapshot caching — untouched |
| `src/components/shared/ConditionEditor.jsx` | Logic is correct — only re-embedded in new sidebar |
| `src/components/shared/SearchableDropdown.jsx` | Logic is correct — only re-embedded in new sidebar |
| `src/components/shared/ErrorBoundary.jsx` | Stays as-is, re-used in new shell |
| `src/main.jsx` | Entry point and provider orchestration unchanged |
| All JSON export/import logic in `src/App.jsx` | `handleExport`, `handleImport`, validation — extracted and preserved |

---

## What Gets Replaced

| Old | New |
|-----|-----|
| Sticky left sidebar with 9 tab buttons | Nav bar strip below topbar |
| Tab-based main content area (accordion editors) | Canvas as permanent center stage |
| Phase 4 `RouteViewer.jsx` as a separate tab | Canvas promoted to primary workspace |
| Phase 2 `Simulator.jsx` as a separate tab | Simulator permanently in right sidebar |
| `QuickNav.jsx` floating panel | Absorbed into Left Sidebar Mode 2 |
| `App.jsx` layout shell | Rebuilt around new 3-column layout |

---

## New Layout Shell

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (40px)  — logo · project name · import · export     │
├─────────────────────────────────────────────────────────────┤
│  NAV BAR (36px) — Flags · Status · Choices · Scenes ·       │
│                   Paths · Chapters · Quests · Endings        │
├──────────────────┬──────────────────────┬───────────────────┤
│                  │                      │                   │
│  LEFT SIDEBAR    │   CANVAS             │  RIGHT SIDEBAR    │
│  (320px fixed)   │   (React Flow)       │  (320px fixed)    │
│                  │   fills remaining    │                   │
│  [ SAVE ]        │                      │  [ Simulator ]    │
│  (footer)        │                      │                   │
└──────────────────┴──────────────────────┴───────────────────┘
```

---

## Phase 5.1 — New Layout Shell

**Goal:** Rebuild `src/App.jsx` layout only. No logic changes. Canvas and sidebars are placeholder panels at this stage.

### Changes to `src/App.jsx`

- Remove: sticky left sidebar tab navigation
- Remove: `activeTab` state and tab-switching logic
- Remove: main content area that renders manager components by tab
- Keep: `handleExport`, `handleImport`, `entryNode` dropdown, `ErrorBoundary` wrapping
- Add: new 3-column flex layout (left sidebar · canvas · right sidebar)
- Add: nav bar below topbar (horizontal strip)
- Add: placeholder `<LeftSidebar />` component slot
- Add: placeholder `<RightSidebar />` component slot
- Add: `<RouteViewer />` mounted permanently in the canvas column

### New Files

- `src/components/layout/LeftSidebar.jsx` — shell only, renders "Mode 1" count dashboard by default
- `src/components/layout/RightSidebar.jsx` — shell only, mounts existing `<Simulator />` content
- `src/components/layout/NavBar.jsx` — horizontal nav strip, one button per entity type

### Notes

- `RouteViewer.jsx` already exists and works. It just needs to be moved from a tab into the permanent center column.
- `RightSidebar.jsx` wraps the existing simulator UI — no changes to `Simulator.jsx` internals yet.
- `ErrorBoundary` wraps the canvas column and left sidebar independently.

---

## Phase 5.2 — Left Sidebar Mode 1 (Default Dashboard)

**Goal:** When nothing is selected and no nav item is clicked, the left sidebar shows a project overview.

### Changes to `src/components/layout/LeftSidebar.jsx`

Add Mode 1 content:

- Entity count cards: Flags (N) · Status Points (N) · Choices (N) · Scenes (N) · Paths (N) · Chapters (N) · Quests (N) · Endings (N)
- Entry node display: shows current `entryNode` ID and name prominently. Warns if unset.
- Reads counts from `DataContext` — no new state needed

### Notes

- All counts are derived directly from existing context collections (`flags`, `choices`, `scenes`, etc.)
- No new logic. Pure read from `EditorContext`.

---

## Phase 5.3 — Left Sidebar Mode 2 (Entity List View)

**Goal:** Clicking a nav bar item opens the entity list for that type in the left sidebar.

### Changes to `src/components/layout/NavBar.jsx`

- Each button sets a `activeNavItem` state (lifted to `LeftSidebar` or a new `UIContext`)
- Active item highlights with `accent-primary` bottom border

### Changes to `src/components/layout/LeftSidebar.jsx`

Add Mode 2 content — rendered when `activeNavItem` is set:

- Header: entity type label + item count
- Search input (filter by name or ID)
- "New [Entity]" button — triggers Mode 3 (creation form)
- Scrollable list of entity rows. Each row shows: ID badge · name · key metadata
- Clicking a row triggers Mode 3 (edit form) AND selects/highlights the node on canvas if applicable
- Back button → returns to Mode 1

### Replaces

- `src/components/shared/QuickNav.jsx` — this component is retired. Its navigation function is now the list in Mode 2.
- The list content is sourced directly from existing manager components but rendered as compact rows, not accordions.

### Notes

- `QuickNav.jsx` can be kept in codebase but removed from all render trees.
- For non-canvas entities (Flags, Status, Paths, Chapters, Quests) — clicking a row only loads the edit form (Mode 3). No canvas selection needed since they don't appear as nodes.
- For canvas entities (Choices, Scenes, Endings) — clicking a row also calls React Flow's `setCenter` to focus that node on the canvas.

---

## Phase 5.4 — Left Sidebar Mode 3 (Edit / Creation Form)

**Goal:** The edit and creation forms for all entity types live in the sidebar. This is the biggest phase.

### New Files

Each entity gets a dedicated sidebar form component. These are **not rewrites** — they are the existing manager form fields extracted from their accordion wrappers and re-mounted in the sidebar layout.

| New Component | Extracts Logic From |
|---------------|-------------------|
| `src/components/layout/forms/ChoiceForm.jsx` | `src/components/choices/ChoiceEditor.jsx` |
| `src/components/layout/forms/SceneForm.jsx` | `src/components/scenes/SceneEditor.jsx` |
| `src/components/layout/forms/EndingForm.jsx` | `src/components/endings/EndingManager.jsx` |
| `src/components/layout/forms/FlagForm.jsx` | `src/components/flags/FlagManager.jsx` |
| `src/components/layout/forms/StatusForm.jsx` | `src/components/status/StatusManager.jsx` |
| `src/components/layout/forms/PathForm.jsx` | `src/components/paths/PathManager.jsx` |
| `src/components/layout/forms/ChapterForm.jsx` | `src/components/chapters/ChapterManager.jsx` |
| `src/components/layout/forms/QuestForm.jsx` | `src/components/quests/QuestManager.jsx` |

### Changes to `src/components/layout/LeftSidebar.jsx`

- Add Mode 3 render: mounts the correct `*Form.jsx` based on `activeNavItem` and selected entity ID
- Add sidebar footer: sticky `[ Save ]` primary button + `[ Cancel ]` ghost button
- Save commits the draft to `EditorContext` via existing action callbacks
- Cancel discards draft and returns to Mode 2
- New entities only appear on the canvas after Save

### Draft State

- Each form manages local draft state internally (React `useState`)
- On Save: calls the existing `EditorContext` action (e.g. `updateChoice`, `addFlag`) — same functions already used by the old accordion editors
- On Cancel: local draft is discarded, no context mutation

### Unsaved Edit Guards

- Switching nav items while a draft exists → warning modal: "You have unsaved changes. Save or discard before continuing."
- Starting simulation while a draft exists → warning modal: "Save or cancel your edits before starting a simulation."
- Both use the existing modal pattern already present in the codebase.

### Shared Components Reused As-Is

- `src/components/shared/ConditionEditor.jsx` — embedded directly in `ChoiceForm`, `SceneForm`, `EndingForm`
- `src/components/shared/SearchableDropdown.jsx` — embedded in all forms that reference other entities

---

## Phase 5.5 — Left Sidebar Mode 4 (Canvas Node Selection)

**Goal:** Clicking a node on the canvas loads its edit form in the left sidebar.

### Changes to `src/components/routeviewer/RouteViewer.jsx`

- Add `onNodeClick` handler that emits the selected node's ID and type upward
- This was already partially present for the inspector panel in Phase 4 — extend it to communicate with the new left sidebar instead

### Changes to `src/components/layout/LeftSidebar.jsx`

- Accept `selectedNodeId` and `selectedNodeType` as props (or via new `UIContext`)
- When set: load the matching `*Form.jsx` in Mode 4
- Mode 4 is visually identical to Mode 3 — same form, same Save/Cancel footer
- Difference: Mode 4 is triggered from canvas click, Mode 3 from nav list click

### Notes

- The old Phase 4 `Inspector Panel` (read-only node summary in `RouteViewer.jsx`) is retired.
- The new left sidebar form replaces it with a fully editable form.
- The React Flow node click handler already exists in `RouteViewer.jsx` — it powered the old inspector. Rewire it to the sidebar instead.

---

## Phase 5.6 — Simulator Right Sidebar Integration

**Goal:** Simulator permanently occupies the right sidebar. Left sidebar switches to Dynamic Tracker during active simulation.

### Changes to `src/components/layout/RightSidebar.jsx`

- Mount `useSimulator` hook here (currently lives inside `Simulator.jsx` and `RouteViewer.jsx` separately)
- Render existing simulator UI: start controls, choice display, scene display, undo button, ending detection
- Expose `isSimulationActive` flag upward (via props or `UIContext`)

### Changes to `src/components/layout/LeftSidebar.jsx`

- When `isSimulationActive === true`: override all modes and render Dynamic Tracker
- Dynamic Tracker content: live flags panel + live status panel (already exists inside `Simulator.jsx` as the right-hand tracker panel — extract and re-mount here)
- When simulation ends: restore previous sidebar mode

### Changes to `src/components/simulator/Simulator.jsx`

- The standalone `Simulator.jsx` tab is retired from the nav
- Its Dynamic Tracker subcomponent is extracted to `src/components/layout/DynamicTracker.jsx`
- Its core simulation UI (choices, scenes, ending screen) is moved into `RightSidebar.jsx`
- `useSimulator` hook usage remains — just re-homed

### Changes to `src/components/routeviewer/RouteViewer.jsx`

- Remove the embedded `SimulatorPanel` sidebar that was added in Phase 4
- The canvas still syncs with `useSimulator` for node state coloring and live graph tracking — that logic stays
- `useSimulator` instance is now owned by `RightSidebar.jsx` and shared downward

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

## Execution Order Summary

| Phase | What changes | Risk |
|-------|-------------|------|
| 5.1 | `App.jsx` layout shell rebuilt. Canvas permanent. Sidebars are empty placeholders. | Low — purely structural |
| 5.2 | Left sidebar Mode 1: count dashboard. | Low — read-only from context |
| 5.3 | Left sidebar Mode 2: entity list + nav bar wiring. QuickNav retired. | Medium — replaces navigation pattern |
| 5.4 | Left sidebar Mode 3: all edit/create forms. Draft state + Save/Cancel. | High — most complex phase |
| 5.5 | Left sidebar Mode 4: canvas node click → sidebar form. Inspector retired. | Medium — rewires existing click handler |
| 5.6 | Simulator into right sidebar. Dynamic Tracker into left sidebar override. | Medium — re-homing existing components |

---

## Components Retired After Phase 5

These files can be kept but are removed from all render trees:

- `src/components/shared/QuickNav.jsx` — replaced by sidebar Mode 2 list
- `src/components/simulator/Simulator.jsx` (as a tab) — content moved to `RightSidebar.jsx`
- Phase 4 Inspector panel inside `RouteViewer.jsx` — replaced by sidebar Mode 4
- The embedded `SimulatorPanel` inside `RouteViewer.jsx` — moved to `RightSidebar.jsx`

---

## Components Unchanged and Re-used

- `src/context/EditorContext.jsx`
- `src/hooks/useSimulator.js`
- `src/components/shared/ConditionEditor.jsx`
- `src/components/shared/SearchableDropdown.jsx`
- `src/components/shared/ErrorBoundary.jsx`
- `src/components/routeviewer/RouteViewer.jsx` (canvas logic stays — only inspector and simulator panel removed)
- All existing `*Manager.jsx` files (logic extracted, shells can be kept or cleaned up after)
