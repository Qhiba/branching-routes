# Phase 5 — Persistence Layer: Self-Review Report

> **Prompt:** `0005_self-review.md`
> **Phase:** 5 — Persistence Layer
> **Date:** 2026-04-06
> **Input:** `ran_0004_execute_5.md`

---

## Review Result: **PASS** (1 resolved, 2 informational notes)

---

## Issues

### 1. Dead import — ✅ Solved — `toHierarchicalIds` unused in `importExport.js`

- **File:** `src/services/importExport.js`, line 18
- **Rule violated:** Universal check #1 — Dead code
- **What the code does:**
  ```js
  import { toHierarchicalIds, toRuntimeIds } from '../utils/idTransform.js';
  ```
  `toHierarchicalIds` is imported but never called anywhere in the file. The export path (`exportJSON()`) delegates to `useNarrativeStore.getState().toExportJSON()`, which internally calls `toHierarchicalIds` — the import here is unused.
- **What it should do:** Remove `toHierarchicalIds` from the import statement:
  ```js
  import { toRuntimeIds } from '../utils/idTransform.js';
  ```

---

### 2. ℹ️ By Design — `toRuntimeIds` called twice on import — `importJSON()` and `importZIP()` apply it, then `loadFromJSON()` applies it again

- **File:** `src/services/importExport.js`, lines 100 and 109 (JSON import); lines 217 and 282 (ZIP import)
- **Rule violated:** Universal check #2 — Consistency (import pipeline duplicates runtime ID transformation)
- **What the code does:**
  `importJSON()` calls `toRuntimeIds(parsed)` at line 100, then passes the result to `useNarrativeStore.getState().loadFromJSON(withRuntimeIds)` at line 109. However, `loadFromJSON` (in `useNarrativeStore.js`, line 977) *also* calls `toRuntimeIds(json)` on the incoming data. This means sub-element IDs are regenerated twice — the first pass's IDs are silently discarded.

  The same pattern repeats in `importZIP()` at lines 217 and 282.
- **Assessment:** This is **by design**. `loadFromJSON()` is a general-purpose store action designed to safely accept any valid JSON data model — whether from import, IndexedDB restore, or any future caller. It applies `toRuntimeIds` defensively so it's always safe to call regardless of source. The import service applies it as part of its own validation pipeline for self-containment. The double call replaces random IDs with different random IDs — functionally harmless. Each layer ensures correctness independently, so neither depends on the other having done it first. This is a deliberate robustness trade-off.
- **Verdict:** No change needed.

---

### 3. ℹ️ Note — Plan file map lists `entityDefaults` as a dependency of `importExport.js`, but it is not imported or used

- **File:** `src/services/importExport.js` (entire file)
- **Rule violated:** Universal check #3 — Completeness (plan vs. implementation mismatch)
- **What the code does:** The file does not import or use `entityDefaults.js`. The plan's §3 file map (line 430) lists `entityDefaults` as a dependency of `importExport.js`.
- **Assessment:** The import is not actually needed — `importExport.js` doesn't create new entities, it transforms existing ones. The plan entry listed it anticipatorily; the implementation found `enforceDataStructureRules()` sufficient. If a future phase needs it for defensive import merging, the import can be added then. No code change needed — plan documentation note only.

---

## Summary

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | ✅ Resolved | `importExport.js:18` | Dead import `toHierarchicalIds` — removed |
| 2 | ℹ️ By Design | `importExport.js:100,109,217,282` | Double `toRuntimeIds` — deliberate defensive robustness, no change needed |
| 3 | ℹ️ Note | Plan §3 vs `importExport.js` | Plan lists `entityDefaults` dependency anticipatorily, not needed now |

**AR compliance checks (all pass):**
- AR-03 ✅ — `ensureConditionGroup()` correctly validates/defaults all `requires` fields
- AR-04 ✅ — `ensureNextArray()` correctly validates/filters all `next` fields
- AR-05 ✅ — `ensureArray()` defaults all array-type fields to `[]`
- AR-07 ✅ — `sanitizeAllEntityNames()` runs on import (regardless of double-call issue)
- AR-08 ✅ — All `localforage` operations surface errors via `showPersistError()`; no `.catch(() => {})` found
- AR-09 ✅ — N/A (no CSS in these files)
- AR-10 ✅ — `_position` defaults enforced in `enforceDataStructureRules()`

**Completeness check:**
- `src/services/persistence.js` ✅ — exists, exports match plan
- `src/services/importExport.js` ✅ — exists, exports match plan
- All referenced store methods (`showPersistError`, `clearPersistError`, `loadFromJSON`, `toExportJSON`, `loadCampaigns`) verified to exist in their respective stores
