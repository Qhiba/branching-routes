# Implementation Report 01 - Phase 1

## Files Modified:
- `src/store/simulationStore.js`: Renamed `isRunning` to `isCampaignActive`, renamed `start` to `enterCampaign`, implemented `exitCampaign` to properly clear the campaign state, and modified `reset` to retain `isCampaignActive` status and replay initial simulation values.
- `src/components/TopBar.jsx`: Updated store selectors from `isRunning`/`start` to `isCampaignActive`/`enterCampaign`, added an `exitCampaign` selector, modified button labels and handlers for entering/exiting/resetting the campaign, and updated the UI indicator.
- `src/components/GraphCanvas.jsx`: Renamed selector from `isRunning` to `isCampaignActive`, updated the CSS wrapper class logic to conditionally apply `campaign-mode`, and changed the active banner notification string.
- `src/components/nodes/ChoiceNode.jsx`: Substituted the `isRunning` selector with `isCampaignActive` for computing node reachability.
- `src/components/nodes/EndingNode.jsx`: Substituted the `isRunning` selector with `isCampaignActive` for computing node reachability.
- `src/components/nodes/CommonNode.jsx`: Substituted the `isRunning` selector with `isCampaignActive` for computing node reachability.
- `src/styles/global.css`: Renamed all instances of `.simulation-mode` to `.campaign-mode` to reflect the new lifecycle terminology without visual changes.

## Flags Raised:
- None
