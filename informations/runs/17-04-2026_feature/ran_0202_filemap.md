# File Map — Path_Chapter_Entities

---

## `src/store/narrativeStore.js`

- **Status:** EXISTING — MODIFY
- **What changes and why:**
  - Add `path: {}` and `chapter: {}` to initial store state.
  - Add `addPath(name)` action — generates `p-{uuid}`, writes to `path{}`.
  - Add `updatePath(id, patch)` action — merges patch into `path[id]`.
  - Add `deletePath(id)` action — removes path, then sweeps all nodes in `common`, `choice`, `ending` to nullify any `data.pathId` matching the deleted ID. Cascade is internal; no UI confirmation needed (paths carry no condition or simulation references).
  - Add `addChapter(name)` action — generates `c-{uuid}`, writes to `chapter{}`.
  - Add `updateChapter(id, patch)` action — merges patch into `chapter[id]`.
  - Add `deleteChapter(id)` action — removes chapter, cascades `data.chapterId` nullification across all nodes.
  - Modify `newGraph()` — add `path: {}` and `chapter: {}` to the reset payload.
  - Modify `loadGraph(graphData)` — add `path: graphData.path || {}` and `chapter: graphData.chapter || {}`.
  - Modify `exportGraph()` — add `path: state.path` and `chapter: state.chapter` to the returned object, bump `schemaVersion` from `3` to `4`.
- **What must NOT change:**
  - All existing actions (`addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `addStatus`, `updateStatus`, `deleteStatus`, `updateMeta`).
  - The INVARIANT comment `HS-08`.
  - The `window.useNarrativeStore` debug assignment at the bottom.
- **Phase:** Phase 1

---

## `src/utils/fileSystem.js`

- **Status:** EXISTING — MODIFY
- **What changes and why:**
  - Add `4` to the list of accepted `schemaVersion` values in the version guard.
  - Add a `schemaVersion === 3` migration branch: sets `path: {}` and `chapter: {}` on the data object and sets `schemaVersion: 4`.
  - The existing `schemaVersion === 1` and `schemaVersion === 2` branches already produce a v3-compatible shape; they then fall through into the new v3→v4 step to initialize `path` and `chapter`.
- **What must NOT change:**
  - The `generateTypedCollections`, `migrateNodesPayloads`, and `migrateEdgeConditions` helper functions.
  - The v1 and v2 migration logic.
  - The File System Access API wrappers and their fallback paths.
  - Export: `exportProject` is a pass-through of `graphData`; no changes needed there — `exportGraph()` in the store handles shaping the payload.
- **Phase:** Phase 1

---

## `src/components/PathChapterManager.jsx`

- **Status:** NEW — CREATE
- **What changes and why:**
  - New component rendering the CRUD UI for both paths and chapters.
  - Displays two sections: "Paths" and "Chapters".
  - Each section lists existing entries (name + Delete button).
  - Each section has an inline "Add" text input + confirm button.
  - Rename is an inline text edit triggered by clicking an entry.
  - All mutations call store actions only (`addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`).
  - Local `useState` used only for the add-form input value (UI-only, no graph data held in local state — AR-03 compliant).
- **What must NOT change:** N/A (new file).
- **Phase:** Phase 2

---

## `src/components/Sidebar.jsx`

- **Status:** EXISTING — MODIFY
- **What changes and why:**
  - Add a fourth tab button: "Paths".
  - Add the conditional render: `{activeTab === 'paths' && <PathChapterManager />}`.
  - Import `PathChapterManager` from `./PathChapterManager`.
- **What must NOT change:**
  - The Inspector, Flags, and Status tabs — their render logic, tab button styles, and state handling are identical.
  - The `activeTab` state management pattern.
  - All existing imports.
- **Phase:** Phase 2

---

## `src/components/NodeInspector.jsx`

- **Status:** EXISTING — MODIFY
- **What changes and why:**
  - Read `path` and `chapter` dictionaries from `narrativeStore` via selectors.
  - Add two `<select>` dropdowns below the Content textarea: "Path" and "Chapter".
  - Each dropdown shows a blank "None" option plus all defined paths/chapters.
  - On change, calls `updateNode(node.id, { data: { ...data, pathId: value } })` / `chapterId`.
  - The displayed values are derived from `node.data.pathId` and `node.data.chapterId`.
- **What must NOT change:**
  - All existing handlers: `handleLabelChange`, `handleContentChange`, `handleStartNodeClick`, `toggleFlag`, `addStatusEffect`, `updateStatusEffect`, `removeStatusEffect`.
  - The Delete Node button and its handler.
  - The Set as Start Node button and its `nodeType !== 'ending'` guard.
  - All existing Zustand selectors for `node`, `flags`, `statuses`, `updateNode`, `setStartNode`, `deleteNode`.
- **Phase:** Phase 3

---

## `src/components/index.js`

- **Status:** EXISTING — MODIFY
- **What changes and why:**
  - Add `export { default as PathChapterManager } from './PathChapterManager';` so the component is accessible via the barrel.
- **What must NOT change:**
  - All existing exports.
- **Phase:** Phase 2
