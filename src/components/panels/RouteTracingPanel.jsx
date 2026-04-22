// CHANGED: Ported logic from RouteFinderDialog to an embedded panel
// PRESERVED: computeRoutesFromStart and core pathfinding logic remain untouched
import React, { useState, useMemo } from 'react';
import { useNarrativeStore, useUIStore, useSimulationStore } from 'store';
import { X, Check, Route, Trash2, Plus, Loader2 } from 'lucide-react';
import './RightPanels.css';

export default function RouteTracingPanel() {
    const selectedNodeId = useUIStore(s => s.selectedNodeId);
    const toggleShortestRouteOverlay = useUIStore(s => s.toggleShortestRouteOverlay);
    const showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay);
    const selectedRouteIndex = useUIStore(s => s.selectedRouteIndex);
    const setSelectedRouteIndex = useUIStore(s => s.setSelectedRouteIndex);

    const computeRoutesFromStart = useSimulationStore(s => s.computeRoutesFromStart);
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

    const [priorities, setPriorities] = useState([]);
    const [pathCap, setPathCap] = useState(5);
    const [isTracing, setIsTracing] = useState(false);

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
        setPriorities([...priorities, { id, type: 'status', preferredValue: 0 }]);
    };

    const handleRunTrace = () => {
        if (!selectedNodeId || !startNode) return;
        setIsTracing(true);
        setTimeout(() => {
            const cappedLimit = Math.min(parseInt(pathCap) || 5, 50);
            setSelectedRouteIndex(0);
            computeRoutesFromStart(startNode.id, selectedNodeId, priorities, cappedLimit);
            if (!showShortestRouteOverlay) toggleShortestRouteOverlay();
            setIsTracing(false);
        }, 400);
    };

    const handleStopTracing = () => {
        if (showShortestRouteOverlay) toggleShortestRouteOverlay();
        clearRouteResults();
    };

    // FIX 8: derive ordered node labels from a route's edge ID sequence
    const deriveNodeLabels = (pathEdgeIds) => {
        if (!pathEdgeIds?.length) return [];
        const nodeIds = [];
        const firstEdge = edgesMap[pathEdgeIds[0]];
        if (!firstEdge) return [];
        nodeIds.push(firstEdge.sourceId);
        pathEdgeIds.forEach(eid => {
            const e = edgesMap[eid];
            if (e) nodeIds.push(e.targetId);
        });
        return nodeIds.map(id => allNodeMap[id]?.data?.label || '?');
    };

    // FIX 9: clicking a route sets it as the active highlighted route on the canvas
    const handleRouteClick = (route, index) => {
        setSelectedRouteIndex(index);
        if (!route.pathEdgeIds?.length) return;
        const lastEdge = edgesMap[route.pathEdgeIds[route.pathEdgeIds.length - 1]];
        if (lastEdge?.targetId) {
            window.dispatchEvent(new CustomEvent('canvas-navigate-to-node', { detail: lastEdge.targetId }));
        }
    };

    // FIX 8: results view — store-driven, not local state
    if (shortestRouteResults !== null) {
        return (
            <div className="trace-results">
                {/* 1. Status indicator */}
                <div className="trace-results__status">
                    <div className="trace-results__status-dot" />
                    Trace Active on Canvas
                </div>

                {/* 2. Stop button */}
                <button onClick={handleStopTracing} className="trace-results__stop-btn">
                    <X size={14} /> Stop Trace
                </button>

                {/* 3. Route list */}
                <div className="trace-results__header">
                    <Check size={12} style={{ color: 'var(--color-emerald-500)', flexShrink: 0 }} />
                    Paths Found ({shortestRouteResults.length})
                </div>

                <div className="trace-results__list">
                    {shortestRouteResults.length === 0 && (
                        <div className="trace-results__empty">No reachable paths found from start to target.</div>
                    )}
                    {shortestRouteResults.map((route, i) => {
                        const labels = deriveNodeLabels(route.pathEdgeIds);
                        const preview = labels.length <= 3
                            ? labels.join(' → ')
                            : `${labels[0]} → … → ${labels[labels.length - 1]}`;
                        const isActive = i === selectedRouteIndex;
                        return (
                            <div
                                key={i}
                                className={`trace-results__item${isActive ? ' trace-results__item--active' : ''}`}
                                onClick={() => handleRouteClick(route, i)}
                                title="Click to highlight this route on the canvas"
                            >
                                <div className="trace-results__item-top">
                                    <span className="trace-results__item-name">Route {i + 1}</span>
                                    <span className="trace-results__item-steps">{route.length} steps</span>
                                </div>
                                <div className="trace-results__item-path">{preview}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
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
                    Tie-Breaking Priorities <span style={{ opacity: 0.6, textTransform: 'none' }}>(Optional)</span>
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

            {/* Path Cap */}
            <div className="trace-panel__section">
                <label className="trace-panel__label">Path Cap <span style={{ opacity: 0.6, textTransform: 'none' }}>(Max 50)</span></label>
                <input
                    type="number"
                    className="trace-panel__select"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={pathCap}
                    onChange={(e) => {
                        let val = parseInt(e.target.value) || 5;
                        setPathCap(Math.max(1, Math.min(val, 50)));
                    }}
                />
            </div>

            <button
                className="trace-panel__run-btn"
                onClick={handleRunTrace}
                disabled={!targetNode || isTracing || !startNode}
            >
                {isTracing ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                {isTracing ? 'Tracing...' : 'Run Trace'}
            </button>
        </div>
    );
}
