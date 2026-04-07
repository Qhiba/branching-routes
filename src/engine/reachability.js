// ============================================================
// reachability.js — BFS-based reachability analysis from entry node
// ============================================================
// Given the narrative data, evaluated edges, and an entry node,
// determines which nodes are unreachable under the current
// simulation state. Unreachable nodes are those that cannot be
// reached from the entry node by following only passing edges.
//
// Key export:
//   findUnreachableNodes(narrativeData, evaluatedEdges, entryNode) → Set<nodeId>
//
// Dependencies: None
// ============================================================

/**
 * Find all nodes unreachable from the entry node given the current
 * edge evaluation results.
 *
 * Uses BFS from the entry node, only traversing edges that pass
 * their conditions (evaluatedEdges[edgeId] !== false).
 *
 * @param {object} narrativeData — { common, choice, ending, metadata }
 * @param {{ [edgeId: string]: boolean }} evaluatedEdges — edge evaluation map
 * @param {string|null} entryNode — ID of the starting node
 * @returns {Set<string>} Set of unreachable node IDs
 */
export function findUnreachableNodes(narrativeData, evaluatedEdges, entryNode) {
  const { common = {}, choice = {}, ending = {} } = narrativeData;

  // Collect all graph node IDs
  const allNodeIds = new Set([
    ...Object.keys(common),
    ...Object.keys(choice),
    ...Object.keys(ending),
  ]);

  // If no entry node or entry node doesn't exist, everything is unreachable
  if (!entryNode || !allNodeIds.has(entryNode)) {
    return allNodeIds;
  }

  // Build adjacency list: for each node, list of { target, edgeId }
  const adjacency = buildAdjacencyList(narrativeData);

  // BFS from entry node along passing edges
  const visited = new Set();
  const queue = [entryNode];
  visited.add(entryNode);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const { target, edgeId } of neighbors) {
      // Skip edges that explicitly fail
      // Edges with no evaluation data (undefined) are treated as passable
      // to avoid false unreachability before the first simulation cycle
      if (evaluatedEdges[edgeId] === false) continue;

      // Skip if target doesn't exist in the graph
      if (!allNodeIds.has(target)) continue;

      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);
      }
    }
  }

  // Unreachable = all nodes minus visited
  const unreachable = new Set();
  for (const nodeId of allNodeIds) {
    if (!visited.has(nodeId)) {
      unreachable.add(nodeId);
    }
  }

  return unreachable;
}

/**
 * Build an adjacency list mapping each node ID to its outgoing
 * connections with edge IDs.
 *
 * Edge ID format matches useGraphSync.js conventions:
 *   - Common Node: "edge-{nodeId}-{nextEntryId}"
 *   - Choice:      "edge-{choiceId}-{optionId}-{nextEntryId}"
 *
 * @param {object} narrativeData — { common, choice }
 * @returns {Map<string, Array<{ target: string, edgeId: string }>>}
 */
function buildAdjacencyList(narrativeData) {
  const { common = {}, choice = {} } = narrativeData;
  const adjacency = new Map();

  // Common Node edges: next[].target
  for (const node of Object.values(common)) {
    const edges = [];
    for (const entry of node.next || []) {
      if (entry.target) {
        edges.push({
          target: entry.target,
          edgeId: `edge-${node.id}-${entry.id}`,
        });
      }
    }
    if (edges.length > 0) {
      adjacency.set(node.id, edges);
    }
  }

  // Choice edges: options[].next[].target
  for (const ch of Object.values(choice)) {
    const edges = [];
    for (const option of ch.options || []) {
      for (const entry of option.next || []) {
        if (entry.target) {
          edges.push({
            target: entry.target,
            edgeId: `edge-${ch.id}-${option.id}-${entry.id}`,
          });
        }
      }
    }
    if (edges.length > 0) {
      adjacency.set(ch.id, edges);
    }
  }

  return adjacency;
}
