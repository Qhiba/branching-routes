# Phase Overview — Route_Tracing

Each phase is independently stoppable and testable. A failed phase does not break any prior phase.

---

| Phase | Name | Goal | Reference files needed |
|-------|------|------|----------------------|
| 1 | Traversal Records + Undo | Build the rich data layer and Undo action without any new visual output | `ran_0201_scope.md`, `ran_0202_datamodelimpact.md`, `src/store/simulationStore.js`, `src/store/uiStore.js`, `src/components/TopBar.jsx` |
| 2 | Traversal Overlay + Coverage Metrics | Surface traversal state visually on edges and in a new bottom-bar StatusStrip | `ran_0202_phase_01.md`, `src/styles/tokens.css`, `src/styles/global.css`, `src/components/edges/ConditionalEdge.jsx`, `src/App.jsx`, `src/App.css`, `src/components/index.js` |
| 3 | Dead-end Detection + Coverage Gap Dimming | Add routeTracer utility, unreachable-from-active dimming, and dead-end counter | `ran_0202_phase_02.md`, `src/utils/routeTracer.js` (new), `src/store/simulationStore.js`, `src/components/nodes/CommonNode.jsx`, `src/components/nodes/ChoiceNode.jsx`, `src/components/nodes/EndingNode.jsx`, `src/styles/global.css`, `src/components/StatusStrip.jsx`, `src/utils/index.js` — **PREREQUISITE: `architecture_rules.md` AR-16 must be updated to document `--coverage-gap` before this phase executes** |
| 4 | Shortest-Route Pathfinding + RouteFinderDialog | Add gate-respecting k-shortest-paths solver and the full UI to drive it | `ran_0202_phase_03.md`, `src/utils/routeTracer.js`, `src/store/simulationStore.js`, `src/components/edges/ConditionalEdge.jsx`, `src/styles/tokens.css`, `src/styles/global.css`, `src/components/index.js`, `src/utils/index.js` |
