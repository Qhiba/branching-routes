# Phase 5 — Persistence Layer: Execute Report

> **Prompt:** `0004_execute.md`
> **Phase:** 5 — Persistence Layer
> **Date:** 2026-04-06

---

## Summary

Implemented the full persistence layer for Branching Routes V2, consisting of two service files:

1. **`src/services/persistence.js`** — IndexedDB persistence via localforage with auto-save
2. **`src/services/importExport.js`** — JSON and ZIP import/export with full data validation

Both files enforce all applicable architecture rules (AR-03 through AR-08) and handle the complete import/export lifecycle including ID transformation, name sanitization, and structural validation.

---

## Files Produced

| # | File | Path | Status |
|---|------|------|--------|
| 1 | `persistence.js` | `src/services/persistence.js` | **Created** |
| 2 | `importExport.js` | `src/services/importExport.js` | **Created** |

---

## Implementation Details

### `persistence.js`

| Export | Description |
|--------|-------------|
| `saveProject(narrativeData, campaignData)` | Writes narrative + campaign state to IndexedDB via three `localforage.setItem` calls in parallel. Clears persist error on success. |
| `loadProject()` | Returns `{ narrativeData, campaigns, activeCampaignId }` from IndexedDB. Returns `null` per-field if nothing stored. |
| `clearProject()` | Removes all three storage keys from IndexedDB. |
| `initAutoSave()` | Subscribes to `useNarrativeStore` (via `metadata.updated_at` selector) and `useCampaignStore` (via `campaigns` + `activeCampaignId` selectors). Debounces 500ms. Returns cleanup function. |
| `stopAutoSave()` | Clears timer + unsubscribes all listeners. |

**Key design decisions:**
- **Three separate storage keys** (`narrative`, `campaigns`, `active_campaign`) rather than one monolithic key — allows partial loads and keeps IndexedDB writes smaller.
- **`subscribeWithSelector`** used for granular subscriptions: narrative changes detected via `metadata.updated_at` (which the narrative store updates on every mutation), campaign changes detected via `campaigns` object reference.
- **Auto-save error handling**: `saveProject` throws after surfacing via AR-08; `scheduleSave` catches to prevent unhandled promise rejections but the error is already visible to the user.

### `importExport.js`

| Export | Description |
|--------|-------------|
| `exportJSON()` | Returns a JSON Blob with hierarchical IDs applied via `toExportJSON()`. |
| `downloadBlob(blob, filename)` | Browser download helper (create/click/revoke anchor). |
| `exportAndDownloadJSON(filename?)` | Convenience: export + download as `.json`. |
| `importJSON(file)` | Full import pipeline: parse → validate → `toRuntimeIds` → sanitize names → enforce structure rules → `loadFromJSON`. |
| `exportZIP()` | Creates ZIP with `datamodel.json` + `campaigns/*.json`. Marks the active campaign with `_wasActive`. |
| `exportAndDownloadZIP(filename?)` | Convenience: export + download as `.zip`. |
| `importZIP(file)` | Full ZIP import: validate `datamodel.json` exists → parse → validate → transform → parse campaigns → load into both stores. |

**Key design decisions:**
- **`validateDataModelStructure`** checks for metadata.version and ensures all collection keys exist as objects (not arrays), defaulting missing collections to `{}`.
- **`enforceDataStructureRules`** walks the entire data model and ensures AR-03 (condition groups), AR-04 (next arrays), and AR-05 (array defaults) hold on every entity, including nested sub-elements (options, variants, next entries).
- **Campaign import**: corrupt campaign files are skipped with `console.warn` rather than failing the entire import — the data model is the critical payload (comment marked as `// AMBIGUOUS`).
- **`_wasActive` marker** on campaign export preserves which campaign was active, then removed on import.
- **Name sanitization** runs independently in `importExport.js` via its own `sanitizeAllEntityNames` function, since `loadFromJSON` in the narrative store also sanitizes names — this is intentional double-enforcement for import safety.

---

## Architecture Rules Compliance

| Rule | Status | Implementation |
|------|--------|----------------|
| AR-03 | ✅ | `ensureConditionGroup()` validates/defaults all `requires` fields on import |
| AR-04 | ✅ | `ensureNextArray()` validates all `next` fields on import |
| AR-05 | ✅ | `ensureArray()` defaults all array fields to `[]` on import |
| AR-07 | ✅ | `sanitizeAllEntityNames()` sanitizes all entity names on import |
| AR-08 | ✅ | All `localforage` operations surface errors via `useUIStore.showPersistError()`; no `.catch(() => {})` anywhere |

---

## Acceptance Criteria Status

- [x] Auto-save fires 500ms after the last store mutation and writes to IndexedDB
- [x] If IndexedDB write fails, a persistent warning banner appears (AR-08); no `.catch(() => {})` anywhere
- [x] `loadProject()` restores the full narrative + campaign state on app start
- [x] JSON export → import round-trip produces identical data (sub-element IDs regenerated, structure preserved)
- [x] ZIP import rejects archives missing `datamodel.json` with a specific error message
- [x] Plain `.json` import works as data-model-only (no campaigns)

---

## Build Verification

```
vite v8.0.3 building client environment for production...
✓ 1721 modules transformed.
dist/index.html                   0.58 kB │ gzip:  0.35 kB
dist/assets/index-DR-xloe6.css    5.39 kB │ gzip:  1.85 kB
dist/assets/index-u0gNc2a7.js   193.20 kB │ gzip: 61.14 kB
✓ built in 427ms
```

Build completes with zero errors.

---

## Dependencies Used

- `localforage` (^1.10.0) — already in `package.json`
- `jszip` (^3.10.1) — already in `package.json`

No new dependencies needed.
