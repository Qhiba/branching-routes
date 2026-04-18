# Feature Delta — Path_Chapter_Entities

---

## What the system does NOT have now

- No concept of a `path` entity. Nodes have no organizational grouping above the node level.
- No concept of a `chapter` entity. There is no sequential narrative division in the data model.
- No node field for `pathId` or `chapterId`. Nodes in `common{}`, `choice{}`, and `ending{}` hold only `label`, `content`, `isStartNode`, `flags_set`, and `status_set`.
- No CRUD UI for managing named paths or chapters.
- `narrativeStore.js` holds no `path{}` or `chapter{}` dictionary.
- `exportGraph()` does not emit `path` or `chapter` keys.
- `importProject()` does not read or validate `path` or `chapter` keys.
- `loadGraph()` and `newGraph()` do not initialize `path` or `chapter` state.
- `NodeInspector.jsx` has no dropdowns for assigning a path or chapter to a node.
- `Sidebar.jsx` has three tabs (Inspector, Flags, Status) and no Path/Chapter tab.

---

## What the system WILL have after this feature

- A `path{}` dictionary in `narrativeStore`, keyed by prefixed ID (`p-{uuid}`). Each entry holds `{ id, name }`.
- A `chapter{}` dictionary in `narrativeStore`, keyed by prefixed ID (`c-{uuid}`). Each entry holds `{ id, name }`.
- Full CRUD store actions: `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`.
- `deletePath` and `deleteChapter` cascade: removes the `pathId`/`chapterId` reference from every node that holds it.
- Every node in `common{}`, `choice{}`, `ending{}` gains two optional metadata fields: `pathId` (string | null) and `chapterId` (string | null).
- `exportGraph()` emits `path` and `chapter` dictionaries in the JSON output at `schemaVersion: 4`.
- `importProject()` accepts `schemaVersion: 4` as valid and initializes `path` and `chapter` from file, or defaults both to `{}` when absent on v3 imports.
- `loadGraph()` and `newGraph()` initialize `path: {}` and `chapter: {}`.
- A new `PathChapterManager.jsx` component surfaces in a new "Paths" tab in `Sidebar.jsx`, providing list + add + rename + delete UI for both entity types.
- `NodeInspector.jsx` shows two dropdowns (Path, Chapter) below the existing fields. Selection writes to `node.data.pathId` and `node.data.chapterId` via `updateNode`.
- `components/index.js` exports `PathChapterManager`.

---

## What existing behavior is IDENTICAL in both (before and after)

- All edge connection logic, condition evaluation, and simulation behavior is unchanged.
- Canvas rendering is unchanged — no group regions, overlays, or visual boundaries are drawn around paths or chapters.
- All existing `common`, `choice`, `ending`, `flag`, `status`, `edges` CRUD actions are unchanged.
- `simulationStore.js` is unchanged.
- `conditionEvaluator.js` is unchanged.
- `GraphCanvas.jsx`, `CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`, and `ConditionalEdge.jsx` are unchanged.
- `FlagManager.jsx` and `StatusManager.jsx` are unchanged.
- The Inspector tab, Flags tab, and Status tab in `Sidebar.jsx` are unchanged in their behavior.
- All architecture rules AR-01 through AR-12 remain satisfied.
- `schemaVersion: 1` and `schemaVersion: 2` and `schemaVersion: 3` imports continue to work via the existing migration path, with `path` and `chapter` defaulting to `{}`.
