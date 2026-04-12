# Phase Overview — Branching Routes Refactor

---

| Phase | Name | Goal | Reference Files Needed |
|---|---|---|---|
| 1 | Aesthetics | Lock in the dark-mode-only theme by refining token values and removing any implicit light-mode assumptions from global styles. | `ran_0404_structuraldelta.md §2 Theme Layer`, `ran_0402_first-audit.md §2 DC-07`, `ran_0402_first-audit.md §5 HS-09`, `src/styles/tokens.css`, `src/styles/global.css` |
| 2 | UI State Extraction | Create `uiStore`, migrate selection and grid state out of `graphStore`, wire cross-store selection-clearing to preserve BI-04, BI-05, BI-16. | `ran_0404_migrationstrategy.md §S25`, `ran_0402_first-audit.md §3 LBA-05`, `ran_0402_first-audit.md §5 HS-08`, `src/store/graphStore.js`, `src/components/GraphCanvas.jsx`, `src/components/TopBar.jsx`, `src/components/Sidebar.jsx`, `src/components/NodeInspector.jsx`, `src/components/EdgeInspector.jsx` |
| 3 | ID System Migration | Update `uuid.js` to emit prefixed IDs; verify legacy file loading remains intact (Parallel Support strategy). | `ran_0404_migrationstrategy.md §S03`, `ran_0402_first-audit.md §3 LBA-02`, `ran_0402_first-audit.md §5 HS-04`, `src/utils/uuid.js`, `src/store/graphStore.js`, `informations/docs/example_datamodel.json` |
| 4 | Store Consolidation | Rename `graphStore.js` → `narrativeStore.js`, rename exported hook, sweep all import references, update `simulationStore` cross-store read. | `ran_0404_filemap.md`, `ran_0402_first-audit.md §3 LBA-01`, `ran_0402_first-audit.md §5 HS-08`, `src/store/graphStore.js`, `src/store/simulationStore.js`, `src/store/index.js`, all component files |
