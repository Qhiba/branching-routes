# Campaign_Sheets — Risk Register

---

## RISK-CSH-01 — Campaign auto-save write storm on every `advance()`

**Description:** `advance()` updates `activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, and `currentFlagValues` on every node transition. If the campaign auto-save subscriber fires synchronously on each set, and the user clicks through nodes rapidly, the `campaigns` IndexedDB store receives N sequential write requests with N debounce timers, all resolving within seconds. This mirrors RISK-IDB-02 from the narrative layer.

**Early detection signal:** Profiling shows IndexedDB write calls every `< 100 ms` during simulation playback; browser DevTools IndexedDB panel shows write queue depth > 5.

**Mitigation:** Apply the same 1000 ms debounce pattern used for the narrative subscriber. The `useCampaignStore.subscribe(...)` wiring in `main.jsx` must use a shared `timeoutId` variable, identical in structure to the existing narrative subscriber. Phase 1 acceptance criteria must verify debounce is active before Phase 2 enables `advance()` to write to `campaignStore`.

---

## RISK-CSH-02 — Dangling flag/status IDs in campaign snapshots

**Description:** A campaign snapshot stores `flagOverrides: { [flagId]: bool }` and `statusOverrides: { [statusId]: number }`. If the user exits campaign mode, deletes a flag from `narrativeStore`, then re-enters that campaign, `enterCampaign(payload)` will attempt to seed `currentFlagValues` with an ID that no longer exists in `narrativeStore`. Downstream, `computeReachable` and `conditionEvaluator` may receive unexpected keys.

**Early detection signal:** `currentFlagValues` after `enterCampaign(payload)` contains keys absent from `narrativeStore.flag` and `narrativeStore.status`.

**Mitigation:** `enterCampaign(payload)` must filter `snapshot.flagOverrides` and `snapshot.statusOverrides` against currently-existing IDs in `narrativeStore.getState().flag` and `.status` before seeding. Unknown IDs are silently dropped. This guard is required in Phase 2 and must be tested explicitly.

---

## RISK-CSH-03 — `handleNew` leaves orphaned campaign data in IndexedDB

**Description:** `handleNew` in `TopBar` currently calls `clearIndexedDB()` (which clears only the `graphs` store) then `newGraph()`. After this feature, a new project started while campaigns exist will have its campaign data still present in IndexedDB on next boot — because the campaign `campaigns` object store is never cleared. On next session, `loadCampaignsFromIndexedDB()` restores stale campaigns that reference nodes from the previous project.

**Early detection signal:** After "New Project", reloading the session shows campaigns referencing node/flag IDs that do not exist in the empty narrative graph.

**Mitigation:** `handleNew` must also call `clearCampaignsIndexedDB()` (new function) before `campaignStore.clearCampaigns()`. This must be treated as an atomic sequence: clear narrative DB → clear campaign DB → reset narrative store → reset campaign store → exit campaign. Phase 1 must introduce `clearCampaignsIndexedDB`. Phase 3 must verify `handleNew` calls it.

---

## RISK-CSH-04 — `exitCampaign()` circular import with `campaignStore`

**Description:** `exitCampaign()` in `simulationStore` must call `campaignStore.updateCampaign(...)` to snapshot state before teardown. If `simulationStore` imports `campaignStore` at module level, and `campaignStore` imports anything from `simulationStore` (e.g., for type checking), a circular dependency forms — which causes Zustand store init to fail at runtime (AR-06).

**Early detection signal:** App fails to mount, browser console shows `Cannot access 'useCampaignStore' before initialization` or equivalent Vite module resolution error.

**Mitigation:** `exitCampaign()` must use `useCampaignStore.getState().updateCampaign(...)` called at runtime (not imported at module init). `campaignStore.js` must not import anything from `simulationStore.js`. This is the same pattern `simulationStore.js` already uses for `useNarrativeStore.getState()` — verify, do not invent a new pattern. Confirmed safe in Phase 2 via a cold-boot test.

---

## RISK-CSH-05 — Campaign boot restore auto-resumes an active campaign

**Description:** If `campaignStore` persists `activeCampaignId` to IndexedDB alongside the campaign list, and `loadCampaignsFromIndexedDB()` naively restores the full store state (including `activeCampaignId`), the app will boot with a non-null `activeCampaignId`. Components reading `isCampaignActive` from `simulationStore` will remain in edit mode (it starts `false`), but `CampaignSelector` may incorrectly highlight the "active" campaign from the previous session. More critically: if any boot logic reads `activeCampaignId` and auto-calls `enterCampaign`, the user lands in campaign mode on every refresh.

**Early detection signal:** On page reload, the UI shows the campaign mode indicator or a campaign is already highlighted as active without user action.

**Mitigation:** `loadCampaignsFromIndexedDB()` must call `setActiveCampaign(null)` after restoring the campaign list, regardless of whatever `activeCampaignId` was persisted. Alternatively, `activeCampaignId` is never persisted to IndexedDB — only `campaigns{}` is written. The save function writes only `{ campaigns: state.campaigns }` and `activeCampaignId` always starts as `null` on cold load. Second approach is simpler and preferred. Required in Phase 1.
