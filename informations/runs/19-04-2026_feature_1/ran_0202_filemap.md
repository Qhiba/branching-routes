# Campaign_Sheets — File Map

---

## Files to CREATE

---

### `src/store/campaignStore.js`

- **Status:** NEW
- **What changes and why:** Creates the Zustand store that owns all campaign state. Introduces the `campaigns` dictionary (`{ [campaignId]: Campaign }`), the `activeCampaignId` string, and all CRUD actions (`addCampaign`, `updateCampaign`, `deleteCampaign`, `setActiveCampaign`, `clearCampaigns`). Also owns `saveCampaignsToIndexedDB` and `loadCampaignsFromIndexedDB`, which target the `campaigns` object store in IndexedDB (added during DB version bump).
- **What must NOT change:** Nothing — this is a greenfield file.
- **Which phase touches it:** Phase 1 (create), Phase 2 (read/write from `simulationStore`).

---

### `src/components/CampaignSelector.jsx`

- **Status:** NEW
- **What changes and why:** Renders the campaign management UI: a list of named campaigns (pill row or dropdown), a "New Campaign" creation form (single text input + confirm button), per-campaign controls (Switch, Delete, Reset), and an "Enter Campaign Mode" fallback when no campaigns exist yet. Mounts inside `TopBar` in place of the bare "Enter Campaign Mode" button. All mutations go through `campaignStore` actions and then call `simulationStore.enterCampaign(campaignPayload)`.
- **What must NOT change:** Nothing — this is a greenfield file. Component local state is limited to the new-campaign name input field only (AR-03).
- **Which phase touches it:** Phase 3 (create).

---

## Files to MODIFY

---

### `src/store/simulationStore.js`

- **Status:** EXISTING
- **What changes and why:**
  - `enterCampaign()` gains an optional `campaignPayload` argument. When provided, it hydrates `currentFlagValues` from `campaignPayload.snapshot.flagOverrides` and `statusOverrides` (filtered against currently-existing `narrativeStore.flag` / `narrativeStore.status` keys to defend against dangling references). When absent, existing seed-from-defaults behavior is preserved.
  - `exitCampaign()` gains a campaign snapshot step: before clearing state, it calls `useCampaignStore.getState().updateCampaign(activeCampaignId, { snapshot: {...} })` using `.getState()` to avoid circular import (AR-06). The snapshot captures `activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, `currentFlagValues` (excluding sandbox overrides). It then clears state as today.
  - `activeCampaignId` is **not** mirrored here — components read it directly from `campaignStore` (see Data Model Impact decision).
- **What must NOT change:** `advance()`, `selectOption()`, `applySandboxOverride()`, `reset()`, `runPassiveAnalysis()`, `computeReachable()`, `computeNodeStates()`, `applyFlagsSet()`, `applyStatusSet()`, `computePassiveAnalysis()` — all pure simulation logic is byte-for-byte unchanged.
- **Which phase touches it:** Phase 2.

---

### `src/store/index.js`

- **Status:** EXISTING
- **What changes and why:** Adds `export { useCampaignStore } from './campaignStore.js';` so all consuming components import from the barrel (`store`) and not directly from the store file.
- **What must NOT change:** The three existing exports (`useNarrativeStore`, `useSimulationStore`, `useUIStore`).
- **Which phase touches it:** Phase 1.

---

### `src/utils/fileSystem.js`

- **Status:** EXISTING
- **What changes and why:**
  - `DB_VERSION` bumped from `1` → `2`. The `onupgradeneeded` handler adds a `campaigns` object store when upgrading.
  - Two new functions added: `saveCampaignsToIndexedDB(campaignsDict)` and `loadCampaignsFromIndexedDB()`. These target the `campaigns` object store using the key `'campaigns'`.
  - `exportProject(graphData, campaigns, defaultTitle)` gains a `campaigns` parameter. When `Object.keys(campaigns).length > 0`, the function bundles `datamodel.json` + `campaigns/{name}.json` into a `.zip` using JSZip (browser-side, no network, AR-10). When no campaigns exist, the existing `.json` path is preserved exactly.
  - `importProject()` gains ZIP detection: if the selected file name ends in `.zip`, the function uses JSZip to unpack it, passes `datamodel.json` through the existing migration + sanitization chain, and validates each `campaigns/*.json` file against `campaignSchemaVersion: 1`. If the file is `.json`, the existing path runs unchanged.
  - The `showOpenFilePicker` / `showSaveFilePicker` calls are updated to accept both `.json` and `.zip` where applicable.
- **What must NOT change:** The narrative migration chain (`v1→v3`, `v2→v3`, `v3→v4`), the `sanitizedData` sanitization block, `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB` — all unchanged in behavior.
- **Which phase touches it:** Phase 1 (IndexedDB functions + DB version bump), Phase 4 (ZIP export/import).

---

### `src/utils/index.js`

- **Status:** EXISTING
- **What changes and why:** Adds `saveCampaignsToIndexedDB` and `loadCampaignsFromIndexedDB` to the barrel re-export so `campaignStore` and `main.jsx` import them from `utils`. Existing exports are unchanged.
- **What must NOT change:** The three existing exports (`generateId`, `evaluateCondition`/`evaluateClause`, `exportProject`/`importProject`/`saveToIndexedDB`/`loadFromIndexedDB`/`clearIndexedDB`).
- **Which phase touches it:** Phase 1.

---

### `src/components/TopBar.jsx`

- **Status:** EXISTING
- **What changes and why:** Replaces the bare `Enter Campaign Mode` button in the edit-mode branch with `<CampaignSelector />`. The "Campaign Active" indicator, "Reset Simulation" button, and "Exit Campaign Mode" button in the active-campaign branch are retained exactly. `handleStartSimulation` local handler is removed (it moves into `CampaignSelector`). Import of `CampaignSelector` added.
- **What must NOT change:** Title input, Tidy Layout, Snap To Grid, New, Import, Export handlers, the `isCampaignActive` gate for disabling authoring buttons, and the "Reset Simulation" / "Exit Campaign Mode" buttons in the active state.
- **Which phase touches it:** Phase 3.

---

### `src/main.jsx`

- **Status:** EXISTING
- **What changes and why:** `initPersistence()` is extended with two additions, both inserted after the existing narrative restore block and before `render()`:
  1. `await useCampaignStore.getState().loadCampaignsFromIndexedDB()` — restores the campaign list. Calls `setActiveCampaign(null)` to ensure no campaign auto-resumes (AR-17, RISK-IDB-03).
  2. A debounced `useCampaignStore.subscribe(...)` subscriber — same 1000 ms debounce pattern as the narrative subscriber — that calls `saveCampaignsToIndexedDB(state.campaigns)` on change.
- **What must NOT change:** The narrative `loadFromIndexedDB` restore, the narrative `saveToIndexedDB` subscriber, and the `initPersistence().then(() => render(...))` call sequence.
- **Which phase touches it:** Phase 1.

---

### `src/components/index.js`

- **Status:** EXISTING
- **What changes and why:** Adds `CampaignSelector` to the component barrel exports.
- **What must NOT change:** All existing component exports.
- **Which phase touches it:** Phase 3.
