# Data Model Impact — Context_menus_keyboard_shortcuts_creation_bar

---

## NOT APPLICABLE — Narrative Data Model

This feature introduces **zero changes** to the narrative data model. No fields are added to, removed from, or renamed in:

- `common{}`, `choice{}`, `ending{}` node entities
- `edges[]` edge entities
- `flag{}`, `status{}`, `path{}`, `chapter{}` dictionaries
- `meta` object
- `schemaVersion` (remains `4`)

**Export/import round-trip:** Unaffected. The `.json` and `.zip` export formats are identical before and after this feature. Existing saved files continue to import without modification.

**Entity IDs and prefixes:** No new prefixes are introduced. Entity creation triggered by shortcuts, context menus, and the creation bar calls the same `addNode` / `addFlag` / `addStatus` / `addPath` / `addChapter` store actions with the same `generateId(prefix)` calls. The `n-`, `e-`, `f-`, `s-`, `p-`, `h-` prefix conventions are unchanged.

---

## UI State Model Change (uiStore only — not persisted)

The only state change in this feature is additive within `uiStore`, which is ephemeral (never persisted):

| Field | Before | After | Persisted? |
|---|---|---|---|
| `selectedNodeId` | `null \| string` — primary single-select | **Unchanged** | No |
| `selectedEdgeId` | `null \| string` — primary edge select | **Unchanged** | No |
| `selectedNodeIds` | Does not exist | `string[]` — multi-select set | No |

The new `selectedNodeIds` array is:
- Additive — existing consumers of `selectedNodeId` are unaffected.
- Never exported or imported.
- Reset to `[]` by the updated `clearSelection` action.
- Populated from React Flow's `onSelectionChange` callback (which fires on Ctrl+click and drag-box selection).

**AR-14 compliance:** The selector for `selectedNodeIds` must never return a new `[]` literal as a fallback. It returns the existing array reference from store state; consumers default to `[]` outside the hook call.
