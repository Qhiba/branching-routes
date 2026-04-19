# Document Report — Import / Export Layer
**Date:** 19-04-2026

---

## Files Updated

### 1. `project_overview.md` — UPDATED

**Why:** Three descriptions were stale after the iteration.

- **Tech Stack — Backend row:** `"all persistence via browser File System Access API"` replaced with `"primary persistence via IndexedDB auto-save; explicit export/import via browser File System Access API"`.
- **Folder structure — `main.jsx`:** Updated from "renders `<App />`" to describe the async boot sequence (IndexedDB restore + autosave subscription wiring).
- **Folder structure — `fileSystem.js`:** Updated from "Browser File System Access API with fallback" to include IndexedDB auto-save, import validation, and sanitization.

---

### 2. `codebase_features.md` — UPDATED

**Why:** Four file entries were stale; a new changelog entry was required.

**Entries rewritten:**
- **`src/main.jsx`:** Purpose now reflects `initPersistence()` async boot sequence (IndexedDB restore, `loadGraph()` + `exitCampaign()`, debounced subscribe). Dependencies updated to include `utils` and `store` barrel imports.
- **`src/utils/fileSystem.js`:** Purpose expanded from "File System Access API with fallback" to cover IndexedDB functions, sanitization pass, and accurate key exports listing all five functions.
- **`src/utils/index.js`:** Key exports updated to include `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`.
- **`src/components/TopBar.jsx`:** Purpose updated to document `handleNew` `clearIndexedDB()` call and teardown sequence. Dependencies updated to include `clearIndexedDB`.

**Changelog entry added:**

```
## [2026-04-19] — IndexedDB_Persistence_Layer
### Changed
- src/main.jsx: Synchronous render bootstrap replaced with async initPersistence()
- src/utils/fileSystem.js: Added IndexedDB functions; importProject hardened with field-level sanitization
- src/utils/index.js: Re-exports updated with three new IndexedDB functions
- src/components/TopBar.jsx: handleNew awaits clearIndexedDB(); handleImport teardown confirmed
### Deprecated
- Nothing — explicit Export/Import and browser fallback paths are unchanged
### Migration
- no — schemaVersion remains 4; all pre-existing files importable without modification
```

---

### 3. `architecture_rules.md` — UPDATED

**Why:** A RULE CANDIDATE was explicitly flagged in `ran_0303_phase_01.md`:
> "Centralizing app-boot side effects … in a dedicated `initPersistence()` function … is a new pattern. Worth formalizing in architecture rules after the iteration stabilizes."

**Decision: FORMALIZED as AR-17.**

**Rationale for formalizing:** The pattern is stable — it is fully implemented, passes audit, and is the only permitted location for boot-time I/O per the implementation. Deferring would leave the pattern undocumented and vulnerable to future violations where boot I/O is embedded in component effects or store initialisers.

**AR-17 — Boot-Time Side-Effect Isolation** added: All app-boot side effects must be encapsulated in a single async function that completes before `createRoot().render()` is called.

---

### 4. `risk_register.md` — UPDATED

**Why:** Five new risks from `ran_0303_risks.md` were addressed during the iteration. RISK-03 was also fully resolved by this iteration.

**Status changes:**
| Risk | Old Status | New Status | Evidence |
|---|---|---|---|
| RISK-03 | OPEN | RESOLVED | IndexedDB auto-save provides universal persistence on all browsers; `<a download>` / `<input type="file">` fallbacks retained for explicit file actions |
| RISK-IDB-01 | — (new) | RESOLVED | 4/4 tests pass in `test_iteration_phase_02.js`; migration chain confirmed identical |
| RISK-IDB-02 | — (new) | RESOLVED | 1000ms debounce in `main.jsx` L16–22; write storm structurally impossible |
| RISK-IDB-03 | — (new) | RESOLVED | Boot calls `loadGraph()` + `exitCampaign()`; simulation state excluded from IndexedDB payload |
| RISK-IDB-04 | — (new) | RESOLVED | `TopBar.jsx` L89–90 `await clearIndexedDB()` before `newGraph()` |
| RISK-IDB-05 | — (new) | RESOLVED | No schema bump; emitter and guard both remain at `4` |

Five new detail sections appended for RISK-IDB-01 through RISK-IDB-05.

---

### 5. `example_datamodel.json` — SKIPPED

**Why:** The audit §4 Migration Integrity confirmed that `schemaVersion` remains `4` and no field names, data structures, or formats changed. The sanitization pass in `importProject` is additive-only (injects defaults for missing fields) — it does not alter the shape of well-formed v4 data. The existing example is a valid, well-formed v4 document and accurately represents the post-iteration data shape.
