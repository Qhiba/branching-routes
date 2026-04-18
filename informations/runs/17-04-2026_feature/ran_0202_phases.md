# Phase List Overview — Path_Chapter_Entities

---

| Phase | Name | Goal | Reference Files Needed |
|-------|------|------|------------------------|
| 1 | Data Layer | Add `path{}` and `chapter{}` to the store and make the JSON round-trip survive | `ran_0201_scope.md`, `ran_0202_featuredelta.md`, `ran_0202_datamodelimpact.md`, `ran_0202_filemap.md`, `src/store/narrativeStore.js`, `src/utils/fileSystem.js` |
| 2 | Management UI | Surface path and chapter CRUD in a new Sidebar tab via `PathChapterManager.jsx` | `ran_0202_phase_01.md`, `src/components/Sidebar.jsx`, `src/components/index.js` |
| 3 | Node Assignment | Let designers assign a path and chapter to any node via `NodeInspector` dropdowns | `ran_0202_phase_01.md`, `ran_0202_phase_02.md`, `src/components/NodeInspector.jsx` |
