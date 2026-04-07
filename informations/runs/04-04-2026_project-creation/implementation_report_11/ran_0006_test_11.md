# Phase 11 — Campaign System: Test Report

> **Phase:** 11 — Campaign System
> **Date:** 2026-04-07
> **Test Status:** ✅ 109 passed, 0 failed

---

## Summary

Comprehensive test suite covering all Phase 11 logic functions: campaign store CRUD, simulation store overrides, stale reference pruning (R-03), persistence data structure, and state isolation (AR-10). All 109 assertions pass.

---

## Test Coverage

| Section | Function / Area | Tests | Status |
|---------|----------------|-------|--------|
| **A** | `createCampaign` | 14 | ✅ |
| **B** | `switchCampaign` | 5 | ✅ |
| **C** | `deleteCampaign` | 7 | ✅ |
| **D** | `resetActiveCampaign` | 9 | ✅ |
| **E** | `saveCampaign` | 7 | ✅ |
| **F** | `renameCampaign` | 2 | ✅ |
| **G** | `loadCampaigns` | 7 | ✅ |
| **H** | `getActiveCampaign` | 4 | ✅ |
| **I** | Simulation Store Overrides | 10 | ✅ |
| **J** | Stale Reference Pruning (R-03) | 24 | ✅ |
| **K** | Persistence Data Structure | 12 | ✅ |
| **L** | State Isolation (AR-10) | 8 | ✅ |
| | **Total** | **109** | **✅** |

---

## Test Details

### A. `createCampaign` (14 tests)
- **Happy path:** Creates campaign with correct ID prefix (`campaign_`), stores in state, auto-switches
- **Defaults:** `nodeStates: {}`, `flagOverrides: {}`, `statusOverrides: {}`, `createdAt`, `updatedAt` populated
- **AR-07:** Name sanitized (`"Test Campaign"` → `"test_campaign"`)
- **AR-06:** 5 campaigns produce 5 unique IDs
- **Edge:** `switchTo: false` keeps active unchanged; empty name → `"untitled_campaign"`; special chars sanitized

### B. `switchCampaign` (5 tests)
- **Happy path:** Switches active campaign, returns campaign data
- **Failure:** Nonexistent ID returns `null`, active unchanged

### C. `deleteCampaign` (7 tests)
- **Happy path:** Removes campaign from store; if active → `activeCampaignId = null`
- **Edge:** Delete non-active → active unchanged; delete nonexistent → no-op

### D. `resetActiveCampaign` (9 tests)
- **Happy path:** Clears `nodeStates`, `flagOverrides`, `statusOverrides` to `{}`; preserves name/id
- **Edge:** No active campaign → no-op

### E. `saveCampaign` (7 tests)
- **Happy path:** Snapshots simulation state into active campaign
- **Edge:** No active campaign → no-op; `updatedAt` timestamp updated

### F. `renameCampaign` (2 tests)
- **Happy path:** Renames with sanitization (AR-07)
- **Edge:** Nonexistent campaign → no-op

### G. `loadCampaigns` (7 tests)
- **Happy path:** Loads full campaigns map, sets `activeCampaignId`
- **Edge:** Invalid `activeId` → null; empty data replaces all; null data → empty

### H. `getActiveCampaign` (4 tests)
- **Happy path:** Returns active campaign data
- **Edge:** No active → null; after delete → null

### I. Simulation Store Overrides (10 tests)
- Flag/status override set/clear lifecycle
- Multiple coexisting overrides
- `resetSimulation` clears all

### J. Stale Reference Pruning (24 tests)
- Validates pruning logic for stale `nodeStates`, `flagOverrides`, `statusOverrides`
- Verifies valid references preserved, stale references stripped
- Multi-category pruning (5 stale across all categories)
- Edge: empty campaign, undefined fields, Choice/Ending node IDs recognized

### K. Persistence Data Structure (12 tests)
- Campaign snapshot shape validation (all 7 required fields present, correct types)
- Data integrity after save operations

### L. State Isolation — AR-10 (8 tests)
- Campaign store has no narrative fields (`common`, `flag`, `status`)
- Simulation overrides don't affect campaign until `saveCampaign` called
- After save, simulation state snapshotted into campaign

---

## Issues Found During Testing

### 1. `setState(data, true)` destroys Zustand actions

**Bug:** The initial test helper `resetStores()` used `useCampaignStore.setState({...}, true)` — the `true` flag causes Zustand to **replace** the entire state including action functions, making all store methods undefined (`createCampaign is not a function`).

**Fix:** Removed the `true` replace flag. Zustand's default `setState` does a shallow merge, preserving action functions.

**Impact:** Test-only issue (the production code never uses `setState(_, true)`). No production code affected.

---

## Architecture Rule Verification

| Rule | Verified By |
|------|-------------|
| AR-02 | Section L — Campaign state in `useCampaignStore`, not in components |
| AR-05 | Section A — All defaults are `{}` or `[]`, never null |
| AR-06 | Section A.14 — 5 unique IDs generated |
| AR-07 | Sections A, F — Names sanitized in store, not UI |
| AR-10 | Section L — Campaign state completely separate from narrative data |

---

## Run Command

```bash
node --import ./src/tests/_register.mjs src/tests/__test_phase11.js
```

## Test File

`src/tests/__test_phase11.js`
