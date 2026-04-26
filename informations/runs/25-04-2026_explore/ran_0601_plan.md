# 0601 Plan — Explore

## CONTEXT

**PROJECT NAME:** Branching Routes
**STACK:** React 19, Vite, React Flow (@xyflow/react), Zustand 5, Dagre, Lucide-React, JavaScript (.jsx/.js)

### Part 1 — What I Want to Try

1. Search bar inside all node and edge modals/panels that have a Set Flag feature, so many flags don't clutter the scroll.
2. Search bar inside the Status picker panel as well.
3. The information shown when 'R' key is pressed needs to change:
   - Flag should show as `[FLAG_NAME] = true` (green) / `[FLAG_NAME] = false` (red)
   - Status should show the actual number.

**What "working" looks like:**
1. I can type in a search box to filter the flag list — the list shrinks rather than requiring a long scroll.
2. Same for the status list.
3. Flag and status information in nodes and on edges are readable and colour-coded.

---

## TASK — AI Analysis

### Files Likely Involved

**Feature 1 & 2 — Search Bars in Flag / Status Pickers**

- **Path:** `src/components/OptionEditor.jsx`
  **Why:** Contains the `flags_set` and `status_set` assignment lists on choice-node options; both lists need a filter input when the project has many flags or statuses.

- **Path:** `src/components/VariantEditor.jsx`
  **Why:** Contains the `requires` condition clause list on common-node variants; the flag dropdown inside each clause needs a search filter.

- **Path:** `src/components/EdgeInspector.jsx`
  **Why:** Contains the condition-clause editor for edges; the flag/status dropdowns in each clause need a search filter when the list is long.

**Feature 3 — Verbose 'R'-Key Display Formatting**

- **Path:** `src/components/nodes/CommonNode.jsx`
  **Why:** In `verbose` label display mode, side-effect names are shown inline; the format and colours need to change to `[FLAG_NAME] = true/false` (green/red) and numeric status values.

- **Path:** `src/components/nodes/ChoiceNode.jsx`
  **Why:** Same as CommonNode — verbose side-effect rendering must be updated for the new format.

- **Path:** `src/components/edges/ConditionalEdge.jsx`
  **Why:** In `verbose` mode, condition badges display full clause text; flag values should adopt the coloured `[FLAG_NAME] = true/false` format.

- **Path:** `src/styles/global.css`
  **Why:** New CSS classes are needed to colour flag-true values green and flag-false values red in the verbose display.

- **Path:** `src/styles/tokens.css`
  **Why:** Semantic colour tokens (e.g. `--color-flag-true`, `--color-flag-false`) should be added rather than hardcoding hex values in components.

---

### Files to Protect

- **Path:** `src/store/narrativeStore.js`
  **Why:** No store changes are needed — all three features are purely UI rendering and local filtering; the existing `flag` and `status` collections are read-only from store.

- **Path:** `src/utils/conditionEvaluator.js`
  **Why:** AR-07 forbids any condition logic outside this file; nothing in these four features touches evaluation logic.

- **Path:** `src/utils/fileSystem.js`
  **Why:** No data-model change requires a migration; all three features are visual/UI only.

- **Path:** `src/utils/routeTracer.js`
  **Why:** Pure graph algorithms with no UI dependency — none of these features affect routing or reachability logic.

- **Path:** `src/store/simulationStore.js`
  **Why:** Campaign simulation state is unrelated to all four UI improvements.

- **Path:** `src/hooks/useKeyboardShortcuts.js`
  **Why:** The `R` key binding is already correct; only the *rendering* of verbose mode changes, not the toggle shortcut.

---

### Definition of Done

1. When I open the Option Editor for a choice node and click to assign a flag, a search box appears above the flag list — typing part of a flag name immediately filters the list down to matching names only.
2. The same search box behaviour applies when assigning a status inside the Option Editor.
3. When I open the Edge Inspector and add a condition clause, a search box appears in the flag/status dropdown — I can type to filter instead of scrolling.
4. When I press `R` to switch to verbose label mode, each flag shown on a node or edge reads as `[FLAG_NAME] = true` in green text or `[FLAG_NAME] = false` in red text.
5. When I press `R`, each status shown on a node reads as `STATUS_NAME: 42` (the actual number), not just a count badge.

---

### Risks

- **WARNING — Feature 1 & 2 search filter must use local state:** The filter query string must live in component `useState`, not in any Zustand store. Per AR-03, stores must not hold transient UI-only state like search inputs.

- **WARNING — Feature 1 & 2 selector stability:** If the search filter causes a component to derive a filtered array via a Zustand selector (e.g. `useNarrativeStore(s => Object.values(s.flag).filter(...))`), the selector returns a new array reference on every render and will trigger an AR-14 infinite loop. The correct pattern is to read the full flag/status collection with a stable selector and do the filtering inside the component render — not inside the selector.

- **WARNING — Feature 3 colour tokens:** Do not hardcode hex colour values directly in component JSX. Add named tokens to `tokens.css` (e.g. `--color-flag-true`, `--color-flag-false`) and reference them via CSS classes in `global.css`. This keeps the colour palette consistent and discoverable.

- **WARNING — AR-21 compliance:** Feature 3 requires new CSS rules in `global.css` and new tokens in `tokens.css`. Per AR-21, both stylesheet files must appear explicitly in the file map for the execution phase — not bundled silently with the component entry.

---

### Architecture Rules to Respect

> AR-03 — All global application state lives exclusively in Zustand stores. React component local state (`useState`) is limited to UI-only concerns (e.g., modal open/closed, hover state) and must never hold graph data.

> AR-04 — No component file may directly mutate the graph data structure. All mutations must go through a Zustand store action. Components are read-only consumers of store state.

> AR-14 — Zustand selectors must never return new object or array literals (e.g., `[]`, `{}`) as fallback values. Selectors must return `undefined` or `null` for absent data; the consuming component defaults outside the hook.

> AR-21 — When a new component requires new CSS rules added to `global.css` or a standalone `.css` file, that stylesheet change must be listed as an explicit file in the feature's file map alongside the component file.

> AR-23 — Components must not subscribe to a Zustand store by destructuring the entire store object. Each subscription must target only the specific slice of state the component needs via a selector function.
