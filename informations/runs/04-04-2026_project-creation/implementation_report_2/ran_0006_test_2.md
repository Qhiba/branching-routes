# Phase 2 — Utility Layer — Test Report

> **Prompt:** `0006_test.md` (Phase 2)
> **Date:** 2026-04-05
> **Input:** Phase 2 code (`src/utils/*.js`), execution report (`ran_0004_execute_2.md`)

---

## Test Approach

Manual browser-style testing via `console.log` assertions in `src/utils/__test_phase2.js`. Run with `node src/utils/__test_phase2.js`. Each test prints PASS/FAIL with a description.

## Test File

`src/utils/__test_phase2.js`

---

## Results

### **256 passed, 0 failed**

---

## Test Coverage Breakdown

### `generateId` (5 tests)
| # | Test | Result |
|---|------|--------|
| 1 | Returns a string with correct format (prefix_timestamp_4rand) | PASS |
| 2 | 100 calls produce 100 unique IDs (no module-level state) | PASS |
| 3 | Different prefixes (opt, variant, route) all work | PASS |
| 4 | Has 3 parts separated by underscores | PASS |
| 5 | Empty prefix produces leading underscore | PASS |

### `sanitizeName` (16 tests)
| # | Test | Result |
|---|------|--------|
| 1 | `"My Scene Name!"` → `"my_scene_name_"` | PASS |
| 2 | `"hello-world 123"` → `"hello_world_123"` | PASS |
| 3 | `"UPPER_case"` → `"upper_case"` | PASS |
| 4 | `"already_valid"` → unchanged | PASS |
| 5 | `"abc123"` → unchanged | PASS |
| 6 | Empty string → empty string | PASS |
| 7 | Single char | PASS |
| 8 | Single uppercase → lowercase | PASS |
| 9 | `"!!!"` → `"___"` | PASS |
| 10 | `"a--b"` → `"a__b"` (no collapse) | PASS |
| 11 | `"café"` → `"caf_"` (non-ascii) | PASS |
| 12 | `"hello world"` → `"hello_world"` | PASS |
| 13 | null → empty string | PASS |
| 14 | undefined → empty string | PASS |
| 15 | number → empty string | PASS |
| 16 | object → empty string | PASS |

### `deepEqual` (23 tests)
| # | Test | Result |
|---|------|--------|
| 1–5 | Primitive equality (numbers, strings, booleans, null, undefined) | PASS |
| 6–8 | Object equality (simple, key-order insensitive, nested) | PASS |
| 9–10 | Array equality (flat, array of objects) | PASS |
| 11–18 | Inequality (different values, extra/missing keys, array order, length) | PASS |
| 19–22 | Edge cases (null vs undefined, 0 vs false, array vs object, empty collections) | PASS |
| 23 | Data-model condition group comparison | PASS |

### `evaluateCondition` (29 tests)
| # | Test | Result |
|---|------|--------|
| 1–2 | Empty groups pass (AND and OR) | PASS |
| 3–5 | Flag conditions (true, false, missing → defaults false) | PASS |
| 6–11 | Status conditions (min-only, max-only, range, boundary) | PASS |
| 12 | Negative status values | PASS |
| 13–14 | AND logic (all true, one false) | PASS |
| 15–16 | OR logic (one true, all false) | PASS |
| 17–18 | Nested groups (complex real-world condition) | PASS |
| 19–22 | Edge cases (null, undefined, empty object, missing conditions) | PASS |
| 23–24 | Empty flag/status IDs → FAIL (invalid data) | PASS |
| 25 | Status with no min/max → FAIL (malformed) | PASS |
| 26 | Unknown operator → FAIL | PASS |
| 27 | Unknown condition type → FAIL | PASS |
| 28–29 | Missing status defaults to 0 | PASS |

### `createCommonNode` (17 tests)
| # | Test | Result |
|---|------|--------|
| 1–12 | All 12 fields present with correct defaults | PASS |
| 13 | Field ordering matches data model principle | PASS |
| 14 | Exactly 12 fields (no extras) | PASS |
| 15–17 | Overrides accepted, names sanitized (AR-07) | PASS |

### `createChoice` (12 tests)
| # | Test | Result |
|---|------|--------|
| 1–7 | All 7 fields present with correct defaults | PASS |
| 8–11 | No name, next, flags_set, status_set on Choice (correct per data model) | PASS |
| 12 | Field ordering matches data model | PASS |

### `createEnding` (12 tests)
| # | Test | Result |
|---|------|--------|
| 1–7 | All 7 fields present with correct defaults | PASS |
| 8–11 | No next, flags_set, status_set, variants on Ending | PASS |
| 12 | Field ordering matches data model | PASS |

### `createFlag` (8 tests)
| # | Test | Result |
|---|------|--------|
| 1–5 | All 5 fields present with correct defaults | PASS |
| 6 | Field ordering matches data model | PASS |
| 7 | No _position (not a graph node) | PASS |
| 8 | No requires field | PASS |

### `createStatusPoint` (8 tests)
| # | Test | Result |
|---|------|--------|
| 1–7 | All 7 fields present with correct defaults | PASS |
| 8 | Field ordering matches data model | PASS |

### `createPath` (5 tests)
| # | Test | Result |
|---|------|--------|
| 1–2 | id and name with correct defaults | PASS |
| 3–4 | Exactly 2 fields | PASS |
| 5 | Name sanitized (AR-07) | PASS |

### `createChapter` (5 tests)
| # | Test | Result |
|---|------|--------|
| 1–2 | id and name with correct defaults | PASS |
| 3–4 | Exactly 2 fields | PASS |
| 5 | Name sanitized (AR-07) | PASS |

### Entity Factory Independence (6 tests)
| # | Test | Result |
|---|------|--------|
| 1–5 | Two calls produce independent objects (different refs, different IDs) | PASS |
| 6 | Mutation of one does not affect another | PASS |

### `toHierarchicalIds` (27 tests)
| # | Test | Result |
|---|------|--------|
| 1 | Original data not mutated (deep clone) | PASS |
| 2–4 | Top-level IDs preserved (N001, CH001, E001) | PASS |
| 5 | Common Node conditions → N001_COND001 | PASS |
| 6–7 | Common Node variants → N001_VAR001, N001_VAR001_COND001 | PASS |
| 8 | Common Node next → N001_NE001 | PASS |
| 9–12 | Choice conditions with nested OR → flat counter (COND001, COND002, COND003) | PASS |
| 13–14 | Choice options → CH001_OPT001, option next → CH001_OPT001_NE001 | PASS |
| 15 | 4-level deep: CH001_OPT001_NE001_COND001 | PASS |
| 16–17 | Ending conditions → E001_COND001, E001_COND002 | PASS |
| 18–27 | All non-ID fields preserved (name, description, flags, targets, metadata, etc.) | PASS |

### `toRuntimeIds` (19 tests)
| # | Test | Result |
|---|------|--------|
| 1 | Exported data not mutated | PASS |
| 2–4 | Top-level IDs preserved on import | PASS |
| 5–14 | All sub-element IDs replaced with correct prefixes (cond_, variant_, route_, opt_) | PASS |
| 15–19 | All non-ID fields preserved through round-trip | PASS |

### Round-trip Data Integrity (19 tests)
| # | Test | Result |
|---|------|--------|
| 1–9 | All 9 collection keys present after round-trip | PASS |
| 10–16 | Entity counts preserved across all collections | PASS |
| 17–19 | Field counts preserved (12 for node, 7 for choice, 7 for ending) | PASS |

### Edge Cases — Empty/Minimal Data (9 tests)
| # | Test | Result |
|---|------|--------|
| 1–6 | Empty collections survive export and import | PASS |
| 7–9 | Entity with empty sub-element arrays survives export | PASS |

---

## Architecture Rules Verified by Tests

| Rule | Tests Covering It |
|------|-------------------|
| AR-03 | createCommonNode, createChoice, createEnding — `requires` defaults verified |
| AR-04 | createCommonNode — `next` defaults to `[]` |
| AR-05 | All factories — every array field defaults to `[]` |
| AR-06 | generateId — unique, no module-level state; ID transform tests |
| AR-07 | createCommonNode, createPath, createChapter — name sanitization |
| AR-10 | createCommonNode, createChoice, createEnding — `_position` field present |
