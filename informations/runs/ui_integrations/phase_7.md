### Phase 7 — Campaign-mode visual polish

- **Goal:** Dimmed/grayscale sidebars during campaign mode, top blue "Campaign Active" banner, StatusStrip live counters.
- **Changes:** `src/components/layout/LeftSidebar.jsx`, `RightSidebar.jsx` (add `campaign-mode` class toggling). New `src/components/CampaignBanner.jsx`. `src/components/StatusStrip.jsx` (add node/ending/edge/dead-end counters wired to `simulationStore`).
- **Produces:** The above files + CSS.
- **Leaves inconsistent:** None.
- **Next phase depends on:** End of plan.
- **Rollback cost:** LOW.
- **Hard stop triggers:** Counters go stale (selector not subscribed correctly).
- **Acceptance:** Counters update in real-time as nodes are visited during a campaign.
- **Verification:** Start a campaign → sidebars dim → banner appears → traverse nodes → counters in status strip increment.