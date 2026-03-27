import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditorData, useEditorActions } from '../../context/EditorContext';
import { computeLayoutWithPositions } from '../../utils/graphLayout';
import { analyzeReachability } from '../../utils/reachabilityAnalyzer';
import SceneNode from './nodes/SceneNode';
import ChoiceNode from './nodes/ChoiceNode';
import EndingNode from './nodes/EndingNode';
import { Navigation, Crosshair, X, AlertTriangle, Blocks, Undo2, StopCircle, LayoutGrid } from 'lucide-react';

const nodeTypes = { scene: SceneNode, choice: ChoiceNode, ending: EndingNode };

function AxisLine() {
  const { y, zoom } = useViewport();
  const lineY = y + (0 * zoom);

  return (
    <div
      style={{
        position: 'absolute',
        top: lineY,
        left: 0,
        width: '100%',
        height: 1,
        background: 'rgba(255, 255, 255, 0.075)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function RouteViewerInner({ onNodeEdit, sim, routeViewerRef, tracedPath, routeTraceResult }) {
  const { paths, chapters, scenes, choices, endings, flags, statusPoints } = useEditorData();
  const { updateScene, updateChoiceOption, updateNodePosition, resetAllPositions, resetSpawnOffset } = useEditorActions();
  const { setCenter, fitView, getViewport, setViewport, screenToFlowPosition } = useReactFlow();

  // Expose viewport center to parent via ref
  React.useImperativeHandle(routeViewerRef, () => ({
    getViewportCenter: () => {
      // Calculate center of the window
      return screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
  }));

  const [filterPath, setFilterPath] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [cameraFollow, setCameraFollow] = useState(true);
  const [showWarnings, setShowWarnings] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({ rankdir: 'LR', nodesep: 100, ranksep: 150 });
  const [showLayoutOpts, setShowLayoutOpts] = useState(false);

  // Counter for fitView re-trigger after reset (not used in layout computation)
  const [layoutVersion, setLayoutVersion] = useState(0);

  const staticAnalysis = useMemo(
    () => analyzeReachability(sim.flags, sim.statusPoints, choices, scenes, endings, sim.entryNode),
    [sim.flags, sim.statusPoints, choices, scenes, endings, sim.entryNode]
  );
  const staticUnreachable = useMemo(
    () => new Set(staticAnalysis.unreachableNodes),
    [staticAnalysis]
  );

  const baseLayout = useMemo(
    () => {
      const opts = {
        filterPath: filterPath || undefined,
        filterChapter: filterChapter || undefined,
        layoutConfig,
      };

      // Always use position-aware layout.
      // When _position is absent (e.g. after reset), it falls back to full Dagre automatically.
      const layout = computeLayoutWithPositions(choices, scenes, endings, opts);

      layout.nodes = layout.nodes.map(n =>
        n.type === 'choice' || n.type === 'scene'
          ? { ...n, data: { ...n.data, flagsMap: flags, statusMap: statusPoints } }
          : n
      );
      return layout;
    },
    [choices, scenes, endings, filterPath, filterChapter, layoutConfig, flags, statusPoints]
  );

  // Persist positions computed by the layout for nodes that didn't have _position.
  // Uses a ref-based dedup to avoid re-persisting the same nodes across re-renders.
  const persistedPositionIds = useRef(new Set());
  useEffect(() => {
    if (!baseLayout.positionUpdates || baseLayout.positionUpdates.length === 0) return;

    const newUpdates = baseLayout.positionUpdates.filter(u => !persistedPositionIds.current.has(u.id));
    if (newUpdates.length === 0) return;

    for (const update of newUpdates) {
      updateNodePosition(update.id, update.type, update.position);
      persistedPositionIds.current.add(update.id);
    }
  }, [baseLayout.positionUpdates, updateNodePosition]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const hasInitialFitRef = useRef(false);
  const lastFitKeyRef = useRef('');

  useEffect(() => {
    const viewportBefore = !sim.isRunning ? getViewport() : null;

    const fitKey = `${layoutConfig.rankdir}|${layoutConfig.nodesep}|${layoutConfig.ranksep}|${layoutVersion}`;
    const shouldFit = !hasInitialFitRef.current || lastFitKeyRef.current !== fitKey;

    setNodes(baseLayout.nodes);
    setEdges(baseLayout.edges);

    if (!sim.isRunning) {
      // Restore camera position after re-layout caused by editor saves.
      // We skip restore if we're performing an explicit fitView (shouldFit).
      if (viewportBefore && !shouldFit) {
        requestAnimationFrame(() => {
          setViewport(viewportBefore);
        });
      }
    }

    if (shouldFit) {
      requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 400 });
        hasInitialFitRef.current = true;
        lastFitKeyRef.current = fitKey;
      });
    }
  }, [baseLayout, fitView, layoutConfig, layoutVersion, getViewport, setViewport, sim.isRunning]);

  useEffect(() => {
    setNodes((currentNodes) => currentNodes.map((node) => {
      let state = 'reachable';
      if (!sim.isRunning) {
        state = staticUnreachable.has(node.id) ? 'unreachable' : 'reachable';
      } else {
        if (node.id === sim.currentNodeId) {
          state = endings[node.id] ? 'terminal' : 'current';
        } else if (sim.visitedNodeIds.has(node.id)) {
          state = 'visited';
        } else {
          const entity = scenes[node.id] || choices[node.id] || endings[node.id];
          if (entity?.requires && entity.requires.length > 0) {
            const canMeet = sim.passesRequires(entity.requires);
            if (!canMeet) state = 'unreachable';
          }
        }
      }

      // Compute trace highlight data
      let traceHighlight = null;
      if (tracedPath && routeTraceResult && routeTraceResult.paths && routeTraceResult.paths.length > 0) {
        const isOnPath = tracedPath.includes(node.id);
        let pickedOptionId = null;

        if (isOnPath && choices[node.id]) {
          // Find the path whose raw array matches tracedPath (handles multi-path selection)
          const matchedPath = routeTraceResult.paths.find(
            p => p.raw && p.raw.length === tracedPath.length && p.raw.every((id, i) => id === tracedPath[i])
          ) || routeTraceResult.paths[0];
          const step = matchedPath.annotated.find(s => s.nodeId === node.id);
          if (step && step.pick) {
            pickedOptionId = step.pick.optionId;
          }
        }

        traceHighlight = { isOnPath, pickedOptionId };
      }

      const newData = { ...node.data, state };
      if (traceHighlight !== null) {
        newData.traceHighlight = traceHighlight;
      } else if (node.data.traceHighlight) {
        // Remove traceHighlight if no longer tracing
        const { traceHighlight: _, ...rest } = node.data;
        return { ...node, data: { ...rest, state } };
      }

      if (node.data.state !== state || node.data.traceHighlight !== traceHighlight) {
        return { ...node, data: newData };
      }
      return node;
    }));
  }, [sim, sim.isRunning, sim.currentNodeId, sim.visitedNodeIds, staticUnreachable, scenes, choices, endings, sim.passesRequires, tracedPath, routeTraceResult, setNodes]);

  const ghostedNodeIds = useMemo(() => {
    return new Set(baseLayout.nodes.filter(n => n.data.isGhosted).map(n => n.id));
  }, [baseLayout.nodes]);

  // Build a set of "source→target" keys from the tracedPath for fast edge matching
  const tracedEdgeKeys = useMemo(() => {
    if (!tracedPath || tracedPath.length < 2) return null;
    const keys = new Set();
    for (let i = 0; i < tracedPath.length - 1; i++) {
      keys.add(`${tracedPath[i]}→${tracedPath[i + 1]}`);
    }
    return keys;
  }, [tracedPath]);

  useEffect(() => {
    setEdges((currentEdges) => currentEdges.map((edge) => {
      const isGhostedEdge = ghostedNodeIds.has(edge.source) || ghostedNodeIds.has(edge.target);
      const defaultOpacity = isGhostedEdge ? 0.08 : 0.6;

      if (!sim.isRunning) {
        // Traced path highlighting (when not simulating)
        if (tracedEdgeKeys) {
          const edgeKey = `${edge.source}→${edge.target}`;
          const isOnPath = tracedEdgeKeys.has(edgeKey);
          const stroke = isOnPath ? '#d4a017' : '#4a6a73';
          const strokeWidth = isOnPath ? 2.5 : 1.5;
          const opacity = isGhostedEdge ? 0.08 : (isOnPath ? 1 : 0.15);
          const zIndex = isOnPath ? 10 : 0;

          if (
            edge.style?.stroke !== stroke ||
            edge.style?.strokeWidth !== strokeWidth ||
            edge.style?.opacity !== opacity ||
            edge.zIndex !== zIndex ||
            edge.animated
          ) {
            return { ...edge, animated: false, zIndex, style: { stroke, strokeWidth, opacity } };
          }
          return edge;
        }

        if (edge.animated || edge.style?.stroke !== '#4a6a73' || edge.style?.opacity !== defaultOpacity) {
          return { ...edge, animated: false, style: { stroke: '#4a6a73', strokeWidth: 1.5, opacity: defaultOpacity } };
        }
        return edge;
      }

      // During simulation, edges have 4 states
      const isTaken = sim.takenEdgeIds.has(edge.id);
      const isBlocked = staticUnreachable.has(edge.target);
      const isActive = edge.source === sim.currentNodeId; // Edge leading out from current node

      let stroke = '#4a6a73';
      let strokeWidth = 1.5;
      let strokeDasharray = 'none';
      let animated = false;
      let opacity = isGhostedEdge ? 0.08 : 0.5;

      if (isTaken) {
        stroke = '#1d9e75'; // taken/visited
        strokeWidth = 2;
        opacity = isGhostedEdge ? 0.08 : 1;
      } else if (isActive) {
        stroke = 'rgba(0, 209, 255, 0.5)'; // active
        strokeWidth = 2;
        strokeDasharray = '4 4';
        animated = true;
        opacity = isGhostedEdge ? 0.08 : 1;
      } else if (isBlocked) {
        stroke = '#252525'; // blocked/unreachable
        strokeWidth = 1.5;
        strokeDasharray = '4 4';
      }

      // We only update if something changed
      const currentStyle = edge.style || {};
      if (
        edge.animated !== animated ||
        currentStyle.stroke !== stroke ||
        currentStyle.strokeWidth !== strokeWidth ||
        currentStyle.strokeDasharray !== strokeDasharray ||
        currentStyle.opacity !== opacity
      ) {
        return {
          ...edge,
          animated,
          style: { stroke, strokeWidth, strokeDasharray, opacity },
        };
      }
      return edge;
    }));
  }, [sim.isRunning, sim.takenEdgeIds, sim.currentNodeId, staticUnreachable, setEdges, ghostedNodeIds, tracedEdgeKeys]);

  const prevNodeRef = useRef(null);
  useEffect(() => {
    if (!cameraFollow || !sim.currentNodeId || sim.currentNodeId === prevNodeRef.current) return;
    prevNodeRef.current = sim.currentNodeId;

    const node = nodes.find((n) => n.id === sim.currentNodeId);
    if (node) {
      const x = node.position.x + 120;
      const y = node.position.y + 50;
      setCenter(x, y, { zoom: 1.2, duration: 600 });
    }
  }, [sim.currentNodeId, cameraFollow, nodes, setCenter]);

  // Handle focusNodeTrigger from EditorContext
  const { focusNodeTrigger } = useEditorData();
  const { clearFocusNode } = useEditorActions();
  useEffect(() => {
    if (!focusNodeTrigger || !focusNodeTrigger.nodeId) return;
    const node = nodes.find(n => n.id === focusNodeTrigger.nodeId);
    if (node) {
      const x = node.position.x + 120;
      const y = node.position.y + 50;
      setCenter(x, y, { zoom: 1.2, duration: 800 });
      // Reset trigger after a slight delay to allow animation to start
      setTimeout(clearFocusNode, 100);
    }
  }, [focusNodeTrigger, nodes, setCenter, clearFocusNode]);

  const handleNodeClick = useCallback((_event, node) => {
    if (onNodeEdit) onNodeEdit(node.id, node.type);
  }, [onNodeEdit]);

  // --- onNodeDragStop: persist position to state ---
  const handleNodeDragStop = useCallback((_event, node) => {
    updateNodePosition(node.id, node.type, node.position);
  }, [updateNodePosition]);

  // --- Reset Layout handler ---
  const handleResetLayout = useCallback(() => {
    // Clear the dedup set so new Dagre positions get persisted
    persistedPositionIds.current.clear();
    resetAllPositions();
    // Bump layout version to trigger a fitView after the Dagre pass
    setLayoutVersion(v => v + 1);
  }, [resetAllPositions]);

  const handleConnect = useCallback(
    (params) => {
      const { source, target, sourceHandle } = params || {};
      if (!source || !target || !sourceHandle) return;

      // Choice option => option.next
      if (choices[source]) {
        const choice = choices[source];
        const optIndex = (choice.options || []).findIndex((o) => String(o.id) === String(sourceHandle));
        if (optIndex < 0) return;

        const existingOpt = choice.options[optIndex];
        const targetValue = source === target ? '' : target;
        const nextArr = Array.isArray(existingOpt.next) ? existingOpt.next : [];
        // Find an entry with empty target or add a new one
        let updated = false;
        const newNext = nextArr.map(entry => {
          if (!updated && !entry.target) {
            updated = true;
            return { ...entry, target: targetValue };
          }
          return entry;
        });
        if (!updated && targetValue) {
          newNext.push({ _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, requires: [], target: targetValue });
        }
        updateChoiceOption(source, optIndex, { ...existingOpt, next: newNext });
        return;
      }

      // Scene next entry => nextEntry.target
      if (scenes[source]) {
        const scene = scenes[source];
        const nextIndex = (scene.next || []).findIndex((nxt) => String(nxt._id) === String(sourceHandle));
        if (nextIndex < 0) return;

        const existingNext = scene.next[nextIndex];
        const targetValue = source === target ? '' : target; // self-edge => null/empty so no edge is drawn
        const newNext = [...(scene.next || [])];
        newNext[nextIndex] = { ...existingNext, target: targetValue };
        updateScene(source, { next: newNext });
      }
    },
    [choices, scenes, updateChoiceOption, updateScene]
  );

  const handleEdgesDelete = useCallback(
    (edgesToDelete) => {
      if (!Array.isArray(edgesToDelete) || edgesToDelete.length === 0) return;

      edgesToDelete.forEach((edge) => {
        const { source, sourceHandle } = edge || {};
        if (!source || !sourceHandle) return;

        if (choices[source]) {
          const choice = choices[source];
          const optIndex = (choice.options || []).findIndex((o) => String(o.id) === String(sourceHandle));
          if (optIndex < 0) return;

          const existingOpt = choice.options[optIndex];
          updateChoiceOption(source, optIndex, { ...existingOpt, next: null });
          return;
        }

        if (scenes[source]) {
          const scene = scenes[source];
          const nextIndex = (scene.next || []).findIndex((nxt) => String(nxt._id) === String(sourceHandle));
          if (nextIndex < 0) return;

          const existingNext = scene.next[nextIndex];
          const newNext = [...(scene.next || [])];
          newNext[nextIndex] = { ...existingNext, target: '' };
          updateScene(source, { next: newNext });
        }
      });
    },
    [choices, scenes, updateChoiceOption, updateScene]
  );

  const pathOptions = Object.values(paths);
  const chapterOptions = Object.values(chapters);

  /* ─── Inline style helpers ─── */
  const filterBarStyle = { background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-card)', borderRadius: 8, padding: 6 };
  const selectStyle = { background: 'var(--color-surface-card-low)', border: '1px solid transparent', color: 'var(--color-text-secondary)', fontSize: 11, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', outline: 'none' };
  const toggleBtnStyle = (active) => ({ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6, border: '1px solid transparent', cursor: 'pointer', background: active ? 'rgba(0,209,255,0.08)' : 'transparent', color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', borderColor: active ? 'rgba(0,209,255,0.15)' : 'transparent' });

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--color-surface-workspace)' }}>
      {/* Graph Canvas */}
      <div className="flex-1 flex flex-col relative">
        {/* Floating Filter Bar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center" style={filterBarStyle}>
          <Navigation className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--color-accent-primary)' }} />
          <select value={filterPath} onChange={(e) => setFilterPath(e.target.value)} style={selectStyle}>
            <option value="">All Paths</option>
            {pathOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} style={selectStyle}>
            <option value="">All Chapters</option>
            {chapterOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ width: 1, height: 20, background: 'var(--color-border-ghost)', margin: '0 2px' }} />
          <div className="relative">
            <button onClick={() => setShowLayoutOpts(p => !p)} className="flex items-center gap-1" style={toggleBtnStyle(showLayoutOpts)} title="Layout Options">
              <Blocks className="w-3.5 h-3.5" /> Layout
            </button>
            {showLayoutOpts && (
              <div className="absolute top-full mt-2 left-0 w-56 z-50 p-4 rounded-lg space-y-3" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-card)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Layout Settings</h4>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Direction</label>
                  <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--color-border-row)' }}>
                    <button onClick={() => setLayoutConfig(c => ({ ...c, rankdir: 'TB' }))} className="flex-1 py-1 transition-colors" style={{ fontSize: 11, fontWeight: layoutConfig.rankdir === 'TB' ? 600 : 400, background: layoutConfig.rankdir === 'TB' ? 'var(--color-accent-primary)' : 'var(--color-surface-card-low)', color: layoutConfig.rankdir === 'TB' ? '#0a1a1f' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}>Top-Bottom</button>
                    <button onClick={() => setLayoutConfig(c => ({ ...c, rankdir: 'LR' }))} className="flex-1 py-1 transition-colors" style={{ fontSize: 11, fontWeight: layoutConfig.rankdir === 'LR' ? 600 : 400, background: layoutConfig.rankdir === 'LR' ? 'var(--color-accent-primary)' : 'var(--color-surface-card-low)', color: layoutConfig.rankdir === 'LR' ? '#0a1a1f' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}>Left-Right</button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Node Spacing</label>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{layoutConfig.nodesep}</span>
                  </div>
                  <input type="range" min="20" max="300" step="10" value={layoutConfig.nodesep} onChange={(e) => setLayoutConfig(c => ({ ...c, nodesep: Number(e.target.value) }))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ background: 'var(--color-surface-card-low)', accentColor: 'var(--color-accent-primary)' }} />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rank Spacing</label>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{layoutConfig.ranksep}</span>
                  </div>
                  <input type="range" min="50" max="500" step="10" value={layoutConfig.ranksep} onChange={(e) => setLayoutConfig(c => ({ ...c, ranksep: Number(e.target.value) }))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ background: 'var(--color-surface-card-low)', accentColor: 'var(--color-accent-primary)' }} />
                </div>
              </div>
            )}
          </div>
          {/* Reset Layout button */}
          <button onClick={handleResetLayout} className="flex items-center gap-1" style={toggleBtnStyle(false)} title="Re-run auto-layout on entire graph">
            <LayoutGrid className="w-3.5 h-3.5" /> Reset Layout
          </button>
          {staticAnalysis.warnings.length > 0 && (
            <button onClick={() => setShowWarnings(prev => !prev)} className="flex items-center gap-1" style={toggleBtnStyle(showWarnings)} title="Show unreachable node warnings">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-terminal)' }} />
              {staticAnalysis.warnings.length}
            </button>
          )}
        </div>

        {/* Floating Simulation Controls (§4.9) */}
        {sim.isRunning && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-lg shadow-lg" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-card)' }}>
            <div className="flex items-center gap-2 px-3 py-1.5 border-r" style={{ borderColor: 'var(--color-border-ghost)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent-primary)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Simulation active</span>
            </div>
            <button onClick={() => setCameraFollow(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors" style={{ fontSize: 11, fontWeight: 500, cursor: 'pointer', color: cameraFollow ? 'var(--color-accent-primary-dim)' : 'var(--color-text-secondary)', background: cameraFollow ? 'rgba(0,209,255,0.08)' : 'transparent', border: `1px solid ${cameraFollow ? 'var(--color-accent-primary)' : 'transparent'}` }}>
              <Crosshair className="w-3.5 h-3.5" /> Follow camera {cameraFollow ? 'ON' : 'OFF'}
            </button>
            <button onClick={sim.handleUndo} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors" style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-card-low)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Undo2 className="w-3.5 h-3.5" /> Undo last choice
            </button>
            <button onClick={() => { if (window.confirm('Stop simulation?')) sim.handleStop(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors" style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-card-low)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <StopCircle className="w-3.5 h-3.5" /> End simulation
            </button>
          </div>
        )}

        {/* React Flow */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onNodeDragStop={handleNodeDragStop}
            onConnect={handleConnect}
            onEdgesDelete={handleEdgesDelete}
            onMove={resetSpawnOffset}
            minZoom={0.1}
            maxZoom={2}
            nodeDragThreshold={2}
            defaultEdgeOptions={{ type: 'smoothstep', pathOptions: { borderRadius: 32 } }}
            proOptions={{ hideAttribution: true }}
            snapToGrid={true}
            snapGrid={[24, 24]}
          >
            <Background variant="lines" gap={24} size={1} color="rgba(255,255,255,0.04)" />
            <AxisLine />
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                return {
                  idle: '#2a2a2a',
                  current: '#00d1ff',
                  visited: '#1d9e75',
                  reachable: '#2a2a2a',
                  unreachable: '#181818',
                  terminal: '#c8770a'
                }[node.data.state] || '#2a2a2a';
              }}
              className="!rounded-lg mb-14"
              style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}
              maskColor="rgba(10, 26, 31, 0.7)"
            />
          </ReactFlow>
        </div>

        {showWarnings && staticAnalysis.warnings.length > 0 && (
          <div className="absolute top-16 left-4 max-w-sm max-h-80 overflow-y-auto z-50 p-4 rounded-lg" style={{ background: 'var(--color-surface-elevated)', border: '1px solid rgba(200,119,10,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-accent-terminal)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-terminal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unreachable Nodes</span>
              </div>
              <button onClick={() => setShowWarnings(false)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {staticAnalysis.warnings.map((w, i) => (
                <div key={i} className="p-2.5 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid rgba(200,119,10,0.1)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent-terminal)', fontSize: 11 }}>{w.nodeId}</span>
                  <p className="mt-0.5" style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fit View Button */}
        <button onClick={() => fitView({ duration: 400, padding: 0.1 })} className="absolute bottom-4 left-4 z-50 flex items-center justify-center" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 8px', cursor: 'pointer' }}>
          ⊡ Fit view
        </button>
      </div>
    </div>
  );
}

export default function RouteViewer({ onNodeEdit, sim, routeViewerRef, tracedPath, routeTraceResult }) {
  return (
    <ReactFlowProvider>
      <RouteViewerInner onNodeEdit={onNodeEdit} sim={sim} routeViewerRef={routeViewerRef} tracedPath={tracedPath} routeTraceResult={routeTraceResult} />
    </ReactFlowProvider>
  );
}
