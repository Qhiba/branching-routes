import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditorData } from '../../context/EditorContext';
import { computeLayout } from '../../utils/graphLayout';
import { analyzeReachability } from '../../utils/reachabilityAnalyzer';
import useSimulator from '../../hooks/useSimulator';
import SimulatorPanel from './SimulatorPanel';
import SceneNode from './nodes/SceneNode';
import ChoiceNode from './nodes/ChoiceNode';
import EndingNode from './nodes/EndingNode';
import { Navigation, Crosshair, Info, X, AlertTriangle, Blocks } from 'lucide-react';

const nodeTypes = { scene: SceneNode, choice: ChoiceNode, ending: EndingNode };

// Color constants
const EDGE_TAKEN = '#6366f1';
const EDGE_DEFAULT = '#cbd5e1';

function RouteViewerInner() {
  const { paths, chapters, scenes, choices, endings } = useEditorData();
  const sim = useSimulator();
  const { setCenter, fitView } = useReactFlow();

  const [filterPath, setFilterPath] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [cameraFollow, setCameraFollow] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({ rankdir: 'TB', nodesep: 100, ranksep: 150 });
  const [showLayoutOpts, setShowLayoutOpts] = useState(false);

  // Static reachability analysis (independent of simulation)
  const staticAnalysis = useMemo(
    () => analyzeReachability(sim.flags, sim.statusPoints, choices, scenes, endings, sim.entryNode),
    [sim.flags, sim.statusPoints, choices, scenes, endings, sim.entryNode]
  );
  const staticUnreachable = useMemo(
    () => new Set(staticAnalysis.unreachableNodes),
    [staticAnalysis]
  );

  // Compute layout from editor data
  const baseLayout = useMemo(
    () => computeLayout(choices, scenes, endings, {
      filterPath: filterPath || undefined,
      filterChapter: filterChapter || undefined,
      layoutConfig,
    }),
    [choices, scenes, endings, filterPath, filterChapter, layoutConfig]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync base layout to nodes/edges (only when structure/layout config changes)
  useEffect(() => {
    setNodes(baseLayout.nodes);
    setEdges(baseLayout.edges);
    if (!sim.isRunning) {
      setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
    }
  }, [baseLayout, setNodes, setEdges, sim.isRunning, fitView]);

  // Apply simulation states to nodes without overriding their dragged positions
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
      if (node.data.state !== state) {
        return { ...node, data: { ...node.data, state } };
      }
      return node;
    }));
  }, [sim.isRunning, sim.currentNodeId, sim.visitedNodeIds, staticUnreachable, scenes, choices, endings, sim.passesRequires, setNodes]);

  // Apply simulation states to edges without overriding their geometry
  useEffect(() => {
    setEdges((currentEdges) => currentEdges.map((edge) => {
      if (!sim.isRunning) {
        if (edge.animated || edge.style?.opacity !== 0.4) {
          return { ...edge, animated: false, style: { stroke: EDGE_DEFAULT, strokeWidth: 1.5, opacity: 0.4 } };
        }
        return edge;
      }
      const isTaken = sim.takenEdgeIds.has(edge.id);
      const stroke = isTaken ? EDGE_TAKEN : EDGE_DEFAULT;
      const strokeWidth = isTaken ? 2.5 : 1.5;
      const opacity = isTaken ? 1 : 0.4;

      if (edge.animated !== isTaken || edge.style?.opacity !== opacity) {
        return {
          ...edge,
          animated: isTaken,
          style: { stroke, strokeWidth, opacity },
        };
      }
      return edge;
    }));
  }, [sim.isRunning, sim.takenEdgeIds, setEdges]);

  // Camera follow on node change
  const prevNodeRef = useRef(null);
  useEffect(() => {
    if (!cameraFollow || !sim.currentNodeId || sim.currentNodeId === prevNodeRef.current) return;
    prevNodeRef.current = sim.currentNodeId;

    const node = nodes.find((n) => n.id === sim.currentNodeId);
    if (node) {
      const x = node.position.x + 110; // center of 220px node
      const y = node.position.y + 40;
      setCenter(x, y, { zoom: 1.2, duration: 800 });
    }
  }, [sim.currentNodeId, cameraFollow, nodes, setCenter]);

  // Fit view when layout changes (e.g. filter change)
  // This is handled in the effect block above now

  const handleNodeClick = useCallback((_event, node) => {
    const entity = scenes[node.id] || choices[node.id] || endings[node.id];
    if (entity) {
      setSelectedNode({ ...entity, nodeType: node.type });
    }
  }, [scenes, choices, endings]);

  const pathOptions = Object.values(paths);
  const chapterOptions = Object.values(chapters);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Graph Canvas */}
      <div className="flex-1 flex flex-col relative">
        {/* Floating Filter Bar */}
        <div className="absolute top-6 left-6 z-10 flex gap-2">
          <div className="glass-panel p-2 rounded-xl border border-white/5 flex gap-3 items-center shadow-2xl">
            <Navigation className="w-4 h-4 text-primary ml-1" />
            <select
              value={filterPath}
              onChange={(e) => setFilterPath(e.target.value)}
              className="text-xs px-3 py-1.5 border-none bg-surface-container rounded-lg text-on-surface focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Paths</option>
              {pathOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="text-xs px-3 py-1.5 border-none bg-surface-container rounded-lg text-on-surface focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Chapters</option>
              {chapterOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button
              onClick={() => setCameraFollow(prev => !prev)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${cameraFollow
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-container text-zinc-400 hover:text-white'
              }`}
              title="Toggle camera follow"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Follow
            </button>
            <div className="relative">
              <button
                onClick={() => setShowLayoutOpts(p => !p)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showLayoutOpts ? 'bg-primary/20 text-primary' : 'bg-surface-container text-zinc-400 hover:text-white'}`}
                title="Layout Options"
              >
                <Blocks className="w-3.5 h-3.5" />
                Layout
              </button>
              {showLayoutOpts && (
                <div className="absolute top-full mt-2 left-0 bg-surface-container-highest rounded-xl border border-white/10 p-4 shadow-2xl w-64 z-50">
                  <h4 className="text-xs font-bold text-on-surface mb-3 uppercase tracking-wider">Layout Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1.5 block">Direction</label>
                      <div className="flex bg-black/20 rounded-lg p-1">
                        <button
                          onClick={() => setLayoutConfig(c => ({...c, rankdir: 'TB'}))}
                          className={`flex-1 text-xs py-1 rounded-md transition-colors ${layoutConfig.rankdir === 'TB' ? 'bg-primary text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                        >Top-Bottom</button>
                        <button
                          onClick={() => setLayoutConfig(c => ({...c, rankdir: 'LR'}))}
                          className={`flex-1 text-xs py-1 rounded-md transition-colors ${layoutConfig.rankdir === 'LR' ? 'bg-primary text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                        >Left-Right</button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Node Spacing (X)</label>
                        <span className="text-[10px] text-primary font-mono">{layoutConfig.nodesep}</span>
                      </div>
                      <input 
                        type="range" min="20" max="300" step="10"
                        value={layoutConfig.nodesep}
                        onChange={(e) => setLayoutConfig(c => ({...c, nodesep: Number(e.target.value)}))}
                        className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-primary" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Rank Spacing (Y)</label>
                        <span className="text-[10px] text-primary font-mono">{layoutConfig.ranksep}</span>
                      </div>
                      <input 
                        type="range" min="50" max="500" step="10"
                        value={layoutConfig.ranksep}
                        onChange={(e) => setLayoutConfig(c => ({...c, ranksep: Number(e.target.value)}))}
                        className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-primary" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {staticAnalysis.warnings.length > 0 && (
              <button
                onClick={() => setShowWarnings(prev => !prev)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showWarnings
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-surface-container text-zinc-400 hover:text-amber-400'
                }`}
                title="Show unreachable node warnings"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {staticAnalysis.warnings.length}
              </button>
            )}
          </div>
        </div>

        {/* React Flow */}
        <div className="flex-1 canvas-grid">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
          >
            <Controls showInteractive={false} className="!bg-surface-container-high !border-none !shadow-2xl !rounded-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!text-zinc-400 [&>button]:!border-b [&>button]:!border-white/5 hover:[&>button]:!text-white" />
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                if (node.type === 'ending') return '#ffb4ab'; // error/red
                if (node.type === 'choice') return '#f9d8ff'; // tertiary/purple
                return '#a4e6ff'; // primary/blue
              }}
              className="!bg-surface-container-low !border-white/5 !border !rounded-xl !shadow-2xl"
              maskColor="rgba(0, 0, 0, 0.5)"
            />
          </ReactFlow>
        </div>

        {/* Node Detail Popover */}
        {selectedNode && (
          <div className="absolute bottom-6 left-6 bg-surface-container-highest rounded-2xl shadow-2xl border border-white/5 p-6 max-w-sm z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-zinc-400" />
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedNode.id}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{selectedNode.nodeType}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-headline text-lg font-bold text-on-surface mb-2 leading-snug">
              {selectedNode.name || selectedNode.text || 'Unnamed'}
            </h4>
            {selectedNode.description && (
              <p className="text-sm text-zinc-400 mb-4 line-clamp-4 leading-relaxed">{selectedNode.description}</p>
            )}
            {selectedNode.requires && selectedNode.requires.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Requires</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedNode.requires.map((req, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-surface-container-lowest border border-white/5 font-mono text-zinc-300">
                      {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedNode.next && selectedNode.next.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Routes</span>
                <div className="space-y-1.5 mt-2">
                  {selectedNode.next.map((route, i) => (
                    <div key={i} className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">→ {route.target}</span>
                      {route.requires && route.requires.length > 0 && (
                        <span>({route.requires.length} conditions)</span>
                      )}
                      {(!route.requires || route.requires.length === 0) && (
                        <span className="text-secondary-container font-semibold">fallback</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNode.options && selectedNode.options.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Options</span>
                <div className="space-y-1.5 mt-2">
                  {selectedNode.options.map((opt, i) => (
                    <div key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                      <span className="font-mono text-tertiary-dim mt-0.5">→</span>
                      <span className="font-medium text-zinc-300 flex-1">{opt.label || `Option ${i + 1}`}</span>
                      <span className="font-mono text-tertiary shrink-0">{opt.next || 'loop'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Static Warnings Panel */}
        {showWarnings && staticAnalysis.warnings.length > 0 && (
          <div className="absolute top-20 left-6 bg-surface-container-highest rounded-2xl shadow-2xl border border-amber-500/30 p-5 max-w-sm max-h-80 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Unreachable Nodes</span>
              </div>
              <button onClick={() => setShowWarnings(false)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {staticAnalysis.warnings.map((w, i) => (
                <div key={i} className="text-[11px] p-2.5 rounded-lg bg-black/20 border border-amber-500/10">
                  <span className="font-mono font-bold text-amber-400">{w.nodeId}</span>
                  <p className="text-amber-200 mt-1 leading-relaxed">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulator Sidebar */}
      <aside className="w-80 shrink-0 bg-surface-container-low border-l border-white/5 flex flex-col overflow-hidden shadow-2xl z-20">
        <SimulatorPanel sim={sim} />
      </aside>
    </div>
  );
}

export default function RouteViewer() {
  return (
    <ReactFlowProvider>
      <RouteViewerInner />
    </ReactFlowProvider>
  );
}
