# Phase Overview — Push 4: Flag/Status Split + Condition Evaluator

| Phase | Name | Goal | Reference Files Needed |
|-------|------|------|------------------------|
| 1 | State & Import/Export Data Model | Migrate the store and persistence layer to `flag{}` + `status{}` with schema v3 migration | `narrativeStore.js`, `fileSystem.js`, `ran_0303_migrationstrategy.md` |
| 2 | Condition Evaluator Extension | Extend the pure evaluator to handle status range clauses and nested condition groups | `conditionEvaluator.js`, `utils/index.js`, `ran_0303_migrationstrategy.md` |
| 3 | Form Layer UI Adaptation | Update all inspector and manager components to bind to the new data shapes | `FlagManager.jsx`, `NodeInspector.jsx`, `EdgeInspector.jsx`, `Sidebar.jsx`, `StatusManager.jsx` (new) |
| 4 | Simulation Hook-up | Rewire simulationStore to consume `flags_set[]` / `status_set[]` and use the updated evaluator | `simulationStore.js`, `conditionEvaluator.js` |
