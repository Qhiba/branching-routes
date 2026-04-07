// ============================================================
// autoLayout.js — Dagre-based automatic layout
// ============================================================
// Uses @dagrejs/dagre (v3) for automatic graph positioning.
// Takes React Flow nodes/edges and returns nodes with updated
// positions. Preserves all node data — only changes position.
//
// Key export:
//   applyDagreLayout(nodes, edges, options) → positionedNodes
//
// Dependencies: @dagrejs/dagre
// ============================================================

import { Graph, layout } from '@dagrejs/dagre';

// ── Default layout options ──────────────────────────────────

const DEFAULT_OPTIONS = {
  direction: 'TB', // 'TB' (top-bottom) or 'LR' (left-right)
  nodeWidth: 220,
  nodeHeight: 80,
  nodeSep: 60,   // horizontal gap between nodes
  rankSep: 100,  // vertical gap between ranks
  edgeSep: 20,   // gap between edges
  align: undefined, // 'UL', 'UR', 'DL', 'DR', or undefined (centered)
  ranker: 'network-simplex', // 'network-simplex', 'tight-tree', 'longest-path'
};

/**
 * Apply Dagre auto-layout to a set of React Flow nodes and edges.
 *
 * Returns a new array of nodes with updated position fields.
 * The original nodes array is not mutated.
 *
 * @param {object[]} nodes — React Flow nodes array
 * @param {object[]} edges — React Flow edges array
 * @param {object} [options] — Layout configuration
 * @param {string} [options.direction='TB'] — 'TB' (top-to-bottom) or 'LR' (left-to-right)
 * @param {number} [options.nodeWidth=220] — Default node width for layout
 * @param {number} [options.nodeHeight=80] — Default node height for layout
 * @param {number} [options.nodeSep=60] — Horizontal separation between nodes
 * @param {number} [options.rankSep=100] — Vertical separation between ranks
 * @param {number} [options.edgeSep=20] — Separation between edge labels
 * @param {string} [options.align] — Node alignment within rank
 * @param {string} [options.ranker='network-simplex'] — Ranking algorithm
 * @returns {object[]} New nodes array with updated positions
 */
export function applyDagreLayout(nodes, edges, options = {}) {
  if (!nodes || nodes.length === 0) return nodes;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create directed graph
  const g = new Graph();

  // Set graph-level options
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep,
    edgesep: opts.edgeSep,
    align: opts.align,
    ranker: opts.ranker,
    marginx: 20,
    marginy: 20,
  });

  // Default to assigning empty edge label objects
  g.setDefaultEdgeLabel(() => ({}));

  // ── Add all nodes to the graph ────────────────────────────

  for (const node of nodes) {
    const width = getNodeWidth(node, opts.nodeWidth);
    const height = getNodeHeight(node, opts.nodeHeight);
    g.setNode(node.id, { width, height });
  }

  // ── Add all edges to the graph ────────────────────────────

  for (const edge of edges) {
    // Only add edges where both source and target exist in this graph
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  // ── Run Dagre layout ──────────────────────────────────────

  layout(g);

  // ── Map Dagre positions back to React Flow nodes ──────────

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    // Dagre gives center coordinates — convert to top-left for React Flow
    const width = getNodeWidth(node, opts.nodeWidth);
    const height = getNodeHeight(node, opts.nodeHeight);

    return {
      ...node,
      position: {
        x: Math.round(dagreNode.x - width / 2),
        y: Math.round(dagreNode.y - height / 2),
      },
    };
  });
}

/**
 * Get estimated width for a node based on its type.
 * Node renderers have different widths depending on content.
 *
 * @param {object} node — React Flow node
 * @param {number} defaultWidth — Fallback width
 * @returns {number} Estimated width in pixels
 */
function getNodeWidth(node, defaultWidth) {
  switch (node.type) {
    case 'commonNode':
      return 220;
    case 'choiceNode':
      return 240;
    case 'endingNode':
      return 200;
    default:
      return defaultWidth;
  }
}

/**
 * Get estimated height for a node based on its type.
 *
 * @param {object} node — React Flow node
 * @param {number} defaultHeight — Fallback height
 * @returns {number} Estimated height in pixels
 */
function getNodeHeight(node, defaultHeight) {
  switch (node.type) {
    case 'commonNode':
      return 100;
    case 'choiceNode':
      return 90;
    case 'endingNode':
      return 70;
    default:
      return defaultHeight;
  }
}
