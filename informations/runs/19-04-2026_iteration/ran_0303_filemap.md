# File Map: Import / Export Layer

## Modified Files

### `src/utils/fileSystem.js`
- **What changes and why:**
  - Phase 1: Add `saveToIndexedDB(graphData)` and `loadFromIndexedDB()` — IndexedDB read/write wrappers with error handling.
  - Phase 2: Rewrite `importProject` with expanded validation and sanitization. Port v1–v4 migration chains verbatim. Update `exportProject` if schema version increments. Add `.zip` extension stub (implementation deferred).
  - Phase 3: Add `clearIndexedDB()` function if not already present.
- **What must NOT change:**
  - The external contract of `exportProject(graphData, defaultTitle)` must remain callable with the same arguments from `TopBar`.
  - The external contract of `importProject()` must remain `Promise<Object | null>`.
  - v1–v4 migration chain logic must produce identical output for all existing fixture shapes.
- **Phases that touch it:** 1, 2, 3

---

### `src/utils/index.js`
- **What changes and why:**
  - Phase 1: Add re-exports for `saveToIndexedDB` and `loadFromIndexedDB`.
  - Phase 3: Add re-export for `clearIndexedDB` if added in this phase.
- **What must NOT change:**
  - Existing re-exports (`exportProject`, `importProject`, `generateId`, `evaluateCondition`, `evaluateClause`) must remain present and unchanged.
- **Phases that touch it:** 1, 3

---

### `src/main.jsx`
- **What changes and why:**
  - Phase 1: Boot-time `loadFromIndexedDB()` call added. If data found, passed to `narrativeStore.loadGraph()` (which triggers `uiStore.resetSelection()`). `exitCampaign()` called explicitly after boot restore. `narrativeStore.subscribe()` debounced auto-save wiring added.
  - Phase 3: Verified correct (no additional changes expected if Phase 1 was implemented correctly).
- **What must NOT change:**
  - React `StrictMode` wrapper must remain.
  - `<App />` render must remain the only root-level component.
  - Global CSS import must remain.
- **Phases that touch it:** 1 (3 verification only)

---

### `src/components/TopBar.jsx`
- **What changes and why:**
  - Phase 3: `handleExport` and `handleImport` updated to match any new signatures from Phase 2. `handleNew` updated to call `clearIndexedDB()` before `newGraph()`.
- **What must NOT change:**
  - The UI structure (button labels, layout) must remain unchanged.
  - Campaign mode lock (`disabled={isCampaignActive}`) on authoring controls must remain.
  - Error display for missing start node on campaign entry must remain.
  - `exportStatus` feedback indicator must remain.
- **Phases that touch it:** 3

---

### `src/store/narrativeStore.js`
- **What changes and why:**
  - Phase 2 only if schema version increments: `exportGraph()` updated to emit new `schemaVersion` value and any new top-level fields.
  - Otherwise: no changes.
- **What must NOT change:**
  - `loadGraph()` contract: takes a v4-shaped object, calls `uiStore.resetSelection()` at the end.
  - All CRUD actions (`addNode`, `updateNode`, `deleteNode`, etc.) untouched.
  - `newGraph()` behavior untouched.
- **Phases that touch it:** 2 (conditional)

---

## Unchanged Files

| File | Why unchanged |
|---|---|
| `src/store/uiStore.js` | `resetSelection()` is called by `narrativeStore.loadGraph()`. No changes to that contract. |
| `src/store/simulationStore.js` | `exitCampaign()` is called by TopBar and boot restore. The function itself does not change. |
| `src/store/index.js` | Barrel re-export. No changes to store file exports expected. |
| All node/edge/inspector components | Consume store state only. Not in the I/O path. |
| `src/styles/tokens.css`, `src/styles/global.css`, `src/App.css` | No UI changes in this iteration. |
| `src/App.jsx` | No layout changes in this iteration. |

---

## New Files

None. All logic lands in existing files.

## Deleted / Merged Files

None.
