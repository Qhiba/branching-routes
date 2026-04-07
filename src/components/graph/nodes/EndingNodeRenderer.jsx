// ============================================================
// EndingNodeRenderer.jsx — Custom node for Endings
// ============================================================
// Renders a rich card displaying:
//   - Entity name (or "Untitled Ending" placeholder)
//   - Type badge (good_end, bad_end, true_end, neutral)
//   - Terminal indicator (endings have no outgoing connections)
//   - Red bottom accent bar (visual termination cue)
//   - Chapter and path tags when assigned
//   - Condition indicator when requires has conditions
//   - Simulation state overlays
//
// Endings are terminal — no source handle is rendered.
//
// Architecture rules enforced:
//   AR-02: reads global state from Zustand stores
//   AR-09: CSS consumes tokens only (EndingNodeRenderer.css)
// ============================================================

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Octagon,
  BookOpen,
  GitBranch,
  ShieldAlert,
  Ban,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';

import './EndingNodeRenderer.css';

/**
 * Compute the CSS modifier class for a simulation status.
 *
 * @param {string} status
 * @returns {string} CSS class suffix
 */
function statusModifier(status) {
  switch (status) {
    case 'active': return 'ending-node--active';
    case 'locked': return 'ending-node--locked';
    case 'complete': return 'ending-node--complete';
    case 'failed': return 'ending-node--failed';
    case 'branch_locked': return 'ending-node--branch-locked';
    default: return '';
  }
}

/**
 * Custom React Flow node component for Endings.
 *
 * @param {{ data: { entity: object, entityType: string } }} props
 */
function EndingNodeRenderer({ data }) {
  const entity = data.entity;

  // Read simulation state for this node
  const nodeState = useSimulationStore(
    (s) => s.nodeStates[entity.id]
  );
  const isUnreachable = useSimulationStore(
    (s) => s.unreachableNodes.has(entity.id)
  );
  const status = nodeState?.status ?? 'default';
  const seen = nodeState?.seen ?? 'unseen';

  // Read chapter and path maps to resolve tag names
  const chapterMap = useNarrativeStore((s) => s.chapter);
  const pathMap = useNarrativeStore((s) => s.path);

  // Phase 13: Read handle orientation from UI store
  const handleOrientation = useUIStore((s) => s.handleOrientation);
  const targetPos = handleOrientation === 'horizontal' ? Position.Left : Position.Top;

  const chapterName = entity.chapter
    ? (chapterMap[entity.chapter]?.name || entity.chapter)
    : null;
  const pathName = entity.path
    ? (pathMap[entity.path]?.name || entity.path)
    : null;

  const hasTags = chapterName || pathName;
  const hasConditions = entity.requires?.conditions?.length > 0;

  const stateClass = statusModifier(status);
  const unreachableClass = isUnreachable ? 'ending-node--unreachable' : '';
  const rootClasses = ['ending-node', stateClass, unreachableClass].filter(Boolean).join(' ');

  return (
    <>
      <Handle type="target" position={targetPos} />
      <div className={rootClasses} style={{ position: 'relative' }}>

        {/* State badge (top-right corner) */}
        {status === 'complete' && (
          <div className="ending-node__state-badge ending-node__state-badge--complete">
            <Check size={11} />
          </div>
        )}
        {status === 'failed' && (
          <div className="ending-node__state-badge ending-node__state-badge--failed">
            <X size={11} />
          </div>
        )}
        {isUnreachable && (
          <div className="ending-node__state-badge ending-node__state-badge--unreachable" title="Unreachable from entry node">
            <AlertTriangle size={11} />
          </div>
        )}

        {/* Header: icon + name + type badge */}
        <div className="ending-node__header">
          <div className="ending-node__icon">
            <Octagon size={14} />
          </div>
          <span className={`ending-node__name${!entity.name ? ' ending-node__name--empty' : ''}`}>
            {entity.name || 'Untitled Ending'}
          </span>
          {entity.type && (
            <span className="ending-node__type-badge">
              {entity.type}
            </span>
          )}
          {/* Seen badge */}
          {seen === 'partially_seen' && (
            <div className="ending-node__seen-badge ending-node__seen-badge--partially" title="Partially seen">
              <EyeOff size={12} />
            </div>
          )}
          {seen === 'seen' && (
            <div className="ending-node__seen-badge ending-node__seen-badge--seen" title="Seen">
              <Eye size={12} />
            </div>
          )}
        </div>

        {/* Body: terminal indicator + condition + tags */}
        <div className="ending-node__body">
          {/* Terminal indicator */}
          <div className="ending-node__terminal">
            <Ban size={10} className="ending-node__terminal-icon" />
            Terminal
          </div>

          {/* Condition indicator */}
          {hasConditions && (
            <div className="ending-node__condition-indicator">
              <ShieldAlert size={10} className="ending-node__condition-icon" />
              Conditional
            </div>
          )}

          {/* Chapter / Path tags */}
          {hasTags && (
            <div className="ending-node__tags">
              {chapterName && (
                <span className="ending-node__tag ending-node__tag--chapter">
                  <BookOpen size={10} className="ending-node__tag-icon" />
                  {chapterName}
                </span>
              )}
              {pathName && (
                <span className="ending-node__tag ending-node__tag--path">
                  <GitBranch size={10} className="ending-node__tag-icon" />
                  {pathName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: ID */}
        <div className="ending-node__footer">
          <span className="ending-node__id">{entity.id}</span>
        </div>

        {/* Bottom accent bar — visual termination cue */}
        <div className="ending-node__bottom-bar" />
      </div>
      {/* Endings are terminal — no source handle */}
    </>
  );
}

export default memo(EndingNodeRenderer);
