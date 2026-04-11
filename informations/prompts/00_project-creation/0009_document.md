## ROLE
You are a technical writer creating the initial project documentation.
This is a new project — there are no existing docs. You are writing the foundation.

> **Flow:** This step runs once after Audit returns SHIP.
> `0008 Audit (SHIP) → 0009 Document → 0010 Commit → 0011 Reflect`

## CONTEXT
Project name: Branching Routes
<!-- Set once at project creation — do not change -->

Stack: 
React + Vite for a fast, browser-based localhost application without a backend. React Flow handles the visual canvas and node interactions, while Zustand manages the global graph state and live variable checking.
<!-- Set once at project creation — do not change -->

Load these files:
1. `ran_0001_brainstorm.md` — one-line project description
2. `ran_0002_scope.md` — Q3 (what was built), Q7 (folder structure)
3. `ran_0003_architecture.md` — architecture rules
4. `ran_0003_datamodel.md` — data model and example output structure
5. `ran_0003_filemap.md` — all expected files
6. `ran_0003_riskregister.md` — risk register
7. All project files listed in `ran_0003_filemap.md` — the actual current code
8. `ran_0008_audit_[latest pass].md` — audit verdict

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
- Copy all rules from `ran_0003_architecture.md`, formatted as a numbered list
- For each rule: the rule statement + a one-line rationale (why it exists)
- Mark this file as the **single source of truth** for rules in this project
- Future work types (iteration, refactor, etc.) will reference this file directly

### 4. `risk_register.md`
- Copy all risks from `ran_0003_riskregister.md`
- For each risk: description, likelihood, impact, mitigation strategy
- Add a "Status" column: OPEN / MITIGATED / RESOLVED
- Initial status for all risks: OPEN

### 5. Example data file
- A complete, valid example of the project's data format
- Based on the data model definition in `ran_0003_datamodel.md`
- Use the format and file extension defined in `ran_0003_datamodel.md`
- Must be parseable — no comments, no placeholders
- Should represent a realistic minimal example (not empty, not trivially small)

## Save Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_project-creation/ran_0009_document.md`

Save the 5 documentation files to:
- `/informations/project_overview.md`
- `/informations/codebase_features.md`
- `/informations/architecture_rules.md`
- `/informations/risk_register.md`
- `/informations/example_datamodel.[format from ran_0003_datamodel.md]`

## CONSTRAINT
- Do not document features that were not shipped
- Do not add opinions or recommendations — describe only what exists
- Keep all code references accurate to the final file paths
- Architecture rules must be copied exactly from `ran_0003_architecture.md` — do not paraphrase or reinterpret
- Example data file must be valid and parseable — test it mentally before writing