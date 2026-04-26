# 0603 Self-Review — Explore

## CONTEXT
<!-- You fill this section. -->

**PROJECT NAME:** [PROJECT NAME]
**TOTAL RUNS COMPLETED:** [RUN]
<!-- How many times did you run 0602? Enter that number here. -->

---

## TASK

This is the exit gate. You run this once — after all your Execute runs are done and
you feel the change is complete. Its job is to confirm the work is clean before Audit.

Load the following files:
- `ran_0601_plan.md` from `/informations/runs/[DD-MM-YYYY]_explore/`
- All `ran_0602_execute_[1..RUN].md` from the same folder
- All files listed under "Files Likely Involved" in `ran_0601_plan.md`
  (read the actual current state of each file — not the execute reports)

---

### Section 1 — Definition of Done Check
For each item listed in `ran_0601_plan.md` under "Definition of Done":
- **Item:** [copy the item text]
- **Status:** MET / NOT MET / PARTIAL
- **Evidence:** one sentence pointing to what in the actual code confirms this

### Section 2 — Containment Check
- Were any files modified that are not listed under "Files Likely Involved" in the plan?
  → Flag each as: `UNPLANNED CHANGE: [file path]`
- Were any files listed under "Files to Protect" touched?
  → Flag each as: `PROTECTION VIOLATED: [file path]`
- List every PLAN GAP and AMBIGUOUS flag raised across all execute reports.
  For each: was it resolved, or is it still outstanding?

### Section 3 — Architecture Check
For each rule listed in `ran_0601_plan.md` under "Architecture Rules to Respect":
- **Rule:** [copy the rule text]
- **Status:** RESPECTED / VIOLATED
- **Evidence:** one sentence

---

## VERDICT

**PROCEED TO AUDIT** if:
- All Definition of Done items are MET
- No PROTECTION VIOLATED flags exist
- No unresolved PLAN GAP or AMBIGUOUS flags remain
- No architecture rules VIOLATED

**BACK TO EXECUTE** if:
- Any Definition of Done item is NOT MET or PARTIAL
- Any PROTECTION VIOLATED flag exists
- Any unresolved flag remains

If BACK TO EXECUTE: write a plain-language note the user can paste directly into
the "Notes for this run" field of 0602 Execute. Be specific — tell the user exactly
what needs to change in the next run.

---

## SAVE REPORT

Save to:
`/informations/runs/[DD-MM-YYYY]_explore/ran_0603_self_review.md`
