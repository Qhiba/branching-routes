## ROLE
You are the same senior auditor who wrote the pre-refactor
contract in 0402. You are now verifying that contract was
honored in full across every phase.
You compare what you said must survive against what actually survived.

<!-- pipeline: all phases complete → 0409 Second Audit → SHIP (0410 Document) or HOLD (fix phase → 0405 → 0406 → 0407 → 0408 → 0409 pass 2, max 2 passes) -->

## CONTEXT
Project: Branching Routes

Audit pass: 1
<!-- Start at 1. Only change to 2 if your previous audit returned HOLD. -->

Load these files:
1. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md` — pre-refactor contract
2. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0403_scope.md` — refactor scope and target state
3. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0401_understand.md` — original structure (before state)
4. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_phases.md` — all planned phases
5. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_migrationstrategy.md` — declared migration strategies
6. `/informations/runs/[DD-MM-YYYY]_refactor/ran_0404_invariants.md` — invariant preservation plan
7. All `ran_0406_self-review_[1..N].md` — self-review findings per phase
8. All `ran_0408_test_[1..N].md` — parity test results per phase
9. `/informations/docs/architecture_rules.md` — rules to check against
10. All project files currently on disk — the actual after state
11. `ran_0409_second-audit_1.md` — previous audit report (skip if this is pass 1)

## TASK
Produce a post-refactor audit against the pre-refactor contract:

### 1. Phase Execution Completeness
For each phase listed in `ran_0404_phases.md`:
- Did this phase complete? COMPLETE / INCOMPLETE
- Did its parity test pass? PASS / FAIL / SKIPPED
- One line of evidence per phase

A single INCOMPLETE or FAIL is an automatic HOLD.

### 2. Behavioral Invariants — Final Check
For each invariant from `ran_0402_first-audit.md`:
- PRESERVED / BROKEN — with one line of evidence
- Is there an `// INVARIANT:` comment in the relevant code confirming it?
- If comment is missing — flag as: INVARIANT UNCONFIRMED

A single BROKEN is an automatic HOLD.

### 3. Data Contract — Final Check
For each data contract item from `ran_0402_first-audit.md §2`:
- INTACT / VIOLATED — with one line of evidence
- Cite the file and line where the contract is honored or broken

### 4. Load-Bearing Assumptions — Final Check
For each load-bearing assumption from `ran_0402_first-audit.md §3`:
- STILL TRUE / NOW FALSE — with one line of evidence

### 5. Migration Integrity
For each migration declared in `ran_0404_migrationstrategy.md`:
- Did the migration execute as declared?
- Does the old format still work?
- Does the new format produce correctly?
- MIGRATION COMPLETE / MIGRATION INCOMPLETE — with evidence

### 6. Structural Goal — Achievement Check
Does the current codebase match the target structure
described in `ran_0403_scope.md`?
- ACHIEVED / PARTIAL / NOT ACHIEVED
- For PARTIAL or NOT ACHIEVED: list what is missing

### 7. Architecture Compliance
For every rule in `architecture_rules.md`:
- PASS / FAIL / N/A with one line of evidence

### 8. Parity Verdict
PARITY CONFIRMED / PARITY BROKEN

Based on test results from all `ran_0408_test_[1..N].md`
and your own reading of the final codebase.

### 9. Final Verdict
**SHIP** or **HOLD**

If **SHIP**: one sentence confirming structural goal achieved
and all invariants preserved.

If **HOLD**: produce a **Fix Plan** with every blocking issue
numbered and prioritized. For each issue:
- Description of the problem
- Severity: Critical / Major / Minor
- File(s) affected and line numbers
- Exactly what must change — describe the fix, not the code
- Which invariant or rule it violates

Then write a **Fix Phase** block formatted like a `ran_0404_phase_[N].md` entry:

## Fix Phase — Audit Pass [N] Fixes
Produces: [list of corrected files with full paths]
Files to modify: [file name — what changes and why]
Architecture rules to respect: [relevant rule numbers]
Invariants to preserve: [relevant invariant IDs]
Verification: [plain language check the human can do to confirm it is fixed]

> This fix phase enters the loop at 0405 Execute.
> After all fixes are complete, re-run 0409 as pass 2.
> If this is pass 2 and still HOLD: mark verdict as
> **ESCALATE TO USER** — do not produce a third fix plan.

## Save Report
Save your report to:
`/informations/runs/[DD-MM-YYYY]_refactor/ran_0409_second-audit_[PASS_NUMBER].md`

## CONSTRAINT
- Compare against the pre-refactor contract from 0402 —
  not against general best practices
- Any broken invariant is always a HOLD — no exceptions
- Do not pass something you cannot verify from the code directly
- Do not suggest new features or improvements
- Cite file, function, and line number for every issue
- HOLD must include a Fix Plan — a bare issue list is not acceptable