import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
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
import { Navigation, Crosshair, Info, X, AlertTriangle } from 'lucide-react';

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
    }),
    [choices, scenes, endings, filterPath, filterChapter]
  );

  // Apply simulation states to nodes (or static analysis when idle)
  const nodes = useMemo(() => {
    if (!sim.isRunning) {
      // Apply static unreachable analysis when not simulating
      return baseLayout.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          state: staticUnreachable.has(node.id) ? 'unreachable' : 'reachable',
        },
      }));
    }

    return baseLayout.nodes.map((node) => {
      let state = 'reachable';
      if (node.id === sim.currentNodeId) {
        state = endings[node.id] ? 'terminal' : 'current';
      } else if (sim.visitedNodeIds.has(node.id)) {
        state = 'visited';
      } else {
        // Check if node is unreachable given current flags
        const entity = scenes[node.id] || choices[node.id] || endings[node.id];
        if (entity?.requires && entity.requires.length > 0) {
          const canMeet = sim.passesRequires(entity.requires);
          if (!canMeet) state = 'unreachable';
        }
      }
      return { ...node, data: { ...node.data, state } };
    });
  }, [baseLayout.nodes, sim.isRunning, sim.currentNodeId, sim.visitedNodeIds, sim.activeState, scenes, choices, endings, sim.passesRequires, staticUnreachable]);

  // Apply taken/untaken styles to edges
  const edges = useMemo(() => {
    if (!sim.isRunning) return baseLayout.edges;

    return baseLayout.edges.map((edge) => {
      const isTaken = sim.takenEdgeIds.has(edge.id);
      return {
        ...edge,
        animated: isTaken,
        style: {
          stroke: isTaken ? EDGE_TAKEN : EDGE_DEFAULT,
          strokeWidth: isTaken ? 2.5 : 1.5,
          opacity: isTaken ? 1 : 0.4,
        },
      };
    });
  }, [baseLayout.edges, sim.isRunning, sim.takenEdgeIds]);

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
  useEffect(() => {
    if (!sim.isRunning) {
      setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
    }
  }, [baseLayout, fitView, sim.isRunning]);

  const handleNodeClick = useCallback((_event, node) => {
    const entity = scenes[node.id] || choices[node.id] || endings[node.id];
    if (entity) {
      setSelectedNode({ ...entity, nodeType: node.type });
    }
  }, [scenes, choices, endings]);

  const pathOptions = Object.values(paths);
  const chapterOptions = Object.values(chapters);

  return (
    <div className="flex h-full w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50/50">
      {/* Graph Canvas */}
      <div className="flex-1 flex flex-col relative">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 z-10">
          <Navigation className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter</span>
          <select
            value={filterPath}
            onChange={(e) => setFilterPath(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Paths</option>
            {pathOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Chapters</option>
            {chapterOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCameraFollow(prev => !prev)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${cameraFollow
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
              }`}
              title="Toggle camera follow"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Follow
            </button>
            {staticAnalysis.warnings.length > 0 && (
              <button
                onClick={() => setShowWarnings(prev => !prev)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showWarnings
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-amber-500 border-amber-200 hover:bg-amber-50'
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
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} className="!shadow-md !border !border-gray-200 !rounded-xl" />
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                if (node.type === 'ending') return '#f59e0b';
                if (node.type === 'choice') return '#6366f1';
                return '#3b82f6';
              }}
              className="!shadow-md !border !border-gray-200 !rounded-xl"
            />
          </ReactFlow>
        </div>

        {/* Node Detail Popover */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-5 max-w-sm z-50 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedNode.id}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedNode.nodeType}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">
              {selectedNode.name || selectedNode.text || 'Unnamed'}
            </h4>
            {selectedNode.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-3">{selectedNode.description}</p>
            )}
            {selectedNode.requires && selectedNode.requires.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requires</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNode.requires.map((req, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-gray-600">
                      {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedNode.next && selectedNode.next.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Routes</span>
                <div className="space-y-1 mt-1">
                  {selectedNode.next.map((route, i) => (
                    <div key={i} className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-700">→ {route.target}</span>
                      {route.requires && route.requires.length > 0 && (
                        <span className="text-gray-400">({route.requires.length} conditions)</span>
                      )}
                      {(!route.requires || route.requires.length === 0) && (
                        <span className="text-emerald-500 font-semibold">fallback</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNode.options && selectedNode.options.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Options</span>
                <div className="space-y-1 mt-1">
                  {selectedNode.options.map((opt, i) => (
                    <div key={i} className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <span className="font-medium text-gray-700">{opt.label || `Option ${i + 1}`}</span>
                      <span className="font-mono text-gray-400">→ {opt.next || 'loop'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Static Warnings Panel */}
        {showWarnings && staticAnalysis.warnings.length > 0 && (
          <div className="absolute top-14 right-4 bg-white rounded-2xl shadow-xl border border-amber-200 p-4 max-w-sm max-h-64 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Unreachable Nodes</span>
              </div>
              <button onClick={() => setShowWarnings(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {staticAnalysis.warnings.map((w, i) => (
                <div key={i} className="text-[11px] p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="font-mono font-bold text-amber-700">{w.nodeId}</span>
                  <p className="text-amber-600 mt-0.5">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulator Sidebar */}
      <div className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
        <SimulatorPanel sim={sim} />
      </div>
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
