import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useNarrativeStore, useUIStore } from 'store';

function ChoiceNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  // ADDED: Phase 3 — coverage-gap dimming (unreachable but unseen nodes only; visited nodes always visible)
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const isActive = useSimulationStore(s => s.activeNodeId === id);
  const selectedOptionId = useSimulationStore(s => s.selectedOptionId);
  const selectOption = useSimulationStore(s => s.selectOption);

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));

  const outgoingEdgeCount = useNarrativeStore(s => s.edges.filter(e => e.sourceId === id).length);

  const choiceDisplayMode = useUIStore(s => s.choiceDisplayMode);

  // ADDED: Phase 2 label display variables
  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
  const flagDict = useNarrativeStore(s => s.flag);
  const statusDict = useNarrativeStore(s => s.status);

  // MODIFIED: Phase 3 — add coverage-gap class to className string
  const className = `story-node choice-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''}`.trim();

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} className="choice-node__handle choice-node__handle--target" />

      <div className="story-node__type-bar choice-node__type-bar">
        <span className="story-node__type-label">CHOICE</span>
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
        <div className="story-node__meta-group">
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
        
        {/* ADDED: Phase 2 verbose display for node-level side effects */}
        {labelDisplayMode === 'verbose' && ((data.flags_set?.length || 0) + (data.status_set?.length || 0)) > 0 && (
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' }}>
            {data.flags_set?.map(flagId => (
              <div key={`nf-${flagId}`}>• {flagDict[flagId]?.name || 'Unknown'} = true</div>
            ))}
            {data.status_set?.map(se => (
              <div key={`ns-${se.statusId}`}>• {statusDict[se.statusId]?.name || 'Unknown'}: {se.value > 0 ? '+' : ''}{se.value}</div>
            ))}
          </div>
        )}
        {Array.isArray(data.options) && data.options.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.options.map(opt => {
              const displayLabel = choiceDisplayMode === 'full' ? opt.label : (opt.label.length > 25 ? opt.label.slice(0, 22) + '...' : opt.label);
              const isSelected = isActive && selectedOptionId === opt.id;
              const isDimmed = isActive && selectedOptionId !== null && !isSelected;
              let optClassName = 'choice-node__option';
              if (isCampaignActive && isActive) {
                optClassName += ' choice-node__option--clickable';
                if (isSelected) optClassName += ' choice-node__option--selected';
                else if (isDimmed) optClassName += ' choice-node__option--dimmed';
              }

              return (
                <div 
                  key={opt.id} 
                  className={optClassName}
                  onClick={isCampaignActive && isActive ? (e) => { e.stopPropagation(); selectOption(opt.id); } : undefined}
                >
                  {displayLabel || (<i>Unnamed Option</i>)}
                  
                  {/* ADDED: Phase 2 verbose display for option-level side effects */}
                  {labelDisplayMode === 'verbose' && ((opt.flags_set?.length || 0) + (opt.status_set?.length || 0)) > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '9px', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '1px', opacity: 0.8 }}>
                      {opt.flags_set?.map(flagId => (
                        <div key={`of-${flagId}`}>• {flagDict[flagId]?.name || 'Unknown'} = true</div>
                      ))}
                      {opt.status_set?.map(se => (
                        <div key={`os-${se.statusId}`}>• {statusDict[se.statusId]?.name || 'Unknown'}: {se.value > 0 ? '+' : ''}{se.value}</div>
                      ))}
                    </div>
                  )}

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

      {(!data.options || data.options.length === 0) && (
        <Handle type="source" position={Position.Right} className="choice-node__handle choice-node__handle--source" />
      )}
    </div>
  );
}

export default memo(ChoiceNode);
