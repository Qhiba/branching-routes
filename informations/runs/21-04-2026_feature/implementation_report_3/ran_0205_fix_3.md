# Phase 3 Fix Report

**Date:** 2026-04-21  
**Issues:** 
1. Visited nodes incorrectly dimmed by coverage-gap overlay
2. Seen nodes lack visual distinction from unreachable nodes

---

## Problem 1: Visited Nodes Incorrectly Dimmed

**Symptom:** Nodes that had been visited and departed from were dimmed by the coverage-gap overlay, making the traversal history invisible.

**Root Cause:** The coverage-gap logic only checked if a node was unreachable from the active node. It did not exclude nodes that had already been visited.

```javascript
// Incorrect logic:
const isCoverageGap = useSimulationStore(s => 
  s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id)
);
```

**Impact:** Traversal history was obscured; users could not distinguish between "already explored dead-ends" and "unexplored dead-ends."

---

## Problem 2: Poor Visual Distinction for Seen Nodes

**Symptom:** Visited nodes (with `--seen` checkmark) were not visually distinct from unreachable nodes. Both appeared dimmed with minimal color difference.

**Root Cause:** 
- Seen nodes used only opacity/grayscale filters (no border color)
- Coverage-gap dimming was too dark (opacity 0.2, grayscale 80%)
- `--color-node-seen` was white, providing no visual contrast

**Impact:** Users could not easily identify which nodes had been visited vs. which were unreachable dead-ends.

---

## Solutions

### Fix 1: Exclude Visited Nodes from Coverage-Gap

Modified all three node renderers (CommonNode, ChoiceNode, EndingNode):

```javascript
// Before:
const isCoverageGap = useSimulationStore(s => 
  s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id)
);

// After:
const isCoverageGap = useSimulationStore(s => 
  s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id)
);
```

**Files Modified:**
- `src/components/nodes/CommonNode.jsx` (line 9)
- `src/components/nodes/ChoiceNode.jsx` (line 6)
- `src/components/nodes/EndingNode.jsx` (line 5)

**Result:** Visited nodes are never dimmed, preserving traversal history visibility.

---

### Fix 2: Visual Enhancement for Seen Nodes + Lighter Dimming

**Part A: Green Border for Seen Nodes**

Modified `src/styles/tokens.css`:
- Changed `--color-node-seen` from `#ffffff` (white) to `#4caf7d` (green)

Modified `src/styles/global.css`:
```css
/* Before: Opacity/grayscale only */
.story-node--seen {
  opacity: 0.4;
  filter: grayscale(60%);
}

/* After: Green border + box-shadow like active/complete/failed states */
.story-node--seen {
  border-color: var(--color-node-seen) !important;
  box-shadow: 0 0 0 1px var(--color-node-seen), var(--shadow-md);
}
```

**Part B: Lighter Coverage-Gap Dimming**

Modified `src/styles/global.css`:
```css
/* Before: Heavy dimming */
.story-node--coverage-gap {
  opacity: var(--opacity-coverage-gap);  /* 0.2 */
  filter: grayscale(80%);
}

/* After: Lighter, more visible */
.story-node--coverage-gap {
  opacity: 0.6;
  filter: grayscale(40%);
}
```

**Files Modified:**
- `src/styles/tokens.css` (line 36, color token)
- `src/styles/global.css` (`.story-node--seen` block, `.story-node--coverage-gap` block)

---

## Result

**Visual Hierarchy Now Clear:**
1. **Green border with checkmark** = Visited node (highly visible, matches active/complete/failed pattern)
2. **Slightly dimmed (60% opacity, 40% grayscale)** = Unreachable but unvisited node (visible but de-emphasized)
3. **Full color** = Forward-reachable node (normal appearance)

**Verification:**
- ✓ Visited nodes show green border and checkmark
- ✓ Visited nodes are never dimmed (full opacity, full color)
- ✓ Unreachable unvisited nodes are lightly dimmed (clearly distinguished from visited)
- ✓ Traversal history is now clearly visible
- ✓ Visual consistency with active/complete/failed node styling

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/components/nodes/CommonNode.jsx` | Updated `isCoverageGap` selector to exclude seen nodes |
| `src/components/nodes/ChoiceNode.jsx` | Updated `isCoverageGap` selector to exclude seen nodes |
| `src/components/nodes/EndingNode.jsx` | Updated `isCoverageGap` selector to exclude seen nodes |
| `src/styles/tokens.css` | Changed `--color-node-seen` to green (#4caf7d) |
| `src/styles/global.css` | Enhanced `.story-node--seen` with green border/shadow; lightened `.story-node--coverage-gap` |

---

## Impact

**Scope:** Minimal. Selector logic fix + CSS visual enhancement.  
**Rollback Cost:** Low. All changes are localized.  
**Testing:** Verified by advancing through multiple nodes and observing:
  - Green borders on all visited nodes
  - Visited nodes remain fully visible (not dimmed)
  - Unreachable unvisited nodes are lightly dimmed
  - Clear visual distinction between states

---

## Acceptance Criteria

- [x] Visited nodes show green border with checkmark
- [x] Visited nodes are never dimmed by coverage-gap
- [x] Unreachable unvisited nodes are lighter (less dark) and clearly distinct
- [x] Coverage-gap dimming does not obscure traversal history
- [x] Visual pattern matches active/complete/failed node styling

