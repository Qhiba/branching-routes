import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore } from 'store';

function EndingNode({ id, data }) {
  const isActive    = useSimulationStore(s => s.activeNodeId === id);
  const isVisited   = useSimulationStore(s => s.visitedNodeIds.includes(id));
  const isReachable = useSimulationStore(s =>
    s.isRunning && s.reachableNodeIds.includes(id) && s.activeNodeId !== id
  );

  let className = 'story-node ending-node';
  if (isActive)     className += ' story-node--active';
  else if (isVisited)   className += ' story-node--visited';
  else if (isReachable) className += ' story-node--reachable';

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar ending-node__type-bar">
        <span className="story-node__type-label">ENDING</span>
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        {data.content && (
          <p className="story-node__content-text">{data.content}</p>
        )}
      </div>

      <div className="ending-node__footer-bar">
        <span className="ending-node__terminal-icon" aria-hidden="true">
          {/* >_ prompt icon */}
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ending-node__icon-svg">
            <path d="M4 6l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="ending-node__path-art" aria-hidden="true">◆ ─ ■</span>
      </div>
    </div>
  );
}

export default memo(EndingNode);
