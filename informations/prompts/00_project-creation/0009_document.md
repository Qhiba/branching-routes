## ROLE
You are a technical writer creating the initial project documentation.
This is a new project — there are no existing docs. You are writing the foundation.

> **Flow:** This step runs once after Audit returns SHIP.
> `0008 Audit (SHIP) → 0009 Document → 0010 Commit → 0011 Reflect`

## CONTEXT
Project name:
[PROJECT NAME]
<!-- example: "Branching Routes" -->

One-line description (from Brainstorm context — `ran_0001_brainstorm.md`):
[WHAT THE PROJECT IS]
<!-- example: "A visual editor for branching narrative games with live simulation" -->

Tech stack (from Scope Q6 — `ran_0002_scope.md`):
[STACK]
<!-- example: "React 18 + Vite, plain JavaScript (.jsx/.js), no backend, browser-only" -->

What was built (from Scope Q3 — `ran_0002_scope.md`):
[PASTE SCOPE Q3 — what this push delivers]
<!-- example: "A working graph editor where the user can create nodes, connect them, and export the structure as JSON." -->

Architecture rules (from Plan §1 — `ran_0003_plan.md`):
[PASTE ALL ARCHITECTURE RULES]

Data model with example JSON (from Plan §4 — `ran_0003_plan.md`):
[PASTE THE FULL DATA MODEL SECTION INCLUDING EXAMPLE JSON]

Risk register (from Plan §5 — `ran_0003_plan.md`):
[PASTE THE RISK REGISTER]

File map (from Plan §3 — `ran_0003_plan.md`):
[PASTE THE COMPLETE FILE MAP]

Folder structure (from Scope Q7 — `ran_0002_scope.md`):
[PASTE Q7 ANSWER]
<!-- example: "Standard Vite scaffold. src/components/, src/store/, src/utils/" -->

Final code (from Execute + Fix reports):
[PASTE ALL CURRENT FILE CONTENTS]

Audit verdict (from Audit §5 — `ran_0008_audit.md`):
[PASTE THE VERDICT LINE]
<!-- example: "SHIP — working graph editor with node creation, connections, and JSON export." -->

## TASK
Create the initial project documentation. Produce **5 files**:

### 1. `project_overview.md`
- Project name and one-line description
- Tech stack
- Folder structure with one-line description per folder
- References to the other documentation files

### 2. `codebase_features.md`
- For each component/utility in the file map:
  - File path
  - Purpose (one sentence)
  - Key exports
  - Dependencies
- Changelog — first entry:
  `## [YYYY-MM-DD] — Initial Creation`
  `### Added`
  List everything that was built

### 3. `architecture_rules.md`
- Copy all rules from Plan §1, formatted as a numbered list
- For each rule: the rule statement + a one-line rationale (why it exists)
- Mark this file as the **single source of truth** for rules in this project
- Future work types (iteration, refactor, etc.) will reference this file directly

### 4. `risk_register.md`
- Copy all risks from Plan §5
- For each risk: description, likelihood, impact, mitigation strategy
- Add a "Status" column: OPEN / MITIGATED / RESOLVED
- Initial status for all risks: OPEN

### 5. `example_datamodel.json`
- A complete, valid example of the project's data format
- Based on Plan §4's data model definition
- Must be parseable JSON — no comments, no placeholders
- Should represent a realistic minimal example (not empty, not trivially small)

## Save Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_project-creation/ran_0009_document.md`

Save the 5 documentation files to:
- `/informations/project_overview.md`
- `/informations/codebase_features.md`
- `/informations/architecture_rules.md`
- `/informations/risk_register.md`
- `/informations/example_datamodel.json`

## CONSTRAINT
- Do not document features that were not shipped
- Do not add opinions or recommendations — describe only what exists
- Keep all code references accurate to the final file paths
- Architecture rules must be copied exactly from Plan §1 — do not paraphrase or reinterpret
- `example_datamodel.json` must be valid JSON — test it mentally before writing