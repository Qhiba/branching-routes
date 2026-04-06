# Phase 2 — Utility Layer — Self-Review Report

> **Prompt:** `0005_self-review.md` (Phase 2)
> **Date:** 2026-04-05
> **Input:** Phase 2 code (`src/utils/*.js`), execution report (`ran_0004_execute_2.md`)

---

## Issues Found

### Issue 1 — ✅ RESOLVED — `entityDefaults.js`, `createCommonNode` line 33

**Rule violated:** Data model §4.1 — Common Node `name` default is `""`, not `"untitled_node"`.

**What the code does:**
```js
name: sanitizeName(overrides.name ?? 'untitled_node'),
```

**What it should do:**
The data model specifies `name` default is `""` (empty string). The factory injects a non-empty default name `"untitled_node"` which doesn't match the schema. Same issue in:
- `createEnding` line 100: `'untitled_ending'` → should be `''`
- `createFlag` line 127: `'untitled_flag'` → should be `''`
- `createStatusPoint` line 150: `'untitled_status'` → should be `''`
- `createPath` line 175: `'untitled_path'` → should be `''`
- `createChapter` line 191: `'untitled_chapter'` → should be `''`

---

### Issue 2 — IGNORED — `entityDefaults.js`, `createStatusPoint` line 153

**Rule violated:** Data model §4.1 — Status Point `value` default is `0`.

**What the code does:**
```js
value: overrides.value ?? 0,
```

**What it should do:**
The `??` operator won't catch `overrides.value = 0` (which is fine since `0` is the default). However, the issue is that `overrides.value = false` would pass through as `false` instead of `0`. This is a minor edge case since the store layer should validate types, but worth noting for correctness. **Low severity — the store layer will enforce typing.**

---

### Issue 3 — ✅ RESOLVED — `conditionEval.js`, `evaluateSingle` line 99

**Rule violated:** Data model §4.2 — Status condition requires "at least one of `min` or `max` must be present."

**What the code does:**
```js
// Status condition with no min/max — no constraint, passes
return true;
```

**What it should do:**
Per data model §4.2: "(`min` and `max` are each optional — at least one must be present.)" A status condition with neither `min` nor `max` is structurally invalid. This should return `false` (fail the condition) since a status condition without `min` or `max` is malformed, similar to how empty flag/status IDs are handled. **Medium severity — silently passes an invalid condition.**

---

## Universal Checks

### Dead code
**PASS** — No unused imports, variables, or functions. Both imports in `entityDefaults.js` (`generateId`, `sanitizeName`) are used. The single import in `idTransform.js` (`generateId`) is used. No other files have imports.

### Consistency
**PASS** — All files follow the same patterns:
- `camelCase.js` naming (AR-01 ✅)
- JSDoc on every exported function
- Same header comment block format
- Consistent use of `??` for default fallbacks
- Consistent use of optional chaining `?.` for nested property access

### Completeness
**PASS** — All 6 files from the plan's file map exist:
- [x] `src/utils/generateId.js`
- [x] `src/utils/sanitizeName.js`
- [x] `src/utils/deepEqual.js`
- [x] `src/utils/conditionEval.js`
- [x] `src/utils/entityDefaults.js`
- [x] `src/utils/idTransform.js`

---

## Summary

| # | File | Issue | Severity | Rule |
|---|------|-------|----------|------|
| 1 | `entityDefaults.js` | Default names should be `""` not `"untitled_*"` | **High** | Data model §4.1 |
| 2 | `entityDefaults.js` | `value: overrides.value ?? 0` edge case with `false` | **Low** | Data model §4.1 |
| 3 | `conditionEval.js` | Status condition with no `min`/`max` should fail | **Medium** | Data model §4.2 |

**3 issues found.** Issues #1 and #3 require code changes. Issue #2 is negligible (store layer handles typing).
