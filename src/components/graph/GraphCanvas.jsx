// ============================================================
// GraphCanvas.jsx — Full-viewport React Flow wrapper
// ============================================================
// Core visual component of Branching Routes V2.
// Renders a full-viewport <ReactFlow> canvas with:
//   - Pan, zoom, multi-select interactions
//   - Data-driven nodes from the narrative store
//   - Edges from next[].target references
//   - Custom node renderers (Phase 7): CommonNodeRenderer,
//     ChoiceNodeRenderer, EndingNodeRenderer
//   - Custom edge renderer (Phase 7): ConditionalEdge
//   - Context menu integration (Phase 8): right-click on
//     canvas, nodes, and edges triggers context-sensitive menus
//   - Keyboard shortcuts (Phase 8): global shortcut listener
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/graph/
//   AR-02: state from Zustand stores, not local state
//   AR-09: styles consume tokens via GraphCanvas.css
//   AR-10: _position used for node positioning
// ============================================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphSync } from '@/hooks/useGraphSync.js';
import { useGraphCallbacks } from '@/hooks/useGraphCallbacks.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';

// ── Custom node renderers (Phase 7) ─────────────────────────
import CommonNodeRenderer from './nodes/CommonNodeRenderer.jsx';
import ChoiceNodeRenderer from './nodes/ChoiceNodeRenderer.jsx';
import EndingNodeRenderer from './nodes/EndingNodeRenderer.jsx';

// ── Custom edge renderer (Phase 7) ──────────────────────────
import ConditionalEdge from './edges/ConditionalEdge.jsx';

import './GraphCanvas.css';

// ── Node types registration ──────────────────────────────────

const NODE_TYPES = {
  commonNode: CommonNodeRenderer,
  choiceNode: ChoiceNodeRenderer,
  endingNode: EndingNodeRenderer,
};

// ── Edge types registration ──────────────────────────────────

const EDGE_TYPES = {
  conditional: ConditionalEdge,
};

// ── GraphCanvas component ────────────────────────────────────

/**
 * Full-viewport React Flow canvas wrapper.
 * Renders data-driven nodes and edges from the narrative store
 * with pan/zoom/select/connect interactions.
 * Phase 8: integrates context menu and keyboard shortcuts.
 */
function GraphCanvas() {
  // Read data-driven nodes and edges from the sync hook
  const { nodes: syncedNodes, edges: syncedEdges } = useGraphSync();

  // Local state for React Flow's controlled mode
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Sync store data into local state when it changes.
  // Using useEffect instead of useMemo — setState must not run during render.
  useEffect(() => {
    setNodes(syncedNodes);
  }, [syncedNodes]);

  useEffect(() => {
    setEdges(syncedEdges);
  }, [syncedEdges]);

  // Wire up callbacks
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
  } = useGraphCallbacks(setNodes, setEdges);

  // ── Phase 8: Keyboard shortcuts ────────────────────────────
  useKeyboardShortcuts();

  // ── Phase 8: Context menu integration ──────────────────────
  const { showMenu } = useContextMenu();

  /**
   * Handle right-click on the canvas background (pane).
   * Shows the canvas context menu at the cursor position.
   */
  const onPaneContextMenu = useCallback(
    (event) => {
      showMenu(event, null, 'canvas');
    },
    [showMenu]
  );

  /**
   * Handle right-click on a node.
   * Shows the node context menu with the target node ID.
   */
  const onNodeContextMenu = useCallback(
    (event, node) => {
      showMenu(event, node.id, 'node');
    },
    [showMenu]
  );

  /**
   * Handle right-click on an edge.
   * Shows the edge context menu with the target edge ID.
   */
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      showMenu(event, edge.id, 'edge');
    },
    [showMenu]
  );

  // Minimap node color based on entity type
  // AR-09 exemption: MiniMap nodeColor requires raw string, cannot use CSS custom properties
  const minimapNodeColor = useCallback((node) => {
    switch (node.type) {
      case 'commonNode':
        return 'hsl(210, 100%, 55%)'; // --color-node-common
      case 'choiceNode':
        return 'hsl(265, 80%, 60%)'; // --color-node-choice
      case 'endingNode':
        return 'hsl(0, 75%, 55%)'; // --color-node-ending
      default:
        return 'hsl(220, 10%, 35%)';
    }
  }, []);

  return (
    <div className="graph-canvas" id="graph-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={3}
        deleteKeyCode={null}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        panOnScroll
        zoomOnDoubleClick={false}
        colorMode="dark"
        defaultEdgeOptions={{
          type: 'conditional',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(220, 10%, 18%)"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          position="bottom-right"
          nodeColor={minimapNodeColor}
          maskColor="hsla(220, 16%, 6%, 0.75)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export default GraphCanvas;
