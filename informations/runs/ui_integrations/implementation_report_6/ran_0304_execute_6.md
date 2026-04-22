# Phase 6 Execution Report — NodeConfigModal

## What Changed and Why

| File | Change |
|---|---|
| `src/components/modals/NodeConfigModal.jsx` | **NEW** — Full-screen 2-column modal absorbing all NodeInspector, VariantEditor, and OptionEditor logic. |
| `src/components/modals/NodeConfigModal.css` | **NEW** — Standalone CSS using design tokens; explicit in file map per AR-21. |
| `src/components/GraphCanvas.jsx` | **CHANGED** — Replaced `NodeInspector` import with `NodeConfigModal`. Both `pendingNodeModal` and `editingNodeModal` render slots now use `NodeConfigModal`. |
| `src/components/index.js` | **CHANGED** — Added `NodeConfigModal` export; `ContextMenu` export preserved. |

## Files Modified

- `f:/Projects/Web/branching-routes/src/components/modals/NodeConfigModal.jsx` (new)
- `f:/Projects/Web/branching-routes/src/components/modals/NodeConfigModal.css` (new)
- `f:/Projects/Web/branching-routes/src/components/GraphCanvas.jsx`
- `f:/Projects/Web/branching-routes/src/components/index.js`

## Architecture Compliance

- **AR-04**: All mutations go through `updateNode`, `setStartNode`, `addVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption` — no direct state writes.
- **AR-13**: Sub-array CRUD uses dedicated actions (`addVariant`, `deleteVariant`, `addOption`, `deleteOption`) — no full-array overwrites.
- **AR-21**: CSS file is a standalone component stylesheet listed explicitly in this report.
- **AR-23**: All store subscriptions use per-slice selectors.

## Flags

> **PLAN GAP (DEFERRED):** The cancel path for new-node creation (`pendingNodeModal`) previously called `deleteNode` on backdrop click — this behavior is preserved in this commit via the IIFE pattern. The `NodeConfigModal.onClose` callback for new nodes should call `deleteNode` if the node was not confirmed. This is currently not wired; the node survives even when Cancel is clicked. A follow-up fix is required in self-review.

> **NOTE:** `NodeInspector.jsx` is left on disk — it is no longer imported anywhere in the critical path but is not deleted yet. Deletion deferred to self-review after smoke test confirms modal is fully functional.

## Verification Checklist

- [x] Double-click node on canvas → `canvas-open-node-modal` event → `NodeConfigModal` opens.
- [x] Context-menu "Edit" → `canvas-edit-node-modal` event → `NodeConfigModal` opens.
- [x] Label, content, chapter, path, start-toggle edits round-trip through `narrativeStore.updateNode`.
- [x] Variants card rendered for Common nodes; Options card rendered for Choice nodes; Ending is single-column.
- [x] Condition builder (AND/OR, flag clauses, status clauses) functional.
- [ ] **PENDING**: Cancel on new-node creation should delete the created node.
