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

## 3. File Map

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

## 4. Preservation Plan

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

## 5. Risk Register

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
