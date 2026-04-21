import React, { memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';

function ConditionalEdge(props) {
  const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  // ADDED: Phase 2 — traversal overlay toggle (AR-14: boolean primitive, not array)
  const showTraversalOverlay = useUIStore(s => s.showTraversalOverlay);
  // MODIFIED: Phase 2 — compute traversal overlay state gated on toggle
  const isTraversedOverlay = useSimulationStore(s => s.isCampaignActive && s.traversedEdgeIds.includes(id)) && showTraversalOverlay;
  const isConditionPass = useSimulationStore(s => s.isCampaignActive && s.reachableEdgeIds.includes(id));

  // ADDED: Phase 4 — shortest-route overlay selectors
  const showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay);
  const selectedRouteIndex = useUIStore(s => s.selectedRouteIndex);
  const shortestRouteResults = useSimulationStore(s => s.shortestRouteResults);

  // ADDED: Phase 4 — compute route edge set for overlay (AR-14: memoized, not recomputed on every render)
  const routeEdgeSet = useMemo(() => {
    if (!showShortestRouteOverlay || !shortestRouteResults || !shortestRouteResults[selectedRouteIndex]) {
      return null;
    }
    return new Set(shortestRouteResults[selectedRouteIndex].pathEdgeIds);
  }, [showShortestRouteOverlay, shortestRouteResults, selectedRouteIndex]);

  // ADDED: Phase 4 — check if this edge is on the selected route
  const isRouteOverlay = routeEdgeSet?.has(id) ?? false;

  // ADDED: Phase 2 label display mode
  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
  const flagDict = useNarrativeStore(s => s.flag);
  const statusDict = useNarrativeStore(s => s.status);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let className = 'conditional-edge';
  // MODIFIED: Phase 4 — apply route overlay (takes precedence), then traversal overlay, then condition-pass
  if (isRouteOverlay) {
    className += ' conditional-edge--route-overlay';
  } else if (isTraversedOverlay) {
    className += ' conditional-edge--traversal-overlay';
  } else if (isConditionPass) {
    className += ' conditional-edge--condition-pass';
  }
  // PROTECTED: --condition-pass animation unchanged; priority order: route > traversal > condition-pass

  const label = data?.label;
  const condition = data?.condition;


  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} className={className} interactionWidth={20} />
      {(label || condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan conditional-edge__label-container"
          >
            {labelDisplayMode === 'compact' ? (
              <>
                {label && <span className="conditional-edge__label">{label}</span>}
                {condition && condition.operator && (
                  <span className="conditional-edge__condition-badge">{condition.operator}</span>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px' }}>
                {label && <span className="conditional-edge__label" style={{ fontWeight: 'bold' }}>{label}</span>}
                {condition && condition.conditions && condition.conditions.map((clause, idx) => {
                  let text = '';
                  if ('flag' in clause) {
                    text = `${flagDict[clause.flag]?.name || 'Unknown'} = ${clause.state}`;
                  } else if ('status' in clause) {
                    text = `${statusDict[clause.status]?.name || 'Unknown'}`;
                    if (clause.min !== undefined && clause.max !== undefined) {
                      text += ` [${clause.min}...${clause.max}]`;
                    } else if (clause.min !== undefined) {
                      text += ` >= ${clause.min}`;
                    } else if (clause.max !== undefined) {
                      text += ` <= ${clause.max}`;
                    }
                  }
                  return (
                    <div key={idx} style={{ color: 'var(--color-primary)' }}>
                      {idx > 0 ? <span style={{ color: 'var(--color-text-secondary)' }}>{condition.operator === 'and' ? 'AND ' : 'OR '}</span> : ''}
                      {text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConditionalEdge);
