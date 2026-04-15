## ROLE
You are a behavioral analyst helping scope an iteration.
You translate the user's decisions into a technical foundation
for the plan.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the change must respect
4. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0301_understand.md` — current state map

## TASK
Read Part 1. Fill Part 2 based on the user's decisions cross-referenced
against the loaded files. Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely based on your reading of
> `ran_0301_understand.md`. Then feed this file to the AI.
> Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_iteration/ran_0302_scope.md`

---

## Part 1 — User fills

### What I am changing
Data Model, Canvas, State Management

### Why this needs to change
The current data model uses a single flat `nodes[]` array where node behaviour is distinguished only by a `type` field. This forces structural constraints to be enforced downstream — in store actions, component guards, and hidden UI elements — rather than being expressed in the data itself. AR-12 is a direct symptom: the prohibition on outgoing edges from ending nodes cannot be enforced by the schema, so it must be patched at the store and renderer level instead.
Edge `sideEffects` introduce a parallel problem. AR-11 mandates a strict execution order specifically because effects distributed across both edges and nodes create evaluation ambiguity. Removing `sideEffects` from edges and consolidating them onto nodes eliminates this ambiguity at the data layer, making AR-11 structurally guaranteed rather than convention-dependent.
Splitting `nodes[]` into typed sub-collections (`common`, `choice`, `ending`) and registering valid types in `meta` moves node-type rules into the schema where they can be validated on import, reasoned about without runtime guards, and rendered by dedicated components without conditional branching inside a single shared renderer.

### New behavior after this push
Split `nodes[]` into `common{}` / `choice{}` / `ending{}`. Remove `sideEffects` from edges — nodes-only rule. Add `commonNodeTypes` and `endingTypes` to metadata. Separate node renderers per type (CommonNode, ChoiceNode, EndingNode).

### Accepted blast radius
<!-- Which dependencies from ran_0301 are you okay with changing —
even if they appear in the preservation list?
These are conscious decisions, not oversights. -->
**1. Reliable Cross-Store Deletion Synchronization**
**2. Strict Deterministic Side Effect Application**
**4. Safely Rejecting Terminus Edges**
`architecture_rules.md` changes.

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/narrativeStore.js` | Replace `nodes[]` with `common{}`, `choice{}`, `ending{}` CRUD; remove `sideEffects` from edge schema; add `commonNodeTypes`/`endingTypes` to meta |
| MODIFY | `src/components/GraphCanvas.jsx` | Derive React Flow nodes from three collections; register three node types |
| MODIFY | `src/components/NodeInspector.jsx` | Branch form fields by entity type |
| MODIFY | `src/components/EdgeInspector.jsx` | Remove side effects section |
| MODIFY | `src/components/nodes/StoryNode.jsx` | Rename file content to CommonNode |
| ADD | `src/components/nodes/CommonNode.jsx` | Replaces StoryNode.jsx |
| ADD | `src/components/nodes/ChoiceNode.jsx` | Choice node renderer |
| ADD | `src/components/nodes/EndingNode.jsx` | Ending node renderer |
| DELETE | `src/components/nodes/StoryNode.jsx` | Replaced by CommonNode.jsx |
| MODIFY | `src/components/edges/ConditionalEdge.jsx` | Remove side effect display |
| MODIFY | `src/utils/fileSystem.js` | Export/import with new collection structure |
| MODIFY | `src/components/index.js` | Updated re-exports |

### Assumptions I am making
NONE

---

## Part 2 — AI fills, user does not edit

### What must stay exactly the same
<!-- Pull from Section 7 of ran_0301_understand.md.
Then cross-reference against "Accepted blast radius" in Part 1.
- Items NOT in the accepted blast radius → PROTECTED
- Items the user explicitly accepted → ACKNOWLEDGED RISK
Present the full list with each item labeled accordingly. -->

### Affected file list
<!-- Cross-reference the user's decisions against the dependency map
in ran_0301_understand.md. For each file state:
CHANGES / PROTECTED / MONITOR -->

### Migration flags
<!-- Cross-reference against the Persistence Inventory in
ran_0301_understand.md. For each risk or conflict raised by
the user's decisions:
- What the user decided
- Which behavior or persisted item it touches
- Flag as: MIGRATION REQUIRED / PROCEED WITH CAUTION / SAFE -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0303 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Rewire input handling without changing output format
- Phase 2: Update output format and all callers -->