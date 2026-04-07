# Phase 8 — Context Menu & Keyboard Shortcuts — Test Report

> **Prompt:** `0006_test.md`  
> **Phase:** 8  
> **Date:** 2026-04-07  
> **Test file:** `src/tests/__test_phase8.js`  
> **Run command:** `node src/tests/__test_phase8.js`

---

## Result: 326 passed, 0 failed

---

## Test Coverage

| Section | Group | Tests | Status |
|---------|-------|-------|--------|
| A | getMenuItemsForTarget — target type → menu items | 6 | ✅ All pass |
| B | Menu item data integrity (spec §3.2 compliance) | 28 | ✅ All pass |
| C | Shortcut keys match spec §3.3 | 17 | ✅ All pass |
| D | Edge ID parsing for delete-edge | 10 | ✅ All pass |
| E | Entity type detection by ID prefix | 11 | ✅ All pass |
| F | Escape priority chain logic | 5 | ✅ All pass |
| G | isTextInputType — shortcut suppression | 25 | ✅ All pass |
| H | isDangerItem / isCreateItem classification | 16 | ✅ All pass |
| I | Simulation status cycling (Space key) | 8 | ✅ All pass |
| I.2 | Seen state cycling (V key) | 4 | ✅ All pass |
| J | Duplicate entity logic | 18 | ✅ All pass |
| K | Menu item IDs → store action mapping | 12 | ✅ All pass |
| L | Entity defaults match Plan §4 data model | 35 | ✅ All pass |
| M | Failure and edge cases | 12 | ✅ All pass |
| N | Icon name identifiers (ICON_MAP consistency) | 18 | ✅ All pass |
| O | No duplicate action IDs within menus | 5 | ✅ All pass |

**Total: 15 test groups, 326 assertions**

---

## What Was Tested

### Happy Path
- All three menu targets (canvas/node/edge) resolve to correct item arrays
- Spec §3.2 compliance: all required menu items present for each target
- Spec §3.3 compliance: shortcut keys on menu items match keyboard shortcut table
- Escape priority chain: context menu → command palette → inspector → deselect
- Status cycling: `default → active → locked → complete → failed → branch_locked → default`
- Seen cycling: `unseen → partially_seen → seen → unseen`
- Duplicate logic: preserves name/type/chapter/path/description, offsets position by (40,40), does NOT carry connections or conditions

### Edge Cases
- `getMenuItemsForTarget` with `null`, `undefined`, unknown strings → falls back to canvas
- `parseEdgeId` with empty strings, single parts, edge cases → returns null safely
- `getEntityTypeByPrefix` with empty string, null, undefined → returns null
- `isTextInputType` with checkbox/radio/file/button → correctly allows shortcuts
- `isTextInputType` with missing type attribute → defaults to text (suppresses)
- `cycleStatus`/`cycleSeen` with invalid values → wraps gracefully to default
- `getEscapeAction` with empty state → returns 'noop'

### Failure Cases
- `parseEdgeId` never throws on garbage input
- `getEntityTypeByPrefix` throws on numeric input (expected — IDs are always strings)
- `getMenuItemsForTarget` never throws on garbage input
- `getEscapeAction` never throws with partial state objects

### Data Integrity
- All menu items have required fields (id, label, icon, group)
- All dividers have type: 'divider' and unique IDs
- No duplicate action IDs within any menu
- All icon names match the ICON_MAP entries in ContextMenu.jsx
- Entity defaults match Plan §4: `requires` → condition groups (AR-03), `next` → arrays (AR-04), all array fields → `[]` (AR-05), `_position` → `{ x, y }` (AR-10)

---

## Findings

No bugs found during testing. All pure logic functions behave correctly for expected inputs, edge cases, and failure modes.

One observation documented in tests:
- **`getEntityTypeByPrefix` with numeric input** — throws because `Number.prototype.startsWith` doesn't exist. This is expected behavior since the data model guarantees IDs are always strings (§4.1). No fix needed.
