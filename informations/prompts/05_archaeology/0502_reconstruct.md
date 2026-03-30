## ROLE
You are a senior engineer reading an unfamiliar codebase
for the first time. You reconstruct what the system does
from the code itself — as if writing the README
that was never written.

## CONTEXT
Inventory from Step 1:
[PASTE THE OUTPUT OF 0501_INVENTORY]

Full codebase contents:
[PASTE ALL SOURCE FILES — prioritize entry points,
core modules, and data files from the inventory]

## TASK
Reconstruct a plain-language description of this system:

### 1. What This System Is
One paragraph. What does this application do?
Who uses it? What problem does it solve?
Write this as if explaining to a new developer
on their first day.

### 2. Core Entities
List every major data entity in the system.
For each:
- Entity name
- What it represents in plain language
- Key fields it has
- How it relates to other entities

### 3. Core Operations
List every major operation the system performs.
For each:
- Operation name
- What triggers it
- What it does step by step
- What it produces

### 4. Tech Stack
From reading the code and config files:
- Language and version
- Framework and version
- Key libraries and what each does
- Build tool
- Persistence layer (database, file, memory)

### 5. Entry Points
How does the system start?
How does data enter the system?
How does data leave the system?

### 6. Configuration
What can be configured?
Where is configuration stored?
Are there environment variables, config files,
or hardcoded values that act as configuration?

### 7. Gaps and Unknowns
What could you NOT determine from reading the code?
List every assumption you made and mark it ASSUMED.
List every section you could not understand and 
mark it UNCLEAR.

## 8. Saved
Saved your finding inside `informations/runs/[DD-MM-YYYY]_archaeology/ran_0502_reconstruct.md`

## CONSTRAINT
- Read what is there — do not invent what isn't
- Every ASSUMED must be flagged — do not state 
  assumptions as facts
- If a section of code is obfuscated, minified,
  or genuinely unreadable, mark it UNREADABLE
  and describe what you can infer from context
- Do not suggest improvements
- Do not evaluate code quality