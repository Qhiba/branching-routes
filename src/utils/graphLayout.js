/**
 * Dagre-based auto-layout for React Flow nodes and edges.
 *
 * Reads choices, scenes, and endings from editor data and produces
 * { nodes, edges } arrays consumable by React Flow.
 */
import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT_SCENE = 80;
const NODE_HEIGHT_CHOICE = 100;
const NODE_HEIGHT_ENDING = 70;

/**
 * Build React Flow nodes + edges with dagre-computed positions.
 *
 * @param {Object} choices  – keyed by ID
 * @param {Object} scenes   – keyed by ID
 * @param {Object} endings  – keyed by ID
 * @param {Object} [opts]   – optional filters
 * @param {string} [opts.filterPath]    – only include nodes with this path
 * @param {string} [opts.filterChapter] – only include nodes with this chapter
 * @returns {{ nodes: Array, edges: Array }}
 */
export function computeLayout(choices, scenes, endings, opts = {}) {
  const { filterPath, filterChapter, layoutConfig = {} } = opts;
  const { rankdir = 'TB', nodesep = 100, ranksep = 150 } = layoutConfig;

  const passesFilter = (entity) => {
    if (filterPath && entity.path !== filterPath) return false;
    if (filterChapter && entity.chapter !== filterChapter) return false;
    return true;
  };

  // Collect all visible node IDs first for edge filtering
  const visibleIds = new Set();

  const sourcePosition = rankdir === 'LR' ? 'right' : 'bottom';
  const targetPosition = rankdir === 'LR' ? 'left' : 'top';

  const nodes = [];
  const edges = [];

  // --- Scenes ---
  for (const scene of Object.values(scenes || {})) {
    if (!passesFilter(scene)) continue;
    visibleIds.add(scene.id);
    nodes.push({
      id: scene.id,
      type: 'scene',
      sourcePosition,
      targetPosition,
      data: {
        id: scene.id,
        label: scene.name,
        requiresCount: (scene.requires || []).length,
        nextCount: (scene.next || []).length,
        state: 'reachable',
      },
      position: { x: 0, y: 0 },
    });
  }

  // --- Choices ---
  for (const choice of Object.values(choices || {})) {
    if (!passesFilter(choice)) continue;
    visibleIds.add(choice.id);
    nodes.push({
      id: choice.id,
      type: 'choice',
      sourcePosition,
      targetPosition,
      data: {
        id: choice.id,
        label: choice.text,
        optionCount: (choice.options || []).length,
        options: (choice.options || []).map(o => o.label),
        state: 'reachable',
      },
      position: { x: 0, y: 0 },
    });
  }

  // --- Endings (no path/chapter filter — endings are global) ---
  for (const ending of Object.values(endings || {})) {
    visibleIds.add(ending.id);
    nodes.push({
      id: ending.id,
      type: 'ending',
      sourcePosition,
      targetPosition,
      data: {
        id: ending.id,
        label: ending.name,
        requiresCount: (ending.requires || []).length,
        state: 'reachable',
      },
      position: { x: 0, y: 0 },
    });
  }

  // --- Edges from scene next ---
  for (const scene of Object.values(scenes || {})) {
    if (!visibleIds.has(scene.id)) continue;
    if (scene.next) {
      for (let i = 0; i < scene.next.length; i++) {
        const route = scene.next[i];
        if (route.target && visibleIds.has(route.target)) {
          edges.push({
            id: `${scene.id}-next-${i}`,
            source: scene.id,
            target: route.target,
            type: 'smoothstep',
            data: { taken: false },
          });
        }
      }
    }
  }

  // --- Edges from choice options ---
  for (const choice of Object.values(choices || {})) {
    if (!visibleIds.has(choice.id)) continue;
    if (choice.options) {
      for (let i = 0; i < choice.options.length; i++) {
        const opt = choice.options[i];
        if (opt.next && visibleIds.has(opt.next)) {
          edges.push({
            id: `${choice.id}-opt-${i}`,
            source: choice.id,
            target: opt.next,
            sourceHandle: `opt-${i}`,
            type: 'smoothstep',
            label: opt.label,
            data: { taken: false },
          });
        }
      }
    }
  }

  // --- Dagre layout ---
  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep, ranksep });

  for (const node of nodes) {
    const h =
      node.type === 'choice' ? NODE_HEIGHT_CHOICE :
      node.type === 'ending' ? NODE_HEIGHT_ENDING :
      NODE_HEIGHT_SCENE;
    // Allow dagre to compute node width/height with LR support
    // Node dimensions swap based on rankdir? No, visually nodes are still drawn normally.
    g.setNode(node.id, { width: NODE_WIDTH, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Apply computed positions (dagre gives center coords, React Flow uses top-left)
  for (const node of nodes) {
    const pos = g.node(node.id);
    const h =
      node.type === 'choice' ? NODE_HEIGHT_CHOICE :
      node.type === 'ending' ? NODE_HEIGHT_ENDING :
      NODE_HEIGHT_SCENE;
    node.position = {
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y - h / 2,
    };
  }

  return { nodes, edges };
}
