/**
 * Dagre-based auto-layout for React Flow nodes and edges.
 *
 * Reads choices, scenes, and endings from editor data and produces
 * { nodes, edges } arrays consumable by React Flow.
 *
 * Supports two modes:
 * 1. Full Dagre layout (computeLayout) — used for Reset Layout
 * 2. Position-aware layout (computeLayoutWithPositions) — uses stored _position,
 *    only Dagre-layouts nodes that have no _position yet
 */
import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 280;
const NODE_HEIGHT_SCENE = 140;
const NODE_HEIGHT_CHOICE = 150;
const NODE_HEIGHT_ENDING = 80;

/**
 * Get the expected height for a node type.
 */
function getNodeHeight(type) {
  if (type === 'choice') return NODE_HEIGHT_CHOICE;
  if (type === 'ending') return NODE_HEIGHT_ENDING;
  return NODE_HEIGHT_SCENE;
}

/**
 * Build the raw (unpositioned) nodes and edges from editor data.
 * Shared by both layout modes.
 */
function buildNodesAndEdges(choices, scenes, endings, opts = {}) {
  const { filterPath, filterChapter, layoutConfig = {} } = opts;
  const { rankdir = 'TB' } = layoutConfig;

  const passesFilter = (entity) => {
    if (filterPath && entity.path !== filterPath) return false;
    if (filterChapter && entity.chapter !== filterChapter) return false;
    return true;
  };

  const visibleIds = new Set();
  const sourcePosition = rankdir === 'LR' ? 'right' : 'bottom';
  const targetPosition = rankdir === 'LR' ? 'left' : 'top';

  const nodes = [];
  const edges = [];

  // --- Scenes ---
  for (const scene of Object.values(scenes || {})) {
    const isGhosted = !passesFilter(scene);
    visibleIds.add(scene.id);
    nodes.push({
      id: scene.id,
      type: 'scene',
      sourcePosition,
      targetPosition,
      data: {
        id: scene.id,
        label: scene.name,
        description: scene.description,
        requires: scene.requires || [],
        requiresCount: (scene.requires || []).length,
        nextCount: (scene.next || []).length,
        variantsCount: (scene.variants || []).length,
        nextEntries: (scene.next || []).map((n, idx) => ({
          _id: n._id || `route_fallback_${idx}`,
          target: n.target,
          requires: n.requires || [],
        })),
        state: 'reachable',
        isGhosted,
      },
      position: { x: 0, y: 0 },
      _storedPosition: scene._position || null,
    });
  }

  // --- Choices ---
  for (const choice of Object.values(choices || {})) {
    const isGhosted = !passesFilter(choice);
    visibleIds.add(choice.id);
    nodes.push({
      id: choice.id,
      type: 'choice',
      sourcePosition,
      targetPosition,
      data: {
        id: choice.id,
        label: choice.text,
        requires: choice.requires || [],
        optionCount: (choice.options || []).length,
        options: (choice.options || []).map((o, idx) => ({
          id: o.id || `opt_fallback_${idx}`,
          label: o.label,
          requires: o.requires || [],
          flags_set: o.flags_set || [],
          status_set: o.status_set || [],
          next: o.next || [],
        })),
        state: 'reachable',
        isGhosted,
      },
      position: { x: 0, y: 0 },
      _storedPosition: choice._position || null,
    });
  }

  // --- Endings ---
  for (const ending of Object.values(endings || {})) {
    const isGhosted = (filterPath || filterChapter) ? !passesFilter(ending) : false;
    visibleIds.add(ending.id);
    nodes.push({
      id: ending.id,
      type: 'ending',
      sourcePosition,
      targetPosition,
      data: {
        id: ending.id,
        label: ending.name,
        requires: ending.requires || [],
        requiresCount: (ending.requires || []).length,
        state: 'reachable',
        isGhosted,
      },
      position: { x: 0, y: 0 },
      _storedPosition: ending._position || null,
    });
  }

  // --- Edges from scene next ---
  for (const scene of Object.values(scenes || {})) {
    if (!visibleIds.has(scene.id)) continue;
    if (scene.next) {
      for (let i = 0; i < scene.next.length; i++) {
        const route = scene.next[i];
        if (route.target && visibleIds.has(route.target)) {
          const routeIdPart = route._id || `route_fallback_${i}`;
          edges.push({
            id: `${scene.id}-next-${routeIdPart}`,
            source: scene.id,
            target: route.target,
            type: 'smoothstep',
            sourceHandle: routeIdPart,
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
        const nextArr = Array.isArray(opt.next)
          ? opt.next
          : opt.next
            ? [{ requires: [], target: opt.next }]
            : [];
        const optIdPart = opt.id || `opt_fallback_${i}`;
        const seenTargets = new Set();
        for (const entry of nextArr) {
          if (entry.target && visibleIds.has(entry.target) && !seenTargets.has(entry.target)) {
            seenTargets.add(entry.target);
            edges.push({
              id: `${choice.id}-opt-${optIdPart}-${entry.target}`,
              source: choice.id,
              target: entry.target,
              sourceHandle: optIdPart,
              type: 'smoothstep',
              label: opt.label,
              data: { taken: false },
              labelStyle: { fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#bbc9cf' },
              labelBgStyle: { fill: '#201f1f', fillOpacity: 1 },
              labelBgPadding: [4, 8],
              labelBgBorderRadius: 4,
            });
          }
        }
      }
    }
  }

  return { nodes, edges, visibleIds };
}

/**
 * Run Dagre on a set of nodes and edges, mutating node.position in place.
 */
function runDagre(nodes, edges, layoutConfig = {}) {
  const { rankdir = 'TB', nodesep = 100, ranksep = 150 } = layoutConfig;

  if (nodes.length === 0) return;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep, ranksep });

  for (const node of nodes) {
    const h = getNodeHeight(node.type);
    g.setNode(node.id, { width: NODE_WIDTH, height: h });
  }

  for (const edge of edges) {
    // Only add edges where both source and target are in the node set
    const nodeIds = new Set(nodes.map(n => n.id));
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const h = getNodeHeight(node.type);
    node.position = {
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y - h / 2,
    };
  }
}

/**
 * Full Dagre layout — ignores all stored positions.
 * Used by "Reset Layout" and as a fallback for imports without _position.
 */
export function computeLayout(choices, scenes, endings, opts = {}) {
  const { layoutConfig = {} } = opts;
  const { nodes, edges } = buildNodesAndEdges(choices, scenes, endings, opts);

  if (nodes.length === 0) return { nodes, edges };

  runDagre(nodes, edges, layoutConfig);

  // Clean up temp field
  for (const node of nodes) {
    delete node._storedPosition;
  }

  return { nodes, edges };
}

/**
 * Position-aware layout — uses stored _position for nodes that have it,
 * runs Dagre only on nodes that DON'T have a stored position.
 *
 * Returns the same { nodes, edges } shape as computeLayout,
 * plus a `positionUpdates` array of { id, type, position } for new positions
 * that should be persisted back to state.
 */
export function computeLayoutWithPositions(choices, scenes, endings, opts = {}) {
  const { layoutConfig = {} } = opts;
  const { nodes, edges } = buildNodesAndEdges(choices, scenes, endings, opts);

  if (nodes.length === 0) return { nodes, edges, positionUpdates: [] };

  const positioned = [];
  const unpositioned = [];

  for (const node of nodes) {
    if (node._storedPosition) {
      node.position = { ...node._storedPosition };
      positioned.push(node);
    } else {
      unpositioned.push(node);
    }
  }

  const positionUpdates = [];

  if (unpositioned.length > 0) {
    if (positioned.length === 0) {
      // No existing positions at all — full Dagre layout
      runDagre(nodes, edges, layoutConfig);
      for (const node of nodes) {
        positionUpdates.push({ id: node.id, type: node.type, position: { ...node.position } });
      }
    } else {
      // Some nodes have positions, some don't.
      // Place unpositioned nodes using single-node Dagre relative to neighbors.
      for (const node of unpositioned) {
        const pos = computeSingleNodePosition(node, nodes, edges, layoutConfig);
        node.position = pos;
        positionUpdates.push({ id: node.id, type: node.type, position: { ...pos } });
      }
    }
  }

  // Clean up temp field
  for (const node of nodes) {
    delete node._storedPosition;
  }

  return { nodes, edges, positionUpdates };
}

/**
 * Compute position for a single new node by looking at its connected neighbors.
 * If the node has neighbors with known positions, place it near them.
 * Otherwise, offset from the centroid of all existing nodes.
 */
function computeSingleNodePosition(targetNode, allNodes, edges, layoutConfig = {}) {
  const { rankdir = 'TB' } = layoutConfig;
  const nodesById = new Map(allNodes.map(n => [n.id, n]));

  // Find connected neighbors that already have positions
  const neighborPositions = [];
  for (const edge of edges) {
    if (edge.source === targetNode.id) {
      const neighbor = nodesById.get(edge.target);
      if (neighbor && (neighbor.position.x !== 0 || neighbor.position.y !== 0 || neighbor._storedPosition)) {
        neighborPositions.push(neighbor.position);
      }
    }
    if (edge.target === targetNode.id) {
      const neighbor = nodesById.get(edge.source);
      if (neighbor && (neighbor.position.x !== 0 || neighbor.position.y !== 0 || neighbor._storedPosition)) {
        neighborPositions.push(neighbor.position);
      }
    }
  }

  if (neighborPositions.length > 0) {
    // Place relative to centroid of connected neighbors
    const cx = neighborPositions.reduce((s, p) => s + p.x, 0) / neighborPositions.length;
    const cy = neighborPositions.reduce((s, p) => s + p.y, 0) / neighborPositions.length;

    const offset = rankdir === 'LR' ? { x: 350, y: 0 } : { x: 0, y: 250 };
    return { x: cx + offset.x, y: cy + offset.y };
  }

  // No neighbors — place near centroid of all positioned nodes
  const positionedNodes = allNodes.filter(n => n._storedPosition || (n.position.x !== 0 || n.position.y !== 0));
  if (positionedNodes.length > 0) {
    const cx = positionedNodes.reduce((s, n) => s + n.position.x, 0) / positionedNodes.length;
    const cy = positionedNodes.reduce((s, n) => s + n.position.y, 0) / positionedNodes.length;
    return { x: cx + 400, y: cy + 200 };
  }

  return { x: 100, y: 100 };
}

/**
 * When a `next` connection is wired, check if the target node is in a reasonable
 * location relative to the source. If not, nudge it to a better position.
 *
 * @param {Object} sourceEntity - source entity data (with _position)
 * @param {Object} targetEntity - target entity data (with _position)
 * @param {string} rankdir - layout direction ('TB' or 'LR')
 * @returns {{ needsNudge: boolean, newPosition?: {x: number, y: number} }}
 */
export function nudgeTargetIfNeeded(sourceEntity, targetEntity, rankdir = 'LR') {
  if (!sourceEntity?._position || !targetEntity?._position) {
    return { needsNudge: false };
  }

  const src = sourceEntity._position;
  const tgt = targetEntity._position;

  if (rankdir === 'LR') {
    // Target should be to the right of source. If it's to the left, or very far away, nudge.
    const dx = tgt.x - src.x;
    if (dx < 0 || dx > 1500) {
      return {
        needsNudge: true,
        newPosition: { x: src.x + 350, y: src.y },
      };
    }
  } else {
    // TB: target should be below source
    const dy = tgt.y - src.y;
    if (dy < 0 || dy > 1000) {
      return {
        needsNudge: true,
        newPosition: { x: src.x, y: src.y + 250 },
      };
    }
  }

  return { needsNudge: false };
}
