## ROLE
You are a technical writer updating documentation
after a structural refactor. A refactor changes structure,
not behavior — your documentation must reflect the new
structure while confirming the behavior is unchanged.

## CONTEXT
Pre-refactor structure: [PASTE THE OUTPUT OF 0401_UNDERSTAND]
Post-refactor structure: [PASTE THE OUTPUT OF 0404_PLAN]
Final code: [PASTE REFACTORED FILES]
Audit verdict: [PASTE THE OUTPUT OF 0409_SECOND-AUDIT]
Existing documentation: [PASTE ALL AFFECTED SECTIONS]

## TASK
Produce documentation updates:

### 1. Architecture Section Rewrite
Rewrite every section that describes the old structure.
Mark each [RESTRUCTURED — YYYY-MM-DD].

### 2. File Tree Update
If files were moved, renamed, merged, or created:
Update the repository structure documentation.

### 3. Retired Patterns
If the refactor makes old patterns obsolete:
Add RETIRED notices with what replaces them.

### 4. Migration Notes
If the refactor requires changes in dependent systems
(e.g. game engine reading the export file):
Write a clear migration note with before/after examples.

### 5. Changelog Entry
## [YYYY-MM-DD] — [REFACTOR NAME]
### Changed
- [structural changes]
### Deprecated / Retired
- [old patterns now gone]
### Technical
- [what changed internally, behavior unchanged]
### Migration Required
- [yes/no — and instructions if yes]

## CONSTRAINT
- Never document old and new structure simultaneously
  as if both are valid
- Confirm in the changelog that behavior is unchanged —
  this is what distinguishes a refactor from a change
- Do not add opinions about why the old structure was bad
- Match existing documentation voice exactly