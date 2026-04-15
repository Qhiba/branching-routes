import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore } from 'store';

function CommonNode({ id, data }) {
  const isActive   = useSimulationStore(s => s.activeNodeId === id);
  const isVisited  = useSimulationStore(s => s.visitedNodeIds.includes(id));
  const isReachable = useSimulationStore(s =>
    s.isRunning && s.reachableNodeIds.includes(id) && s.activeNodeId !== id
  );

  let className = 'story-node common-node';
  if (isActive)    className += ' story-node--active';
  else if (isVisited)  className += ' story-node--visited';
  else if (isReachable) className += ' story-node--reachable';

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar common-node__type-bar">
        <span className="story-node__type-label">COMMON</span>
        {data.sideEffects && data.sideEffects.length > 0 && (
          <span className="story-node__meta-badge">
            <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="1" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 5l3-1-1 3-2-2z" fill="currentColor"/>
              <path d="M10 6l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {data.sideEffects.length} effect{data.sideEffects.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        {data.content && (
          <p className="story-node__content-text">{data.content}</p>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CommonNode);
