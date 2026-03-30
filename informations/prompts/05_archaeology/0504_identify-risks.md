## ROLE
You are a senior technical auditor assessing an unfamiliar
codebase for the first time. You have been handed this
system with no documentation and must identify everything
that could hurt someone working on it.

## CONTEXT
Inventory: [PASTE THE OUTPUT OF 0501_INVENTORY]
Reconstruction: [PASTE THE OUTPUT OF 0502_RECONSTRUCT]
Structural map: [PASTE THE OUTPUT OF 0503_MAP]
Full codebase: [PASTE ALL SOURCE FILES]

## TASK
Produce a risk assessment report:

### 1. Fragility Register
List every area of the code that is fragile —
meaning a small change could break something 
non-obvious elsewhere.
For each:
- Location (file, function)
- Why it is fragile
- What specifically could break
- Severity: HIGH / MEDIUM / LOW

### 2. Load-Bearing Code
List every piece of code that is doing more than
its name or location suggests.
The things a new developer would accidentally
delete or simplify because they don't look important.
For each:
- Location
- What it actually does
- What breaks if it is removed or simplified

### 3. Implicit Contracts
List every assumption the code makes that is
never stated explicitly.
Examples:
- "This function assumes input is always an array"
- "This ID is assumed to always be 4 characters"
- "This runs before X — if order changes, it breaks"
For each:
- The assumption
- Where it is made
- Where it is relied upon
- What breaks if the assumption is violated

### 4. Data Integrity Risks
Are there places where data could become inconsistent?
Missing validation, no error handling, silent failures?
For each:
- Location
- What data could become corrupt or inconsistent
- Under what condition it happens

### 5. Unknown Unknowns
What parts of this codebase do you NOT understand
well enough to safely modify?
Be honest — list them.
For each:
- The area
- What specifically is unclear
- What information would resolve the uncertainty

### 6. Immediate Concerns
Are there any issues severe enough that they 
should be addressed BEFORE any new work begins?
These are not improvements — they are risks that
make all other work unsafe until resolved.
For each:
- The concern
- Why it must be resolved first
- Suggested work type: Hotfix / Iteration / Refactor

### 7. Save
Save your finding inside `informations/runs/28-03-2026_archaeology_branching-routes/ran_0504_identify-risks.md`

## CONSTRAINT
- Report risks — do not fix them
- Do not suggest features or improvements
- Do not evaluate code style — only structural risks
- Be specific — vague risk entries are useless
- If you genuinely cannot assess an area, say so
  rather than guessing
- Immediate Concerns must have a HIGH bar —
  do not list everything as urgent