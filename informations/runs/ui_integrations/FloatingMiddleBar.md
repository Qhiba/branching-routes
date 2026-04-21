# FloatingMiddleBar — Integration Phase Plan

## Purpose

A floating pill bar centred over the canvas (`absolute top-6 left-1/2 -translate-x-1/2`). Renders in two distinct modes driven by the `campaignMode` prop.

**Edit mode** — Node-type quick-add icons (Common / Choice / Ending) + campaign dropdown + Start button.

**Campaign mode** — Active campaign name indicator + Undo + Reset + Exit button.

---

## Props Table

| Prop | Type | Default | Description |
|---|---|---|---|
| `campaignMode` | `boolean` | `false` | True when a campaign is running |
| `activeCampaignName` | `string` | `''` | Name of the active campaign (campaign mode only) |
| `campaigns` | `{ id, name }[]` | `[]` | Available campaigns for the edit-mode dropdown |
| `selectedCampaignId` | `string` | `''` | Currently selected campaign in the dropdown |
| `onCampaignSelect` | `(id) => void` | — | Fires when the user picks a different campaign |
| `onStartCampaign` | `() => void` | — | Enters campaign mode with the selected campaign |
| `onExitCampaign` | `() => void` | — | Exits campaign mode |
| `onUndo` | `() => void` | — | Undoes the last node advance |
| `onReset` | `() => void` | — | Resets campaign to start node |
| `onAddCommonNode` | `() => void` | — | Adds a Common node at viewport center |
| `onAddChoiceNode` | `() => void` | — | Adds a Choice node at viewport center |
| `onAddEndingNode` | `() => void` | — | Adds an Ending node at viewport center |

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `campaignMode` | `useSimulationStore(s => s.isCampaignActive)` |
| `activeCampaignName` | `useCampaignStore(s => s.campaigns[s.activeCampaignId]?.name ?? '')` |
| `campaigns` | `useCampaignStore(s => Object.values(s.campaigns))` |
| `selectedCampaignId` | Local `useState` in `CampaignSelector.jsx` (already exists) |
| `onCampaignSelect` | Local `setState` |
| `onStartCampaign` | `campaignStore.setActiveCampaign(id)` then `simulationStore.enterCampaign(payload)` |
| `onExitCampaign` | `simulationStore.exitCampaign()` |
| `onUndo` | `simulationStore.undoLastNode()` |
| `onReset` | `simulationStore.reset()` |
| `onAddCommonNode` | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'common' } }))` |
| `onAddChoiceNode` | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'choice' } }))` |
| `onAddEndingNode` | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'ending' } }))` |

---

## Integration Notes

- **AR-19 compliance**: The three node-add buttons must dispatch DOM events because `FloatingMiddleBar` renders outside the `ReactFlowProvider` subtree. `GraphCanvas` owns the listener.
- **Undo disabled state**: Wrap `onUndo` call site with a guard: `traversalRecords.length === 0` → disable the button. Add a `undoDisabled: boolean` prop or compute it in the consumer.
- The campaign dropdown currently replicates what `CampaignSelector.jsx` does. When integrating, you can either: (a) keep both coexisting (the floating bar for quick-start, the right-sidebar list for management), or (b) retire `CampaignSelector` and route through `FloatingMiddleBar` + `RightSidebar` CampaignList tab.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 123–182. No visual changes.

---

## Files

- `FloatingMiddleBar.jsx` — Component implementation
- `FloatingMiddleBar.md` — This document
