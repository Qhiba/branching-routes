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