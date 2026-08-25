import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';

function HubNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  const isEditorSeen = useNarrativeStore(s => (s.editorSeenNodeIds || []).includes(id));
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

  const isFilteredOut = !!data.isFilteredOut;

  const className = `story-node hub-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen || (isEditorSeen && !isCampaignActive) ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''} ${isFilteredOut ? 'story-node--filtered-out' : ''}`.trim();

  const sideEffectsCount = (data.flags_set?.length || 0) + (data.status_set?.length || 0);

  return (
    <div className={className} title={data.label || 'Hub Node'}>
      <Handle type="target" position={Position.Left} className="hub-node__handle hub-node__handle--target" />

      <div className="hub-node__diamond">
        <div className="hub-node__inner">
          <svg className="hub-node__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="3" x2="6" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
          </svg>
        </div>
      </div>

      {(isOrphaned || (!isOrphaned && isUnreachable)) && (
        <span className="hub-node__warning-badge" title={isOrphaned ? 'Orphaned Hub Node' : 'Unreachable Hub Node'}>⚠️</span>
      )}

      {sideEffectsCount > 0 && (
        <span className="hub-node__badge" title={`${sideEffectsCount} side effect(s)`}>{sideEffectsCount}</span>
      )}

      <Handle type="source" position={Position.Right} className="hub-node__handle hub-node__handle--source" />
    </div>
  );
}

export default memo(HubNode);
