import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useNarrativeStore, useUIStore } from 'store';

function WarpExitNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  const isEditorSeen = useNarrativeStore(s => (s.editorSeenNodeIds || []).includes(id));
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  // ADDED (Redesign Step 1): editor Seen marks hidden when the Campaign feature is off
  const featureCampaign = useUIStore(s => s.featureCampaign);

  const isFilteredOut = !!data.isFilteredOut;

  const className = `story-node warp-exit-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen || (isEditorSeen && !isCampaignActive && featureCampaign) ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''} ${isFilteredOut ? 'story-node--filtered-out' : ''}`.trim();

  return (
    <div className={className}>
      <div className="story-node__type-bar warp-exit-node__type-bar">
        <span className="story-node__type-label">Warp exit</span>
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
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-purple-300)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Portal:</span>
          <span>{data.portalChannel || '(not set)'}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(WarpExitNode);
