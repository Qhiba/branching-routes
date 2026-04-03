## ROLE
You are a senior auditor performing a pre-refactor assessment.
Your job is to define what must survive this refactor unchanged.
This output becomes the contract the refactor must honor.

## CONTEXT
Project: Branching Routes
Area being refactored:
- Export Schema / Data Contract
- State Management & Migration Layer
- Canvas / Graph Rendering
- Simulation Engine
- Form Layer

Current structure map: `/informations/runs/03-04-2026_refactor/ran_0401_understand.md`

Architecture rules: `/informations/docs/architecture_rules.md`

## TASK
Produce a pre-refactor contract:

### 0. Migration Declaration
Before writing any hard stop conditions, answer:

Does this refactor touch any persisted key, field name, or export format?

**NO**  — hard stops apply as normal
**YES** — list every persisted key being touched

If YES: the following hard stops are SUSPENDED for declared keys only, and replaced with:
"Migration sub-phase is MANDATORY for [KEY LIST] before Self-Review proceeds"

Undeclared keys remain under full hard stop protection.

### 1. Behavioral Invariants
List every behavior that must be identical before and after the refactor. 
These are non-negotiable. For each:
- What the behavior is
- Why it must be preserved
- How to test that it was preserved

### 2. Data Contract Invariants
List every data structure, format, and ID convention that must survive unchanged.
For each:
- The field, format, or convention
- Where it is consumed
- What breaks if it changes

### 3. Load-Bearing Assumptions Inventory
From the §CONTEXT — which assumptions are load-bearing and must remain true after the refactor?

### 4. Acceptable Change Surface
What CAN change without risk?
What is genuinely safe to restructure?

### 5. Hard Stop Conditions
List the specific conditions that would require immediately stopping the refactor mid-execution:
- Data model breakage
- Export format change
- ID format change
- Condition format change
- [others specific to this project]

Keys declared in §0 are exempt from these hard stops — they follow the Migration sub-phase rule stated there.

### 6. Pre-Refactor Verdict
SAFE TO PROCEED / PROCEED WITH CAUTION / DO NOT PROCEED

If DO NOT PROCEED: explain what must be resolved first.
If PROCEED WITH CAUTION: list the specific risks to watch.
If SAFE TO PROCEED: confirm the contract is clear.

### 7. Save Task Completion Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_refactor/ran_0402_first-audit.md`

## CONSTRAINT
- This is a read-only audit — do not suggest implementation
- Every invariant must be testable — if it can't be tested, flag it as UNTESTABLE RISK
- Do not minimize risks to make the refactor seem easier
- If the refactor touches the data export format, this is always PROCEED WITH CAUTION minimum