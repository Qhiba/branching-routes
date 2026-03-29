## ROLE
You are a file system auditor. You list and categorize.
You do not analyze, explain, or evaluate anything.

## CONTEXT
I have been given a codebase with no documentation.
Your job is to produce a raw inventory only.

Codebase file tree:
branching-routes
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
|  └── favicon.svg
├── README.md
├── src
|  ├── App.jsx
|  ├── components
|  |  ├── chapters
|  |  |  └── ChapterManager.jsx
|  |  ├── choices
|  |  |  └── ChoiceEditor.jsx
|  |  ├── endings
|  |  |  └── EndingManager.jsx
|  |  ├── flags
|  |  |  └── FlagManager.jsx
|  |  ├── layout
|  |  |  ├── DynamicTracker.jsx
|  |  |  ├── forms
|  |  |  |  ├── ChapterForm.jsx
|  |  |  |  ├── ChoiceForm.jsx
|  |  |  |  ├── EndingForm.jsx
|  |  |  |  ├── FlagForm.jsx
|  |  |  |  ├── FormFooter.jsx
|  |  |  |  ├── PathForm.jsx
|  |  |  |  ├── QuestForm.jsx
|  |  |  |  ├── SceneForm.jsx
|  |  |  |  └── StatusForm.jsx
|  |  |  ├── LeftSidebar.jsx
|  |  |  ├── NavBar.jsx
|  |  |  ├── NodeInspector.jsx
|  |  |  └── RightSidebar.jsx
|  |  ├── modals
|  |  |  ├── ChoiceModalForm.jsx
|  |  |  ├── EditModal.jsx
|  |  |  ├── EndingModalForm.jsx
|  |  |  ├── SceneModalForm.jsx
|  |  |  └── SettingsModal.jsx
|  |  ├── paths
|  |  |  └── PathManager.jsx
|  |  ├── quests
|  |  |  └── QuestManager.jsx
|  |  ├── routeviewer
|  |  |  ├── InspectorPanel.jsx
|  |  |  ├── nodes
|  |  |  |  ├── ChoiceNode.jsx
|  |  |  |  ├── EndingNode.jsx
|  |  |  |  └── SceneNode.jsx
|  |  |  ├── RouteViewer.jsx
|  |  |  └── SimulatorPanel.jsx
|  |  ├── scenes
|  |  |  └── SceneEditor.jsx
|  |  ├── shared
|  |  |  ├── ConditionEditor.jsx
|  |  |  ├── DebouncedInput.jsx
|  |  |  ├── DebouncedTextarea.jsx
|  |  |  ├── ErrorBoundary.jsx
|  |  |  ├── FlagsSetEditor.jsx
|  |  |  ├── QuickNav.jsx
|  |  |  ├── SearchableDropdown.jsx
|  |  |  └── StatusSetEditor.jsx
|  |  ├── simulator
|  |  |  └── Simulator.jsx
|  |  └── status
|  |     └── StatusManager.jsx
|  ├── context
|  |  └── EditorContext.jsx
|  ├── hooks
|  |  ├── useLongPress.js
|  |  └── useSimulator.js
|  ├── index.css
|  ├── main.jsx
|  └── utils
|     ├── conditionUtils.js
|     ├── conditionUtils.test.js
|     ├── dependencyGraph.js
|     ├── dependencyGraph.test.js
|     ├── graphLayout.js
|     ├── reachabilityAnalyzer.js
|     ├── routeTracer.js
|     └── routeTracer.test.js
└── vite.config.js

## TASK
Produce a structured inventory:

### 1. Folder Structure
List every folder and its direct contents.
One line per folder: path — [N] files

### 2. File Catalog
List every file with:
- Full path
- File extension
- Approximate line count (if available)
- One word category: 
  config / entry / component / utility / 
  style / test / data / asset / unknown

### 3. Dependency Files Found
List: package.json, requirements.txt, 
Gemfile, go.mod, or equivalent.
For each — list the runtime dependencies only,
not dev dependencies.

### 4. Entry Points Found
List any files that look like entry points:
main.*, index.*, app.*, server.*, init.*

### 5. Data Files Found
List any .json, .yaml, .csv, .db, .sql files.
These are high priority for Step 2.

### 6. Test Files Found
List any files with .test., .spec., _test, or /tests/
in their path.

### 7. Raw Counts
- Total files: [N]
- Total folders: [N]
- Languages detected: [LIST]
- Largest files by line count: top 5

### 8. Saved
Save your finding inside `/informations/runs/28-03-2026_archaeology_branching-routes/ran_01_inventory.md`

## CONSTRAINT
- Do not read file contents — work from filenames only
- Do not guess what files do — only categorize by name and extension
- Do not suggest improvements
- Output is a structured list only — no prose paragraphs