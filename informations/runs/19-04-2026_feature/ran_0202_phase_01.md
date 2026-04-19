# Campaign_Sheets — Phase 1: Data Layer

---

**Phase 1 — Data Layer: `campaignStore` + IndexedDB persistence**

---

### Goal
Establish the campaign data layer — the Zustand store, IndexedDB persistence functions, and barrel re-exports — so campaign data can be created, saved, and boot-restored before any UI or simulation wiring exists.

---

### What it adds

- **`src/store/campaignStore.js`** (NEW): Zustand store with:
  - State: `campaigns: {}` (empty object, not `[]` — AR-14), `activeCampaignId: null`
  - Actions: `addCampaign(name)` → generates `camp-{uuid}`, constructs a `Campaign` object with `campaignSchemaVersion: 1`, empty snapshot, timestamps; inserts into `campaigns`.
  - `updateCampaign(campaignId, patch)` → merges patch (typically `{ snapshot: {...} }`) into the campaign entry; updates `updatedAt`.
  - `deleteCampaign(campaignId)` → removes the campaign. If it was the `activeCampaignId`, sets `activeCampaignId` to `null`.
  - `setActiveCampaign(campaignId | null)` → sets `activeCampaignId`.
  - `clearCampaigns()` → sets `campaigns: {}`, `activeCampaignId: null`. Used by `handleNew`.
  - `saveCampaignsToIndexedDB()` → writes `{ campaigns: get().campaigns }` (note: does **not** persist `activeCampaignId` — see RISK-CSH-05) to the `campaigns` object store under key `'campaigns'`.
  - `loadCampaignsFromIndexedDB()` → reads from `campaigns` store, if found calls `set({ campaigns: record.campaigns })`, then always calls `set({ activeCampaignId: null })`.

- **`src/utils/fileSystem.js`** — IndexedDB changes only (Phase 4 owns ZIP):
  - `DB_VERSION` bumped `1 → 2`.
  - `onupgradeneeded` handler: adds `campaigns` object store when `oldVersion < 2` and store doesn't already exist.
  - Two new exported functions: `saveCampaignsToIndexedDB(campaignsPayload)` and `loadCampaignsFromIndexedDB()`. Both follow the same `initDB()` → `transaction` → `objectStore('campaigns')` pattern as the existing functions.
  - `clearCampaignsIndexedDB()` new exported function — calls `store.clear()` on the `campaigns` store. Used by `handleNew`.

- **`src/store/index.js`**: adds `export { useCampaignStore } from './campaignStore.js';`

- **`src/utils/index.js`**: adds `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `clearCampaignsIndexedDB` to barrel exports.

- **`src/main.jsx`** — `initPersistence()` extended:
  - After narrative restore block: `await useCampaignStore.getState().loadCampaignsFromIndexedDB();`
  - After that: wire the campaign auto-save subscriber (1000 ms debounce, separate `timeoutId` variable, calls `saveCampaignsToIndexedDB(state.campaigns)`).
  - `handleNew` path (in `TopBar`) is flagged for Phase 3 — the `clearCampaignsIndexedDB()` call slots in there.

---

### Produces

| File | Status |
|------|--------|
| `src/store/campaignStore.js` | CREATE |
| `src/utils/fileSystem.js` | MODIFY (DB version + campaign IndexedDB functions only) |
| `src/store/index.js` | MODIFY |
| `src/utils/index.js` | MODIFY |
| `src/main.jsx` | MODIFY |

---

### What it leaves temporarily incomplete

- Campaign selector UI — no component exists yet (Phase 3 completes it).
- Simulation hydration from campaign snapshot — `enterCampaign` still ignores payload (Phase 2 completes it).
- `handleNew` campaign DB clear — `TopBar.jsx` not yet touched (Phase 3 completes it).
- ZIP export/import — `exportProject` / `importProject` unchanged (Phase 4 completes it).

---

### What the next phase depends on from this phase

- Phase 2 depends on `useCampaignStore` being importable from `'store'` and `updateCampaign` existing with the correct signature.
- Phase 2 depends on the `Campaign` entity shape being finalized (especially `snapshot` structure).
- Phase 3 depends on `addCampaign`, `deleteCampaign`, `setActiveCampaign`, `clearCampaigns` all being callable.
- Phase 4 depends on `saveCampaignsToIndexedDB` / `loadCampaignsFromIndexedDB` existing in `utils`.

---

### Reference files needed

- `ran_0201_scope.md` — campaign data shape, AR list
- `ran_0202_datamodelimpact.md` — `Campaign` entity schema, `campaignSchemaVersion`
- `ran_0202_filemap.md` — full change specification per file
- `src/utils/fileSystem.js` — `initDB()`, existing store pattern, `DB_VERSION`
- `src/store/index.js` — current barrel exports
- `src/utils/index.js` — current barrel exports
- `src/main.jsx` — current `initPersistence()` structure

---

### Rollback cost if this phase fails: **LOW**

All changes are in new or additive positions. `campaignStore.js` is a new file — deleting it has no side effects. DB version bump requires rolling `DB_VERSION` back to `1`; existing `graphs` store data survives because the bump only adds a new object store. Barrel re-exports are additive. `main.jsx` addition is a two-line block — reversible.

---

### Hard stop triggers for this phase

- Any circular import detected between `campaignStore.js` and `simulationStore.js` — STOP, resolve import direction first.
- `onupgradeneeded` upgrade handler corrupts or clears the existing `graphs` object store — STOP, verify upgrade is additive before proceeding.
- `loadCampaignsFromIndexedDB()` restores the previous `activeCampaignId` without nulling it — STOP, RISK-CSH-05 is active.

---

### Acceptance Criteria

Done when:
1. `useCampaignStore.getState().addCampaign('test')` produces a campaign with `id` matching `/^camp-/`, `createdAt`, `updatedAt`, `campaignSchemaVersion: 1`, and an empty `snapshot`.
2. `saveCampaignsToIndexedDB()` write followed by page reload → `loadCampaignsFromIndexedDB()` restores the campaign list with the `'test'` campaign present.
3. `activeCampaignId` is `null` after `loadCampaignsFromIndexedDB()` regardless of what was saved.
4. The narrative `graphs` IndexedDB store is unaffected by the DB version bump — existing autosave data still loads correctly after the upgrade.
5. No circular import error in the browser console on cold boot.

---

### Verification

Open the app in a browser with DevTools open. In the console, run:
```
useCampaignStore = (await import('/src/store/campaignStore.js')).useCampaignStore;
useCampaignStore.getState().addCampaign('my_test_run');
useCampaignStore.getState().saveCampaignsToIndexedDB();
```
Refresh the page. Open DevTools → Application → IndexedDB → `BranchingRoutesDB` → `campaigns` object store. Confirm the `'campaigns'` key exists and contains `my_test_run`. Confirm the `graphs` autosave key is also still present with the correct narrative data. Confirm `activeCampaignId` is `null` in the `campaignStore` state after restore.
