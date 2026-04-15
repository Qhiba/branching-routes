# ran_0303_phases — Phase List Overview

| Phase | Name | Goal | Reference Files Needed |
|---|---|---|---|
| 1 | Core Store Restructure | Replace the flat `nodes[]` array with typed sub-collections and remove edge `sideEffects` from both stores | `narrativeStore.js`, `simulationStore.js`, `uiStore.js`, `ran_0303_behaviordelta.md`, `ran_0303_migrationstrategy.md`, `ran_0303_preservation.md` |
| 2 | Import / Export Safety | Accept legacy (`schemaVersion: 1`) and new (`schemaVersion: 2`) files; distribute legacy flat arrays into sub-collections on load; bump exported schema version | `fileSystem.js`, `narrativeStore.js`, `ran_0303_migrationstrategy.md` |
| 3 | Canvas and Node Renderer Migration | Replace `StoryNode` with three dedicated node components; update `GraphCanvas` to derive React Flow nodes from the three sub-collections | `GraphCanvas.jsx`, `StoryNode.jsx`, `components/index.js`, `ran_0303_behaviordelta.md`, `ran_0303_filemap.md` |
| 4 | Inspector Cleanup | Remove edge side-effects UI; branch `NodeInspector` form by node type; remove `sideEffects` pass-through from `ConditionalEdge` | `NodeInspector.jsx`, `EdgeInspector.jsx`, `ConditionalEdge.jsx`, `ran_0303_behaviordelta.md`, `ran_0303_filemap.md` |
