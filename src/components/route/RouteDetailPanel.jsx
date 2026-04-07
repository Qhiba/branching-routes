// ============================================================
// RouteDetailPanel.jsx — Expandable step-by-step route breakdown
// ============================================================
// Displays an annotated path as a vertical step list, showing
// each node's chapter, path, flags set, and status deltas.
//
// Props:
//   annotatedPath — AnnotatedPath from pathAnnotator
//   onClose — callback to dismiss the panel
//
// Dependencies: pathAnnotator (types only)
// Architecture: AR-01, AR-09
// ============================================================

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Flag,
  BarChart3,
  MapPin,
  BookOpen,
  Route,
  X,
  ArrowRight,
  Circle,
  CircleDot,
  CircleX,
} from 'lucide-react';

// ── Inline styles (will be refactored to CSS in Phase 13) ──
// AMBIGUOUS: RouteDetailPanel has no dedicated CSS file in the plan's
// file map, but it says "Expandable step-by-step route breakdown".
// Using token-based inline styles to avoid creating an unlisted file.

const PANEL_STYLES = {
  container: {
    position: 'fixed',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '340px',
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    zIndex: 'var(--z-inspector)',
    fontFamily: 'var(--font-family)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-subtle)',
    position: 'sticky',
    top: 0,
    background: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    zIndex: 1,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-tertiary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepList: {
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
  },
  stepItem: {
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    transition: 'background 120ms ease',
  },
  stepItemHover: {
    background: 'var(--color-bg-tertiary)',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepNumber: {
    width: '22px',
    height: '22px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-accent-cyan-muted)',
    color: 'var(--color-accent-cyan)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-bold)',
    fontFamily: 'var(--font-family-mono)',
    flexShrink: 0,
  },
  stepNumberFirst: {
    background: 'var(--color-accent-green-muted)',
    color: 'var(--color-accent-green)',
  },
  stepNumberLast: {
    background: 'var(--color-accent-red-muted)',
    color: 'var(--color-accent-red)',
  },
  stepName: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  stepId: {
    fontSize: 'var(--font-size-xs)',
    fontFamily: 'var(--font-family-mono)',
    color: 'var(--color-text-tertiary)',
    flexShrink: 0,
  },
  stepDetails: {
    marginLeft: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '4px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
  },
  detailBadge: {
    padding: '1px 6px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    fontFamily: 'var(--font-family-mono)',
  },
  flagBadge: {
    background: 'var(--color-accent-amber-muted)',
    color: 'var(--color-accent-amber)',
  },
  statusBadge: {
    background: 'var(--color-accent-cyan-muted)',
    color: 'var(--color-accent-cyan)',
  },
  chapterBadge: {
    background: 'var(--color-accent-pink-muted)',
    color: 'var(--color-accent-pink)',
  },
  pathBadge: {
    background: 'var(--color-accent-green-muted)',
    color: 'var(--color-accent-green)',
  },
  connector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 0',
    marginLeft: '26px',
    color: 'var(--color-text-tertiary)',
  },
  connectorLine: {
    width: '1px',
    height: '12px',
    background: 'var(--color-border-subtle)',
  },
  conditionFailed: {
    color: 'var(--color-accent-red)',
    fontSize: 'var(--font-size-xs)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '30px',
  },
  emptyState: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--color-text-tertiary)',
    fontSize: 'var(--font-size-sm)',
  },
};

/**
 * RouteDetailPanel — expandable step-by-step breakdown of a traced route.
 *
 * @param {object} props
 * @param {object|null} props.annotatedPath — AnnotatedPath from pathAnnotator
 * @param {function} props.onClose — callback to dismiss the panel
 */
function RouteDetailPanel({ annotatedPath, onClose }) {
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  if (!annotatedPath || !annotatedPath.steps || annotatedPath.steps.length === 0) {
    return null;
  }

  const toggleStep = (index) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const { steps, totalNodes } = annotatedPath;

  return (
    <div style={PANEL_STYLES.container} id="route-detail-panel">
      {/* Header */}
      <div style={PANEL_STYLES.header}>
        <h3 style={PANEL_STYLES.headerTitle}>
          <Route size={16} />
          Route Details ({totalNodes} steps)
        </h3>
        <button
          style={PANEL_STYLES.closeBtn}
          onClick={onClose}
          title="Close"
          id="route-detail-close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Step list */}
      <div style={PANEL_STYLES.stepList}>
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(index);
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const hasDetails =
            step.chapterName ||
            step.pathName ||
            step.flagsSet.length > 0 ||
            step.statusDeltas.length > 0;

          return (
            <div key={`${step.nodeId}-${index}`}>
              {/* Step item */}
              <div
                style={PANEL_STYLES.stepItem}
                onClick={() => toggleStep(index)}
                id={`route-step-${index}`}
              >
                <div style={PANEL_STYLES.stepHeader}>
                  {/* Expand icon */}
                  {hasDetails ? (
                    isExpanded
                      ? <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                      : <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: '12px', flexShrink: 0 }} />
                  )}

                  {/* Step number badge */}
                  <span
                    style={{
                      ...PANEL_STYLES.stepNumber,
                      ...(isFirst ? PANEL_STYLES.stepNumberFirst : {}),
                      ...(isLast ? PANEL_STYLES.stepNumberLast : {}),
                    }}
                  >
                    {index + 1}
                  </span>

                  {/* Name */}
                  <span style={PANEL_STYLES.stepName}>{step.name}</span>

                  {/* ID */}
                  <span style={PANEL_STYLES.stepId}>{step.nodeId}</span>
                </div>

                {/* Expanded details */}
                {isExpanded && hasDetails && (
                  <div style={PANEL_STYLES.stepDetails}>
                    {/* Chapter */}
                    {step.chapterName && (
                      <div style={PANEL_STYLES.detailRow}>
                        <BookOpen size={11} />
                        <span
                          style={{
                            ...PANEL_STYLES.detailBadge,
                            ...PANEL_STYLES.chapterBadge,
                          }}
                        >
                          {step.chapterName}
                        </span>
                      </div>
                    )}

                    {/* Path */}
                    {step.pathName && (
                      <div style={PANEL_STYLES.detailRow}>
                        <MapPin size={11} />
                        <span
                          style={{
                            ...PANEL_STYLES.detailBadge,
                            ...PANEL_STYLES.pathBadge,
                          }}
                        >
                          {step.pathName}
                        </span>
                      </div>
                    )}

                    {/* Flags set */}
                    {step.flagsSet.map((f) => (
                      <div key={f.id} style={PANEL_STYLES.detailRow}>
                        <Flag size={11} />
                        <span
                          style={{
                            ...PANEL_STYLES.detailBadge,
                            ...PANEL_STYLES.flagBadge,
                          }}
                        >
                          {f.name} = true
                        </span>
                      </div>
                    ))}

                    {/* Status deltas */}
                    {step.statusDeltas.map((d, di) => (
                      <div key={di} style={PANEL_STYLES.detailRow}>
                        <BarChart3 size={11} />
                        <span
                          style={{
                            ...PANEL_STYLES.detailBadge,
                            ...PANEL_STYLES.statusBadge,
                          }}
                        >
                          {d.statusName} {d.amount >= 0 ? '+' : ''}{d.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connector between steps */}
              {!isLast && (
                <div style={PANEL_STYLES.connector}>
                  <div style={PANEL_STYLES.connectorLine} />
                </div>
              )}

              {/* Edge condition failed warning */}
              {step.edgeConditionMet === false && (
                <div style={PANEL_STYLES.conditionFailed}>
                  <CircleX size={11} />
                  Condition fails on this edge
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RouteDetailPanel;
