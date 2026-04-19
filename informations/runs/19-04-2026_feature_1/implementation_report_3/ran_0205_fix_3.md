# Fix Report: Phase 3 (Revision 4)

## Issue 1: Exiting the campaign didn't save progression

### Root Causes
- **Bug A — `exitCampaign` async race**: Snapshot write was async; teardown was sync.
- **Bug B — `enterCampaign` reset bypass**: Ignored `snapshot.activeNodeId` on re-entry.
- **Bug C — `addCampaign` missing return ID**: Zero-campaign path couldn't set active ID.

### Fixes Applied
- **`simulationStore.js`**: Made `useCampaignStore` import direct/synchronous. Updated `enterCampaign` to resume from snapshot if valid. Added `snapshotCampaign` action. Added `autosaveCampaign` toggle logic.
- **`campaignStore.js`**: `addCampaign` now returns the generated ID.

---

## Issue 2 (User request): Save controls in sidebar

### Changes
- **`SandboxPanel.jsx`**: Added "Campaign Save" section at the top of the sidebar panel.
  - **Autosave toggle** (default: false).
  - **Save Progression button**: Primary action style.
  - **Load Last Save button**: Re-enters campaign from stored snapshot.
  - **Styles**: Buttons styled to match `FlagManager`'s "Add Flag" button (`padding: 10px`, `borderRadius: 4px`, `fontWeight: bold`).
  - **Warning Text**: Subtle color/opacity warning about overwriting save slots.

### UI Consolidation
- **`CampaignSelector.jsx`**: Removed redundant "Save Progression" button from TopBar (moved to sidebar).

---

### Files Modified
- `src/store/simulationStore.js`
- `src/store/campaignStore.js`
- `src/components/SandboxPanel.jsx`
- `src/components/CampaignSelector.jsx`
