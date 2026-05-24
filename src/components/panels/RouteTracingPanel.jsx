// CHANGED: Ported logic from RouteFinderDialog to an embedded panel
// PRESERVED: computeRoutesFromStart and core pathfinding logic remain untouched
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNarrativeStore, useUIStore, useSimulationStore, useCampaignStore } from 'store';
import { simulateFlagStateAlongPath, findMergeGroups, buildRouteSnapshot } from 'utils';
import { X, Check, Route, Trash2, Loader2, Snowflake, ChevronDown, ChevronRight, ChevronLeft, Bookmark, Locate } from 'lucide-react';
import './RightPanels.css';

// axes: [{ pos, nodeName, sourceNodeId, options: [{ edgeId, label }] }]
// groupPaths: [{ idx, pathEdgeIds }]
function SaveCampaignModal({ group, axes, groupPaths, nameRef, onSave, onClose }) {
    const [name, setName] = useState('');
    const [autoPickFirst, setAutoPickFirst] = useState(false);
    const [nodePos, setNodePos] = useState(0); // which axis (node) we're viewing
    // picks: { [axisPos]: edgeId } — one pick per divergence node
    const [picks, setPicks] = useState(() =>
        Object.fromEntries((axes || []).map(a => [a.pos, a.options[0]?.edgeId]))
    );

    const isMerged = axes && axes.length > 0;
    const currentAxis = axes?.[nodePos];

    const resolvedIdx = (() => {
        if (!isMerged || autoPickFirst) return group[0];
        const match = groupPaths.find(({ pathEdgeIds }) =>
            axes.every(axis => pathEdgeIds[axis.pos] === picks[axis.pos])
        );
        return match?.idx ?? group[0];
    })();

    const handleConfirm = () => {
        if (!name.trim()) return;
        onSave(group, name, resolvedIdx);
    };

    return (
        <div className="save-campaign-modal__overlay" onClick={onClose}>
            <div className="save-campaign-modal" onClick={e => e.stopPropagation()}>
                <div className="save-campaign-modal__header">
                    <span className="save-campaign-modal__title">Save Route as Campaign</span>
                    <button className="save-campaign-modal__close" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="save-campaign-modal__body">
                    <label className="save-campaign-modal__label">Campaign Name</label>
                    <input
                        ref={nameRef}
                        className="save-campaign-modal__input"
                        placeholder="Campaign name…"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose(); }}
                    />

                    {isMerged && (
                        <>
                            <label className="save-campaign-modal__label save-campaign-modal__label--toggle">
                                <input
                                    type="checkbox"
                                    checked={autoPickFirst}
                                    onChange={e => setAutoPickFirst(e.target.checked)}
                                    className="save-campaign-modal__checkbox"
                                />
                                Auto-pick first option
                            </label>

                            {!autoPickFirst && currentAxis && (
                                <>
                                    <label className="save-campaign-modal__label">Option to record</label>
                                    <div className="save-campaign-modal__option-card">
                                        {/* Node header with navigator */}
                                        <div className="save-campaign-modal__option-card-header">
                                            <div className="save-campaign-modal__option-node-row">
                                                <span className="save-campaign-modal__option-node">{currentAxis.nodeName}</span>
                                                {currentAxis.sourceNodeId && (
                                                    <button
                                                        type="button"
                                                        className="save-campaign-modal__option-focus"
                                                        title="Focus node on canvas"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: currentAxis.sourceNodeId } }))}
                                                    >
                                                        <Locate size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            {axes.length > 1 && (
                                                <div className="save-campaign-modal__option-nav">
                                                    <button type="button" onClick={() => setNodePos(p => Math.max(0, p - 1))} disabled={nodePos === 0}><ChevronLeft size={13} /></button>
                                                    <span>{nodePos + 1} / {axes.length}</span>
                                                    <button type="button" onClick={() => setNodePos(p => Math.min(axes.length - 1, p + 1))} disabled={nodePos === axes.length - 1}><ChevronRight size={13} /></button>
                                                </div>
                                            )}
                                        </div>
                                        {/* Radio options for current node */}
                                        <div className="save-campaign-modal__option-radios">
                                            {currentAxis.options.map(opt => (
                                                <label key={opt.edgeId} className={`save-campaign-modal__option-row${picks[currentAxis.pos] === opt.edgeId ? ' save-campaign-modal__option-row--selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name={`axis-${currentAxis.pos}`}
                                                        checked={picks[currentAxis.pos] === opt.edgeId}
                                                        onChange={() => setPicks(p => ({ ...p, [currentAxis.pos]: opt.edgeId }))}
                                                        className="save-campaign-modal__option-radio"
                                                    />
                                                    <span className="save-campaign-modal__option-label">"{opt.label}"</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="save-campaign-modal__footer">
                    <button className="save-campaign-modal__cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="save-campaign-modal__confirm"
                        onClick={handleConfirm}
                        disabled={!name.trim()}
                    >
                        Save Campaign
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RouteTracingPanel() {
    const selectedNodeId = useUIStore(s => s.selectedNodeId);
    const toggleShortestRouteOverlay = useUIStore(s => s.toggleShortestRouteOverlay);
    const showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay);
    const selectedRouteIndex = useUIStore(s => s.selectedRouteIndex);
    const setSelectedRouteIndex = useUIStore(s => s.setSelectedRouteIndex);
    const setFrozenWaypointEdgeIds = useUIStore(s => s.setFrozenWaypointEdgeIds);
    const setMergedGroupEdgeIds = useUIStore(s => s.setMergedGroupEdgeIds);

    const computeRoutesFromStart = useSimulationStore(s => s.computeRoutesFromStart);
    const setRouteResults = useSimulationStore(s => s.setRouteResults);
    // FIX 8: read results directly from store; clearRouteResults replaces local setRouteResults(null)
    const shortestRouteResults = useSimulationStore(s => s.shortestRouteResults);
    const clearRouteResults = useSimulationStore(s => s.clearRouteResults);

    const common = useNarrativeStore(s => s.common || {});
    const choice = useNarrativeStore(s => s.choice || {});
    const ending = useNarrativeStore(s => s.ending || {});
    const edges = useNarrativeStore(s => s.edges);
    const flag = useNarrativeStore(s => s.flag || {});
    const status = useNarrativeStore(s => s.status || {});
    const chapter = useNarrativeStore(s => s.chapter || {});
    const path = useNarrativeStore(s => s.path || {});

    const addCampaign = useCampaignStore(s => s.addCampaign);
    const updateCampaign = useCampaignStore(s => s.updateCampaign);

    const [priorities, setPriorities] = useState([]);
    const [pathCap, setPathCap] = useState(50);
    const [searchAll, setSearchAll] = useState(false);
    const [searchDepth, setSearchDepth] = useState(-1);
    const [isTracing, setIsTracing] = useState(false);
    const cancelledRef = useRef(false);

    // Freeze waypoints — array scaffold for future multi-freeze; only index 0 used now.
    // Each waypoint: { id, nodeId, optionId, flagStateAfter, frozenEdgeIds }
    const [waypoints, setWaypoints] = useState([]);
    const [preWaypointResults, setPreWaypointResults] = useState(null);
    const [expandedRouteIndex, setExpandedRouteIndex] = useState(null);

    // Save to Campaign modal state: null when closed, or { group: number[] } when open
    const [saveCampaignModal, setSaveCampaignModal] = useState(null);
    const campaignNameRef = useRef(null);

    useEffect(() => {
        if (saveCampaignModal && campaignNameRef.current) {
            campaignNameRef.current.focus();
        }
    }, [saveCampaignModal]);

    // FIX 6: flat node map with type annotation for target card and route sequence
    const allNodeMap = useMemo(() => {
        const map = {};
        Object.values(common).forEach(n => { map[n.id] = { ...n, nodeType: 'Common' }; });
        Object.values(choice).forEach(n => { map[n.id] = { ...n, nodeType: 'Choice' }; });
        Object.values(ending).forEach(n => { map[n.id] = { ...n, nodeType: 'Ending' }; });
        return map;
    }, [common, choice, ending]);

    // FIX 8: edge map for reconstructing node sequences from pathEdgeIds
    const edgesMap = useMemo(() => {
        const map = {};
        (edges || []).forEach(e => { map[e.id] = e; });
        return map;
    }, [edges]);

    const allNodes = useMemo(() => Object.values(allNodeMap), [allNodeMap]);
    const startNode = useMemo(() => allNodes.find(n => n.data?.isStartNode), [allNodes]);

    const targetNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return allNodeMap[selectedNodeId] || null;
    }, [selectedNodeId, allNodeMap]);

    const targetNodeContext = useMemo(() => {
        if (!targetNode) return null;
        const chapterName = targetNode.data?.chapterId && chapter[targetNode.data.chapterId]
            ? chapter[targetNode.data.chapterId].name : null;
        const pathName = targetNode.data?.pathId && path[targetNode.data.pathId]
            ? path[targetNode.data.pathId].name : null;
        return { chapterName, pathName };
    }, [targetNode, chapter, path]);

    // FIX 7: flags and statuses as separate arrays for the split add dropdowns
    const flagOptions = useMemo(() => Object.values(flag).map(f => ({ id: f.id, name: f.name || 'Unnamed' })), [flag]);
    const statusOptions = useMemo(() => Object.values(status).map(s => ({ id: s.id, name: s.name || 'Unnamed' })), [status]);

    const flagPriorities = priorities.filter(p => p.type === 'flag');
    const statusPriorities = priorities.filter(p => p.type === 'status');

    const availableFlagIds = flagOptions.filter(f => !priorities.some(p => p.id === f.id));
    const availableStatusIds = statusOptions.filter(s => !priorities.some(p => p.id === s.id));

    const handleAddFlag = (id) => {
        if (!id) return;
        setPriorities([...priorities, { id, type: 'flag', preferredValue: true }]);
    };

    const handleAddStatus = (id) => {
        if (!id) return;
        setPriorities([...priorities, { id, type: 'status', operator: '>=', preferredValue: 0 }]);
    };

    const handleRunTrace = () => {
        if (!selectedNodeId || !startNode) return;
        // Clear any active freeze before a fresh trace
        setWaypoints([]);
        setPreWaypointResults(null);
        setExpandedRouteIndex(null);
        setFrozenWaypointEdgeIds([]);
        cancelledRef.current = false;
        setIsTracing(true);
        setTimeout(() => {
            if (cancelledRef.current) { setIsTracing(false); return; }
            setSelectedRouteIndex(0);
            const limit = searchAll ? Number.MAX_SAFE_INTEGER : (parseInt(pathCap) || 50);
            computeRoutesFromStart(startNode.id, selectedNodeId, priorities, limit, null, searchDepth);
            if (!showShortestRouteOverlay) toggleShortestRouteOverlay();
            setIsTracing(false);
        }, 400);
    };

    const handleCancelTrace = () => {
        cancelledRef.current = true;
        setIsTracing(false);
    };

    const handleStopTracing = () => {
        if (showShortestRouteOverlay) toggleShortestRouteOverlay();
        clearRouteResults();
        setWaypoints([]);
        setPreWaypointResults(null);
        setExpandedRouteIndex(null);
        setFrozenWaypointEdgeIds([]);
        setMergedGroupEdgeIds([]);
    };

    // Build the initial flag/status seed mirroring what computeRoutesFromStart does in edit mode
    const buildInitialSeed = () => {
        const seed = {};
        Object.values(flag).forEach(f => { seed[f.id] = f.state; });
        Object.values(status).forEach(s => { seed[s.id] = s.value; });
        return seed;
    };

    // Compute merge groups from current results
    const mergeGroups = useMemo(() => {
        if (!shortestRouteResults || shortestRouteResults.length === 0) return [];
        return findMergeGroups(shortestRouteResults, { edges, choice });
    }, [shortestRouteResults, edges, choice]);

    // Get the merged options info for a group: choice node name + per-option labels.
    // Finds divergence index once between group[0] and group[1], applies it to all routes.
    const getMergedInfo = useCallback((group) => {
        if (group.length < 2 || !shortestRouteResults) return { choiceNodeName: null, options: [] };
        const idsRef = shortestRouteResults[group[0]].pathEdgeIds;
        const idsOther = shortestRouteResults[group[1]].pathEdgeIds;
        let di = 0;
        while (di < idsRef.length && di < idsOther.length && idsRef[di] === idsOther[di]) di++;
        const firstDivEdge = edgesMap[shortestRouteResults[group[0]].pathEdgeIds[di]];
        const choiceNodeName = firstDivEdge ? (allNodeMap[firstDivEdge.sourceId]?.data?.label || 'Choice') : 'Choice';
        const options = group.map(idx => {
            const route = shortestRouteResults[idx];
            const divEdge = edgesMap[route.pathEdgeIds[di]];
            if (!divEdge?.optionId) return { idx, label: `Option ${idx + 1}` };
            const srcNode = choice[divEdge.sourceId];
            const opt = srcNode?.data?.options?.find(o => o.id === divEdge.optionId);
            return { idx, label: opt?.label || divEdge.optionId, sourceNodeId: divEdge.sourceId };
        });
        return { choiceNodeName, options };
    }, [shortestRouteResults, edgesMap, choice, allNodeMap]);

    // Finds every divergence axis in a merged group: one entry per choice node
    // where different paths take different options. Each axis has the node name,
    // source node ID, and the distinct options available at that position.
    const findMergedAxes = useCallback((group) => {
        if (!shortestRouteResults || group.length < 2) return [];
        const len = shortestRouteResults[group[0]].pathEdgeIds.length;
        const axes = [];
        for (let pos = 0; pos < len; pos++) {
            const edgeIds = group.map(idx => shortestRouteResults[idx].pathEdgeIds[pos]);
            const uniqueEdgeIds = [...new Set(edgeIds)];
            if (uniqueEdgeIds.length < 2) continue;
            const firstEdge = edgesMap[uniqueEdgeIds[0]];
            if (!firstEdge) continue;
            const nodeName = allNodeMap[firstEdge.sourceId]?.data?.label || 'Choice';
            const sourceNodeId = firstEdge.sourceId;
            const options = uniqueEdgeIds.map(edgeId => {
                const edge = edgesMap[edgeId];
                const srcNode = choice[edge?.sourceId];
                const opt = srcNode?.data?.options?.find(o => o.id === edge?.optionId);
                return { edgeId, label: opt?.label || edgeId };
            });
            axes.push({ pos, nodeName, sourceNodeId, options });
        }
        return axes;
    }, [shortestRouteResults, edgesMap, choice, allNodeMap]);

    const handleSaveCampaign = (group, campaignName, pickedIdx) => {
        if (!campaignName.trim() || !shortestRouteResults) return;
        const routeIdx = pickedIdx ?? group[0];
        const route = shortestRouteResults[routeIdx];
        const graphState = { edges, common, choice, ending };
        const snapshot = buildRouteSnapshot(route.pathEdgeIds, graphState, flag, status);
        const id = addCampaign(campaignName.trim());
        updateCampaign(id, { snapshot });
        setSaveCampaignModal(null);
    };

    // Freeze at a specific node position within a route.
    // nodeIndexInRoute: 1-based index into the route's node sequence (0 = start, which can't be frozen)
    const handleFreezeAt = (routeIndex, nodeIndexInRoute) => {
        const route = shortestRouteResults[routeIndex];
        if (!route || nodeIndexInRoute === 0) return;

        // Edges up to and including the one arriving at this node
        const frozenEdgeIds = route.pathEdgeIds.slice(0, nodeIndexInRoute);
        const freezeEdge = edgesMap[frozenEdgeIds[frozenEdgeIds.length - 1]];
        if (!freezeEdge) return;

        // Prepend frozen prefix if this trace is already post-waypoint
        const existingFrozen = waypoints[0]?.frozenEdgeIds ?? [];
        const fullFrozenEdgeIds = [...existingFrozen, ...frozenEdgeIds];

        const initialSeed = buildInitialSeed();
        const graphState = { common, choice, ending, edges };
        const flagStateAfter = simulateFlagStateAlongPath(fullFrozenEdgeIds, graphState, initialSeed);

        const waypoint = {
            id: `wp-${Date.now()}`,
            nodeId: freezeEdge.targetId,
            optionId: freezeEdge.optionId || null,
            flagStateAfter,
            frozenEdgeIds: fullFrozenEdgeIds,
        };

        // Save the current list so Clear Freeze can restore it; don't recalculate yet —
        // Re-Route is the explicit trigger for that. The existing items get red pills inline.
        setPreWaypointResults(preWaypointResults ?? shortestRouteResults);
        setWaypoints([waypoint]);
        setFrozenWaypointEdgeIds(fullFrozenEdgeIds);
        setExpandedRouteIndex(null);
    };

    const handleClearFreeze = () => {
        if (preWaypointResults) setRouteResults(preWaypointResults);
        setWaypoints([]);
        setPreWaypointResults(null);
        setExpandedRouteIndex(null);
        setFrozenWaypointEdgeIds([]);
    };

    const handleReRoute = () => {
        const wp = waypoints[0];
        if (!wp || !selectedNodeId) return;
        const limit = searchAll ? Number.MAX_SAFE_INTEGER : (parseInt(pathCap) || 50);
        computeRoutesFromStart(wp.nodeId, selectedNodeId, priorities, limit, wp.flagStateAfter, searchDepth);
        // Clear waypoint after re-routing so new results are not marked as impossible
        setWaypoints([]);
        setPreWaypointResults(null);
    };

    // Derives ordered [{id, label}] from an edge ID sequence
    const deriveRouteNodes = (pathEdgeIds) => {
        if (!pathEdgeIds?.length) return [];
        const firstEdge = edgesMap[pathEdgeIds[0]];
        if (!firstEdge) return [];
        const nodes = [{ id: firstEdge.sourceId, label: allNodeMap[firstEdge.sourceId]?.data?.label || '?' }];
        pathEdgeIds.forEach(eid => {
            const e = edgesMap[eid];
            if (e) nodes.push({ id: e.targetId, label: allNodeMap[e.targetId]?.data?.label || '?' });
        });
        return nodes;
    };

    // Set of indices in shortestRouteResults that don't pass through the active waypoint
    const impossibleRouteIndices = useMemo(() => {
        if (!waypoints.length || !shortestRouteResults) return new Set();
        const wp = waypoints[0];
        const indices = new Set();
        shortestRouteResults.forEach((route, i) => {
            const passes = route.pathEdgeIds.some(edgeId => {
                const edge = edgesMap[edgeId];
                if (!edge || edge.targetId !== wp.nodeId) return false;
                return !wp.optionId || edge.optionId === wp.optionId;
            });
            if (!passes) indices.add(i);
        });
        return indices;
    }, [waypoints, shortestRouteResults, edgesMap]);

    // FIX 9: clicking a route sets it as the active highlighted route on the canvas
    const handleRouteClick = useCallback((route, index, group) => {
        setSelectedRouteIndex(index);
        if (group && group.length > 1 && shortestRouteResults) {
            const allIds = new Set();
            group.forEach(idx => shortestRouteResults[idx].pathEdgeIds.forEach(eid => allIds.add(eid)));
            setMergedGroupEdgeIds([...allIds]);
        } else {
            setMergedGroupEdgeIds([]);
        }
        if (!route.pathEdgeIds?.length) return;
        const lastEdge = edgesMap[route.pathEdgeIds[route.pathEdgeIds.length - 1]];
        if (lastEdge?.targetId) {
            setTimeout(() => window.dispatchEvent(new CustomEvent('canvas-navigate-to-node', { detail: lastEdge.targetId })), 0);
        }
    }, [setSelectedRouteIndex, setMergedGroupEdgeIds, shortestRouteResults, edgesMap]);

    // FIX 8: results view — store-driven, not local state
    if (shortestRouteResults !== null) {
        const activeWaypoint = waypoints[0] ?? null;
        const frozenPrefixNodes = activeWaypoint ? deriveRouteNodes(activeWaypoint.frozenEdgeIds) : [];
        const frozenLabel = frozenPrefixNodes.length
            ? frozenPrefixNodes[frozenPrefixNodes.length - 1].label
            : null;

        return (
            <>
            <div className="trace-results">
                {/* 1. Status + freeze indicator row */}
                <div className="trace-results__status">
                    <div className="trace-results__status-dot" />
                    Trace Active on Canvas
                </div>

                {/* 2. Action buttons */}
                <div className="trace-results__actions">
                    <button onClick={handleStopTracing} className="trace-results__stop-btn">
                        <X size={14} /> Stop Trace
                    </button>
                    {activeWaypoint && (
                        <button onClick={handleClearFreeze} className="trace-results__clear-freeze-btn">
                            <X size={14} /> Clear Freeze
                        </button>
                    )}
                </div>

                {/* 3. Frozen prefix indicator */}
                {activeWaypoint && (
                    <div className="trace-results__freeze-indicator">
                        <Snowflake size={12} className="trace-results__freeze-icon" />
                        <span className="trace-results__freeze-label">Frozen at: <strong>{frozenLabel}</strong></span>
                        <button className="trace-results__reroute-btn" onClick={handleReRoute}>
                            <Route size={11} /> Re-Route
                        </button>
                    </div>
                )}

                {/* 4. Route list (new routes from freeze point, or full routes if no freeze) */}
                <div className="trace-results__header">
                    <Check size={12} className="trace-results__check-icon" />
                    {activeWaypoint
                        ? `Routes from freeze (${shortestRouteResults.length})`
                        : `Paths Found (${shortestRouteResults.length})`
                    }
                </div>

                <div className="trace-results__list">
                    {shortestRouteResults.length === 0 && (
                        <div className="trace-results__empty">No reachable paths found from start to target.</div>
                    )}
                    {mergeGroups.map((group, groupIdx) => {
                        const i = group[0];
                        const route = shortestRouteResults[i];
                        const isMerged = group.length > 1;
                        const nodes = deriveRouteNodes(route.pathEdgeIds);
                        const totalSteps = route.pathEdgeIds.length;
                        const isActive = group.includes(selectedRouteIndex);
                        const isExpanded = expandedRouteIndex === groupIdx;
                        const isImpossible = activeWaypoint ? group.every(idx => impossibleRouteIndices.has(idx)) : false;
                        const mergedInfo = isMerged ? getMergedInfo(group) : null;

                        return (
                            <div key={groupIdx} className={`trace-results__item${isActive ? ' trace-results__item--active' : ''}${isImpossible ? ' trace-results__item--impossible' : ''}`}>

                                {/* Left selector bar */}
                                <button
                                    className="trace-results__item-selector"
                                    onClick={isImpossible ? undefined : () => handleRouteClick(route, i, group)}
                                    disabled={isImpossible}
                                    title={isImpossible ? 'Not reachable' : 'Select route'}
                                >
                                    <span className="trace-results__item-num">{groupIdx + 1}</span>
                                </button>

                                {/* Card body */}
                                <div className="trace-results__item-body">

                                    {/* Row 1: Route label + expand button */}
                                    <div className="trace-results__item-row trace-results__item-row--header">
                                        <span className="trace-results__item-name">Route {groupIdx + 1}</span>
                                        <button
                                            className="trace-results__expand-btn"
                                            onClick={e => { e.stopPropagation(); setExpandedRouteIndex(isExpanded ? null : groupIdx); }}
                                            title={isExpanded ? 'Collapse' : 'Expand to freeze a node'}
                                        >
                                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        </button>
                                    </div>

                                    {/* Row 2: steps | options count | impossible badge */}
                                    <div className="trace-results__item-row">
                                        <span className="trace-results__item-steps">{totalSteps} steps</span>
                                        {isMerged && <span className="trace-results__merged-pill">{group.length} options</span>}
                                        {isImpossible && <span className="trace-results__item-badge--impossible">✗ No longer reachable</span>}
                                    </div>

                                    {/* Row 3: choice node name + option labels (merged only) */}
                                    {mergedInfo && (
                                        <div className="trace-results__item-row trace-results__item-options-info">
                                            <span className="trace-results__options-node">{mergedInfo.choiceNodeName}:</span>
                                            {mergedInfo.options.map((o, oi) => (
                                                <span key={o.idx}>
                                                    {oi > 0 && <span className="trace-results__merged-or"> or </span>}
                                                    <span className="trace-results__merged-option-label">"{o.label}"</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Row 4: start → end */}
                                    {nodes.length > 0 && (
                                        <div className="trace-results__item-row trace-results__item-ends">
                                            <span className="trace-results__item-end-label">{nodes[0].label}</span>
                                            <span className="trace-results__item-ends-arrow">→</span>
                                            <span className="trace-results__item-end-label">{nodes[nodes.length - 1].label}</span>
                                        </div>
                                    )}

                                    {/* Row 5: Save as Campaign — only when selected */}
                                    {isActive && !isImpossible && (
                                        <button
                                            className="trace-results__item-save-btn"
                                            onClick={e => { e.stopPropagation(); setSaveCampaignModal({ group, axes: findMergedAxes(group), groupPaths: group.map(idx => ({ idx, pathEdgeIds: shortestRouteResults[idx].pathEdgeIds })) }); }}
                                        >
                                            <Bookmark size={11} /> Save as Campaign
                                        </button>
                                    )}

                                    {/* Expanded freeze node list */}
                                    {isExpanded && (
                                        <div className="trace-results__node-list">
                                            {nodes.map((node, ni) => {
                                                const canFreeze = ni > 0 && ni < nodes.length - 1;
                                                const routeNodeIndex = activeWaypoint
                                                    ? ni - activeWaypoint.frozenEdgeIds.length
                                                    : ni;
                                                const isFrozenNode = activeWaypoint && ni <= activeWaypoint.frozenEdgeIds.length;
                                                return (
                                                    <div key={ni} className={`trace-results__node-row${isFrozenNode ? ' trace-results__node-row--frozen' : ''}`}>
                                                        <span className="trace-results__node-label">{node.label}</span>
                                                        {canFreeze && !isFrozenNode && (
                                                            <button
                                                                className="trace-results__freeze-btn"
                                                                title={`Freeze at ${node.label}`}
                                                                onClick={() => handleFreezeAt(i, routeNodeIndex)}
                                                            >
                                                                <Snowflake size={11} />
                                                            </button>
                                                        )}
                                                        {isFrozenNode && ni > 0 && (
                                                            <Snowflake size={11} className="trace-results__frozen-marker" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Save to Campaign modal */}
            {saveCampaignModal && (
                <SaveCampaignModal
                    group={saveCampaignModal.group}
                    axes={saveCampaignModal.axes}
                    groupPaths={saveCampaignModal.groupPaths}
                    nameRef={campaignNameRef}
                    onSave={handleSaveCampaign}
                    onClose={() => setSaveCampaignModal(null)}
                />
            )}
            </>
        );
    }

    // Node type label helper for target card
    const getTypeLabel = (node) => node?.nodeType || null;
    const typeColorClass = { Common: 'trace-panel__type--common', Choice: 'trace-panel__type--choice', Ending: 'trace-panel__type--ending' };

    return (
        <div className="trace-panel custom-scrollbar">
            {/* FIX 6: Target Node — label + type badge + one-line description */}
            <div className="trace-panel__section">
                <label className="trace-panel__label">Target Node</label>
                {targetNode ? (
                    <div className="trace-panel__target">
                        <div className="trace-panel__target-top">
                            <div className="trace-panel__target-name">{targetNode.data?.label || 'Unnamed'}</div>
                            {getTypeLabel(targetNode) && (
                                <span className={`trace-panel__type-badge ${typeColorClass[getTypeLabel(targetNode)] || ''}`}>
                                    {getTypeLabel(targetNode)}
                                </span>
                            )}
                        </div>
                        {targetNode.data?.content && (
                            <div className="trace-panel__target-desc">{targetNode.data.content}</div>
                        )}
                        {(targetNodeContext?.chapterName || targetNodeContext?.pathName) && (
                            <div className="trace-panel__target-context">
                                {[targetNodeContext.chapterName, targetNodeContext.pathName].filter(Boolean).join(' • ')}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="trace-panel__target-empty">
                        Click a node on the canvas to set target
                    </div>
                )}
            </div>

            {/* FIX 7: Tie-Breaking Priorities — split into Flags and Status groups */}
            <div className="trace-panel__section">
                <label className="trace-panel__label">
                    Tie-Breaking Priorities <span className="trace-panel__label-sub">(Optional)</span>
                </label>

                {/* Flags group */}
                <div className="trace-panel__priorities-group">
                    <span className="trace-panel__priorities-group-label trace-panel__priorities-group-label--flag">Flags</span>
                    {flagPriorities.map(priority => {
                        const item = flagOptions.find(f => f.id === priority.id);
                        if (!item) return null;
                        return (
                            <div key={priority.id} className="trace-panel__priority-row">
                                <span className="trace-panel__badge trace-panel__badge--flag">FLAG</span>
                                <span className="trace-panel__priority-name">{item.name}</span>
                                <select
                                    className="trace-panel__select trace-panel__select--small"
                                    value={String(priority.preferredValue)}
                                    onChange={(e) => setPriorities(priorities.map(p =>
                                        p.id === priority.id ? { ...p, preferredValue: e.target.value === 'true' } : p
                                    ))}
                                >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                                <button
                                    className="panel-action-btn panel-action-btn--danger"
                                    onClick={() => setPriorities(priorities.filter(p => p.id !== priority.id))}
                                ><Trash2 size={11} /></button>
                            </div>
                        );
                    })}
                    {availableFlagIds.length > 0 && (
                        <select
                            className="trace-panel__add-select"
                            onChange={(e) => { handleAddFlag(e.target.value); e.target.value = ''; }}
                        >
                            <option value="">+ Add Flag</option>
                            {availableFlagIds.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    )}
                    {flagOptions.length === 0 && (
                        <span className="trace-panel__priorities-empty">No flags defined</span>
                    )}
                </div>

                {/* Status group */}
                <div className="trace-panel__priorities-group">
                    <span className="trace-panel__priorities-group-label trace-panel__priorities-group-label--status">Status</span>
                    {statusPriorities.map(priority => {
                        const item = statusOptions.find(s => s.id === priority.id);
                        if (!item) return null;
                        return (
                            <div key={priority.id} className="trace-panel__priority-row">
                                <span className="trace-panel__badge trace-panel__badge--status">STAT</span>
                                <span className="trace-panel__priority-name">{item.name}</span>
                                <select
                                    className="trace-panel__select trace-panel__select--small"
                                    value={priority.operator || '>='}
                                    onChange={(e) => setPriorities(priorities.map(p =>
                                        p.id === priority.id ? { ...p, operator: e.target.value } : p
                                    ))}
                                >
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                    <option value="==">==</option>
                                </select>
                                <input
                                    type="number"
                                    className="trace-panel__number"
                                    value={priority.preferredValue}
                                    onChange={(e) => setPriorities(priorities.map(p =>
                                        p.id === priority.id ? { ...p, preferredValue: parseInt(e.target.value) || 0 } : p
                                    ))}
                                />
                                <button
                                    className="panel-action-btn panel-action-btn--danger"
                                    onClick={() => setPriorities(priorities.filter(p => p.id !== priority.id))}
                                ><Trash2 size={11} /></button>
                            </div>
                        );
                    })}
                    {availableStatusIds.length > 0 && (
                        <select
                            className="trace-panel__add-select"
                            onChange={(e) => { handleAddStatus(e.target.value); e.target.value = ''; }}
                        >
                            <option value="">+ Add Status</option>
                            {availableStatusIds.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                    {statusOptions.length === 0 && (
                        <span className="trace-panel__priorities-empty">No statuses defined</span>
                    )}
                </div>
            </div>

            {/* Route Limit */}
            <div className="trace-panel__section">
                <label className="trace-panel__label">Route Limit</label>
                <label className="trace-panel__searchall-label">
                    <input
                        type="checkbox"
                        checked={searchAll}
                        onChange={e => setSearchAll(e.target.checked)}
                    />
                    Search all possible routes
                </label>
                {searchAll && (
                    <p className="trace-panel__searchall-warning">
                        ⚠ May take a long time if route count is large
                    </p>
                )}
                {!searchAll && (
                    <input
                        type="number"
                        className="trace-panel__select trace-panel__pathcap-input"
                        value={pathCap}
                        onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            setPathCap(Math.max(1, val));
                        }}
                    />
                )}
            </div>

            {/* Search Depth Limit */}
            <div className="trace-panel__section">
                <label className="trace-panel__label">
                    Search Depth Limit <span className="trace-panel__label-sub">(-1 for unlimited)</span>
                </label>
                <input
                    type="number"
                    className="trace-panel__select trace-panel__pathcap-input"
                    value={searchDepth}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = -1;
                        setSearchDepth(val);
                    }}
                />
            </div>

            <div className="trace-panel__run-row">
                <button
                    className="trace-panel__run-btn"
                    onClick={handleRunTrace}
                    disabled={!targetNode || isTracing || !startNode}
                >
                    {isTracing ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                    {isTracing ? 'Tracing...' : 'Run Trace'}
                </button>
                {isTracing && (
                    <button className="trace-panel__cancel-btn" onClick={handleCancelTrace}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
