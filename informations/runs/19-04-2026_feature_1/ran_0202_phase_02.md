# Campaign_Sheets — Phase 2: Simulation Integration

---

**Phase 2 — Simulation Integration: `simulationStore` wiring**

---

### Goal
Connect `campaignStore` to the simulation lifecycle so that selecting a campaign hydrates `simulationStore` from the saved snapshot on `enterCampaign`, and exiting a campaign snapshots the current state back to `campaignStore` before tearing down.

---

### What it adds

- **`src/store/simulationStore.js`** — two targeted modifications:

  **`enterCampaign(campaignPayload?)`:**
  - Signature changes from `enterCampaign: () => {...}` to `enterCampaign: (campaignPayload) => {...}`.
  - When `campaignPayload` is provided (truthy): construct `initialFlags` from `campaignPayload.snapshot.flagOverrides` and `statusOverrides`, but filter against currently-existing IDs in `useNarrativeStore.getState().flag` and `.status` — drop any key not present in the narrative (RISK-CSH-02 mitigation).
  - When `campaignPayload` is absent (undefined/null): existing seed-from-defaults logic runs unchanged (zero-argument call preserves backward compatibility for `reset()`).
  - All other `enterCampaign` logic (start node lookup, `computeReachable`, `computeNodeStates`, `set(...)`) is unchanged.

  **`exitCampaign()`:**
  - Before the existing `set({...clear...})` call, read `get().activeCampaignId` (note: this field does NOT exist on `simulationStore` — instead, read from `useCampaignStore.getState().activeCampaignId`).
  - If `activeCampaignId` is non-null and the campaign exists in `useCampaignStore.getState().campaigns`:
    - Build snapshot: `{ activeNodeId: state.activeNodeId, seenNodeIds: [...state.seenNodeIds], traversedEdgeIds: [...state.traversedEdgeIds], flagOverrides: { ...state.currentFlagValues } }` (note: `sandboxOverrides` are explicitly excluded from the snapshot).
    - Call `useCampaignStore.getState().updateCampaign(activeCampaignId, { snapshot })`.
  - Then call the existing `set({...clear...})` as today.
  - The `.getState()` access pattern prevents circular import (AR-06). `campaignStore` must not be imported at the top of `simulationStore.js` — the import inside the action body at call time is the correct pattern.

  **`reset()`:**
  - `reset()` calls the existing `enterCampaign()` logic inline (it shares the same seeding code). After this phase, `reset()` must NOT pass a campaign payload — it is a hard restart from `narrativeStore` defaults regardless of the active campaign. This is intentional: Reset Simulation is a "wipe and restart" action, not a "reload saved state" action.

---

### Produces

| File | Status |
|------|--------|
| `src/store/simulationStore.js` | MODIFY |

---

### What it leaves temporarily incomplete

- The UI has no way to invoke `enterCampaign(payload)` yet — that waits for `CampaignSelector` in Phase 3.
- `exitCampaign()` now snapshots back to `campaignStore`, but since `activeCampaignId` is always `null` at this stage (no UI to set it), the snapshot branch never fires in practice. Phase 3 completes the circuit.
- `clearCampaignIndexedDB()` is not yet called from `handleNew` (Phase 3).

---

### What the next phase depends on from this phase

- Phase 3 (`CampaignSelector`) calls `simulationStore.enterCampaign(campaign.snapshot)` and expects it to hydrate correctly. The hydration signature must be finalized here.
- Phase 3 expects `exitCampaign()` to auto-save the campaign snapshot before teardown — this behavior must be in place before Phase 3 ships.

---

### Reference files needed

- `ran_0202_phase_01.md` — confirms `campaignStore.updateCampaign` signature
- `ran_0202_risks.md` — RISK-CSH-02 (dangling IDs), RISK-CSH-04 (circular import)
- `src/store/simulationStore.js` — current `enterCampaign` and `exitCampaign` implementations
- `src/store/campaignStore.js` — `updateCampaign` action, `Campaign.snapshot` shape
- `src/utils/conditionEvaluator.js` — read-only reference to confirm `currentFlagValues` key contract

---

### Rollback cost if this phase fails: **LOW**

Both modifications are contained inside existing function bodies in `simulationStore.js`. Rollback means reverting to the zero-argument `enterCampaign()` and the teardown-only `exitCampaign()`. No new file is created. No store shape changes occur — `simulationStore` state fields are unchanged. The only behavioral change is in the two action implementations.

---

### Hard stop triggers for this phase

- Browser console shows `Cannot access 'useCampaignStore' before initialization` on boot — circular import violation (RISK-CSH-04). STOP, resolve import pattern.
- After `enterCampaign(payload)`, `currentFlagValues` contains keys not present in `narrativeStore.flag` or `.status` — dangling ID filter is not working (RISK-CSH-02). STOP, fix filter.
- After `exitCampaign()`, `narrativeStore.flag` or `.status` values differ from their pre-exit state — AR-08 isolation violated. STOP, audit write path.
- `reset()` passes the campaign payload to `enterCampaign` — incorrect behavior. STOP, `reset()` must always call with no argument.

---

### Acceptance Criteria

Done when:
1. `enterCampaign({ snapshot: { flagOverrides: { 'f-123': true }, statusOverrides: { 's-456': 5 } } })` correctly seeds `currentFlagValues['f-123'] = true` and `currentFlagValues['s-456'] = 5` after the call — assuming these IDs exist in `narrativeStore`.
2. A flag ID present in `snapshot.flagOverrides` but absent from `narrativeStore.flag` is silently dropped from `currentFlagValues` after `enterCampaign`.
3. After calling `enterCampaign(payload)` and `advance()` three times, then `exitCampaign()`, the `campaignStore` campaign snapshot reflects the post-advance `activeNodeId` and `seenNodeIds`.
4. `narrativeStore.flag` and `narrativeStore.status` are byte-for-byte unchanged after `enterCampaign` + `advance` + `exitCampaign` (AR-08 audit).
5. No runtime error in `exitCampaign()` when `activeCampaignId` is `null` (normal case for Phase 2 — UI not yet wired).

---

### Verification

Open the app. Open browser console. Manually invoke:
```
sim = (await import('/src/store/simulationStore.js')).useSimulationStore;
camp = (await import('/src/store/campaignStore.js')).useCampaignStore;
camp.getState().addCampaign('test_run');
const id = Object.keys(camp.getState().campaigns)[0];
camp.getState().setActiveCampaign(id);
sim.getState().enterCampaign({ snapshot: { flagOverrides: {}, statusOverrides: {} } });
// advance() a few nodes via the UI
sim.getState().exitCampaign();
```
After `exitCampaign()`, confirm in the console:
- `camp.getState().campaigns[id].snapshot.activeNodeId` matches the last active node you advanced to.
- `narrativeStore.getState().flag` is unchanged (compare before/after).
