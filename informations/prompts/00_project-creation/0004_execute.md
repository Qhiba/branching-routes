## ROLE
You are a focused software engineer building a new project from scratch.
You write clean, complete code. You do not improvise. You follow the plan exactly.

<!-- pipeline: 0004 Execute → 0005 Self-Review → 0006 Test → 0007 Fix (per phase) → 0008 Audit -->

## CONTEXT
### Project name:
`Branching Routes V2`

### Tech stack:
<!-- from Scope Q6 — `ran_0002_scope.md` -->
- React 19+ + Vite
- plain JavaScript (JSX/ES6+, no TypeScript)
- @xyflow/react (graph canvas)
- Zustand (state management)
- localforage (IndexedDB)
- lucide-react (icons)
- JSZip (archive)
- @dagrejs/dagre (auto-layout)
- @dnd-kit (drag-and-drop)
- Vanilla CSS 
- browser-only 
- no backend 
- dark mode only

### Current phase:
Phase [1] — Project Scaffold & Design Tokens

### Implementation plan for this phase:
<!-- from Plan §2 — `ran_0003_plan.md` -->
**Goal:** Establish the project foundation — working dev server, design token system, and clean entry point — so every subsequent phase has a runnable app to build on.

**Produces:**
- `src/styles/tokens.css` — CSS custom properties (colors, spacing, typography, radii, shadows)
- `src/styles/reset.css` — CSS reset / normalize
- `src/index.css` — imports tokens + reset, sets global body/html rules
- `src/main.jsx` — mounts `<App />`
- `src/App.jsx` — empty shell rendering a placeholder
- `vite.config.js` — alias `@/` → `src/`

**Acceptance Criteria:**
- [ ] `npm run dev` starts without errors and renders the placeholder App
- [ ] All design tokens are defined as CSS custom properties on `:root` in `tokens.css`
- [ ] No hard-coded color, spacing, or font values exist outside `tokens.css`
- [ ] `@/` import alias resolves correctly (verified by importing tokens in `App.jsx`)

**Next phase needs:** importable token system, working dev server.

### File map for this phase:
<!-- from Plan §3 — `ran_0003_plan.md` -->
| File | Purpose | Key Exports | Dependencies |
|------|---------|-------------|--------------|
| `tokens.css` | CSS custom properties for the entire design system: colors (deep charcoal, neon accents), spacing scale, typography (Inter), border radii, shadows, transitions | Custom properties on `:root` | None |
| `reset.css` | Browser reset / normalize | Global styles | None |

### Code from prior phases (if Phase 2+):
<!-- example: "N/A, this is Phase 1" -->
N/A

### Architecture rules: 
<!-- from Plan §1 — `ran_0003_plan.md` -->
| # | Rule |
|---|------|
| **AR-01** | Every React component file is named `PascalCase.jsx` and lives under `src/components/<feature>/`; every utility/helper file is named `camelCase.js`. |
| **AR-02** | All global state lives in Zustand stores under `src/store/`; no `useState` or `useReducer` may hold data that is shared across two or more components — use a Zustand selector instead. |
| **AR-03** | All `requires` fields in the data model are condition-group objects `{ operator: "and"|"or", conditions: [] }` — never `null`, `undefined`, or a bare array. |
| **AR-04** | All `next` fields are arrays of `{ id, target, requires }` — never `null`, `undefined`, or a string. |
| **AR-05** | All array-type fields (`flags_set`, `status_set`, `variants`, `options`, `conditions`, `next`) default to `[]` — never `null`. |
| **AR-06** | Sub-element IDs are generated at runtime via `generateId(prefix)` (timestamp + 4-char random suffix) and are **never** derived from parent IDs; hierarchical IDs exist only in the export transform. |
| **AR-07** | Entity names are sanitized to `lowercase_with_underscores` on creation and on import — enforced in the store action, not the UI component. |
| **AR-08** | IndexedDB errors from `localforage` must surface to the user as a persistent warning banner via `useUIStore.actions.showPersistError()`; `.catch(() => {})` is banned. |
| **AR-09** | CSS uses a flat design-token system in `src/styles/tokens.css` (custom properties on `:root`); component `.css` files consume tokens — no hard-coded color/spacing/font values in component stylesheets. |
| **AR-10** | Internal metadata fields on entities are prefixed with `_` (e.g., `_position`); they are persisted and exported but excluded from condition evaluation and route tracing logic. |

---

## TASK
Implement Phase [N] exactly as described in the plan.

Produce:
- Complete file contents for every file being created or modified
- If a file is unchanged from a prior phase, do not include it
- If you create a new file, state its full path
- At the end, list all files produced with their paths

## Save Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_project-creation/implementation_report/ran_0004_execute_[N].md`

## CONSTRAINT
- Do not add features not in the plan
- Do not create files not listed in the file map
- Do not change the data model structure unless the plan explicitly says to
- Follow all architecture rules from Plan §1 — do not deviate from naming, structure, or pattern rules
- If something in the plan is ambiguous, add a comment `// AMBIGUOUS: [what you assumed]` and proceed