# Phase 7 Fix Report

## Fix 1 — Campaign panel edit/delete buttons not visible on hover

**Issue:** `nodes-panel__item-actions` inside `.campaign-panel__item` had `opacity: 0` permanently because the hover reveal rule targeted `.nodes-panel__item:hover`, not `.campaign-panel__item:hover`.

**Fix:** Added `.campaign-panel__item:hover .nodes-panel__item-actions { opacity: 1; }` to `RightPanels.css`.

**Delta impact:** Neither behavior delta nor preservation list. Pure CSS reveal of already-existing buttons.

---

## Fix 2 — Overlay toggle moved from StatusStrip to FloatingMiddleBar

**Issue:** "Overlay: ON/OFF" button was in `StatusStrip` campaign section. Moved to FloatingMiddleBar campaign pill, left of Undo button.

**StatusStrip.jsx changes:**
- Removed `useUIStore` import and `showTraversalOverlay`/`toggleTraversalOverlay` subscriptions.
- Removed the `<button>` element from the campaign counters block.

**FloatingMiddleBar.jsx changes:**
- Added `useUIStore` import.
- Added `showTraversalOverlay` and `toggleTraversalOverlay` selectors.
- Added overlay toggle button to campaign mode JSX, left of Undo (with a divider between campaign name and Undo).

**Delta impact:** Within behavior delta — StatusStrip counters still display; toggle control relocated, not removed.

---

## Fix 3 — Save/Load/Autosave moved from SandboxPanel to FloatingMiddleBar

**Issue:** Autosave toggle, "Save Progression", and "Load Last Save" were in `SandboxPanel`'s "Campaign Save" section. Moved to FloatingMiddleBar campaign pill, right of Reset button.

**SandboxPanel.jsx changes:**
- Removed `snapshotCampaign`, `enterCampaign`, `autosaveCampaign`, `setAutosaveCampaign` subscriptions from `simulationStore`.
- Removed `activeCampaignId`, `campaigns`, `setActiveCampaign` subscriptions from `useCampaignStore`.
- Removed `saveFlash` local state.
- Removed `handleSave` and `handleLoadSave` handlers.
- Removed the entire "Campaign Save" section JSX (autosave label, warning text, save button, load button).
- Removed `useState` import (no longer needed).
- Removed `useCampaignStore` import (no longer needed).

**FloatingMiddleBar.jsx changes:**
- Added `Save`, `Upload` lucide imports.
- Added `snapshotCampaign`, `autosaveCampaign`, `setAutosaveCampaign` selectors from `simulationStore`.
- Added `saveFlash` local state and `handleSave`/`handleLoadSave` handlers.
- Added `activeCampaign` and `hasSavedSnapshot` derived values (from already-subscribed `campaignsMap` and `activeCampaignId`).
- Added Save, Load, Auto label controls to campaign pill JSX, right of Reset with a divider.

**FloatingMiddleBar.css changes:**
- Added `.ui-v2-floating-autosave` and `.ui-v2-floating-autosave__checkbox` styles for the inline autosave label.

**Delta impact:** Within behavior delta — save/load/autosave functionality is preserved; only the mount point changes. No store action signatures changed.

---

## Fix 4 — CampaignBanner removed

**Issue:** The CampaignBanner was Phase 7's new blue banner. User determined it is redundant — FloatingMiddleBar's blinking green pulse already communicates campaign-active state.

**App.jsx changes:**
- Removed `CampaignBanner` from the named import.
- Removed `<CampaignBanner />` from `<main className="app__canvas">`.

**index.js changes:**
- Removed `CampaignBanner` barrel export.

`CampaignBanner.jsx` and `CampaignBanner.css` remain on disk for Phase 8 cleanup.

**Delta impact:** Within behavior delta — campaign-active visual state is still communicated by FloatingMiddleBar. No store changes.

---

---

## Fix 5 — Campaign list Enter/Edit/Delete button redesign

**Issue:** The "ENTER" button used `campaign-panel__start-btn` (green filled badge with uppercase text) — inconsistent with the rest of the panel design language. Edit/Delete used `nodes-panel__item-actions` as a borrowed class, which required a workaround hover rule from Fix 1. All three controls did not match the icon-button pattern used elsewhere.

**CampaignListPanel.jsx changes:**
- Replaced `nodes-panel__item-actions` container with dedicated `campaign-panel__item-actions`.
- Replaced `<button className="campaign-panel__start-btn">ENTER</button>` with a 24×24 Play icon button (`campaign-panel__action-btn campaign-panel__action-btn--enter`).
- Edit and Delete buttons updated to use `campaign-panel__action-btn` and `campaign-panel__action-btn--danger` respectively — icon-only, no text labels, consistent size.
- Removed unused `Settings` import.

**RightPanels.css changes:**
- Removed `campaign-panel__start-btn` rule (the green ENTER badge).
- Removed the Fix 1 workaround rule (`.campaign-panel__item:hover .nodes-panel__item-actions`).
- Added `campaign-panel__item-actions` — own container, `opacity: 0` → `1` on `.campaign-panel__item:hover`.
- Added `campaign-panel__action-btn` — 24×24, transparent background, muted color default, `--color-bg-hover` fill on hover.
- Added `campaign-panel__action-btn--enter` — indigo accent color (`--color-accent`), indigo tint background on hover.
- Added `campaign-panel__action-btn--danger` — danger red tint on hover.
- Added truncation (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`) to `.campaign-panel__item-name` to prevent long names from pushing action buttons off-screen.
- Added `min-width: 0` to `.campaign-panel__item-left` to enable truncation within flex.

**Delta impact:** Purely presentational — no store calls changed, no logic changed. Enter still calls `handleEnter(camp)`, Edit still calls `setEditItem(camp)`, Delete still calls `deleteCampaign(camp.id)`.

---

## Fix 6 — RouteTracingPanel target node card redesign

**Issue:** The target node section showed only a plain text label. It needed to show node label, node type (Common/Choice/Ending), and a one-line description to give the user meaningful context about the selected target.

**RouteTracingPanel.jsx changes:**
- Added `nodeType` annotation to `allNodeMap` memo entries (`'Common'`, `'Choice'`, or `'Ending'`).
- Added `targetNodeContext` memo deriving `chapterName` and `pathName` from `chapter` and `path` store slices.
- Added `getTypeLabel(node)` helper and `typeColorClass` map for badge variant CSS classes.
- Target node section replaced with multi-part card:
  - Top row: node label + type badge (`trace-panel__type-badge` with `--common`/`--choice`/`--ending` variants).
  - Second row: `node.data.content` as a truncated one-line description (`trace-panel__target-desc`).
  - Third row: chapter/path context string if available (`trace-panel__target-context`).
- Empty state text changed to "Click a node on the canvas to set target" (`trace-panel__target-empty`).

**RightPanels.css changes:**
- Replaced single `.trace-panel__target` rule with a card block: `.trace-panel__target` (flex column, bg, border-radius, padding), `.trace-panel__target-top` (row with gap), `.trace-panel__target-name` (semibold, truncate), `.trace-panel__type-badge` (base pill), `--common` (teal), `--choice` (indigo), `--ending` (rose), `.trace-panel__target-desc` (truncated one-liner, muted color), `.trace-panel__target-context` (smaller muted pills row), `.trace-panel__target-empty` (centered placeholder text).

**Delta impact:** Purely presentational — no store actions changed, target selection logic unchanged.

---

## Fix 7 — Tie-Breaking Priorities split into Flags and Status groups

**Issue:** Flags and status priorities were rendered in a single flat list with a shared "Add Priority" dropdown that mixed both types. This was inconsistent with how the NodeConfigModal separates them.

**RouteTracingPanel.jsx changes:**
- Split `priorities` filtering: `flagPriorities` and `statusPriorities` from the existing `priorities` array.
- Split available options: `availableFlagIds` (flags not yet added) and `availableStatusIds` (statuses not yet added).
- Split add handlers: `handleAddFlag(id)` adds `{ type: 'flag', preferredValue: true }` and `handleAddStatus(id)` adds `{ type: 'status', preferredValue: 0 }`.
- Priorities section now renders two `trace-panel__priorities-group` containers:
  - **Flags group**: purple group label, flag priority rows with True/False select, "FLAG" badge, own add-flag dropdown.
  - **Status group**: rose group label, status priority rows with number input, "STAT" badge, own add-status dropdown.
  - Each group shows an empty message if no flags/statuses are defined in the store.

**RightPanels.css changes:**
- Added `.trace-panel__priorities-group` (flex column, gap, margin-bottom).
- Added `.trace-panel__priorities-group-label` (uppercase label base), `--flag` (purple/indigo tint), `--status` (rose tint).
- Added `.trace-panel__priority-name` (flex-1, truncation).
- Added `.trace-panel__select--small` (compact select width for the True/False toggle).
- Added `.trace-panel__add-select` (full-width dotted-border select for add dropdowns).
- Added `.trace-panel__priorities-empty` (muted italic empty state text).

**Delta impact:** Within behavior delta — `priorities` array structure unchanged, `computeRoutesFromStart` call unchanged. Only the UI grouping changed.

---

## Fix 8 — Route tracing results view reordered and store-driven

**Issue:** The results view used local `routeResults` state (`{ completed: true }`) as a display toggle and derived route data from a separate local copy. Layout order was incorrect — stop button appeared before the status indicator. Routes were not clickable.

**RouteTracingPanel.jsx changes:**
- Removed local `routeResults` state entirely.
- Added `shortestRouteResults` selector from `simulationStore` (array of `{ pathEdgeIds, length, priorityRank }` or `null`).
- Added `clearRouteResults` selector from `simulationStore`.
- Added `edges` subscription from `narrativeStore`.
- Added `edgesMap` memo — O(1) lookup by edge ID, built from `edges` array.
- Updated `allNodeMap` to annotate each node with `nodeType`.
- Added `deriveNodeLabels(pathEdgeIds)` — reconstructs ordered node label sequence by chaining `sourceId` of first edge + `targetId` of each edge through `edgesMap` and `allNodeMap`.
- Added `handleRouteClick(route)` — dispatches `canvas-navigate-to-node` DOM event (AR-19) with the route's final target node ID.
- `handleRunTrace` now calls `computeRoutesFromStart` directly; removed local `setRouteResults` call.
- `handleStopTracing` calls `clearRouteResults()` (sets store to `null`) and toggles overlay off.
- Results view rendered when `shortestRouteResults !== null` (store-driven, not local state).
- Results layout top-to-bottom: status dot + "Trace Active on Canvas" text → Stop Trace button → "Paths Found (N)" header → scrollable route list.
- Each route item is clickable, shows "Route N" + step count on top row, and a node sequence preview (`A → B → C` or `A → … → Z` if >3 nodes) on bottom row.

**RightPanels.css changes:**
- Removed old `.trace-results` block (stop button first, then status text).
- Added new `.trace-results` (flex column, gap, padding).
- Added `.trace-results__status` (row with pulsing dot + "Trace Active" text).
- Added `.trace-results__status-dot` (8px circle, emerald, animated with `@keyframes trace-pulse`).
- Reordered `.trace-results__stop-btn` to appear after status indicator.
- Added `.trace-results__header` (row with check icon + "Paths Found" count).
- Added `.trace-results__list` (flex column, overflow-y auto, max-height constrained).
- Added `.trace-results__item` (card, cursor pointer, hover background transition).
- Added `.trace-results__item-top` (space-between row: route name + step count).
- Added `.trace-results__item-name`, `.trace-results__item-steps` (muted small text).
- Added `.trace-results__item-path` (monospace truncated node sequence preview).
- Added `.trace-results__empty` (centered muted empty state text).

**Delta impact:** `computeRoutesFromStart` call signature unchanged. `shortestRouteResults` was already in the store — this fix reads it directly instead of duplicating into local state. `clearRouteResults` was already a store action.

---

## Fix 9 — Clicking a route in the results panel does not update the canvas highlight

**Issue:** `handleRouteClick` dispatched a `canvas-navigate-to-node` DOM event but never called `setSelectedRouteIndex`. `ConditionalEdge.jsx` reads `selectedRouteIndex` from `uiStore` to decide which route's edges to highlight, so the canvas overlay never changed regardless of which route was clicked.

**RouteTracingPanel.jsx changes:**
- Added `selectedRouteIndex` and `setSelectedRouteIndex` selectors from `useUIStore`.
- `handleRouteClick` now accepts `(route, index)` and calls `setSelectedRouteIndex(index)` before the DOM navigation event.
- `handleRunTrace` now calls `setSelectedRouteIndex(0)` before `computeRoutesFromStart` so the first result is always highlighted when a new trace runs.
- Route list items pass their index to `handleRouteClick(route, i)`.
- Active route item gets `trace-results__item--active` class when `i === selectedRouteIndex`.

**RightPanels.css changes:**
- Added `.trace-results__item--active` — indigo border (`var(--color-accent)`) and a low-opacity indigo background tint.
- Added `.trace-results__item--active:hover` — same border, slightly stronger tint on hover.

**Delta impact:** `selectedRouteIndex` and `setSelectedRouteIndex` already existed in `uiStore` (`toggleShortestRouteOverlay` already reset it to 0 on toggle-off). No store changes. Canvas edge rendering logic in `ConditionalEdge.jsx` untouched.

---

## Files Modified

- `F:/Projects/Web/branching-routes/src/components/panels/RightPanels.css`
- `F:/Projects/Web/branching-routes/src/components/panels/RouteTracingPanel.jsx`
- `F:/Projects/Web/branching-routes/src/components/panels/CampaignListPanel.jsx`
- `F:/Projects/Web/branching-routes/src/components/StatusStrip.jsx`
- `F:/Projects/Web/branching-routes/src/components/SandboxPanel.jsx`
- `F:/Projects/Web/branching-routes/src/components/floating/FloatingMiddleBar.jsx`
- `F:/Projects/Web/branching-routes/src/components/floating/FloatingMiddleBar.css`
- `F:/Projects/Web/branching-routes/src/App.jsx`
- `F:/Projects/Web/branching-routes/src/components/index.js`
