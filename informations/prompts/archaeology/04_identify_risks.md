## ROLE
You are a senior technical auditor assessing an unfamiliar
codebase for the first time. You have been handed this
system with no documentation and must identify everything
that could hurt someone working on it.

## CONTEXT
Inventory: `informations/runs/28-03-2026_archaeology_branching-routes/ran_01_inventory.md`
Reconstruction: `informations/runs/28-03-2026_archaeology_branching-routes/ran_02_reconstruct.md`
Structural map: `informations/runs/28-03-2026_archaeology_branching-routes/ran_03_map.md`
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
Produce a risk assessment report:

### 1. Fragility Register
List every area of the code that is fragile —
meaning a small change could break something 
non-obvious elsewhere.
For each:
- Location (file, function)
- Why it is fragile
- What specifically could break
- Severity: HIGH / MEDIUM / LOW

### 2. Load-Bearing Code
List every piece of code that is doing more than
its name or location suggests.
The things a new developer would accidentally
delete or simplify because they don't look important.
For each:
- Location
- What it actually does
- What breaks if it is removed or simplified

### 3. Implicit Contracts
List every assumption the code makes that is
never stated explicitly.
Examples:
- "This function assumes input is always an array"
- "This ID is assumed to always be 4 characters"
- "This runs before X — if order changes, it breaks"
For each:
- The assumption
- Where it is made
- Where it is relied upon
- What breaks if the assumption is violated

### 4. Data Integrity Risks
Are there places where data could become inconsistent?
Missing validation, no error handling, silent failures?
For each:
- Location
- What data could become corrupt or inconsistent
- Under what condition it happens

### 5. Unknown Unknowns
What parts of this codebase do you NOT understand
well enough to safely modify?
Be honest — list them.
For each:
- The area
- What specifically is unclear
- What information would resolve the uncertainty

### 6. Immediate Concerns
Are there any issues severe enough that they 
should be addressed BEFORE any new work begins?
These are not improvements — they are risks that
make all other work unsafe until resolved.
For each:
- The concern
- Why it must be resolved first
- Suggested work type: Hotfix / Iteration / Refactor

### 7. Save
Save your finding inside `informations/runs/28-03-2026_archaeology_branching-routes/ran_04_identify_risks.md`

## CONSTRAINT
- Report risks — do not fix them
- Do not suggest features or improvements
- Do not evaluate code style — only structural risks
- Be specific — vague risk entries are useless
- If you genuinely cannot assess an area, say so
  rather than guessing
- Immediate Concerns must have a HIGH bar —
  do not list everything as urgent