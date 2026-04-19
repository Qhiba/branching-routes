# Phase Overview: Import / Export Layer

| Phase | Name | Goal | Reference Files Needed |
|---|---|---|---|
| 1 | IndexedDB Layer | Add auto-save and boot-restore via IndexedDB without changing any visible behavior | `fileSystem.js`, `narrativeStore.js`, `src/main.jsx`, `store/index.js` |
| 2 | Export / Import Update | Update explicit export schema and harden import with validation and defaults | `fileSystem.js`, `narrativeStore.js`, `utils/index.js`, `ran_0301_understand.md`, `ran_0302_scope.md` |
| 3 | TopBar Wiring | Reconnect TopBar handlers to new function signatures and verify all teardown paths | `TopBar.jsx`, `fileSystem.js`, `narrativeStore.js`, `simulationStore.js`, `uiStore.js` |
