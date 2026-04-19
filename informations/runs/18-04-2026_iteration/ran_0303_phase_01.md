# Phase 1 — Campaign-mode boundary rename

- **Goal** — Replace the `isRunning` / start / stop lifecycle with `isCampaignActive` / enter / exit / reset without changing any visual behaviour. This establishes the lifecycle boundary that every later phase keys off.

- **What it changes** — The *name* of the simulation lifecycle boundary and its action vocabulary. `isRunning` becomes `isCampaignActive`; `start()` becomes `enterCampaign()`; a new `exitCampaign()` action is added; `reset()` keeps its identifier but is documented as "restart active campaign from start node" (it resets simulation state but does not exit campaign mode — `exitCampaign` does). `TopBar` button labels swap from `Start Simulation` / `Stop Simulation` to `Enter Campaign Mode` / `Exit Campaign Mode` + `Reset Simulation`. The `.simulation-mode` CSS class is renamed to `.campaign-mode` in `global.css` and its single reference in `GraphCanvas.jsx`.

- **Produces** — Files modified:
  - `src/store/simulationStore.js` — rename state field `isRunning` → `isCampaignActive`; rename action `start` → `enterCampaign`; add `exitCampaign` (same body as current `reset`); keep `advance`; keep `reset` but update to preserve `isCampaignActive: true` so a reset doesn't exit the campaign. The simple path: `reset()` sets state back to the start node's initial computation while leaving `isCampaignActive: true`; `exitCampaign()` clears all state including `isCampaignActive: false`.
  - `src/components/TopBar.jsx` — selector renames, action renames, button label swaps, banner text "Simulation Active" → "Campaign Active", all `disabled={isRunning}` → `disabled={isCampaignActive}`.
  - `src/components/GraphCanvas.jsx` — rename `isRunning` subscription to `isCampaignActive`; rename wrapper class `simulation-mode` → `campaign-mode`; rename banner text. Keep `onNodeClick` advance logic unchanged — still uses `storeEdges.find` on target.
  - `src/components/nodes/CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx` — the `isReachable` selector reads `s.isRunning` today; rename to `s.isCampaignActive`. No other change.
  - `src/components/edges/ConditionalEdge.jsx` — no `isRunning` reference currently, but audit for any; no visible change.
  - `src/styles/global.css` — rename all `.simulation-mode` selectors (lines 329–336) to `.campaign-mode`.

- **Migration step** — NONE.

- **What it leaves temporarily inconsistent** — Terminology split: the code calls it "campaign" but the underlying three-state node enum (`--active` / `--visited` / `--reachable`) still uses the pre-campaign vocabulary. Phase 2 resolves this by swapping the enum.

- **What the next phase depends on from this phase** — `isCampaignActive` as the gating predicate for all campaign-mode visuals. Phase 2 reads it in every node component. `.campaign-mode` wrapper class is the CSS scope anchor for phase-2 state classes.

- **Reference files needed** — listed in `ran_0303_phases.md`. No external docs beyond `architecture_rules.md` (AR-08 isolation check after rename).

- **Rollback cost if this phase fails** — **LOW.** The rename is mechanical. Reverting is a search-and-replace. No data is touched. No component structure changes. The `reset` semantic split (reset vs exitCampaign) is the only non-mechanical piece — if it causes trouble, collapse both to the pre-existing reset shape and lose only the "restart active campaign" capability until Phase 4.

- **Hard stop triggers for this phase**
  - Any `.simulation-mode` string remains anywhere in the codebase after the rename (grep returns non-zero). Stop, finish rename, retry.
  - Entering campaign mode does not lock handles / edges (pointer-events fail), OR exiting campaign mode leaves handles locked. Stop, diagnose the CSS selector mismatch in `global.css`.
  - `handleStartSimulation`'s error path (no start node exists) fails to surface the existing error message. Stop, restore the try/catch.

- **Acceptance Criteria — Done when:**
  - `useSimulationStore` exports `isCampaignActive`, `enterCampaign`, `exitCampaign`, `advance`, `reset` actions. `isRunning` / `start` / `stop` do not appear anywhere in the repo.
  - `TopBar` shows `Enter Campaign Mode` in edit mode and `Exit Campaign Mode` + `Reset Simulation` when a campaign is active.
  - All authoring controls disable during campaign mode exactly as they do today during simulation.
  - Canvas wrapper applies `.campaign-mode` class when active; no `.simulation-mode` references remain.
  - Nodes still render in today's three-state simulation vocabulary (`--active`/`--visited`/`--reachable`). No visual regression.
  - A full playthrough (enter campaign → click reachable node → advance → reach ending → exit campaign) works identically to today's start-simulation flow.

- **Verification** — Open the app. You should see `Enter Campaign Mode` in the top bar. Create a start node (or load an existing save). Click `Enter Campaign Mode` — the canvas should enter the locked-out mode it does today, but the banner now says "Campaign Active". Click a highlighted reachable node — it should advance as before. Click `Reset Simulation` — playback returns to the start node without leaving campaign mode. Click `Exit Campaign Mode` — canvas returns to editing with handles and drag-connect restored. Confirm all `New` / `Import` / `Export` / `Tidy Layout` / `Snap` buttons are disabled while a campaign is active.
