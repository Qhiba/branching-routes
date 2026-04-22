### Phase 5 — Floating middle bar

- **Goal:** Add the vision's floating middle bar (node-type quick-create + campaign start) and its campaign-active variant (Undo / Reset / Exit pill).
- **Changes:**
  - New `src/components/floating/FloatingMiddleBar.jsx`. Reads `simulationStore.isCampaignActive` and switches between the two modes.
  - Default mode: three node-type buttons (Common/Choice/Ending) that call the same `addNode` action as CreationBar/context menu. Campaign dropdown (from `campaignStore`) + Start button → `simulationStore.startCampaign`.
  - Campaign-active mode: active-campaign pill with Undo (`undoLastNode`), Reset (`reset`), Exit (`exitCampaign`).
  - Retire CreationBar if now redundant (decide at phase time; if kept, document why).
- **Produces:** `src/components/floating/FloatingMiddleBar.jsx` + CSS. Possibly removes `src/components/CreationBar.jsx`.
- **Leaves inconsistent:** Node editing still goes through legacy NodeInspector (fixed Phase 6).
- **Next phase depends on:** Independent — nothing blocks on this.
- **Rollback cost:** LOW.
- **Hard stop triggers:** Floating bar intercepts canvas pointer events (must use `pointer-events` CSS carefully).
- **Acceptance:** Quick-create from the bar produces the same node shape in the store as context-menu creation.
- **Verification:** Open app → click Common button in floating bar → new Common node appears on canvas. Start a campaign from the bar → active pill appears with Undo/Reset/Exit working.