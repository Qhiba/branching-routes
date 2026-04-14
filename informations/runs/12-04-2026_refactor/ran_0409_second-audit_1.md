# Second Audit Report — Branching Routes Refactor

**Audit Pass**: 1  
**Date**: 14-04-2026  
**Auditor Role**: Same senior auditor who wrote the pre-refactor contract in `ran_0402_first-audit.md`  
**Source Contract**: `ran_0402_first-audit.md` — 12-04-2026  

---

## 1. Phase Execution Completeness

| Phase | Name | Status | Parity Test | Evidence |
|---|---|---|---|---|
| 1 | Aesthetics | **COMPLETE** | **PASS** | `tokens.css` updated with dark-mode-only intent block and refined values; `global.css` audited and confirmed clean; `TEST_DC_07` passed (1/1). |
| 2 | UI State Extraction | **COMPLETE** | **PASS** | `uiStore.js` created with `selectedNodeId`, `selectedEdgeId`, `snapToGrid` and all actions; cross-store wiring in `narrativeStore.js` confirmed at `deleteNode` L48, `deleteEdge` L96, `loadGraph` L169, `newGraph` L181; `TEST_BI_04`, `TEST_BI_05`, `TEST_BI_16` passed (3/3). |
| 3 | ID System Migration | **COMPLETE** | **PASS** | `uuid.js` updated to `generateId(prefix)` returning `${prefix}-${crypto.randomUUID()}`; `narrativeStore.js` passes `'n'`, `'e'`, `'f'` prefixes; `loadGraph` accepts both formats transparently; `TEST_DC_05_and_LBA_02` passed. |
| 4 | Store Consolidation | **COMPLETE** | **PASS** | `graphStore.js` removed from disk; `narrativeStore.js` exists with `useNarrativeStore` export; all 12 component/store files updated to `useNarrativeStore`/`useUIStore`; `simulationStore.js` reads `useNarrativeStore.getState()` at L46, L77; `TEST_LBA_01`, `TEST_HS_08` passed. |

**Result**: All 4 phases COMPLETE. All parity tests PASS. No automatic HOLD triggered.

---

## 2. Behavioral Invariants — Final Check

| ID | Invariant | Status | Evidence | Comment Present? |
|---|---|---|---|---|
| BI-01 | First node auto-becomes start node | **PRESERVED** | `narrativeStore.js` L16: `const isStartNode = state.nodes.length === 0;` | N/A |
| BI-02 | `setStartNode(id)` sets exactly one | **PRESERVED** | `narrativeStore.js` L51–57: maps all nodes, sets `isStartNode: n.id === id`. | N/A |
| BI-03 | `deleteNode(id)` cascades edges | **PRESERVED** | `narrativeStore.js` L43: `edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id)`. | N/A |
| BI-04 | `deleteNode(id)` clears selection | **PRESERVED** | `narrativeStore.js` L48: `useUIStore.getState().clearIfSelected(id, 'node')` | ✅ `// INVARIANT: BI-04` at L47 |
| BI-05 | `deleteEdge(id)` clears selection | **PRESERVED** | `narrativeStore.js` L96: `useUIStore.getState().clearIfSelected(id, 'edge')` | ✅ `// INVARIANT: BI-05` at L95 |
| BI-06 | `addEdge` rejects ending source | **PRESERVED** | `narrativeStore.js` L61–62: checks `sourceNode.type === 'ending'` and throws. | N/A |
| BI-07 | `addEdge` rejects duplicates | **PRESERVED** | `narrativeStore.js` L64–65: `state.edges.some(...)` check and throws. | N/A |
| BI-08 | `deleteFlag` blocks referenced flag | **PRESERVED** | `narrativeStore.js` L121–150: traverses `e.condition.clauses[].flagId`, `e.sideEffects[].flagId`, `n.data.sideEffects[].flagId`. Returns `{ blocked: true, references }`. | N/A |
| BI-09 | `addFlag` validates name regex | **PRESERVED** | `narrativeStore.js` L100: `/^[a-zA-Z0-9_]+$/.test(name)` guard. | N/A |
| BI-10 | Side effect order: edge then node | **PRESERVED** | `simulationStore.js` L86–93: edge SFX applied first (L88), then destination node SFX (L93). | N/A |
| BI-11 | `start()` initializes from `defaultValue` | **PRESERVED** | `simulationStore.js` L52–55: `graphState.flags.forEach(f => { initialFlags[f.id] = f.defaultValue; })` | N/A |
| BI-12 | `reset()` clears all ephemeral state | **PRESERVED** | `simulationStore.js` L118–128: resets all 7 fields to initial values. | N/A |
| BI-13 | Simulation never mutates graph store | **PRESERVED** | `simulationStore.js` only calls `useNarrativeStore.getState()` for reads; never calls any narrative store action. | N/A |
| BI-14 | `exportGraph` produces `schemaVersion: 1` | **PRESERVED** | `narrativeStore.js` L194: `schemaVersion: 1` in return object. | N/A |
| BI-15 | `exportGraph` formats timestamps DD-MM-YYYY | **PRESERVED** | `narrativeStore.js` L190: padded day-month-year format string. | N/A |
| BI-16 | `loadGraph` resets selection to null | **PRESERVED** | `narrativeStore.js` L169: `useUIStore.getState().resetSelection()` after `set()`. Also in `newGraph` at L181. | ✅ `// INVARIANT: BI-16` at L168, L180 |
| BI-17 | `evaluateCondition(null, flags)` returns true | **PRESERVED** | `conditionEvaluator.js` L18: `if (!condition) return true;` — file PROTECTED and untouched. | N/A |
| BI-18 | `evaluateCondition` defaults to AND | **PRESERVED** | `conditionEvaluator.js` L25–26: `// default to AND` then `return condition.clauses.every(...)` — file untouched. | N/A |

**Result**: All 18 behavioral invariants PRESERVED. No BROKEN items. No automatic HOLD triggered.

---

## 3. Data Contract — Final Check

| ID | Contract | Status | Evidence |
|---|---|---|---|
| DC-01 | Export JSON top-level shape `{ schemaVersion, meta, nodes, edges, flags }` | **INTACT** | `narrativeStore.js` L193–203: `exportGraph` returns exactly `{ schemaVersion: 1, meta: {...}, nodes, edges, flags }`. `fileSystem.js` L68: validates `data.schemaVersion !== 1`. |
| DC-02 | Node shape `{ id, type, position, data: { label, content, isStartNode, sideEffects } }` | **INTACT** | `narrativeStore.js` L17–28: `addNode` creates node with exact shape. All field names preserved. |
| DC-03 | Edge shape `{ id, sourceId, targetId, label, condition, sideEffects }` | **INTACT** | `narrativeStore.js` L68–76: `addEdge` creates edge with exact shape. All field names preserved. |
| DC-04 | Flag shape `{ id, name, type, defaultValue }` | **INTACT** | `narrativeStore.js` L103–108: `addFlag` creates flag with exact shape. |
| DC-05 | ID format: UUID v4 string | **INTACT** | `uuid.js` L3: `generateId(prefix)` returns `${prefix}-${crypto.randomUUID()}`. New IDs are prefixed UUID strings. Old bare UUIDs accepted transparently by `loadGraph`. |
| DC-06 | Condition clause references flags by `flagId` | **INTACT** | `conditionEvaluator.js` untouched. `simulationStore.js` flag state keyed by `f.id`. |
| DC-07 | CSS variable naming in `tokens.css` | **INTACT** | `tokens.css` L10: `/* INVARIANT: DC-07 */` comment present. All variable names verified intact. No renamed variables. |

**Result**: All 7 data contracts INTACT. No violations.

---

## 4. Load-Bearing Assumptions — Final Check

| ID | Assumption | Status | Evidence |
|---|---|---|---|
| LBA-01 | Synchronous cross-store read via `getState()` | **STILL TRUE** | `simulationStore.js` L46: `useNarrativeStore.getState()` in `start()`. L77: same in `advance()`. Both synchronous, no async, no selector layer. `// INVARIANT: LBA-01` present at both. |
| LBA-02 | Flat ID strings (legacy compatibility) | **STILL TRUE** | `narrativeStore.js` L157–166: `loadGraph` accepts any string ID without transformation. `// INVARIANT: LBA-02` at L158. |
| LBA-03 | `isStartNode` on `node.data` | **STILL TRUE** | `narrativeStore.js` L25: `isStartNode` on `data`. `simulationStore.js` L47: reads `n.data && n.data.isStartNode`. |
| LBA-04 | `deleteFlag` traverses nested structures | **STILL TRUE** | `narrativeStore.js` L125–140: traverses `e.condition.clauses[].flagId`, `e.sideEffects[].flagId`, `n.data.sideEffects[].flagId`. |
| LBA-05 | Selection-clearing atomicity on delete | **STILL TRUE** | `deleteNode` (L40–48) and `deleteEdge` (L89–96): `set()` then synchronous `useUIStore.getState().clearIfSelected()`. Same event loop tick. React batches. |

**Result**: All 5 load-bearing assumptions STILL TRUE.

---

## 5. Migration Integrity

### S03 — ID Format Change (Parallel Support)

| Check | Result | Evidence |
|---|---|---|
| Migration executed as declared? | **YES** | `uuid.js` L3: `generateId(prefix)` emits `${prefix}-${crypto.randomUUID()}`. `narrativeStore.js` passes `'n'`, `'e'`, `'f'` prefixes at L19, L70, L105. |
| Old format still works? | **YES** | `loadGraph` performs no ID transformation. Both bare UUID and prefixed IDs coexist. `fileSystem.importProject` only validates `schemaVersion`, not ID format. |
| New format produces correctly? | **YES** | New entities get `n-{uuid}`, `e-{uuid}`, `f-{uuid}` format. |

**Verdict**: **MIGRATION COMPLETE**

### S25 — UI State Extraction (In-place Migration)

| Check | Result | Evidence |
|---|---|---|
| Migration executed as declared? | **YES** | `uiStore.js` created with `clearIfSelected` and `resetSelection`. `narrativeStore.js` calls both after delete/load operations. |
| Cross-store coordination correct? | **YES** | Direction: narrative → ui (one-directional). `uiStore.js` does NOT import from `narrativeStore.js`. No circular dependency. |
| Selection fully removed from narrative store? | **YES** | Grep: zero occurrences of `selectedNodeId`/`selectedEdgeId` in `narrativeStore.js`. |

**Verdict**: **MIGRATION COMPLETE**

---

## 6. Structural Goal — Achievement Check

| Goal | Status | Evidence |
|---|---|---|
| S01 — Rename `graphStore` → `narrativeStore` | **ACHIEVED** | `graphStore.js` deleted. `narrativeStore.js` exists. Export is `useNarrativeStore`. All consumers updated. No `useGraphStore` references remain in executable `src/` code. |
| S03 — Prefixed UUID system | **ACHIEVED** | `uuid.js` generates `{prefix}-{uuid}`. Three prefixes in use. Legacy import backward-compatible. |
| S23 — Dark-mode-only theme | **ACHIEVED** | `tokens.css` has dark-mode-only intent block. No `prefers-color-scheme: light` in `global.css`. All token values are dark-palette. |
| S25 — Create `uiStore` | **ACHIEVED** | `uiStore.js` exists. Selection, grid state, and actions fully moved. Cross-store coordination wired. |

**Result**: **ACHIEVED** — all four structural goals met.

---

## 7. Architecture Compliance

| Rule | Status | Evidence |
|---|---|---|
| AR-01 — File naming | **PASS** | `narrativeStore.js`, `simulationStore.js`, `uiStore.js` (camelCase + suffix). Components PascalCase. Utils camelCase, no suffix. |
| AR-02 — Variable/entity naming | **PASS** | `generateId` produces UUID-based strings. `addFlag` validates `/^[a-zA-Z0-9_]+$/` at `narrativeStore.js` L100. |
| AR-03 — Global state in Zustand only | **PASS** | Three Zustand stores. Components use `useState` only for UI-local concerns. |
| AR-04 — No direct graph mutation in components | **PASS** | All components call store actions. No direct state mutation. |
| AR-05 — Single source of truth | **PASS** | `narrativeStore` is canonical. `GraphCanvas.jsx` derives React Flow arrays from store. Export is serialized narrative store only. |
| AR-06 — Import constraints (no circular imports) | **PASS** | narrative → ui (one-directional). simulation → narrative (reads only). ui imports nothing from other stores. `// INVARIANT: HS-08` guard at `narrativeStore.js` L5. |
| AR-07 — Condition logic centralized | **PASS** | `conditionEvaluator.js` contains pure functions. No condition logic in components or stores. |
| AR-08 — Simulation isolation | **PASS** | `simulationStore.js` never calls narrative store actions. `reset()` clears all state. |
| AR-09 — JSON format stability | **PASS** | `schemaVersion: 1` at `narrativeStore.js` L194. `fileSystem.js` L68 validates version. |
| AR-10 — No external backend | **PASS** | No fetch/axios/WebSocket calls. File System Access API only. |
| AR-11 — Side effect execution order | **PASS** | `simulationStore.js` L86–93: edge first, then node. |
| AR-12 — Ending node constraints | **PASS** | `narrativeStore.js` L61–62: throws on ending source. `StoryNode.jsx` L35: hides source handle. |

**Result**: All 12 architecture rules PASS.

---

## 8. Parity Verdict

**PARITY CONFIRMED**

Based on:
- Phase 1: 1 test passed, 0 failed — DC-07 verified.
- Phase 2: 3 tests passed, 0 failed — BI-04, BI-05, BI-16 verified.
- Phase 3: Test suite created and verified DC-05 + LBA-02 (parallel support).
- Phase 4: Test suite created and verified LBA-01 + HS-08.
- Full codebase reading confirms all behavioral invariants, data contracts, load-bearing assumptions, and architecture rules are intact.

**Corruption check**: All source files are complete (no truncated files, no partial writes). Every file has proper closing brackets/exports. All import chains resolve: `store/index.js` exports all 3 stores, `utils/index.js` exports all 3 utils, `components/index.js` exports all 8 components. No dangling references to `useGraphStore` or `graphStore` remain in executable code.

---

## 9. Final Verdict

### **SHIP**

The refactor has achieved its four declared structural goals (store rename, prefixed UUID system, dark-mode-only theme, UI state extraction) while preserving all 18 behavioral invariants, all 7 data contracts, all 5 load-bearing assumptions, and compliance with all 12 architecture rules. Both declared migrations (S03 Parallel Support, S25 In-place Migration) executed as specified. The codebase is structurally sound, free of corruption, and ready for documentation (0410).
