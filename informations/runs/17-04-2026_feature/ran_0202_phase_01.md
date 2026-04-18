# Phase 1 — Data Layer

---

**Goal:** Add `path{}` and `chapter{}` to the narrative store and ensure the JSON export/import round-trip survives the schema version bump.

---

## What it adds

- `path: {}` and `chapter: {}` as initial state in `narrativeStore`.
- Six new store actions: `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`.
- `deletePath` and `deleteChapter` cascade: nullify `data.pathId` / `data.chapterId` on all nodes in `common`, `choice`, `ending`.
- `newGraph()` updated to reset `path: {}` and `chapter: {}`.
- `loadGraph(graphData)` updated to load `path: graphData.path || {}` and `chapter: graphData.chapter || {}`.
- `exportGraph()` updated to emit `path: state.path` and `chapter: state.chapter`, with `schemaVersion` bumped to `4`.
- `fileSystem.js` updated to accept `schemaVersion: 4` and adds v3→v4 migration (sets `path: {}`, `chapter: {}`).

---

## Produces

| File | Change |
|------|--------|
| `src/store/narrativeStore.js` | MODIFY — add state, 6 actions, update `newGraph`, `loadGraph`, `exportGraph` |
| `src/utils/fileSystem.js` | MODIFY — accept v4, add v3→v4 migration branch |

---

## What it leaves temporarily incomplete

- No UI for managing paths or chapters yet (Phase 2 completes this).
- No node fields `pathId` / `chapterId` on existing nodes yet — they will be read as `null` by Phase 3's dropdowns. This is safe because Phase 3 defaults them to `null` in the UI layer.

---

## What the next phase depends on from this phase

- Phase 2 depends on `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter` being callable from a component.
- Phase 3 depends on `path{}` and `chapter{}` being readable from `narrativeStore` via selectors, and on `updateNode` being able to persist `pathId`/`chapterId` fields (already works — `updateNode` merges arbitrary `data` fields).

---

## Reference files needed

- `ran_0201_scope.md`
- `ran_0202_featuredelta.md`
- `ran_0202_datamodelimpact.md`
- `ran_0202_filemap.md`
- `src/store/narrativeStore.js`
- `src/utils/fileSystem.js`

---

## Rollback cost if this phase fails: LOW

Only two files are touched. Both are well-isolated. If the phase fails, revert `narrativeStore.js` and `fileSystem.js` to their pre-phase state. No UI components have been touched; the app remains fully functional.

---

## Hard stop triggers for this phase

- Any existing store action changes behavior (not just additions). **STOP.**
- `schemaVersion` in `exportGraph` changes to anything other than `4`. **STOP.**
- `fileSystem.js` v1 or v2 migration path is altered. **STOP.**
- Any import is added to `narrativeStore.js` that could create a circular dependency (AR-06). **STOP.**

---

## Acceptance Criteria

Done when:
- [ ] `useNarrativeStore.getState().path` returns `{}` on a fresh load.
- [ ] `useNarrativeStore.getState().chapter` returns `{}` on a fresh load.
- [ ] `addPath('Act 1')` creates an entry in `path{}` with a `p-` prefixed ID.
- [ ] `addChapter('The Forest')` creates an entry in `chapter{}` with a `c-` prefixed ID.
- [ ] `deletePath(id)` — after assigning that path to a node — results in the node's `data.pathId` being `null`.
- [ ] `deleteChapter(id)` — after assigning that chapter to a node — results in the node's `data.chapterId` being `null`.
- [ ] `newGraph()` produces a state where `path` and `chapter` are both `{}`.
- [ ] Exporting a graph produces JSON with `schemaVersion: 4`, a `path` key, and a `chapter` key.
- [ ] Importing that exported v4 JSON succeeds and produces the correct `path` and `chapter` state.
- [ ] Importing an existing v3 JSON succeeds; `path` and `chapter` default to `{}`.
- [ ] Importing v1 and v2 files still succeeds without error.

---

## Verification

Open the app in a browser. Open DevTools console.

1. Run `useNarrativeStore.getState().path` → expect `{}`.
2. Run `useNarrativeStore.getState().addPath('Test Path')` → expect no error.
3. Run `useNarrativeStore.getState().path` → expect one entry with a `p-` prefixed key.
4. Run `useNarrativeStore.getState().addChapter('Test Chapter')` → expect no error.
5. Run `useNarrativeStore.getState().chapter` → expect one entry with a `c-` prefixed key.
6. Click **Export** in the app. Open the downloaded JSON. Confirm `schemaVersion` is `4` and both `path` and `chapter` keys exist.
7. Click **Import** and load the just-exported v4 file. Confirm no error and the store contains the correct `path` and `chapter` data.
8. Click **Import** and load an existing v3 save file. Confirm no error. Run `useNarrativeStore.getState().path` → expect `{}`.
9. Click **New**. Run `useNarrativeStore.getState().path` → expect `{}`.
