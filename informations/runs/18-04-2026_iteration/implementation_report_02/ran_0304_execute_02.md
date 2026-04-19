# Implementation Report - Phase 2

## Checklist
- [x] All specific files modified as planned?
- [x] `CHANGED` / `PRESERVED` / `ADDED` / `MIGRATION` comments applied?
- [x] No dependencies added?
- [x] No unrelated formatting changes?

## Details of Execution
- **`src/styles/tokens.css`**
  - Appended 5 new colour variables (`--color-node-locked`, `--color-node-complete`, `--color-node-failed`, `--color-node-branch-locked`, `--color-node-seen`) mapped to dark mode theme.
- **`src/styles/global.css`**
  - Formatted and implemented new `story-node--[state]` modifier rules to replace legacy visited/reachable states, and added `story-node--seen` overlay pseudo-element.
  - Refactored edge simulation class to `conditional-edge--condition-pass`.
- **`src/store/simulationStore.js`**
  - Authored `computeNodeStates` factory to calculate `active`, `complete`, `failed`, and `locked` enum values based on the active node and reachability evaluations.
  - Added `seenNodeIds` array pattern for accumulation and added resetting behavior inside `enterCampaign` / `advance` / `exitCampaign`.
  - Added `getNodeState` utility selector alongside reactive definitions.
- **`src/components/nodes/CommonNode.jsx`**, **`src/components/nodes/ChoiceNode.jsx`**, **`src/components/nodes/EndingNode.jsx`**
  - Extracted 3 boolean selectors in favor of single `nodeState` and `isSeen` store lookups mapped from `nodeStates` and `seenNodeIds`.
  - Interpolated `nodeState` string cleanly onto CSS wrapper classes (e.g. `story-node--active`, `story-node--seen`).
- **`src/components/edges/ConditionalEdge.jsx`**
  - Updated mapping to look for `s.isCampaignActive` guard internally and migrated class applications to use `isConditionPass` logic natively.
