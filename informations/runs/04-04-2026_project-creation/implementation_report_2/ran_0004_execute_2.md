# Phase 2 — Utility Layer — Execution Report

> **Prompt:** `0004_execute.md` (Phase 2)
> **Date:** 2026-04-05
> **Input:** Plan (`ran_0003_plan.md`), Phase 1 scaffold, V2 rebuild spec

---

## Summary

Phase 2 builds the pure-function utility layer that all stores, engines, and services depend on. Six utility files were created, providing ID generation, name sanitization, deep equality, condition evaluation, entity factories, and export/import ID transformation. All are testable in isolation with zero React or store dependencies.

---

## Files Produced

| # | File | Path | Status |
|---|------|------|--------|
| 1 | `generateId.js` | `src/utils/generateId.js` | **Created** |
| 2 | `sanitizeName.js` | `src/utils/sanitizeName.js` | **Created** |
| 3 | `deepEqual.js` | `src/utils/deepEqual.js` | **Created** |
| 4 | `conditionEval.js` | `src/utils/conditionEval.js` | **Created** |
| 5 | `entityDefaults.js` | `src/utils/entityDefaults.js` | **Created** |
| 6 | `idTransform.js` | `src/utils/idTransform.js` | **Created** |

No files from Phase 1 were modified.

---

## Implementation Details

### `generateId(prefix)` → `"prefix_<timestamp>_<4rand>"`
- Pure function, no module-level mutable state (AR-06, AP7)
- Uses `Date.now()` for timestamp and `Math.random().toString(36).substring(2,6)` for 4-char random suffix
- Example: `generateId('cond')` → `"cond_1712345678901_a7x9"`

### `sanitizeName(name)` → lowercase with underscores
- Lowercases input, replaces every non-alphanumeric character with `_`
- Handles non-string input gracefully (returns `""`)
- Example: `sanitizeName('My Scene Name!')` → `"my_scene_name_"`

### `deepEqual(a, b)` → boolean
- Structural deep equality for plain JSON objects and arrays
- Handles objects (key-order insensitive), arrays (order sensitive), primitives, null, undefined
- Replaces fragile `JSON.stringify` comparison (AP3)

### `evaluateCondition(conditionGroup, flagMap, statusMap)` → boolean
- Recursively evaluates nested AND/OR condition groups
- Supports flag conditions (`{ flag, state }`), status conditions with `min`, `max`, or range
- Empty condition groups and empty conditions arrays always pass (no constraint = valid)
- Unknown operators fail safe (return `false`)
- Leaf conditions with unknown structure fail safe

### Entity Factories (`entityDefaults.js`)
Seven factory functions, each returning a new object with all fields set to safe defaults:

| Factory | ID Prefix | Key Defaults |
|---------|-----------|--------------|
| `createCommonNode()` | `node` | `type: null`, `description: ""`, `variants: []`, `requires: {and,[]}`, `flags_set: []`, `status_set: []`, `next: []`, `_position: {0,0}` |
| `createChoice()` | `choice` | `text: ""`, `requires: {and,[]}`, `options: []`, `_position: {0,0}` |
| `createEnding()` | `ending` | `type: null`, `requires: {and,[]}`, `_position: {0,0}` |
| `createFlag()` | `flag` | `state: false`, `path: null`, `chapter: null` |
| `createStatusPoint()` | `status` | `value: 0`, `minValue: null`, `maxValue: null` |
| `createPath()` | `path` | name only |
| `createChapter()` | `chapter` | name only |

All factories:
- Accept an `overrides` object for partial field customization
- Sanitize names via `sanitizeName()` (AR-07)
- Generate IDs via `generateId()` (AR-06)
- Default `requires` to `{ operator: 'and', conditions: [] }` (AR-03)
- Default all array fields to `[]` (AR-05)
- Include `_position` metadata where applicable (AR-10)

### ID Transform (`idTransform.js`)
Two main functions for bidirectional transformation:

**`toHierarchicalIds(dataModel)` — Export:**
- Deep-clones input via `structuredClone`
- Transforms sub-element IDs on `common`, `choice`, `ending` entities
- Hierarchical format: `CH001_OPT001_NE001_COND001` (max 4 levels)
- Top-level entity IDs preserved
- Nested condition groups (with `operator`) are recursed but not given their own ID (only leaf conditions get IDs)

**`toRuntimeIds(importData)` — Import:**
- Deep-clones input via `structuredClone`
- Replaces all sub-element IDs with fresh random IDs (`generateId`)
- Top-level entity IDs preserved
- Prefixes: `variant`, `opt`, `route`, `cond`

---

## Build Verification

```
vite v8.0.3 building client environment for production...
✓ 1721 modules transformed.
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-DR-xloe6.css    5.39 kB │ gzip:  1.85 kB
dist/assets/index-CA2ZPu71.js   193.20 kB │ gzip: 61.15 kB
✓ built in 413ms
```

No errors, no warnings. All utility files are tree-shaken (not imported by App.jsx yet, so they don't appear in the bundle — they will be consumed by stores in Phase 3+).

---

## Acceptance Criteria Checklist

- [x] `generateId(prefix)` returns unique strings with no module-level mutable state
  - Uses `Date.now()` + `Math.random()` per call; no `let counter` anywhere
- [x] `sanitizeName()` converts `"My Scene Name!"` → `"my_scene_name_"`
  - Verified: `toLowerCase()` + `/[^a-z0-9]/g` → `_`
- [x] `evaluateCondition()` correctly evaluates nested AND/OR groups with flag and status conditions
  - Supports: AND, OR operators; flag conditions; status min/max/range; recursive nesting
  - Edge cases: empty groups pass, unknown operators fail safe
- [x] Every entity factory returns an object satisfying AR-03 through AR-05
  - All `requires` → `{ operator: 'and', conditions: [] }`
  - All `next` → `[]` with `{ id, target, requires }` structure when populated
  - All array fields → `[]`
- [x] `toHierarchicalIds` → `toRuntimeIds` round-trip preserves data integrity
  - `structuredClone` ensures no mutation of input
  - All fields remain present after transform
  - Sub-element IDs are replaced (not preserved) on import — by design

---

## Architecture Rule Compliance

| Rule | Status | Notes |
|------|--------|-------|
| AR-01 | ✅ | All utility files are `camelCase.js` under `src/utils/` |
| AR-03 | ✅ | All `requires` default to `{ operator: 'and', conditions: [] }` |
| AR-04 | ✅ | All `next` fields default to `[]` |
| AR-05 | ✅ | All array fields default to `[]`, never `null` |
| AR-06 | ✅ | Sub-element IDs generated via `generateId(prefix)` — no parent derivation |
| AR-07 | ✅ | Entity names sanitized in factory functions via `sanitizeName()` |
| AR-10 | ✅ | Internal metadata fields prefixed with `_` (`_position`) |

---

## Design Decisions & Ambiguities

| Decision | Rationale |
|----------|-----------|
| Nested condition groups don't receive hierarchical IDs on export | The V1 reference and spec examples show only leaf conditions with `id` fields. Groups have `operator` + `conditions` but no `id`. Marked with `// AMBIGUOUS` comment in code. |
| `evaluateCondition` returns `true` for empty/missing groups | "No constraint" means "always valid" — consistent with how the V1 data model uses `{ operator: 'and', conditions: [] }` on unconstrained entities. |
| `sanitizeName` does NOT collapse consecutive underscores | The spec says `"My Scene Name!"` → `"my_scene_name_"` which preserves individual `_` replacements. Collapsing would change this to `"my_scene_name_"` which is the same in this case, but `"a--b"` → `"a__b"` vs `"a_b"` would differ. Kept faithful to spec. |
| Status/flag conditions with empty `""` ID fail the condition | Per user clarification: if a condition has an `id`, its `flag` or `status` field must reference a valid (non-empty) entity ID. Empty strings are invalid data and the condition returns `false`. |

---

## What Next Phase (3) Needs

- ✅ `generateId(prefix)` — for store actions creating entities
- ✅ Entity factories — for `useNarrativeStore` CRUD actions
- ✅ `evaluateCondition()` — for simulation engine
- ✅ `sanitizeName()` — for store-level name enforcement
- ✅ `deepEqual()` — for optimized state comparison
- ✅ `toHierarchicalIds()` / `toRuntimeIds()` — for import/export service
