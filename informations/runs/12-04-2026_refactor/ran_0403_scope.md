## ROLE
You are a structural analyst helping scope a refactor.
You translate the user's decisions into a technical foundation for the plan.

## CONTEXT
Load these files:
1. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0401_understand.md` — structure map
2. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md` — pre-refactor contract

## TASK
Read Part 1. Fill Part 2 based on the user's decisions cross-referenced
against the loaded files. Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely based on your reading of
> `ran_0401_understand.md` and `ran_0402_first-audit.md`.
> Then feed this file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_refactor/ran_0403_scope.md`

---

## Part 1 — User fills

### What is being restructured
State Management, Data Model, Canvas

### Target state (your goal)
Store rename + prefixed UUID system + dark theme tokens + add uiStore

### What changes structurally
[LIST — at least 3 specific things that will be different after]
| # | Description | Type | Area |
|---|-------------|------|------|
| S01 | Rename `graphStore` → `narrativeStore` | Structural | State Management |
| S03 | Replace bare UUID IDs with prefixed UUIDs (`n-{uuid}`, `f-{uuid}`) | Structural | Data Model |
| S23 | Dark-mode-only theme | Structural | Canvas |
| S25 | Create `uiStore`, move selection out of narrative store | Structural | State Management |

### Hard stops I am adding
Any conditions beyond 0402's list that would make you stop immediately:
None

### Rollback plan
If something goes wrong mid-refactor, how do you recover?
I committed everything before starting — I can git reset to get back to the working version.

### Definition of done
**Changes:**
- Rename `graphStore.js` → `narrativeStore.js`, update all imports
- Rewrite `uuid.js` to generate `{prefix}-{uuid}` format
- Update `tokens.css` + `global.css` for dark-mode-only aesthetic
- Create `uiStore.js`, move selection state out of narrative store

### Audit First verdict acknowledged
[check] I have read the verdict from 0402 and I am choosing to proceed

---

## Part 2 — AI fills, user does not edit

### Affected file list
**CHANGES:**
- `src/store/graphStore.js` (Rename to `narrativeStore.js`)
- `src/store/uiStore.js` (New file)
- `src/utils/uuid.js`
- `src/styles/tokens.css`
- `src/styles/global.css`

**MONITOR (Requires import updates and state variable matching):**
- `src/store/index.js`
- `src/store/simulationStore.js`
- `src/components/GraphCanvas.jsx`
- `src/components/index.js`
- `src/components/TopBar.jsx`
- `src/components/Sidebar.jsx`
- `src/components/NodeInspector.jsx`
- `src/components/EdgeInspector.jsx`
- `src/components/FlagManager.jsx`
- `src/components/nodes/StoryNode.jsx`
- `src/components/edges/ConditionalEdge.jsx`
- `src/utils/fileSystem.js`

**PROTECTED:**
- `src/utils/conditionEvaluator.js`
- `src/App.jsx`
- Component structures fundamentally unrelated to state selection

### Migration flags
- **S01 — Rename `graphStore` → `narrativeStore`**: 
  - Touches: Cross-store reads (LBA-01) and project context imports.
  - Flag as: **PROCEED WITH CAUTION** (Requires sweeping through and accurately updating all internal import references while preserving synchronous `getState()` calls in `simulationStore`).
- **S03 — Replace bare UUID IDs with prefixed UUIDs**: 
  - Touches: DC-05 (ID format invariants) and HS-04.
  - Flag as: **MIGRATION REQUIRED** (While generating new entities will use prefixed identifiers, `loadGraph` functionality must be explicitly backward compatible to import old graph files containing unstructured IDs).
- **S23 — Dark-mode-only theme**: 
  - Touches: DC-07 (CSS variable naming convention).
  - Flag as: **PROCEED WITH CAUTION** (Hex colors map directly, but arbitrarily changing CSS variable naming keys will break elements relying on them implicitly).
- **S25 — Create `uiStore`, move selection out of narrative store**: 
  - Touches: BI-04, BI-05, BI-16 (Selection clearances) alongside LBA-05.
  - Flag as: **MIGRATION REQUIRED** (This actively fractures the current atomic delete capability. You must specifically re-establish cross-store synchronicity to ensure the `uiStore` clears its selections when entities are deleted or graphs loaded in `narrativeStore`).

### Suggested phase shape
- **Phase 1: Aesthetics** — Finalize dark-mode updates inside `tokens.css` and `global.css`. (Purely styling, doesn't impact logic layer).
- **Phase 2: UI State Extraction** — Implement `uiStore.js` capturing selection/grid logic. Critically wire cross-store dependencies allowing node/edge deletions in `graphStore` to invoke selection resets within `uiStore`.
- **Phase 3: ID System Migration** — Transition `uuid.js` to emit prefixed format IDs (`n-`, `e-`, `f-`). Prove compatibility logic operates safely for unprefixed ID deserialization in legacy projects.
- **Phase 4: Store Consolidation** — Migrate `graphStore.js` functionality into `narrativeStore.js`. Update global references from `useGraphStore` to `useNarrativeStore`.
