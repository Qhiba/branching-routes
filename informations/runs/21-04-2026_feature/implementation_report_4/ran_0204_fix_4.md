# Phase 4 Fix Report — RouteFinderDialog Data Flow + Auto-Close

**Date:** 2026-04-21  
**Status:** Fixed  

---

## Summary

Three interconnected bugs in the Phase 4 implementation prevented the Route Finder from working end-to-end. Results computed in the dialog were never surfaced to the canvas overlay, and the dialog did not close after Run.

---

## Bugs Found

### BUG-01 — Wrong result store (silent data loss)

**File:** `src/components/RouteFinderDialog.jsx`  
**Symptom:** Running the Route Finder produced no visible highlighting on the canvas. The route overlay toggle activated, but all edges stayed unlit.  
**Root cause:** `handleRun` stored computed paths into local component state (`useState`). However, `ConditionalEdge` reads `shortestRouteResults` from `simulationStore`. The two stores are completely separate; local state is invisible to the edge renderer. Results were computed correctly but immediately discarded from any shared state.

### BUG-02 — Dialog did not auto-close on Run

**File:** `src/components/RouteFinderDialog.jsx`  
**Symptom:** After clicking Run, the dialog stayed open. The intended loop (click node → open dialog → set priorities → Run → dialog closes) was broken at the last step.  
**Root cause:** `handleRun` never called `toggleRouteFinderDialog()`. The computation ran, local state was set, and the overlay was toggled — but the dialog was never dismissed.

### BUG-03 — No edit-mode setter in simulationStore

**File:** `src/store/simulationStore.js`  
**Symptom:** The only existing route write path (`computeRoutes`) guards on `isCampaignActive` and returns early when no campaign is running. Route Finder is an edit-mode authoring tool — it runs before any campaign is started.  
**Root cause:** `computeRoutes` was designed for in-campaign pathfinding from the active node. No campaign-agnostic setter existed. Calling it from the dialog during edit mode was always a no-op.

---

## Fixes Applied

### simulationStore.js — Added `setShortestRouteResults`

Added a new action with no campaign guard:

```js
setShortestRouteResults: (paths) => set({
  shortestRouteResults: paths,
  shortestRouteTargetNodeId: null,
  isShortestRouteStale: false
}),
```

Placed between `computeRoutes` and `clearRouteResults` for logical grouping. Does not require `isCampaignActive`. All downstream consumers (`ConditionalEdge`, overlay toggle) are unaffected — they read the same `shortestRouteResults` field regardless of how it was written.

### RouteFinderDialog.jsx — Rewired handleRun + auto-close

- Replaced `useSimulationStore` to pull `setShortestRouteResults` instead of relying on local state.
- Removed `useState` for `shortestRouteResults` (was the shadow copy that went nowhere).
- Removed unused `selectedRouteIndex` / `setSelectedRouteIndex` imports (only needed for the dead inline results panel).
- Extracted `handleClose` helper (consolidates the `toggleRouteFinderDialog` + local state reset that was duplicated across three close paths).
- `handleRun` now: compute → `setShortestRouteResults(result.paths)` → activate overlay if off → `handleClose()`.
- Removed the inline results/path-picker panel. The dialog closes immediately after Run; the panel was unreachable dead UI.

---

## Files Modified

| File | Change |
|------|--------|
| `src/store/simulationStore.js` | Added `setShortestRouteResults(paths)` action (no campaign guard) |
| `src/components/RouteFinderDialog.jsx` | Fixed data flow to simulationStore, added auto-close on Run, removed dead results panel, extracted `handleClose` helper |

---

## Flow After Fix

```
Click node (selects selectedNodeId in uiStore)
  → Open Route Finder (TopBar button → toggleRouteFinderDialog)
  → Set tie-breaking priorities (optional)
  → Click Run
      → computeShortestPaths(startNode, selectedNodeId, ...)
      → setShortestRouteResults(result.paths)      ← lands in simulationStore
      → toggleShortestRouteOverlay() if not active  ← ConditionalEdge now reads valid data
      → handleClose()                               ← dialog dismissed
  → Canvas shows highlighted route edges
```

---

## Unchanged

- `ConditionalEdge.jsx` — no changes required; already reads correctly from `simulationStore.shortestRouteResults`.
- `uiStore.js` — `selectedRouteIndex` and overlay toggle unchanged; path 0 shows by default.
- All Phase 4 CSS — no changes.
- `computeRoutes` in simulationStore — retained as-is for the future in-campaign path (starts from `activeNodeId`).

---

## Rollback

Remove `setShortestRouteResults` from `simulationStore.js`. Revert `RouteFinderDialog.jsx` to the Phase 4 initial version (note: reverting restores all three bugs — BUG-01, BUG-02, BUG-03 will recur).

**Rollback cost: LOW.** Two files, additive changes only.
