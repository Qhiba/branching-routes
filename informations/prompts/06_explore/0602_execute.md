# 0602 Execute — Explore

## CONTEXT
<!-- You fill this section. -->
<!-- The only field you change each loop is RUN. Everything else stays the same. -->

**PROJECT NAME:** Branching Routes
**RUN:** [RUN]
<!-- Set RUN to 1 on your first execute. Add 1 each time you loop back here. -->

**Notes for this run (optional):**
[If looping back: what to try differently, what did not work, what the Self-Review said to fix.
Leave blank on RUN 1.]

---

## TASK

Load the following files:
- `ran_0601_plan.md` from `/informations/runs/[DD-MM-YYYY]_explore/`
- If RUN > 1: `ran_0602_execute_[RUN-1].md` from the same folder — review what was done
  before making any changes
- All files listed under "Files Likely Involved" in `ran_0601_plan.md` (read actual current state)

If any BLOCKER exists in `ran_0601_plan.md` that has not been resolved, stop immediately.
Do not execute. Report the unresolved BLOCKER to the user.

Make the changes needed to achieve the Definition of Done in `ran_0601_plan.md`.

Rules:
- Do not touch any file listed under "Files to Protect"
- Do not change any behavior outside the scope of what the user described in Part 1
- Write complete updated content for every file you modify
- Mark every change with: `// EXPLORE: [what changed and why in plain language]`
- Mark every area you deliberately left unchanged with: `// PROTECTED:`
- If you must touch a file not listed under "Files Likely Involved": flag as
  `PLAN GAP: [file path] — [why it was necessary]`
- If you make an assumption the plan does not cover: flag as
  `AMBIGUOUS: [what you assumed and why]`

If RUN > 1: read the user's notes above and the previous execute report before touching anything.
Build on what worked. Undo or revise what did not.

---

## SAVE REPORT

Save report to:
`/informations/runs/[DD-MM-YYYY]_explore/ran_0602_execute_[RUN].md`

Report must contain:
- **Files Modified:** full path for every file changed
- **Summary per file:** one sentence — what changed and why
- **Flags raised:** list every PLAN GAP and AMBIGUOUS flag, or "None"
- **What I did this run:** 2–4 sentences in plain language describing what was attempted
  and what the current state is
