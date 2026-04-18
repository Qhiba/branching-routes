# Integration Points — Path_Chapter_Entities

---

## `narrativeStore.js` ← Core state owner

**What it currently does:**
Holds the canonical graph state (`common`, `choice`, `ending`, `edges`, `flag`, `status`, `meta`). Exposes CRUD actions for every entity type. Also owns `loadGraph`, `newGraph`, and `exportGraph`.

**How the new feature connects:**
- Gains two new top-level dictionaries: `path{}` and `chapter{}`.
- Gains six new actions: `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`.
- `deletePath` and `deleteChapter` perform cascade: they wipe the matching `pathId`/`chapterId` from all node `data` objects before removing the entity.
- `newGraph` and `loadGraph` are updated to initialize/read `path` and `chapter`.
- `exportGraph` emits the two new dictionaries and bumps `schemaVersion` to `4`.

**What must not change:**
All existing actions. The INVARIANT `HS-08` (no simulationStore import). The `window.useNarrativeStore` debug export.

---

## `fileSystem.js` ← Persistence layer

**What it currently does:**
Serializes (`exportProject`) and deserializes (`importProject`) the graph JSON. Validates `schemaVersion`. Runs migration logic for v1→v3 and v2→v3.

**How the new feature connects:**
- `importProject` must accept `schemaVersion: 4` as valid.
- A new v3→v4 migration pass initializes `path: {}` and `chapter: {}` on files that lack them.
- v1 and v2 files flow through their existing migrations and then through the new v3→v4 pass.
- `exportProject` is a pass-through function; no changes needed there — the store's `exportGraph` shapes the payload.

**What must not change:**
The File System Access API wrappers and their fallback paths. All existing migration helpers and migration branches for v1/v2.

---

## `Sidebar.jsx` ← Tab host

**What it currently does:**
Renders a three-tab panel (Inspector, Flags, Status). Holds `activeTab` local state. Conditionally renders `NodeInspector`, `EdgeInspector`, `FlagManager`, or `StatusManager` based on the active tab.

**How the new feature connects:**
- A fourth tab button ("Paths") is added to the tab bar.
- When `activeTab === 'paths'`, renders `<PathChapterManager />`.
- `PathChapterManager` is imported directly in this file.

**What must not change:**
All three existing tabs — their render conditions, button styling pattern (inline style with `activeTab` comparison), and their child components. The `selectedNodeId`/`selectedEdgeId` selectors used by the Inspector tab.

---

## `NodeInspector.jsx` ← Node edit form

**What it currently does:**
Renders a form for the selected node's `label`, `content`, Start Node toggle, `flags_set` checkboxes, `status_set` modifiers, and Delete button. All edits call `updateNode`.

**How the new feature connects:**
- Two new `<select>` dropdowns are added below the Content field.
- The "Path" dropdown reads `Object.values(narrativeStore.path)` and writes to `node.data.pathId`.
- The "Chapter" dropdown reads `Object.values(narrativeStore.chapter)` and writes to `node.data.chapterId`.
- Both read via new targeted Zustand selectors (AR-05).

**What must not change:**
All existing handlers and their logic. The visual structure of the existing form sections (Label, Content, Start Node, Set Flags, Status Modifiers, Delete). The `nodeType !== 'ending'` guard on the Start Node button.

---

## `PathChapterManager.jsx` ← New component

**What it currently does:** Does not exist.

**How the new feature connects:**
- New file. Reads `path{}` and `chapter{}` from `narrativeStore`.
- Calls `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter` actions.
- Only local state used: add-form text inputs (AR-03 compliant).
- Mounted by `Sidebar.jsx` in the "Paths" tab.

**What must not change:** N/A (new file).

---

## `uuid.js` ← ID generation

**What it currently does:**
Exports `generateId(prefix)` which returns `{prefix}-{crypto.randomUUID()}`.

**How the new feature connects:**
- Called with `'p'` for paths and `'c'` for chapters — exactly the same call site pattern as existing usages. No changes to `uuid.js` itself.

**What must not change:**
The `generateId` function signature and behavior.

---

## `simulationStore.js` ← Protected

**What it currently does:**
Owns `activeNodeId`, `visitedNodeIds`, `traversedEdgeIds`, `currentFlagValues`, `reachableEdgeIds`, `reachableNodeIds`, `isRunning`. Runs `start`, `advance`, `reset`.

**How the new feature connects:**
It does not. `path` and `chapter` are metadata only and carry no simulation semantics.

**What must not change:**
Everything. This file is protected.

---

## `conditionEvaluator.js` ← Protected

**What it currently does:**
Pure functions evaluating AND/OR conditions against a `flagState` map.

**How the new feature connects:**
It does not. Path/chapter grouping introduces no condition types.

**What must not change:**
Everything. This file is protected.

---

## `GraphCanvas.jsx` / Node components / `ConditionalEdge.jsx` ← Protected

**What they currently do:**
Render the interactive React Flow canvas, custom node types, and custom edge type.

**How the new feature connects:**
They do not. The scope explicitly states paths and chapters are not rendered visually on the canvas.

**What must not change:**
Everything in these files. They are protected.
