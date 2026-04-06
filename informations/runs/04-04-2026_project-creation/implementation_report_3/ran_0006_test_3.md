# Phase 3 — Test Report

> **Prompt:** `0006_test.md`
> **Date:** 2026-04-06
> **Phase:** 3 — Zustand Stores (Narrative)
> **Test file:** `src/tests/__test_phase3.js`
> **Run command:** `node src/tests/__test_phase3.js`

---

## Results: 232 passed, 0 failed ✅

---

## Test Coverage

### A. Initial State & Metadata (17 tests)
- Default metadata fields (version, timestamps, entry_node, type lists)
- All 8 collections start as empty `{}`
- `setEntryNode` and `updateMetadata` actions

### B. Common Node CRUD (18 tests)
- `addCommonNode` — all 12 data model fields present with correct defaults
- Name sanitization on creation (AR-07)
- `updateCommonNode` — field update, name sanitization, non-existent no-op
- `deleteCommonNode` — removal, entry_node cascade clear

### C. Choice CRUD (14 tests)
- `addChoice` — all 7 fields, no `name`/`next`/`flags_set`/`status_set` on top-level
- `updateChoice` — text update
- `deleteChoice` — removal, `next[].target` cascade cleanup from common nodes

### D. Ending CRUD (6 tests)
- Create with name sanitization, defaults
- Update with name sanitization
- Delete with `next[].target` cascade cleanup

### E. Flag CRUD + Cascade (15 tests)
- Create, update, name sanitization
- **Cascade delete:** removes from `flags_set[]` on common nodes, purges `requires.conditions` referencing flag (common node, choice, choice option, ending)

### F. Status Point CRUD + Cascade (11 tests)
- Create, update, defaults (value, minValue, maxValue)
- **Cascade delete:** removes from `status_set[]`, purges status conditions from choice options

### G. Path CRUD (12 tests)
- Create with sanitization
- **Delete cascade:** nulls `.path` on common nodes, choices, endings, flags, status points

### H. Chapter CRUD (7 tests)
- Create with sanitization
- **Delete cascade:** nulls `.chapter` on all entity types

### I. Next Entry Sub-Element CRUD (11 tests)
- Add: correct ID, target, default requires (AR-03, AR-04)
- Update: target change
- Remove: by ID, correct remaining
- Multiple entries, target deletion cascade

### J. Option Sub-Element CRUD (9 tests)
- Add: defaults for label, requires, flags_set, status_set, next (AR-03, AR-04, AR-05)
- Update: label change
- Remove: by ID, correct remaining

### K. Option Next Entry CRUD (7 tests)
- Add to specific option
- Remove from option
- Target deletion cascade cleans up option next entries

### L. Variant Sub-Element CRUD (6 tests)
- Add: defaults for text, requires (AR-03)
- Update: text change
- Remove: by ID, correct remaining

### M. Condition Sub-Element CRUD (16 tests)
- Add flag condition to root requires
- Add status condition
- Add nested condition group (returns null)
- Remove condition by ID
- **targetPath routing:** `variants.ID.requires`, `next.ID.requires`, `options.ID.requires`, `options.ID.next.ID.requires`
- Invalid entityType no-crash

### N. Import / Export (28 tests)
- `loadFromJSON` — minimal valid JSON, full JSON
- Name sanitization on import (AR-07)
- Sub-element ID replacement with runtime IDs (AR-06)
- `toExportJSON` — all 9 top-level keys present
- Hierarchical ID generation on export (N001_NE001, N001_VAR001, CH001_OPT001, CH001_OPT001_NE001)
- **Round-trip:** export → import preserves version, entry_node, entity counts, names, descriptions, types, next/variant counts

### O. resetStore (10 tests)
- All collections cleared
- Metadata reset to defaults

### P. Edge Cases & Failure Modes (13 tests)
- All CRUD operations on non-existent IDs are no-ops (no crash)
- Multiple entities with unique IDs, selective deletion
- `updated_at` timestamp valid after add/update/delete
- AR-03/04/05 invariants hold after multiple add/delete cycles

---

## Architecture Rules Verified

| Rule | Tests |
|------|-------|
| **AR-03** | Requires fields default to `{ operator, conditions: [] }` on every entity and sub-element |
| **AR-04** | Next fields default to `[]`, entries are `{ id, target, requires }` |
| **AR-05** | All array fields default to `[]` |
| **AR-06** | Sub-element IDs regenerated on import with correct prefixes (`variant_`, `route_`, `cond_`, `opt_`) |
| **AR-07** | Names sanitized on creation, update, and import |
| **AR-10** | `_position` persisted with defaults `{ x: 0, y: 0 }` |
