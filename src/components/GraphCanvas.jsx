import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { ConnectionLineType, applyNodeChanges } from '@xyflow/react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNarrativeStore, useSimulationStore, useUIStore } from 'store';
import StoryNode from './nodes/StoryNode';
import ConditionalEdge from './edges/ConditionalEdge';

function GraphCanvasInner() {
  // PLAN GAP (Phase 3): narrativeStore no longer holds nodes[]. This entire destructure
  // is broken — storeNodes will be undefined. Phase 3 rewrites this to merge
  // Object.values(common), Object.values(choice), Object.values(ending) into derivedNodes.
  const {
    nodes: storeNodes,
    edges: storeEdges,
    addNode,
    addEdge,
    updateNode,
  } = useNarrativeStore();

  const {
    selectNode,
    selectEdge,
    clearSelection,
    selectedNodeId,
    selectedEdgeId,
    snapToGrid
  } = useUIStore();

  const { isRunning, advance, reachableNodeIds, reachableEdgeIds } = useSimulationStore();

  const { screenToFlowPosition } = useReactFlow();

  // PLAN GAP (Phase 3): nodeTypes map must expand to { commonNode: CommonNode, choiceNode: ChoiceNode, endingNode: EndingNode }.
  // StoryNode.jsx is replaced by three dedicated renderers. Phase 3 owns this change.
  const nodeTypes = useMemo(() => ({ storyNode: StoryNode, ending: StoryNode }), []);
  const edgeTypes = useMemo(() => ({ conditionalEdge: ConditionalEdge }), []);

  // PLAN GAP (Phase 3): storeNodes is undefined (nodes[] was removed in Phase 1).
  // Phase 3 rewrites this useMemo to derive from Object.values(common/choice/ending)
  // and maps each node to the correct React Flow type (commonNode/choiceNode/endingNode).
  // The isEndNode conditional inside data is replaced by EndingNode unconditionally omitting its handle.
  const derivedNodes = useMemo(() => {
    return (storeNodes || []).map(node => ({
      id: node.id,
      type: node.type === 'ending' ? 'ending' : 'storyNode',
      position: node.position,
      selected: node.id === selectedNodeId,
      data: {
        ...node.data,
        isEndNode: node.type === 'ending'
      },
    }));
  }, [storeNodes, selectedNodeId]);

  const [rfNodes, setRfNodes] = useState(derivedNodes);

  // Sync from store when store changes (e.g. node added/deleted), but not during drag
  const isDragging = useRef(false);
  useEffect(() => {
    if (!isDragging.current) {
      setRfNodes(derivedNodes);
    }
  }, [derivedNodes]);

  const reactFlowEdges = useMemo(() => {
    return storeEdges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'conditionalEdge',
      selected: edge.id === selectedEdgeId,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#b1b6be',
      },
      data: {
        label: edge.label,
        condition: edge.condition,
        // PLAN GAP (Phase 4): sideEffects field removed from edge schema in Phase 1.
        // ConditionalEdge.jsx no longer receives data.sideEffects. This pass-through
        // is now undefined and harmless, but Phase 4 removes it entirely.
        sideEffects: edge.sideEffects,
      }
    }));
  }, [storeEdges, selectedEdgeId]);

  const onNodeClick = useCallback((event, node) => {
    if (isRunning) {
      const activeStateId = useSimulationStore.getState().activeNodeId;
      if (reachableNodeIds.includes(node.id)) {
        const edge = storeEdges.find(
          e => e.sourceId === activeStateId && e.targetId === node.id && reachableEdgeIds.includes(e.id)
        );
        if (edge) {
          advance(edge.id);
        }
      }
      return; 
    }
    selectNode(node.id);
  }, [selectNode, isRunning, reachableNodeIds, reachableEdgeIds, storeEdges, advance]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    selectEdge(edge.id);
  }, [selectEdge]);

  const onConnect = useCallback((params) => {
    try {
      addEdge(params.source, params.target);
    } catch (e) {
      console.error(e.message);
    }
  }, [addEdge]);

  const lastClickTime = useRef(0);
  const onPaneClick = useCallback((event) => {
    clearSelection();
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(position, 'common');
    }
    lastClickTime.current = now;
  }, [clearSelection, screenToFlowPosition, addNode]);

  const onNodesChange = useCallback((changes) => {
    setRfNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    isDragging.current = false;
    updateNode(node.id, { position: node.position });
  }, [updateNode]);

  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleTidy = () => {
      setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 50);
    };
    window.addEventListener('graph-layout-tidy', handleTidy);
    return () => window.removeEventListener('graph-layout-tidy', handleTidy);
  }, [fitView]);

  return (
    <div className={`canvas-wrapper ${isRunning ? 'simulation-mode' : ''}`} style={{ width: '100%', height: '100%' }}>
      {isRunning && (
        <div className="simulation-banner" style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          backgroundColor: 'var(--color-active)', color: '#000', textAlign: 'center',
          padding: '8px', fontWeight: 'bold'
        }}>
          ⚡ Simulation Active — click a highlighted node to advance
        </div>
      )}
      <ReactFlow
        nodes={rfNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        defaultEdgeOptions={{ type: 'conditionalEdge' }}
        connectionLineType={ConnectionLineType.SmoothStep}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        fitView
      >
        <Background variant="dots" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
