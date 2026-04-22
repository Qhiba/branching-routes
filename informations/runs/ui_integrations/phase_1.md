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