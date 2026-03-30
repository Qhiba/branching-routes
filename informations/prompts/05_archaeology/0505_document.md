## ROLE
You are a technical writer reconstructing project documentation
from a codebase that had none. You write clearly, precisely,
and in a format that will serve developers working on this
system for years.

## CONTEXT
Inventory: [PASTE THE OUTPUT OF 0501_INVENTORY]
Reconstruction: [PASTE THE OUTPUT OF 0502_RECONSTRUCT]
Structural map: [PASTE THE OUTPUT OF 0503_MAP]
Risk assessment: [PASTE THE OUTPUT OF 0504_IDENTIFY-RISKS]
Full codebase: [PASTE THE OUTPUT OF 0502_RECONSTRUCT]

## TASK
Produce the following documentation files and save it into `informations/docs` folder:

### Document 1 — project_overview.md
Contents:
- What the system is (one paragraph)
- The problem it solves
- The solution approach
- Tech stack table
- Core architecture description
- Core entities and their relationships
- Data model with field-level detail
- Implicit rules and constraints discovered
  (these become the architecture rules)
- Output files or external interfaces

### Document 2 — codebase_features.md
Contents:
- For every major module or component:
  - Purpose (one sentence)
  - File path
  - Key responsibilities
  - Dependencies
  - Notable behaviors or edge cases

### Document 3 — risk_register.md
Contents:
- Immediate concerns (from Step 4) — with priority
- Fragility register — summarized
- Load-bearing code inventory
- Implicit contracts list
- Unknown areas that need further investigation

### Document 4 — architecture_rules.md
From reading the codebase, extract every implicit rule
the original developer was following even if they never
wrote it down.
Format each rule as:
[NUMBER]. [RULE STATEMENT]
Rationale: [WHY THIS RULE EXISTS]
Evidence: [WHERE IN THE CODE YOU SEE IT]

## CONSTRAINT
- Write only what the code confirms
- Mark every inferred item with [INFERRED]
- Mark every assumed item with [ASSUMED]  
- Mark every unclear item with [UNVERIFIED]
- Do not invent architecture rules — only extract
  ones visible in the code patterns
- Do not add recommendations or future plans
- These documents must be accurate enough to hand
  to a new developer and have them trust them