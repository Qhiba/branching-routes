import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useNarrativeStore, useUIStore } from 'store';
import { evaluateCondition } from 'utils';
import { VerboseEffectsBox, OptionVerboseEffectsBox } from './VerboseEffects';

function ChoiceNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  const isEditorSeen = useNarrativeStore(s => (s.editorSeenNodeIds || []).includes(id));
  // ADDED: Phase 3 — coverage-gap dimming (unreachable but unseen nodes only; visited nodes always visible)
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const isActive = useSimulationStore(s => s.activeNodeId === id);
  const selectedOptionId = useSimulationStore(s => s.selectedOptionId);
  const selectOption = useSimulationStore(s => s.selectOption);
  const currentFlagValues = useSimulationStore(s => s.currentFlagValues);

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));

  const outgoingEdgeCount = useNarrativeStore(s => s.edges.filter(e => e.sourceId === id).length);

  const choiceDisplayMode = useUIStore(s => s.choiceDisplayMode);
  const editorSeenOptionIds = useNarrativeStore(s => s.editorSeenOptionIds) ?? [];

  // ADDED: Phase 2 label display variables
  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);

  const isFilteredOut = !!data.isFilteredOut;

  // MODIFIED: Phase 3 — add coverage-gap class to className string; Step 3 — add filtered-out class
  const className = `story-node choice-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen || (isEditorSeen && !isCampaignActive) ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''} ${isFilteredOut ? 'story-node--filtered-out' : ''}`.trim();

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} className="choice-node__handle choice-node__handle--target" />

      <div className="story-node__type-bar choice-node__type-bar">
        {/* Seen check icon — visible in editor mode only when manually marked */}
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
                  <rect x="2" y="1" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 5l3-1-1 3-2-2z" fill="currentColor" />
                  <path d="M10 6l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {(data.flags_set?.length || 0) + (data.status_set?.length || 0)} effect{((data.flags_set?.length || 0) + (data.status_set?.length || 0)) !== 1 ? 's' : ''}
              </span>
              <span className="story-node__meta-sep">•</span>
            </>
          )}
          <span className="story-node__meta-badge choice-node__outgoing">
            <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

        {labelDisplayMode === 'verbose' && ((data.flags_set?.length || 0) + (data.status_set?.length || 0)) > 0 && (
          <VerboseEffectsBox flagsSet={data.flags_set} statusSet={data.status_set} />
        )}
        {Array.isArray(data.options) && data.options.length > 0 && (
          <div className="choice-node__options-list">
            {data.options.map(opt => {
              const isOptionSeen = !isCampaignActive && editorSeenOptionIds.includes(`${id}::${opt.id}`);
              const displayLabel = opt.label;
              const isSelected = isActive && selectedOptionId === opt.id;
              const isDimmed = isActive && selectedOptionId !== null && !isSelected;
              
              // Evaluate if option requirements are met
              const isConditionMet = !opt.requires || evaluateCondition(opt.requires, currentFlagValues);
              const isClickable = isCampaignActive && isActive && isConditionMet && selectedOptionId === null;

              let optClassName = 'choice-node__option';
              if (choiceDisplayMode === 'full') optClassName += ' choice-node__option--full';
              if (isCampaignActive && isActive) {
                if (isClickable) optClassName += ' choice-node__option--clickable';
                if (isSelected) optClassName += ' choice-node__option--selected';
                else if (isDimmed || !isConditionMet) optClassName += ' choice-node__option--dimmed';
              }
              if (isOptionSeen) optClassName += ' choice-node__option--seen';

              return (
                <div
                  key={opt.id}
                  className={optClassName}
                  onClick={isClickable ? (e) => { e.stopPropagation(); selectOption(opt.id); } : undefined}
                >
                  <span className="choice-node__option-text">
                    {displayLabel || (<i>Unnamed Option</i>)}
                  </span>

                  {labelDisplayMode === 'verbose' && (
                    <OptionVerboseEffectsBox option={opt} />
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
