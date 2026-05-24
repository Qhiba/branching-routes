import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { ConnectionLineType, applyNodeChanges } from '@xyflow/react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNarrativeStore, useSimulationStore, useUIStore } from 'store';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts'; // ADDED: Phase 1 hook import
import NameModal from 'components/NameModal'; // ADDED: Phase 2 NameModal import
// CHANGED: NodeInspector docked panel → NodeConfigModal full-screen modal (Phase 6)
import NodeConfigModal from 'components/modals/NodeConfigModal';
import WarpConfigModal from 'components/modals/WarpConfigModal';
import EdgeConfigModal from 'components/modals/EdgeConfigModal'; // ADDED: Phase 6
import ContextMenu from 'components/ContextMenu'; // ADDED: Phase 3 ContextMenu import

import CommonNode from './nodes/CommonNode';
import ChoiceNode from './nodes/ChoiceNode';
import EndingNode from './nodes/EndingNode';
import WarpEntranceNode from './nodes/WarpEntranceNode';
import WarpExitNode from './nodes/WarpExitNode';
import ConditionalEdge from './edges/ConditionalEdge';

// ADDED: Phase 3 — Cluster color palette (stable, module-level constant)
const CLUSTER_PALETTE = [
  '#a78bfa', // violet
  '#34d399', // emerald
  '#f87171', // rose
  '#60a5fa', // blue
  '#fbbf24', // amber
  '#a3e635', // lime
  '#e879f9', // fuchsia
  '#2dd4bf'  // teal
];

// ADDED: Phase 3 — Hash entity ID to deterministic color
function hashEntityColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLUSTER_PALETTE[Math.abs(hash) % CLUSTER_PALETTE.length];
}

// ADDED: Phase 3 — Cluster overlay component renders path/chapter regions behind nodes
function ClusterOverlay({ chapterBoxes, pathBoxes }) {
  const { x, y, zoom } = useViewport();
  const clusterMode = useUIStore(s => s.clusterMode);

  if (clusterMode === 'off') return null;

  const showChapters = clusterMode === 'chapter' || clusterMode === 'both';
  const showPaths = clusterMode === 'path' || clusterMode === 'both';

  return (
    <div className="cluster-overlay">
      <svg
        className="cluster-overlay__svg"
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          {/* ADDED: Phase 3 — SVG filters for path blur effect */}
          {showPaths && pathBoxes.map(box => (
            <filter key={`blur-${box.id}`} id={`blur-${box.id}`}>
              <feGaussianBlur stdDeviation="12" />
            </filter>
          ))}
        </defs>

        {/* ADDED: Phase 3 — Chapter regions (corner-based rounded rectangles) */}
        {showChapters && chapterBoxes.map(box => (
          <rect
            key={`chapter-${box.id}`}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={8}
            ry={8}
            fill={box.color}
            fillOpacity={0.15}
            stroke={box.color}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        ))}

        {/* ADDED: Phase 3 — Path regions (soft blurred rectangles) */}
        {showPaths && pathBoxes.map(box => (
          <rect
            key={`path-${box.id}`}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={0}
            ry={0}
            fill={box.color}
            fillOpacity={0.2}
            filter={`url(#blur-${box.id})`}
          />
        ))}
      </svg>
    </div>
  );
}

function GraphCanvasInner() {

  const {
    common = {},
    choice = {},
    ending = {},
    edges: storeEdges,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
    deleteNode,
    pasteNode,
  } = useNarrativeStore();

  const {
    selectNode,
    selectEdge,
    clearSelection,
    selectedNodeId,
    selectedEdgeId,
    selectedNodeIds, // ADDED: Phase 1
    setSelectedNodeIds, // ADDED: Phase 1
    snapToGrid,
    followActiveNode
  } = useUIStore();

  const { isCampaignActive, activeNodeId, advance, reachableNodeIds, reachableEdgeIds, runPassiveAnalysis } = useSimulationStore();

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

  // ADDED: Phase 3 state for node editing modal
  const [editingNodeModal, setEditingNodeModal] = useState(null);

  // ADDED: Phase 6 state for edge editing modal
  const [editingEdgeModal, setEditingEdgeModal] = useState(null);

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

  // Listen for node pasting (Phase 8 Change #4)
  useEffect(() => {
    const handlePasteNode = (e) => {
      if (useSimulationStore.getState().isCampaignActive) return;
      const copiedNode = useUIStore.getState().copiedNode;
      if (!copiedNode) return;
      
      let pos;
      if (e.detail && e.detail.screenX !== undefined && e.detail.screenY !== undefined) {
        pos = screenToFlowPosition({ x: e.detail.screenX, y: e.detail.screenY });
      } else {
        pos = getMouseFlowPosition();
      }
      pasteNode(copiedNode, pos);
    };
    window.addEventListener('canvas-paste-node', handlePasteNode);
    return () => window.removeEventListener('canvas-paste-node', handlePasteNode);
  }, [pasteNode, getMouseFlowPosition, screenToFlowPosition]);

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

  // ADDED: Phase 3 listen for node edit modal requests
  useEffect(() => {
    const handleEditNodeModal = (e) => {
      setEditingNodeModal(e.detail.nodeId);
    };
    window.addEventListener('canvas-edit-node-modal', handleEditNodeModal);
    return () => window.removeEventListener('canvas-edit-node-modal', handleEditNodeModal);
  }, []);

  // ADDED: Phase 6 listen for edge edit modal requests (from context menu + double-click)
  useEffect(() => {
    const handleEditEdgeModal = (e) => {
      setEditingEdgeModal(e.detail.edgeId);
    };
    window.addEventListener('canvas-edit-edge-modal', handleEditEdgeModal);
    return () => window.removeEventListener('canvas-edit-edge-modal', handleEditEdgeModal);
  }, []);

  // FIX: listen for focus-node requests from delete guards in FlagManager/StatusManager
  // MODIFIED: Phase 2 — add setCenter for canvas-navigate-to-node event
  const { fitView, setCenter } = useReactFlow();
  useEffect(() => {
    const handleFocusNode = (e) => {
      const { nodeId } = e.detail;
      selectNode(nodeId);
      setTimeout(() => fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.3 }), 50);
    };
    window.addEventListener('canvas-focus-node', handleFocusNode);
    return () => window.removeEventListener('canvas-focus-node', handleFocusNode);
  }, [selectNode, fitView]);

  // ADDED: Phase 2 — Listen for canvas-navigate-to-node from CommandPalette
  useEffect(() => {
    const handleNavigate = (e) => {
      const { nodeId } = e.detail;
      const state = useNarrativeStore.getState();
      const node = state.common[nodeId] || state.choice[nodeId] || state.ending[nodeId];
      if (!node) return;
      setCenter(node.position.x + 120, node.position.y + 80, { zoom: 1.2, duration: 400 });
    };
    window.addEventListener('canvas-navigate-to-node', handleNavigate);
    return () => window.removeEventListener('canvas-navigate-to-node', handleNavigate);
  }, [setCenter]);

  // ADDED: Phase 8 Change #6 — Follow Active Node in campaign mode
  useEffect(() => {
    if (isCampaignActive && followActiveNode && activeNodeId) {
      const node = common[activeNodeId] || choice[activeNodeId] || ending[activeNodeId];
      if (node) {
        setCenter(node.position.x + 120, node.position.y + 80, { zoom: 1.2, duration: 400 });
      }
    }
  }, [activeNodeId, isCampaignActive, followActiveNode, common, choice, ending, setCenter]);

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
    endingNode: EndingNode,
    warpEntranceNode: WarpEntranceNode,
    warpExitNode: WarpExitNode
  }), []);

  const edgeTypes = useMemo(() => ({ conditionalEdge: ConditionalEdge }), []);

  // ADDED: Phase 3 — Build flat list of all nodes for cluster bounding box computation
  const allNodes = useMemo(() => [
    ...Object.values(common),
    ...Object.values(choice),
    ...Object.values(ending),
  ], [common, choice, ending]);

  const derivedNodes = useMemo(() => {
    // FIX: Sort all nodes by createdAt so later-created nodes appear on top (higher zIndex)
    const sorted = [
      ...Object.values(common).map(node => {
        let _type = 'commonNode';
        if (node.type === 'warp_entrance') _type = 'warpEntranceNode';
        else if (node.type === 'warp_exit') _type = 'warpExitNode';
        return { ...node, _type };
      }),
      ...Object.values(choice).map(node => ({ ...node, _type: 'choiceNode' })),
      ...Object.values(ending).map(node => ({ ...node, _type: 'endingNode' })),
    ].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return sorted.map((node, idx) => ({
      id: node.id,
      type: node._type,
      position: node.position,
      zIndex: idx + 1, // FIX: z-order by creation order — later nodes on top
      data: node.data,
    }));
  }, [common, choice, ending]);

  // ADDED: Phase 3 — Compute cluster bounding boxes (chapter and path regions)
  const clusterBoxes = useMemo(() => {
    const PADDING = 24;
    const NODE_W = 240;
    const NODE_H = 160;

    const computeBoxes = (entityKey) => {
      const groups = {};
      allNodes.forEach(node => {
        const id = node.data[entityKey];
        if (!id) return;
        if (!groups[id]) groups[id] = [];
        groups[id].push(node.position);
      });

      return Object.entries(groups).map(([id, positions]) => {
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        return {
          id,
          color: hashEntityColor(id),
          x: Math.min(...xs) - PADDING,
          y: Math.min(...ys) - PADDING,
          width: Math.max(...xs) - Math.min(...xs) + NODE_W + PADDING * 2,
          height: Math.max(...ys) - Math.min(...ys) + NODE_H + PADDING * 2,
        };
      });
    };

    return {
      chapterBoxes: computeBoxes('chapterId'),
      pathBoxes: computeBoxes('pathId'),
    };
  }, [allNodes]);

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
      reconnectable: common[edge.sourceId] ? true : 'target',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#b1b6be',
      },
      data: {
        label: edge.label,
        condition: edge.condition,
        optionId: edge.optionId,
        bendX: edge.bendX,
        labelOffsetX: edge.labelOffsetX,
        labelOffsetY: edge.labelOffsetY,
      }
    }));
  }, [storeEdges, selectedEdgeId, common]);

  // CHANGED: Phase 6 fix — double-click on node opens edit modal
  const onNodeDoubleClick = useCallback((event, node) => {
    if (isCampaignActive) return;
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId: node.id } }));
  }, [isCampaignActive]);

  // ADDED: Phase 6 — double-click on edge opens EdgeConfigModal
  const onEdgeDoubleClick = useCallback((event, edge) => {
    if (isCampaignActive) return;
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('canvas-edit-edge-modal', { detail: { edgeId: edge.id } }));
  }, [isCampaignActive]);

  // PRESERVED: Campaign advance-by-click in onNodeClick
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

  const onReconnect = useCallback((oldEdge, newConnection) => {
    if (isCampaignActive) return;
    const patch = {};
    if (newConnection.target !== oldEdge.target) patch.targetId = newConnection.target;
    if (newConnection.source !== oldEdge.source) patch.sourceId = newConnection.source;
    if (Object.keys(patch).length > 0) updateEdge(oldEdge.id, patch);
  }, [isCampaignActive, updateEdge]);

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

  // CHANGED: Phase 6 fix — double-click pane no longer creates a node (was: double-click-to-add)
  // Node creation is now exclusively via FloatingMiddleBar or context menu
  const onPaneClick = useCallback((event) => {
    closeContextMenu(); // ADDED: Phase 3 dismiss
    if (isCampaignActive) return;
    clearSelection();
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
    <div ref={canvasRef} className={`canvas-wrapper canvas-wrapper--full ${isCampaignActive ? 'campaign-mode' : ''}`}>
      {/* ADDED: Phase 3 — Cluster overlay (chapter/path regions behind nodes) */}
      <ClusterOverlay chapterBoxes={clusterBoxes.chapterBoxes} pathBoxes={clusterBoxes.pathBoxes} />

      {/* REMOVED: Phase 5 — Legacy campaign banner retired; FloatingMiddleBar pill takes over */}

      {/* ADDED: Phase 2 naming modal render */}
      {pendingNameModal !== null && (
        <NameModal
          entityType={pendingNameModal}
          onClose={() => setPendingNameModal(null)}
        />
      )}

      {/* CHANGED: Phase 6 — Node creation modal now uses NodeConfigModal or WarpConfigModal */}
      {/* FIX (self-review): onCancel wired to cancelNodeModal — deletes orphan if user cancels */}
      {pendingNodeModal !== null && (() => {
        const cancelNodeModal = () => {
          deleteNode(pendingNodeModal);
          clearSelection();
          setPendingNodeModal(null);
        };
        const node = common[pendingNodeModal] || choice[pendingNodeModal] || ending[pendingNodeModal];
        const isWarp = node?.type === 'warp_entrance' || node?.type === 'warp_exit';

        if (isWarp) {
          return (
            <WarpConfigModal
              nodeId={pendingNodeModal}
              onClose={() => setPendingNodeModal(null)}
              onCancel={cancelNodeModal}
            />
          );
        }

        return (
          <NodeConfigModal
            nodeId={pendingNodeModal}
            onClose={() => setPendingNodeModal(null)}
            onCancel={cancelNodeModal}
          />
        );
      })()}

      {/* CHANGED: Phase 6 — Node edit modal now uses NodeConfigModal or WarpConfigModal */}
      {editingNodeModal !== null && (() => {
        const node = common[editingNodeModal] || choice[editingNodeModal] || ending[editingNodeModal];
        const isWarp = node?.type === 'warp_entrance' || node?.type === 'warp_exit';

        if (isWarp) {
          return (
            <WarpConfigModal
              nodeId={editingNodeModal}
              onClose={() => setEditingNodeModal(null)}
            />
          );
        }

        return (
          <NodeConfigModal
            nodeId={editingNodeModal}
            onClose={() => setEditingNodeModal(null)}
          />
        );
      })()}

      {/* ADDED: Phase 6 — Edge config modal */}
      {editingEdgeModal !== null && (
        <EdgeConfigModal
          edgeId={editingEdgeModal}
          onClose={() => setEditingEdgeModal(null)}
        />
      )}

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
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange} // ADDED: Phase 1
        onPaneContextMenu={onPaneContextMenu} // ADDED: Phase 3
        onNodeContextMenu={onNodeContextMenu} // ADDED: Phase 3
        onEdgeContextMenu={onEdgeContextMenu} // ADDED: Phase 3
        onMoveStart={closeContextMenu} // ADDED: Phase 3 dismiss
        defaultEdgeOptions={{ type: 'conditionalEdge', reconnectable: 'target' }}
        connectionLineType={ConnectionLineType.SmoothStep}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        minZoom={0.1}
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
