// ============================================================
// routeTracer.js — Route analysis: all-paths, shortest path,
// goal-directed pathfinding (Modes A & B), filtered tracing
// ============================================================
// Pure-function module. Takes narrative data + flag/status state
// and returns path results. No store subscriptions.
//
// Key exports:
//   findAllPaths(graph, fromId, toId, flagMap, statusMap) → Path[]
//   findShortestPath(graph, fromId, toId, flagMap, statusMap) → Path | null
//   findPathToGoal(graph, entryNode, targetId, flagMap, statusMap) → Path | null   (Mode A)
//   findRequirementsForGoal(graph, entryNode, targetId) → RequirementSet           (Mode B)
//   filterPaths(paths, filters) → Path[]
//
// Dependencies: conditionEval
// ============================================================

import { evaluateCondition } from '@/utils/conditionEval.js';

/**
 * @typedef {object} Path
 * @property {string[]} nodeIds — ordered node IDs from source to target
 * @property {number} length — number of nodes in the path
 * @property {Array<{ from: string, to: string, edgeId: string, conditionMet: boolean }>} edges
 */

/**
 * @typedef {object} RequirementSet
 * @property {string[]} requiredFlags — flag IDs that must be true
 * @property {Array<{ statusId: string, min?: number, max?: number }>} requiredStatuses
 * @property {boolean} reachable — whether a path exists at all (ignoring conditions)
 * @property {boolean} timedOut — whether analysis was aborted due to timeout
 */

// ── Adjacency builder ───────────────────────────────────────

/**
 * Build a directed adjacency map from narrative data.
 * Maps each source node ID to an array of outgoing connections.
 *
 * @param {object} narrativeData — { common, choice }
 * @returns {Map<string, Array<{ target: string, edgeId: string, requires: object }>>}
 */
function buildRoutingAdjacency(narrativeData) {
  const { common = {}, choice = {} } = narrativeData;
  const adj = new Map();

  // Common Node → next[].target
  for (const node of Object.values(common)) {
    const edges = [];
    for (const entry of node.next || []) {
      if (entry.target) {
        edges.push({
          target: entry.target,
          edgeId: `edge-${node.id}-${entry.id}`,
          requires: entry.requires,
          // Also carry the source node's requires for condition evaluation
          sourceRequires: node.requires,
        });
      }
    }
    if (edges.length > 0) {
      adj.set(node.id, (adj.get(node.id) || []).concat(edges));
    } else if (!adj.has(node.id)) {
      adj.set(node.id, []);
    }
  }

  // Choice → options[].next[].target
  for (const ch of Object.values(choice)) {
    const edges = [];
    for (const option of ch.options || []) {
      for (const entry of option.next || []) {
        if (entry.target) {
          edges.push({
            target: entry.target,
            edgeId: `edge-${ch.id}-${option.id}-${entry.id}`,
            requires: entry.requires,
            optionRequires: option.requires,
            sourceRequires: ch.requires,
          });
        }
      }
    }
    if (edges.length > 0) {
      adj.set(ch.id, (adj.get(ch.id) || []).concat(edges));
    } else if (!adj.has(ch.id)) {
      adj.set(ch.id, []);
    }
  }

  return adj;
}

/**
 * Check if a single edge passes all its conditions.
 *
 * @param {object} edge — adjacency edge with requires, sourceRequires, optionRequires
 * @param {object} flagMap
 * @param {object} statusMap
 * @returns {boolean}
 */
function edgeConditionPasses(edge, flagMap, statusMap) {
  // Source node requires
  if (!evaluateCondition(edge.sourceRequires, flagMap, statusMap)) return false;
  // Option requires (choice options only)
  if (edge.optionRequires && !evaluateCondition(edge.optionRequires, flagMap, statusMap)) return false;
  // Edge-level requires
  if (!evaluateCondition(edge.requires, flagMap, statusMap)) return false;
  return true;
}

/**
 * Collect all graph node IDs.
 * @param {object} narrativeData
 * @returns {Set<string>}
 */
function getAllNodeIds(narrativeData) {
  const { common = {}, choice = {}, ending = {} } = narrativeData;
  return new Set([
    ...Object.keys(common),
    ...Object.keys(choice),
    ...Object.keys(ending),
  ]);
}

// ── findAllPaths ────────────────────────────────────────────

/**
 * Find all paths from `fromId` to `toId`, respecting current flag/status
 * state. Uses DFS with cycle detection. Caps results at 100 paths to
 * prevent explosion on dense graphs.
 *
 * @param {object} graph — narrative data { common, choice, ending, ... }
 * @param {string} fromId — source node ID
 * @param {string} toId — target node ID
 * @param {object} flagMap — merged flag map
 * @param {object} statusMap — merged status map
 * @returns {Path[]}
 */
export function findAllPaths(graph, fromId, toId, flagMap, statusMap) {
  const adj = buildRoutingAdjacency(graph);
  const allNodeIds = getAllNodeIds(graph);

  if (!allNodeIds.has(fromId) || !allNodeIds.has(toId)) return [];
  if (fromId === toId) {
    return [{
      nodeIds: [fromId],
      length: 1,
      edges: [],
    }];
  }

  const results = [];
  const MAX_PATHS = 100;

  function dfs(current, visited, pathNodes, pathEdges) {
    if (results.length >= MAX_PATHS) return;

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (results.length >= MAX_PATHS) return;
      if (visited.has(edge.target)) continue;

      const conditionMet = edgeConditionPasses(edge, flagMap, statusMap);

      // Only traverse edges whose conditions pass
      if (!conditionMet) continue;

      const nextNodes = [...pathNodes, edge.target];
      const nextEdges = [...pathEdges, {
        from: current,
        to: edge.target,
        edgeId: edge.edgeId,
        conditionMet,
      }];

      if (edge.target === toId) {
        results.push({
          nodeIds: nextNodes,
          length: nextNodes.length,
          edges: nextEdges,
        });
      } else {
        visited.add(edge.target);
        dfs(edge.target, visited, nextNodes, nextEdges);
        visited.delete(edge.target);
      }
    }
  }

  const visited = new Set([fromId]);
  dfs(fromId, visited, [fromId], []);

  return results;
}

// ── findShortestPath ────────────────────────────────────────

/**
 * Find the shortest path (fewest nodes) from `fromId` to `toId`,
 * respecting current flag/status state. Uses BFS.
 *
 * @param {object} graph — narrative data
 * @param {string} fromId — source node ID
 * @param {string} toId — target node ID
 * @param {object} flagMap — merged flag map
 * @param {object} statusMap — merged status map
 * @returns {Path|null}
 */
export function findShortestPath(graph, fromId, toId, flagMap, statusMap) {
  const adj = buildRoutingAdjacency(graph);
  const allNodeIds = getAllNodeIds(graph);

  if (!allNodeIds.has(fromId) || !allNodeIds.has(toId)) return null;
  if (fromId === toId) {
    return { nodeIds: [fromId], length: 1, edges: [] };
  }

  // BFS
  const visited = new Set([fromId]);
  // Queue entries: { nodeId, pathNodes, pathEdges }
  const queue = [{ nodeId: fromId, pathNodes: [fromId], pathEdges: [] }];

  while (queue.length > 0) {
    const { nodeId, pathNodes, pathEdges } = queue.shift();
    const neighbors = adj.get(nodeId) || [];

    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;

      const conditionMet = edgeConditionPasses(edge, flagMap, statusMap);
      if (!conditionMet) continue;

      const nextNodes = [...pathNodes, edge.target];
      const nextEdges = [...pathEdges, {
        from: nodeId,
        to: edge.target,
        edgeId: edge.edgeId,
        conditionMet,
      }];

      if (edge.target === toId) {
        return { nodeIds: nextNodes, length: nextNodes.length, edges: nextEdges };
      }

      visited.add(edge.target);
      queue.push({ nodeId: edge.target, pathNodes: nextNodes, pathEdges: nextEdges });
    }
  }

  return null;
}

// ── findPathToGoal (Mode A) ─────────────────────────────────

/**
 * Mode A: "How to reach target X?"
 * Finds a valid path from entryNode to targetId under current state,
 * or returns null with information about which conditions fail.
 *
 * @param {object} graph — narrative data
 * @param {string} entryNode — entry node ID
 * @param {string} targetId — goal node ID
 * @param {object} flagMap — merged flag map
 * @param {object} statusMap — merged status map
 * @returns {{ path: Path|null, failedConditions: object[] }}
 */
export function findPathToGoal(graph, entryNode, targetId, flagMap, statusMap) {
  // First try to find a valid path under current conditions
  const path = findShortestPath(graph, entryNode, targetId, flagMap, statusMap);
  if (path) {
    return { path, failedConditions: [] };
  }

  // No path found under current conditions — find the shortest path
  // ignoring conditions, and report which edges' conditions fail
  const adj = buildRoutingAdjacency(graph);
  const allNodeIds = getAllNodeIds(graph);

  if (!allNodeIds.has(entryNode) || !allNodeIds.has(targetId)) {
    return { path: null, failedConditions: [{ reason: 'Node does not exist in graph' }] };
  }

  // BFS ignoring conditions
  const visited = new Set([entryNode]);
  const queue = [{ nodeId: entryNode, pathNodes: [entryNode], pathEdges: [] }];
  let unconditionalPath = null;

  while (queue.length > 0) {
    const { nodeId, pathNodes, pathEdges } = queue.shift();
    const neighbors = adj.get(nodeId) || [];

    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;

      const conditionMet = edgeConditionPasses(edge, flagMap, statusMap);
      const nextNodes = [...pathNodes, edge.target];
      const nextEdges = [...pathEdges, {
        from: nodeId,
        to: edge.target,
        edgeId: edge.edgeId,
        conditionMet,
      }];

      if (edge.target === targetId) {
        unconditionalPath = { nodeIds: nextNodes, length: nextNodes.length, edges: nextEdges };
        break;
      }

      visited.add(edge.target);
      queue.push({ nodeId: edge.target, pathNodes: nextNodes, pathEdges: nextEdges });
    }

    if (unconditionalPath) break;
  }

  if (!unconditionalPath) {
    return {
      path: null,
      failedConditions: [{ reason: 'No path exists to target (even ignoring conditions)' }],
    };
  }

  // Collect edges whose conditions fail along the unconditional path
  const failedConditions = unconditionalPath.edges
    .filter((e) => !e.conditionMet)
    .map((e) => ({
      from: e.from,
      to: e.to,
      edgeId: e.edgeId,
      reason: 'Edge conditions not met',
    }));

  return { path: unconditionalPath, failedConditions };
}

// ── findRequirementsForGoal (Mode B) ────────────────────────

/**
 * Mode B: "What do I need to reach target X?"
 * Analyzes all paths from entryNode to targetId and collects
 * the required flags and status thresholds.
 *
 * Has a 5-second timeout for complex graphs (R-02).
 *
 * @param {object} graph — narrative data
 * @param {string} entryNode — entry node ID
 * @param {string} targetId — goal node ID
 * @returns {RequirementSet}
 */
export function findRequirementsForGoal(graph, entryNode, targetId) {
  const allNodeIds = getAllNodeIds(graph);

  if (!allNodeIds.has(entryNode) || !allNodeIds.has(targetId)) {
    return {
      requiredFlags: [],
      requiredStatuses: [],
      reachable: false,
      timedOut: false,
    };
  }

  const adj = buildRoutingAdjacency(graph);
  const startTime = Date.now();
  const TIMEOUT_MS = 5000; // R-02: 5-second timeout

  // Collect all paths (ignoring conditions) via DFS, collecting requirements
  const allRequirements = [];
  let timedOut = false;
  let foundAnyPath = false;

  function dfs(current, visited, pathRequirements) {
    if (timedOut) return;
    if (Date.now() - startTime > TIMEOUT_MS) {
      timedOut = true;
      return;
    }

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (timedOut) return;
      if (visited.has(edge.target)) continue;

      // Collect requirements from this edge
      const edgeReqs = collectEdgeRequirements(edge);
      const nextReqs = [...pathRequirements, ...edgeReqs];

      if (edge.target === targetId) {
        foundAnyPath = true;
        allRequirements.push(nextReqs);
        return; // Found a path, don't continue DFS past target
      }

      visited.add(edge.target);
      dfs(edge.target, visited, nextReqs);
      visited.delete(edge.target);
    }
  }

  const visited = new Set([entryNode]);
  dfs(entryNode, visited, []);

  if (!foundAnyPath) {
    return {
      requiredFlags: [],
      requiredStatuses: [],
      reachable: false,
      timedOut,
    };
  }

  // Find the path with the fewest requirements (simplest path)
  // Then extract a unified requirement set from it
  allRequirements.sort((a, b) => a.length - b.length);
  const simplestReqs = allRequirements[0] || [];

  // Deduplicate requirements
  const flagSet = new Set();
  const statusReqMap = new Map(); // statusId → { min, max }

  for (const req of simplestReqs) {
    if (req.type === 'flag') {
      if (req.state === true) {
        flagSet.add(req.flagId);
      }
    } else if (req.type === 'status') {
      const existing = statusReqMap.get(req.statusId) || {};
      if (req.min != null) {
        existing.min = Math.max(existing.min ?? -Infinity, req.min);
      }
      if (req.max != null) {
        existing.max = Math.min(existing.max ?? Infinity, req.max);
      }
      existing.statusId = req.statusId;
      statusReqMap.set(req.statusId, existing);
    }
  }

  return {
    requiredFlags: [...flagSet],
    requiredStatuses: [...statusReqMap.values()].map((s) => ({
      statusId: s.statusId,
      ...(s.min != null && s.min !== -Infinity ? { min: s.min } : {}),
      ...(s.max != null && s.max !== Infinity ? { max: s.max } : {}),
    })),
    reachable: true,
    timedOut,
  };
}

/**
 * Collect individual condition requirements from an edge's condition
 * groups (sourceRequires, optionRequires, requires).
 *
 * @param {object} edge
 * @returns {Array<{ type: 'flag'|'status', flagId?: string, state?: boolean, statusId?: string, min?: number, max?: number }>}
 */
function collectEdgeRequirements(edge) {
  const reqs = [];
  const groups = [edge.sourceRequires, edge.optionRequires, edge.requires].filter(Boolean);

  for (const group of groups) {
    extractRequirementsFromGroup(group, reqs);
  }

  return reqs;
}

/**
 * Recursively extract leaf conditions from a condition group.
 *
 * @param {object} group — condition group { operator, conditions }
 * @param {Array} reqs — accumulator array
 */
function extractRequirementsFromGroup(group, reqs) {
  if (!group || !group.conditions) return;

  for (const cond of group.conditions) {
    if (cond.operator != null) {
      // Nested group — recurse
      extractRequirementsFromGroup(cond, reqs);
    } else if (cond.flag != null) {
      reqs.push({ type: 'flag', flagId: cond.flag, state: cond.state });
    } else if (cond.status != null) {
      reqs.push({
        type: 'status',
        statusId: cond.status,
        ...(cond.min != null ? { min: cond.min } : {}),
        ...(cond.max != null ? { max: cond.max } : {}),
      });
    }
  }
}

// ── filterPaths ─────────────────────────────────────────────

/**
 * Filter a list of paths by various criteria.
 *
 * @param {Path[]} paths — paths to filter
 * @param {object} filters — filter criteria
 * @param {string} [filters.pathId] — only paths passing through nodes in this path ID
 * @param {string} [filters.chapterId] — only paths passing through nodes in this chapter ID
 * @param {string} [filters.flagId] — only paths that set this flag via flags_set
 * @param {string} [filters.statusId] — only paths that modify this status via status_set
 * @param {object} narrativeData — narrative data for entity lookups
 * @returns {Path[]}
 */
export function filterPaths(paths, filters, narrativeData) {
  if (!filters || Object.keys(filters).length === 0) return paths;

  const { common = {}, choice = {} } = narrativeData || {};

  return paths.filter((path) => {
    // Filter by path ID: at least one node must belong to this path
    if (filters.pathId) {
      const hasPathNode = path.nodeIds.some((nid) => {
        const node = common[nid] || choice[nid];
        return node && node.path === filters.pathId;
      });
      if (!hasPathNode) return false;
    }

    // Filter by chapter ID: at least one node must belong to this chapter
    if (filters.chapterId) {
      const hasChapterNode = path.nodeIds.some((nid) => {
        const node = common[nid] || choice[nid];
        return node && node.chapter === filters.chapterId;
      });
      if (!hasChapterNode) return false;
    }

    // Filter by flag: at least one node in this path must set this flag
    if (filters.flagId) {
      const setsFlag = path.nodeIds.some((nid) => {
        const node = common[nid];
        if (node && node.flags_set?.includes(filters.flagId)) return true;
        const ch = choice[nid];
        if (ch) {
          return ch.options?.some((opt) =>
            opt.flags_set?.includes(filters.flagId)
          );
        }
        return false;
      });
      if (!setsFlag) return false;
    }

    // Filter by status: at least one node in this path must modify this status
    if (filters.statusId) {
      const modifiesStatus = path.nodeIds.some((nid) => {
        const node = common[nid];
        if (node && node.status_set?.some((d) => d.status === filters.statusId)) return true;
        const ch = choice[nid];
        if (ch) {
          return ch.options?.some((opt) =>
            opt.status_set?.some((d) => d.status === filters.statusId)
          );
        }
        return false;
      });
      if (!modifiesStatus) return false;
    }

    return true;
  });
}
