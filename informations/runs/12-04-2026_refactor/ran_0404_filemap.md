# File Map — Branching Routes Refactor

---

## Legend

- **CHANGES** — file is structurally modified or renamed
- **NEW** — file does not exist yet; created by this refactor
- **MONITOR** — file requires import/reference updates but no structural change
- **PROTECTED** — file must not be touched by this refactor

---

## CHANGES

### `src/store/graphStore.js` → renamed to `src/store/narrativeStore.js`

| Field | Detail |
|---|---|
| **What structurally changes** | File renamed. Exported hook renamed from `useGraphStore` to `useNarrativeStore`. `selectedNodeId`, `selectedEdgeId`, `snapToGrid` state fields removed. `selectNode`, `selectEdge`, `clearSelection`, `toggleSnapToGrid` actions removed. `deleteNode`, `deleteEdge`, `loadGraph`, `newGraph` updated to call `useUIStore.getState()` for cross-store selection clearing (per migration strategy §S25). All `generateId()` calls updated to pass entity prefix: `generateId('n')`, `generateId('e')`, `generateId('f')`. |
| **What must not change** | All remaining public action names (`addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `updateMeta`, `loadGraph`, `newGraph`, `exportGraph`). The `exportGraph()` return shape: `{ schemaVersion, meta, nodes, edges, flags }`. The `deleteFlag` referential traversal logic (LBA-04). The flag name validation regex (BI-09). The `addEdge` ending-node and duplicate-edge guards (BI-06, BI-07). |
| **Which phase touches it** | Phase 2 (remove UI state + cross-store wiring), Phase 3 (prefix calls), Phase 4 (rename) |
| **New files created** | N/A (this file is renamed, not duplicated) |
| **Files deleted or merged** | `graphStore.js` ceases to exist after Phase 4 |

---

### `src/store/index.js`

| Field | Detail |
|---|---|
| **What structurally changes** | Re-export of `useGraphStore` replaced with `useNarrativeStore`. New re-export of `useUIStore` added. |
| **What must not change** | Re-export of `useSimulationStore`. Barrel pattern (no deep re-exports). |
| **Which phase touches it** | Phase 2 (add `useUIStore` export), Phase 4 (swap `useGraphStore` → `useNarrativeStore`) |

---

### `src/utils/uuid.js`

| Field | Detail |
|---|---|
| **What structurally changes** | `generateId` signature changes from `() => string` to `(prefix: string) => string`. Output format changes from `"uuid"` to `"prefix-uuid"`. |
| **What must not change** | Still delegates to `crypto.randomUUID()`. Still exported as `generateId`. |
| **Which phase touches it** | Phase 3 |

---

### `src/styles/tokens.css`

| Field | Detail |
|---|---|
| **What structurally changes** | Color values refined to a more opinionated dark-mode palette. A comment header explicitly declaring dark-mode-only intent is added. |
| **What must not change** | All CSS variable names (DC-07). All spacing, typography, border, shadow, and transition token names. The `:root` selector scope. |
| **Which phase touches it** | Phase 1 |

---

### `src/styles/global.css`

| Field | Detail |
|---|---|
| **What structurally changes** | Any hard-coded color values not using tokens are replaced with token references. Light-mode resets (if any) are removed. |
| **What must not change** | All class names. The `@import './tokens.css'` directive. Simulation mode override classes. All CSS variable references (they reference by name, which doesn't change). |
| **Which phase touches it** | Phase 1 |

---

## NEW

### `src/store/uiStore.js`

| Field | Detail |
|---|---|
| **What it creates** | New Zustand store. Exported hook: `useUIStore`. State: `{ selectedNodeId: null, selectedEdgeId: null, snapToGrid: true }`. Actions: `selectNode(id)`, `selectEdge(id)`, `clearSelection()`, `toggleSnapToGrid()`, `clearIfSelected(id, type)`, `resetSelection()`. |
| **What must not change** | Must not import from `narrativeStore` or `simulationStore` (AR-06). |
| **Which phase touches it** | Phase 2 (created) |

---

## MONITOR

### `src/store/simulationStore.js`

| Field | Detail |
|---|---|
| **What changes** | Import updated: `import { useGraphStore } from 'store'` → `import { useNarrativeStore } from 'store'`. All `useGraphStore.getState()` calls updated to `useNarrativeStore.getState()`. |
| **What must not change** | All state fields, all method signatures, all simulation logic. Cross-store `getState()` pattern must remain synchronous (LBA-01). Must never call `set()` on narrativeStore (AR-08, BI-13). |
| **Which phase touches it** | Phase 4 |

---

### `src/components/GraphCanvas.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. Selection state reads (`selectedNodeId`, `selectedEdgeId`, `snapToGrid`) moved to `useUIStore`. Selection actions (`selectNode`, `selectEdge`, `clearSelection`, `toggleSnapToGrid`) moved to `useUIStore`. |
| **What must not change** | onConnect, onNodeDragStop, node/edge rendering logic. |
| **Which phase touches it** | Phase 2 (UI state reads), Phase 4 (store rename) |

---

### `src/components/TopBar.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. `snapToGrid` and `toggleSnapToGrid` moved to `useUIStore`. |
| **What must not change** | File action handlers (export/import), simulation controls, layout triggering. |
| **Which phase touches it** | Phase 2 (snapToGrid), Phase 4 (store rename) |

---

### `src/components/Sidebar.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. `selectedNodeId`, `selectedEdgeId` reads moved to `useUIStore`. |
| **What must not change** | Tab switching logic, rendering logic for inspector vs flag manager panels. |
| **Which phase touches it** | Phase 2 (selection reads), Phase 4 (store rename) |

---

### `src/components/NodeInspector.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. `selectedNodeId` read moved to `useUIStore`. |
| **What must not change** | Node update dispatch calls, form field bindings. |
| **Which phase touches it** | Phase 2 (selection read), Phase 4 (store rename) |

---

### `src/components/EdgeInspector.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. `selectedEdgeId` read moved to `useUIStore`. |
| **What must not change** | Edge update dispatch calls, condition/side-effect form bindings. |
| **Which phase touches it** | Phase 2 (selection read), Phase 4 (store rename) |

---

### `src/components/FlagManager.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore`. |
| **What must not change** | Flag CRUD calls, name validation UI. |
| **Which phase touches it** | Phase 4 (store rename) |

---

### `src/components/nodes/StoryNode.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore` if it reads selection directly. |
| **What must not change** | Node rendering, simulation state class application, handle visibility for ending nodes. |
| **Which phase touches it** | Phase 4 (store rename) |

---

### `src/components/edges/ConditionalEdge.jsx`

| Field | Detail |
|---|---|
| **What changes** | Import update: `useGraphStore` → `useNarrativeStore` if it reads selection directly. |
| **What must not change** | Edge rendering, condition badge rendering, simulation state class application. |
| **Which phase touches it** | Phase 4 (store rename) |

---

### `src/utils/fileSystem.js`

| Field | Detail |
|---|---|
| **What changes** | No code changes required. The export shape it receives and the `schemaVersion` check are unchanged. |
| **What must not change** | `schemaVersion !== 1` rejection (BI-14). Export/import API surface. |
| **Which phase touches it** | None (protected in practice; listed for confirmation) |

---

## PROTECTED

| File | Reason |
|---|---|
| `src/utils/conditionEvaluator.js` | Pure utility, no store dependency, no change required |
| `src/App.jsx` | Root layout only; no store imports expected |
| `src/main.jsx` | Bootstrap only |
| `index.html` | No relevance |
| `vite.config.js` | Path aliases unchanged |
| `src/components/index.js` | Barrel re-exports components only; no store refs |
