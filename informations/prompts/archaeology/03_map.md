## ROLE
You are a systems architect mapping the internal 
structure of an unfamiliar codebase.
You trace connections, not descriptions.

## CONTEXT
Reconstruction from Step 2:
`informations/runs/28-03-2026_archaeology_branching-routes/ran_02_reconstruct.md`

Full codebase:
`eslint.config.js`
`index.html`
`package-lock.json`
`package.json`
`vite.config.js`
`src/App.jsx`
`src/index.css`
`src/main.jsx`
`src/components/chapters/ChapterManager.jsx`
`src/components/choices/ChoiceEditor.jsx`
`src/components/endings/EndingManager.jsx`
`src/components/flags/FlagManager.jsx`
`src/components/layout/DynamicTracker.jsx`
`src/components/layout/LeftSidebar.jsx`
`src/components/layout/NavBar.jsx`
`src/components/layout/NodeInspector.jsx`
`src/components/layout/RightSidebar.jsx`
`src/components/layout/forms/ChapterForm.jsx`
`src/components/layout/forms/ChoiceForm.jsx`
`src/components/layout/forms/EndingForm.jsx`
`src/components/layout/forms/FlagForm.jsx`
`src/components/layout/forms/FormFooter.jsx`
`src/components/layout/forms/PathForm.jsx`
`src/components/layout/forms/QuestForm.jsx`
`src/components/layout/forms/SceneForm.jsx`
`src/components/layout/forms/StatusForm.jsx`
`src/components/modals/ChoiceModalForm.jsx`
`src/components/modals/EditModal.jsx`
`src/components/modals/EndingModalForm.jsx`
`src/components/modals/SceneModalForm.jsx`
`src/components/modals/SettingsModal.jsx`
`src/components/paths/PathManager.jsx`
`src/components/quests/QuestManager.jsx`
`src/components/routeviewer/InspectorPanel.jsx`
`src/components/routeviewer/RouteViewer.jsx`
`src/components/routeviewer/SimulatorPanel.jsx`
`src/components/routeviewer/nodes/ChoiceNode.jsx`
`src/components/routeviewer/nodes/EndingNode.jsx`
`src/components/routeviewer/nodes/SceneNode.jsx`
`src/components/scenes/SceneEditor.jsx`
`src/components/shared/ConditionEditor.jsx`
`src/components/shared/DebouncedInput.jsx`
`src/components/shared/DebouncedTextarea.jsx`
`src/components/shared/ErrorBoundary.jsx`
`src/components/shared/FlagsSetEditor.jsx`
`src/components/shared/QuickNav.jsx`
`src/components/shared/SearchableDropdown.jsx`
`src/components/shared/StatusSetEditor.jsx`
`src/components/simulator/Simulator.jsx`
`src/components/status/StatusManager.jsx`
`src/context/EditorContext.jsx `
`src/hooks/useLongPress.js`
`src/hooks/useSimulator.js`
`src/utils/conditionUtils.js`
`src/utils/conditionUtils.test.js `
`src/utils/dependencyGraph.js`
`src/utils/dependencyGraph.test.js `
`src/utils/graphLayout.js`
`src/utils/reachabilityAnalyzer.js`
`src/utils/routeTracer.js`
`src/utils/routeTracer.test.js `

## TASK
Produce a structural map of the system:

### 1. Module Dependency Graph
For every major module or component:
- What it imports / depends on
- What imports / depends on it
- Direction: [MODULE A] → [MODULE B] means A depends on B

Format as a list, not a diagram:
MODULE_NAME
  depends on: [list]
  depended on by: [list]

### 2. Data Flow Map
Trace data from entry to exit:
- Where data enters the system
- How it transforms at each step
- Where it is stored (if anywhere)
- Where it exits the system
- What format it is in at each stage

### 3. State Map
What state does this system hold?
For each piece of state:
- What holds it (variable, database, file, memory)
- Where it is written
- Where it is read
- What happens if it is lost or corrupted

### 4. Coupling Map
Where are the tightest couplings in the system?
A tight coupling is when changing A forces 
changing B even if B has nothing to do with A.
For each:
- Module A and Module B
- Why they are tightly coupled
- What breaks if the coupling is violated

### 5. Isolation Map
What is well-isolated?
What modules could be changed without touching 
anything else?
For each:
- Module name
- Why it is safely isolated

### 6. External Dependencies Map
What does the system depend on outside itself?
- External APIs
- External services
- File system paths
- Environment assumptions
For each: what breaks if this external dependency 
is unavailable?

### 7. Save
Save your finding inside `informations/runs/28-03-2026_archaeology_branching-routes/ran_03_map.md`

## CONSTRAINT
- Map what exists — do not suggest what should exist
- If a dependency is circular, flag it explicitly:
  CIRCULAR DEPENDENCY: [A] ↔ [B]
- If a module has no dependents, flag it:
  ORPHAN: [MODULE] — nothing depends on this
- Do not evaluate whether the structure is good or bad