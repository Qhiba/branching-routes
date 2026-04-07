// ============================================================
// ChoiceNodeRenderer.jsx — Custom node for Choices
// ============================================================
// Renders a rich card displaying:
//   - Prompt text (or "Untitled Choice" placeholder)
//   - Option count badge
//   - Condition indicator when requires has conditions
//   - Chapter and path tags when assigned
//   - Simulation state overlays (active pulse, locked, etc.)
//
// Architecture rules enforced:
//   AR-02: reads global state from Zustand stores
//   AR-09: CSS consumes tokens only (ChoiceNodeRenderer.css)
// ============================================================

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Diamond,
  BookOpen,
  GitBranch,
  ShieldAlert,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';

import './ChoiceNodeRenderer.css';

/**
 * Compute the CSS modifier class for a simulation status.
 *
 * @param {string} status
 * @returns {string} CSS class suffix
 */
function statusModifier(status) {
  switch (status) {
    case 'active': return 'choice-node--active';
    case 'locked': return 'choice-node--locked';
    case 'complete': return 'choice-node--complete';
    case 'failed': return 'choice-node--failed';
    case 'branch_locked': return 'choice-node--branch-locked';
    default: return '';
  }
}

/**
 * Custom React Flow node component for Choices.
 *
 * @param {{ data: { entity: object, entityType: string } }} props
 */
function ChoiceNodeRenderer({ data }) {
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
  const sourcePos = handleOrientation === 'horizontal' ? Position.Right : Position.Bottom;

  const chapterName = entity.chapter
    ? (chapterMap[entity.chapter]?.name || entity.chapter)
    : null;
  const pathName = entity.path
    ? (pathMap[entity.path]?.name || entity.path)
    : null;

  const hasTags = chapterName || pathName;
  const optionCount = entity.options?.length ?? 0;
  const hasConditions = entity.requires?.conditions?.length > 0;

  const stateClass = statusModifier(status);
  const unreachableClass = isUnreachable ? 'choice-node--unreachable' : '';
  const rootClasses = ['choice-node', stateClass, unreachableClass].filter(Boolean).join(' ');

  return (
    <>
      <Handle type="target" position={targetPos} />
      <div className={rootClasses} style={{ position: 'relative' }}>

        {/* State badge (top-right corner) */}
        {status === 'complete' && (
          <div className="choice-node__state-badge choice-node__state-badge--complete">
            <Check size={11} />
          </div>
        )}
        {status === 'failed' && (
          <div className="choice-node__state-badge choice-node__state-badge--failed">
            <X size={11} />
          </div>
        )}
        {isUnreachable && (
          <div className="choice-node__state-badge choice-node__state-badge--unreachable" title="Unreachable from entry node">
            <AlertTriangle size={11} />
          </div>
        )}

        {/* Header: icon + label + option count */}
        <div className="choice-node__header">
          <div className="choice-node__icon">
            <Diamond size={14} />
          </div>
          <span className="choice-node__label">Choice</span>
          <span className="choice-node__option-badge">
            {optionCount} opt{optionCount !== 1 ? 's' : ''}
          </span>
          {/* Seen badge */}
          {seen === 'partially_seen' && (
            <div className="choice-node__seen-badge choice-node__seen-badge--partially" title="Partially seen">
              <EyeOff size={12} />
            </div>
          )}
          {seen === 'seen' && (
            <div className="choice-node__seen-badge choice-node__seen-badge--seen" title="Seen">
              <Eye size={12} />
            </div>
          )}
        </div>

        {/* Body: text + condition indicator + tags */}
        <div className="choice-node__body">
          <span className={`choice-node__text${!entity.text ? ' choice-node__text--empty' : ''}`}>
            {entity.text || 'Untitled Choice'}
          </span>

          {/* Condition indicator */}
          {hasConditions && (
            <div className="choice-node__condition-indicator">
              <ShieldAlert size={10} className="choice-node__condition-icon" />
              Conditional
            </div>
          )}

          {/* Chapter / Path tags */}
          {hasTags && (
            <div className="choice-node__tags">
              {chapterName && (
                <span className="choice-node__tag choice-node__tag--chapter">
                  <BookOpen size={10} className="choice-node__tag-icon" />
                  {chapterName}
                </span>
              )}
              {pathName && (
                <span className="choice-node__tag choice-node__tag--path">
                  <GitBranch size={10} className="choice-node__tag-icon" />
                  {pathName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: ID */}
        <div className="choice-node__footer">
          <span className="choice-node__id">{entity.id}</span>
        </div>
      </div>
      <Handle type="source" position={sourcePos} />
    </>
  );
}

export default memo(ChoiceNodeRenderer);
