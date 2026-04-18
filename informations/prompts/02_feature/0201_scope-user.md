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
Variants_on_nodes_and_Options_on_choices

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
- Variants on Common Node:
    Allows designers to define alternate text on a common node that displays conditionally based on flag and status state, so a single node can show different content without duplicating nodes in the graph.

- Options on Choice Node
    Allows designers to define multiple selectable options on a choice node — each with its own conditions, side effects, and a dedicated source handle — so edges can be anchored to a specific option rather than the node as a whole.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- Variants on Common Node:
    - It does not affect routing or edge behavior — variants are display-only, not branching points.
    - It does not render variant switching on the canvas; which variant is active is a simulation concern handled in later update.
    - It does not finalize the variant editor UI — form styling is deferred to later update.

- Options on Choice Node
    - It does not change how edges evaluate conditions — option conditions gate availability, routing logic stays on the edge.
    - It does not affect common node or ending node edge behavior — per-option source handles exist only on choice nodes.
    - It does not finalize the option editor UI — form styling is deferred to later update.

### Why this feature is needed now
<!-- [ONE SENTENCE — the real reason, not the nice-to-have reason] -->
- Variants on Common Node:
    Without variants, designers must duplicate common nodes to express minor conditional text differences, bloating the graph with structurally identical nodes that differ only in content.

- Options on Choice Node
    - The flag and status system from previous iteration update has nowhere to apply at the choice level — without options, choice nodes cannot express what the player selects, what state changes on selection, or which specific option an outgoing edge belongs to.

### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/narrativeStore.js` | Variant + option CRUD actions |
| ADD | `src/components/VariantEditor.jsx` | Variant list + conditional text editing |
| ADD | `src/components/OptionEditor.jsx` | Option editing: label, requires, flags_set, status_set |
| MODIFY | `src/components/NodeInspector.jsx` | Mount VariantEditor for common nodes, OptionEditor for choices |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` | Render option labels, per-option source handles, medium/full toggle |
| MODIFY | `src/store/uiStore.js` | Option display mode setting (medium/full) |
| MODIFY | `src/components/EdgeInspector.jsx` | Show which option an edge connects from |


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