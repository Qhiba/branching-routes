import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useNarrativeStore } from 'store';

function ChoiceNode({ id, data }) {
  const isActive    = useSimulationStore(s => s.activeNodeId === id);
  const isVisited   = useSimulationStore(s => s.visitedNodeIds.includes(id));
  const isReachable = useSimulationStore(s =>
    s.isRunning && s.reachableNodeIds.includes(id) && s.activeNodeId !== id
  );

  const outgoingEdgeCount = useNarrativeStore(s => s.edges.filter(e => e.sourceId === id).length);

  let className = 'story-node choice-node';
  if (isActive)     className += ' story-node--active';
  else if (isVisited)   className += ' story-node--visited';
  else if (isReachable) className += ' story-node--reachable';

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} className="choice-node__handle choice-node__handle--target" />

      <div className="story-node__type-bar choice-node__type-bar">
        <span className="story-node__type-label">CHOICE</span>
        <div className="story-node__meta-group">
          {data.sideEffects && data.sideEffects.length > 0 && (
            <>
              <span className="story-node__meta-badge">
                <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="1" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 5l3-1-1 3-2-2z" fill="currentColor"/>
                  <path d="M10 6l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {data.sideEffects.length} effect{data.sideEffects.length !== 1 ? 's' : ''}
              </span>
              <span className="story-node__meta-sep">•</span>
            </>
          )}
          <span className="story-node__meta-badge choice-node__outgoing">
            <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            → {outgoingEdgeCount} outgoing{outgoingEdgeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        {data.content && (
          <p className="story-node__content-text">{data.content}</p>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="choice-node__handle choice-node__handle--source" />
    </div>
  );
}

export default memo(ChoiceNode);
