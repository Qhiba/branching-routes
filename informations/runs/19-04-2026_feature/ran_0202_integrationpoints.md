# Campaign_Sheets — Integration Points

---

## 1. `simulationStore.js` — Campaign Lifecycle (`enterCampaign`, `exitCampaign`, `reset`)

**What it currently does:**
`enterCampaign()` seeds `currentFlagValues` from `narrativeStore.flag` and `narrativeStore.status` defaults, finds the start node, computes reachability, and sets `isCampaignActive: true`. `exitCampaign()` clears all simulation state back to empty. `reset()` re-runs `enterCampaign` logic in-place.

**How the new feature connects:**
`enterCampaign()` accepts an optional `campaignPayload` argument. When a campaign is selected in `CampaignSelector`, it calls `enterCampaign(campaign.snapshot)`, which hydrates `currentFlagValues` from `snapshot.flagOverrides` + `snapshot.statusOverrides` (deduped and filtered against currently existing narrative IDs). `exitCampaign()` snapshots current state back to `campaignStore.updateCampaign()` via `.getState()` before clearing.

**What must not change:**
The zero-argument call `enterCampaign()` (used by `reset()`) must continue seeding from `narrativeStore` defaults. The full state-clear sequence in `exitCampaign()` must still execute after the save-back step. `isCampaignActive` semantics are unchanged.

---

## 2. `simulationStore.js` — Sandbox Overrides (`applySandboxOverride`, `sandboxOverrides`, `currentFlagValues`)

**What it currently does:**
`applySandboxOverride(key, value)` mutates `currentFlagValues` and `sandboxOverrides` in place (within `simulationStore`), then recomputes reachability. It never writes to `narrativeStore`.

**How the new feature connects:**
Campaign snapshots are stored in `campaignStore` as `flagOverrides` and `statusOverrides`. On `enterCampaign(payload)`, these hydrate `currentFlagValues`. Sandbox overrides then layer on top of those values during the session. On `exitCampaign()`, only the base `currentFlagValues` at time of exit are snapshotted back — `sandboxOverrides` are **not** included in the saved campaign snapshot. This preserves the distinction between persistent campaign state and ad-hoc session overrides.

**What must not change:**
`applySandboxOverride` write path is unchanged. `SandboxPanel` and `sandboxOverrides` state field are unchanged. The AR-08 guarantee (never write to `narrativeStore`) applies equally to campaign hydration.

---

## 3. `simulationStore.js` — Passive Structural Analysis (`runPassiveAnalysis`, `orphanedNodeIds`, `unreachableNodeIds`)

**What it currently does:**
`runPassiveAnalysis()` is a no-op when `isCampaignActive` is true. It runs only in edit mode. The trigger lives in a `useEffect` in `GraphCanvas`.

**How the new feature connects:**
Campaign switching calls `exitCampaign()` (which sets `isCampaignActive: false`) before `enterCampaign(newPayload)` (which sets it back to `true`). The brief interval where `isCampaignActive` is `false` will not trigger passive analysis because `GraphCanvas`'s `useEffect` runs after the next render cycle — by which time `isCampaignActive` is `true` again. No change is needed here, but Phase 2 must verify this timing assumption does not cause a spurious analysis run on fast campaign switches.

**What must not change:**
The `isCampaignActive` guard in `runPassiveAnalysis()` is unchanged. `GraphCanvas`'s `useEffect` dependency array is unchanged.

---

## 4. `fileSystem.js` — IndexedDB Persistence (`saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`)

**What it currently does:**
`saveToIndexedDB(graphData)` writes the narrative graph to the `graphs` object store under key `'autosave'`. `loadFromIndexedDB()` reads it back. `clearIndexedDB()` calls `store.clear()` on the `graphs` store. `DB_VERSION` is `1`.

**How the new feature connects:**
`DB_VERSION` bumps to `2`. The `onupgradeneeded` handler adds a second `campaigns` object store. Two new functions — `saveCampaignsToIndexedDB(campaignsDict)` and `loadCampaignsFromIndexedDB()` — operate on this new store. `clearIndexedDB()` must also clear the campaign store (or be extended into separate `clearNarrativeDB()` and `clearCampaignsDB()` functions called together in `handleNew`).

**What must not change:**
The `graphs` object store and its `autosave` key contract are unchanged. `saveToIndexedDB`, `loadFromIndexedDB`, and `clearIndexedDB` behavior on the narrative side is byte-for-byte identical. The DB upgrade must be additive — existing `graphs` store data must survive the version bump.

---

## 5. `fileSystem.js` — Export/Import (`exportProject`, `importProject`)

**What it currently does:**
`exportProject(graphData, defaultTitle)` serialises `graphData` to JSON and writes a `.json` file via `showSaveFilePicker` or blob fallback. `importProject()` reads a `.json` file, validates `schemaVersion`, runs the migration chain, and returns a sanitized payload.

**How the new feature connects:**
`exportProject(graphData, campaigns, defaultTitle)` gains a `campaigns` parameter. When campaigns exist, it uses JSZip to bundle `datamodel.json` (the existing JSON payload) and `campaigns/{name}.json` (one per campaign) into a `.zip`. The `showSaveFilePicker` descriptor is updated to offer both `.json` and `.zip`. When no campaigns exist, the existing `.json` path is executed unchanged.

`importProject()` detects the file extension. For `.zip`, it uses JSZip to unpack `datamodel.json` (run through the existing migration + sanitization chain) and each `campaigns/*.json` (validated against `campaignSchemaVersion: 1`). For `.json`, the existing path runs unchanged. The `showOpenFilePicker` descriptor is updated to accept `.zip` as well.

**What must not change:**
The migration chain (v1→v2→v3→v4) and sanitization block in `importProject` are byte-for-byte unchanged. The `.json` export fallback (campaigns-less projects) is preserved exactly. The `'AbortError'` early-return pattern is preserved in both picker paths.

---

## 6. `main.jsx` — Boot Persistence Wiring (`initPersistence`)

**What it currently does:**
`initPersistence()` loads the narrative from IndexedDB, calls `loadGraph(data)` and `exitCampaign()` to reset simulation, then wires the narrative debounced auto-save subscriber (1000 ms). `initPersistence().then(() => render())` ensures boot I/O completes before mount (AR-17).

**How the new feature connects:**
After the narrative restore block, two additions are inserted:
1. `await useCampaignStore.getState().loadCampaignsFromIndexedDB()` — restores the campaign list. Immediately calls `setActiveCampaign(null)` to prevent auto-resumption (RISK-IDB-03).
2. A debounced `useCampaignStore.subscribe(...)` subscriber (same 1000 ms debounce) calling `saveCampaignsToIndexedDB(state.campaigns)`.

Both additions are inside `initPersistence()` and complete before `render()` (AR-17).

**What must not change:**
The narrative restore block and its `exitCampaign()` call. The narrative subscriber. The `initPersistence().then(() => render())` outer call sequence.

---

## 7. `TopBar.jsx` — Campaign Controls

**What it currently does:**
In edit mode: renders a single "Enter Campaign Mode" button that calls `handleStartSimulation()` → `enterCampaign()`. In active mode: renders "Reset Simulation" and "Exit Campaign Mode" buttons.

**How the new feature connects:**
The "Enter Campaign Mode" button is replaced by `<CampaignSelector />` in the edit-mode branch. `CampaignSelector` encapsulates the full campaign list + new campaign creation form, and calls `enterCampaign(campaignPayload)` internally. The active-mode branch ("Reset Simulation" + "Exit Campaign Mode") is retained unchanged.

**What must not change:**
The `isCampaignActive` gate on all authoring buttons (Tidy Layout, Snap, New, Import, Export). The "Campaign Active" orange indicator. The "Reset Simulation" and "Exit Campaign Mode" button behavior. The `handleNew`, `handleImport`, `handleExport` handler logic.

---

## 8. `Sidebar.jsx` — Sandbox Tab Visibility

**What it currently does:**
The Sandbox tab is conditionally rendered when `isCampaignActive` is `true`. No other structural significance.

**How the new feature connects:**
`isCampaignActive` semantics are unchanged — the Sandbox tab appears exactly when a campaign is active, regardless of which named campaign is loaded. Sidebar does not need to know the campaign name; that is a display concern handled inside `CampaignSelector` in TopBar.

**What must not change:**
The `isCampaignActive` Sandbox gate. No new sidebar tabs. No Sidebar modifications.

---

## 9. `narrativeStore.js` — All CRUD and Export

**What it currently does:**
Owns all narrative graph entities (`common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`, `meta`). `exportGraph()` serialises the full store to a `schemaVersion: 4` object.

**How the new feature connects:**
Campaigns reference narrative IDs (by storing `flagId`/`statusId` keys in `snapshot.flagOverrides`/`statusOverrides`) but never write back. `exportGraph()` is called unchanged by `exportProject`. The campaign layer is entirely distinct from the narrative layer (AR-05, AR-08).

**What must not change:**
Every action, selector, and export function in `narrativeStore`. `schemaVersion` stays at `4`. Zero modifications to this file.
