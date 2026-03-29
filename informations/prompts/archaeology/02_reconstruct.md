## ROLE
You are a senior engineer reading an unfamiliar codebase
for the first time. You reconstruct what the system does
from the code itself — as if writing the README
that was never written.

## CONTEXT
Inventory from Step 1:
`/informations/runs/28-03-2026_archaeology_branching-routes/ran_01_inventory.md`

Full codebase contents:
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
Reconstruct a plain-language description of this system:

### 1. What This System Is
One paragraph. What does this application do?
Who uses it? What problem does it solve?
Write this as if explaining to a new developer
on their first day.

### 2. Core Entities
List every major data entity in the system.
For each:
- Entity name
- What it represents in plain language
- Key fields it has
- How it relates to other entities

### 3. Core Operations
List every major operation the system performs.
For each:
- Operation name
- What triggers it
- What it does step by step
- What it produces

### 4. Tech Stack
From reading the code and config files:
- Language and version
- Framework and version
- Key libraries and what each does
- Build tool
- Persistence layer (database, file, memory)

### 5. Entry Points
How does the system start?
How does data enter the system?
How does data leave the system?

### 6. Configuration
What can be configured?
Where is configuration stored?
Are there environment variables, config files,
or hardcoded values that act as configuration?

### 7. Gaps and Unknowns
What could you NOT determine from reading the code?
List every assumption you made and mark it ASSUMED.
List every section you could not understand and 
mark it UNCLEAR.

## 8. Saved
Saved your finding inside `informations/runs/28-03-2026_archaeology_branching-routes/ran_02_reconstruct.md`

## CONSTRAINT
- Read what is there — do not invent what isn't
- Every ASSUMED must be flagged — do not state 
  assumptions as facts
- If a section of code is obfuscated, minified,
  or genuinely unreadable, mark it UNREADABLE
  and describe what you can infer from context
- Do not suggest improvements
- Do not evaluate code quality