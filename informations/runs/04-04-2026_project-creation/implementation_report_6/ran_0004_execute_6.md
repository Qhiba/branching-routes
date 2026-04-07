# Phase 6 — Graph Canvas Foundation — Execution Report

> **Prompt:** `0004_execute.md`
> **Phase:** 6
> **Date:** 2026-04-06

---

## Summary

Phase 6 implements the full-viewport React Flow canvas — the visual core of Branching Routes V2. The graph canvas renders data-driven nodes and edges from the narrative Zustand store, supports pan/zoom/select/connect interactions, and persists node positions back to the store.

---

## Files Produced

| # | File | Path | Action |
|---|------|------|--------|
| 1 | `useGraphSync.js` | `src/hooks/useGraphSync.js` | **Created** |
| 2 | `useGraphCallbacks.js` | `src/hooks/useGraphCallbacks.js` | **Created** |
| 3 | `GraphCanvas.css` | `src/components/graph/GraphCanvas.css` | **Created** |
| 4 | `GraphCanvas.jsx` | `src/components/graph/GraphCanvas.jsx` | **Created** |
| 5 | `App.jsx` | `src/App.jsx` | **Modified** |

---

## File Details

### 1. `src/hooks/useGraphSync.js`

**Purpose:** Transforms narrative store data into React Flow `nodes[]` and `edges[]`.

**Key exports:** `useGraphSync() → { nodes, edges }`

**Implementation details:**
- Subscribes to `useNarrativeStore` selectors for `common`, `choice`, and `ending` collections
- Maps each entity to a React Flow node with:
  - `type`: `'commonNode'` | `'choiceNode'` | `'endingNode'`
  - `position`: from entity `_position` field (AR-10)
  - `data.entity`: the full entity object for renderers
  - `data.entityType`: the collection key
- Derives edges from:
  - Common Node `next[]` entries → `edge-{sourceId}-{nextEntryId}`
  - Choice `options[].next[]` entries → `edge-{sourceId}-{optionId}-{nextEntryId}`
- Each edge carries `data.requires` for future conditional edge rendering (Phase 7)
- Uses `useMemo` for both nodes and edges to avoid unnecessary recomputation

### 2. `src/hooks/useGraphCallbacks.js`

**Purpose:** React Flow event callbacks wired to narrative and UI stores.

**Key exports:** `useGraphCallbacks(setNodes, setEdges) → { onNodesChange, onEdgesChange, onConnect, onNodeDragStop }`

**Implementation details:**
- `onNodesChange`: Applies React Flow node changes (position, selection, removal). Routes selection changes to `useUIStore.selectNode()`.
- `onEdgesChange`: Applies edge changes. On edge removal, parses the edge ID to find the source entity and calls `removeNextEntry()`.
- `onConnect`: When user drags a connection from source to target, creates a `next` entry in the source Common Node via `addNextEntry()`.
- `onNodeDragStop`: On drag end, persists the final `{ x, y }` position (rounded) to the entity's `_position` field via the appropriate update action.
- Entity type resolution via prefix matching (`node_` → common, `choice_` → choice, `ending_` → ending) with store-lookup fallback.

**AMBIGUOUS markers:**
- Choice connection: connecting from a Choice node is ambiguous (which option's `next[]`?) — deferred to Phase 8 context menu.
- Choice edge removal: similarly deferred to inspector/context menu.

### 3. `src/components/graph/GraphCanvas.css`

**Purpose:** Full-viewport styles and dark theme overrides for React Flow.

**Implementation details:**
- All values consume design tokens from `tokens.css` (AR-09)
- Overrides React Flow's default styling for:
  - Background (dark charcoal)
  - Nodes (per-type border colors: blue=common, purple=choice, red=ending)
  - Handles (connection points with hover/connecting/valid states)
  - Edges (default, selected, hover states)
  - Connection line (animated dash while dragging)
  - Selection box (blue tint)
  - Minimap (dark themed)
  - Controls panel (dark themed buttons)
  - Attribution (hidden)
- Temporary node label classes (`.graph-node-label`, `__type`, `__name`, `__id`) for pre-Phase 7 rendering

### 4. `src/components/graph/GraphCanvas.jsx`

**Purpose:** Full-viewport `<ReactFlow>` wrapper component.

**Key exports:** `<GraphCanvas />` (default export)

**Implementation details:**
- Registers three node types: `commonNode`, `choiceNode`, `endingNode` (temporary renderers)
- Temporary renderers display: type label, entity name/text, entity ID, with `Handle` components for connections
  - `EndingNodeTemp` has no source handle (endings are terminal)
- Uses controlled React Flow mode with local `useState` for nodes/edges, synced from `useGraphSync` via `useMemo`
- Configures React Flow with:
  - `fitView`, `snapToGrid` (16px grid), zoom range 0.1–3x
  - `Delete` key for deletion, `Shift` for multi-select
  - `panOnScroll`, `colorMode="dark"`
  - Dotted background, Controls panel, MiniMap with per-type colors
- `ReactFlowProvider` is placed in `App.jsx` (required for React Flow context)

### 5. `src/App.jsx` (Modified)

**Changes:**
- Removed Phase 5 placeholder (centered logo + badge)
- Now renders `<ReactFlowProvider>` wrapping `<GraphCanvas />`
- Removed `lucide-react` import (no longer needed at this level)

---

## Architecture Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| **AR-01** | ✅ | `GraphCanvas.jsx` PascalCase under `src/components/graph/`; hooks camelCase under `src/hooks/` |
| **AR-02** | ✅ | All shared state from Zustand stores; local `useState` only for React Flow's internal controlled mode (not shared) |
| **AR-09** | ✅ | `GraphCanvas.css` consumes tokens exclusively; no hard-coded values in component styles |
| **AR-10** | ✅ | `_position` read for node positioning; written back on drag stop |

---

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Graph canvas fills 100% of the viewport with dark-themed background | ✅ |
| 2 | Nodes from the narrative store render on the canvas at their `_position` coordinates | ✅ |
| 3 | Edges render between connected nodes based on `next[].target` references | ✅ |
| 4 | Pan, zoom, and multi-select interactions work | ✅ |
| 5 | Dragging a node updates `_position` in the narrative store | ✅ |
| 6 | Connecting two nodes via drag creates a `next` entry in the source entity | ✅ |

---

## Ambiguities Documented

1. **Choice node connections** (`useGraphCallbacks.js`): When a user drags a connection from a Choice node, it's unclear which option's `next[]` array should receive the new entry. Deferred to Phase 8 (context menu: "Connect to...").

2. **Choice edge removal** (`useGraphCallbacks.js`): Removing an edge from a Choice requires both `optionId` and `entryId`. The edge ID encodes both, but the removal logic is deferred to the inspector/context menu interactions (Phase 8/9).

---

## Dependencies Used

- `@xyflow/react` v12.10.2 — `ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `MiniMap`, `Handle`, `Position`, `BackgroundVariant`, `applyNodeChanges`, `applyEdgeChanges`
- `zustand` — via existing stores (`useNarrativeStore`, `useUIStore`, `useSimulationStore`)
- `react` — `useState`, `useCallback`, `useMemo`
