<!-- 0311_reflect-user.md -->

## ROLE
You are a senior engineer helping reflect on a completed
iteration. You surface what the run files already know
so the user only fills in what only they know.

<!-- pipeline: 0309 Document → 0310 Commit → 0311 Reflect -->

## CONTEXT
Load these files:
1. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0301_understand.md` — original state map
2. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0302_scope.md` — iteration scope and definition of done
3. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0303_phases.md` — planned phases
4. All `ran_0304_execute_[1..N].md` — execution reports per phase
5. All `ran_0305_self-review_[1..N].md` — self-review findings per phase
6. All `ran_0307_test_[1..N].md` — test results per phase
7. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0308_audit_[PASS_NUMBER].md` — final audit verdict

## TASK
Pre-fill Part 1 from the loaded files.
Save to: `/informations/runs/[DD-MM-YYYY]_iteration/ran_0311_reflect.md`

> **For the user:** Read Part 1. Then fill Part 2 completely —
> these are your observations, not the AI's.

---

## Part 1 — AI fills, user reviews

### What the plan said
<!-- AI summarises the planned phases and their goals in
plain language. What behavior was targeted for change
and what was declared preserved. -->

### What actually happened
<!-- AI summarises what each phase produced, any PLAN GAP,
SCOPE EXPANSION, RULE CONFLICT, or RULE CANDIDATE flags
raised across all ran_0304_execute files. -->

### What was caught and fixed
<!-- AI summarises issues found across all
ran_0305_self-review files and what was fixed.
If all phases returned PASS, state that. -->

### Test summary
<!-- AI summarises Group A, B, and C results across all
ran_0307_test files.
State total: X tests, X passed, X failed.
State final regression verdict: CLEAN / BROKEN -->

### Audit passes required
<!-- AI states how many audit passes were needed
and the final verdict -->

---

## Part 2 — User fills, AI does not edit

### Was the behavior delta accurate before we started?
[ ] Yes — the plan described exactly what needed to change
[ ] No — [what the plan got wrong about the current behavior]

### Did 0301 Understand reveal anything surprising?
[ ] Yes — [what was found]
[ ] No

### Did the change stay within the accepted blast radius?
[ ] Yes
[ ] No — [what got touched unexpectedly]

### Was anything harder to change than expected?
[ONE THING — or "NOTHING SURPRISING"]

### Did this change reveal a fragility in the architecture?
[ ] Yes — [what is now obviously too tightly coupled]
[ ] No

### Is there a rule that should have protected this area?
[NEW RULE TO ADD — or "EXISTING RULES WERE SUFFICIENT"]

### Carry forward to next push
[ONE SENTENCE — what this change enables or what
still needs to be done in this area]