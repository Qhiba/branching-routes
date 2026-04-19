# Document Report — Context_menus_keyboard_shortcuts_creation_bar

**Run folder:** `19-04-2026_feature_2/`
**Produced:** 2026-04-20
**Source:** `ran_0207_audit_1.md` (SHIP verdict)

---

## Files Updated

### `informations/docs/project_overview.md` — UPDATED
**Why:** New files were created (`src/hooks/useKeyboardShortcuts.js`, `src/components/ContextMenu.jsx`, `src/components/NameModal.jsx`, `src/components/CreationBar.jsx`) and a new directory (`src/hooks/`) was established. Existing descriptions for `vite.config.js`, `uiStore.js`, `TopBar.jsx`, `GraphCanvas.jsx`, `CommonNode.jsx`, `ChoiceNode.jsx`, and `ConditionalEdge.jsx` were incomplete after the feature shipped.

**Changes made:**
- `vite.config.js` folder tree comment updated to list `hooks` among the five aliases.
- `uiStore.js` folder tree comment updated to mention multi-select and label display mode.
- `src/hooks/` directory section added (between `utils/` and `components/`) with `useKeyboardShortcuts.js`.
- `TopBar.jsx` comment updated to mention creation bar.
- `GraphCanvas.jsx` comment updated to mention context menus, keyboard shortcut hook, and multi-select wiring.
- `ContextMenu.jsx`, `NameModal.jsx`, `CreationBar.jsx` entries added.
- `CommonNode.jsx` and `ChoiceNode.jsx` comments updated to mention verbose label display mode.
- `ConditionalEdge.jsx` comment updated to mention verbose condition display.

---

### `informations/docs/codebase_features.md` — UPDATED
**Why:** Every new file requires an entry; every modified file whose behaviour changed requires a rewritten entry. Audit §2 confirms all files in the delivery check.

**Changes made:**
- `vite.config.js` purpose updated (`hooks` alias added).
- `uiStore.js` purpose rewritten to describe `selectedNodeIds`, `labelDisplayMode`, and new actions; Actions list updated.
- `src/hooks/` section added with full `useKeyboardShortcuts.js` entry.
- `TopBar.jsx` purpose updated to mention `CreationBar` mount.
- `GraphCanvas.jsx` purpose rewritten to cover context menu wiring, keyboard shortcut hook mount, multi-select, DOM event listeners, and `NameModal` integration.
- `ContextMenu.jsx`, `NameModal.jsx`, `CreationBar.jsx` entries added.
- `CommonNode.jsx`, `ChoiceNode.jsx` entries updated to mention verbose label display mode.
- `ConditionalEdge.jsx` entry updated to mention verbose condition display.
- `src/components/index.js` key exports updated to include `ContextMenu`, `NameModal`, `CreationBar`.
- Changelog entry added.

**Changelog entry added:**

```
## [2026-04-20] — Context_menus_keyboard_shortcuts_creation_bar
### Added
- src/hooks/useKeyboardShortcuts.js
- src/components/ContextMenu.jsx
- src/components/NameModal.jsx
- src/components/CreationBar.jsx
- src/hooks/ (new directory + vite alias)
### Changed
- uiStore.js: selectedNodeIds, labelDisplayMode, setSelectedNodeIds, toggleLabelDisplayMode
- GraphCanvas.jsx: context menus, shortcut hook, multi-select, DOM event listeners
- TopBar.jsx: CreationBar mount
- vite.config.js: hooks alias
- src/components/index.js: new exports
- CommonNode.jsx, ChoiceNode.jsx: verbose label mode
- ConditionalEdge.jsx: verbose condition display
- narrativeStore.js: addNode optional label param + return id
```

---

### `informations/docs/architecture_rules.md` — UPDATED
**Why:** Audit §6 flagged three RULE CANDIDATES. All three are stable enough to formalise.

**RULE CANDIDATE decisions:**

| Candidate | Decision | Rule Added |
|---|---|---|
| Components/hooks outside `ReactFlowProvider` must use DOM event pattern for canvas operations | FORMALISED | AR-19 |
| Store-action signature additions must be declared in the data model impact document | FORMALISED | AR-20 |
| `global.css` additions accompanying new components must be explicit in the file map | FORMALISED | AR-21 |

All three patterns are stable (established by this feature or prior features) and recurring enough to warrant formal rules.

---

### `informations/docs/risk_register.md` — UPDATED
**Why:** Risks RISK-CMK-01 through RISK-CMK-09 were declared in `ran_0202_risks.md` and are not yet in the master register. Three new risks were flagged in audit §6.

**Risks added with RESOLVED/MITIGATED status (from planning):**

| Risk ID | Final Status | Evidence |
|---|---|---|
| RISK-CMK-01 | RESOLVED | `useKeyboardShortcuts.js:11-18` input-field guard |
| RISK-CMK-02 | RESOLVED | `event.preventDefault()` in all three context menu handlers |
| RISK-CMK-03 | RESOLVED | `selectedNodeId` preserved; `setSelectedNodeIds` only from `onSelectionChange` |
| RISK-CMK-04 | RESOLVED | `onPaneClick`, `onNodeDragStart`, `onMoveStart` all call `closeContextMenu` |
| RISK-CMK-05 | RESOLVED | `ContextMenu.jsx:15-26` viewport-flip via `useLayoutEffect` |
| RISK-CMK-06 | RESOLVED | Inline ESC handler removed from GraphCanvas; hook is sole handler |
| RISK-CMK-07 | RESOLVED | `canvas-add-node` event; GraphCanvas handles placement at viewport center |
| RISK-CMK-08 | RESOLVED | `NameModal.jsx:61` `stopPropagation` on ESC |
| RISK-CMK-09 | MITIGATED | Triple-layer guard: hook, CreationBar disabled, GraphCanvas listener |

**New risks added (OPEN) from audit §6:**

| Risk ID | Title | Status |
|---|---|---|
| RISK-CMK-10 | `addNode` signature change is silent for existing callers | OPEN |
| RISK-CMK-11 | Scope expansion across 7 files bypasses per-phase file map | OPEN |
| RISK-CMK-12 | `onSelectionChange` fires synchronously inside React Flow render | OPEN |

---

### `informations/docs/example_datamodel.json` — NO CHANGE REQUIRED
**Why:** Audit §4 confirms the narrative data model is CLEAN — no fields added, removed, or renamed. `schemaVersion` remains `4`. The `uiStore` additions (`selectedNodeIds`, `labelDisplayMode`) are ephemeral and never persisted to JSON.
