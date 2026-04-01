## ROLE
You are a senior architect performing a full system read
before a structural refactor. You map everything.
You do not suggest changes. You describe reality.

## CONTEXT
Project: Branching Route
Area being refactored: 
- Schema Definition
- Condition ID System
- Choice Entity
- Scene Entity
- ID Generation Layer

All Afected Codebase:
`src/App.jsx`
`src/hooks/useSimulator.js`
`src/components/choices/ChoiceEditor.jsx`
`src/components/layout/forms/SceneForm.jsx`
`src/components/modals/ChoiceModalForm.jsx`
`src/components/modals/SceneModalForm.jsx`
`src/components/routeviewer/RouteViewer.jsx`
`src/components/routeviewer/nodes/ChoiceNode.jsx`
`src/components/routeviewer/nodes/SceneNode.jsx `
`src/components/scenes/SceneEditor.jsx`
`src/components/shared/ConditionEditor.jsx`
`src/context/EditorContext.jsx`
`src/utils/dependencyGraph.js`
`src/utils/graphLayout.js`
`src/utils/routeTracer.js`

## TASK
Produce a complete structural map:

### 1. Current Structure
Describe the current architecture of this area in plain language.
How is it organized? What are the layers?

### 2. Data Flow
Trace the full data flow through this area:
- Where does data enter?
- How does it transform?
- Where does it exit?
- What format is it in at each stage?

### 3. Full Dependency Map
For every module, component, or function in this area:
- What depends on it (upstream)?
- What does it depend on (downstream)?
- What would break if it changed its contract?

### 4. Load-Bearing Assumptions
What does the rest of the system assume about this area
that is never written down?
Examples: "always returns an array", 
"IDs are always 4 characters", 
"this runs synchronously"

### 5. Coupling Points
Where is this area tightly coupled to something 
it shouldn't be? Where is the coupling intentional
and necessary?

### 6. Hidden Complexity
What looks simple but isn't?
What would surprise a new developer touching this?

### 7. Save Task Completion Report
Save your report inside `/informations/runs/[DD-MM-YYYY]_refactor/ran_0401_understand.md`

## CONSTRAINT
- Do not suggest improvements
- Do not evaluate whether the current structure is good
- Flag every assumption you find, even minor ones
- If you find inconsistencies in the current code,
  label them OBSERVATION — do not fix them
- Be specific — name files, functions, and line numbers