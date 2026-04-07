# Phase 10 — Simulation Engine: Implementation Report

> **Phase:** 10 — Simulation Engine
> **Date:** 2026-04-07
> **Build Status:** ✅ Passes (`vite build` — 0 errors)

---

## Summary

Implemented the always-running simulation engine that recalculates edge validity, node reachability, and auto-lock suggestions on every state change. This is the core differentiator from V1 — the simulation runs automatically with 150ms debounce, requiring no start/stop button.

---

## Files Produced

### New Files

| # | File | Path | Purpose |
|---|------|------|---------|
| 1 | `reachability.js` | `src/engine/reachability.js` | BFS-based reachability analysis from entry node along passing edges |
| 2 | `simulationEngine.js` | `src/engine/simulationEngine.js` | Core simulation loop: evaluates all edge conditions, computes reachability, generates auto-lock suggestions |
| 3 | `useSimulationSync.js` | `src/hooks/useSimulationSync.js` | Hook that wires simulation engine to Zustand store subscriptions with 150ms debounce |

### Modified Files

| # | File | Path | Changes |
|---|------|------|---------|
| 4 | `App.jsx` | `src/App.jsx` | Added `useSimulationSync()` call to wire engine at app root |
| 5 | `CommonNodeRenderer.jsx` | `src/components/graph/nodes/CommonNodeRenderer.jsx` | Added unreachable warning badge (AlertTriangle icon), reads `unreachableNodes` from simulation store |
| 6 | `CommonNodeRenderer.css` | `src/components/graph/nodes/CommonNodeRenderer.css` | Added `.common-node--unreachable` state + `.common-node__state-badge--unreachable` overlay |
| 7 | `ChoiceNodeRenderer.jsx` | `src/components/graph/nodes/ChoiceNodeRenderer.jsx` | Added unreachable badge, seen tracking icons, state badges (complete/failed) |
| 8 | `ChoiceNodeRenderer.css` | `src/components/graph/nodes/ChoiceNodeRenderer.css` | Added unreachable state, state badges, seen badge CSS |
| 9 | `EndingNodeRenderer.jsx` | `src/components/graph/nodes/EndingNodeRenderer.jsx` | Added unreachable badge, seen tracking icons, state badges (complete/failed) |
| 10 | `EndingNodeRenderer.css` | `src/components/graph/nodes/EndingNodeRenderer.css` | Added unreachable state, state badges, seen badge CSS |
| 11 | `tokens.css` | `src/styles/tokens.css` | Added `--color-state-unreachable` token |

---

## Architecture Decisions

### Simulation Engine (`simulationEngine.js`)

- **Pure function architecture**: `recalculate()` is a pure function taking narrative data + campaign state and returning computed results. No side effects, no store subscriptions — lifecycle managed by the hook.
- **Flag/Status merging**: Data model defaults are merged with campaign/simulation overrides. Overrides take precedence. Unknown overrides (for deleted entities) are included to prevent silent failures.
- **Edge evaluation**: Each edge's pass/fail considers the full condition chain:
  - Common Node edges: source `requires` + next entry `requires`
  - Choice edges: choice `requires` + option `requires` + next entry `requires`
- **Auto-lock suggestions**: Unreachable nodes not already in a terminal state (locked, branch_locked, complete, failed) are suggested for auto-locking. Suggestions are computed but not auto-applied — surfacing via UI deferred to Phase 13 status strip.

### Reachability (`reachability.js`)

- **BFS from entry node**: Only traverses edges where `evaluatedEdges[edgeId] !== false`. Edges with `undefined` evaluation (before first simulation cycle) are treated as passable to avoid false positives.
- **Edge ID format**: Matches `useGraphSync.js` conventions exactly (`edge-{sourceId}-{nextEntryId}` and `edge-{choiceId}-{optionId}-{nextEntryId}`).
- **No entry node**: If entry_node is null or doesn't exist in the graph, all nodes are marked unreachable.

### Simulation Sync Hook (`useSimulationSync.js`)

- **150ms debounce**: Per plan specification. Uses `setTimeout`/`clearTimeout` pattern.
- **Triple subscription**: Subscribes to narrative store, simulation store, and campaign store. Any change triggers recalculation.
- **`equalityFn: () => false`**: Forces immediate trigger on any state change. This guarantees the simulation stays current but may cause extra recalculations — acceptable given the 150ms debounce.
- **Initial calculation**: Runs `recalculate()` immediately on mount (no debounce for first run).
- **Campaign integration**: Merges active campaign flag/status overrides with simulation store overrides.

### Node Renderer Updates

- All three renderers (Common, Choice, Ending) now read `unreachableNodes` from simulation store via `s.unreachableNodes.has(entity.id)`.
- Unreachable nodes display:
  - Dotted amber border (`--color-state-unreachable`)
  - 55% opacity
  - Top-left AlertTriangle badge
- Choice and Ending renderers gained previously missing features:
  - State badges (checkmark complete, X failed) — matching Common Node
  - Seen tracking icons (eye, half-eye) — matching Common Node

---

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Simulation recalculates within 150ms of any change | PASS | `useSimulationSync` debounces at 150ms, subscribes to all three stores |
| Edges whose conditions pass are highlighted; fail edges dimmed/dashed | PASS | `evaluateAllEdges()` populates `evaluatedEdges` map; `ConditionalEdge.jsx` reads it for pass/fail/glow CSS |
| Active nodes pulse and show valid outgoing edges glowing | PASS | `.common-node--active` animation + `.conditional-edge__path--glow` (from Phase 7, now fed by engine) |
| Unreachable nodes display warning badge | PASS | All three renderers show amber AlertTriangle badge + dotted border |
| Node renderers display correct state overlay | PASS | active (pulse), locked (dimmed), complete (checkmark), failed (X), branch_locked (dashed) — all CSS in place |
| Seen tracking icons render | PASS | All three renderers: unseen (none), partially_seen (EyeOff), seen (Eye) |

---

## AMBIGUOUS Annotations

1. **`simulationEngine.js`**: `autoLockSuggestions` are computed but not auto-applied — deferred to Phase 13 status strip.
2. **`useSimulationSync.js`**: Campaign flag/status overrides are merged with simulation store overrides. Simulation store overrides take precedence when both exist for the same key. This matches the likely intent (simulation store = current session, campaign = saved baseline).
