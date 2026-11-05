import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { ConnectionLineType, applyNodeChanges } from '@xyflow/react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { computeSnapGuides, getSnappedPosition, getActiveGuides, applyAxisLock, miniMapNodeColor, computeAlignment, nodeMatchesFilters, nodeRouteType, EDGE_COLOR } from 'utils';

import { useNarrativeStore, useSimulationStore, useUIStore, beginGroup, endGroup, cancelGroup } from 'store';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts'; // ADDED: Phase 1 hook import
import NameModal from 'components/NameModal'; // ADDED: Phase 2 NameModal import
// CHANGED: NodeInspector docked panel → NodeConfigModal full-screen modal (Phase 6)
import NodeConfigModal from 'components/modals/NodeConfigModal';
import WarpConfigModal from 'components/modals/WarpConfigModal';
import EdgeConfigModal from 'components/modals/EdgeConfigModal'; // ADDED: Phase 6
import ContextMenu from 'components/ContextMenu'; // ADDED: Phase 3 ContextMenu import
import CanvasControls from 'components/CanvasControls'; // ADDED (Redesign Step 4)

import CommonNode from './nodes/CommonNode';
import ChoiceNode from './nodes/ChoiceNode';
import EndingNode from './nodes/EndingNode';
import WarpEntranceNode from './nodes/WarpEntranceNode';
import WarpExitNode from './nodes/WarpExitNode';
import HubNode from './nodes/HubNode';
import ConditionalEdge from './edges/ConditionalEdge';

// Module-scoped type definitions (AR-01 / RISK-AUD-01 mitigation)
// Defined outside component scope to guarantee stable object reference across component lifecycles
const NODE_TYPES = {
  commonNode: CommonNode,
  choiceNode: ChoiceNode,
  endingNode: EndingNode,
  warpEntranceNode: WarpEntranceNode,
  warpExitNode: WarpExitNode,
  hubNode: HubNode
};

const EDGE_TYPES = {
  conditionalEdge: ConditionalEdge
};

// REMOVED (Step 3): CLUSTER_PALETTE, hashEntityColor, and ClusterOverlay - retired in favor of canvas filters

function GraphCanvasInner() {

  // FIX (Redesign Step 4): per-slice selectors instead of whole-store destructures (AR-23) — previously every
  // store change (selection, toasts of unrelated fields, simulation ticks) re-rendered the whole canvas.
  const common = useNarrativeStore(s => s.common);
  const choice = useNarrativeStore(s => s.choice);
  const ending = useNarrativeStore(s => s.ending);
  const storeEdges = useNarrativeStore(s => s.edges);
  const addNode = useNarrativeStore(s => s.addNode);
  const addEdge = useNarrativeStore(s => s.addEdge);
  const updateNode = useNarrativeStore(s => s.updateNode);
  const updateEdge = useNarrativeStore(s => s.updateEdge);
  const deleteNode = useNarrativeStore(s => s.deleteNode);
  const pasteNode = useNarrativeStore(s => s.pasteNode);

  const selectNode = useUIStore(s => s.selectNode);
  const selectEdge = useUIStore(s => s.selectEdge);
  const clearSelection = useUIStore(s => s.clearSelection);
  const selectedEdgeId = useUIStore(s => s.selectedEdgeId);
  const selectedNodeIds = useUIStore(s => s.selectedNodeIds); // ADDED: Phase 1
  const setSelectedNodeIds = useUIStore(s => s.setSelectedNodeIds); // ADDED: Phase 1
  const snapToGrid = useUIStore(s => s.snapToGrid);
  const followActiveNode = useUIStore(s => s.followActiveNode);
  const showMiniMap = useUIStore(s => s.showMiniMap); // ADDED (Redesign Step 4)

  const canvasFilterChapterId = useUIStore(s => s.canvasFilterChapterId);
  const canvasFilterPathId = useUIStore(s => s.canvasFilterPathId);
  const canvasFilterTagIds = useUIStore(s => s.canvasFilterTagIds);
  const canvasFilterTagsLogic = useUIStore(s => s.canvasFilterTagsLogic);
  const canvasFilterNodeType = useUIStore(s => s.canvasFilterNodeType); // ADDED (Redesign Step 6)
  const canvasFilterCollectibleCategoryId = useUIStore(s => s.canvasFilterCollectibleCategoryId); // ADDED (Redesign Step 6)
  const collectibleDict = useNarrativeStore(s => s.collectible); // ADDED (Redesign Step 6)

  // ADDED: Snap Assist — per-slice selectors (AR-23)
  const snapAssist = useUIStore(s => s.snapAssist);
  const snapThreshold = useUIStore(s => s.snapThreshold);

  // ADDED: Snap Assist refs — no store, no re-renders (AR-03)
  // Guide cache: computed ONCE in onNodeDragStart, reused cheaply each frame
  const dragGuidesCache = useRef({ yGuides: [], xGuides: [] });
  // Start positions: stored at dragStart for Shift-lock axis detection
  const dragStartPositions = useRef({});
  // Active guide coordinates: which guide lines to render (null = none)
  const [activeGuides, setActiveGuides] = useState({ y: null, x: null });

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const activeNodeId = useSimulationStore(s => s.activeNodeId);
  const advance = useSimulationStore(s => s.advance);
  const reachableNodeIds = useSimulationStore(s => s.reachableNodeIds);
  const reachableEdgeIds = useSimulationStore(s => s.reachableEdgeIds);
  const runPassiveAnalysis = useSimulationStore(s => s.runPassiveAnalysis);

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
      beginGroup(); // ADDED (Redesign Step 5): creation + modal edits = one undo step
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

  // ADDED (Redesign Step 5): each node / edge editing session is a single undo step
  useEffect(() => {
    if (editingNodeModal === null) return undefined;
    beginGroup();
    return () => endGroup();
  }, [editingNodeModal]);
  useEffect(() => {
    if (editingEdgeModal === null) return undefined;
    beginGroup();
    return () => endGroup();
  }, [editingEdgeModal]);

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

  // ADDED: Step 1 — Listen for canvas-center-origin event to center canvas at (0, 0) and reset zoom
  useEffect(() => {
    const handleCenterOrigin = () => {
      setCenter(0, 0, { zoom: 1, duration: 400 });
    };
    window.addEventListener('canvas-center-origin', handleCenterOrigin);
    return () => window.removeEventListener('canvas-center-origin', handleCenterOrigin);
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
        else if (node.type === 'hub') _type = 'hubNode';
        return { ...node, _type };
      }),
      ...Object.values(choice).map(node => ({ ...node, _type: 'choiceNode' })),
      ...Object.values(ending).map(node => ({ ...node, _type: 'endingNode' })),
    ].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // CHANGED (Redesign Step 6): one shared predicate (utils/searchIndex) for canvas dimming and the Browse list
    const filters = {
      chapterId: canvasFilterChapterId,
      pathId: canvasFilterPathId,
      tagIds: canvasFilterTagIds,
      tagsLogic: canvasFilterTagsLogic,
      nodeType: canvasFilterNodeType,
      collectibleCategoryId: canvasFilterCollectibleCategoryId,
    };
    return sorted.map((node, idx) => {
      const nodeData = node.data || {};
      const collection = node._type === 'choiceNode' ? 'choice' : node._type === 'endingNode' ? 'ending' : 'common';
      const isFilteredOut = !nodeMatchesFilters(node, nodeRouteType(node, collection), filters, collectibleDict);

      return {
        id: node.id,
        type: node._type,
        position: node.position,
        zIndex: idx + 1, // FIX: z-order by creation order — later nodes on top
        data: {
          ...nodeData,
          isFilteredOut,
        },
      };
    });
  }, [common, choice, ending, canvasFilterChapterId, canvasFilterPathId, canvasFilterTagIds, canvasFilterTagsLogic, canvasFilterNodeType, canvasFilterCollectibleCategoryId, collectibleDict]);

  // REMOVED (Step 3): clusterBoxes computation - retired in favor of canvas filters

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
      // CHANGED (Redesign Step 5): nodes that are new to the canvas (e.g. just duplicated) take their selection
      // from uiStore, so a programmatic selection made before React rendered them is not lost.
      const pendingSelected = new Set(useUIStore.getState().selectedNodeIds);
      setRfNodes(prevNodes => derivedNodes.map(dn => {
        const prevNode = prevNodes.find(p => p.id === dn.id);
        return {
          ...dn,
          selected: prevNode ? !!prevNode.selected : pendingSelected.has(dn.id)
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
        color: EDGE_COLOR, // CHANGED (Redesign Step 8)
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
    // ADDED (Redesign Step 7): clicking a node on the canvas shows it in the Inspector
    window.dispatchEvent(new CustomEvent('switch-right-panel', { detail: 'Inspector' }));
  }, [selectNode, isCampaignActive, reachableNodeIds, reachableEdgeIds, storeEdges, advance]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    selectEdge(edge.id);
    if (!useSimulationStore.getState().isCampaignActive) {
      // ADDED (Redesign Step 7): clicking an edge shows it in the Inspector
      window.dispatchEvent(new CustomEvent('switch-right-panel', { detail: 'Inspector' }));
    }
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
    if (isCampaignActive) return;
    try {
      if (params.sourceHandle && params.sourceHandle.startsWith('opt-')) {
        addEdge(params.source, params.target, params.sourceHandle);
      } else {
        addEdge(params.source, params.target);
      }
    } catch (e) {
      console.error(e.message);
    }
  }, [addEdge, isCampaignActive]);

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
  // PROTECTED / LOAD-BEARING (RISK-CMK-12): Fires synchronously on React Flow selection events.
  // Relies on `setSelectedNodeIds` in `uiStore.js` performing order-independent set equality checks
  // to prevent infinite state update / re-render loops.
  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodeIds(nodes.map(n => n.id));
  }, [setSelectedNodeIds]);

  // MODIFIED: Snap Assist — store start positions for Shift-lock + pre-compute guide cache ONCE
  const onNodeDragStart = useCallback((event, node, nodes) => {
    closeContextMenu(); // ADDED: Phase 3 dismiss
    isDragging.current = true;

    if (!snapAssist || isCampaignActive) return;

    // Collect IDs of every node in the drag group (single or multi-select)
    const dragging = nodes && nodes.length > 1 ? nodes : [node];
    const draggingIds = new Set(dragging.map(n => n.id));

    // Store start positions for Shift-lock (Q3)
    const starts = {};
    dragging.forEach(n => { starts[n.id] = { x: n.position.x, y: n.position.y }; });
    dragStartPositions.current = starts;

    // Pre-compute guide rails ONCE from all non-dragging, non-Hub nodes
    // Hub nodes are excluded: they are pass-through routers that should not define rails
    const otherNodes = rfNodes.filter(
      n => !draggingIds.has(n.id) && n.type !== 'hubNode'
    );
    dragGuidesCache.current = computeSnapGuides(otherNodes);
  }, [closeContextMenu, snapAssist, isCampaignActive, rfNodes]);

  // ADDED: Snap Assist — per-frame guide visibility check (Ctrl-hold shows guide lines)
  // Guide positions are read from the pre-computed cache (O log N binary search, not O N iteration)
  const onNodeDrag = useCallback((event, node) => {
    if (!snapAssist || isCampaignActive) return;

    // Guide lines only visible when Ctrl is held (Q2)
    if (!document.body.classList.contains('ctrl-pressed')) {
      // Clear active guide state only if there was one — avoids unnecessary re-renders
      setActiveGuides(prev => (prev.y === null && prev.x === null) ? prev : { y: null, x: null });
      return;
    }

    const active = getActiveGuides(node.position, dragGuidesCache.current, snapThreshold);
    // Only update state when active guide actually changes — prevents re-renders on every frame
    setActiveGuides(prev =>
      prev.y === active.y && prev.x === active.x ? prev : active
    );
  }, [snapAssist, isCampaignActive, snapThreshold]);

  // FIX 2.a: In xyflow v12, onNodeDragStop receives (event, node, nodes) where
  // `nodes` is the FULL array of all nodes currently being dragged (including
  // multi-selection). By persisting ALL of them here — BEFORE setting isDragging
  // to false — we ensure derivedNodes will have correct positions when the sync
  // useEffect fires on the next render.
  // PROTECTED: onNodeDragStop -> updateNode (integration point)
  // MODIFIED: Snap Assist — apply Shift-lock (Q3) then guide snap (Q1) on drop
  //   Hub nodes bypass both corrections: they are excluded from snap entirely.
  const onNodeDragStop = useCallback((event, node, nodes) => {
    const dragging = nodes && nodes.length > 1 ? nodes : [node];
    const shiftHeld = document.body.classList.contains('shift-pressed');

    dragging.forEach(n => {
      // Hub nodes: persist position as-is, no snap or axis lock
      if (n.type === 'hubNode') {
        updateNode(n.id, { position: n.position });
        return;
      }

      if (snapAssist && !isCampaignActive) {
        let pos = { x: n.position.x, y: n.position.y };

        // Q3: Shift-lock axis — constrain to dominant movement direction before snapping
        if (shiftHeld && dragStartPositions.current[n.id]) {
          pos = applyAxisLock(pos, dragStartPositions.current[n.id]);
        }

        // Q1: Snap to nearest guide within threshold (uses cached guides, O log N)
        const snapped = getSnappedPosition(pos, dragGuidesCache.current, snapThreshold);
        updateNode(n.id, { position: snapped });
      } else {
        updateNode(n.id, { position: n.position });
      }
    });

    // Clear all snap assist drag state
    setActiveGuides({ y: null, x: null });
    dragStartPositions.current = {};
    dragGuidesCache.current = { yGuides: [], xGuides: [] };
    isDragging.current = false;
  }, [updateNode, snapAssist, isCampaignActive, snapThreshold]);

  // ADDED (Redesign Step 5): canvas view commands (keyboard zoom / fit shortcuts) — AR-19 event bridge
  const { zoomIn, zoomOut, zoomTo, getNodes } = useReactFlow();
  useEffect(() => {
    const handleView = (e) => {
      const action = e.detail?.action;
      if (action === 'zoom-in') zoomIn({ duration: 150 });
      else if (action === 'zoom-out') zoomOut({ duration: 150 });
      else if (action === 'zoom-reset') zoomTo(1, { duration: 200 });
      else if (action === 'fit') fitView({ duration: 300, padding: 0.15 });
      else if (action === 'fit-selection') {
        const ui = useUIStore.getState();
        const ids = ui.selectedNodeIds.length ? ui.selectedNodeIds : (ui.selectedNodeId ? [ui.selectedNodeId] : []);
        if (ids.length) fitView({ nodes: ids.map(id => ({ id })), duration: 300, padding: 0.3, maxZoom: 1.5 });
      }
    };
    window.addEventListener('canvas-view', handleView);
    return () => window.removeEventListener('canvas-view', handleView);
  }, [zoomIn, zoomOut, zoomTo, fitView]);

  // ADDED (Redesign Step 5): programmatic selection — detail.ids = array of node IDs, or null for every node (Ctrl+A).
  // Keeps React Flow's visual selection and uiStore in step.
  useEffect(() => {
    const handleSelectNodes = (e) => {
      if (useSimulationStore.getState().isCampaignActive) return;
      const ids = e.detail?.ids;
      const wanted = ids ? new Set(ids) : null;
      setRfNodes(nds => nds.map(n => {
        const sel = wanted ? wanted.has(n.id) : true;
        return n.selected === sel ? n : { ...n, selected: sel };
      }));
      const list = ids || derivedNodes.map(n => n.id);
      setSelectedNodeIds(list);
      useUIStore.setState({ selectedNodeId: list.length === 1 ? list[0] : null, selectedEdgeId: null });
    };
    window.addEventListener('canvas-select-nodes', handleSelectNodes);
    return () => window.removeEventListener('canvas-select-nodes', handleSelectNodes);
  }, [derivedNodes, setSelectedNodeIds]);

  // ADDED (Redesign Step 5): align / distribute the multi-selection (uses measured node sizes → needs the provider)
  useEffect(() => {
    const handleAlign = (e) => {
      if (useSimulationStore.getState().isCampaignActive) return;
      const ids = new Set(useUIStore.getState().selectedNodeIds);
      const items = getNodes()
        .filter(n => ids.has(n.id))
        .map(n => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          width: n.measured?.width ?? n.width ?? 240,
          height: n.measured?.height ?? n.height ?? 120,
        }));
      const moves = computeAlignment(items, e.detail?.mode);
      const entries = Object.entries(moves);
      if (!entries.length) return;
      beginGroup();
      entries.forEach(([id, position]) => updateNode(id, { position }));
      endGroup();
    };
    window.addEventListener('canvas-align', handleAlign);
    return () => window.removeEventListener('canvas-align', handleAlign);
  }, [getNodes, updateNode]);

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
      {/* REMOVED (Step 3): ClusterOverlay rendering - retired in favor of canvas filters */}

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
          cancelGroup(); // ADDED (Redesign Step 5): a cancelled creation is not undoable
          clearSelection();
          setPendingNodeModal(null);
        };
        const closeNodeModal = () => {
          endGroup(); // ADDED (Redesign Step 5)
          setPendingNodeModal(null);
        };
        const node = common[pendingNodeModal] || choice[pendingNodeModal] || ending[pendingNodeModal];
        const isWarp = node?.type === 'warp_entrance' || node?.type === 'warp_exit';

        if (isWarp) {
          return (
            <WarpConfigModal
              nodeId={pendingNodeModal}
              onClose={closeNodeModal}
              onCancel={cancelNodeModal}
            />
          );
        }

        return (
          <NodeConfigModal
            nodeId={pendingNodeModal}
            onClose={closeNodeModal}
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

      {/* ADDED: Snap Assist guide line overlay — only rendered when Ctrl held and guide is active */}
      {snapAssist && (activeGuides.y !== null || activeGuides.x !== null) && (
        <SnapGuideOverlay activeGuides={activeGuides} />
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={reactFlowEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        nodesDraggable={!isCampaignActive}
        nodesConnectable={!isCampaignActive}
        elementsSelectable={!isCampaignActive}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
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
        <Background variant="dots" gap={16} color="#2a3040" />
        {/* CHANGED (Redesign Step 4): default <Controls/> replaced by <CanvasControls/>; minimap skinned + toggleable */}
        {showMiniMap && (
          <MiniMap
            className="br-minimap"
            nodeColor={miniMapNodeColor}
            nodeStrokeWidth={0}
            nodeBorderRadius={3}
            bgColor="#191d26"
            maskColor="rgba(18, 21, 28, 0.72)"
            pannable
            zoomable
            ariaLabel="Minimap"
          />
        )}
      </ReactFlow>
      <CanvasControls />
    </div>
  );
}

// ADDED: Snap Assist guide line overlay component.
// Reads useViewport() to convert flow-coordinate guide positions into screen-pixel positions.
// Rendered inside GraphCanvasInner (inside ReactFlowProvider) so useViewport() is valid (AR-19).
// Absolutely positioned relative to .canvas-wrapper; pointer-events: none so it never blocks interaction.
function SnapGuideOverlay({ activeGuides }) {
  const { x: vpX, y: vpY, zoom } = useViewport();
  return (
    <>
      {activeGuides.y !== null && (
        <div
          className="snap-guide snap-guide--horizontal"
          style={{ top: activeGuides.y * zoom + vpY }}
        />
      )}
      {activeGuides.x !== null && (
        <div
          className="snap-guide snap-guide--vertical"
          style={{ left: activeGuides.x * zoom + vpX }}
        />
      )}
    </>
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
