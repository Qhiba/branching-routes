# Campaign_Sheets — Phase 3: UI

---

**Phase 3 — UI: `CampaignSelector` + `TopBar` integration**

---

### Goal
Give the user a visible interface to create, select, switch, delete, and reset campaigns, replacing the bare "Enter Campaign Mode" button with a campaign-aware control surface.

---

### What it adds

- **`src/components/CampaignSelector.jsx`** (NEW):
  - Reads `campaigns` and `activeCampaignId` from `useCampaignStore`.
  - Reads `isCampaignActive` from `useSimulationStore`.
  - **Edit mode** (`!isCampaignActive`): renders the campaign list as a pill row or dropdown. Each campaign pill shows the campaign name. Controls per campaign: "Enter" (calls `setActiveCampaign(id)` then `enterCampaign(campaign.snapshot)`) and "Delete" (calls `deleteCampaign(id)`). A "New Campaign" form: text input (local `useState` for name field only — AR-03) + "Create" button that calls `addCampaign(inputName)` and clears the input. If no campaigns exist, renders a single "Enter Campaign Mode" button that calls `addCampaign('Default')` then `enterCampaign()` (no payload — starts fresh).
  - **Active mode** (`isCampaignActive`): renders the active campaign name label and a "Reset Campaign" button (calls `simulationStore.reset()`, which restarts from `narrativeStore` defaults). The "Exit Campaign Mode" and reset buttons remain in `TopBar` — `CampaignSelector` does not render them.
  - All campaign mutations go through store actions (AR-04). No direct state manipulation.
  - No new CSS classes beyond existing design tokens (AR style constraints from scope).

- **`src/components/TopBar.jsx`** — targeted replacement:
  - Remove the local `handleStartSimulation` handler and the `enterCampaign` / `resetSimulation` store subscriptions (those move into `CampaignSelector`).
  - Import `CampaignSelector` from `'components'`.
  - In the edit-mode JSX branch: replace `<button onClick={handleStartSimulation} ...>Enter Campaign Mode</button>` with `<CampaignSelector />`.
  - In the active-mode JSX branch: retain "Reset Simulation" and "Exit Campaign Mode" exactly as today. Add the campaign name display (`<span>{activeCampaignName}</span>`) next to the "Campaign Active" indicator — read `activeCampaignId` from `useCampaignStore` and resolve the name.
  - `handleNew`: add `clearCampaignsIndexedDB()` call before `clearIndexedDB()` and `campaignStore.clearCampaigns()` call before `newGraph()`.
  - `handleImport`: add `campaignStore.clearCampaigns()` after `exitCampaign()` before `loadGraph(data)` — an imported project starts with no campaigns.

- **`src/components/index.js`**: adds `export { default as CampaignSelector } from './CampaignSelector.jsx';`

---

### Produces

| File | Status |
|------|--------|
| `src/components/CampaignSelector.jsx` | CREATE |
| `src/components/TopBar.jsx` | MODIFY |
| `src/components/index.js` | MODIFY |

---

### What it leaves temporarily incomplete

- Export of campaigns as `.zip` is not yet available (Phase 4 completes it). The "Export" button continues to produce a `.json` file even if campaigns exist.
- Importing a `.zip` is not yet available (Phase 4 completes it).

---

### What the next phase depends on from this phase

- Phase 4 does not depend on Phase 3 — ZIP export/import is independent of the UI and can be added before or after. However, Phase 3 is a dependency for full user-facing validation of the feature.

---

### Reference files needed

- `ran_0202_phase_01.md` — `campaignStore` action signatures
- `ran_0202_phase_02.md` — `enterCampaign(payload)` signature, `exitCampaign` snapshot behavior
- `ran_0202_risks.md` — RISK-CSH-03 (`handleNew` campaign clear)
- `src/components/TopBar.jsx` — current JSX structure and handler list
- `src/components/index.js` — current barrel exports

---

### Rollback cost if this phase fails: **LOW**

`CampaignSelector.jsx` is a new file — deleting it reverts the UI with no data loss. `TopBar.jsx` changes are targeted replacements in the button area — reverting the JSX branch and the `handleNew`/`handleImport` additions is straightforward. `index.js` barrel addition is one line.

---

### Hard stop triggers for this phase

- `CampaignSelector` renders a new object literal `{}` or `[]` as a Zustand selector fallback — infinite re-render loop (AR-14). STOP, fix selector.
- Campaign local state (the name input) leaks outside `CampaignSelector` into a Zustand store — AR-03 violation. STOP, keep name input in `useState`.
- `handleNew` does not clear campaign IndexedDB before clearing narrative IndexedDB — RISK-CSH-03 active. STOP, restore correct order.
- `handleImport` does not call `campaignStore.clearCampaigns()` before loading new graph — stale campaigns from the previous project survive the import. STOP.

**RULE CANDIDATE:** The pattern of `handleNew` and `handleImport` both requiring a "clear all persistent stores before loading" teardown sequence is now established across two separate stores. If a third major store is added in the future, this teardown sequence should become a named `teardownProject()` utility. Flag for consideration in 0208 Document.

---

### Acceptance Criteria

Done when:
1. With no campaigns, the "Enter Campaign Mode" area shows a "New Campaign" form. Creating a campaign named "run_1" adds it to the list.
2. With one campaign "run_1" in the list, clicking "Enter" on it activates campaign mode. The "Campaign Active" indicator in TopBar now shows "Campaign Active — run_1".
3. Advancing through two nodes and clicking "Exit Campaign Mode" returns to edit mode. Re-entering "run_1" resumes from the node the user exited on.
4. Clicking "New" while campaigns exist creates a fresh project with no campaigns in the UI and no campaign data in IndexedDB.
5. "Reset Campaign" on an active run resets to the narrative start node (not the saved campaign position).

---

### Verification

Open the app, confirm:
- "Enter Campaign Mode" is replaced by a campaign control area.
- Create a campaign named "story_test".
- Click "Enter" on "story_test". Advance to a second node. Click "Exit Campaign Mode".
- Click "Enter" on "story_test" again. Confirm the simulation resumes at the second node, not the start.
- Click "Reset Campaign" — confirm the simulation restarts at the start node.
- Click "Exit Campaign Mode". Click "New". Confirm the campaign list is empty and DevTools → IndexedDB → campaigns store shows no campaign data.
