import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
// MODIFIED: added useUIStore to select choiceDisplayMode
import { useSimulationStore, useNarrativeStore, useUIStore } from 'store';

function ChoiceNode({ id, data }) {
  const isActive    = useSimulationStore(s => s.activeNodeId === id);
  const isVisited   = useSimulationStore(s => s.visitedNodeIds.includes(id));
  const isReachable = useSimulationStore(s =>
    s.isRunning && s.reachableNodeIds.includes(id) && s.activeNodeId !== id
  );

  const outgoingEdgeCount = useNarrativeStore(s => s.edges.filter(e => e.sourceId === id).length);

  // ADDED: selector for choiceDisplayMode
  const choiceDisplayMode = useUIStore(s => s.choiceDisplayMode);

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
          {/* MODIFIED: fix stale sideEffects guard — replaced with flags_set/status_set lengths */}
          {((data.flags_set?.length || 0) + (data.status_set?.length || 0)) > 0 && (
            <>
              <span className="story-node__meta-badge">
                <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="1" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 5l3-1-1 3-2-2z" fill="currentColor"/>
                  <path d="M10 6l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {(data.flags_set?.length || 0) + (data.status_set?.length || 0)} effect{((data.flags_set?.length || 0) + (data.status_set?.length || 0)) !== 1 ? 's' : ''}
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
        {/* ADDED: render options labels and Handles inside the node body */}
        {Array.isArray(data.options) && data.options.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.options.map(opt => {
              const displayLabel = choiceDisplayMode === 'full' ? opt.label : (opt.label.length > 25 ? opt.label.slice(0, 22) + '...' : opt.label);
              return (
                <div key={opt.id} style={{ position: 'relative', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', zIndex: 1 }}>
                  {displayLabel || (<i>Unnamed Option</i>)}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={opt.id}
                    className="choice-node__handle choice-node__handle--source"
                    style={{ top: '50%', right: '-12px' }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODIFIED: fallback single source handle if no options exist */}
      {(!data.options || data.options.length === 0) && (
        <Handle type="source" position={Position.Right} className="choice-node__handle choice-node__handle--source" />
      )}
    </div>
  );
}

export default memo(ChoiceNode);
