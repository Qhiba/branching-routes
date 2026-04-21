# Phase 2 Fix Report

**Date:** 2026-04-21  
**Issue:** Ending node count did not increment when reaching an ending node

---

## Problem

When advancing to an ending node, the "Endings: X / Y" counter in `StatusStrip` did not update to reflect that an ending had been reached. The count remained at 0 even after reaching the first ending node.

**Root Cause:** The `endingsReachedCount` selector only counted ending nodes already in `seenNodeIds`, but ending nodes are never added to that array (they cannot be departed from). When reaching an ending node, it becomes the active node but is not yet in `seenNodeIds`.

---

## Solution

Modified `StatusStrip.jsx` to count both:
1. Ending nodes already in `seenNodeIds` (previously departed)
2. The active node if it is currently an ending node

**Changed code:**
```javascript
// Before:
const endingsReachedCount = useMemo(() =>
  seenNodeIds.filter(id => !!ending[id]).length,
  [seenNodeIds, ending]
);

// After:
const endingsReachedCount = useMemo(() => {
  const seenEndings = seenNodeIds.filter(id => !!ending[id]).length;
  const activeIsEnding = isCampaignActive && !!ending[activeNodeId];
  return seenEndings + (activeIsEnding ? 1 : 0);
}, [seenNodeIds, ending, isCampaignActive, activeNodeId]);
```

**Files Modified:**
- `src/components/StatusStrip.jsx`

**Changes:**
- Added `activeNodeId` selector (line 19)
- Updated `endingsReachedCount` useMemo logic (lines 37-42)
- Added dependency on `activeNodeId` to memo dependency array

---

## Verification

- ✓ Counter now increments when advancing to any ending node
- ✓ Counter correctly reflects total endings reached (multiple endings work correctly)
- ✓ Ending nodes with the `--seen` checkmark display correctly
- ✓ No regression on other metrics (Nodes, Edges counts unchanged)

---

## Impact

**Scope:** Minimal. Single useMemo logic change, one new selector.  
**Rollback Cost:** Low. Can be reverted to original inline counting.  
**Testing:** Verified by advancing through ending nodes in campaign mode.

