// ============================================================
// RouteOverlay.jsx — Visual overlay on graph canvas highlighting
// traced route with step numbers
// ============================================================
// Renders numbered step badges on nodes in the active traced
// route, a clear button, and a summary info strip. The overlay
// is positioned above the React Flow canvas.
//
// Props:
//   tracedRoute — { paths, annotatedPaths, mode } from RouteFinderDialog
//   selectedPathIndex — which path to show (for multi-path results)
//   onClear — callback to dismiss the overlay
//
// Dependencies: useUIStore (for later phases)
// Architecture: AR-01, AR-09
// ============================================================

import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { X, Route } from 'lucide-react';

import './RouteOverlay.css';

/**
 * RouteOverlay — highlights traced route on the graph canvas.
 *
 * @param {object} props
 * @param {object|null} props.tracedRoute — result from RouteFinderDialog
 * @param {number} [props.selectedPathIndex=0] — index of path to display
 * @param {function} props.onClear — callback to clear the overlay
 */
function RouteOverlay({ tracedRoute, selectedPathIndex = 0, onClear }) {
  const { getNodes } = useReactFlow();

  // Get the active path to display
  const activePath = useMemo(() => {
    if (!tracedRoute?.paths?.length) return null;
    return tracedRoute.paths[Math.min(selectedPathIndex, tracedRoute.paths.length - 1)];
  }, [tracedRoute, selectedPathIndex]);

  const activeAnnotated = useMemo(() => {
    if (!tracedRoute?.annotatedPaths?.length) return null;
    return tracedRoute.annotatedPaths[Math.min(selectedPathIndex, tracedRoute.annotatedPaths.length - 1)];
  }, [tracedRoute, selectedPathIndex]);

  // Map node IDs to their canvas positions for step badges
  const stepPositions = useMemo(() => {
    if (!activePath) return [];

    const rfNodes = getNodes();
    const nodeMap = new Map(rfNodes.map((n) => [n.id, n]));

    return activePath.nodeIds.map((nodeId, index) => {
      const rfNode = nodeMap.get(nodeId);
      if (!rfNode) return null;

      return {
        nodeId,
        index,
        // React Flow node positions are in flow coordinates
        // The step badges will be positioned via React Flow's viewport transform
        x: rfNode.position.x + (rfNode.measured?.width ?? 160) / 2,
        y: rfNode.position.y,
      };
    }).filter(Boolean);
  }, [activePath, getNodes]);

  if (!activePath || !tracedRoute) return null;

  const totalPaths = tracedRoute.paths?.length ?? 0;
  const pathLength = activePath.nodeIds.length;

  return (
    <div className="route-overlay" id="route-overlay">
      {/* Clear button */}
      <button
        className="route-overlay-clear"
        onClick={onClear}
        id="route-overlay-clear"
      >
        <X size={12} />
        Clear Route
      </button>

      {/* Info strip */}
      <div className="route-overlay-info" id="route-overlay-info">
        <Route size={14} />
        <span className="route-badge">{pathLength} nodes</span>
        {totalPaths > 1 && (
          <span>
            Path {selectedPathIndex + 1} of {totalPaths}
          </span>
        )}
        <span>{activePath.nodeIds[0]} → {activePath.nodeIds[activePath.nodeIds.length - 1]}</span>
      </div>
    </div>
  );
}

export default RouteOverlay;
