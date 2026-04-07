// ============================================================
// ConditionalEdge.jsx — Custom edge with condition-aware rendering
// ============================================================
// Renders edges with three visual states based on simulation:
//   1. Pass (solid cyan) — edge conditions evaluate to true
//   2. Fail (dashed/dimmed) — edge conditions evaluate to false
//   3. Glow (animated) — source node is active, conditions pass
//
// Edge state priority: glow > pass > fail > default
//
// Reads from useSimulationStore:
//   - evaluatedEdges[edgeId] → boolean (pass/fail)
//   - nodeStates[sourceId].status → 'active' triggers glow
//
// Architecture rules enforced:
//   AR-02: reads simulation state from Zustand
//   AR-09: CSS consumes tokens only (ConditionalEdge.css)
// ============================================================

import { memo } from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { useSimulationStore } from '@/store/useSimulationStore.js';

import './ConditionalEdge.css';

/**
 * Determine the visual state class for the edge.
 *
 * @param {boolean|undefined} evalResult — condition evaluation result
 * @param {boolean} isSourceActive — whether the source node is active
 * @returns {string} CSS class name
 */
function getEdgeStateClass(evalResult, isSourceActive) {
  // If source is active and conditions pass → glow
  if (isSourceActive && evalResult !== false) {
    return 'conditional-edge__path--glow';
  }
  // If evaluation explicitly true → pass
  if (evalResult === true) {
    return 'conditional-edge__path--pass';
  }
  // If evaluation explicitly false → fail
  if (evalResult === false) {
    return 'conditional-edge__path--fail';
  }
  // Default (no evaluation data yet)
  return 'conditional-edge__path--default';
}

/**
 * Custom React Flow edge component with condition-aware rendering.
 *
 * @param {object} props — React Flow edge props
 */
function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}) {
  // Read simulation state
  const evalResult = useSimulationStore(
    (s) => s.evaluatedEdges[id]
  );
  const sourceStatus = useSimulationStore(
    (s) => s.nodeStates[data?.sourceNodeId]?.status
  );
  // AMBIGUOUS: data.sourceNodeId may not be set by useGraphSync.
  // Falling back to checking if any node state indicates active
  // for the source. The edge ID format encodes the source ID.

  // Extract source node ID from the edge ID pattern:
  //   "edge-{sourceId}-{nextEntryId}" or "edge-{sourceId}-{optionId}-{nextEntryId}"
  const edgeParts = id.split('-');
  const sourceNodeId = edgeParts.length >= 2 ? edgeParts[1] : null;

  const sourceNodeStatus = useSimulationStore(
    (s) => sourceNodeId ? s.nodeStates[sourceNodeId]?.status : undefined
  );
  const isSourceActive = sourceNodeStatus === 'active';

  // Compute edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const stateClass = getEdgeStateClass(evalResult, isSourceActive);

  // Optional label (for choice option edges)
  const optionLabel = data?.optionLabel;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={`conditional-edge__path ${stateClass}`}
        style={selected ? { strokeWidth: 3 } : undefined}
      />
      {/* Render option label if present */}
      {optionLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="conditional-edge__label"
          >
            <span
              style={{
                background: 'var(--color-bg-secondary)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family)',
                whiteSpace: 'nowrap',
              }}
            >
              {optionLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConditionalEdge);
