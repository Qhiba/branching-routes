# Structural Delta — Branching Routes Refactor

---

## 1. Before (Current Structure)

### Store Layer — `src/store/`

| File | Exported Hook | State Contents |
|---|---|---|
| `graphStore.js` | `useGraphStore` | `meta`, `nodes`, `edges`, `flags`, `selectedNodeId`, `selectedEdgeId`, `snapToGrid` |
| `simulationStore.js` | `useSimulationStore` | `isRunning`, `activeNodeId`, `visitedNodeIds`, `traversedEdgeIds`, `currentFlagValues`, `reachableEdgeIds`, `reachableNodeIds` |
| `index.js` | barrel | re-exports `useGraphStore`, `useSimulationStore` |

### ID System — `src/utils/uuid.js`

```js
export const generateId = () => crypto.randomUUID();
// Output: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
```

No entity-type prefix. All node, edge, and flag IDs are bare UUID v4 strings.

### Theme Layer — `src/styles/tokens.css`

- All variables defined under `:root`
- No `@media (prefers-color-scheme: dark)` or light-mode counterparts
- De-facto dark-mode-only but no explicit enforcement
- 60 variables covering: backgrounds, text, accent, canvas, spacing, typography, borders, shadows, transitions

### UI State Location

`selectedNodeId`, `selectedEdgeId`, `snapToGrid` live inside `graphStore`.  
`deleteNode` and `deleteEdge` clear selection in the **same `set()` call** as the deletion — atomically.

---

## 2. After (Target Structure)

### Store Layer — `src/store/`

| File | Exported Hook | State Contents |
|---|---|---|
| `narrativeStore.js` | `useNarrativeStore` | `meta`, `nodes`, `edges`, `flags` only |
| `uiStore.js` | `useUIStore` | `selectedNodeId`, `selectedEdgeId`, `snapToGrid` |
| `simulationStore.js` | `useSimulationStore` | unchanged |
| `index.js` | barrel | re-exports `useNarrativeStore`, `useUIStore`, `useSimulationStore` |

### ID System — `src/utils/uuid.js`

```js
export const generateId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
// Nodes:  "n-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
// Edges:  "e-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
// Flags:  "f-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
```

All call sites in `narrativeStore.js` pass an explicit prefix argument.  
`loadGraph` accepts both old unprefixed IDs and new prefixed IDs without transforming them.

### Theme Layer — `src/styles/tokens.css`

- All variable **names** remain unchanged (DC-07 preserved)
- Values updated to a refined dark palette
- Explicit dark-mode comment block or `@media (prefers-color-scheme: dark)` wrapper added if needed to document intent
- No light-mode variant (dark-mode-only by design)

### UI State Location

`selectedNodeId`, `selectedEdgeId`, `snapToGrid` live in `uiStore`.  
`deleteNode` in `narrativeStore` calls `useUIStore.getState().clearSelection(id, 'node')` after its own `set()`.  
`deleteEdge` in `narrativeStore` calls `useUIStore.getState().clearSelection(id, 'edge')` after its own `set()`.  
`loadGraph` in `narrativeStore` calls `useUIStore.getState().resetSelection()` after loading.

---

## 3. What Is Identical in Both

| Area | Unchanged |
|---|---|
| `simulationStore.js` state shape and all method signatures | Identical |
| Export JSON top-level shape: `{ schemaVersion, meta, nodes, edges, flags }` | Identical |
| Node shape: `{ id, type, position, data: { label, content, isStartNode, sideEffects } }` | Identical |
| Edge shape: `{ id, sourceId, targetId, label, condition, sideEffects }` | Identical |
| Flag shape: `{ id, name, type, defaultValue }` | Identical |
| All `narrativeStore` (ex-`graphStore`) public action names | Identical |
| `conditionEvaluator.js` — untouched | Identical |
| `fileSystem.js` — API surface and `schemaVersion` check | Identical |
| All component behavior and prop contracts | Identical |
| CSS variable names in `tokens.css` | Identical |
| `vite.config.js` path aliases | Identical |
