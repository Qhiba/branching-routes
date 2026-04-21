# Feature Delta — Route_Tracing

---

## What the system does NOT have now

| Missing capability | Where the gap lives |
|--------------------|---------------------|
| Rich traversal records (edge, flag snapshot, status snapshot, sequence, source/target node per step) | `simulationStore` only stores `traversedEdgeIds: string[]` — raw IDs with no snapshot data |
| Undo Active Node Button — one-step rollback from a wrong choice | No rollback mechanism exists; wrong click requires full Reset or campaign abandonment |
| Coverage metrics strip (visited / total, endings reached / total, edges traversed / total) | No UI surface for coverage readouts; no bottom-bar region in the layout |
| Dead-end node detection (no outgoing edges, non-ending type) | Passive analysis detects orphaned and start-unreachable nodes, but not dead-ends within a campaign context |
| Unreachable-from-active-node dimming (`--coverage-gap` overlay) | Node renderers have no such overlay; AR-16 does not define a second orthogonal indicator |
| Shortest-route pathfinding respecting flag/status gates | No pathfinder exists; `conditionEvaluator.js` is available as a pure function but not used for path search |
| RouteFinderDialog — target selection, priority spec, path cap, sorted result display | Component does not exist |
| `routeTracer.js` utility — BFS, dead-end detection, Yen's k-shortest-paths on gated state-space | File does not exist |
| `StatusStrip.jsx` — bottom bar coverage readouts | Component does not exist; `App.css` has no bottom-bar region |
| Overlay toggle states in `uiStore` (`showTraversalOverlay`, `showRouteFinderDialog`, `showShortestRouteOverlay`) | Not present |

---

## What it will have after this feature

| New capability | Where it lives |
|----------------|----------------|
| `traversalRecords[]` — rich per-step records appended on every `advance()` call | `simulationStore` runtime state |
| `undoLastNode()` — pops last record, restores flag/status snapshot, rewrites active node pointer | `simulationStore` action |
| `preAdvanceFlagSnapshot` — transient field set by `selectOption()` so `advance()` can record the pre-destination-node state | `simulationStore` transient state |
| Coverage metric selectors — six primitives readable by `StatusStrip` | Derived in `StatusStrip` from per-slice selectors on `simulationStore` + `narrativeStore` |
| `unreachableFromActiveNodeIds` — set recomputed on each `advance()` via forward BFS from active node | `simulationStore` runtime state |
| `--coverage-gap` CSS orthogonal overlay on node renderers — applied when node is not forward-reachable from active node | All three node renderers; `global.css` |
| `shortestRouteResults` — computed k-path set for display | `simulationStore` runtime state |
| `isShortestRouteStale` — flag marking results invalid after Undo or narrative change | `simulationStore` runtime state |
| Overlay toggle states and `selectedRouteIndex` | `uiStore` |
| Undo Active Node Button in TopBar (campaign mode, disabled when no records) | `TopBar.jsx` |
| `StatusStrip.jsx` — bottom bar visible during campaign mode | New component mounted in `App.jsx` |
| Bottom-bar grid region (28px) | `App.css` |
| `routeTracer.js` — dead-end detection, forward-BFS, Yen's k-shortest-paths with gate evaluation | New utility |
| `RouteFinderDialog.jsx` — full UI for shortest-route analysis | New component |
| AR-16 updated to document `--coverage-gap` as second orthogonal indicator alongside `--seen` | `architecture_rules.md` (prerequisite for Phase 3) |

---

## What existing behavior is identical in both

- All six node simulation states (`active`, `locked`, `complete`, `failed`, `branch_locked`, `reachable`) and their CSS are unchanged
- The `--seen` orthogonal overlay is unchanged
- `advance()`, `selectOption()`, `reset()`, `exitCampaign()`, `enterCampaign()`, `snapshotCampaign()` signatures are unchanged (Phase 1 extends their bodies, not their interfaces)
- The campaign snapshot shape (`activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, `flagOverrides`, `statusOverrides`) is unchanged — traversal records are runtime-only per AR-08
- `schemaVersion: 4` is unchanged — no export/import format change
- Edit-mode passive analysis (`runPassiveAnalysis`, orphaned/unreachable detection) is unchanged
- All `narrativeStore` CRUD actions are unchanged
- All `campaignStore` actions and IndexedDB persistence are unchanged
- `conditionEvaluator.js` is called by `routeTracer.js` but is not modified
- React Flow canvas wiring, context menus, keyboard shortcuts, cluster overlay, command palette, and toast notifications are all unchanged
