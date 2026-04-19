# Campaign_Sheets — Documentation Report (0208)

**Feature:** Campaign_Sheets  
**Date:** 2026-04-19  
**Audit Source:** `ran_0207_audit_2.md` (SHIP verdict)

---

## Files Updated

### 1. `informations/docs/project_overview.md` — UPDATED
- **Why:** New files, store, and component added; descriptions updated.
- **Changes:**
  - Backend row: noted ZIP export format for campaign projects.
  - `main.jsx` description: reflects dual store restore and dual debounced subscribe.
  - `store/simulationStore.js`: noted campaign snapshotting.
  - `store/campaignStore.js`: added as new entry.
  - `utils/fileSystem.js`: noted campaign IndexedDB, JSZip, ZIP export/import.
  - `components/TopBar.jsx`: updated description.
  - `components/SandboxPanel.jsx`: updated description (Campaign Save section added).
  - `components/CampaignSelector.jsx`: added as new entry.

### 2. `informations/docs/codebase_features.md` — UPDATED
- **Why:** 3 new files, 7 modified files, changelog entry required.
- **New file entries added:**
  - `src/store/campaignStore.js`
  - `src/components/CampaignSelector.jsx`
- **Rewritten entries:**
  - `src/main.jsx` — dual subscribe wiring, campaign restore.
  - `src/store/simulationStore.js` — `enterCampaign(payload?)`, `snapshotCampaign`, `autosaveCampaign`, `exitCampaign` conditional snapshot, `campaignStore` dependency.
  - `src/store/index.js` — added `useCampaignStore`.
  - `src/utils/fileSystem.js` — campaign IndexedDB, ZIP export/import, JSZip dep.
  - `src/utils/index.js` — added 3 campaign utility exports.
  - `src/components/TopBar.jsx` — campaign-aware import/export/new, `CampaignSelector` mount.
  - `src/components/SandboxPanel.jsx` — Campaign Save section added.
  - `src/components/index.js` — added `CampaignSelector`.
- **Changelog entry:** `[2026-04-19] — Campaign_Sheets` added at top of changelog.

### 3. `informations/docs/architecture_rules.md` — UPDATED
- **Why:** RULE CANDIDATE from audit §6 was formalised.
- **Decision:** RULE CANDIDATE — "Snapshot shape must match data model schema" is stable and directly testable. **Formalised as AR-18.**
- **AR-18 added:** "Snapshot Shape Must Match Data Model Schema" — any store action constructing a persistence snapshot must include exactly the fields declared in the data model impact document, with the same type separations (booleans and numerics in distinct fields).

### 4. `informations/docs/risk_register.md` — UPDATED
- **Why:** 5 planned risks (RISK-CSH-01 through -05) needed status updates; 1 new risk (RISK-CSH-06) needed adding.
- **Summary table:** All 6 RISK-CSH-* entries added.
- **Detail entries:** All 6 added at end of document.
- **Status changes:**
  - RISK-CSH-01: RESOLVED
  - RISK-CSH-02: RESOLVED
  - RISK-CSH-03: RESOLVED
  - RISK-CSH-04: RESOLVED
  - RISK-CSH-05: RESOLVED
  - RISK-CSH-06: ACKNOWLEDGED (SandboxPanel scope creep — additive, no regression)

### 5. `informations/docs/example_datamodel.json` — UPDATED
- **Why:** `status` collection was `{}` — unhelpful for a feature that snapshots `statusOverrides`. Added a realistic status entity (`courage`, value 50, min 0, max 100) with a valid `s-` prefixed ID.

---

## Comment Cleanup

Removed all implementation-phase scaffolding comments (`// ADDED:`, `// MODIFIED:`, `// CHANGED:`, `// FIX:`, `// AMBIGUOUS:`, `// CONFLICT:`) from all feature-modified files. Kept all structural markers (`// PROTECTED:`, `// INVARIANT:`, `// AR-10:`, `// NOTE:`).

Files cleaned:
- `src/store/campaignStore.js`
- `src/store/simulationStore.js`
- `src/store/index.js`
- `src/utils/fileSystem.js`
- `src/utils/index.js`
- `src/main.jsx`
- `src/components/TopBar.jsx`
- `src/components/CampaignSelector.jsx`

---

## Rule Candidate Decisions

| Candidate | Decision | Result |
|-----------|----------|--------|
| Snapshot shape must match data model schema | FORMALISE — pattern is directly testable at self-review; class of bug demonstrated in this feature | Added as **AR-18** |
