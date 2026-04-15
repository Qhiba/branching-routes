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
- **Visual Canvas State Segregation via `useMemo`**: PROTECTED
- **Robust Flag Reference Checking**: PROTECTED
- **Reliable Cross-Store Deletion Synchronization**: ACKNOWLEDGED RISK
- **Strict Deterministic Side Effect Application**: ACKNOWLEDGED RISK
- **Safely Rejecting Terminus Edges**: ACKNOWLEDGED RISK

### Affected file list
- `src/store/narrativeStore.js`: CHANGES (Split nodes to partitioned objects, adjust CRUD hooks, update flag deletion checks)
- `src/store/simulationStore.js`: CHANGES (Adjust side-effect processing order and lookup via new collections)
- `src/store/uiStore.js`: MONITOR (Logic for clear selection holds, but underlying entities restructure)
- `src/components/GraphCanvas.jsx`: CHANGES (Merge specific objects to arrays for Canvas map, introduce three node types)
- `src/components/NodeInspector.jsx`: CHANGES (Adopt conditionals for new entity schemas)
- `src/components/EdgeInspector.jsx`: CHANGES (Purge UI properties related to side effects)
- `src/components/edges/ConditionalEdge.jsx`: CHANGES (Remove side effect decorators)
- `src/components/nodes/StoryNode.jsx`: CHANGES (Set for replacement)
- `src/components/nodes/CommonNode.jsx`: CHANGES (New inclusion)
- `src/components/nodes/ChoiceNode.jsx`: CHANGES (New inclusion)
- `src/components/nodes/EndingNode.jsx`: CHANGES (New inclusion)
- `src/utils/fileSystem.js`: CHANGES (Adapt payload processing logic and provide legacy mapping)
- `src/components/index.js`: CHANGES (Alter relative export references)

### Migration flags
- **`nodes` array and its nested schema**: 
  - What the user decided: Split the flat `nodes[]` list into partitioned objects (`common{}`, `choice{}`, `ending{}`).
  - Which behavior or persisted item it touches: Exported and Runtime formats in file system/Store persistence.
  - Flag as: MIGRATION REQUIRED
- **`edges` array and its nested schema**:
  - What the user decided: Completely remove inline `sideEffects` array from edges.
  - Which behavior or persisted item it touches: Edge persistence, deterministic application, evaluation.
  - Flag as: MIGRATION REQUIRED
- **`meta` object schema**:
  - What the user decided: Inject collections for `commonNodeTypes` and `endingTypes`.
  - Which behavior or persisted item it touches: Overall schema completeness at export.
  - Flag as: PROCEED WITH CAUTION
- **Simulation and evaluation paths**:
  - What the user decided: Shift to nodes-only mutation side-effects.
  - Which behavior or persisted item it touches: Simulation states.
  - Flag as: PROCEED WITH CAUTION

### Suggested phase shape
- **Phase 1: Core Store Schema Restructure**
  Replace flat lists with specific objects inside `narrativeStore.js`. Provide `simulationStore.js` logic mappings and refactor flag checks to read deeply across newly nested schemas safely context-wide.
- **Phase 2: Import / Export Safety Net**
  Integrate legacy loader translation inside `fileSystem.js`. Assure that prior exported node-arrays naturally segregate into respective object groups and legacy side effects port correctly or warn user.
- **Phase 3: Component Visual Migration**
  Retire `StoryNode.jsx`. Inject `CommonNode`, `ChoiceNode`, `EndingNode` renderers. Point `GraphCanvas.jsx` to dynamically zip mappings down for Flow parsing.
- **Phase 4: Inspector Polishing**
  Address UI inspector elements to adhere to specific schema definitions. Disable edge side-effect settings inside `EdgeInspector.jsx` and UI decorators in `ConditionalEdge.jsx`.
