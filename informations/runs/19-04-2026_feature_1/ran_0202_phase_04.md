# Campaign_Sheets — Phase 4: File I/O

---

**Phase 4 — File I/O: ZIP export/import**

---

### Goal
Upgrade the export and import pipeline so projects with campaigns round-trip as a `.zip` bundle containing both the narrative data model and named campaign files, while keeping the existing `.json`-only path untouched for campaign-less projects.

---

### What it adds

- **`src/utils/fileSystem.js`** — `exportProject` and `importProject` modifications:

  **`exportProject(graphData, campaigns, defaultTitle)`** — extended:
  - Gains a `campaigns` parameter (the campaign dictionary from `campaignStore`).
  - If `Object.keys(campaigns).length === 0`: existing `.json` export path runs exactly as today. No change.
  - If campaigns exist: use JSZip (browser-side, no network — AR-10) to build a `.zip` containing:
    - `datamodel.json` — the existing `JSON.stringify(graphData)` payload, unchanged.
    - `campaigns/{campaign.name}.json` — one file per campaign, containing the full `Campaign` object (`id`, `name`, `timestamps`, `campaignSchemaVersion`, `snapshot`).
  - The `showSaveFilePicker` descriptor adds `.zip` to accepted types when campaigns are present.
  - Filename: `{safeTitle}.zip` when campaigns exist, `{safeTitle}.json` when they do not.
  - JSZip must be added as a project dependency (`npm install jszip`). It is a browser-compatible library with no network calls at runtime (AR-10).

  **`importProject()`** — extended:
  - `showOpenFilePicker` descriptor updated to accept both `.json` and `.zip`.
  - After the file is obtained: check `file.name.endsWith('.zip')`.
  - **ZIP branch:** use JSZip to unpack the archive. Read `datamodel.json` as text, parse, and pass through the existing migration chain and sanitization block exactly as today. Read each file in `campaigns/` as text, parse, and validate: `campaignSchemaVersion` must equal `1`; `id` must match `/^camp-/`; `snapshot` must be an object. Invalid campaign files are skipped with a `console.warn` — they do not abort the import. Return `{ graphData: sanitizedData, campaigns: validatedCampaigns }`.
  - **JSON branch:** existing path unchanged. Returns `{ graphData: sanitizedData, campaigns: {} }` (or maintains backward compatibility by returning `sanitizedData` directly — consuming caller must handle both shapes; see integration point below).
  - The `unsupported_schema_version` error throw is preserved in the ZIP branch (applies to `datamodel.json` inside the archive).

  **Caller update in `TopBar.handleImport`** (Phase 3 owns `TopBar`, but this cross-phase dependency must be noted):
  - `importProject()` now returns `{ graphData, campaigns }`. `handleImport` must call `loadGraph(graphData)` and `campaignStore.loadCampaignsFromObject(campaigns)` (a new store action that merges a provided campaigns dictionary — added to `campaignStore` in this phase).
  - This is a **cross-phase modification** to `TopBar.jsx`. If Phase 4 is executed after Phase 3, `TopBar.jsx` must be updated again to handle the new return shape. If Phase 4 is executed before Phase 3, the caller implementation lands together with the import. Either order is valid.

- **`src/store/campaignStore.js`** — one new action:
  - `loadCampaignsFromObject(campaignsDict)` → validates and merges an externally provided campaigns dictionary (from ZIP import) into the store. Calls `setActiveCampaign(null)`. Used by `handleImport`.

- **`package.json`**: adds `jszip` as a dependency.

---

### Produces

| File | Status |
|------|--------|
| `src/utils/fileSystem.js` | MODIFY (export/import ZIP logic) |
| `src/store/campaignStore.js` | MODIFY (add `loadCampaignsFromObject`) |
| `src/components/TopBar.jsx` | MODIFY (update `handleImport` return shape handling) |
| `package.json` | MODIFY (add `jszip`) |

---

### What it leaves temporarily incomplete

Nothing — Phase 4 is the final phase. The feature is complete after this phase.

---

### What the next phase depends on from this phase

This is the final phase. No downstream phases exist within this feature.

---

### Reference files needed

- `ran_0202_phase_03.md` — confirms `handleImport` location and `clearCampaigns` call
- `ran_0202_datamodelimpact.md` — `Campaign` entity schema, `campaignSchemaVersion: 1`
- `ran_0202_integrationpoints.md` — integration point 5 (`fileSystem.js — Export/Import`)
- `src/utils/fileSystem.js` — current `exportProject` and `importProject` implementations
- `src/components/TopBar.jsx` — `handleImport` handler

---

### Rollback cost if this phase fails: **MEDIUM**

Rollback involves reverting `exportProject` and `importProject` to their pre-ZIP signatures and removing the `campaigns` parameter from the export call site in `TopBar`. Campaign-less projects are completely unaffected since the existing `.json` path is preserved. The `loadCampaignsFromObject` action on `campaignStore` is additive and harmless to leave in place even if Phase 4 is rolled back. `jszip` can be removed from `package.json`. No data loss occurs — IndexedDB persistence is unaffected.

**MEDIUM** rating is because the change touches the import return shape, which requires a coordinated update in `TopBar.handleImport`. A partial rollback (ZIP export removed but import return shape not reverted) would break the JSON import path. The rollback must be complete: `fileSystem.js` reverts together with the `TopBar` caller update.

---

### Hard stop triggers for this phase

- JSZip's `loadAsync` or `generateAsync` APIs make network calls at runtime — STOP, verify the library is purely browser-side before shipping (AR-10 compliance).
- ZIP import loads `campaigns/*.json` and writes any value into `narrativeStore` — AR-08 violated. STOP.
- `importProject()` ZIP branch passes the archive's `datamodel.json` through a different sanitization path than the JSON branch — divergence risk. STOP, ensure the exact same migration + sanitization chain runs in both branches.
- A campaign file with `campaignSchemaVersion !== 1` causes the entire import to fail rather than being skipped — overly strict. STOP, align with the spec: skip-and-warn, do not abort.

---

### Acceptance Criteria

Done when:
1. With two campaigns ("run_1", "run_2") in the store, clicking "Export" produces a `{title}.zip` file.
2. Opening that `.zip` in a ZIP tool shows: `datamodel.json` at root + `campaigns/run_1.json` + `campaigns/run_2.json`.
3. In a fresh browser session (cleared IndexedDB), importing the `.zip` restores the narrative graph identically to the original and loads both campaigns into `campaignStore`.
4. A campaign-less project still exports as `.json` and imports as `.json` — the existing path is unbroken.
5. A v1–v3 legacy `.json` file imports without regression (migration chain still runs correctly).

---

### Verification

Open the app. Create a project with at least two nodes, one flag, and two campaigns ("alpha_run", "beta_run"). Enter each campaign, advance one node, exit. Click "Export" — confirm the browser saves a `.zip` file. Open the ZIP and inspect its contents (campaign files present, `datamodel.json` correct). Open a new browser tab (or clear IndexedDB via DevTools). Import the `.zip` — confirm both campaigns appear in the campaign list. Enter "alpha_run" — confirm it resumes from the correct node. Also confirm: importing a plain `.json` still works with no error.

---

### Note: This phase is independently skippable

The feature is fully functional (create campaigns, persist them, switch between them, auto-save) without ZIP. Phase 4 only adds cross-session portability of campaign data. If the scope needs trimming, Phase 4 can be deferred without blocking Phases 1–3 from shipping.
