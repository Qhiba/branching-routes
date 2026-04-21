# GlobalStatusStrip — Integration Phase Plan

## Purpose

The fixed 28px bottom bar showing entity counts and (during campaign mode) live traversal statistics.

**Edit mode** — Static counters: node type counts (Common / Choice / Ending) and metadata entity counts (Flags / Statuses / Paths / Chapters).

**Campaign mode** — Additionally shows: `Nodes: visited/total`, `Endings: reached/total`, `Edges: traversed/total`, `Dead-ends: count`, and an `Overlay: ON/OFF` toggle button.

This component is **purely presentational** — it holds zero local state.

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `counts` | `object` | See below |
| `counts.common` | `number` | Common node count |
| `counts.choice` | `number` | Choice node count |
| `counts.ending` | `number` | Ending node count |
| `counts.flags` | `number` | Flag entity count |
| `counts.statuses` | `number` | Status entity count |
| `counts.paths` | `number` | Path entity count |
| `counts.chapters` | `number` | Chapter entity count |
| `campaignMode` | `boolean` | True when campaign is active |
| `campaignStats` | `object \| null` | Only needed when `campaignMode === true` |
| `campaignStats.visitedNodes` | `number` | — |
| `campaignStats.totalNodes` | `number` | — |
| `campaignStats.endingsReached` | `number` | — |
| `campaignStats.totalEndings` | `number` | — |
| `campaignStats.edgesTraversed` | `number` | — |
| `campaignStats.totalEdges` | `number` | — |
| `campaignStats.deadEnds` | `number` | — |
| `overlayOn` | `boolean` | Whether traversal overlay is active |
| `onToggleOverlay` | `() => void` | Toggles traversal overlay |

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `counts.common` | `Object.keys(useNarrativeStore(s => s.common)).length` |
| `counts.choice` | `Object.keys(useNarrativeStore(s => s.choice)).length` |
| `counts.ending` | `Object.keys(useNarrativeStore(s => s.ending)).length` |
| `counts.flags` | `Object.keys(useNarrativeStore(s => s.flag)).length` |
| `counts.statuses` | `Object.keys(useNarrativeStore(s => s.status)).length` |
| `counts.paths` | `Object.keys(useNarrativeStore(s => s.path)).length` |
| `counts.chapters` | `Object.keys(useNarrativeStore(s => s.chapter)).length` |
| `campaignMode` | `useSimulationStore(s => s.isCampaignActive)` |
| `campaignStats.visitedNodes` | `useSimulationStore(s => s.seenNodeIds.length)` — use primitive selector (AR-14) |
| `campaignStats.totalNodes` | `Object.keys(s.common).length + Object.keys(s.choice).length + Object.keys(s.ending).length` |
| `campaignStats.endingsReached` | Count endings in `seenNodeIds` that are in `ending{}` |
| `campaignStats.totalEndings` | `Object.keys(useNarrativeStore(s => s.ending)).length` |
| `campaignStats.edgesTraversed` | `useSimulationStore(s => s.traversedEdgeIds.size)` — use `.size` primitive (AR-14) |
| `campaignStats.totalEdges` | `useNarrativeStore(s => s.edges.length)` |
| `campaignStats.deadEnds` | Dead-end count from `detectDeadEnds` utility |
| `overlayOn` | `useUIStore(s => s.showTraversalOverlay)` |
| `onToggleOverlay` | `uiStore.toggleTraversalOverlay()` |

---

## Relationship to Existing Component

The existing **`StatusStrip.jsx`** shows only campaign-mode metrics (visited/total/edges). `GlobalStatusStrip` extends that with the always-visible entity count strip on the left.

**Migration strategy:**
1. Replace `<StatusStrip />` in `App.jsx` with `<GlobalStatusStrip />`.
2. Supply `counts` from `useNarrativeStore` selectors via per-slice selectors (AR-23).
3. Supply `campaignStats` only when `isCampaignActive` to match existing `StatusStrip` visibility behaviour.

> [!NOTE]
> Use per-slice primitive selectors for all count values (AR-14 + AR-23). Avoid passing whole sub-collection objects — derive counts via `Object.keys(...).length` in the consuming wrapper.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 808–835. No visual changes.

---

## Files

- `GlobalStatusStrip.jsx` — Component implementation
- `GlobalStatusStrip.md` — This document
