# ran_0208_document.md — Documentation Update Report

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

## Files Updated

### 1. `project_overview.md` — UPDATED
- Added `VariantEditor.jsx` and `OptionEditor.jsx` to the folder tree.
- Updated descriptions for `uiStore.js` (added choice display mode), `GraphCanvas.jsx` (option-aware edge stamping), `NodeInspector.jsx` (variant/option editor mounts), `EdgeInspector.jsx` (option provenance), `ChoiceNode.jsx` (per-option handles).

### 2. `codebase_features.md` — UPDATED
- Rewrote entries for `narrativeStore.js` (expanded purpose, added 6 new actions to action list), `uiStore.js` (added `choiceDisplayMode` and `setChoiceDisplayMode`), `GraphCanvas.jsx` (option stamping), `NodeInspector.jsx` (editor mounts + new dependencies), `EdgeInspector.jsx` (option provenance), `ChoiceNode.jsx` (per-option handles, display mode, new dependencies).
- Updated barrel export list in `index.js` entry.
- Added changelog entry for `[2026-04-18] — Variants_on_nodes_and_Options_on_choices`.

### 3. `architecture_rules.md` — UPDATED
Three RULE CANDIDATE decisions made:
- **RC-01 → AR-13:** Sub-Array CRUD via Dedicated Store Actions. Pattern validated — formalized.
- **RC-02 → AR-14:** Zustand Selector Stability. Pattern validated by the EdgeInspector crash bug — formalized.
- **RC-03 → AR-15:** Edge Uniqueness Tuple. Semantic change to `addEdge` — formalized.

### 4. `risk_register.md` — UPDATED
- Added 6 new risk entries (RISK-VNO-01 through RISK-VNO-06), all with status RESOLVED.
- All planning risks from `ran_0202_risks.md` were addressed during implementation.
- Fixed file corruption from a failed edit (duplicated header block) by performing a clean rewrite preserving all existing content.

### 5. `example_datamodel.json` — UPDATED
- Added `variants[]` array to the "Forest Entrance" common node with one realistic variant entry.
- Added `options[]` array to the "Dark Cave" choice node with two realistic option entries.
- Added `optionId` field to all edges (`null` for non-option edges, option IDs for option-sourced edges).
- Validated: JSON is parseable and all new fields contain realistic values.

---

## Changelog Entry Added

```
## [2026-04-18] — Variants_on_nodes_and_Options_on_choices
### Added
- VariantEditor.jsx, OptionEditor.jsx
- Six CRUD actions in narrativeStore
- choiceDisplayMode in uiStore
- Option provenance in EdgeInspector
- Per-option handles in ChoiceNode
- optionId stamping in GraphCanvas
### Changed
- addEdge uniqueness tuple includes optionId
- deleteFlag/deleteStatus scans extended
- NodeInspector mounts conditional editors
- global.css handle clipping fixes
```

---

## Files Skipped

None — all five documentation files required updates.
