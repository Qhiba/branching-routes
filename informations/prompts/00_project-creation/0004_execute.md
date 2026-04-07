## ROLE
You are a focused software engineer building a new project from scratch.
You write clean, complete code. You do not improvise. You follow the plan exactly.

## CONTEXT
### Project name:
`Branching Routes V2`

### Tech stack:
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
Phase [11] — Campaign System

**Goal:** Enable designers to create, save, and switch between named campaign sheets (saved simulation states) for testing different narrative scenarios independently.

**Produces:**
- `src/components/campaign/CampaignSelector.jsx` — dropdown/modal for campaign CRUD (create, switch, delete, reset)
- `src/components/campaign/CampaignSelector.css`
- `src/components/campaign/FlagOverridePanel.jsx` — list of all flags with toggle switches for override
- `src/components/campaign/StatusOverridePanel.jsx` — list of all status points with number inputs for override
- Updated `persistence.js` to save/load campaigns alongside data model

**Acceptance Criteria:**
- [ ] Can create a new campaign with a name, switch between campaigns, delete campaigns
- [ ] Reset button clears all node states, flag overrides, and status overrides for the active campaign
- [ ] Flag overrides toggle individual flags; status overrides set specific values — both feed into the simulation engine
- [ ] Campaign state is separate from narrative data (AR-10: editing structure does not modify campaigns)
- [ ] Campaigns auto-save to IndexedDB alongside the data model
- [ ] Stale campaign references (referencing deleted entities) are pruned with a toast notification (R-03 mitigation)

**Next phase needs:** campaign-based simulation with state persistence.

### File map for this phase:
| File | Purpose | Key Exports | Dependencies |
|------|---------|-------------|--------------|
| `CampaignSelector.jsx` | Campaign CRUD dropdown/modal | `<CampaignSelector />` | `useCampaignStore` |
| `CampaignSelector.css` | Styling | — | `tokens.css` |
| `FlagOverridePanel.jsx` | Flag toggle switches for campaign state | `<FlagOverridePanel />` | `useNarrativeStore`, `useSimulationStore` |
| `StatusOverridePanel.jsx` | Status point number inputs for campaign state | `<StatusOverridePanel />` | `useNarrativeStore`, `useSimulationStore` |
| `persistence.js` | IndexedDB persistence via localforage, auto-save subscription | `saveProject()`, `loadProject()`, `clearProject()`, `initAutoSave()` | `localforage`, `useNarrativeStore`, `useCampaignStore`, `useUIStore` |

### Code from prior phases (if Phase 2+):
| # | File | Path | Purpose OR Changes | Status |
|---|------|------|--------|--------|
| 1 | `reachability.js` | `src/engine/reachability.js` | BFS-based reachability analysis from entry node along passing edges | **Created** |
| 2 | `simulationEngine.js` | `src/engine/simulationEngine.js` | Core simulation loop: evaluates all edge conditions, computes reachability, generates auto-lock suggestions | **Created** |
| 3 | `useSimulationSync.js` | `src/hooks/useSimulationSync.js` | Hook that wires simulation engine to Zustand store subscriptions with 150ms debounce | **Created** |
| 4 | `App.jsx` | `src/App.jsx` | Added `useSimulationSync()` call to wire engine at app root | **Modified** |
| 5 | `CommonNodeRenderer.jsx` | `src/components/graph/nodes/CommonNodeRenderer.jsx` | Added unreachable warning badge (AlertTriangle icon), reads `unreachableNodes` from simulation store | **Modified** |
| 6 | `CommonNodeRenderer.css` | `src/components/graph/nodes/CommonNodeRenderer.css` | Added `.common-node--unreachable` state + `.common-node__state-badge--unreachable` overlay | **Modified** |
| 7 | `ChoiceNodeRenderer.jsx` | `src/components/graph/nodes/ChoiceNodeRenderer.jsx` | Added unreachable badge, seen tracking icons, state badges (complete/failed) | **Modified** |
| 8 | `ChoiceNodeRenderer.css` | `src/components/graph/nodes/ChoiceNodeRenderer.css` | Added unreachable state, state badges, seen badge CSS | **Modified** |
| 9 | `EndingNodeRenderer.jsx` | `src/components/graph/nodes/EndingNodeRenderer.jsx` | Added unreachable badge, seen tracking icons, state badges (complete/failed) | **Modified** |
| 10 | `EndingNodeRenderer.css` | `src/components/graph/nodes/EndingNodeRenderer.css` | Added unreachable state, state badges, seen badge CSS | **Modified** |
| 11 | `tokens.css` | `src/styles/tokens.css` | Added `--color-state-unreachable` token | **Modified** |

### Architecture rules: 
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
- If the created or modified content are `for later phases` but not used on current phases, tag it with a 1-line comment.
- At the end, list all files produced with their paths

## Save Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_project-creation/implementation_report_[N]/ran_0004_execute_[N].md`

## CONSTRAINT
- Do not add features not in the plan
- Do not create files not listed in the file map
- Do not change the data model structure unless the plan explicitly says to
- Follow all architecture rules from Plan §1 — do not deviate from naming, structure, or pattern rules
- If something in the plan is ambiguous, add a comment `// AMBIGUOUS: [what you assumed]` and proceed