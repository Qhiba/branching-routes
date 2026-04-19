# 3. Phase Breakdown — Overview

Four phases. Each is independently stoppable and testable. A broken later phase does not break an earlier phase.

---

## Phase 1 — Campaign-mode boundary rename
- **Goal:** Replace the `isRunning` / start / stop lifecycle with `isCampaignActive` / enter / exit / reset, without changing any visual behaviour.
- **Reference files needed:**
  - `src/store/simulationStore.js`
  - `src/components/TopBar.jsx`
  - `src/components/GraphCanvas.jsx`
  - `src/components/nodes/CommonNode.jsx`
  - `src/components/nodes/ChoiceNode.jsx`
  - `src/components/nodes/EndingNode.jsx`
  - `src/components/edges/ConditionalEdge.jsx`
  - `src/styles/global.css`
  - `informations/docs/architecture_rules.md` (AR-08 invariant check)

## Phase 2 — Six-state node enum + seen tracking + campaign-gated visuals
- **Goal:** Introduce the six-state node enum and seen tracking. Render campaign visuals only when `isCampaignActive`; editing canvas stays visually clean.
- **Reference files needed:**
  - `src/store/simulationStore.js`
  - `src/components/nodes/CommonNode.jsx`
  - `src/components/nodes/ChoiceNode.jsx`
  - `src/components/nodes/EndingNode.jsx`
  - `src/components/edges/ConditionalEdge.jsx`
  - `src/styles/global.css`
  - `src/styles/tokens.css`
  - `informations/docs/architecture_rules.md` (AR-14 selector stability)
  - `ran_0303_phase_01.md` (dependency on Phase 1 boundary)

## Phase 3 — Choice option interaction and selected-option routing
- **Goal:** Make choice options clickable during campaign; route reachable edges outward from the selected option only; dim unselected options and their edges.
- **Reference files needed:**
  - `src/store/simulationStore.js`
  - `src/components/nodes/ChoiceNode.jsx`
  - `src/components/edges/ConditionalEdge.jsx`
  - `src/components/GraphCanvas.jsx`
  - `src/styles/global.css`
  - `ran_0303_phase_02.md` (depends on six-state enum + seen)
  - `informations/docs/architecture_rules.md` (AR-07, AR-11, AR-15)

## Phase 4 — Passive structural warnings and sandbox overrides
- **Goal:** Add passive reachability warnings in edit mode; add sandbox flag/status toggles in campaign mode; finalise CSS and any missing token additions.
- **Reference files needed:**
  - `src/store/simulationStore.js`
  - `src/components/GraphCanvas.jsx`
  - `src/components/nodes/CommonNode.jsx`
  - `src/components/nodes/ChoiceNode.jsx`
  - `src/components/nodes/EndingNode.jsx`
  - `src/components/Sidebar.jsx` (if sandbox surface lands as a tab)
  - `src/components/TopBar.jsx` (if sandbox surface lands as a drawer)
  - `src/styles/global.css`
  - `src/styles/tokens.css`
  - `ran_0303_phase_03.md` (depends on selected-option routing)
  - `informations/docs/architecture_rules.md` (AR-08 sandbox invariant)
