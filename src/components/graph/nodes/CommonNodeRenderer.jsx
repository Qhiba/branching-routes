// ============================================================
// CommonNodeRenderer.jsx — Custom node for Common Nodes
// ============================================================
// Renders a rich card displaying:
//   - Entity name (or "Untitled" placeholder)
//   - Type badge (interaction, cg, cutscene, etc.)
//   - Chapter and path tags when assigned
//   - Flag/status indicators when flags_set or status_set are non-empty
//   - Simulation state overlays (active pulse, locked, complete, etc.)
//   - Seen state icon (unseen, partially_seen, seen)
//
// Architecture rules enforced:
//   AR-02: reads global state from Zustand stores
//   AR-09: CSS consumes tokens only (CommonNodeRenderer.css)
// ============================================================

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Circle,
  Flag,
  BarChart3,
  BookOpen,
  GitBranch,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';

import './CommonNodeRenderer.css';

/**
 * Resolve chapter/path names from their IDs.
 *
 * @param {string|null} chapterId
 * @param {string|null} pathId
 * @param {object} chapterMap - chapter slice from narrative store
 * @param {object} pathMap - path slice from narrative store
 * @returns {{ chapterName, pathName }}
 */
function resolveTagNames(chapterId, pathId, chapterMap, pathMap) {
  const chapterName = chapterId ? (chapterMap[chapterId]?.name || chapterId) : null;
  const pathName = pathId ? (pathMap[pathId]?.name || pathId) : null;
  return { chapterName, pathName };
}

/**
 * Compute the CSS modifier class for a simulation status.
 *
 * @param {string} status
 * @returns {string} CSS class suffix
 */
function statusModifier(status) {
  switch (status) {
    case 'active': return 'common-node--active';
    case 'locked': return 'common-node--locked';
    case 'complete': return 'common-node--complete';
    case 'failed': return 'common-node--failed';
    case 'branch_locked': return 'common-node--branch-locked';
    default: return '';
  }
}

/**
 * Custom React Flow node component for Common Nodes.
 *
 * @param {{ data: { entity: object, entityType: string } }} props
 */
function CommonNodeRenderer({ data }) {
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
  const { chapterName, pathName } = resolveTagNames(
    entity.chapter, entity.path, chapterMap, pathMap
  );

  const hasTags = chapterName || pathName;
  const hasFlags = entity.flags_set?.length > 0;
  const hasStatuses = entity.status_set?.length > 0;
  const hasIndicators = hasFlags || hasStatuses;

  const stateClass = statusModifier(status);
  const unreachableClass = isUnreachable ? 'common-node--unreachable' : '';
  const rootClasses = ['common-node', stateClass, unreachableClass].filter(Boolean).join(' ');

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className={rootClasses} style={{ position: 'relative' }}>

        {/* State badge (top-right corner) */}
        {status === 'complete' && (
          <div className="common-node__state-badge common-node__state-badge--complete">
            <Check size={11} />
          </div>
        )}
        {status === 'failed' && (
          <div className="common-node__state-badge common-node__state-badge--failed">
            <X size={11} />
          </div>
        )}
        {isUnreachable && (
          <div className="common-node__state-badge common-node__state-badge--unreachable" title="Unreachable from entry node">
            <AlertTriangle size={11} />
          </div>
        )}

        {/* Header: icon + name + type badge */}
        <div className="common-node__header">
          <div className="common-node__icon">
            <Circle size={14} />
          </div>
          <span className={`common-node__name${!entity.name ? ' common-node__name--empty' : ''}`}>
            {entity.name || 'Untitled'}
          </span>
          {entity.type && (
            <span className="common-node__type-badge">
              {entity.type}
            </span>
          )}
          {/* Seen badge */}
          {seen === 'partially_seen' && (
            <div className="common-node__seen-badge common-node__seen-badge--partially" title="Partially seen">
              <EyeOff size={12} />
            </div>
          )}
          {seen === 'seen' && (
            <div className="common-node__seen-badge common-node__seen-badge--seen" title="Seen">
              <Eye size={12} />
            </div>
          )}
        </div>

        {/* Body: tags + indicators */}
        {(hasTags || hasIndicators) && (
          <div className="common-node__body">
            {/* Chapter / Path tags */}
            {hasTags && (
              <div className="common-node__tags">
                {chapterName && (
                  <span className="common-node__tag common-node__tag--chapter">
                    <BookOpen size={10} className="common-node__tag-icon" />
                    {chapterName}
                  </span>
                )}
                {pathName && (
                  <span className="common-node__tag common-node__tag--path">
                    <GitBranch size={10} className="common-node__tag-icon" />
                    {pathName}
                  </span>
                )}
              </div>
            )}

            {/* Flag / Status indicators */}
            {hasIndicators && (
              <div className="common-node__indicators">
                {hasFlags && (
                  <span className="common-node__indicator common-node__indicator--flag">
                    <Flag size={10} className="common-node__indicator-icon" />
                    {entity.flags_set.length} flag{entity.flags_set.length !== 1 ? 's' : ''}
                  </span>
                )}
                {hasStatuses && (
                  <span className="common-node__indicator common-node__indicator--status">
                    <BarChart3 size={10} className="common-node__indicator-icon" />
                    {entity.status_set.length} status
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer: ID + outgoing count */}
        <div className="common-node__footer">
          <span className="common-node__id">{entity.id}</span>
          {entity.next?.length > 0 && (
            <span className="common-node__next-count">
              <ArrowRight size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
              {entity.next.length}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(CommonNodeRenderer);
