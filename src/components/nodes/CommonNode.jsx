import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore } from 'store';

function CommonNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  
  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));

  const className = `story-node common-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen ? 'story-node--seen' : ''}`.trim();

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar common-node__type-bar">
        <span className="story-node__type-label">COMMON</span>
        {isOrphaned && (
          <span className="story-node__warning-badge" title="Node is entirely disconnected">
            ⚠️ Orphaned
          </span>
        )}
        {!isOrphaned && isUnreachable && (
          <span className="story-node__warning-badge" title="Node cannot be reached from start node">
            ⚠️ Unreachable
          </span>
        )}
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
