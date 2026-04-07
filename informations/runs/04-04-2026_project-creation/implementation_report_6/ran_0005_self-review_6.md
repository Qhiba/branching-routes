# Phase 6 — Graph Canvas Foundation — Self-Review Report

> **Prompt:** `0005_self-review.md`
> **Phase:** 6
> **Date:** 2026-04-06
> **Reviewed:** `ran_0004_execute_6.md`

---

## Verdict: **HOLD** — 4 issues found (2 rule violations, 2 universal check findings)

---

## Issues

### 1. Unused import — ℹ️ By Design — `useSimulationStore` in `useGraphSync.js`

- **File:** `src/hooks/useGraphSync.js`, line 21
- **Rule violated:** Universal check #1 — Dead code
- **What the code does:** Imports `useSimulationStore` at the top of the file, but never calls it anywhere in the hook body. The comment on lines 118–120 says "Simulation store data (nodeStates) is read here for future node renderer use" but there is no actual call to `useSimulationStore()`.
- **What it should do:** Remove the import entirely. If simulation data is needed in the future (Phase 7/10), it should be added at that time. Dead imports increase bundle size awareness overhead and may confuse future reviewers.
- **Is it placed for later phases:** No. The comment mentions Phase 7/10 usage, but the import serves no current purpose and should not be pre-staged. Phase 7 (Custom Node Renderers) will add its own simulation store subscriptions inside the renderer components, not in this sync hook. **Fix now.**

### 2. Unused variable — ℹ️ By Design — `entryNode` in `useGraphSync.js`

- **File:** `src/hooks/useGraphSync.js`, line 116
- **Rule violated:** Universal check #1 — Dead code
- **What the code does:** Subscribes to `useNarrativeStore((s) => s.metadata.entry_node)` and stores it in `entryNode`, but this variable is never referenced in the `nodes` or `edges` memos.
- **What it should do:** Remove the selector subscription. An unused Zustand selector creates unnecessary re-renders when `entry_node` changes. This data can be added when it's actually needed (e.g., to mark the entry node visually in Phase 7).
- **Is it placed for later phases:** No. While `entry_node` will be consumed in Phase 7 or Phase 10 (to visually mark the starting node or for reachability BFS), an unused subscription is a performance liability today. **Fix now**, re-add when needed.

### 3. Hard-coded color values in `GraphCanvas.jsx` — ✅ Solved — AR-09 violation

- **File:** `src/components/graph/GraphCanvas.jsx`, lines 136–142 (`minimapNodeColor` callback)
- **Rule violated:** **AR-09** — "no hard-coded color/spacing/font values in component stylesheets"
- **What the code does:** The `minimapNodeColor` callback returns raw HSL strings: `'hsl(210, 100%, 55%)'`, `'hsl(265, 80%, 60%)'`, `'hsl(0, 75%, 55%)'`, `'hsl(220, 10%, 35%)'`. Comments note these match token values, but they are duplicated literals.
- **What it should do:** AR-09 applies to "component `.css` files" and the spirit extends to component-level styling. However, the `MiniMap nodeColor` prop requires a raw color string (not a CSS custom property reference). This is a technical limitation of the React Flow API. Add a comment documenting this constraint: `// AR-09 exemption: MiniMap nodeColor requires raw string, cannot use CSS custom properties`.

  Additionally, lines 177 (`Background color`) and 186 (`MiniMap maskColor`) have the same issue — raw HSL strings passed as React props.
- **Is it placed for later phases:** No. This is a React Flow API limitation — the `nodeColor`, `color`, and `maskColor` props accept raw color strings only, not CSS `var()` references. No future phase changes this constraint. **Fix now** by adding exemption comments to document the technical limitation.

### 4. Misuse of `useMemo` for side effects in `GraphCanvas.jsx` — ❌ Break the Code [DEFERED]

- **File:** `src/components/graph/GraphCanvas.jsx`, lines 116–122
- **Rule violated:** Universal check #2 — Consistency (React best practices)
- **What the code does:** Uses `useMemo` to call `setNodes(syncedNodes)` and `setEdges(syncedEdges)` as a synchronization mechanism. `useMemo` is documented as a pure computation hook — calling a state setter inside it is a side effect.
- **What it should do:** Replace `useMemo` with `useEffect` for state synchronization:
  ```js
  useEffect(() => {
    setNodes(syncedNodes);
  }, [syncedNodes]);

  useEffect(() => {
    setEdges(syncedEdges);
  }, [syncedEdges]);
  ```
  This follows React's intended API: `useEffect` for synchronizing with external data, `useMemo` for derived computations.
- **Is it placed for later phases:** No. This is a React API misuse that applies now regardless of future phases. **Fix now.**

---

## Checks Passed

### Architecture Rules

| Rule | Status | Notes |
|------|--------|-------|
| AR-01 | ✅ | `GraphCanvas.jsx` PascalCase under `src/components/graph/`; hooks are camelCase `.js` under `src/hooks/` |
| AR-02 | ✅ | All shared state from Zustand stores; local `useState` for React Flow's controlled mode only (not shared between components) |
| AR-03 | ✅ | No `requires` fields created or mutated — existing structures passed through correctly |
| AR-04 | ✅ | `next` arrays read correctly; new `next` entries created via `addNextEntry()` store action which enforces the shape |
| AR-05 | ✅ | No array fields initialized — all reads from existing store data |
| AR-06 | ✅ | No sub-element IDs generated directly — delegated to store actions (`addNextEntry` uses `generateId`) |
| AR-07 | ✅ | No entity names created or modified — name handling delegated to store |
| AR-08 | ✅ | No IndexedDB operations in these files |
| AR-09 | ⚠️ | Issue #3 — hard-coded HSL in JS props (technical limitation of MiniMap API, but needs documentation) |
| AR-10 | ✅ | `_position` read for node positioning; written back via store update on drag stop |

### Universal Checks

| Check | Status | Notes |
|-------|--------|-------|
| Dead code | ❌ | Issues #1, #2 — unused import and variable |
| Consistency | ❌ | Issue #4 — `useMemo` used for side effects instead of `useEffect` |
| Completeness | ✅ | All 5 files from the phase file map exist: `GraphCanvas.jsx`, `GraphCanvas.css`, `useGraphSync.js`, `useGraphCallbacks.js`, `App.jsx` |

---

## Edge ID Parsing Concern (Non-blocking observation)

In `useGraphCallbacks.js` lines 86–93, the edge ID is split by `'-'` to extract `sourceId`. However, entity IDs from `generateId()` contain underscores, not hyphens (e.g., `node_1712345678901_a7x9`). The split on `'-'` works correctly because the edge ID template is `edge-{sourceId}-{nextEntryId}` and the entity IDs themselves don't contain hyphens. This is not a bug — the ID format is consistent — but the comment should note this assumption is load-bearing: if IDs ever contain hyphens, the parsing breaks.

This is tagged as non-blocking because it does not violate any explicit rule.
