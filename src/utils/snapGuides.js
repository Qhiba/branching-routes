/**
 * snapGuides.js — Pure utility functions for Smart Snap Assist.
 *
 * No store access, no DOM access, no side effects.
 * All functions are independently testable.
 *
 * Performance design:
 *  - computeSnapGuides() is called ONCE on dragStart and cached in a ref.
 *  - getActiveGuides() and getSnappedPosition() use binary search (O log N)
 *    and are called cheaply on every drag frame against the cached result.
 */

/**
 * Binary search: find the index of the value in a sorted array
 * that is closest to `target`.
 * @param {number[]} sortedArr
 * @param {number} target
 * @returns {number|null} closest value, or null if array is empty
 */
function findClosestValue(sortedArr, target) {
  if (sortedArr.length === 0) return null;

  let lo = 0;
  let hi = sortedArr.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedArr[mid] < target) lo = mid + 1;
    else hi = mid;
  }

  // lo is now the first index >= target; also check lo-1
  if (lo > 0 && Math.abs(sortedArr[lo - 1] - target) < Math.abs(sortedArr[lo] - target)) {
    return sortedArr[lo - 1];
  }
  return sortedArr[lo];
}

/**
 * Compute snap guide rail positions from all nodes that are NOT being dragged.
 * Call this ONCE in onNodeDragStart and cache the result in a ref.
 *
 * @param {Array<{ position: { x: number, y: number } }>} otherNodes
 *   React Flow node objects that are not part of the current drag.
 * @returns {{ yGuides: number[], xGuides: number[] }}
 *   Sorted arrays of candidate Y (row) and X (column) positions.
 */
export function computeSnapGuides(otherNodes) {
  const ySet = new Set();
  const xSet = new Set();

  for (const node of otherNodes) {
    if (node.position) {
      ySet.add(Math.round(node.position.y));
      xSet.add(Math.round(node.position.x));
    }
  }

  return {
    yGuides: Array.from(ySet).sort((a, b) => a - b),
    xGuides: Array.from(xSet).sort((a, b) => a - b),
  };
}

/**
 * Find which guides are currently "active" — within threshold of the given position.
 * Used to determine which guide lines to render during drag (Ctrl-held visibility).
 *
 * @param {{ x: number, y: number }} pos - Current dragged node position (flow coords)
 * @param {{ yGuides: number[], xGuides: number[] }} guides - Pre-computed guide cache
 * @param {number} threshold - Max distance (flow px) before a guide is considered active
 * @returns {{ y: number|null, x: number|null }}
 */
export function getActiveGuides(pos, guides, threshold) {
  const closestY = findClosestValue(guides.yGuides, pos.y);
  const closestX = findClosestValue(guides.xGuides, pos.x);

  return {
    y: closestY !== null && Math.abs(closestY - pos.y) <= threshold ? closestY : null,
    x: closestX !== null && Math.abs(closestX - pos.x) <= threshold ? closestX : null,
  };
}

/**
 * Snap a position to the nearest guides within threshold.
 * Each axis is snapped independently — X and Y do not affect each other.
 * Call this in onNodeDragStop to finalize the snapped position.
 *
 * @param {{ x: number, y: number }} pos - Final drag position before correction
 * @param {{ yGuides: number[], xGuides: number[] }} guides - Pre-computed guide cache
 * @param {number} threshold - Max distance (flow px) to snap
 * @returns {{ x: number, y: number }} Snapped position (original axis unchanged if no guide nearby)
 */
export function getSnappedPosition(pos, guides, threshold) {
  let { x, y } = pos;

  const closestY = findClosestValue(guides.yGuides, y);
  if (closestY !== null && Math.abs(closestY - y) <= threshold) {
    y = closestY;
  }

  const closestX = findClosestValue(guides.xGuides, x);
  if (closestX !== null && Math.abs(closestX - x) <= threshold) {
    x = closestX;
  }

  return { x, y };
}

/**
 * Apply axis lock: constrain movement to the dominant axis only.
 * The dominant axis is whichever one the node moved more in (|dx| vs |dy|).
 * The non-dominant axis is reset back to its start value.
 *
 * Used when Shift is held during drag (Q3).
 *
 * @param {{ x: number, y: number }} finalPos - Where the node ended up
 * @param {{ x: number, y: number }} startPos - Where the node was at dragStart
 * @returns {{ x: number, y: number }} Axis-locked position
 */
export function applyAxisLock(finalPos, startPos) {
  const dx = Math.abs(finalPos.x - startPos.x);
  const dy = Math.abs(finalPos.y - startPos.y);

  if (dx >= dy) {
    // Horizontal movement dominant → lock Y back to start
    return { x: finalPos.x, y: startPos.y };
  } else {
    // Vertical movement dominant → lock X back to start
    return { x: startPos.x, y: finalPos.y };
  }
}
