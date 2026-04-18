# ran_0202_phases.md — Phase List Overview

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

| # | Name | Goal | Reference files needed |
|---|---|---|---|
| 1 | Data Layer | Extend the store with variant and option CRUD, extend referential integrity scans, and decide schema version bump — all without any UI changes | `narrativeStore.js`, `ran_0201_scope.md`, `ran_0202_datamodelimpact.md`, `ran_0202_risks.md` |
| 2 | Options UI and ChoiceNode Handles | Build `OptionEditor`, wire it into `NodeInspector` for choice nodes, and upgrade `ChoiceNode` to render per-option source handles with display mode support | `narrativeStore.js` (Phase 1 output), `uiStore.js`, `ChoiceNode.jsx`, `NodeInspector.jsx`, `ran_0202_filemap.md` |
| 3 | Variants UI, Edge Stamping, and EdgeInspector Display | Build `VariantEditor`, wire it into `NodeInspector` for common nodes, extend `GraphCanvas.onConnect` to stamp `optionId`, and update `EdgeInspector` to display the originating option | `narrativeStore.js`, `EdgeInspector.jsx`, `GraphCanvas.jsx`, `NodeInspector.jsx`, `ran_0202_filemap.md` |
