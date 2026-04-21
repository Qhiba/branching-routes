# Data Model Impact — Route_Tracing

---

## Does this feature add new fields to any entity?

### Exported JSON (narrativeStore / schemaVersion: 4)

**NOT APPLICABLE.** The exported JSON format is not modified. All new state is ephemeral `simulationStore` runtime state that is explicitly excluded from `exportGraph()` per AR-08. `schemaVersion` remains `4`. `campaignStore` snapshot shape is unchanged.

---

### simulationStore — runtime state additions (never persisted)

These fields are added to the Zustand store's in-memory state only. They are reset to initial values by `exitCampaign()`, `reset()`, and `enterCampaign()`.

| Field | Type | Initial value | Added in phase | Purpose |
|-------|------|---------------|----------------|---------|
| `traversalRecords` | `TraversalRecord[]` | `[]` | Phase 1 | Rich per-step traversal data enabling Undo and analysis |
| `preAdvanceFlagSnapshot` | `Record<string, boolean\|number> \| null` | `null` | Phase 1 | Set by `selectOption()` before option effects fire; consumed by `advance()` to record the pre-destination-entry state; cleared to null after each traversal record is written |
| `unreachableFromActiveNodeIds` | `string[]` | `[]` | Phase 3 | IDs of nodes with no forward graph path from the current active node; recomputed on each `advance()` via `routeTracer.computeForwardReachable()`; drives `--coverage-gap` dimming |
| `shortestRouteResults` | `RouteResult[] \| null` | `null` | Phase 4 | Computed k-path result set from `routeTracer.computeShortestPaths()`; null until computed; set to stale flag on Undo or narrative change |
| `shortestRouteTargetNodeId` | `string \| null` | `null` | Phase 4 | The node ID the author selected as the route target |
| `isShortestRouteStale` | `boolean` | `false` | Phase 4 | True when results exist but were computed before a subsequent Undo or narrative topology change |

#### TraversalRecord shape

```
{
  sequence:       number,                       // 0-based index; used for ordering
  edgeId:         string,                       // full edge ID (AR-15 — includes optionId provenance)
  optionId:       string | null,                // the optionId of the edge if present, else null
  fromNodeId:     string,                       // active node ID before the advance
  toNodeId:       string,                       // destination node ID after the advance
  flagSnapshot:   Record<string, boolean|number> // currentFlagValues captured BEFORE destination node effects fire (post-option effects if selectOption was called)
}
```

> **Note on snapshot semantics:** `flagSnapshot` is captured at the start of `advance()`, after `selectOption()` has already applied option side effects but before the destination node's `flags_set`/`status_set` fire. This matches the scope definition of "pre-entry snapshot." A combined `currentFlagValues` map (booleans and numerics together) is used — separation into `flagOverrides`/`statusOverrides` is only needed for campaign snapshot persistence, which these records do not participate in.

#### RouteResult shape

```
{
  pathEdgeIds:  string[],   // ordered edge IDs from start to target
  length:       number,     // number of edges in path
  priorityRank: number      // lower = higher priority among equal-length paths; 0 if no ties
}
```

---

### simulationStore — new action signatures (AR-20 declaration)

| Action | Signature | Notes |
|--------|-----------|-------|
| `undoLastNode()` | `() => void` | No-op if `traversalRecords.length === 0`; pops last record; restores `activeNodeId`, `currentFlagValues`, `seenNodeIds`, `traversedEdgeIds`; recomputes `reachableEdgeIds`, `reachableNodeIds`, `nodeStates`; marks `isShortestRouteStale = true` if results exist |
| `computeRoutes(targetNodeId, priorities, limit)` | `(string, Array<{id: string, preferredValue: boolean\|number}>, number) => void` | Calls `routeTracer.computeShortestPaths()`; writes results to `shortestRouteResults`; sets `shortestRouteTargetNodeId`; clears stale flag; requires `isCampaignActive` |
| `clearRouteResults()` | `() => void` | Resets `shortestRouteResults`, `shortestRouteTargetNodeId`, `isShortestRouteStale` to initial values |
| `setShortestRouteStale()` | `() => void` | Sets `isShortestRouteStale = true` without clearing results; called on narrative topology change while results are displayed |

---

### uiStore — new fields and actions (AR-20 declaration)

| Field | Type | Initial value | Phase |
|-------|------|---------------|-------|
| `showTraversalOverlay` | `boolean` | `true` | Phase 1 |
| `showRouteFinderDialog` | `boolean` | `false` | Phase 1 |
| `showShortestRouteOverlay` | `boolean` | `false` | Phase 1 |
| `selectedRouteIndex` | `number` | `0` | Phase 4 |

| Action | Signature | Notes |
|--------|-----------|-------|
| `toggleTraversalOverlay()` | `() => void` | Flips `showTraversalOverlay` |
| `toggleRouteFinderDialog()` | `() => void` | Flips `showRouteFinderDialog` |
| `toggleShortestRouteOverlay()` | `() => void` | Flips `showShortestRouteOverlay` |
| `setSelectedRouteIndex(n)` | `(number) => void` | Sets `selectedRouteIndex` |

---

## Is every addition strictly additive?

**Yes.** All additions are:
- New fields on existing Zustand stores (backward compatible — existing code that doesn't read the new fields is unaffected)
- New actions on existing stores (existing callers are unaffected)
- New components mounted in App.jsx (additive, no existing components removed)
- New CSS classes in `global.css` (additive, no existing rules modified)
- New CSS tokens in `tokens.css` (additive)
- New utility file `routeTracer.js` (new file, no existing file modified)

The only modifications to existing action bodies are inside `advance()`, `selectOption()`, `exitCampaign()`, and `reset()` — all of which preserve their existing signatures and behaviour while adding new bookkeeping.

---

## Does the export/import round-trip survive this change?

**Yes.** `narrativeStore.exportGraph()` output is unchanged. No new fields are added to the exported JSON. The `campaignStore` snapshot shape is unchanged. Import validation and the migration chain are unaffected. `schemaVersion: 4` is unchanged.

---

## Which entity IDs or prefixes does this touch?

No new entity ID prefixes are introduced. `routeTracer.js` works with existing node and edge IDs already in the graph. Traversal records store existing `edgeId`, `fromNodeId`, `toNodeId` values — no new entities are created.
