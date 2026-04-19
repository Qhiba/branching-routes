# Campaign_Sheets — Audit Report (Pass 1)

**Feature:** Campaign_Sheets  
**Audit Pass:** 1  
**Date:** 2026-04-19  

---

## 1. Phase Execution Completeness

| Phase | Name | Complete? | Test? | Evidence |
|-------|------|-----------|-------|----------|
| 1 | Data Layer | COMPLETE | PASS (6/6) | `ran_0206_test_1.md` — all 6 tests passed; `campaignStore.js`, IndexedDB functions, barrel exports, and `main.jsx` boot wiring all present on disk. |
| 2 | Simulation Integration | COMPLETE | PASS (3/3) | `ran_0206_test_2.md` — all 3 tests passed; `enterCampaign` payload hydration and dangling-ID filtering verified. |
| 3 | UI | COMPLETE | SKIPPED (justified) | `ran_0206_test_3.md` — skipped per 0206 constraint (no standalone pure logic); `CampaignSelector.jsx`, `TopBar.jsx`, `SandboxPanel.jsx` all present with fix-3 applied. |
| 4 | File I/O | COMPLETE | SKIPPED (justified) | `ran_0206_test_4.md` — skipped per 0206 constraint (browser-only APIs); `fileSystem.js` ZIP export/import implemented; JSZip in `package.json`. |

**Assessment:** All 4 phases COMPLETE. Tests PASS or SKIPPED with valid justification.  
No automatic HOLD from this section.

---

## 2. Feature Delivery — Achievement Check

### Feature Delta Items

| Delta Item | Status | Evidence |
|-----------|--------|----------|
| `campaignStore.js` — Zustand store with campaign dictionary, CRUD, persistence | DELIVERED | `src/store/campaignStore.js` L5-96. `addCampaign`, `updateCampaign`, `deleteCampaign`, `setActiveCampaign`, `clearCampaigns`, `saveCampaignsToIndexedDB`, `loadCampaignsFromIndexedDB`, `loadCampaignsFromObject` present. |
| `CampaignSelector.jsx` — Campaign list, create, switch, delete, reset UI | DELIVERED | `src/components/CampaignSelector.jsx` L5-95. Edit mode: campaign pills with Enter/Delete + creation form. Active mode: name label + Reset Campaign button. |
| Campaign-aware `enterCampaign()` — accepts optional payload | DELIVERED | `src/store/simulationStore.js` L245-323. Accepts `campaignPayload`, hydrates `flagOverrides`/`statusOverrides` filtered against existing narrative IDs (RISK-CSH-02). Falls back to defaults when absent. |
| Campaign-aware `exitCampaign()` — snapshots back to campaignStore | DELIVERED | `src/store/simulationStore.js` L453-486. Conditional snapshot (autosave gate), synchronous write via `useCampaignStore.getState().updateCampaign()`. |
| Debounced campaign auto-save subscriber | DELIVERED | `src/main.jsx` L31-37. 1000ms debounce, calls `state.saveCampaignsToIndexedDB()`. |
| Boot-time campaign restore | DELIVERED | `src/main.jsx` L19. `await useCampaignStore.getState().loadCampaignsFromIndexedDB()`. `loadCampaignsFromIndexedDB` calls `setActiveCampaign(null)` at L77 of `campaignStore.js`. |
| ZIP export (campaigns present) | DELIVERED | `src/utils/fileSystem.js` L123-182. Conditional ZIP with `datamodel.json` + `campaigns/{name}.json` per campaign. JSZip browser-side only. |
| ZIP import | DELIVERED | `src/utils/fileSystem.js` L184-449. Detects `.zip` vs `.json`, unpacks campaigns, validates `campaignSchemaVersion === 1` and `camp-` prefix. |

### Definition of Done Conditions

| Condition | Status | Evidence |
|-----------|--------|----------|
| ADD `src/store/campaignStore.js` | MET | File exists, 97 lines, functional. |
| ADD `src/components/CampaignSelector.jsx` | MET | File exists, 96 lines, functional. |
| MODIFY `src/store/simulationStore.js` | MET | `enterCampaign` and `exitCampaign` modified; `snapshotCampaign` and `autosaveCampaign` added. |
| MODIFY `src/store/index.js` | MET | `useCampaignStore` re-exported at L4. |
| MODIFY `src/utils/fileSystem.js` | MET | DB_VERSION=2, campaign IndexedDB functions, ZIP export/import. |
| MODIFY `src/components/TopBar.jsx` | MET | `CampaignSelector` mounted L186; `handleNew` calls `clearCampaignsIndexedDB`; `handleExport` passes campaigns; `handleImport` processes `{ graphData, campaigns }`. |

No automatic HOLD from this section.

---

## 3. Integration — Existing System Check

| Integration Point | Status | PROTECTED Comment? | Evidence |
|-------------------|--------|---------------------|----------|
| 1. `simulationStore.js` — Campaign Lifecycle | INTACT | Yes (L277, L392, L470) | `enterCampaign()` with no args falls back to narrative defaults (L277). `exitCampaign()` teardown sequence unchanged (L470-485). `reset()` preserved verbatim (L392-434). |
| 2. `simulationStore.js` — Sandbox Overrides | INTACT | N/A (untouched code) | `applySandboxOverride` at L186-212 unchanged; never writes to `narrativeStore`. |
| 3. `simulationStore.js` — Passive Structural Analysis | INTACT | N/A (untouched code) | `runPassiveAnalysis` at L170-184 unchanged; `isCampaignActive` guard present at L172. |
| 4. `fileSystem.js` — IndexedDB Persistence | INTACT | Yes (L16) | `saveToIndexedDB`, `loadFromIndexedDB`, `clearIndexedDB` unchanged (L30-74). `onupgradeneeded` preserves existing `graphs` store (L17-18). |
| 5. `fileSystem.js` — Export/Import | INTACT | N/A (migration chain untouched) | Migration chain v1-v3 (L329-387), v2-v3 (L388-403), v3-v4 (L405-410) — code is byte-identical to pre-feature. Sanitization block unchanged (L413-447). |
| 6. `main.jsx` — Boot Persistence Wiring | INTACT | Yes (L11) | Narrative restore block (L12-16) unchanged. `initPersistence().then(() => render())` pattern preserved (L40-46). Campaign additions inserted after narrative restore (L19, L31-37). |
| 7. `TopBar.jsx` — Campaign Controls | INTACT | N/A | `isCampaignActive` gate disables authoring buttons (L163, 166, 169, 170, 171). "Campaign Active" indicator retained (L156-162). "Reset Simulation" and "Exit Campaign Mode" buttons retained (L177-182). |
| 8. `Sidebar.jsx` — Sandbox Tab Visibility | INTACT | N/A | `isCampaignActive` gate at L43 and L69 unchanged. No sidebar modifications for campaigns. File unmodified by this feature. |
| 9. `narrativeStore.js` — All CRUD and Export | INTACT | N/A (file untouched) | Git log confirms no commits to `narrativeStore.js` during this feature. `schemaVersion` remains `4`. |

No automatic HOLD from this section.

---

## 4. Data Model Integrity

### Is every data model change strictly additive?

**YES.**
- New entity `Campaign` introduced in greenfield `campaignStore.js`.
- `narrativeStore` entities unchanged; `schemaVersion` remains `4`.
- `simulationStore` additions (`autosaveCampaign`, `setAutosaveCampaign`, `snapshotCampaign`) are new fields/actions; no existing fields removed or renamed.

### Does the export/import round-trip survive unchanged?

**PARTIALLY — ISSUE FOUND.**

- **JSON export (no campaigns):** Unchanged. `exportProject(graphData)` produces `schemaVersion: 4` JSON. OK
- **ZIP export (campaigns):** Produces correct `datamodel.json` + `campaigns/{name}.json` bundle. OK
- **ZIP import → campaign re-hydration:** Campaign files validated against `campaignSchemaVersion: 1`. OK
- **Legacy `.json` import:** Unchanged migration chain. OK

> **ISSUE: `statusOverrides` not saved in snapshots.**
>
> The `snapshotCampaign` action (L443-448) and `exitCampaign` auto-save (L460-465) both construct the snapshot as:
> ```js
> { activeNodeId, seenNodeIds, traversedEdgeIds, flagOverrides: { ...state.currentFlagValues } }
> ```
> The `statusOverrides` field is **missing** from the snapshot. The Campaign data model schema (from `ran_0202_datamodelimpact.md`) specifies `snapshot.statusOverrides: { [statusId]: number }`. When `enterCampaign(payload)` loads a saved campaign, it reads from `snapshot.statusOverrides` (L271-272) separately, causing status values to reset to narrative defaults on campaign resume.
>
> **Technical detail:** Status values (numeric) are stored in `currentFlagValues` alongside boolean flags (this is the existing design from the simulation store), so `flagOverrides: { ...state.currentFlagValues }` _does_ capture both flag and status values in a single object. However, `enterCampaign` reads `statusOverrides` separately — meaning status values saved via `flagOverrides` will be found through the `flagOverrides` path (since `s.id in campaignPayload.snapshot.flagOverrides` at L271 will find them there), while the `statusOverrides` path at L271-272 returns `undefined` and falls back to `s.value` (the narrative default).
>
> **Net result:** When a campaign is saved and re-loaded, status values are **reset to narrative defaults** instead of the campaign's saved values. This is a data integrity regression.

### Are all new entity IDs in the correct format?

**YES.** Campaign IDs use `camp-` prefix via `generateId('camp')` at `campaignStore.js` L10.

### DATA MODEL: **VIOLATED** — statusOverrides not round-tripping correctly.

---

## 5. Architecture Compliance

| Rule | Status | Evidence |
|------|--------|---------|
| AR-01 — Naming: Files | PASS | `campaignStore.js` (camelCase + store suffix), `CampaignSelector.jsx` (PascalCase). |
| AR-02 — Naming: Variables | PASS | Campaign IDs are UUID-based via `generateId('camp')`. |
| AR-03 — State Management | PASS | Campaign state in `campaignStore` Zustand store. `CampaignSelector` uses `useState` only for `newName` input (L16). |
| AR-04 — Data Layer Separation | PASS | `CampaignSelector` and `TopBar` call store actions only — no direct state mutation. |
| AR-05 — Single Source of Truth | PASS | `campaignStore` is canonical campaign list. Does not duplicate `narrativeStore` data. |
| AR-06 — Import Constraints | PASS | `simulationStore.js` imports `useCampaignStore` directly from `./campaignStore.js` (L5). `campaignStore.js` does NOT import `simulationStore`. No circular dependency. |
| AR-07 — Condition Evaluation | N/A | No condition logic changes. `conditionEvaluator.js` untouched. |
| AR-08 — Simulation Isolation | PASS | Campaign snapshots write to `campaignStore.updateCampaign()`, never to `narrativeStore`. `enterCampaign` hydrates `currentFlagValues` in `simulationStore` only. |
| AR-09 — JSON Format Stability | PASS | `schemaVersion` remains `4`. Campaign files use `campaignSchemaVersion: 1`. Import validates both independently (`fileSystem.js` L240, L257). |
| AR-10 — No External Backend | PASS | JSZip is browser-side only. No network calls. |
| AR-11 — Side Effect Placement | N/A | No side effect changes. |
| AR-12 — Node Type Constraints | N/A | No node type changes. |
| AR-13 — Sub-Array CRUD | N/A | No sub-array CRUD changes. |
| AR-14 — Zustand Selector Stability | PASS | No new object/array literals returned as fallbacks in `campaignStore.js` selectors. All selectors return existing references. |
| AR-15 — Edge Uniqueness Tuple | N/A | No edge logic changes. |
| AR-16 — Campaign Visual State Vocabulary | N/A | No new visual states introduced. Six-state enum unchanged. |
| AR-17 — Boot-Time Side-Effect Isolation | PASS | Campaign restore and auto-save subscriber wired inside `initPersistence()` at `main.jsx` L19 and L31-37. Both complete before `render()`. |

---

## 6. New Risks and Rule Candidates

### New Risks

| ID | Description | Likelihood | Impact |
|----|-------------|------------|--------|
| NEW RISK — Status round-trip loss | Campaign snapshots save `flagOverrides` (which contains both flags and statuses in `currentFlagValues`) but don't save `statusOverrides` as a separate field. `enterCampaign` reads `statusOverrides` independently, causing status values to fall back to narrative defaults on campaign resume. | HIGH | HIGH |
| NEW RISK — Duplicate `loadCampaignsFromObject` | `campaignStore.js` L81-86 and L89-94 define `loadCampaignsFromObject` twice. The second definition silently overrides the first. Not functional breakage but dead code that signals a copy-paste error. | LOW | LOW |
| NEW RISK — `SandboxPanel` scope creep | `SandboxPanel.jsx` was listed as PROTECTED in `ran_0201_scope.md` L95 but was modified in Phase 3 fix to add Campaign Save controls. This was user-requested but violates the original protection boundary. The modification is additive and doesn't break existing functionality. | LOW | LOW |

### Rule Candidates

| ID | Pattern | Why it should be a rule |
|----|---------|------------------------|
| RULE CANDIDATE — Snapshot shape must match data model schema | When a store action constructs a snapshot object for persistence, the object shape must include exactly the fields specified in the data model impact document. | The `statusOverrides` omission demonstrates this class of bug. A rule mandating snapshot-schema alignment would catch it at self-review. |

---

## 7. Final Verdict

**HOLD**

### Blocking Issues

| # | Description | Severity | File(s) | What Must Change | Violates |
|---|-------------|----------|---------|------------------|----------|
| 1 | **`statusOverrides` missing from campaign snapshot save-back.** Both `snapshotCampaign` (L443-448) and `exitCampaign` auto-save (L460-465) construct `{ flagOverrides: { ...state.currentFlagValues } }` but omit `statusOverrides`. `enterCampaign` reads `snapshot.statusOverrides` (L271-272) separately, causing status values to reset to narrative defaults on campaign resume. | **Critical** | `src/store/simulationStore.js` L443-448 and L460-465 | The snapshot construction must separate flag values and status values from `currentFlagValues` into distinct `flagOverrides` and `statusOverrides` objects. Iterate `narrativeStore.flag` keys for `flagOverrides` and `narrativeStore.status` keys for `statusOverrides`, extracting each from `currentFlagValues`. | Data Model Impact (snapshot schema), Feature Delta (campaign-aware `exitCampaign`). |
| 2 | **Duplicate `loadCampaignsFromObject` definition.** `campaignStore.js` L81-86 and L89-94 define the same function twice. | **Minor** | `src/store/campaignStore.js` L88-94 | Remove the duplicate definition at L88-94. Keep only the first at L80-86. | Code cleanliness. |

---

## Fix Phase — Audit Pass 1 Fixes

**Produces:** Corrected `src/store/simulationStore.js`, corrected `src/store/campaignStore.js`

**Files to modify:**
- `src/store/simulationStore.js` — Refactor snapshot construction in both `snapshotCampaign` and `exitCampaign` to separate `flagOverrides` (boolean flags) from `statusOverrides` (numeric statuses) using `narrativeStore.getState().flag` and `.status` as key-space discriminators.
- `src/store/campaignStore.js` — Remove duplicate `loadCampaignsFromObject` definition at lines 88-94.

**Architecture rules to respect:** AR-08 (snapshot writes to `campaignStore` only), AR-06 (no circular imports).

**Integration points to protect:**
- Integration Point 1 — `enterCampaign()` hydration path must correctly receive both `flagOverrides` and `statusOverrides`.
- Integration Point 2 — `applySandboxOverride` write path unchanged.

**Verification:**
1. Create a project with at least one flag and one status.
2. Enter a campaign, advance past some nodes, change a status value via sandbox override.
3. Save progression (manual or autosave).
4. Exit campaign, then re-enter the same campaign.
5. Verify both flag values AND status values match the saved state, not the narrative defaults.
6. Verify `campaignStore.js` has exactly one `loadCampaignsFromObject` definition.

**Route:** → **0205 Fix** (correction needed, not a fundamental rebuild).

> After all fixes are complete, re-run 0207 as pass 2.
