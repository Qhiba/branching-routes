import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulationStore, useNarrativeStore } from 'store';

function EndingNode({ id, data }) {
  const nodeState = useSimulationStore(s => s.nodeStates[id]);
  const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id));
  // ADDED: Phase 3 — coverage-gap dimming (unreachable but unseen nodes only; visited nodes always visible)
  const isCoverageGap = useSimulationStore(s => s.isCampaignActive && s.unreachableFromActiveNodeIds.includes(id) && !s.seenNodeIds.includes(id));

  const isOrphaned = useSimulationStore(s => s.orphanedNodeIds.includes(id));
  const isUnreachable = useSimulationStore(s => s.unreachableNodeIds.includes(id));
  // FIX 9: Resolve nodeSubTypeId → display name from store
  const endingTypeDict = useNarrativeStore(s => s.endingType);
  const subTypeName = data.nodeSubTypeId ? endingTypeDict[data.nodeSubTypeId]?.name : null;

  // MODIFIED: Phase 3 — add coverage-gap class to className string
  const className = `story-node ending-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen ? 'story-node--seen' : ''} ${isCoverageGap ? 'story-node--coverage-gap' : ''}`.trim();

  return (
    <div className={className}>
      <Handle type="target" position={Position.Left} />

      <div className="story-node__type-bar ending-node__type-bar">
        {/* FIX 9: Show user-defined nodeSubType name if set, fallback to ENDING */}
        <span className="story-node__type-label">
          {subTypeName ? subTypeName.toUpperCase() : 'ENDING'}
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
            <path d="M4 6l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="ending-node__path-art" aria-hidden="true">◆ ─ ■</span>
      </div>
    </div>
  );
}

export default memo(EndingNode);
