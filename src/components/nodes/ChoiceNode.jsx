import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore } from 'store';

function ChoiceNode({ id, data }) {
  const isActive = useSimulationStore(s => s.activeNodeId === id);
  const isVisited = useSimulationStore(s => s.visitedNodeIds.includes(id));
  const isReachable = useSimulationStore(s => {
    return s.isRunning && s.reachableNodeIds.includes(id) && s.activeNodeId !== id;
  });


  let className = 'story-node choice-node';
  if (isActive) className += ' story-node--active';
  else if (isVisited) className += ' story-node--visited';
  else if (isReachable) className += ' story-node--reachable';

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />
      
      <div className="story-node__header">
        <h4 className="story-node__title">{data.label} <span className="choice-indicator">[Choice]</span></h4>
        {data.sideEffects && data.sideEffects.length > 0 && (
          <span className="story-node__badge">{data.sideEffects.length} effects</span>
        )}
      </div>
      
      {data.content && (
        <div className="story-node__content">
          <p>{data.content}</p>
        </div>
      )}


      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ChoiceNode);
