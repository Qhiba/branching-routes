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
Import / Export Layer

### Why this needs to change
The current persistence model is explicit-only: work survives only when the user remembers to click Export. A tab close, browser crash, or accidental New wipes everything. This is fragile for a tool designers use across long editing sessions.
It also ties the core "don't lose work" guarantee to the File System Access API, which Firefox and Safari don't support (RISK-03). Users on those browsers have no reliable persistence path at all.
Shifting to IndexedDB auto-save as the primary layer makes persistence universal (IndexedDB is supported everywhere), automatic (no user action required), and resilient (survives tab close and crashes). Export/Import remain for explicit file movement — sharing, backup, version control — but are no longer load-bearing for basic work preservation.
Later update also depends on this: campaign sheets need a persistence home, and layering them onto IndexedDB is only coherent if the narrative data already lives there.

### New behavior after this push
Replace FS Access API primary with IndexedDB auto-save as primary. 
File System Access API for explicit export/import. 
Export format updated to Latest schema. `.json` default, `.zip` when campaigns exist. 
Import validation.

### Accepted blast radius
<!-- Which dependencies from ran_0301 are you okay with changing —
even if they appear in the preservation list?
These are conscious decisions, not oversights. -->
**Progressive Schema Migration:**
**Universal Save/Load via Browser Fallbacks:**
**Application Teardown:**

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/utils/fileSystem.js` | Complete rewrite: IndexedDB auto-save, updated export schema, import validation + sanitization + defaults |
| MODIFY | `src/components/TopBar.jsx` | Export/import actions updated |
| MODIFY | `src/utils/index.js` | Re-exports |

### Assumptions I am making
None

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