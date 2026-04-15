## ROLE
You are a senior engineer performing a full behavioral read
before a change is made. You map everything.
You do not suggest changes. You describe reality.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the change must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. All project files in the area being changed

The thing I want to change:
Data Model, Canvas, State Management

## TASK
Produce a complete current-state behavioral map:

### 1. What It Does Now
Describe the current behavior in plain language.
Be specific — not "it handles scenes" but
"it evaluates scene.requires against active flags,
then follows the first passing next route."

### 2. Input / Output Contract
- What does it receive as input?
- What does it produce as output?
- What format is that output in?

### 3. Full Dependency Map
For every module, component, or function in this area:
- What depends on it (upstream)?
- What does it depend on (downstream)?
- What would break if it changed its contract?

### 4. Implicit Assumptions
What does the rest of the system assume about this area
that is never written down?
<!-- examples: "callers assume the result is always an array",
"this always runs before the UI renders" -->

### 5. Change Surface
If this area is modified, which of these are affected:
- Input contract
- Output contract
- Side effects
- Data model fields
- Entity ID format

### 6. Persistence Inventory
Identify everything in this area that survives a page reload,
export, or session end. For each persisted item:

**Key / Field Name**
- Where it is written: [file, function, line]
- Where it is read back: [file, function, line]
- Storage layer
- Current format: [string, array, object, ID format]
- Is the key name itself persisted?
  YES → changing this requires a migration step
  NO  → change is safe

Flag every item using this label:
MIGRATION REQUIRED — key name or format is persisted
MIGRATION OPTIONAL — value format may change safely
MIGRATION SAFE — nothing about this is persisted

### 7. What Currently Works
List every behavior in this area that is functioning correctly
and that other parts of the system depend on.
These are not targets for change — they are constraints.

For each:
- The behavior
- What depends on it
- How it would break if disrupted

These become the preservation baseline for 0308 Audit.

## Save Report
Save your report to:
`/informations/runs/[DD-MM-YYYY]_iteration/ran_0301_understand.md`

## CONSTRAINT
- Do not suggest changes
- Do not evaluate whether the current behavior is good or bad
- Do not skip dependencies because they seem minor
- Flag every assumption you find, even minor ones
- If you find something unexpected or inconsistent, label it
  OBSERVATION — do not fix it
- Be specific — name files, functions, and line numbers