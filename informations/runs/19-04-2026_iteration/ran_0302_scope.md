# Scope Report: Import / Export Layer

## Part 1 — User fills

### What I am changing
Import / Export Layer

### Why this needs to change
The current persistence model is explicit-only: work survives only when the user remembers to click Export. A tab close, browser crash, or accidental New wipes everything. This is fragile for a tool designers use across long editing sessions.
It also ties the core "don't lose work" guarantee to the File System Access API, which Firefox and Safari don't support (RISK-03). Users on those browsers have no reliable persistence path at all.
Shifting to IndexedDB auto-save as the primary layer makes persistence universal (IndexedDB is supported everywhere), automatic (no user action required), and resilient (survives tab close and crashes). Export/Import remain for explicit file movement — sharing, backup, version control — but are no longer load-bearing for basic work preservation.
Later update also depends on this: campaign sheets need a persistence home, and layering them onto IndexedDB is only coherent if the narrative data already lives there.

### New behavior after this push
Replace FS Access API primary with IndexedDB auto-save as primary. 
File System Access API for explicit export/import. 
Export format updated to Latest schema. `.json` default, `.zip` when campaigns exist. 
Import validation.

### Accepted blast radius
**Progressive Schema Migration:**
**Universal Save/Load via Browser Fallbacks:**
**Application Teardown:**

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/utils/fileSystem.js` | Complete rewrite: IndexedDB auto-save, updated export schema, import validation + sanitization + defaults |
| MODIFY | `src/components/TopBar.jsx` | Export/import actions updated |
| MODIFY | `src/utils/index.js` | Re-exports |

### Assumptions I am making
None

---

## Part 2 — AI fills, user does not edit

### What must stay exactly the same

Cross-referenced from Section 7 of `ran_0301_understand.md` against the accepted blast radius in Part 1:

| Behavior | Status | Rationale |
|---|---|---|
| **Progressive Schema Migration** — v1, v2, v3 → v4 migration chains in `fileSystem.js` correctly re-shape legacy files on load | **ACKNOWLEDGED RISK** | User accepted this in blast radius. The migration chain will be updated to support the new storage layer and target schema. Any v1–v3 files imported via the new explicit Import action must still be migrated correctly. |
| **Universal Save/Load via Browser Fallbacks** — Blob/`<a>` fallback for browsers without File System Access API | **ACKNOWLEDGED RISK** | User accepted this in blast radius. The explicit Export/Import actions can now require FS Access API, but the old fallback path may be dropped or changed. This is a deliberate regression for those paths. |
| **Application Teardown** — `import` and `new` actions call `uiStore.resetSelection()` and `exitCampaign()` to prevent dangling ID references | **ACKNOWLEDGED RISK** | User accepted this in blast radius. Teardown behavior must be re-verified after the IndexedDB layer is introduced, as the "load" trigger changes from a user file action to a store hydration event. If not re-implemented, dangling selection and campaign state will corrupt the UI on restore. |

No behaviors from Section 7 remain fully PROTECTED. All three were explicitly accepted by the user. However, the teardown behavior in particular carries high re-implementation risk — see Migration Flags below.

---

### Affected file list

| File | Status | Reason |
|---|---|---|
| `src/utils/fileSystem.js` | **CHANGES** | Complete rewrite. IndexedDB auto-save replaces FS API as primary persistence. FS API becomes explicit export/import path only. Migration chains must be ported/updated. |
| `src/utils/index.js` | **CHANGES** | Re-exports must reflect any new functions added (e.g., `saveToIndexedDB`, `loadFromIndexedDB`) or renamed exports from the rewritten `fileSystem.js`. |
| `src/components/TopBar.jsx` | **CHANGES** | `handleImport` and `handleExport` call sites must be updated to match new function signatures. `handleNew` may need to explicitly clear IndexedDB state rather than just resetting the store. The IndexedDB auto-save must be wired to store subscription somewhere — likely here or in a new side-effect hook. |
| `src/store/narrativeStore.js` | **MONITOR** | `exportGraph()` — the output shape is the source of truth for what gets serialized. If schema version increments, this function must be updated. `loadGraph()` teardown side effects (calling `uiStore.resetSelection()`) must still fire when restoring from IndexedDB, not only on explicit import. |
| `src/store/uiStore.js` | **MONITOR** | `resetSelection()` is called by `narrativeStore.loadGraph()`. If IndexedDB restoration bypasses `loadGraph()`, this call is skipped. |
| `src/store/simulationStore.js` | **MONITOR** | `exitCampaign()` is called by `TopBar` on import/new. If page restore from IndexedDB happens before `simulationStore` is initialized, residual campaign state must not bleed through. |
| `src/store/index.js` | **PROTECTED** | Barrel re-export only. No direct I/O logic. Will not change unless store files rename exports. |
| All node/edge/inspector components | **PROTECTED** | Consume store state only. Not involved in the I/O layer. No changes needed. |

---

### Migration flags

| Item | Decision | Touched behavior / persisted key | Flag |
|---|---|---|---|
| **IndexedDB as primary storage** | User adds a new persistence layer (`indexedDB`) that did not exist before | All persisted keys (`schemaVersion`, `meta`, `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`) now have a second write path. The IndexedDB schema must be defined from scratch. | **MIGRATION REQUIRED** |
| **Schema version** | User specified "Latest schema" for export. `schemaVersion` is persisted as a Number in the JSON key. If a new version is introduced, all existing exported files are v4 and must still import correctly. | `schemaVersion` key — written at `narrativeStore.js L568`, read at `fileSystem.js L71` | **MIGRATION REQUIRED** — v1–v4 import chains must be preserved or ported into the new `fileSystem.js`. |
| **Progressive schema migration** | Accepted blast radius — migration logic may be rewritten | Migration functions in `fileSystem.js` (L75–L223) handle v1→v3 and v3→v4 reshaping. The user plans to rewrite this file entirely, meaning these functions must be explicitly ported — they are not automatically preserved. If dropped, importing any pre-v4 file silently corrupts or discards data. | **PROCEED WITH CAUTION** |
| **Blob/`<a>` fallback on export** | Accepted blast radius — fallback removal is a deliberate regression | The Blob download path (`fileSystem.js L27–L35`) and `<input type="file">` path (`L56–L62`) are the only export/import mechanisms for Firefox and Safari. If removed without replacement, those browsers lose all file I/O. IndexedDB auto-save compensates for data loss but not for file sharing or backup. | **PROCEED WITH CAUTION** |
| **`exitCampaign()` on load** | Accepted blast radius — teardown must still work, but the trigger changes | Currently fires in `TopBar.handleImport` and `TopBar.handleNew`. If IndexedDB page restore happens at boot rather than via a button click, this call never fires. Residual `isCampaignActive: true` or `currentNodeId` from a prior session could be loaded into `simulationStore` if not explicitly cleared. | **PROCEED WITH CAUTION** |
| **`uiStore.resetSelection()` on load** | Follows from `narrativeStore.loadGraph()` | Currently called inside `narrativeStore.loadGraph()`. If IndexedDB restoration writes directly to the store state without calling `loadGraph()`, this teardown is skipped. `selectedNodeId` / `selectedEdgeId` could point to IDs that no longer exist after the graph is replaced. | **PROCEED WITH CAUTION** |
| **`meta.createdAt` / `updatedAt` type** | Not explicitly addressed but flagged as OBSERVATION in `ran_0301` | `exportGraph` converts `Date.now()` integers to `DD-MM-YYYY` strings. On re-import, these persist as strings. IndexedDB stores the live runtime object — integers intact. When the same graph is re-exported from IndexedDB state, the string-coercion happens again as intended. No new breakage, but the asymmetry remains. | **SAFE** — no new risk introduced by this change. |

---

### Suggested phase shape

- **Phase 1 — IndexedDB layer (data only, no UI changes)**
  Add `saveToIndexedDB(graphData)` and `loadFromIndexedDB()` to `fileSystem.js`. Wire auto-save to `narrativeStore` via a Zustand `subscribe` call (likely in `main.jsx` or a new `persistence.js` module). Wire restore at app boot. Verify that `loadGraph()` teardown side effects (selection reset, campaign exit) still fire on restore. No changes to TopBar or export format yet. Independently stoppable — app falls back to existing behavior if IndexedDB fails.

- **Phase 2 — Export / import update**
  Update `exportProject` to write current-version schema (bump `schemaVersion` if needed, update `exportGraph()` in `narrativeStore.js`). Update `importProject` with new validation, sanitization, and defaults. Port v1–v4 migration chains into the new structure. Add `.zip` output path when campaign data exists. Update `src/utils/index.js` re-exports. Independently testable against known v1–v4 fixture files.

- **Phase 3 — TopBar wiring**
  Update `TopBar.jsx` handlers to match new function signatures from Phase 2. Verify `handleNew` explicitly clears IndexedDB state. Remove any now-dead references to old API shapes. Confirm teardown (selection reset, campaign exit) fires correctly across all three entry points: button import, button new, and boot restore from IndexedDB.
