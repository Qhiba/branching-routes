import React, { memo, useMemo, useCallback, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import { useSimulationStore, useUIStore, useNarrativeStore } from 'store';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function ConditionalEdge(props) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;

  const showTraversalOverlay = useUIStore(s => s.showTraversalOverlay);
  const isTraversedOverlay = useSimulationStore(s => s.isCampaignActive && s.traversedEdgeIds.includes(id)) && showTraversalOverlay;
  const isConditionPass = useSimulationStore(s => s.isCampaignActive && s.reachableEdgeIds.includes(id));
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

  const showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay);
  const selectedRouteIndex = useUIStore(s => s.selectedRouteIndex);
  const shortestRouteResults = useSimulationStore(s => s.shortestRouteResults);
  const frozenWaypointEdgeIds = useUIStore(s => s.frozenWaypointEdgeIds);
  const mergedGroupEdgeIds = useUIStore(s => s.mergedGroupEdgeIds);

  const routeEdgeSet = useMemo(() => {
    if (!showShortestRouteOverlay || !shortestRouteResults || !shortestRouteResults[selectedRouteIndex]) {
      return null;
    }
    const s = new Set(shortestRouteResults[selectedRouteIndex].pathEdgeIds);
    mergedGroupEdgeIds.forEach(eid => s.add(eid));
    return s;
  }, [showShortestRouteOverlay, shortestRouteResults, selectedRouteIndex, mergedGroupEdgeIds]);

  const isRouteOverlay = routeEdgeSet?.has(id) ?? false;
  const isFrozenOverlay = frozenWaypointEdgeIds.length > 0 && frozenWaypointEdgeIds.includes(id);

  const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
  const flagDict = useNarrativeStore(s => s.flag);
  const statusDict = useNarrativeStore(s => s.status);
  const flagKeys = Object.keys(flagDict);
  const statusKeys = Object.keys(statusDict);
  const updateEdge = useNarrativeStore(s => s.updateEdge);

  const { screenToFlowPosition } = useReactFlow();

  // Bend control — centerX drives where the vertical segment sits
  const bendX = data?.bendX;
  const centerX = bendX !== undefined
    ? sourceX + (targetX - sourceX) * bendX
    : undefined;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerX,
  });

  // Handle position: on the vertical segment, vertically centred between source and target
  const stepX = centerX ?? (sourceX + targetX) / 2;
  const handleY = (sourceY + targetY) / 2;
  const showBendHandle = !isCampaignActive && Math.abs(targetX - sourceX) >= 32;

  const isDraggingRef = useRef(false);

  const onHandleMouseDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      const dx = targetX - sourceX;
      if (Math.abs(dx) < 1) return;
      updateEdge(id, { bendX: clamp((flowPos.x - sourceX) / dx, 0.05, 0.95) });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [id, sourceX, targetX, updateEdge, screenToFlowPosition]);

  const onHandleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    updateEdge(id, { bendX: undefined });
  }, [id, updateEdge]);

  const onLabelMouseDown = useCallback((e) => {
    if (isCampaignActive) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffsetX = data?.labelOffsetX || 0;
    const startOffsetY = data?.labelOffsetY || 0;

    const onMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const p1 = screenToFlowPosition({ x: startX, y: startY });
      const p2 = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      updateEdge(id, {
        labelOffsetX: startOffsetX + (p2.x - p1.x),
        labelOffsetY: startOffsetY + (p2.y - p1.y)
      });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [id, isCampaignActive, data, updateEdge, screenToFlowPosition]);

  const onLabelDoubleClick = useCallback((e) => {
    if (isCampaignActive) return;
    e.stopPropagation();
    updateEdge(id, { labelOffsetX: undefined, labelOffsetY: undefined });
  }, [id, isCampaignActive, updateEdge]);

  let className = 'conditional-edge';
  if (isFrozenOverlay) {
    className += ' conditional-edge--frozen-overlay';
  } else if (isRouteOverlay) {
    className += ' conditional-edge--route-overlay';
  } else if (isTraversedOverlay) {
    className += ' conditional-edge--traversal-overlay';
  } else if (isConditionPass) {
    className += ' conditional-edge--condition-pass';
  }

  const label = data?.label;
  const condition = data?.condition;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} className={className} interactionWidth={20} />

      {showBendHandle && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan edge-bend-handle"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${stepX}px,${handleY}px)`,
            }}
            onMouseDown={onHandleMouseDown}
            onDoubleClick={onHandleDoubleClick}
            title="Drag to move edge bend · Double-click to reset"
          >
            ⠿
          </div>
        </EdgeLabelRenderer>
      )}

      {(label || condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + (data?.labelOffsetX || 0)}px,${labelY + (data?.labelOffsetY || 0)}px)`
            }}
            className={`nodrag nopan conditional-edge__label-container ${!isCampaignActive ? 'conditional-edge__label-container--draggable' : ''}`}
            onMouseDown={!isCampaignActive ? onLabelMouseDown : undefined}
            onDoubleClick={!isCampaignActive ? onLabelDoubleClick : undefined}
            title={!isCampaignActive ? "Drag to move label · Double-click to reset" : undefined}
          >
            {labelDisplayMode === 'compact' ? (
              <>
                {label && <span className="conditional-edge__label">{label}</span>}
                {condition && condition.operator && (
                  <span className="conditional-edge__condition-badge">{condition.operator}</span>
                )}
              </>
            ) : (
              <div className="edge-label__verbose">
                {label && <span className="conditional-edge__label">{label}</span>}
                {condition && condition.conditions && (
                  <>
                    {condition.conditions.length > 1 && (
                      <div className="edge-operator-badge">{condition.operator?.toUpperCase()}</div>
                    )}
                    {[...condition.conditions]
                      .sort((a, b) => {
                        const isAFlag = 'flag' in a;
                        const isBFlag = 'flag' in b;
                        if (isAFlag && !isBFlag) return -1;
                        if (!isAFlag && isBFlag) return 1;
                        if (isAFlag && isBFlag) {
                          return flagKeys.indexOf(a.flag) - flagKeys.indexOf(b.flag);
                        }
                        return statusKeys.indexOf(a.status) - statusKeys.indexOf(b.status);
                      })
                      .map((clause, idx) => {
                      if ('flag' in clause) {
                        const flagName = flagDict[clause.flag]?.name || 'Unknown';
                        const pillClass = clause.state ? 'edge-clause-pill--flag-true' : 'edge-clause-pill--flag-false';
                        return (
                          <div key={idx} className={`edge-clause-pill ${pillClass}`}>
                            {flagName} = {clause.state ? 'true' : 'false'}
                          </div>
                        );
                      } else if ('status' in clause) {
                        let text = statusDict[clause.status]?.name || 'Unknown';
                        if (clause.min !== undefined && clause.max !== undefined) {
                          text += ` [${clause.min}…${clause.max}]`;
                        } else if (clause.min !== undefined) {
                          text += ` ≥ ${clause.min}`;
                        } else if (clause.max !== undefined) {
                          text += ` ≤ ${clause.max}`;
                        }
                        return (
                          <div key={idx} className="edge-clause-pill edge-clause-pill--status">
                            {text}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConditionalEdge);
