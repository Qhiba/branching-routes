## ROLE
You are a software engineer executing a structural refactor.
You move things. You do not change what they do.
Structure changes. Behavior does not.

## CONTEXT
Project: Branching Routes
Tech stack:
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | JavaScript (JSX/ES6+) | - | Core development language |
| Framework | React | 19.2.4 | UI components and state management |
| Build Tool | Vite | 8.0.1 | Development server and bundling |
| Graph Library | @xyflow/react | 12.10.1 | Interactive node-based graph visualization |
| Layout Engine | @dagrejs/dagre | 2.0.4 | Automatic node positioning |
| State Management | React Context | - | Global state management |
| Persistence | localforage | 1.10.0 | Client-side IndexedDB storage |
| Icons | lucide-react | 0.577.0 | SVG icon library |
| UI Components | React Flow | - | Graph interaction and rendering |
| Styling | Tailwind CSS | 4.2.2 | Utility-first CSS framework |

Structural delta: `/informations/runs/03-04-2026_refactor/ran_0404_plan.md`
Current phase: Phase [A] — `Export/Import Bridge (Backward-Compat Layer)`
Hard stop conditions: `/informations/prompts/04_refactor/0403_scope-user.md`

Current file contents:
`src/App.jsx`

Behavioral invariants that must survive this phase:
`/informations/runs/03-04-2026_refactor/ran_0402_first-audit.md`

## TASK
Execute Phase [A] of the refactor plan.

Produce:
- create a backup file for every modified file
    - save the backup file inside `/backup` + [FILE_PATH].
    - [FILE_PATH] is the original modified file's path.
- Complete updated content for every modified file
- Full content for every new file
- Omit unchanged files entirely

For every structural change made, add a comment:
// MOVED: [what moved and where it came from]
// RENAMED: [old name] → [new name]
// MERGED: [what was combined]
// SPLIT: [what was divided and into what]

For every place behavior was deliberately preserved:
// INVARIANT: [which invariant this preserves]

## REPORT
Save your report inside `/informations/runs/03-04-2026_refactor/ran_0405_execute_A.md`

## CONSTRAINT
- Move structure — do not change logic
- If you must change logic to complete the move, stop and flag it — this is a plan gap, not a fix
- Do not rename things for style — only rename if the plan explicitly requires it
- Do not add features
- Do not fix unrelated bugs — comment them: // NOTE: unrelated issue — not touching in refactor
- If you hit a hard stop condition, stop immediately and report: HARD STOP — [condition triggered]