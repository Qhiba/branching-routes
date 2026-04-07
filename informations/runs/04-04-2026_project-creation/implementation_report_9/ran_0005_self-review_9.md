# Phase 9 — Floating Inspector Panel — Self-Review Report

> **Prompt:** `0005_self-review.md` (Phase 9)
> **Date:** 2026-04-07
> **Input:** `ran_0004_execute_9.md`

---

## Review Summary

Reviewed 12 files (11 created, 1 modified) against 10 architecture rules, the data model specification, and the 3 universal checks. Found **4 issues** — 1 rule violation, 1 dead code import, 1 consistency concern, and 1 hard-coded value.

---

## Issues

### 1. Dead code — Unused import `Plus` in ConditionEditor.jsx

- **File:** `src/components/inspector/fields/ConditionEditor.jsx`, line 23
- **Rule violated:** Universal check §1 (Dead code)
- **What the code does:** Imports `Plus` from `lucide-react` at line 23, but `Plus` is never referenced anywhere in the component. The three "add" buttons in `ConditionGroup` use `Flag`, `BarChart2`, and `FolderPlus` icons — not `Plus`.
- **What it should do:** Remove `Plus` from the import statement.

### 2. Hard-coded `font-size: 9px` in InspectorPanel.css

- **File:** `src/components/inspector/InspectorPanel.css`, line 556
- **Rule violated:** **AR-09** — no hard-coded color/spacing/font values in component stylesheets
- **What the code does:** The `.inspector-field__badge` rule sets `font-size: 9px` as a literal pixel value instead of consuming a design token.
- **What it should do:** Use a token. The smallest defined token is `--font-size-xs` (11px / 0.6875rem). If 9px is truly necessary, define a new token (e.g., `--font-size-2xs`) in `tokens.css` and reference it here. Otherwise, use `--font-size-xs`.

### 3. `key={index}` anti-pattern in StatusSetEditor.jsx

- **File:** `src/components/inspector/fields/StatusSetEditor.jsx`, line 87
- **Rule violated:** Universal check §2 (Consistency)
- **What the code does:** Uses `key={index}` for rendering `status_set` delta entries in a mutable list (items can be added and removed). All other array editors in the inspector (`NextEditor`, `VariantEditor`, `OptionEditor`) use `key={entry.id}` — a stable unique key.
- **What it should do:** `StatusDelta` objects in the data model do not have an `id` field (per spec §4.2: `{ "status": "SP001", "amount": 5 }`). Either: (a) generate a composite key like `key={delta.status}` (if duplicates are disallowed), or (b) acknowledge this is a known limitation of the `StatusDelta` schema — the index key is acceptable here since items lack unique IDs, but document the deviation from the pattern used elsewhere.

### 4. Reference to undefined token `--color-accent-cyan-hover` in InspectorPanel.css

- **File:** `src/components/inspector/InspectorPanel.css`, line 165
- **Rule violated:** Universal check §2 (Consistency)
- **What the code does:** References `var(--color-accent-cyan-hover, var(--color-accent-cyan))` — a token that does not exist in `tokens.css`. The fallback `var(--color-accent-cyan)` prevents a visual failure, but it references a phantom token.
- **What it should do:** Either (a) define `--color-accent-cyan-hover` in `tokens.css` (consistent with the existing `--color-accent-blue-hover` pattern), or (b) replace the line with just `color: var(--color-accent-cyan)` to remove the dead reference.

---

## Completeness Check (Universal §3)

All 11 files listed in the Plan §3 file map for Phase 9 exist:

| # | Plan File | Exists |
|---|-----------|--------|
| 1 | `src/components/inspector/InspectorPanel.jsx` | ✅ |
| 2 | `src/components/inspector/InspectorPanel.css` | ✅ |
| 3 | `src/components/inspector/fields/TextField.jsx` | ✅ |
| 4 | `src/components/inspector/fields/SelectField.jsx` | ✅ |
| 5 | `src/components/inspector/fields/ConditionEditor.jsx` | ✅ |
| 6 | `src/components/inspector/fields/ConditionEditor.css` | ✅ |
| 7 | `src/components/inspector/fields/NextEditor.jsx` | ✅ |
| 8 | `src/components/inspector/fields/VariantEditor.jsx` | ✅ |
| 9 | `src/components/inspector/fields/OptionEditor.jsx` | ✅ |
| 10 | `src/components/inspector/fields/FlagSetEditor.jsx` | ✅ |
| 11 | `src/components/inspector/fields/StatusSetEditor.jsx` | ✅ |

Modified file `src/App.jsx` — ✅ confirmed updated.

---

## Architecture Rules — Pass/Fail Summary

| Rule | Status | Notes |
|------|--------|-------|
| AR-01 | ✅ PASS | All components PascalCase.jsx under `src/components/inspector/` and `fields/` |
| AR-02 | ✅ PASS | All shared state from Zustand; local state only for drag position and expand/collapse (UI-only, not shared) |
| AR-03 | ✅ PASS | `ConditionEditor` guard at line 357–359 ensures `{ operator, conditions }` shape |
| AR-04 | ✅ PASS | `NextEditor` always produces `[{ id, target, requires }]` entries (line 58–64) |
| AR-05 | ✅ PASS | All array fields use `value || []` null-coalescing throughout |
| AR-06 | ✅ PASS | `generateId()` used in NextEditor, VariantEditor, OptionEditor, ConditionEditor |
| AR-07 | ✅ PASS | No name sanitization in UI components — delegated to store actions |
| AR-08 | N/A | No IndexedDB operations in Phase 9 files |
| AR-09 | ❌ FAIL | Issue #2: hard-coded `font-size: 9px` |
| AR-10 | ✅ PASS | `_position` not exposed in inspector fields |

---

**Verdict:** 4 issues found — none are structural or behavioral blockers, but all should be addressed before proceeding to Phase 10.
