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
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts'; // ADDED: Phase 1 hook import
import NameModal from 'components/NameModal'; // ADDED: Phase 2 NameModal import
import NodeInspector from 'components/NodeInspector'; // FIX: used by node creation modal
import ContextMenu from 'components/ContextMenu'; // ADDED: Phase 3 ContextMenu import

import CommonNode from './nodes/CommonNode';
import ChoiceNode from './nodes/ChoiceNode';
import EndingNode from './nodes/EndingNode';
import ConditionalEdge from './edges/ConditionalEdge';

function GraphCanvasInner() {

  const {
    common = {},
    choice = {},
    ending = {},
    edges: storeEdges,
    addNode,
    addEdge,
    updateNode,
    deleteNode,
  } = useNarrativeStore();

  const {
    selectNode,
    selectEdge,
    clearSelection,
    selectedNodeId,
    selectedEdgeId,
    selectedNodeIds, // ADDED: Phase 1
    setSelectedNodeIds, // ADDED: Phase 1
    snapToGrid
  } = useUIStore();

  const { isCampaignActive, advance, reachableNodeIds, reachableEdgeIds, runPassiveAnalysis } = useSimulationStore();

  // PROTECTED: runPassiveAnalysis trigger useEffect
  useEffect(() => {
    runPassiveAnalysis();
  }, [common, choice, ending, storeEdges, isCampaignActive, runPassiveAnalysis]);

  useKeyboardShortcuts(); // ADDED: Phase 1 mount hook

  const { screenToFlowPosition } = useReactFlow();

  // ADDED: Phase 2 local state for naming modal
  const [pendingNameModal, setPendingNameModal] = useState(null);

  // FIX: local state for node creation modal (common/choice/ending via creation bar)
  const [pendingNodeModal, setPendingNodeModal] = useState(null);

  // FIX: Ref to the canvas wrapper for computing canvas-relative mouse coordinates
  const canvasRef = useRef(null);

  // FIX: Track mouse position relative to the canvas container, not the window.
  // This avoids offset bugs on multi-monitor setups where the browser viewport
  // may start at a non-zero screen coordinate.
  const lastMousePos = useRef(null);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      lastMousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Helper: get a flow position near the current mouse cursor with a small random offset
  const getMouseFlowPosition = useCallback(() => {
    if (!canvasRef.current) {
      return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
    const rect = canvasRef.current.getBoundingClientRect();
    // Use tracked mouse pos, or fall back to center of the canvas element
    const pos = lastMousePos.current || { x: rect.width / 2, y: rect.height / 2 };
    // Convert canvas-relative px to React Flow's coordinate space
    const flowPos = screenToFlowPosition({
      x: rect.left + pos.x,
      y: rect.top + pos.y,
    });
    // Small random jitter (±30px in flow space) to avoid exact stacking
    flowPos.x += (Math.random() - 0.5) * 60;
    flowPos.y += (Math.random() - 0.5) * 60;
    return flowPos;
  }, [screenToFlowPosition]);

  // ADDED: Phase 2 listen for node creation from shortcuts
  useEffect(() => {
    const handleAddNode = (e) => {
      // ADDED: Phase 3 explicit screen coordinate override support
      if (e.detail.screenX !== undefined && e.detail.screenY !== undefined) {
        addNode(screenToFlowPosition({ x: e.detail.screenX, y: e.detail.screenY }), e.detail.type, e.detail.label);
      } else {
        addNode(getMouseFlowPosition(), e.detail.type, e.detail.label);
      }
    };
    window.addEventListener('canvas-add-node', handleAddNode);
    return () => window.removeEventListener('canvas-add-node', handleAddNode);
  }, [addNode, getMouseFlowPosition, screenToFlowPosition]);

  // FIX: listen for node creation modal — creates node immediately, then shows inspector modal
  useEffect(() => {
    const handleOpenNodeModal = (e) => {
      if (useSimulationStore.getState().isCampaignActive) return;
      const { nodeType, screenX, screenY } = e.detail;
      let pos;
      if (screenX !== undefined && screenY !== undefined) {
        pos = screenToFlowPosition({ x: screenX, y: screenY });
      } else if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        pos = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        // jitter to avoid stacking when multiple nodes are created from center
        pos.x += (Math.random() - 0.5) * 60;
        pos.y += (Math.random() - 0.5) * 60;
      } else {
        pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
      const newId = addNode(pos, nodeType);
      selectNode(newId);
      setPendingNodeModal(newId);
    };
    window.addEventListener('canvas-open-node-modal', handleOpenNodeModal);
    return () => window.removeEventListener('canvas-open-node-modal', handleOpenNodeModal);
  }, [addNode, selectNode, screenToFlowPosition]);

  // FIX: listen for focus-node requests from delete guards in FlagManager/StatusManager
  const { fitView } = useReactFlow();
  useEffect(() => {
    const handleFocusNode = (e) => {
      const { nodeId } = e.detail;
      selectNode(nodeId);
      setTimeout(() => fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.3 }), 50);
    };
    window.addEventListener('canvas-focus-node', handleFocusNode);
    return () => window.removeEventListener('canvas-focus-node', handleFocusNode);
  }, [selectNode, fitView]);

  // ADDED: Phase 2 listen for naming modal opens
  useEffect(() => {
    const handleOpenModal = (e) => {
      if (useSimulationStore.getState().isCampaignActive) return;
      setPendingNameModal(e.detail.entityType);
    };
    window.addEventListener('canvas-open-name-modal', handleOpenModal);
    return () => window.removeEventListener('canvas-open-name-modal', handleOpenModal);
  }, []);

  const nodeTypes = useMemo(() => ({
    commonNode: CommonNode,
    choiceNode: ChoiceNode,
    endingNode: EndingNode
  }), []);
  
  const edgeTypes = useMemo(() => ({ conditionalEdge: ConditionalEdge }), []);


  const derivedNodes = useMemo(() => {
    // FIX: Sort all nodes by createdAt so later-created nodes appear on top (higher zIndex)
    const allNodes = [
      ...Object.values(common).map(node => ({ ...node, _type: 'commonNode' })),
      ...Object.values(choice).map(node => ({ ...node, _type: 'choiceNode' })),
      ...Object.values(ending).map(node => ({ ...node, _type: 'endingNode' })),
    ].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return allNodes.map((node, idx) => ({
      id: node.id,
      type: node._type,
      position: node.position,
      zIndex: idx + 1, // FIX: z-order by creation order — later nodes on top
      data: node.data,
    }));
  }, [common, choice, ending]);

  const [rfNodes, setRfNodes] = useState(derivedNodes);

  // ADDED: Phase 3 Context Menu state
  const [contextMenuState, setContextMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    targetId: null
  });

  const closeContextMenu = useCallback(() => {
    setContextMenuState(s => s.visible ? { ...s, visible: false } : s);
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    if (useSimulationStore.getState().isCampaignActive) return;
    setContextMenuState({ visible: true, x: event.clientX, y: event.clientY, type: 'pane', targetId: null });
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    if (useSimulationStore.getState().isCampaignActive) return;
    const isMulti = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
    setContextMenuState({ visible: true, x: event.clientX, y: event.clientY, type: isMulti ? 'multi' : 'node', targetId: node.id });
  }, [selectedNodeIds]);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    if (useSimulationStore.getState().isCampaignActive) return;
    setContextMenuState({ visible: true, x: event.clientX, y: event.clientY, type: 'edge', targetId: edge.id });
  }, []);

  // Sync from store when store changes (e.g. node added/deleted), but not during drag
  const isDragging = useRef(false);
  useEffect(() => {
    if (!isDragging.current) {
      setRfNodes(prevNodes => derivedNodes.map(dn => {
        const prevNode = prevNodes.find(p => p.id === dn.id);
        return {
          ...dn,
          selected: prevNode?.selected || false
        };
      }));
    }
  }, [derivedNodes]);

  const reactFlowEdges = useMemo(() => {
    return storeEdges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      sourceHandle: edge.optionId || null,
      type: 'conditionalEdge',
      selected: edge.id === selectedEdgeId,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#b1b6be',
      },
      data: {
        label: edge.label,
        condition: edge.condition,
        optionId: edge.optionId
      }
    }));
  }, [storeEdges, selectedEdgeId]);

  // PROTECTED: Campaign advance-by-click in onNodeClick
  const onNodeClick = useCallback((event, node) => {
    if (isCampaignActive) {
      const activeStateId = useSimulationStore.getState().activeNodeId;
      const selectedOptionId = useSimulationStore.getState().selectedOptionId;
      if (reachableNodeIds.includes(node.id)) {
        const isChoice = !!useNarrativeStore.getState().choice[activeStateId];
        const edge = storeEdges.find(
          e => e.sourceId === activeStateId && e.targetId === node.id && reachableEdgeIds.includes(e.id) && (!isChoice || e.optionId === selectedOptionId)
        );
        if (edge) {
          advance(edge.id);
        }
      }
      return; 
    }
    selectNode(node.id);
  }, [selectNode, isCampaignActive, reachableNodeIds, reachableEdgeIds, storeEdges, advance]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    selectEdge(edge.id);
  }, [selectEdge]);

  // PROTECTED: onConnect edge-stamping logic
  const onConnect = useCallback((params) => {
    try {
      if (params.sourceHandle && params.sourceHandle.startsWith('opt-')) {
        addEdge(params.source, params.target, params.sourceHandle);
      } else {
        addEdge(params.source, params.target);
      }
    } catch (e) {
      console.error(e.message);
    }
  }, [addEdge]);

  const lastClickTime = useRef(0);
  // PROTECTED: Double-click-to-add behavior in onPaneClick
  const onPaneClick = useCallback((event) => {
    closeContextMenu(); // ADDED: Phase 3 dismiss
    if (isCampaignActive) return; // FIX: Prevent node creation in campaign mode
    clearSelection();
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'common', screenX: event.clientX, screenY: event.clientY } }));
    }
    lastClickTime.current = now;
  }, [clearSelection, closeContextMenu, isCampaignActive]);

  const onNodesChange = useCallback((changes) => {
    setRfNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  // ADDED: Phase 1 multi-selection sync
  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodeIds(nodes.map(n => n.id));
  }, [setSelectedNodeIds]);

  const onNodeDragStart = useCallback(() => {
    closeContextMenu(); // ADDED: Phase 3 dismiss
    isDragging.current = true;
  }, [closeContextMenu]);

  // FIX 2.a: In xyflow v12, onNodeDragStop receives (event, node, nodes) where
  // `nodes` is the FULL array of all nodes currently being dragged (including
  // multi-selection). By persisting ALL of them here — BEFORE setting isDragging
  // to false — we ensure derivedNodes will have correct positions when the sync
  // useEffect fires on the next render.
  // PROTECTED: onNodeDragStop -> updateNode (integration point)
  const onNodeDragStop = useCallback((event, node, nodes) => {
    // `nodes` contains every node in the drag (single or multi-select)
    if (nodes && nodes.length > 1) {
      nodes.forEach(n => updateNode(n.id, { position: n.position }));
    } else {
      updateNode(node.id, { position: node.position });
    }
    isDragging.current = false;
  }, [updateNode]);

  // PROTECTED: graph-layout-tidy event listener
  useEffect(() => {
    const handleTidy = () => {
      setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 50);
    };
    window.addEventListener('graph-layout-tidy', handleTidy);
    return () => window.removeEventListener('graph-layout-tidy', handleTidy);
  }, [fitView]);

  return (
    <div ref={canvasRef} className={`canvas-wrapper ${isCampaignActive ? 'campaign-mode' : ''}`} style={{ width: '100%', height: '100%' }}>
      {isCampaignActive && (
        <div className="simulation-banner" style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          backgroundColor: 'var(--color-active)', color: '#000', textAlign: 'center',
          padding: '8px', fontWeight: 'bold'
        }}>
          ⚡ Campaign Active — click a highlighted node to advance
        </div>
      )}
      
      {/* ADDED: Phase 2 naming modal render */}
      {pendingNameModal !== null && (
        <NameModal
          entityType={pendingNameModal}
          onClose={() => setPendingNameModal(null)}
        />
      )}

      {/* FIX: node creation modal — shows NodeInspector for the just-created node.
           Cancelling (backdrop/ESC) deletes the node. Done keeps it. */}
      {pendingNodeModal !== null && (() => {
        const cancelNodeModal = () => {
          deleteNode(pendingNodeModal);
          clearSelection();
          setPendingNodeModal(null);
        };
        return (
          <div className="name-modal__backdrop" onClick={cancelNodeModal}>
            <div
              className="name-modal node-creation-modal"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') cancelNodeModal(); }}
            >
              <div className="name-modal__header">Configure New Node</div>
              <div className="name-modal__body node-creation-modal__body">
                <NodeInspector nodeId={pendingNodeModal} hideDelete />
              </div>
              <div className="name-modal__footer">
                <button className="button" onClick={cancelNodeModal}>Cancel</button>
                <button className="button button--primary" onClick={() => setPendingNodeModal(null)}>Done</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADDED: Phase 3 context menu render */}
      {contextMenuState.visible && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          type={contextMenuState.type}
          targetId={contextMenuState.targetId}
          onClose={closeContextMenu}
        />
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
        onSelectionChange={onSelectionChange} // ADDED: Phase 1
        onPaneContextMenu={onPaneContextMenu} // ADDED: Phase 3
        onNodeContextMenu={onNodeContextMenu} // ADDED: Phase 3
        onEdgeContextMenu={onEdgeContextMenu} // ADDED: Phase 3
        onMoveStart={closeContextMenu} // ADDED: Phase 3 dismiss
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

// PROTECTED: ReactFlowProvider wrapper pattern
export default function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
