# Phase 4 — Execute Report: Zustand Stores (UI + Simulation + Campaign)

> **Prompt:** `0004_execute.md`
> **Date:** 2026-04-06
> **Phase:** 4 — Zustand Stores (UI + Simulation + Campaign)

---

## Summary

Implemented three Zustand stores completing the state management layer. All stores use `subscribeWithSelector` middleware for granular subscriptions, matching the established pattern from `useNarrativeStore.js`.

---

## Files Produced

| # | File | Path | Status |
|---|------|------|--------|
| 1 | `useUIStore.js` | `src/store/useUIStore.js` | **Created** |
| 2 | `useSimulationStore.js` | `src/store/useSimulationStore.js` | **Created** |
| 3 | `useCampaignStore.js` | `src/store/useCampaignStore.js` | **Created** |

---

## Implementation Details

### 1. `useUIStore.js`

**State fields:**
- `selectedNodeId` — currently selected node or `null`
- `inspectorOpen` — boolean, inspector panel visibility
- `inspectorPinned` — boolean, keeps inspector open on deselect
- `contextMenu` — `{ visible, x, y, targetId, targetType }` or `null`
- `commandPaletteOpen` — boolean
- `toasts` — array of `{ id, message, type, duration }`
- `persistError` — string error message or `null` (AR-08)

**Actions:**
| Action | Behavior |
|--------|----------|
| `selectNode(nodeId)` | Sets `selectedNodeId`; auto-closes inspector on deselect if not pinned |
| `openInspector()` | Sets `inspectorOpen = true` |
| `closeInspector()` | Sets `inspectorOpen = false` |
| `pinInspector(pinned?)` | Toggles or sets `inspectorPinned` |
| `showContextMenu({ x, y, targetId?, targetType? })` | Opens context menu at position |
| `hideContextMenu()` | Sets `contextMenu = null` |
| `toggleCommandPalette(open?)` | Toggles or sets `commandPaletteOpen` |
| `addToast(message, type?, duration?)` | Adds toast, schedules auto-removal (default 5000ms) |
| `removeToast(id)` | Removes toast by ID |
| `showPersistError(errorMessage?)` | Sets persistent error string (AR-08) |
| `clearPersistError()` | Clears `persistError` to `null` |

**Design decisions:**
- Toast IDs use a module-scoped counter (fine for single-page app with no SSR)
- `persistError` is a string (not boolean) so it can carry a meaningful error message for the banner
- `selectNode(null)` auto-closes unpinned inspector to match expected UX flow

### 2. `useSimulationStore.js`

**State fields:**
- `nodeStates` — `{ [nodeId]: { status, seen } }` (lazy-initialized per node)
- `flagOverrides` — `{ [flagId]: boolean }`
- `statusOverrides` — `{ [statusId]: number }`
- `evaluatedEdges` — `{ [edgeKey]: boolean }` (set by engine)
- `unreachableNodes` — `Set<string>` (set by engine)

**Actions:**
| Action | Behavior |
|--------|----------|
| `setNodeStatus(nodeId, status)` | Sets status directly |
| `cycleNodeStatus(nodeId)` | Cycles: `default → active → locked → complete → failed → branch_locked → default` |
| `setNodeSeen(nodeId, seen)` | Sets seen state directly |
| `cycleNodeSeen(nodeId)` | Cycles: `unseen → partially_seen → seen → unseen` |
| `setFlagOverride(flagId, value)` | Sets boolean flag override |
| `clearFlagOverride(flagId)` | Removes flag override |
| `setStatusOverride(statusId, value)` | Sets numeric status override |
| `clearStatusOverride(statusId)` | Removes status override |
| `setEvaluatedEdges(edges)` | Replaces evaluated edges (engine use) |
| `setUnreachableNodes(nodes)` | Replaces unreachable set (engine use) |
| `resetSimulation()` | Clears all state to defaults |

**Design decisions:**
- `STATUS_CYCLE` and `SEEN_CYCLE` are exported for testing and reference
- Node states are lazy-initialized: accessing a node that doesn't have state returns `defaultNodeState()` internally
- `clear*Override` actions are included beyond the spec for symmetry (removing an override means "revert to data model default")

### 3. `useCampaignStore.js`

**State fields:**
- `campaigns` — `{ [campaignId]: CampaignData }`
- `activeCampaignId` — string or `null`

**CampaignData shape:**
```js
{ id, name, createdAt, updatedAt, nodeStates, flagOverrides, statusOverrides }
```

**Actions:**
| Action | Behavior |
|--------|----------|
| `getActiveCampaign()` | Returns active campaign data or `null` |
| `createCampaign(name, options?)` | Creates campaign, optionally switches to it (default: yes) |
| `loadCampaigns(data, activeId?)` | Replaces all campaigns from persistence |
| `saveCampaign(simulationState)` | Saves simulation state into active campaign |
| `deleteCampaign(campaignId)` | Deletes campaign; clears `activeCampaignId` if it was active |
| `switchCampaign(campaignId)` | Switches active campaign, returns data |
| `resetActiveCampaign()` | Clears active campaign's node/flag/status state without deleting |
| `renameCampaign(campaignId, newName)` | Renames with sanitization |

**Design decisions:**
- Campaign names are sanitized via `sanitizeName()` – consistent with entity naming (AR-07 pattern)
- Campaign IDs use `generateId('campaign')` – follows AR-06 for unique random IDs
- `loadCampaigns` validates that `activeId` exists in the provided data before setting it
- Campaign state is completely isolated from narrative data (AR-10 compliance)

---

## Acceptance Criteria Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| `useUIStore` actions correctly toggle inspector, manage toasts (add/auto-remove), and track selected node | ✅ | Auto-dismiss via `setTimeout`, auto-close inspector on deselect when unpinned |
| `cycleNodeStatus()` cycles through all 6 states | ✅ | `default → active → locked → complete → failed → branch_locked → default` |
| `cycleNodeSeen()` cycles through 3 states | ✅ | `unseen → partially_seen → seen → unseen` |
| `useCampaignStore` CRUD + switch + reset; campaign isolated from narrative | ✅ | No narrative store dependency for state shape |
| `showPersistError()` / `clearPersistError()` (AR-08) | ✅ | Sets/clears a persistent string flag |

---

## Architecture Rules Compliance

| Rule | Compliance | Notes |
|------|-----------|-------|
| AR-01 | ✅ | All files named `camelCase.js` in `src/store/` |
| AR-02 | ✅ | All shared state in Zustand stores |
| AR-07 | ✅ | Campaign names sanitized via `sanitizeName()` |
| AR-08 | ✅ | `showPersistError` / `clearPersistError` implemented |

---

## Build Verification

```
vite v8.0.3 building client environment for production...
✓ 1721 modules transformed.
✓ built in 435ms — no errors
```
