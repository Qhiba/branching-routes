<!-- 0201_scope-user.md -->

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
<!-- Cross-reference the user's feature description against
codebase_features.md. List every existing feature or component
that relates to, overlaps with, or will be affected by
this addition. -->

### Files to touch
<!-- Cross-reference against codebase_features.md.
List every file that must change to support this feature.
For each file state: MODIFY / CREATE -->

### Files to protect
<!-- List files that must not change under any circumstance —
especially stable core files the new feature will depend on.
For each file state: PROTECTED and why. -->

### Architecture rules relevant to this feature
<!-- List every rule from architecture_rules.md that this
feature must respect. For each rule, state why it is relevant. -->

### Relevant existing risks
<!-- Cross-reference against risk_register.md.
List any existing risks this feature touches or amplifies. -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0202 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Build the core logic without UI
- Phase 2: Wire UI to the logic
- Phase 3: Connect to existing data layer -->