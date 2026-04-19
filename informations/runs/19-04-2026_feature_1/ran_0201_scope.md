<!-- ran_0201_scope.md -->
<!-- Generated: 2026-04-19 -->

# Campaign_Sheets — Feature Scope Report

---

## Part 1 — User fills *(reproduced for reference)*

### Feature name
Campaign_Sheets

### What this feature does
Adds persistent simulation snapshots. Users can create named campaigns ("good_ending_run", "chapter_2_test"), each storing its own `nodeStates`, `flagOverrides`, and `statusOverrides`. Campaigns are saved to IndexedDB alongside narrative data and survive across sessions.
The Previous Update Enter/Exit Campaign Mode toggle becomes a campaign selector dropdown in the TopBar. Selecting a campaign hydrates `simulationStore` with that campaign's saved state and activates simulation mode. Switching campaigns auto-saves the outgoing one before loading the incoming one. Exiting returns to editing mode.
Export format upgrades to `.zip` when campaigns exist (containing `datamodel.json` + `campaigns/{name}.json`). Campaign-less projects continue exporting as `.json`.

### What this feature does NOT do
- Does not change the narrative data model. `narrativeStore` is untouched; campaigns only reference narrative IDs.
- Does not mutate authored flag/status values. Campaign overrides hydrate `simulationStore` only — AR-08 applies.
- Does not auto-generate campaigns. Users explicitly create them.
- Does not add new simulation mechanics. Six-state enum, seen tracking, sandbox overrides — all from previous update, unchanged.
- Does not add route tracing (later update), UI shell changes (later update), or any new narrative entity types.
- Does not migrate existing data. Projects without campaigns continue working identically.

### Why this feature is needed now
Previous update gave the app a working simulation but no way to preserve a run. Every Enter Campaign Mode starts from scratch — the moment you exit, the traversal is gone. For a tool designed to validate branching narratives, this makes serious testing impractical: you can't compare "good ending run" against "bad ending run" side-by-side, can't return to a half-tested path, can't share a reproducible scenario.

Previous update made persistence automatic for narrative data. Campaigns are the natural next persisted entity — the plumbing (IndexedDB, auto-save subscriber, ZIP-capable export) already exists, so this is the lowest-cost moment to add them. Delaying would either mean shipping an unusable simulation layer or retrofitting persistence onto campaigns later, duplicating work.

Later update (route tracing) also depends on campaign-mode simulation being fully featured, so this unblocks downstream work.

### Definition of done

| Action | File | Detail |
|--------|------|--------|
| ADD | `src/store/campaignStore.js` | Campaign CRUD, persistence, active campaign management |
| ADD | `src/components/CampaignSelector.jsx` | Campaign create/switch/reset UI |
| MODIFY | `src/store/simulationStore.js` | Integration with active campaign |
| MODIFY | `src/store/index.js` | Re-export campaignStore |
| MODIFY | `src/utils/fileSystem.js` | ZIP export/import for campaigns |
| MODIFY | `src/components/TopBar.jsx` | Campaign selector mount point |

### Assumptions
NONE

---

## Part 2 — AI fills

### Related existing features

| Existing Feature / Component | Relationship |
|------------------------------|-------------|
| **`simulationStore.js` — Campaign lifecycle** (`enterCampaign`, `exitCampaign`, `reset`, `advance`, `selectOption`)  | Campaigns wrap and hydrate this store on activation. The campaign's saved `nodeStates`, `flagOverrides`, and `statusOverrides` become the initial values when a campaign is loaded. `exitCampaign` must also trigger a save-back to `campaignStore` before teardown. |
| **`simulationStore.js` — Sandbox overrides** (`applySandboxOverride`, `sandboxOverrides`, `currentFlagValues`) | Campaign overrides and sandbox overrides share `currentFlagValues` as the live working set. The campaign feature must distinguish between: (a) the saved override snapshot loaded from a campaign, and (b) ad-hoc sandbox values layered on top during a run. Both remain isolated from `narrativeStore` (AR-08). |
| **`simulationStore.js` — Passive structural analysis** (`runPassiveAnalysis`, `orphanedNodeIds`, `unreachableNodeIds`) | Passive analysis runs in edit mode only. Switching campaigns triggers `enterCampaign` and must not conflict with the passive analysis trigger. The existing `useEffect` gating in `GraphCanvas` handles this already — no change required, but it must be verified. |
| **`fileSystem.js` — IndexedDB persistence** (`saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB`) | Current auto-save writes only `narrativeStore.exportGraph()` output. With campaigns, the campaign list must also be persisted. The simplest approach is a separate IndexedDB store for campaigns, or augmenting the existing save record. Either way, `campaignStore` will need its own save/load pair, analogous to `saveToIndexedDB`/`loadFromIndexedDB`. |
| **`fileSystem.js` — Export/Import** (`exportProject`, `importProject`) | Export format must conditionally produce a `.zip` when campaigns exist, containing `datamodel.json` plus `campaigns/{name}.json` per campaign. Import must detect `.zip` vs `.json` and route accordingly. The existing v1–v4 migration chain applies only to the `datamodel.json` inner payload; campaign files are new and have no migration legacy. |
| **`main.jsx` — Boot persistence wiring** (`initPersistence`) | Currently restores only narrative data. Must also restore campaigns via `campaignStore` on boot, inserted into the same `initPersistence` sequence (AR-17: all boot I/O in one function). |
| **`TopBar.jsx` — Campaign controls** | The current `Enter Campaign Mode` / `Exit Campaign Mode` / `Reset Simulation` button group is the primary mount point for the new `CampaignSelector` component. The existing `isCampaignActive` flag still governs authoring control lock-out; the selector just changes what activates a campaign. |
| **`Sidebar.jsx` — Sandbox tab** | Sandbox tab visibility is gated on `isCampaignActive`. Adding a campaign selector does not change this gate — but the campaign name the Sandbox is operating on should be legible to the user (display concern, not a state concern). |
| **`narrativeStore.js` — All CRUD actions** | Strictly protected. Campaigns reference narrative IDs (`nodeId`, `flagId`, `statusId`) but never write into this store. Referential integrity across campaign data is the campaign layer's responsibility, not the narrative layer's. |

---

### Files to touch

| File | Action | Reason |
|------|--------|--------|
| `src/store/campaignStore.js` | **CREATE** | New Zustand store owning all campaign state: the campaign dictionary `campaigns{}`, the active campaign ID, and CRUD actions (`addCampaign`, `updateCampaign`, `deleteCampaign`, `setActiveCampaign`). Also owns `saveCampaignToIndexedDB` and `loadCampaignsFromIndexedDB`. |
| `src/components/CampaignSelector.jsx` | **CREATE** | New component rendering campaign list (dropdown or pill row), New Campaign button, Delete button, and Reset button. Mounts inside `TopBar`. |
| `src/store/simulationStore.js` | **MODIFY** | `enterCampaign()` must accept an optional campaign payload to hydrate from. `exitCampaign()` must snapshot current state back to `campaignStore` before teardown. |
| `src/store/index.js` | **MODIFY** | Add `useCampaignStore` to the barrel re-export. |
| `src/utils/fileSystem.js` | **MODIFY** | `exportProject` conditionally bundles as ZIP when campaigns exist. `importProject` detects ZIP vs JSON and unpacks campaigns. New campaign-specific IndexedDB accessor functions (or extend existing). |
| `src/utils/index.js` | **MODIFY** | Re-export any new campaign-related utility functions added to `fileSystem.js`. |
| `src/components/TopBar.jsx` | **MODIFY** | Replace the `Enter Campaign Mode` button with `<CampaignSelector />`. Retain `Reset Simulation` + `Exit Campaign Mode` buttons for the active campaign state. |
| `src/main.jsx` | **MODIFY** | Extend `initPersistence()` to also load campaigns from IndexedDB via `campaignStore.loadCampaignsFromIndexedDB()` and wire the campaign auto-save subscriber (debounced, same pattern as narrative auto-save). |
| `src/components/index.js` | **MODIFY** | Add `CampaignSelector` to barrel exports. |

---

### Files to protect

| File | Status | Why |
|------|--------|-----|
| `src/store/narrativeStore.js` | **PROTECTED** | Feature explicitly states narrativeStore is untouched. Campaigns only reference narrative IDs — they never write into this store. Any modification here would violate the feature's primary boundary. |
| `src/store/uiStore.js` | **PROTECTED** | No UI state changes are in scope. Selection, snap-to-grid, and choice display mode are unaffected by campaign management. |
| `src/utils/conditionEvaluator.js` | **PROTECTED** | Pure condition evaluation logic is unchanged. No new simulation mechanics are added. |
| `src/utils/uuid.js` | **PROTECTED** | UUID generation contract is stable. Campaign entities will reuse `generateId('camp')` via the existing function — no modification needed. |
| `src/styles/tokens.css` | **PROTECTED** | No new visual states are introduced. Campaign selector is a UI control, not a simulation state, and uses existing design tokens. |
| `src/styles/global.css` | **PROTECTED** | No new CSS simulation classes. The six-state enum (AR-16) is closed; campaigns do not add a seventh state. |
| `src/components/GraphCanvas.jsx` | **PROTECTED** | Campaign switching routes through `enterCampaign`/`exitCampaign` in `simulationStore`. Canvas interaction logic (advance-by-click, passive analysis trigger) is unchanged. |
| `src/components/Sidebar.jsx` | **PROTECTED** | Sandbox tab visibility gate (`isCampaignActive`) does not change. No new sidebar tabs are added. |
| `src/components/SandboxPanel.jsx` | **PROTECTED** | Sandbox write path through `applySandboxOverride` is unchanged. Campaign overrides and sandbox overrides are layered at the `simulationStore` level — `SandboxPanel` itself is not structural. |
| All node/edge renderers (`CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge`) | **PROTECTED** | Rendering logic consumes `simulationStore` state only. As long as `enterCampaign` produces the same `nodeStates`/`seenNodeIds` shape, these components require zero modification. |
| `src/components/NodeInspector.jsx`, `EdgeInspector.jsx`, `FlagManager.jsx`, `StatusManager.jsx`, `PathChapterManager.jsx`, `VariantEditor.jsx`, `OptionEditor.jsx` | **PROTECTED** | Authoring UI is already locked out during campaign mode via `Sidebar` pointer-events. No authoring component needs awareness of campaigns. |

---

### Architecture rules relevant to this feature

| Rule | Relevance |
|------|-----------|
| **AR-03 — State Management** | `campaignStore` must be a Zustand store. All campaign state (list, active campaign, snapshots) lives there. No campaign data leaks into React component `useState`. Local state in `CampaignSelector` is limited to the new-campaign name input field only. |
| **AR-04 — Data Layer Separation** | `CampaignSelector` and `TopBar` may not mutate campaign state directly. All mutations go through `campaignStore` actions (`addCampaign`, `deleteCampaign`, `setActiveCampaign`). |
| **AR-05 — Single Source of Truth** | `narrativeStore` remains the canonical graph. `campaignStore` is the canonical campaign list. Neither duplicates the other's data — campaigns store only simulation snapshots plus a reference to the narrative (implicitly the current document). |
| **AR-06 — Import Constraints** | `campaignStore` must not circularly import `simulationStore`. If `simulationStore.exitCampaign` needs to write to `campaignStore`, it must call `useCampaignStore.getState().updateCampaign(...)` — not be imported at module init time. This is the same pattern `simulationStore` already uses for `useNarrativeStore.getState()`. |
| **AR-08 — Simulation Isolation** | Campaign snapshots (`flagOverrides`, `statusOverrides`, `nodeStates`) are simulation data — they live in `campaignStore` at rest and in `simulationStore.currentFlagValues` when active. They must never write to `narrativeStore.flag` or `narrativeStore.status`. The save-back from `exitCampaign` goes to `campaignStore`, not `narrativeStore`. |
| **AR-09 — JSON Format Stability** | The narrative `datamodel.json` inside the ZIP retains `schemaVersion: 4` — no bump. Campaign files are a new export artefact; they should carry their own `campaignSchemaVersion: 1` to enable future migration. The import function must validate both independently. |
| **AR-10 — No External Backend** | All campaign persistence is IndexedDB (auto-save) and browser file APIs (export/import). JSZip or equivalent must be a browser-side library with no network calls. |
| **AR-14 — Zustand Selector Stability** | `campaignStore` selectors must not return new object or array literals as fallbacks. Selectors for the campaign list must return the existing `campaigns` reference or `undefined` — never `{}` or `[]`. |
| **AR-17 — Boot-Time Side-Effect Isolation** | Campaign IndexedDB restoration must be added inside `initPersistence()` in `main.jsx` — not in a component `useEffect` or in `campaignStore`'s initial state. The campaign restore must complete before `render()` is called, in sequence with the narrative restore. |

---

### Relevant existing risks

| Risk | Relevance to Campaign_Sheets |
|------|------------------------------|
| **RISK-IDB-02 — Auto-save subscription write storm** | AMPLIFIED. A second debounced subscriber for `campaignStore` must be added in `initPersistence`. The same 1000ms debounce pattern from the narrative subscriber must be applied. Without it, frequent campaign state changes (e.g., `advance()` updating `nodeStates`) could cause write storms to the campaign IndexedDB store. |
| **RISK-IDB-04 — `handleNew` auto-save race condition** | AMPLIFIED. `handleNew` currently clears narrative IndexedDB before `newGraph()`. It must also clear campaign IndexedDB (or the full campaign list) before `campaignStore.clearCampaigns()`. Failure to do so leaves orphaned campaign data that references a deleted narrative. |
| **RISK-IDB-03 — Boot restore bypasses teardown** | EXTENDED. Campaign restore at boot must call `setActiveCampaign(null)` (no campaign active on cold load) regardless of any previously active campaign ID that may have been persisted. The boot sequence must never auto-resume a campaign without explicit user action. |
| **RISK-02 — Flag name collisions** | BACKGROUND CONCERN. Campaign snapshots store flag/status values by ID. If a flag is deleted from `narrativeStore` while a campaign snapshot still references it, the snapshot contains a dangling key. When that campaign is later activated, `enterCampaign` must defensively filter snapshot values against currently-existing `narrativeStore.flag` and `narrativeStore.status` keys — ignoring unknown IDs rather than crashing. |
| **RISK-CM-03 — Sandbox overrides leak into narrativeStore** | BACKGROUND CONCERN. Campaign overrides hydrate `simulationStore.currentFlagValues`. The existing `applySandboxOverride` write path is unmodified — but the new `enterCampaign(campaignPayload)` hydration path must follow the same isolation covenant: only write to `simulationStore.currentFlagValues`, never to `narrativeStore`. |

---

### Suggested phase shape

**Phase 1 — Data layer: `campaignStore` + IndexedDB persistence**
- Create `src/store/campaignStore.js` with the campaign dictionary, CRUD actions, and IndexedDB save/load functions.
- Extend `main.jsx` `initPersistence()` to restore campaigns on boot and wire the debounced campaign auto-save subscriber.
- Extend `src/store/index.js` and `src/utils/index.js` barrel exports.
- Write a standalone test (`tests/test_campaign_phase_01.js`) verifying: campaign CRUD, persistence round-trip, boot restore, and orphaned-flag defensive filtering.
- **Hard stop:** All tests green before Phase 2 starts.

**Phase 2 — Simulation integration: `simulationStore` wiring**
- Modify `simulationStore.enterCampaign(campaignPayload?)` to hydrate from a campaign snapshot when provided.
- Modify `simulationStore.exitCampaign()` to snapshot current state back to `campaignStore.updateCampaign(...)` before teardown.
- Verify the save-back goes only to `campaignStore` — no `narrativeStore` writes (AR-08 audit).
- Write a test covering: enter with snapshot → advance → exit → campaign snapshot updated correctly.
- **Hard stop:** AR-08 sandbox isolation confirmed before Phase 3 starts.

**Phase 3 — UI: `CampaignSelector` + `TopBar` integration**
- Create `src/components/CampaignSelector.jsx` with campaign list display, new campaign creation form, switch, delete, and reset controls.
- Modify `TopBar.jsx` to mount `<CampaignSelector />` replacing the bare `Enter Campaign Mode` button.
- Retain `Reset Simulation` and `Exit Campaign Mode` buttons in the active-campaign state.
- Manual acceptance: create two campaigns, switch between them, verify auto-save on switch.

**Phase 4 — File I/O: ZIP export/import**
- Modify `exportProject` in `fileSystem.js` to produce a `.zip` (using JSZip or equivalent) when campaigns exist, containing `datamodel.json` + `campaigns/{name}.json`.
- Modify `importProject` to detect `.zip` vs `.json` and route accordingly; validate campaign files with `campaignSchemaVersion: 1`.
- Manual acceptance: export a project with two campaigns as `.zip`, import it in a fresh session, verify both campaigns restore.
- **This phase is independently skippable** — the feature is fully functional without ZIP if file I/O integration is deferred.
