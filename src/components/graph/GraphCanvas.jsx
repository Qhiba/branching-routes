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
//   - Visual clustering (Phase 14): chapter/path background groups
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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphSync } from '@/hooks/useGraphSync.js';
import { useGraphCallbacks } from '@/hooks/useGraphCallbacks.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';

// ── Custom node renderers (Phase 7) ─────────────────────────
import CommonNodeRenderer from './nodes/CommonNodeRenderer.jsx';
import ChoiceNodeRenderer from './nodes/ChoiceNodeRenderer.jsx';
import EndingNodeRenderer from './nodes/EndingNodeRenderer.jsx';

// ── Custom edge renderer (Phase 7) ──────────────────────────
import ConditionalEdge from './edges/ConditionalEdge.jsx';

// ── Phase 13: Separate minimap component ─────────────────────
import Minimap from '../ui/Minimap.jsx';

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

// ── Phase 14: Clustering colors ─────────────────────────────

const CLUSTER_COLORS = [
  'hsla(210, 80%, 40%, 0.06)',
  'hsla(265, 60%, 45%, 0.06)',
  'hsla(145, 60%, 40%, 0.06)',
  'hsla(38, 80%, 45%, 0.06)',
  'hsla(330, 60%, 45%, 0.06)',
  'hsla(185, 70%, 40%, 0.06)',
  'hsla(0, 60%, 45%, 0.06)',
  'hsla(50, 70%, 45%, 0.06)',
];

// ── GraphCanvas component ────────────────────────────────────

/**
 * Full-viewport React Flow canvas wrapper.
 * Renders data-driven nodes and edges from the narrative store
 * with pan/zoom/select/connect interactions.
 * Phase 8: integrates context menu and keyboard shortcuts.
 * Phase 14: visual clustering by chapter/path.
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

  // ── Phase 14: Visual clustering ────────────────────────────
  const clusteringEnabled = useUIStore((s) => s.clusteringEnabled);
  const chapterMap = useNarrativeStore((s) => s.chapter);
  const pathMap = useNarrativeStore((s) => s.path);

  const clusterBoxes = useMemo(() => {
    if (!clusteringEnabled) return [];
    return computeClusterBoxes(nodes, chapterMap, pathMap);
  }, [clusteringEnabled, nodes, chapterMap, pathMap]);

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
        <Minimap />

        {/* Phase 14: Visual clustering background rectangles */}
        {clusterBoxes.map((cluster) => (
          <div
            key={cluster.key}
            className="graph-canvas__cluster"
            style={{
              position: 'absolute',
              left: cluster.x,
              top: cluster.y,
              width: cluster.width,
              height: cluster.height,
              background: cluster.color,
              border: `1px solid ${cluster.borderColor}`,
              borderRadius: 'var(--radius-xl)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          >
            <span className="graph-canvas__cluster-label" style={{
              position: 'absolute',
              top: 4,
              left: 8,
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-family)',
              color: cluster.labelColor,
              opacity: 0.7,
              fontWeight: 'var(--font-weight-medium)',
              letterSpacing: 'var(--letter-spacing-wide)',
              textTransform: 'uppercase',
              pointerEvents: 'none',
            }}>
              {cluster.label}
            </span>
          </div>
        ))}
      </ReactFlow>
    </div>
  );
}

// ── Phase 14: Cluster computation ───────────────────────────

/**
 * Compute bounding boxes for visual clusters grouped by chapter,
 * then by path for nodes without chapters.
 *
 * @param {object[]} nodes — React Flow nodes
 * @param {object} chapterMap — chapter entities from store
 * @param {object} pathMap — path entities from store
 * @returns {object[]} Array of cluster box descriptors
 */
function computeClusterBoxes(nodes, chapterMap, pathMap) {
  const groups = new Map(); // key → { nodePositions: [], label: string }
  const PADDING = 40;
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 90;
  let colorIdx = 0;

  for (const node of nodes) {
    const entity = node.data?.entity;
    if (!entity) continue;

    // Group by chapter first, then by path
    let groupKey = null;
    let groupLabel = null;

    if (entity.chapter) {
      groupKey = `chapter-${entity.chapter}`;
      groupLabel = `Ch: ${chapterMap[entity.chapter]?.name || entity.chapter}`;
    } else if (entity.path) {
      groupKey = `path-${entity.path}`;
      groupLabel = `Path: ${pathMap[entity.path]?.name || entity.path}`;
    }

    if (!groupKey) continue; // Ungrouped nodes get no cluster

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { positions: [], label: groupLabel });
    }
    groups.get(groupKey).positions.push(node.position);
  }

  const boxes = [];

  for (const [key, group] of groups) {
    if (group.positions.length < 2) continue; // Don't cluster single nodes

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pos of group.positions) {
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + NODE_WIDTH > maxX) maxX = pos.x + NODE_WIDTH;
      if (pos.y + NODE_HEIGHT > maxY) maxY = pos.y + NODE_HEIGHT;
    }

    const color = CLUSTER_COLORS[colorIdx % CLUSTER_COLORS.length];
    const borderColor = color.replace(/[\d.]+\)$/, '0.15)');
    const labelColor = color.replace(/[\d.]+\)$/, '0.8)');
    colorIdx++;

    boxes.push({
      key,
      x: minX - PADDING,
      y: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
      color,
      borderColor,
      labelColor,
      label: group.label,
    });
  }

  return boxes;
}

export default GraphCanvas;
