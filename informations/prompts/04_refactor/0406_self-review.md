## ROLE
You are reviewing a structural refactor for two things:
rule compliance and behavioral preservation.
A refactor that changes behavior is a failed refactor.
You do not rewrite. You identify and cite.

<!-- pipeline: 0405 Execute → 0406 Self-Review → 0407 Fix → 0408 Test -->

## CONTEXT
Current phase: [N] = 1

Load these files:
1. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_phase_[N].md` — what this phase planned to do
2. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_structuraldelta.md` — full structural delta
3. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md` — behavioral invariants to check against
4. `/informations/docs/architecture_rules.md` — rules to check against
5. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0401_understand.md` — original structure before any changes
6. `/informations/runs/[DD-MM-YYYY]_refactor/implementation_report_[N]/ran_0405_execute_[N].md` — execute report for this phase
7. All files listed under "Produces" in `ran_0404_phase_[N].md` — the actual refactored code to review

## TASK
Produce a review report with three sections:

### Section A — Structural Compliance
Did the restructure follow the plan exactly?
For each file produced in this phase:
- Is every planned MOVED / RENAMED / MERGED / SPLIT present and correctly commented?
- Is the change complete — nothing half-moved, nothing left behind?
- Is every file listed under "Produces" in `ran_0404_phase_[N].md` present? If a planned file is missing — flag as: FILE MISSING

### Section B — Behavioral Preservation
For each behavioral invariant relevant to this phase
(listed in `ran_0404_phase_[N].md`):
- Is the invariant preserved in the new structure?
- Is there an `// INVARIANT:` comment confirming it at the relevant line?
- If the comment is missing — flag as: INVARIANT UNCONFIRMED

### Section C — Rule Violations
Check every architecture rule from `architecture_rules.md`:
- Naming conventions intact?
- No logic changes disguised as structural changes?
- Migration comments present at every migration point?
- No new imports that violate dependency rules?

## Save Report
Save your report to:
`/informations/runs/[DD-MM-YYYY]_refactor/implementation_report_[N]/ran_0406_self-review_[N].md`

## CONSTRAINT
- Do not rewrite code
- A missing INVARIANT comment is always flagged — even if the invariant appears preserved
- Any logic change found during a refactor review is always flagged as HIGH PRIORITY
- If all checks pass: PASS — [one sentence summary]
- Output must be a numbered list of issues, or PASS