<!-- ran_0201_scope.md -->

## ROLE
You are a feature analyst helping scope a new addition to a
working system. You surface what already exists so the user
only fills in what only they know about the new thing.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the feature must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. `/informations/docs/risk_register.md` — existing risks

## TASK
Read Part 1. Fill Part 2 based on the user's decisions
cross-referenced against the loaded files.
Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely. Then feed this
> file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_feature/ran_0201_scope.md`

---

## Part 1 — User fills

### Feature name
<!-- [SNAKE_CASE NAME] -->
Path_Chapter_Entities

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
Allows designers to assign nodes to named paths and chapters, giving the graph an organizational layer that groups related nodes without changing how they connect or simulate.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- It does not affect edge connections, condition evaluation, or simulation behavior — grouping is metadata only.
- It does not visually render groups as containers or regions on the canvas; nodes carry the reference, the canvas does not draw boundaries around them.
- The CRUD UI is a temporary Sidebar tab.

### Why this feature is needed now
<!-- [ONE SENTENCE — the real reason, not the nice-to-have reason] -->
Without grouping, the typed sub-collections introduced in the data model refactor have no organizational context — as node count grows, the canvas becomes unnavigable and the flat list of nodes in the inspector carries no narrative structure.

### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/narrativeStore.js` | Add `path{}` + `chapter{}` CRUD |
| ADD | `src/components/PathChapterManager.jsx` | Path + Chapter management UI |
| MODIFY | `src/components/NodeInspector.jsx` | Path/chapter selection dropdowns |
| MODIFY | `src/components/Sidebar.jsx` | Add Path/Chapter section |
| MODIFY | `src/utils/fileSystem.js` | Export/import path{} + chapter{} |


### Assumptions I am making
<!-- [LIST OR "NONE"] -->
NONE

---

## Part 2 — AI fills, user does not edit

### Related existing features
- **`narrativeStore.js`**: Currently holds graph collections (`common`, `choice`, `ending`, `flag`, and `status`). It will become the owner of the new `path{}` and `chapter{}` dictionaries.
- **`Sidebar.jsx`**: Currently handles tab layouts (Inspector, Flags). It will need an updated UI tab structure to house the new Path/Chapter manager.
- **`NodeInspector.jsx`**: Currently enables editing node fields. Will need UI fields (e.g., dropdowns) mapped to the path and chapter store so node boundaries can be set.
- **`fileSystem.js`**: Handles export and import of `narrativeStore` payload. Needs updates to process the new `path{}` and `chapter{}` sub-collections safely.
- **`uuid.js`**: Provides consistent prefixed IDs, and will need logic for generating `p-{uuid}` (Path) and `c-{uuid}` (Chapter) IDs.

### Files to touch
- **CREATE** `src/components/PathChapterManager.jsx` (New CRUD UI for chapters and paths)
- **MODIFY** `src/store/narrativeStore.js` (Add `path{}` & `chapter{}` dictionaries + their CRUD action methods)
- **MODIFY** `src/components/Sidebar.jsx` (Wire in `PathChapterManager.jsx` under a new tab or section)
- **MODIFY** `src/components/NodeInspector.jsx` (Add selection UI allowing the user to map paths/chapters to nodes)
- **MODIFY** `src/utils/fileSystem.js` (Include `path{}` & `chapter{}` safely in `.json` saving/loading)
- **MODIFY** `src/components/index.js` (Add export for `PathChapterManager`)

### Files to protect
- **PROTECTED `src/utils/conditionEvaluator.js`**: The new grouping is metadata-only. Condition calculation must stay strictly confined to tags and states.
- **PROTECTED `src/store/simulationStore.js`**: Organizational structures must not impact simulation highlights, reachability, or evaluation mechanics.
- **PROTECTED `src/components/GraphCanvas.jsx` and all node variants (`CommonNode`, `ChoiceNode`, `EndingNode`)**: As stipulated, paths and chapters are not rendered visually; no structural grouping will exist on the interactive graph view.

### Architecture rules relevant to this feature
- **AR-01 — Naming: Files**: The new React form must be named `PathChapterManager.jsx` (PascalCase).
- **AR-02 — Naming: Variables and Entities**: IDs for the newly created dictionaries must follow prefixed formats (e.g., `p-{uuid}`, `c-{uuid}`).
- **AR-04 — Data Layer Separation**: UI elements in `NodeInspector` and `PathChapterManager` can only call Zustand store actions; no component mutating `narrativeStore` locally.
- **AR-05 — Single Source of Truth**: UI selectors must query valid assignments strictly from the `path{}` and `chapter{}` maps directly.
- **AR-09 — JSON Format Stability**: Loading a legacy save file must initialize `path{}` and `chapter{}` cleanly from zero to ensure backward compatibility. Bumping schema from v3 likely needed or mapped dynamically gracefully.

### Relevant existing risks
- **Referential Integrity Breaks (Analogous to RISK-02)**: Expanding upon RISK-02, a designer deleting an entire path or chapter leaves dangling IDs on any Node belonging to those groups. `narrativeStore.js` must implement proper deletion integrity by wiping assignments for paths/chapters from connected nodes upon group destruction to avoid UI crashes.
- **RISK-03 — Serialization Compatibility**: Modifications to `fileSystem.js` continue to be offline browser functionality bounded natively to File System APIs fallback mapping.

### Suggested phase shape
- **Phase 1: Persistent Roots & Core Schema:** Enhance `narrativeStore.js` to initialize and provide CRUD functions for `path{}` and `chapter{}` sets. Update `fileSystem.js` format stability rules for data imports/exports.
- **Phase 2: Administrative View Generation:** Formulate the basic `PathChapterManager.jsx` elements and tab them directly into the `Sidebar.jsx`. Setup component imports in `components/index.js`.
- **Phase 3: Inspector Interoperability:** Safely modify and bridge assignment references within the `NodeInspector.jsx` component allowing designers to attribute sub-collections.
