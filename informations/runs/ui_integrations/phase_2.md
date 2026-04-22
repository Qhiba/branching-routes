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