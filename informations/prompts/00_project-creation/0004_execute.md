## ROLE
You are a focused software engineer building a new project from scratch.
You write clean, complete code. You do not improvise. You follow the plan exactly.

<!-- pipeline: 0004 Execute → 0005 Self-Review → 0006 Test → 0007 Fix (per phase) → 0008 Audit -->

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
Phase [4] — Zustand Stores (UI + Simulation + Campaign)

**Goal:** Complete the state management layer with stores for UI state, simulation state, and campaign management — giving all future UI components and engines the reactive data layer they need.

**Produces:**
- `src/store/useUIStore.js` — UI state:
  - `selectedNodeId`, `inspectorOpen`, `inspectorPinned`, `contextMenu`, `commandPaletteOpen`, `toasts[]`, `persistError`
  - Actions: `selectNode`, `openInspector`, `closeInspector`, `pinInspector`, `showContextMenu`, `hideContextMenu`, `addToast`, `removeToast`, `showPersistError`, `clearPersistError`
- `src/store/useSimulationStore.js` — simulation state:
  - `nodeStates: { [nodeId]: { status, seen } }`, `flagOverrides: {}`, `statusOverrides: {}`
  - Derived: `evaluatedEdges: { [edgeKey]: boolean }`, `unreachableNodes: Set`
  - Actions: `setNodeStatus`, `cycleNodeStatus`, `setNodeSeen`, `cycleNodeSeen`, `setFlagOverride`, `setStatusOverride`, `resetSimulation`
- `src/store/useCampaignStore.js` — campaign management:
  - `campaigns: {}`, `activeCampaignId`, `activeCampaign`
  - Actions: `createCampaign`, `loadCampaign`, `saveCampaign`, `deleteCampaign`, `switchCampaign`, `resetActiveCampaign`

**Acceptance Criteria:**
- [ ] `useUIStore` actions correctly toggle inspector, manage toasts (add/auto-remove), and track selected node
- [ ] `useSimulationStore.cycleNodeStatus()` cycles through all 6 states: `default → active → locked → complete → failed → branch_locked → default`
- [ ] `useSimulationStore.cycleNodeSeen()` cycles through: `unseen → partially_seen → seen → unseen`
- [ ] `useCampaignStore` can create, switch, reset, and delete campaigns; active campaign state is isolated from narrative data
- [ ] `showPersistError()` sets a persistent flag; `clearPersistError()` clears it (AR-08)

**Next phase needs:** all stores operational and subscribable.

### File map for this phase:
| File | Purpose | Key Exports | Dependencies |
|------|---------|-------------|--------------|
| `useUIStore.js` | Zustand store for UI state | `useUIStore` (hook + actions) | None |
| `useSimulationStore.js` | Zustand store for simulation state | `useSimulationStore` (hook + actions) | None |
| `useCampaignStore.js` | Zustand store for campaign management | `useCampaignStore` (hook + actions) | None |

### Code from prior phases (if Phase 2+):
| # | File | Path | Status |
|---|------|------|--------|
| 1 | `useNarrativeStore.js` | `src/store/useNarrativeStore.js` | **Created** |

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
- At the end, list all files produced with their paths

## Save Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_project-creation/implementation_report_[N]/ran_0004_execute_[N].md`

## CONSTRAINT
- Do not add features not in the plan
- Do not create files not listed in the file map
- Do not change the data model structure unless the plan explicitly says to
- Follow all architecture rules from Plan §1 — do not deviate from naming, structure, or pattern rules
- If something in the plan is ambiguous, add a comment `// AMBIGUOUS: [what you assumed]` and proceed