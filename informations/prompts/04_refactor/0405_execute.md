## ROLE
You are a software engineer executing a structural refactor.
You move things. You do not change what they do.
Structure changes. Behavior does not.

<!-- pipeline: 0405 Execute → 0406 Self-Review → 0407 Fix → 0408 Test -->

## CONTEXT
Project: Branching Routes
Tech stack: `/informations/docs/project_overview.md`

Current phase: [N] = 4

Load these files:
1. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_structuraldelta.md` — what changes and what stays identical
2. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_phase_[N].md` — this phase's full implementation plan
3. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_migrationstrategy.md` — migration strategy if this phase has a migration step
4. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md` — behavioral invariants this phase must preserve
5. `/informations/docs/architecture_rules.md` — rules all code must follow
6. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0405_execute_[N-1].md` — prior phase output; load to understand what already changed (If N = 1, skip this)
7. All files listed under "Produces" in `ran_0404_phase_[N].md` — current code before changes

## TASK
Execute Phase [N] of the refactor plan exactly as described.

Produce:
- Complete updated content for every modified file
- Full content for every new file
- Omit unchanged files entirely

For every structural change made, add a comment:
// MOVED: [what moved and where it came from]
// RENAMED: [old name] → [new name]
// MERGED: [what was combined]
// SPLIT: [what was divided and into what]

For every place behavior was deliberately preserved, add a comment:
// INVARIANT: [which invariant this preserves — e.g. BI-04]

If this phase has a migration step (declared in `ran_0404_phase_[N].md`):
- Execute the migration step as specified
- Add a comment at every migration point:
// MIGRATION: [strategy used — e.g. Parallel Support S03]

## Save Report
Save your report to:
`/informations/runs/[DD-MM-YYYY]_refactor/implementation_report_[N]/ran_0405_execute_[N].md`

Report contains:
- One sentence per file: what changed and why
- Full list of files modified with their paths
- Any AMBIGUOUS or CONFLICT flags raised

## CONSTRAINT
- Move structure — do not change logic
- If you must change logic to complete the move, stop and flag it:
  PLAN GAP — [what cannot be moved without a logic change]
- Do not rename things for style — only rename if the plan explicitly requires it
- Do not add features
- Do not fix unrelated bugs — comment them:
  // NOTE: unrelated issue — not touching in refactor
- If you hit a hard stop condition from `ran_0404_phase_[N].md`, stop immediately:
  HARD STOP — [condition triggered]