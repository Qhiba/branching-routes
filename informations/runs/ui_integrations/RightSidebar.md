# RightSidebar — Integration Phase Plan

## Purpose

The right-side panel with three nameplate tabs:

- **Nodes** — Filterable tabbed list (Common / Choice / Ending) with edit/delete per node
- **Route Tracing** — Configuration form + async run + results display (async loading state kept local per AR-03)
- **Campaign List** — Full campaign CRUD (create, rename, delete)

**Internal sub-components (kept inside `RightSidebar.jsx`):**
- `NameplateTab` — individual right-gutter vertical tab button
- `NodesPanel` — node type tabs, search, and node rows
- `RouteTracingPanel` — config form ↔ results view
- `CampaignListPanel` — campaign list with add/edit/delete

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `activePanel` | `string \| null` | `'Nodes'` \| `'RouteTracing'` \| `'CampaignList'` \| `null` |
| `onPanelChange` | `(id \| null) => void` | Tab toggle handler |
| `campaignMode` | `boolean` | Dims sidebar when true |
| **Nodes tab** | | |
| `nodes` | `{ id, name, type }[]` | Flat node list from all sub-collections |
| `activeNodeTab` | `string` | `'Common'` \| `'Choice'` \| `'Ending'` |
| `onNodeTabChange` | `(tab) => void` | Switches the node type filter |
| `onEditNode` | `(nodeId) => void` | Opens `NodeConfigModal` for this node |
| `onDeleteNode` | `(nodeId) => void` | Deletes node with referential guard |
| **RouteTracing tab** | | |
| `routeResults` | `{ id, steps, name }[] \| null` | Computed route results or null |
| `onRunTrace` | `async () => void` | Triggers computation; resolves when done |
| `onClearTrace` | `() => void` | Clears results back to config view |
| **CampaignList tab** | | |
| `campaigns` | `{ id, name }[]` | All campaign entries |
| `onAddCampaign` | `(name: string) => void` | Creates a new campaign |
| `onDeleteCampaign` | `(id) => void` | Deletes a campaign |
| `onEditCampaignName` | `(id) => void` | Opens rename flow for campaign |

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `campaignMode` | `useSimulationStore(s => s.isCampaignActive)` |
| `nodes` | Derived: `[...Object.values(s.common), ...Object.values(s.choice), ...Object.values(s.ending)].map(n => ({ id: n.id, name: n.data.label, type: n.type }))` |
| `activeNodeTab` | Local `useState` |
| `onEditNode(id)` | `uiStore.selectNode(id)` + `setNodeConfigType(node.type)` |
| `onDeleteNode(id)` | `narrativeStore.deleteNode(id)` (cascades via store) |
| `routeResults` | `useSimulationStore(s => s.shortestRouteResults)` |
| `onRunTrace` | `simulationStore.computeRoutes(targetNodeId, priorities, pathCap)` OR `simulationStore.setShortestRouteResults(paths)` (unguarded, edit mode) — per AR-24 |
| `onClearTrace` | `simulationStore.clearRouteResults()` |
| `campaigns` | `useCampaignStore(s => Object.values(s.campaigns))` |
| `onAddCampaign` | `campaignStore.addCampaign(name)` |
| `onDeleteCampaign` | `campaignStore.deleteCampaign(id)` |
| `onEditCampaignName` | Open rename modal → `campaignStore.updateCampaign(id, { name })` |

---

## AR-24 Note — Route Tracing Writers

The route tracing panel calls `onRunTrace` which must point to the correct writer:

- **Campaign mode**: `simulationStore.computeRoutes()` (campaign-guarded)
- **Edit mode**: `simulationStore.setShortestRouteResults(paths)` (unguarded)

The consumer (parent) is responsible for choosing the correct writer based on `isCampaignActive`.

---

## Relationship to Existing Components

- **`Sidebar.jsx`** (existing right panel) shows the node Inspector, FlagManager, StatusManager, PathChapterManager tabs. This `RightSidebar` is a **separate** panel that adds the Nodes list and route tooling.
- If replacing `Sidebar.jsx` entirely, migrate the Inspector / Flag / Status / Paths tab content here as additional panels.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 562–804. No visual changes.

---

## Files

- `RightSidebar.jsx` — Component implementation
- `RightSidebar.md` — This document
