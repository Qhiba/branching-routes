import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';

function CommonNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  const isEditorSeen = useNarrativeStore(s => (s.editorSeenNodeIds || []).includes(id));
  // ADDED: Phase 3 — coverage-gap dimming (unreachable but unseen nodes only; visited nodes always visible)
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

  // ADDED: Phase 2 label display mode
  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
  const flagDict = useNarrativeStore(s => s.flag);
  const statusDict = useNarrativeStore(s => s.status);
  const flagKeys = Object.keys(flagDict);
  const statusKeys = Object.keys(statusDict);
  // FIX 9: Resolve nodeSubTypeId → display name from store
  const commonTypeDict = useNarrativeStore(s => s.commonType);
  const subTypeName = data.nodeSubTypeId ? commonTypeDict[data.nodeSubTypeId]?.name : null;

  // MODIFIED: Phase 3 — add coverage-gap class to className string
  const className = `story-node common-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen || (isEditorSeen && !isCampaignActive) ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''}`.trim();

  const sideEffectsCount = (data.flags_set?.length || 0) + (data.status_set?.length || 0);

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar common-node__type-bar">
        {/* Seen check icon — visible in editor mode only when manually marked */}
        {/* FIX 9: Show user-defined nodeSubType name if set, fallback to COMMON */}
        <span className="story-node__type-label">
          {subTypeName ? subTypeName.toUpperCase() : 'COMMON'}
        </span>
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
        {sideEffectsCount > 0 && (
          <span className="story-node__meta-badge">
            <svg className="story-node__meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="1" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 5l3-1-1 3-2-2z" fill="currentColor" />
              <path d="M10 6l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {sideEffectsCount} effect{sideEffectsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        {data.content && (
          <p className="story-node__content-text">{data.content}</p>
        )}

        {labelDisplayMode === 'verbose' && sideEffectsCount > 0 && (
          <div className="verbose-effects-box">
            {data.flags_set?.length > 0 && (
              <div className="verbose-effects-section">
                {[...data.flags_set]
                  .sort((a, b) => flagKeys.indexOf(a) - flagKeys.indexOf(b))
                  .map(flagId => (
                  <span key={`f-${flagId}`} className="effect-chip effect-chip--flag">
                    {flagDict[flagId]?.name || 'Unknown'}
                  </span>
                ))}
              </div>
            )}
            {data.status_set?.length > 0 && (
              <div className="verbose-effects-section">
                {[...data.status_set]
                  .sort((a, b) => statusKeys.indexOf(a.statusId) - statusKeys.indexOf(b.statusId))
                  .map(se => {
                  const val = se.amount ?? se.value ?? 0;
                  const isSet = se.mode === 'set';
                  const chipClass = isSet ? 'effect-chip--set' : val > 0 ? 'effect-chip--positive' : val < 0 ? 'effect-chip--negative' : 'effect-chip--set';
                  const formattedVal = isSet ? `= ${val}` : val > 0 ? `+${val}` : `${val}`;
                  return (
                    <span key={`s-${se.statusId}`} className={`effect-chip ${chipClass}`}>
                      {statusDict[se.statusId]?.name || 'Unknown'} {formattedVal}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CommonNode);
