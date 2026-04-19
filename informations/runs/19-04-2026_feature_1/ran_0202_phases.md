# Campaign_Sheets — Phase Overview

---

| Phase | Name | Goal | Reference files needed |
|-------|------|------|------------------------|
| 1 | Data Layer | Establish `campaignStore`, IndexedDB persistence, and barrel re-exports so campaign data can be created, saved, and restored before any UI exists. | `ran_0201_scope.md`, `ran_0202_datamodelimpact.md`, `ran_0202_filemap.md`, `src/utils/fileSystem.js`, `src/store/index.js`, `src/utils/index.js`, `src/main.jsx` |
| 2 | Simulation Integration | Wire `campaignStore` into the simulation lifecycle so campaigns are hydrated on enter and snapshotted on exit. | `ran_0202_phase_01.md`, `src/store/simulationStore.js`, `src/store/campaignStore.js`, `src/utils/conditionEvaluator.js` (read-only) |
| 3 | UI | Create `CampaignSelector` and update `TopBar` so users can create, switch, delete, and reset campaigns from the interface. | `ran_0202_phase_02.md`, `src/components/TopBar.jsx`, `src/components/index.js` |
| 4 | File I/O | Upgrade `exportProject` and `importProject` to handle `.zip` bundles containing campaign files alongside the narrative data model. | `ran_0202_phase_03.md`, `src/utils/fileSystem.js` |
