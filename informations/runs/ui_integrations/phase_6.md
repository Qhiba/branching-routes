### Phase 6 — NodeConfigModal (retire docked inspector)

- **Goal:** Replace the inspector with the full-screen 2-column modal. Largest phase; consider splitting if estimates run long.
- **Changes:**
  - New `src/components/modals/NodeConfigModal.jsx` — 2-column for Common/Choice, single-column for Ending.
  - Left column: label, description, chapter/path dropdowns, Start Node toggle (wired to `narrativeStore.setStartNode`).
  - Right column (non-Ending): On-Enter Modifiers (set-flags + status-mods editors), Branching Options / Narrative Variants cards with per-variant condition builder (AND/OR, flag clauses, status clauses). Port logic from `NodeInspector.jsx` + `OptionEditor.jsx` + `EdgeInspector.jsx` condition-editor widgets.
  - Open triggers: double-click node on canvas, edit-pencil in NodesPanel, context-menu "Edit".
  - Delete `src/components/NodeInspector.jsx` (and `EdgeInspector.jsx` if its functionality is fully absorbed — otherwise keep as an edge-specific modal or dock).
- **Produces:** `src/components/modals/NodeConfigModal.jsx` + CSS. Removes `NodeInspector.jsx`. Possibly modifies `EdgeInspector.jsx`.
- **Leaves inconsistent:** Edge editing UX may need a similar modal in a later iteration — flag as **RULE CANDIDATE** for the 0309 Document step if the pattern stabilizes.
- **Next phase depends on:** Independent final phase.
- **Rollback cost:** HIGH (NodeInspector is deeply integrated; revert means restoring the deleted file and re-binding open-triggers).
- **Hard stop triggers:** Any node-edit field fails to round-trip through `narrativeStore.updateNode`.
- **Acceptance:** Every field previously editable in the dock inspector is editable in the modal, and produces the same store state.
- **Verification:** Open app → double-click a node → modal opens → change label, description, add a flag modifier, add a variant with a FLAG=TRUE condition → Save → reload → confirm all changes persist.