// ADDED: Phase 3 — Route tracing utility (dead-end detection and forward-reachability analysis)
// ADDED: Phase 4 — k-shortest-paths with gate evaluation

import { evaluateCondition } from './conditionEvaluator.js';

// ADDED: Phase 3 — Detect nodes with no outgoing edges (dead-ends)
export function detectDeadEnds(graphState) {
  const { common = {}, choice = {}, ending = {}, edges = [] } = graphState;
  const allNodeIds = [
    ...Object.keys(common),
    ...Object.keys(choice),
    ...Object.keys(ending)
  ];

  return allNodeIds.filter(nodeId => {
    // PROTECTED: Ending nodes are not dead-ends, even with no outgoing edges
    if (ending[nodeId]) return false;

    // Dead-end if no outgoing edges exist
    const hasOutgoing = edges.some(e => e.sourceId === nodeId);
    return !hasOutgoing;
  });
}

// ADDED: Phase 3 — Forward-reachability BFS (structural, condition-agnostic)
export function computeForwardReachable(startNodeId, graphState) {
  const { edges = [] } = graphState;
  const visited = new Set();
  const queue = [startNodeId];
  const MAX_NODES = 500;

  while (queue.length > 0 && visited.size < MAX_NODES) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;

    visited.add(currentId);

    // Find all forward edges from this node
    const outgoingEdges = edges.filter(e => e.sourceId === currentId);
    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.targetId)) {
        queue.push(edge.targetId);
      }
    });
  }

  return visited;
}

// ADDED: Phase 4 — k-shortest-paths with gate evaluation via Yen-like bounded BFS
export function computeShortestPaths(startNodeId, targetNodeId, graphState, currentFlagValues, priorities = [], limit = 50) {
  const { edges = [] } = graphState;
  const MAX_STATE_VISITS = 10_000;
  const actualLimit = limit;

  const paths = [];
  let stateVisitCount = 0;
  let exhausted = false;

  // State-space BFS: each entry is (nodeId, flagState) pair
  // Queue: { nodeId, flagState: {...}, pathEdgeIds: [], visitedGraphNodes: Set<nodeId> }
  const queue = [{
    nodeId: startNodeId,
    flagState: { ...currentFlagValues },
    pathEdgeIds: [],
    visitedGraphNodes: new Set([startNodeId])
  }];

  while (queue.length > 0 && stateVisitCount < MAX_STATE_VISITS) {
    const current = queue.shift();
    stateVisitCount++;

    // Found a path to target
    if (current.nodeId === targetNodeId) {
      paths.push({
        pathEdgeIds: current.pathEdgeIds,
        length: current.pathEdgeIds.length,
        priorityRank: 0
      });
      continue;
    }

    // Expand outgoing edges from current node
    const outgoingEdges = edges.filter(e => e.sourceId === current.nodeId);
    outgoingEdges.forEach(edge => {
      // Skip if would create a cycle (node already visited in this path)
      if (current.visitedGraphNodes.has(edge.targetId)) return;

      // Evaluate edge gate condition
      if (!evaluateCondition(edge.condition, current.flagState)) return;

      const { common = {}, choice = {}, ending = {} } = graphState;

      // If edge originates from a choice option, check option requires and apply option
      // side effects first — mirrors simulationStore.selectOption() execution order
      let nextFlagState = { ...current.flagState };
      if (edge.optionId) {
        const sourceNode = choice[current.nodeId];
        const option = sourceNode?.data?.options?.find(o => o.id === edge.optionId);
        if (option) {
          if (!evaluateCondition(option.requires, nextFlagState)) return;
          if (option.flags_set) {
            option.flags_set.forEach(flagId => { nextFlagState[flagId] = true; });
          }
          if (option.status_set) {
            option.status_set.forEach(({ statusId, amount, mode }) => {
              if (typeof nextFlagState[statusId] === 'number')
                nextFlagState[statusId] = mode === 'set' ? amount : nextFlagState[statusId] + amount;
            });
          }
        }
      }

      // Fetch destination node to apply effects
      const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
      if (!destNode) return;

      // Apply destination node effects to flag state
      if (destNode.data?.flags_set) {
        destNode.data.flags_set.forEach(flagId => {
          nextFlagState[flagId] = true;
        });
      }
      if (destNode.data?.status_set) {
        destNode.data.status_set.forEach(({ statusId, amount, mode }) => {
          if (typeof nextFlagState[statusId] === 'number') {
            nextFlagState[statusId] = mode === 'set' ? amount : nextFlagState[statusId] + amount;
          }
        });
      }

      // Add to queue
      const nextVisited = new Set(current.visitedGraphNodes);
      nextVisited.add(edge.targetId);
      queue.push({
        nodeId: edge.targetId,
        flagState: nextFlagState,
        pathEdgeIds: [...current.pathEdgeIds, edge.id],
        visitedGraphNodes: nextVisited
      });
    });
  }

  if (stateVisitCount >= MAX_STATE_VISITS) {
    exhausted = true;
  }

  // Pre-compute priority scores once to avoid repeated simulation in sort comparisons
  const scored = paths.map(path => ({
    path,
    score: countPriorityMatches(path.pathEdgeIds, graphState, currentFlagValues, priorities)
  }));

  // Sort: priority score first (higher = better), path length as tiebreaker (shorter = better)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.path.length - b.path.length;
  });

  // Assign priorityRank within each score group
  let currentScore = -1;
  let rankInGroup = 0;
  scored.forEach(({ path, score }) => {
    if (score !== currentScore) {
      currentScore = score;
      rankInGroup = 0;
    }
    path.priorityRank = rankInGroup++;
  });

  const paths_sorted = scored.map(s => s.path);

  // Cap at hard limit
  const result = paths_sorted.slice(0, actualLimit);

  return {
    paths: result,
    exhausted
  };
}

// Simulates accumulated flag/status state by replaying a sequence of edges from an
// initial seed. Exported so RouteTracingPanel can compute waypoint flag state without
// duplicating the effect-application logic.
export function simulateFlagStateAlongPath(pathEdgeIds, graphState, initialFlagState) {
  const { edges = [], common = {}, choice = {}, ending = {} } = graphState;
  const flagState = { ...initialFlagState };

  pathEdgeIds.forEach(edgeId => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    if (edge.optionId) {
      const sourceNode = choice[edge.sourceId];
      const option = sourceNode?.data?.options?.find(o => o.id === edge.optionId);
      if (option) {
        if (option.flags_set) {
          option.flags_set.forEach(flagId => { flagState[flagId] = true; });
        }
        if (option.status_set) {
          option.status_set.forEach(({ statusId, amount, mode }) => {
            if (typeof flagState[statusId] === 'number')
              flagState[statusId] = mode === 'set' ? amount : flagState[statusId] + amount;
          });
        }
      }
    }

    const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
    if (!destNode) return;

    if (destNode.data?.flags_set) {
      destNode.data.flags_set.forEach(flagId => { flagState[flagId] = true; });
    }
    if (destNode.data?.status_set) {
      destNode.data.status_set.forEach(({ statusId, amount, mode }) => {
        if (typeof flagState[statusId] === 'number')
          flagState[statusId] = mode === 'set' ? amount : flagState[statusId] + amount;
      });
    }
  });

  return flagState;
}

// Checks whether two paths can be merged into a single display route.
// Merge is valid when they diverge at exactly one choice-node option edge, immediately
// converge to the same target, share an identical suffix, and the differing option
// side-effects are never read by any downstream condition in that suffix.
function canMergePair(pathA, pathB, graphState) {
  const { edges = [], choice = {} } = graphState;

  const idsA = pathA.pathEdgeIds;
  const idsB = pathB.pathEdgeIds;

  // Find the first differing index
  let di = 0;
  while (di < idsA.length && di < idsB.length && idsA[di] === idsB[di]) di++;

  // Must diverge before the end of both paths
  if (di >= idsA.length || di >= idsB.length) return false;

  const edgeA = edges.find(e => e.id === idsA[di]);
  const edgeB = edges.find(e => e.id === idsB[di]);
  if (!edgeA || !edgeB) return false;

  // Must be different options from the same choice node
  if (!edgeA.optionId || !edgeB.optionId) return false;
  if (edgeA.sourceId !== edgeB.sourceId) return false;
  if (edgeA.optionId === edgeB.optionId) return false;

  // Must converge immediately to the same target
  if (edgeA.targetId !== edgeB.targetId) return false;

  // Suffix after divergence must be identical
  const suffixA = idsA.slice(di + 1);
  const suffixB = idsB.slice(di + 1);
  if (suffixA.length !== suffixB.length) return false;
  if (!suffixA.every((id, i) => id === suffixB[i])) return false;

  // Collect side-effects that differ between the two options
  const sourceNode = choice[edgeA.sourceId];
  if (!sourceNode) return false;
  const optA = sourceNode.data?.options?.find(o => o.id === edgeA.optionId);
  const optB = sourceNode.data?.options?.find(o => o.id === edgeB.optionId);
  if (!optA || !optB) return false;

  const flagsA = new Set(optA.flags_set || []);
  const flagsB = new Set(optB.flags_set || []);
  const differingFlags = new Set([
    ...[...flagsA].filter(f => !flagsB.has(f)),
    ...[...flagsB].filter(f => !flagsA.has(f)),
  ]);

  const statusAmtA = Object.fromEntries((optA.status_set || []).map(s => [s.statusId, s.amount]));
  const statusAmtB = Object.fromEntries((optB.status_set || []).map(s => [s.statusId, s.amount]));
  const allStatusIds = new Set([...Object.keys(statusAmtA), ...Object.keys(statusAmtB)]);
  const differingStatuses = new Set([...allStatusIds].filter(id => statusAmtA[id] !== statusAmtB[id]));

  if (differingFlags.size === 0 && differingStatuses.size === 0) return true;

  // Check if any suffix edge condition or option requires references the differing effects
  for (const edgeId of suffixA) {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) continue;

    const condClauses = edge.condition?.conditions || [];
    for (const c of condClauses) {
      if ('flag' in c && differingFlags.has(c.flag)) return false;
      if ('status' in c && differingStatuses.has(c.status)) return false;
    }

    if (edge.optionId) {
      const srcNode = choice[edge.sourceId];
      const opt = srcNode?.data?.options?.find(o => o.id === edge.optionId);
      const reqClauses = opt?.requires?.conditions || [];
      for (const c of reqClauses) {
        if ('flag' in c && differingFlags.has(c.flag)) return false;
        if ('status' in c && differingStatuses.has(c.status)) return false;
      }
    }
  }

  return true;
}

// Groups route paths that can be merged for display. Returns an array of index arrays;
// singleton arrays for non-mergeable routes. Merging is transitive.
export function findMergeGroups(paths, graphState) {
  const n = paths.length;
  // Union-Find for transitivity
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a, b) => { parent[find(a)] = find(b); };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (canMergePair(paths[i], paths[j], graphState)) union(i, j);
    }
  }

  const groups = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups[root]) groups[root] = [];
    groups[root].push(i);
  }
  return Object.values(groups);
}

// Builds a campaign snapshot from a specific traced route.
// Reuses simulateFlagStateAlongPath for effect replay and computes only the deltas
// from narrative defaults so the snapshot stays minimal.
export function buildRouteSnapshot(pathEdgeIds, graphState, flagDict, statusDict) {
  const { edges = [], common = {}, choice = {}, ending = {} } = graphState;

  const initialSeed = {};
  Object.values(flagDict).forEach(f => { initialSeed[f.id] = f.state; });
  Object.values(statusDict).forEach(s => { initialSeed[s.id] = s.value; });

  const finalState = simulateFlagStateAlongPath(pathEdgeIds, graphState, initialSeed);

  // Derive ordered node sequence from edge list
  const seenNodeIds = [];
  if (pathEdgeIds.length > 0) {
    const firstEdge = edges.find(e => e.id === pathEdgeIds[0]);
    if (firstEdge) seenNodeIds.push(firstEdge.sourceId);
    pathEdgeIds.forEach(eid => {
      const edge = edges.find(e => e.id === eid);
      if (edge) seenNodeIds.push(edge.targetId);
    });
  }

  const activeNodeId = seenNodeIds[seenNodeIds.length - 1] ?? null;

  const flagOverrides = {};
  Object.values(flagDict).forEach(f => {
    if (finalState[f.id] !== f.state) flagOverrides[f.id] = finalState[f.id];
  });

  const statusOverrides = {};
  Object.values(statusDict).forEach(s => {
    if (finalState[s.id] !== s.value) statusOverrides[s.id] = finalState[s.id];
  });

  return { activeNodeId, seenNodeIds, traversedEdgeIds: pathEdgeIds, flagOverrides, statusOverrides };
}

// Helper to score path by priority conditions
function countPriorityMatches(pathEdgeIds, graphState, initialFlags, priorities) {
  if (!priorities || priorities.length === 0) return 0;

  const flagState = simulateFlagStateAlongPath(pathEdgeIds, graphState, initialFlags);

  let matches = 0;
  priorities.forEach(priority => {
    const value = flagState[priority.id];
    if (priority.type === 'status') {
      const op = priority.operator || '>=';
      if (op === '>=' && typeof value === 'number' && value >= priority.preferredValue) matches++;
      else if (op === '<=' && typeof value === 'number' && value <= priority.preferredValue) matches++;
      else if (op === '==' && value === priority.preferredValue) matches++;
    } else {
      if (value === priority.preferredValue) matches++;
    }
  });

  return matches;
}
