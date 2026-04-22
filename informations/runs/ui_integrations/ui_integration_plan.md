# UI Vision Integration Plan — Branching Routes

## Context

The existing app (React 19 + Zustand + plain CSS with design tokens in `src/styles/tokens.css`, no Tailwind, custom inline SVG icons) already implements most of the functionality the vision file describes — nodes, edges, flags, status, paths, chapters, campaigns, route tracing, status strip. The change is primarily **visual/structural reorganization**, not new logic.

The vision file (`informations/runs/ui_integrations/new_ui_vision.jsx`) is written in Tailwind + lucide-react. Two rules shape this integration:

1. **No Tailwind ever.** The vision is a *reference* for layout, color, spacing, and interaction — not a drop-in component. All styling must translate into plain CSS using existing tokens, extending `tokens.css` where needed.
2. **Don't break the working system.** The app is currently functional. Each phase must be independently stoppable and testable; a failed phase must not break the previous one.

Confirmed decisions:
- Add `lucide-react` (replaces hand-drawn SVGs in *new* components only; existing node/edge SVGs stay untouched).
- NodeInspector becomes the full-screen 2-column modal; docked inspector is retired.
- Flags/Status/Chapter/Paths move from right sidebar to a new **left sidebar** with vertical nameplate tabs.

---

## 1. Behavior Delta

**Before:**
- 3-row grid: TopBar (48px) / GraphCanvas + 300px right Sidebar / StatusStrip (28px).
- Right Sidebar is a tabbed panel: Inspector / Flags / Status / Paths / Sandbox.
- Node editing happens in the docked Inspector tab.
- Campaign control lives in the TopBar (CampaignSelector).
- Route tracing opens as a standalone modal dialog.
- Node creation via CreationBar / context menu.

**After:**
- 2-column shell inside the main area: **Left sidebar (nameplate tabs: Flags / Status / Chapter / Paths)** + Canvas + **Right sidebar (nameplate tabs: Nodes / Route Tracing / Campaign List)**. Top bar and bottom status strip unchanged in position.
- TopBar restyled: project title input + grouped button cluster (Tidy / Snap / Clusters) + file ops (New / Import / Export). No campaign controls in TopBar.
- A **floating middle bar** centered above the canvas holds: node-type quick-create buttons + campaign selector + Start button. In campaign mode this bar swaps to the active-campaign pill (Undo / Reset / Exit).
- Node editing happens in a **full-screen NodeConfigModal** (2-column for Common/Choice, narrow single-column for Ending).
- Route tracing moves into the right sidebar as a panel (configuration → results view).
- Campaign management moves into the right sidebar as a panel.

**Identical in both:** All Zustand stores, all graph data, all persistence (IndexedDB), all node/edge rendering inside React Flow, all simulation/campaign logic, all file import/export, all keyboard shortcuts, all route-tracing algorithm behavior, all condition evaluation.

---

## 2. Migration Strategy

**NOT APPLICABLE.** No persisted data shape changes. Stores, IndexedDB keys, and file export format are untouched. This is a pure UI-layer refactor.

---

## 3. Phase Breakdown

Each phase is shippable on its own. The app stays functional throughout.

### Phase 0 — Foundation

- **Goal:** Add dependencies and design tokens needed by all later phases, without touching any rendered UI yet.
- **Changes:**
  - `npm install lucide-react`
  - Extend `src/styles/tokens.css` with missing vision tokens: indigo accent scale (`--color-accent-500` / `-600`), amber/emerald/blue/rose/purple/cyan accent families (for left-sidebar tab icon colors), a small set of shadow tokens (`--shadow-float`, `--shadow-nameplate`), backdrop-blur utility class, scrollbar-thin utility class, animation keyframes (`fade-in`, `zoom-in-95`, `slide-in-from-top`).
  - Create `src/styles/utilities.css` for vision-style primitives reused across new components (pill, nameplate, floating-bar, modal-shell, segmented-control). Imported from `global.css`.
- **Produces:** `package.json`, `package-lock.json`, `src/styles/tokens.css`, `src/styles/utilities.css`, `src/styles/global.css` (import line).
- **Leaves inconsistent:** Nothing — no UI consumes the new tokens yet.
- **Next phase depends on:** Tokens available, lucide-react installed.
- **Rollback cost:** LOW (revert files, `npm uninstall lucide-react`).
- **Hard stop triggers:** Token name collision with existing variables.
- **Acceptance:** App builds and runs identically to before.
- **Verification:** Run dev server, open the app, confirm every screen looks pixel-identical to before.

### Phase 1 — Shell restructure (empty two-sidebar layout)

- **Goal:** Introduce the left+right nameplate-sidebar layout scaffold without moving any real content yet.
- **Changes:**
  - Update `src/App.jsx` / `src/App.css` grid to: TopBar / (LeftSidebar + Canvas + RightSidebar) / StatusStrip.
  - Add `src/components/layout/LeftSidebar.jsx` and `src/components/layout/RightSidebar.jsx`. Each renders a vertical nameplate rail (42px) with placeholder tabs and an expanding 320px panel area.
  - Create shared `src/components/layout/NameplateTab.jsx`.
  - Temporarily, the existing Sidebar.jsx still renders all its current tabs inside the new RightSidebar panel area (via a "legacy" placeholder tab), so no feature is lost.
- **Produces:** `src/App.jsx`, `src/App.css`, `src/components/layout/LeftSidebar.jsx`, `src/components/layout/RightSidebar.jsx`, `src/components/layout/NameplateTab.jsx`, `src/components/layout/*.css`.
- **Leaves inconsistent:** Left sidebar tabs render empty panels (managers haven't moved yet — Phase 2). Right sidebar still renders legacy Sidebar (moves in Phase 3).
- **Next phase depends on:** Left sidebar panel slot exists and can host components.
- **Rollback cost:** LOW (revert App.jsx/App.css and delete new files).
- **Hard stop triggers:** Canvas loses pointer events, React Flow resize breaks.
- **Acceptance:** Left nameplate rail visible with 4 empty tabs. Right sidebar still works exactly as before. All existing features usable.
- **Verification:** Open app → confirm left rail with "Flags/Status/Chapter/Paths" tabs appears; click each → empty panel slides open; right sidebar tabs (Inspector/Flags/Status/Paths/Sandbox) all still work; create a node, start a campaign, export a file — all succeed.

### Phase 2 — Populate left sidebar (move managers)

- **Goal:** Move `FlagManager`, `StatusManager`, `PathChapterManager` content from the right sidebar into the new left sidebar tabs.
- **Changes:**
  - Left sidebar "Flags" tab renders `FlagManager`. "Status" → `StatusManager`. "Chapter" → `PathChapterManager` filtered to chapters. "Paths" → `PathChapterManager` filtered to paths.
  - Wrap each manager in a shared search-header + "+" create-button shell per the vision's `EntityListView`. Restyle existing manager internals with the new list-row treatment using plain CSS — no logic change.
  - Remove Flags / Status / Paths tabs from the legacy right Sidebar.
- **Produces:** `src/components/FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx` (presentational tweaks only), `src/components/Sidebar.jsx` (tab list pruned), new CSS for list-row treatment.
- **Leaves inconsistent:** Right sidebar still hosts Inspector + Sandbox tabs until Phase 3/6.
- **Next phase depends on:** Managers confirmed working from left rail.
- **Rollback cost:** LOW (restore Sidebar.jsx tab list, revert left-tab wiring).
- **Hard stop triggers:** Any manager CRUD action throws; Zustand updates don't re-render.
- **Acceptance:** Creating a flag from the left Flags panel produces the same store state as before. Status/Chapter/Paths identical.
- **Verification:** Open app → left sidebar → Flags → click "+" → create `test_flag` → confirm it appears. Repeat for Status, Chapter, Paths. Open a node and confirm the new flag is selectable in its condition editor.

### Phase 3 — Populate right sidebar (Nodes / Route Tracing / Campaign List)

- **Goal:** Build the three new right-sidebar panels per the vision.
- **Changes:**
  - **Nodes panel**: new `src/components/panels/NodesPanel.jsx`. Segmented Common/Choice/Ending filter, search box, list of nodes from `narrativeStore`. Click edit → opens NodeConfigModal (Phase 6 wires this; for now opens existing NodeInspector as a temporary bridge).
  - **RouteTracingPanel**: new `src/components/panels/RouteTracingPanel.jsx`. Port `RouteFinderDialog.jsx` logic (target node, tie-break priorities, path cap, run trace → results) into the panel's two-state UI. Keep the algorithm (`utils/routeTracer.js`) untouched.
  - **CampaignListPanel**: new `src/components/panels/CampaignListPanel.jsx`. Port `CampaignSelector.jsx` list UI here (create, rename, delete). Start button moves to the floating middle bar (Phase 5).
  - Remove Inspector tab from legacy Sidebar.jsx (Inspector behavior still reachable via node double-click → opens legacy NodeInspector until Phase 6). Remove Sandbox tab or relocate to right-sidebar tab if still desired (decide at phase time — flag as RULE CANDIDATE if kept).
- **Produces:** `src/components/panels/NodesPanel.jsx`, `RouteTracingPanel.jsx`, `CampaignListPanel.jsx`, their CSS files, `src/components/Sidebar.jsx` (deleted or stubbed if fully vacated).
- **Leaves inconsistent:** TopBar still holds campaign controls (cleaned in Phase 4). Start button lives in CampaignListPanel temporarily until Phase 5 moves it to floating bar.
- **Next phase depends on:** Campaign list panel is the canonical list UI.
- **Rollback cost:** MEDIUM (three panels created; reverting means restoring legacy Sidebar).
- **Hard stop triggers:** Route trace returns different results after port; campaign activation doesn't start simulation.
- **Acceptance:** Trace finds the same paths as before on the same graph. Creating/deleting campaigns persists through reload.
- **Verification:** Open app → right sidebar → Route Tracing → pick a target → Run Trace → confirm same number of paths and same `steps` count as pre-refactor. Create a campaign from the right panel, reload the page, confirm it persists.

### Phase 4 — TopBar restyle

- **Goal:** Rebuild TopBar to match vision: title input, grouped button cluster (Tidy / Snap / Clusters), file-ops group (New / Import / Export). Remove campaign controls.
- **Changes:**
  - Rewrite `src/components/TopBar.jsx` layout using lucide icons and new CSS classes from `utilities.css`.
  - Bindings: Tidy Layout → existing dagre handler. Snap toggle → `uiStore.toggleSnapToGrid`. Clusters → `uiStore.cycleClusterMode` (button label reflects current mode). New/Import/Export → existing file handlers in `utils/fileSystem.js`.
  - Remove CampaignSelector embed (already moved to right panel in Phase 3).
- **Produces:** `src/components/TopBar.jsx`, `src/components/TopBar.css`.
- **Leaves inconsistent:** Start-campaign action is in right panel but not yet in the vision's floating bar (Phase 5 fixes).
- **Next phase depends on:** TopBar is no longer the home for campaign controls.
- **Rollback cost:** LOW (single-component revert).
- **Hard stop triggers:** Tidy/Snap/Clusters not wired to the same store actions as before.
- **Acceptance:** All existing TopBar buttons still produce identical store mutations.
- **Verification:** Click Snap → confirm canvas snap behavior. Click Clusters → confirm clustering toggles through modes. New/Import/Export → confirm file round-trip still works on a sample project.

### Phase 5 — Floating middle bar

- **Goal:** Add the vision's floating middle bar (node-type quick-create + campaign start) and its campaign-active variant (Undo / Reset / Exit pill).
- **Changes:**
  - New `src/components/floating/FloatingMiddleBar.jsx`. Reads `simulationStore.isCampaignActive` and switches between the two modes.
  - Default mode: three node-type buttons (Common/Choice/Ending) that call the same `addNode` action as CreationBar/context menu. Campaign dropdown (from `campaignStore`) + Start button → `simulationStore.startCampaign`.
  - Campaign-active mode: active-campaign pill with Undo (`undoLastNode`), Reset (`reset`), Exit (`exitCampaign`).
  - Retire CreationBar if now redundant (decide at phase time; if kept, document why).
- **Produces:** `src/components/floating/FloatingMiddleBar.jsx` + CSS. Possibly removes `src/components/CreationBar.jsx`.
- **Leaves inconsistent:** Node editing still goes through legacy NodeInspector (fixed Phase 6).
- **Next phase depends on:** Independent — nothing blocks on this.
- **Rollback cost:** LOW.
- **Hard stop triggers:** Floating bar intercepts canvas pointer events (must use `pointer-events` CSS carefully).
- **Acceptance:** Quick-create from the bar produces the same node shape in the store as context-menu creation.
- **Verification:** Open app → click Common button in floating bar → new Common node appears on canvas. Start a campaign from the bar → active pill appears with Undo/Reset/Exit working.

### Phase 6 — NodeConfigModal (retire docked inspector)

- **Goal:** Replace the inspector with the full-screen 2-column modal. Largest phase; consider splitting if estimates run long.
- **Changes:**
  - New `src/components/modals/NodeConfigModal.jsx` — 2-column for Common/Choice, single-column for Ending.
  - Left column: label, description, chapter/path dropdowns, Start Node toggle (wired to `narrativeStore.setStartNode`).
  - Right column (non-Ending): On-Enter Modifiers (set-flags + status-mods editors), Branching Options / Narrative Variants cards with per-variant condition builder (AND/OR, flag clauses, status clauses). Port logic from `NodeInspector.jsx` + `OptionEditor.jsx` + `EdgeInspector.jsx` condition-editor widgets.
  - Open triggers: double-click node on canvas, edit-pencil in NodesPanel, context-menu "Edit".
  - Delete `src/components/NodeInspector.jsx` (and `EdgeInspector.jsx` if its functionality is fully absorbed — otherwise keep as an edge-specific modal or dock).
- **Produces:** `src/components/modals/NodeConfigModal.jsx` + CSS. Removes `NodeInspector.jsx`. Possibly modifies `EdgeInspector.jsx`.
- **Leaves inconsistent:** Edge editing UX may need a similar modal in a later iteration — flag as **RULE CANDIDATE** for the 0309 Document step if the pattern stabilizes.
- **Next phase depends on:** Independent final phase.
- **Rollback cost:** HIGH (NodeInspector is deeply integrated; revert means restoring the deleted file and re-binding open-triggers).
- **Hard stop triggers:** Any node-edit field fails to round-trip through `narrativeStore.updateNode`.
- **Acceptance:** Every field previously editable in the dock inspector is editable in the modal, and produces the same store state.
- **Verification:** Open app → double-click a node → modal opens → change label, description, add a flag modifier, add a variant with a FLAG=TRUE condition → Save → reload → confirm all changes persist.

### Phase 7 — Campaign-mode visual polish

- **Goal:** Dimmed/grayscale sidebars during campaign mode, top blue "Campaign Active" banner, StatusStrip live counters.
- **Changes:** `src/components/layout/LeftSidebar.jsx`, `RightSidebar.jsx` (add `campaign-mode` class toggling). New `src/components/CampaignBanner.jsx`. `src/components/StatusStrip.jsx` (add node/ending/edge/dead-end counters wired to `simulationStore`).
- **Produces:** The above files + CSS.
- **Leaves inconsistent:** None.
- **Next phase depends on:** End of plan.
- **Rollback cost:** LOW.
- **Hard stop triggers:** Counters go stale (selector not subscribed correctly).
- **Acceptance:** Counters update in real-time as nodes are visited during a campaign.
- **Verification:** Start a campaign → sidebars dim → banner appears → traverse nodes → counters in status strip increment.

### Phase 8 — Cleanup & dead code

- **Goal:** Delete unreferenced legacy files, verify no dead imports, audit CSS for unused rules.
- **Changes:** Remove `Sidebar.jsx` if fully vacated, `CampaignSelector.jsx`, `RouteFinderDialog.jsx`, `CreationBar.jsx`, `NodeInspector.jsx` if absorbed. Audit `global.css` for orphan selectors.
- **Produces:** File deletions, reduced CSS.
- **Rollback cost:** LOW (git revert).
- **Acceptance:** Build succeeds, no console warnings, bundle size drops or stays flat.
- **Verification:** `npm run build` succeeds; `npm run dev` → exercise every feature from Phases 1–7 once.

---

## 4. File Map

| Path | Change | Must NOT change | Phase |
|---|---|---|---|
| `src/App.jsx` | Grid updates for 2 sidebars | Store subscriptions, IndexedDB init | 1 |
| `src/App.css` | Grid template change | — | 1 |
| `src/styles/tokens.css` | Add indigo accents, shadows, animation keyframes | Existing token names/values | 0 |
| `src/styles/utilities.css` | NEW — shared primitives | — | 0 |
| `src/styles/global.css` | Import utilities.css | Existing resets | 0 |
| `package.json` | Add lucide-react | — | 0 |
| `src/components/layout/LeftSidebar.jsx` | NEW | — | 1,2,7 |
| `src/components/layout/RightSidebar.jsx` | NEW | — | 1,3,7 |
| `src/components/layout/NameplateTab.jsx` | NEW | — | 1 |
| `src/components/panels/NodesPanel.jsx` | NEW | — | 3,6 |
| `src/components/panels/RouteTracingPanel.jsx` | NEW — port from RouteFinderDialog | `utils/routeTracer.js` algorithm | 3 |
| `src/components/panels/CampaignListPanel.jsx` | NEW — port from CampaignSelector | `campaignStore` shape | 3 |
| `src/components/floating/FloatingMiddleBar.jsx` | NEW | — | 5 |
| `src/components/modals/NodeConfigModal.jsx` | NEW — absorbs NodeInspector | `narrativeStore.updateNode` contract | 6 |
| `src/components/TopBar.jsx` | Restyle + remove campaign controls | File op handlers | 4 |
| `src/components/StatusStrip.jsx` | Add campaign counters | Existing layout | 7 |
| `src/components/FlagManager.jsx` | Presentational shell update | CRUD logic | 2 |
| `src/components/StatusManager.jsx` | Presentational shell update | CRUD logic | 2 |
| `src/components/PathChapterManager.jsx` | Presentational shell update | CRUD logic | 2 |
| `src/components/Sidebar.jsx` | Tab list pruned → possibly deleted | — | 2,3,8 |
| `src/components/NodeInspector.jsx` | DELETE after Phase 6 | — | 6,8 |
| `src/components/CampaignSelector.jsx` | DELETE after Phase 3 | — | 3,8 |
| `src/components/RouteFinderDialog.jsx` | DELETE after Phase 3 | — | 3,8 |
| `src/components/CreationBar.jsx` | DELETE if absorbed in Phase 5 | — | 5,8 |
| `src/store/*` | **UNTOUCHED** | **EVERYTHING** | — |
| `src/utils/*` | **UNTOUCHED** | **EVERYTHING** | — |
| `src/components/nodes/*`, `src/components/edges/*` | **UNTOUCHED** (graph rendering stays) | — | — |

---

## 5. Preservation Plan

**PROTECTED items** (must survive every phase):

- **All Zustand stores** — never modified. Verified by: every phase's acceptance test performs a CRUD action and reads it back.
- **IndexedDB auto-save** — the auto-save effect in `main.jsx` stays untouched. Verified by: reload after each phase and confirm state restores.
- **File export/import (ZIP)** — `utils/fileSystem.js` unchanged. Verified each phase with export→reimport round-trip.
- **React Flow canvas, node/edge components** — `src/components/nodes/*`, `src/components/edges/*`, `GraphCanvas.jsx` layout logic untouched. Clustering, snap, tidy layout continue to work.
- **Keyboard shortcuts** — `hooks/useKeyboardShortcuts.js` untouched. Shortcuts still open the relevant (possibly renamed) UI.
- **Route tracing algorithm** — `utils/routeTracer.js` untouched; only the UI shell around it moves.
- **Condition evaluation** — `utils/conditionEvaluator.js` untouched.

**ACKNOWLEDGED RISKS:**

- **Temporary docked-inspector / modal coexistence between Phase 3 and Phase 6.** Impact: users may see two ways to edit nodes briefly. Contained by: Phase 3 wires NodesPanel edit to the legacy inspector, so no edit path is broken; Phase 6 atomically swaps the open-triggers.
- **CreationBar vs FloatingMiddleBar overlap in Phase 5.** Impact: two UIs for node creation for one phase. Contained by: deciding at Phase 5 whether to retire CreationBar immediately or defer to Phase 8.

---

## 6. Risk Register

1. **CSS specificity collisions** — new utilities.css classes clash with existing global.css rules. *Signal:* visual regressions in untouched components. *Mitigation:* scope new classes with a `ui-v2-` prefix or component-specific namespace until Phase 8 cleanup.
2. **Lucide bundle growth** — careless imports balloon bundle size. *Signal:* `npm run build` size report. *Mitigation:* named imports only (`import { Play } from 'lucide-react'`), never default.
3. **React Flow resize glitches** — changing the grid to add the left sidebar may break React Flow's ResizeObserver behavior. *Signal:* blank canvas or mis-sized viewport on first render. *Mitigation:* Phase 1 explicitly verifies canvas resize before moving on.
4. **NodeConfigModal regression** — porting condition builder / variant editor from `NodeInspector` misses an edge case. *Signal:* a round-trip edit that worked pre-migration produces different store state. *Mitigation:* keep `NodeInspector.jsx` in the tree until Phase 6 acceptance passes; delete only in Phase 8.
5. **Campaign panel porting introduces race conditions** — CampaignListPanel subscribes to `campaignStore` differently than CampaignSelector did. *Signal:* activating a campaign doesn't start the simulation, or start button enables/disables incorrectly. *Mitigation:* preserve the exact selectors from CampaignSelector during the port.

---

## Verification Plan (end-to-end)

After Phase 8, perform this scenario to certify parity:

1. Fresh `npm run dev`, empty project.
2. Create 2 Common + 1 Choice + 1 Ending node from the floating bar.
3. Connect them with edges; add a condition `has_lantern == true` on one edge (created via NodeConfigModal).
4. Create a flag `has_lantern` (left sidebar, Flags panel) and a status `courage` (left sidebar, Status panel).
5. Create a chapter and a path; assign the Common node to both.
6. Create a campaign (right sidebar, Campaign List); Start it from floating bar.
7. Traverse the graph in campaign mode; confirm status strip counters update.
8. Exit campaign; run Route Tracing to the Ending node; confirm results appear.
9. Export the project to ZIP; reload; reimport; confirm every entity restored.
10. `npm run build` succeeds with no warnings.
