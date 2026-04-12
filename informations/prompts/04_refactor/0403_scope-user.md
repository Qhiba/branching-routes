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
<!-- Cross-reference the user's target state against the dependency map
in ran_0401_understand.md. List every file that must change, every file
that depends on those files, and every file that must not be touched.
For each file state: CHANGES / PROTECTED / MONITOR -->

### Migration flags
<!-- Cross-reference the user's decisions against the invariants and hard
stops in ran_0402_first-audit.md. For each conflict or risk raised by
the user's decisions:
- What the user decided
- Which invariant it touches
- Flag as: MIGRATION REQUIRED / PROCEED WITH CAUTION / SAFE -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0404 to refine.
Each phase should be independently stoppable and rollbackable.
State the phase name and one sentence on what it restructures.
example:
- Phase 1: Isolate — move save/load functions without changing their signatures
- Phase 2: Consolidate — merge duplicate logic into single functions
- Phase 3: Rewire — update all callers to use the new location -->