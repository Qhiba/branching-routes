import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';
import { Gem } from 'lucide-react';
import { VerboseEffectsBox } from './VerboseEffects';

function CommonNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  const isEditorSeen = useNarrativeStore(s => (s.editorSeenNodeIds || []).includes(id));
  // ADDED: Phase 3 — coverage-gap dimming (unreachable but unseen nodes only; visited nodes always visible)
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  // ADDED (Redesign Step 1): editor Seen marks hidden when the Campaign feature is off
  const featureCampaign = useUIStore(s => s.featureCampaign);

  // ADDED: Phase 2 label display mode
  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
  // FIX 9: Resolve nodeSubTypeId → display name from store
  const commonTypeDict = useNarrativeStore(s => s.commonType);
  const subTypeName = data.nodeSubTypeId ? commonTypeDict[data.nodeSubTypeId]?.name : null;

  const isFilteredOut = !!data.isFilteredOut;

  // MODIFIED: Phase 3 — add coverage-gap class to className string; Step 3 — add filtered-out class
  const className = `story-node common-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen || (isEditorSeen && !isCampaignActive && featureCampaign) ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''} ${isFilteredOut ? 'story-node--filtered-out' : ''}`.trim();

  const sideEffectsCount = (data.flags_set?.length || 0) + (data.status_set?.length || 0);

  // ADDED (Redesign Step 7): collectibles granted by this node — count badge, names on hover / in verbose mode
  const collectibleDict = useNarrativeStore(s => s.collectible);
  const collectibleNames = (data.collectibleIds || []).map(cid => collectibleDict[cid]?.name).filter(Boolean);

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar common-node__type-bar">
        {/* Seen check icon — visible in editor mode only when manually marked */}
        {/* FIX 9: Show user-defined nodeSubType name if set, fallback to COMMON */}
        <span className="story-node__type-label">
          {subTypeName || 'Common'}
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
        {collectibleNames.length > 0 && (
          <span className="story-node__meta-badge story-node__collectible-badge" title={`Grants: ${collectibleNames.join(', ')}`}>
            <Gem className="story-node__meta-icon" aria-hidden="true" />
            {collectibleNames.length}
          </span>
        )}
      </div>

      <div className="story-node__body">
        <h4 className="story-node__title">{data.label}</h4>
        {data.content && (
          <p className="story-node__content-text">{data.content}</p>
        )}

        {labelDisplayMode === 'verbose' && sideEffectsCount > 0 && (
          <VerboseEffectsBox flagsSet={data.flags_set} statusSet={data.status_set} />
        )}
        {labelDisplayMode === 'verbose' && collectibleNames.length > 0 && (
          <div className="story-node__collectibles">
            {collectibleNames.map(name => <span key={name} className="story-node__collectible-chip">{name}</span>)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CommonNode);
