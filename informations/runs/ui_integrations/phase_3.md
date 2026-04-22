### Phase 3 — Populate right sidebar (Nodes / Route Tracing / Campaign List)

- **Goal:** Build the three new right-sidebar panels per the vision.
- **Changes:**
  - **Nodes panel**: new `src/components/panels/NodesPanel.jsx`. Segmented Common/Choice/Ending filter, search box, list of nodes from `narrativeStore`. Click edit → opens NodeConfigModal (Phase 6 wires this; for now opens existing NodeInspector as a temporary bridge).
  - **RouteTracingPanel**: new `src/components/panels/RouteTracingPanel.jsx`. Port `RouteFinderDialog.jsx` logic (target node, tie-break priorities, path cap, run trace → results) into the panel's two-state UI. Keep the algorithm (`utils/routeTracer.js`) untouched.
  - **CampaignListPanel**: new `src/components/panels/CampaignListPanel.jsx`. Port `CampaignSelector.jsx` list UI here (create, rename, delete). Start button moves to the floating middle bar (Phase 5).
  - Remove Inspector tab from legacy Sidebar.jsx (Inspector behavior still reachable via node double-click → opens legacy NodeInspector until Phase 6). Remove Sandbox tab or relocate to right-sidebar tab if still desired (decide at phase time — flag as RULE CANDIDATE if kept).
- **Produces:** `src/components/panels/NodesPanel.jsx`, `RouteTracingPanel.jsx`, `CampaignListPanel.jsx`, their CSS files, `src/components/Sidebar.jsx` (deleted or stubbed if fully vacated).
- **Leaves inconsistent:** TopBar still holds campaign controls (cleaned in Phase 4). Start button lives in CampaignListPanel temporarily until Phase 5 moves it to floating bar.
- **Next phase depends on:** Campaign list panel is the canonical list UI.
- **Rollback cost:** MEDIUM (three panels created; reverting means restoring legacy Sidebar).
- **Hard stop triggers:** Route trace returns different results after port; campaign activation doesn't start simulation.
- **Acceptance:** Trace finds the same paths as before on the same graph. Creating/deleting campaigns persists through reload.
- **Verification:** Open app → right sidebar → Route Tracing → pick a target → Run Trace → confirm same number of paths and same `steps` count as pre-refactor. Create a campaign from the right panel, reload the page, confirm it persists.