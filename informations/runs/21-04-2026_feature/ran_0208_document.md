# Documentation Report — Route_Tracing

**Date:** 2026-04-21
**Step:** 0208 Document
**Audit input:** `ran_0207_audit_1.md` (verdict: SHIP)

---

## Files Updated

### 1. `informations/docs/project_overview.md` — UPDATED

**Why:** New files were created (`routeTracer.js`, `StatusStrip.jsx`, `RouteFinderDialog.jsx`), the grid layout expanded from three to four regions, and existing store descriptions were incomplete.

**Changes made:**
- `App.jsx` folder entry: updated to mention four-region grid and `<StatusStrip />` fourth region
- `App.css` folder entry: updated to describe four-region layout (48px + flexible canvas + 300px sidebar + 28px bottom bar)
- `uiStore.js` folder entry: added overlay toggle fields to description
- `simulationStore.js` folder entry: added traversal records, undo, coverage metrics, route results to description
- Added `routeTracer.js` entry under `src/utils/` (after `conditionEvaluator.js`)
- Added `StatusStrip.jsx` and `RouteFinderDialog.jsx` entries under `src/components/` (after `Toast.jsx`)

---

### 2. `informations/docs/codebase_features.md` — UPDATED

**Why:** Three new files shipped; twelve existing files changed behavior that the documentation did not yet reflect.

**New entries added:**
- `src/utils/routeTracer.js`: pure route analysis utility (`detectDeadEnds`, `computeForwardReachable`, `computeShortestPaths`)
- `src/components/StatusStrip.jsx`: bottom-bar coverage readouts
- `src/components/RouteFinderDialog.jsx`: shortest-route analysis modal

**Entries rewritten:**
- `src/App.jsx`: three-region → four-region; added `StatusStrip` dependency
- `src/App.css`: three-region → four-region grid description
- `src/styles/tokens.css`: added traversal/route/coverage-gap tokens
- `src/styles/global.css`: added `--coverage-gap` overlay, `.conditional-edge--traversal-overlay`, `.conditional-edge--route-overlay`, StatusStrip styles, RouteFinderDialog styles
- `src/store/simulationStore.js`: added all new runtime state fields and five new actions
- `src/store/uiStore.js`: added four new fields and four new actions
- `src/utils/index.js`: added three new re-exports and `routeTracer` dependency
- `src/components/index.js`: added `StatusStrip` and `RouteFinderDialog` to exports
- `src/components/TopBar.jsx`: added Undo Active Node button documentation
- `src/components/nodes/CommonNode.jsx`: added `--coverage-gap` overlay documentation
- `src/components/nodes/ChoiceNode.jsx`: added `--coverage-gap` overlay documentation
- `src/components/nodes/EndingNode.jsx`: added `--coverage-gap` overlay documentation
- `src/components/edges/ConditionalEdge.jsx`: added `--traversal-overlay` and `--route-overlay` documentation

**Changelog entry added:**
```
## [2026-04-21] — Route_Tracing
```
(see `codebase_features.md` for full entry)

---

### 3. `informations/docs/architecture_rules.md` — UPDATED

**RULE CANDIDATE decisions:**

**RULE CANDIDATE 1 — Cross-store writer actions must declare their campaign-guard posture**
- Decision: FORMALIZED as **AR-24**
- Rationale: The two-writer pattern (`computeRoutes` guarded, `setShortestRouteResults` unguarded) surfaced only through BUG-03 debugging. The pattern is stable, the failure mode is concrete, and the rule generalizes AR-20 from "declare the action" to "declare each action's precondition contract." Pattern is stable enough to formalize.

**RULE CANDIDATE 2 — Dialog actions with shared-state side effects must close via a `handleClose` helper**
- Decision: FORMALIZED as **AR-25**
- Rationale: BUG-02 (dialog did not auto-close after run) was a real integration failure caused by split close paths. The `handleClose` consolidation is a clear, stable pattern that applies to any dialog writing to a shared store. Pattern is stable enough to formalize.

**Note:** AR-16 was already updated before Phase 3 executed (as required by RISK-RT-03 mitigation). No further change needed.

---

### 4. `informations/docs/risk_register.md` — UPDATED

**Planning risks resolved/mitigated:**
- RISK-RT-01 (Re-render storm from traversalRecords): **RESOLVED** — primitive selectors throughout; confirmed by 156/156 tests
- RISK-RT-02 (undoLastNode auto-save race): **RESOLVED** — synchronous `set()` makes race structurally impossible
- RISK-RT-03 (Phase 3 AR-16 RULE CONFLICT): **RESOLVED** — AR-16 updated before Phase 3 executed
- RISK-RT-04 (forward BFS cost per advance): **MITIGATED** — plain O(V+E) BFS; 500-node visit cap implemented
- RISK-RT-05 (shortest-route search complexity): **MITIGATED** — HARD_CAP=50, MAX_STATE_VISITS, exhausted flag and user notice

**NEW RISK entries added from audit §6:**
- **RISK-RT-06** — Undeclared `setShortestRouteResults` action (AR-20 drift): **OPEN** — documentation backfilled here; AR-24 prevents recurrence
- **RISK-RT-07** — Edit-mode Route Finder path from `selectedNodeId` (scope drift): **OPEN** — behavior is correct; scope wording reconciled in documentation

---

### 5. `informations/docs/example_datamodel.json` — NO CHANGE REQUIRED

The exported JSON format is unchanged. `schemaVersion: 4` is unchanged. All new state is ephemeral `simulationStore` runtime state excluded from `exportGraph()` per AR-08. No new fields, entity types, or structures were added to the persisted data model.

---

## Summary

| File | Action | Reason |
|------|--------|--------|
| `project_overview.md` | UPDATED | New files added; layout description incomplete |
| `codebase_features.md` | UPDATED | 3 new files; 12 existing entries stale; changelog added |
| `architecture_rules.md` | UPDATED | 2 rule candidates formalized as AR-24 and AR-25 |
| `risk_register.md` | UPDATED | 5 planning risks resolved/mitigated; 2 new risks from audit |
| `example_datamodel.json` | SKIPPED | No data model changes shipped |
