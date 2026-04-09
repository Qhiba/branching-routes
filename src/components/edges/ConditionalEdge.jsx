import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { useSimulationStore } from 'store';

function ConditionalEdge(props) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  
  const isTraversed = useSimulationStore(s => s.traversedEdgeIds.includes(id));
  const isReachable = useSimulationStore(s => s.reachableEdgeIds.includes(id));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let className = 'conditional-edge';
  if (isTraversed) className += ' conditional-edge--traversed';
  else if (isReachable) className += ' conditional-edge--reachable';

  const label = data?.label;
  const condition = data?.condition;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} className={className} />
      {(label || condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan conditional-edge__label-container"
          >
            {label && <span className="conditional-edge__label">{label}</span>}
            {condition && condition.operator && (
              <span className="conditional-edge__condition-badge">{condition.operator}</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConditionalEdge);
