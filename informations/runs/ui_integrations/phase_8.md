### Phase 8 — Cleanup & dead code

- **Goal:** Delete unreferenced legacy files, verify no dead imports, audit CSS for unused rules.
- **Changes:** Remove `Sidebar.jsx` if fully vacated, `CampaignSelector.jsx`, `RouteFinderDialog.jsx`, `CreationBar.jsx`, `NodeInspector.jsx` if absorbed. Audit `global.css` for orphan selectors.
- **Produces:** File deletions, reduced CSS.
- **Rollback cost:** LOW (git revert).
- **Acceptance:** Build succeeds, no console warnings, bundle size drops or stays flat.
- **Verification:** `npm run build` succeeds; `npm run dev` → exercise every feature from Phases 1–7 once.