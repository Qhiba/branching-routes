# 0604 Audit — Explore

## CONTEXT
<!-- You fill this section. -->

**PROJECT NAME:** [PROJECT NAME]
**PASS NUMBER:** [1]
<!-- Start at 1. Change to 2 only if the previous audit returned HOLD. -->

---

## TASK

Load the following files:
- `ran_0601_plan.md` from `/informations/runs/[DD-MM-YYYY]_explore/`
- `ran_0603_self_review.md` from the same folder
- All `ran_0602_execute_[N].md` files from the same folder
- All files listed under "Files Likely Involved" in `ran_0601_plan.md`
  (read actual current state)
- `/informations/docs/architecture_rules.md`
- `/informations/docs/risk_register.md`

---

### Section 1 — Definition of Done
Confirm every Definition of Done item from `ran_0601_plan.md` is fully and cleanly met
in the actual current code. Do not rely on execute reports — check the code itself.

For each item:
- **Status:** CONFIRMED / FAILED
- **Evidence:** one sentence

### Section 2 — Containment
Confirm the change is fully contained within the declared scope.
- Any file modified outside "Files Likely Involved"? Flag as SCOPE BREACH.
- Any file modified inside "Files to Protect"? Flag as PROTECTION BREACH.

### Section 3 — Architecture Compliance
Confirm every rule listed in `ran_0601_plan.md` under "Architecture Rules to Respect"
is honored in the actual code.

For each rule:
- **Status:** HONORED / VIOLATED
- **Evidence:** one sentence

### Section 4 — Risk Check
Review the risks listed in `ran_0601_plan.md`:
- Did any WARNING materialize into an actual problem? Describe it.
- Did any BLOCKER go unresolved? Flag it.

### Section 5 — Flags Review
List every PLAN GAP and AMBIGUOUS flag raised across all execute reports.
For each: RESOLVED or OUTSTANDING. If OUTSTANDING, describe the problem.

---

## VERDICT

**SHIP** — all sections clean; proceed to 0605 Document

**HOLD** — one or more issues found
For each issue:
- What is wrong
- What needs to be fixed (plain language)
- Re-enter at 0602 Execute with the fix note. Increment RUN.
  After fixing, re-run 0603 Self-Review before returning to Audit.

Maximum 2 passes. If still HOLD after pass 2:
**ESCALATE TO USER** — no third fix plan is produced. Describe what remains unresolved
and why it could not be automatically resolved.

---

## SAVE REPORT

Save to:
`/informations/runs/[DD-MM-YYYY]_explore/ran_0604_audit_[PASS_NUMBER].md`
