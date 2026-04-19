# Fix Report for Campaign_Sheets (Audit Pass 1)

## Fix 1: Issue 1 — `statusOverrides` missing from campaign snapshot save-back
- **File Modified:** `f:\Projects\Web\branching-routes\src\store\simulationStore.js`
- **Corrected Code Section:**
```javascript
  // snapshotCampaign:
    const graphState = useNarrativeStore.getState();
    const flagOverrides = {};
    const statusOverrides = {};
    Object.entries(state.currentFlagValues).forEach(([id, value]) => {
      if (graphState.flag && graphState.flag[id]) flagOverrides[id] = value;
      else if (graphState.status && graphState.status[id]) statusOverrides[id] = value;
    });

    const snapshot = {
      activeNodeId: state.activeNodeId,
      seenNodeIds: [...state.seenNodeIds],
      traversedEdgeIds: [...state.traversedEdgeIds],
      flagOverrides,
      statusOverrides
    };

  // exitCampaign:
        const graphState = useNarrativeStore.getState();
        const flagOverrides = {};
        const statusOverrides = {};
        Object.entries(state.currentFlagValues).forEach(([id, value]) => {
          if (graphState.flag && graphState.flag[id]) flagOverrides[id] = value;
          else if (graphState.status && graphState.status[id]) statusOverrides[id] = value;
        });

        const snapshot = {
          activeNodeId: state.activeNodeId,
          seenNodeIds: [...state.seenNodeIds],
          traversedEdgeIds: [...state.traversedEdgeIds],
          flagOverrides,
          statusOverrides
        };
```
- **What was fixed:** Factored `state.currentFlagValues` into separate `flagOverrides` and `statusOverrides` structures by querying `narrativeStore` property existence, explicitly aligning the snapshot generation shapes with `enterCampaign` logic.
- **Impact:** Affects the feature delta (Campaign-aware exit/snapshot logic) by restoring snapshot matching alignment and full data integrity on save.

## Fix 2: Issue 2 — Duplicate `loadCampaignsFromObject` definition
- **File Modified:** `f:\Projects\Web\branching-routes\src\store\campaignStore.js`
- **Corrected Code Section:**
```javascript
  // ADDED: load campaigns from an external dictionary (from bundle import)
  loadCampaignsFromObject: (campaignsDict) => {
    set({ 
      campaigns: campaignsDict || {}, 
      activeCampaignId: null 
    });
  }

}));
```
- **What was fixed:** Pruned the redundant, identical second definition of `loadCampaignsFromObject` from mapping.
- **Impact:** Neither — strictly eliminates dead code and fixes minor lint violations without impacting integrations or functionality.

## Verification
- Checked that flags are extracted via `graphState.flag[id]` and explicitly tracked within `flagOverrides` before being snapshot in `simulationStore`. Statuses successfully land in `statusOverrides` through mirror implementation.
