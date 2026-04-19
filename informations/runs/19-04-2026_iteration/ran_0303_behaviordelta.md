# Behavior Delta: Import / Export Layer

## Before (Current Behavior)

- **Primary persistence:** Explicit only. Work is lost unless the user clicks Export. Survives nothing automatically (tab close, crash, accidental New).
- **Storage mechanism:** File System Access API (`showSaveFilePicker` / `showOpenFilePicker`) with Blob/`<a>` + `<input type="file">` DOM fallbacks for unsupported browsers.
- **Export trigger:** User clicks Export button in `TopBar`. `exportGraph()` is called, JSON is serialized, and the browser prompts for a save location.
- **Import trigger:** User clicks Import button in `TopBar`. A file is picked, JSON is parsed, migrations run (v1–v4), and `loadGraph()` overwrites the live store.
- **Schema version emitted on export:** `schemaVersion: 4`
- **Export format:** `.json` only.
- **Import validation:** Schema version guard only (`[1, 2, 3, 4]` accepted). No field-level sanitization or defaults injection.
- **Browser scope:** Export/import works universally through browser fallbacks, but the fallback experience is degraded (no save location memory, no file handle).

---

## After (Target Behavior)

- **Primary persistence:** Automatic. Every store change is written to IndexedDB without user action. Work survives tab close, crashes, and accidental New (undo exists at next boot).
- **Storage mechanism:** IndexedDB as primary layer. File System Access API retained for explicit Export/Import only. Blob/`<a>` fallback retained for export on unsupported browsers; `<input type="file">` fallback retained for import.
- **Boot restore:** On app load, if IndexedDB contains a previously saved graph, it is loaded automatically before the user interacts with anything.
- **Auto-save trigger:** Zustand `narrativeStore` subscription — fires on any state change. Debounced to avoid write storms.
- **Export trigger:** User clicks Export. Behavior unchanged from user perspective. Format and schema may update.
- **Import trigger:** User clicks Import. Behavior unchanged from user perspective. Validation is stricter — field-level sanitization and defaults injection replace bare schema version check.
- **Schema version emitted on export:** Current latest (v4 unless bumped; see Migration Strategy).
- **Export format:** `.json` default. `.zip` when campaign data exists (deferred to Phase 2 once campaign persistence is defined).
- **New / Import teardown:** Must still call `uiStore.resetSelection()` and `exitCampaign()`. Applies to boot restore as well, not only button actions.

---

## Identical in Both

- `narrativeStore.exportGraph()` is the canonical source of what gets serialized — unchanged.
- `narrativeStore.loadGraph()` is the canonical target for applying imported data — unchanged in contract.
- `uiStore.resetSelection()` fires whenever a graph is loaded — unchanged.
- `exitCampaign()` fires whenever the graph is replaced — unchanged.
- v1–v4 migration chains apply to any file imported by the user — preserved.
- All CRUD store actions, simulation state, and component behavior are untouched.
- `schemaVersion` remains on the exported JSON as a top-level number field — unchanged.
