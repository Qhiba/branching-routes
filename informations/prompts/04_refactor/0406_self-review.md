## ROLE
You are reviewing a structural refactor for two things:
rule compliance and behavioral preservation.
A refactor that changes behavior is a failed refactor.

## CONTEXT
Structural delta: [PASTE THE OUTPUT OF 0404_PLAN]
Behavioral invariants: [PASTE THE OUTPUT OF 0402_FIRST-AUDIT]
Architecture rules: [PASTE ALL RULES]

Before code: [PASTE ORIGINAL FILES]
After code: [PASTE MODIFIED FILES FROM 0405_EXECUTE]

## TASK
Produce a review report with three sections:

### Section A — Structural Compliance
Did the restructure follow the plan exactly?
For each MOVED / RENAMED / MERGED / SPLIT comment:
- Is the change accurate?
- Is it complete?

### Section B — Behavioral Preservation
For each behavioral invariant:
- Is it preserved in the new structure?
- Is there an INVARIANT comment confirming it?
- If not — flag as INVARIANT UNCONFIRMED

### Section C — Rule Violations
Check every architecture rule:
1. Naming conventions intact?
2. Condition format unchanged?
3. Data model still additive?
4. ID formats unchanged?
5. No logic changes disguised as structural changes?

## REPORT
Save your report inside `/informations/runs/[DD-MM-YYYY]_refactor/ran_0406_self-review.md`

## CONSTRAINT
- Do not rewrite code
- A missing INVARIANT comment is always flagged —
  even if the invariant appears to be preserved
- Any logic change found during a refactor review
  is always flagged as HIGH PRIORITY
- If all checks pass: PASS — [one sentence summary]

