# 0309 Document — Iteration Update Report

## 1. Files Updated

### `project_overview.md`
- **Updated:** Replaced the `nodes` entry in `narrativeStore.js` with `common`, `choice`, `ending`.
- **Updated:** Removed `StoryNode.jsx` and replaced it with `CommonNode.jsx`, `ChoiceNode.jsx`, and `EndingNode.jsx` in the folder tree to reflect the new architecture. 
- **Updated:** Removed reference to `side effects` in `EdgeInspector.jsx`'s description.
- **Why:** To prevent documenting stale behavior alongside new rendering patterns.

### `codebase_features.md`
- **Updated:** `narrativeStore.js` to reflect the three sub-collections data layer.
- **Updated:** `fileSystem.js` to mention legacy distribution and edge side-effect stripping.
- **Updated:** `GraphCanvas.jsx` to list the new derivations from multiple collections.
- **Updated:** `NodeInspector.jsx` description to acknowledge multi-collection lookups.
- **Updated:** `EdgeInspector.jsx` description to remove side-effect execution hints.
- **Updated:** Replaced `StoryNode` with `CommonNode`, `ChoiceNode`, and `EndingNode`.
- **Updated:** Added new Changelog entry for `15-04-2026`.
- **Why:** Documentation must explicitly match current system exports, shape, and features.

---

## 2. Files Skipped

### `architecture_rules.md`
- **Why (Skipped):** As reported in `ran_0308_audit_1.md`, updates to rules AR-05, AR-11, and AR-12 had already been directly executed during their respective phases earlier in the iteration. There were no `RULE CANDIDATE` or `RULE CONFLICT` flags raised during execution. Thus, `NO CHANGE REQUIRED`.

### `risk_register.md`
- **Why (Skipped):** The risks tracked inside `ran_0303_risks.md` were migration and refactoring risks strictly scoped to the iteration rollout and are fully mitigated via completed acceptance criteria checks. These did not correspond to modifying the core project-level risk states (RISK-01 to RISK-05), which remain unchanged. 

### `example_datamodel.json`
- **Why (Skipped):** Upon checking the file, it was observed that it already accurately reflects the new model (`schemaVersion: 2`, `common{}`/`choice{}`/`ending{}` sub-collections, no `sideEffects` in the `edges` array). Since there was no delta between reality and the example shape, it was retained as-is.

---

## 3. RULE CANDIDATE Decisions
No `RULE CANDIDATE` patterns or `RULE CONFLICT` decisions were flagged within phase reports or evaluation matrices for this iteration. Zero rules were added or deliberated in this context.

---

## 4. Added Changelog Entry
The following entry was added to `codebase_features.md`:

```markdown
## [2026-04-15] — Data Model, Canvas, State Management Iteration
### Changed
- `narrativeStore` now holds `common{}`, `choice{}`, `ending{}` sub-collections instead of a flat `nodes[]` array.
- `GraphCanvas.jsx` derives React Flow nodes directly from the three new sub-collections.
- Node rendering architecture split from a single component into dedicated `CommonNode`, `ChoiceNode`, and `EndingNode` renderers.
- `meta` schema enriched with `commonNodeTypes` and `endingTypes` tracking arrays.
### Deprecated
- The flat `nodes[]` array schema is strictly un-supported for new documents.
- The `sideEffects` field on edges is completely removed (one-way).
- `StoryNode.jsx` has been completely deleted and functionally replaced.
### Migration
- yes — `fileSystem.js` transparently distributes legacy `nodes[]` into the correct sub-collections upon load, and actively removes `sideEffects` from edges under `schemaVersion: 1`. Save files are now emitted as `schemaVersion: 2`.
```
