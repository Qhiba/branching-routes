# Phase 3 — Self-Review Report

> **Prompt:** `0005_self-review.md`
> **Date:** 2026-04-06
> **Phase:** 3 — Zustand Stores (Narrative)
> **File reviewed:** `src/store/useNarrativeStore.js` (1124 lines)

---

## Issues Found

### 1. Dead code — `addConditionToGroup` is never called

- **File:** `useNarrativeStore.js`, lines 112–123
- **Rule violated:** Universal check — Dead code
- **What the code does:** Defines a recursive helper function `addConditionToGroup(conditionGroup, condition, targetGroupId)` that walks a condition tree looking for a group matching `targetGroupId`, then pushes a condition to it.
- **What actually happens:** The store's `addCondition` action (line 927–953) resolves the target condition group via `resolveConditionGroupPath`, then directly calls `targetGroup.conditions.push(condition)`. The `addConditionToGroup` function is never referenced anywhere.
- **Fix:** Remove the `addConditionToGroup` function entirely (lines 108–123).

---

### 2. `updateCommonNode` / `updateChoice` / etc. do not guard against AR-03/AR-04/AR-05 violations

- **File:** `useNarrativeStore.js`, lines 258–273 (`updateCommonNode`), 305–314 (`updateChoice`), and all other `update*` actions
- **Rule violated:** AR-03, AR-04, AR-05 (structural invariants must hold "after every mutation")
- **What the code does:** Each update action performs `{ ...existing, ...updates }`, allowing a caller to pass `{ requires: null }`, `{ next: null }`, `{ flags_set: null }`, etc., which would replace the safe defaults with rule-violating values.
- **What it should do:** After the spread, enforce invariants on the critical fields. For example:
  - `requires` must remain a `{ operator, conditions: [] }` object (AR-03)
  - `next` must remain an array (AR-04)
  - Array fields (`flags_set`, `status_set`, `variants`, `options`) must remain arrays (AR-05)
  
  A lightweight guard would be to re-apply defaults after the spread for the fields that have structural constraints:
  ```js
  const updated = {
    ...existing,
    ...updates,
    ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
  };
  // AR-03/04/05 invariant enforcement
  if (updated.requires == null || typeof updated.requires !== 'object') {
    updated.requires = { operator: 'and', conditions: [] };
  }
  if (!Array.isArray(updated.next)) {
    updated.next = existing.next;
  }
  ```
  
  > **Severity:** Low — callers are internal store consumers and are expected to pass valid shapes. But strict enforcement would prevent subtle bugs in later phases (inspector, import, etc.).

---

## Universal Checks

| Check | Result |
|-------|--------|
| **Dead code** | 🔴 `addConditionToGroup` function (lines 112–123) — unused |
| **Consistency** | ✅ All CRUD actions follow the same pattern: delegate to factory on create, shallow-merge on update, structuredClone + cleanup on delete |
| **Completeness** | ✅ The Phase 3 file map lists one file (`useNarrativeStore.js`) — it exists and is complete |

---

## Summary

**2 issues found**, 1 dead-code removal (definite fix), 1 defensive-guard recommendation (low severity).
