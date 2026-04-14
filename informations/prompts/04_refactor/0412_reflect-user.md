## ROLE
You are a senior engineer helping reflect on a completed refactor.
You surface what the run files already know so the user
only fills in what only they know.

<!-- pipeline: 0410 Document → 0411 Commit → 0412 Reflect -->

## CONTEXT
Load these files:
1. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md` — pre-refactor contract
2. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_phases.md` — planned phases
3. All `ran_0405_execute_[1..N].md` — execution reports per phase
4. All `ran_0406_self-review_[1..N].md` — self-review findings per phase
5. All `ran_0408_test_[1..N].md` — parity test results per phase
6. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0409_second-audit_[PASS_NUMBER].md` — final audit verdict

## TASK
Pre-fill Part 1 from the loaded files.
Save to: `/informations/runs/[DD-MM-YYYY]_refactor/ran_0412_reflect.md`

> **For the user:** Read Part 1. Then fill Part 2 completely —
> these are your observations, not the AI's.

---

## Part 1 — AI fills, user reviews

### What the plan said
<!-- AI summarises the four phases and their goals in plain language -->

### What actually happened
<!-- AI summarises what each phase produced, any PLAN GAP or HARD STOP
flags raised across all ran_0405_execute files, and any ESCALATE flags -->

### What was caught and fixed
<!-- AI summarises issues found in ran_0406_self-review files and
what was fixed. If all phases returned PASS, state that. -->

### Parity test summary
<!-- AI summarises Group A results across all ran_0408_test files.
State total: X invariants tested, X passed, X failed.
State final parity verdict: CONFIRMED / BROKEN -->

### Audit passes required
<!-- AI states how many audit passes were needed and the final verdict -->

---

## Part 2 — User fills, AI does not edit

### Was the pre-refactor contract complete?
[ ] Yes — every invariant was identified upfront
[ ] No — [what was missed and when you discovered it]

### Did Audit First catch everything important?
[ ] Yes
[ ] No — [what it missed]

### What was harder to move than expected?
[ONE THING — or "NOTHING SURPRISING"]

### Did the refactor reveal hidden coupling?
[ ] Yes — [what was more tightly coupled than you thought]
[ ] No

### Is the architecture cleaner now in a measurable way?
[ONE SENTENCE — be specific, not vague]

### What rule should we add to prevent
the problem this refactor solved?
[NEW RULE — or "THE PROBLEM WAS STRUCTURAL NOT RULE-BASED"]

### Was this refactor worth the risk?
[ ] Yes — [why]
[ ] Not yet — [what still needs to happen to justify it]

### Carry forward to next push
[ONE SENTENCE — what this refactor now makes possible
that wasn't possible before]