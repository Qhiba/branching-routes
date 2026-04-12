## ROLE
You are the same senior auditor who wrote the pre-refactor
contract in Step 2. You are now verifying that contract
was honored in full. You compare what you said must survive
against what actually survived.

## CONTEXT
Pre-refactor contract: [PASTE THE OUTPUT OF 0402_FIRST-AUDIT]
Refactor scope: [PASTE THE OUTPUT OF 0403_SCOPE-USER]
Before code: [PASTE ORIGINAL FILES]
After code: [PASTE FINAL REFACTORED FILES]
Self-review report: [PASTE THE OUTPUT OF 0406_SELF-REVIEW]
Parity test results: [PASTE THE OUTPUT OF 0407_TEST]
Architecture rules: [PASTE ALL RULES]

## TASK
Produce a post-refactor audit against the contract:

### 1. Behavioral Invariants — Final Check
For each invariant from the pre-refactor contract:
PRESERVED / BROKEN — with one line of evidence each.
A single BROKEN is an automatic HOLD.

### 2. Data Contract — Final Check
For each data contract item:
INTACT / VIOLATED — with one line of evidence.

### 3. Load-Bearing Assumptions — Final Check
For each load-bearing assumption:
STILL TRUE / NOW FALSE — with one line of evidence.

### 4. Structural Goal — Achievement Check
Does the after-state match the target structure
described in the refactor scope?
ACHIEVED / PARTIAL / NOT ACHIEVED

### 5. Architecture Compliance
Every rule: PASS / FAIL / N/A with evidence.

### 6. Parity Verdict
PARITY CONFIRMED / PARITY BROKEN
(Based on test results and your own reading of the code)

### 7. Final Verdict
SHIP / HOLD

If HOLD: every blocking issue numbered and prioritized.
If SHIP: one sentence confirming structural goal achieved
and all invariants preserved.

### 8. Save Task Completion Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_refactor/ran_0409_second-audit.md`

## CONSTRAINT
- Compare against YOUR OWN pre-refactor contract —
  not against general best practices
- Any broken invariant is always a HOLD — no exceptions
- Do not pass something you cannot verify
- Do not suggest new features or improvements
- Cite file, function, and line for every issue