import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { ConnectionLineType, applyNodeChanges } from '@xyflow/react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore, useSimulationStore } from 'store';
import StoryNode from './nodes/StoryNode';
import ConditionalEdge from './edges/ConditionalEdge';

function GraphCanvasInner() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectNode,
    selectEdge,
    clearSelection,
    addNode,
    addEdge,
    updateNode,
    selectedNodeId,
    selectedEdgeId,
    snapToGrid
  } = useGraphStore();

  const { isRunning, advance, reachableNodeIds } = useSimulationStore();

  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(() => ({ storyNode: StoryNode, ending: StoryNode }), []);
  const edgeTypes = useMemo(() => ({ conditionalEdge: ConditionalEdge }), []);

  const derivedNodes = useMemo(() => {
    return storeNodes.map(node => ({
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
      data: {
        label: edge.label,
        condition: edge.condition,
        sideEffects: edge.sideEffects,
      }
    }));
  }, [storeEdges, selectedEdgeId]);

  const onNodeClick = useCallback((event, node) => {
    selectNode(node.id);
    if (isRunning && reachableNodeIds.includes(node.id)) {
      const activeStateId = useSimulationStore.getState().activeNodeId;
      const validEdge = storeEdges.find(e => e.targetId === node.id && e.sourceId === activeStateId);
      if (validEdge) {
        advance(validEdge.id);
      }
    }
  }, [selectNode, isRunning, reachableNodeIds, storeEdges, advance]);

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

  return (
    <div className={`canvas-wrapper ${isRunning ? 'simulation-mode' : ''}`} style={{ width: '100%', height: '100%' }}>
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
