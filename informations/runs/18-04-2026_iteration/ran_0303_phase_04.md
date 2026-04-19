# Phase 4 — Passive structural warnings and sandbox overrides

- **Goal** — Add edit-mode passive warnings on orphaned / unreachable nodes. Add campaign-mode sandbox toggles for flags and status. Finalise CSS and tokens.

- **What it changes** — `simulationStore` gains a derived edit-mode computation (`orphanedNodeIds`, `unreachableNodeIds`) that runs whenever `narrativeStore` topology changes and `isCampaignActive === false`. This computation traces forward from the start node using default flag/status values and flags nodes unreachable from start. Orphaned = not connected to any edge at all. Nodes in either set show a warning badge. Separately, a sandbox UI surface lets the campaign-active player override `currentFlagValues` entries directly without advancing. Sandbox edits are ephemeral — reset on `exitCampaign` or `reset()`.

  **Open decision for Phase 4:** where the sandbox UI lives. Two defensible options:
  1. **Sidebar tab.** New "Sandbox" tab appearing only when `isCampaignActive`. Fits the existing Sidebar tab pattern.
  2. **TopBar drawer.** A collapsible panel under the top bar. Lower change surface to existing components but creates a new UI pattern.

  Default choice if unspecified by user review: option 1 (Sidebar tab). A new `SandboxPanel.jsx` component; `Sidebar.jsx` gets a conditional 5th tab. This is scope-aligned ("Sandbox toggles available" in Part 1) and reuses the existing tab infrastructure.

- **Produces** — Files modified / created:
  - `src/store/simulationStore.js` — add `orphanedNodeIds`, `unreachableNodeIds` as derived arrays, recomputed when entering edit mode or when `narrativeStore` topology changes (via a subscription helper or on-demand selector). Add `sandboxOverrides` field. Add `applySandboxOverride(key, value)` action that writes to `currentFlagValues` (both flags and status values share the same map). `exitCampaign` and `reset` must clear `sandboxOverrides` to nothing — but because the map is just `currentFlagValues`, the behaviour falls out naturally from resetting that field.
  - `src/components/nodes/CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx` — subscribe to `orphanedNodeIds.includes(id)` and `unreachableNodeIds.includes(id)`. Render a small warning badge (e.g., an alert glyph) in the type-bar meta area when either is true. Only visible in edit mode (when `isCampaignActive === false`; naturally true because the sets are empty in campaign mode).
  - `src/components/GraphCanvas.jsx` — if the passive analysis needs a topology-change hook, wire a `useEffect` that calls a recomputation action on `common` / `choice` / `ending` / `edges` changes. The alternative is a reactive selector on `narrativeStore`; prefer the action-based approach to avoid double-subscription cost.
  - `src/components/SandboxPanel.jsx` (**new file**) — renders per-flag toggle and per-status numeric input. Reads from `useSimulationStore` for current values, writes via `applySandboxOverride`. Reads flag / status definitions from `useNarrativeStore` (names, ranges, etc.) — read-only.
  - `src/components/Sidebar.jsx` — add a conditional "Sandbox" tab that appears only when `isCampaignActive === true`. Mount `SandboxPanel` when selected.
  - `src/components/index.js` — barrel export for `SandboxPanel`.
  - `src/styles/global.css` — add `.story-node__warning-badge` style (a small triangular / exclamation glyph in a muted warning colour). Add `.sandbox-panel` layout rules.
  - `src/styles/tokens.css` — add `--color-warning-badge` if not already present.

- **Migration step** — NONE.

- **What it leaves temporarily inconsistent** — Nothing. Phase 4 is the final phase and closes the scope.

- **What the next phase depends on from this phase** — N/A. Closes the iteration.

- **Reference files needed** — listed in `ran_0303_phases.md`. Plus `ran_0303_phase_03.md` for the sandbox state landing on top of Phase 3's `selectedOptionId` reset logic.

- **Rollback cost if this phase fails** — **MEDIUM.** Sandbox is additive and can be reverted by removing `SandboxPanel.jsx`, the Sidebar tab addition, and the `applySandboxOverride` action — three focused reverts. Passive reachability analysis is more involved because it adds a derived-state subscription pattern across three node components; reverting requires removing the badge and the store-side computation but is mechanical. If one of these two pieces succeeds and the other fails, ship the successful piece and revert only the failing piece.

- **Hard stop triggers for this phase**
  - Passive analysis triggers on every store mutation regardless of whether topology changed (e.g., label edits). Stop, scope the subscription trigger to `common` / `choice` / `ending` / `edges` identity changes only.
  - Sandbox edits survive `exitCampaign` (AR-08 violation). Stop immediately — this is the R-03 risk materialising. Audit `exitCampaign` and `reset` for the `currentFlagValues` reset.
  - Passive analysis flags nodes that are actually reachable because the forward-trace doesn't account for `status_set` numeric conditions (e.g., accumulating HP gates a later check). Stop, design decision needed: do we trace default-value-only (simpler, more false positives) or trace with simulated accumulation (more accurate, exponential in branching). Recommendation: ship default-value-only with a documented caveat, then revisit.
  - AR-14 infinite loop on the orphaned/unreachable selectors (they return new arrays on each computation). Stop, memoize the computation so the same topology produces the same array reference.

- **Acceptance Criteria — Done when:**
  - Orphaned nodes (no edges in or out) show a warning badge in edit mode.
  - Unreachable-from-start nodes show a warning badge in edit mode.
  - Fixing the structural issue (adding an edge from a reachable node) makes the badge disappear on the next topology update.
  - Warning badges do not appear during campaign mode (the sets are empty then).
  - A Sandbox tab appears in the Sidebar only when `isCampaignActive === true`.
  - Toggling a flag value in the Sandbox updates reachable edge evaluation immediately (the canvas re-reflects new `condition-pass` / `condition-fail` states).
  - Exiting campaign clears all sandbox overrides — re-entering campaign starts fresh from default flag/status values.
  - Export before campaign / export after campaign with sandbox edits → byte-identical JSON payloads.
  - AR-14 holds: cold-load the app, enter/exit campaign three times, sandbox-edit flags five times, exit — no render-loop crashes.

- **Verification** — Open the app. Create a common node disconnected from any edge — a warning badge should appear on it. Connect it with an edge from the start node — the badge disappears. Create an unreachable island (a cluster of connected nodes with no path to the start node) — the island nodes show the badge, the start node does not. Enter campaign mode — all warning badges disappear. A "Sandbox" tab appears in the Sidebar. Open it, toggle a flag from false to true — the canvas should immediately re-render: any edge whose condition depended on that flag now shows `condition-pass` instead of `condition-fail`. Advance a few nodes. Exit campaign mode — the Sandbox tab disappears, all simulation visuals clear. Re-enter campaign — flag values return to their authored defaults (sandbox overrides did not persist). Export the project to disk, open the JSON file, confirm `flag[id].state` values equal their authored defaults (the sandbox edits did not leak).
