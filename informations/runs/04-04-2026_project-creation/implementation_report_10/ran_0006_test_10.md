# Phase 10 — Simulation Engine: Test Report

> **Phase:** 10 — Simulation Engine
> **Date:** 2026-04-07
> **Test file:** `src/tests/__test_phase10.js`
> **Run command:** `node --import ./src/tests/_register.mjs src/tests/__test_phase10.js`

---

## Results

```
75 passed, 0 failed — ALL TESTS PASSED
```

---

## Test Groups

### Group 1: `recalculate()` — Happy Paths (18 tests)

| # | Test | Result |
|---|------|--------|
| 1.1 | Minimal narrative: evaluatedEdges is empty object | PASS |
| 1.2 | Minimal narrative: no unreachable nodes | PASS |
| 1.3 | Minimal narrative: no auto-lock suggestions | PASS |
| 1.4 | Linear chain: edge N001→N002 passes (unconditional) | PASS |
| 1.5 | Linear chain: edge N002→E001 passes (unconditional) | PASS |
| 1.6 | Linear chain: all nodes reachable from entry | PASS |
| 1.7 | Branching: conditional edge fails (F001=false) | PASS |
| 1.8 | Branching: unconditional edge passes | PASS |
| 1.9 | Branching: N002 unreachable (only edge fails) | PASS |
| 1.10 | Branching: N003 reachable (unconditional) | PASS |
| 1.11 | Branching: entry node always reachable | PASS |
| 1.12 | Flag override makes conditional edge pass | PASS |
| 1.13 | Flag override makes node reachable | PASS |
| 1.14 | Choice: N001→CH001 unconditional edge passes | PASS |
| 1.15 | Choice: fight option edge fails (F001=false) | PASS |
| 1.16 | Choice: flee option edge passes (unconditional) | PASS |
| 1.17 | Choice: E001 unreachable (fight edge fails) | PASS |
| 1.18 | Choice: E002 reachable (flee edge passes) | PASS |

### Group 2: `recalculate()` — Edge Cases (13 tests)

| # | Test | Result |
|---|------|--------|
| 2.1 | Empty narrative: no evaluated edges | PASS |
| 2.2 | Empty narrative: no unreachable nodes | PASS |
| 2.3 | Missing entry node: all nodes unreachable | PASS |
| 2.4 | Missing entry node: unreachable count = total nodes | PASS |
| 2.5 | Null entry node: all nodes unreachable | PASS |
| 2.6 | Status range: value within range → passes | PASS |
| 2.7 | Status min: value below min → fails | PASS |
| 2.8 | Status override changes result | PASS |
| 2.9 | Source node requires also checked for edges | PASS |
| 2.10 | OR operator: at least one condition passes | PASS |
| 2.11 | Nested groups: AND(OR(false, true)) = true | PASS |
| 2.12 | Missing flag defaults to false | PASS |
| 2.13 | Missing status defaults to 0 | PASS |

### Group 3: `recalculate()` — Auto-Lock Suggestions (6 tests)

| # | Test | Result |
|---|------|--------|
| 3.1 | Unreachable + default status → suggested | PASS |
| 3.2 | Unreachable + locked → NOT suggested | PASS |
| 3.3 | Unreachable + branch_locked → NOT suggested | PASS |
| 3.4 | Unreachable + complete → NOT suggested | PASS |
| 3.5 | Unreachable + failed → NOT suggested | PASS |
| 3.6 | Unreachable + active → suggested (non-terminal) | PASS |

### Group 4: `findUnreachableNodes()` — Direct Tests (9 tests)

| # | Test | Result |
|---|------|--------|
| 4.1 | All edges pass: no unreachable nodes | PASS |
| 4.2 | First edge fails: downstream unreachable | PASS |
| 4.3 | Entry node always reachable | PASS |
| 4.4 | Undefined evaluation → treated as passable | PASS |
| 4.5 | No entry node: all unreachable | PASS |
| 4.6 | Nonexistent entry: all unreachable | PASS |
| 4.7 | Disconnected island: unreachable | PASS |
| 4.8 | Only island is unreachable | PASS |
| 4.9 | Cycle: BFS handles without infinite loop | PASS |

### Group 5: `evaluateCondition()` — Direct Tests (19 tests)

| # | Test | Result |
|---|------|--------|
| 5.1 | Empty AND group → passes | PASS |
| 5.2 | null group → passes | PASS |
| 5.3 | undefined group → passes | PASS |
| 5.4 | Flag true match → passes | PASS |
| 5.5 | Flag mismatch → fails | PASS |
| 5.6 | Status min: 10 >= 5 → passes | PASS |
| 5.7 | Status min: 3 < 5 → fails | PASS |
| 5.8 | Status max: 8 <= 10 → passes | PASS |
| 5.9 | Status max: 15 > 10 → fails | PASS |
| 5.10 | Status range: value in range → passes | PASS |
| 5.11 | Status range: below min → fails | PASS |
| 5.12 | Status range: above max → fails | PASS |
| 5.13 | Status range: min boundary → passes | PASS |
| 5.14 | Status range: max boundary → passes | PASS |
| 5.15 | Empty flag ID → fails | PASS |
| 5.16 | Empty status ID → fails | PASS |
| 5.17 | Status no min/max → malformed, fails | PASS |
| 5.18 | Unknown operator "xor" → fails | PASS |
| 5.19 | Unknown condition type → fails | PASS |

### Group 6: `recalculate()` — Data Model Integrity (10 tests)

| # | Test | Result |
|---|------|--------|
| 6.1 | Return shape has all 3 fields | PASS |
| 6.2 | evaluatedEdges is plain object | PASS |
| 6.3 | unreachableNodes is a Set | PASS |
| 6.4 | autoLockSuggestions is an array | PASS |
| 6.5 | All edge IDs start with "edge-" | PASS |
| 6.6 | Common edge ID format correct | PASS |
| 6.7 | Choice edge ID format includes optionId | PASS |
| 6.8 | All evaluatedEdges values are booleans | PASS |
| 6.9 | Unreachable IDs all exist in graph | PASS |
| 6.10 | autoLockSuggestions entries are strings | PASS |

---

## Coverage Summary

| Module | Functions Tested | Coverage |
|--------|-----------------|----------|
| `simulationEngine.js` | `recalculate()`, `buildFlagMap()`, `buildStatusMap()`, `evaluateAllEdges()`, `computeAutoLockSuggestions()` | Full (all via `recalculate()` integration) |
| `reachability.js` | `findUnreachableNodes()`, `buildAdjacencyList()` | Full (direct + integration) |
| `conditionEval.js` | `evaluateCondition()`, `evaluateSingle()` | Full (direct tests) |
| `useSimulationSync.js` | Hook lifecycle | Not tested (requires React context + browser) |

> **Note:** `useSimulationSync.js` is excluded from automated testing because it is a React hook that manages Zustand subscriptions and `setTimeout` lifecycle — it requires a browser environment with React rendering. Its correct behavior was verified manually (infinite loop fix, shallowEqual subscription, debounce timing).

---

## Test Infrastructure

- **Loader:** Created `src/tests/_loader.mjs` (Node.js ESM resolve hook for `@/` alias) and `src/tests/_register.mjs` (registration entrypoint)
- **Run command:** `node --import ./src/tests/_register.mjs src/tests/__test_phase10.js`
- **Fixtures:** 4 inline fixtures covering minimal, linear chain, branching with conditions, and choice with options narratives
