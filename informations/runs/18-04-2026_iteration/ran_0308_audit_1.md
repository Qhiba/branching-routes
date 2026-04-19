# Audit Report — Pass 1

**Iteration:** 18-04-2026 Campaign Mode Rewire  
**Audit pass:** 1  
**Date:** 19-04-2026

---

## 1. Phase Execution Completeness

| Phase | Status | Test | Evidence |
|-------|--------|------|----------|
| **Phase 1 — Campaign-mode boundary rename** | COMPLETE | PASS | `isRunning` → `isCampaignActive` renamed across all 7 files. Test report `ran_0307_test_01_02.md`: 8/8 passed, REGRESSION CLEAN. |
| **Phase 2 — Six-state enum + seen tracking** | COMPLETE | PASS | `computeNodeStates` produces six-state enum (`active`, `complete`, `failed`, `locked`, `branch_locked`, `reachable`) + `seenNodeIds` accumulation. Test report `ran_0307_test_01_02.md`: 8/8 passed, REGRESSION CLEAN. |
| **Phase 3 — Choice option interaction + selected-option routing** | COMPLETE | PASS | `selectOption` action, `selectedOptionId` state, option-filtered `computeReachable`. Test report `ran_0307_test_04.md`: 10/10 passed (after fix), REGRESSION CLEAN. |
| **Phase 4 — Passive warnings + sandbox overrides** | COMPLETE | PASS | `computePassiveAnalysis` (orphan/unreachable), `SandboxPanel.jsx` created, warning badges on all 3 node types. Test report `ran_0307_test_04.md`: 10/10 passed, REGRESSION CLEAN. |

**Result:** All 4 phases COMPLETE, all tests PASS.

---

## 2. New Behavior — Achievement Check

### Behavior Delta Items

| # | Intended Change | Status | Evidence |
|---|----------------|--------|----------|
| BD-1 | Lifecycle: `isRunning` → `isCampaignActive` with `enterCampaign`/`exitCampaign`/`reset` | ACHIEVED | `simulationStore.js:154` (`isCampaignActive`), `:250` (`enterCampaign`), `:411` (`exitCampaign`), `:366` (`reset` preserves `isCampaignActive`). |
| BD-2 | TopBar: Enter/Exit Campaign + Reset buttons | ACHIEVED | `TopBar.jsx:158-175` — conditional render: `Enter Campaign Mode` / `Exit Campaign Mode` + `Reset Simulation`. |
| BD-3 | Two canvas modes (editing clean / campaign visual) | ACHIEVED | `GraphCanvas.jsx:207` applies `campaign-mode` class conditionally. Edit mode: no simulation classes. Campaign: full state rendering. |
| BD-4 | Six-state node enum | ACHIEVED | `simulationStore.js:24-78` (`computeNodeStates`). CSS classes: `global.css:402-433` (`.story-node--active`, `--locked`, `--complete`, `--failed`, `--branch_locked`, `--reachable`). |
| BD-5 | Seen tracking with separate indicator | ACHIEVED | `simulationStore.js:161` (`seenNodeIds`), accumulated in `advance` (`:334,348`). CSS: `global.css:436-462` (`.story-node--seen` + `::after` checkmark glyph). |
| BD-6 | Choice option clicking fires side effects | ACHIEVED | `simulationStore.js:219-247` (`selectOption` applies `applyFlagsSet`/`applyStatusSet` from option data). `ChoiceNode.jsx:88` — `onClick` calls `selectOption`. |
| BD-7 | Selected option routing: filter edges by `sourceHandle`/`optionId` | ACHIEVED | `simulationStore.js:12` — `if (isChoice && e.optionId !== selectedOptionId) return false;`. `GraphCanvas.jsx:138` — advance edge match: `(!isChoice \|\| e.optionId === selectedOptionId)`. |
| BD-8 | Selected/dimmed option visual states | ACHIEVED | `ChoiceNode.jsx:75-82` — `.choice-node__option--selected` / `--dimmed`. CSS: `global.css:318-349`. |
| BD-9 | Passive structural warnings (orphaned/unreachable) | ACHIEVED | `simulationStore.js:102-150` (`computePassiveAnalysis`), `:173-187` (`runPassiveAnalysis`). Badges: `CommonNode.jsx:21-30`, `ChoiceNode.jsx:31-40`, `EndingNode.jsx:21-30`. |
| BD-10 | Sandbox flag/status toggling (campaign only, ephemeral) | ACHIEVED | `SandboxPanel.jsx` (full component), `simulationStore.js:190-216` (`applySandboxOverride`). Sidebar integration: `Sidebar.jsx:48-55` (conditional Sandbox tab). |
| BD-11 | Editor guard: `isCampaignActive` gates authoring | ACHIEVED | `TopBar.jsx:146-155` (`disabled={isCampaignActive}`). `GraphCanvas.jsx:169` pane click guard. `Sidebar.jsx:59` (`pointerEvents: 'none'` when campaign active). |
| BD-12 | Sandbox edits survive until reset/exit | ACHIEVED | `simulationStore.js:291` (`sandboxOverrides: {}`  reset on `enterCampaign`), `:424` (reset on `exitCampaign`). Never writes to `narrativeStore`. |

### Definition of Done

| # | DoD Condition | Status | Evidence |
|---|--------------|--------|----------|
| DoD-1 | MODIFY `simulationStore.js` — campaign-mode, rich states, seen, sandbox, selected option, passive analysis | MET | Full rewrite verified — all functions present in `simulationStore.js:1-430`. |
| DoD-2 | MODIFY `TopBar.jsx` — Enter/Exit Campaign + Reset | MET | `TopBar.jsx:158-175`. |
| DoD-3 | MODIFY `GraphCanvas.jsx` — conditional visuals, passive badges, campaign-gated click | MET | `GraphCanvas.jsx:42-48,131-147,168-180,207`. |
| DoD-4 | MODIFY `CommonNode.jsx` — six-state + seen + warning badge | MET | `CommonNode.jsx:6-13,19-30`. |
| DoD-5 | MODIFY `ChoiceNode.jsx` — six-state + seen + option click + selected highlight | MET | `ChoiceNode.jsx:7-16,71-101`. |
| DoD-6 | MODIFY `EndingNode.jsx` — six-state + seen | MET | `EndingNode.jsx:6-11,19-30`. |
| DoD-7 | MODIFY `ConditionalEdge.jsx` — campaign-mode condition visuals | MET | `ConditionalEdge.jsx:7-8,20-24`. |
| DoD-8 | MODIFY `global.css` — simulation state classes, option states, warning badge | MET | `global.css:138-151,306-349,402-462,488-507,528-535`. |

**Result:** All behavior delta items ACHIEVED, all DoD conditions MET.

---

## 3. Preservation — Final Check

### PROTECTED Items

| # | Item | Status | Evidence |
|---|------|--------|----------|
| P-1 | **AR-05 — Single Source of Truth** | PRESERVED | Grep: only 3 `create(...)` calls: `narrativeStore.js:8`, `simulationStore.js:152`, `uiStore.js:3`. No new stores created. `narrativeStore` remains canonical graph owner. |
| P-2 | **AR-07 — Condition Evaluation in Evaluator** | PRESERVED | `conditionEvaluator.js` untouched for evaluation logic. `simulationStore.js:13` calls `evaluateCondition`. Grep for `operator === 'AND'`/`'OR'` — only in `conditionEvaluator.js` (now lowercase) and migration code in `fileSystem.js`. `// PRESERVED: AR-07` comment at `simulationStore.js:7`. |
| P-3 | **AR-08 — Simulation Isolation** | PRESERVED | `simulationStore` never calls any `narrativeStore` mutation action — only `getState()` reads. `exitCampaign()` at `:411-428` fully zeroes all state. `// PRESERVED: AR-08` at `simulationStore.js:412`. Sandbox writes only to `currentFlagValues` (`:195`). |
| P-4 | **AR-11 — Side Effect Placement** | PRESERVED | Edges carry no `sideEffects`/`flags_set`/`status_set` fields. Option side effects fire from `simulationStore.selectOption()` (`:233-235`), node side effects fire from `advance()` (`:318-321`). No side effects on edges. |
| P-5 | **AR-14 — Zustand Selector Stability** | PRESERVED | All node component selectors return primitives or `undefined`: `CommonNode.jsx:6` (`s.nodeStates[id]` → string or undefined), `:7` (`.includes(id)` → boolean). No `[]` or `{}` fallbacks in selectors. `runPassiveAnalysis` has explicit equality checks before `set()` (`:181-184`). |
| P-6 | **AR-15 — Edge Uniqueness Tuple** | PRESERVED | `narrativeStore.addEdge()` at `:116` — duplicate check uses `(sourceId, targetId, optionId)` tuple. Untouched by this iteration. |

### ACKNOWLEDGED RISK Items

| # | Item | Status | Evidence |
|---|------|--------|----------|
| AR-1 | **Live State Decoration** — old `--active`/`--visited`/`--reachable` replaced | CONTAINED | `--active` persists under new enum (same meaning). `--visited` retired → replaced by `--seen` with independent glyph overlay. `--reachable` still used for clickable-node pulse. Six-state enum classes added. Visual change contained to Phase 2. |
| AR-2 | **Pure Condition Routing** — selected-option filter | CONTAINED | Choice nodes filter by `selectedOptionId` at `simulationStore.js:12`. Non-choice nodes evaluate all outgoing edges (no filter applied). `conditionEvaluator.js` unchanged. |
| AR-3 | **Simulation/Editor Isolation** — `isRunning` → `isCampaignActive` | CONTAINED | Grep for live `isRunning` references in `src/`: only found in comments (`CHANGED: isRunning → isCampaignActive`). No functional references remain. |
| AR-4 | **Option ID stamping** — promoted to routing key | CONTAINED | Format stays `"opt-{uuid}"`. Edge creation untouched. Legacy null-`optionId` edges surface via passive reachability warnings (Phase 4). |

**Result:** All PROTECTED items PRESERVED with code-level evidence. All ACKNOWLEDGED RISK items CONTAINED.

---

## 4. Migration Integrity

**NOT APPLICABLE.** The migration strategy document (`ran_0303_migrationstrategy.md`) explicitly declares `NOT APPLICABLE`. All changes are ephemeral (`simulationStore`-only). No `schemaVersion` bump required. `exportGraph()` still outputs `schemaVersion: 4` (`narrativeStore.js:606`). Existing save files continue to load through `fileSystem.js` without change.

---

## 5. Architecture Compliance

| Rule | Status | Evidence |
|------|--------|----------|
| **AR-01 — Naming: Files** | PASS | New file `SandboxPanel.jsx` follows PascalCase. `simulationStore.js` remains camelCase with `store` suffix. |
| **AR-02 — Naming: Variables** | PASS | No new persisted entity IDs introduced. `selectedOptionId`, `sandboxOverrides` are ephemeral camelCase. |
| **AR-03 — State Management** | PASS | All new state lives in `simulationStore`. `SandboxPanel.jsx` uses no `useState` for graph data. `Sidebar.jsx:12` uses `useState('inspector')` for UI-only tab selection (correct). |
| **AR-04 — Data Layer Separation** | PASS | Components consume store state via selectors. No direct mutation of graph data from components. `selectOption` is a store action. |
| **AR-05 — Single Source of Truth** | PASS | `narrativeStore` shape unchanged: `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, `meta`. Only 3 stores. |
| **AR-06 — Import Constraints** | PASS | All imports use `'store'` and `'utils'` barrel paths. `SandboxPanel.jsx:2` imports from `'store'`. No circular imports between store files. |
| **AR-07 — Condition Evaluation** | PASS | All condition checks call `evaluateCondition`. No inline clause logic in `simulationStore.js` or components. |
| **AR-08 — Simulation Isolation** | PASS | `simulationStore` never writes to `narrativeStore`. `enterCampaign`/`exitCampaign`/`reset` all produce clean state transitions. Sandbox writes to `currentFlagValues` only. |
| **AR-09 — JSON Format Stability** | PASS | `schemaVersion` remains `4`. No new persisted fields added. Import validates `[1, 2, 3, 4]` (`fileSystem.js:73`). |
| **AR-10 — No External Backend** | PASS | No new `fetch`, `axios`, or network calls added. `SandboxPanel.jsx` is purely local state UI. |
| **AR-11 — Side Effect Placement** | PASS | Side effects fire on nodes (via `advance()`) and options (via `selectOption()`). No edge side effects. |
| **AR-12 — Node Type Constraints** | N/A | No changes to ending node outgoing handle logic. `EndingNode.jsx` still has no source handle. |
| **AR-13 — Sub-Array CRUD** | N/A | No changes to variant/option CRUD in this iteration. |
| **AR-14 — Zustand Selector Stability** | PASS | No selectors return `[]` or `{}` on miss. `s.nodeStates[id]` returns `undefined` on miss. `runPassiveAnalysis` checks equality before `set()`. |
| **AR-15 — Edge Uniqueness Tuple** | PASS | `addEdge` duplicate check at `narrativeStore.js:116` untouched. |

---

## 6. Regression Check

Behaviors from `ran_0301_understand.md` §7 that are **NOT** in the behavior delta:

| # | §7 Behavior | Status | Evidence |
|---|-------------|--------|----------|
| R-1 | **Live State Decoration** (raw narrative → simulation state overlay) | N/A — INTENTIONAL CHANGE | Explicitly accepted in blast radius. New six-state enum replaces three-state model. |
| R-2 | **Pure Condition Routing** (`computeReachable` evaluates flag-conditioned edges) | INTACT | `evaluateCondition` still called at `simulationStore.js:13`. AR-07 preserved. The **routing filter** is an intentional addition, not a regression. |
| R-3 | **Option ID stamping** (`onConnect` stamps `optionId` on edges from option handles) | INTACT | `GraphCanvas.jsx:157-158` — `params.sourceHandle.startsWith('opt-')` check and `addEdge(source, target, sourceHandle)` call unchanged. |
| R-4 | **Simulation/Editor Isolation** (simulation never mutates graph data) | INTACT | `simulationStore` reads `narrativeStore` via `getState()` only. No mutation calls to `narrativeStore` from `simulationStore`. AR-08 confirmed. |

**Result:** No regressions detected. All intentional changes are correctly identified and not flagged as regressions.

---

## 7. Final Verdict

### **SHIP** ✅

The Campaign Mode Rewire iteration is complete and stable. All four phases executed successfully with clean test suites. The six-state node enum, seen tracking, selected-option routing, passive structural analysis, and sandbox overrides are fully implemented. All six PROTECTED architecture invariants (AR-05, AR-07, AR-08, AR-11, AR-14, AR-15) are preserved with code-level evidence and confirmation comments. All four ACKNOWLEDGED RISK items are contained within their declared blast radius. No regressions were detected. The system is ready for `0309 Document`.
