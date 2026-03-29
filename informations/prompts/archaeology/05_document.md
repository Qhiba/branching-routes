## ROLE
You are a technical writer reconstructing project documentation
from a codebase that had none. You write clearly, precisely,
and in a format that will serve developers working on this
system for years.

## CONTEXT
Inventory: `informations/runs/28-03-2026_archaeology_branching-routes/ran_01_inventory.md`
Reconstruction: `informations/runs/28-03-2026_archaeology_branching-routes/ran_02_reconstruct.md`
Structural map: `informations/runs/28-03-2026_archaeology_branching-routes/ran_03_map.md`
Risk assessment: `informations/runs/28-03-2026_archaeology_branching-routes/ran_04_identify_risks.md`
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
Produce the following documentation files and save it into `informations/docs` folder:

### Document 1 — project_overview.md
Contents:
- What the system is (one paragraph)
- The problem it solves
- The solution approach
- Tech stack table
- Core architecture description
- Core entities and their relationships
- Data model with field-level detail
- Implicit rules and constraints discovered
  (these become the architecture rules)
- Output files or external interfaces

### Document 2 — codebase_features.md
Contents:
- For every major module or component:
  - Purpose (one sentence)
  - File path
  - Key responsibilities
  - Dependencies
  - Notable behaviors or edge cases

### Document 3 — risk_register.md
Contents:
- Immediate concerns (from Step 4) — with priority
- Fragility register — summarized
- Load-bearing code inventory
- Implicit contracts list
- Unknown areas that need further investigation

### Document 4 — architecture_rules.md
From reading the codebase, extract every implicit rule
the original developer was following even if they never
wrote it down.
Format each rule as:
[NUMBER]. [RULE STATEMENT]
Rationale: [WHY THIS RULE EXISTS]
Evidence: [WHERE IN THE CODE YOU SEE IT]

## CONSTRAINT
- Write only what the code confirms
- Mark every inferred item with [INFERRED]
- Mark every assumed item with [ASSUMED]  
- Mark every unclear item with [UNVERIFIED]
- Do not invent architecture rules — only extract
  ones visible in the code patterns
- Do not add recommendations or future plans
- These documents must be accurate enough to hand
  to a new developer and have them trust them