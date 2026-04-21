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
export function computeShortestPaths(startNodeId, targetNodeId, graphState, currentFlagValues, priorities = [], limit = 5) {
  const { edges = [] } = graphState;
  const MAX_STATE_VISITS = 10_000;
  const HARD_CAP = 50;
  const actualLimit = Math.min(limit, HARD_CAP);

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

      // Fetch destination node to apply effects
      const { common = {}, choice = {}, ending = {} } = graphState;
      const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
      if (!destNode) return;

      // Apply destination node effects to flag state
      let nextFlagState = { ...current.flagState };
      if (destNode.data?.flags_set) {
        destNode.data.flags_set.forEach(flagId => {
          nextFlagState[flagId] = true;
        });
      }
      if (destNode.data?.status_set) {
        destNode.data.status_set.forEach(({ statusId, amount }) => {
          if (typeof nextFlagState[statusId] === 'number') {
            nextFlagState[statusId] += amount;
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

  // Sort by path length, then apply priority tie-breaking
  paths.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;

    // For equal-length paths, score by priority conditions
    const scoreA = countPriorityMatches(a.pathEdgeIds, graphState, currentFlagValues, priorities);
    const scoreB = countPriorityMatches(b.pathEdgeIds, graphState, currentFlagValues, priorities);
    return scoreB - scoreA; // Higher score = better rank
  });

  // Assign priority rank for equal-length groups
  let currentLength = -1;
  let rankInLength = 0;
  paths.forEach(path => {
    if (path.length !== currentLength) {
      currentLength = path.length;
      rankInLength = 0;
    }
    path.priorityRank = rankInLength++;
  });

  // Cap at hard limit
  const result = paths.slice(0, actualLimit);

  return {
    paths: result,
    exhausted
  };
}

// ADDED: Phase 4 — Helper to score path by priority conditions
function countPriorityMatches(pathEdgeIds, graphState, initialFlags, priorities) {
  if (!priorities || priorities.length === 0) return 0;

  // Simulate path to final flag state
  let flagState = { ...initialFlags };
  const { edges = [], common = {}, choice = {}, ending = {} } = graphState;

  pathEdgeIds.forEach(edgeId => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
    if (!destNode) return;

    if (destNode.data?.flags_set) {
      destNode.data.flags_set.forEach(flagId => {
        flagState[flagId] = true;
      });
    }
    if (destNode.data?.status_set) {
      destNode.data.status_set.forEach(({ statusId, amount }) => {
        if (typeof flagState[statusId] === 'number') {
          flagState[statusId] += amount;
        }
      });
    }
  });

  // Count how many priorities are satisfied
  let matches = 0;
  priorities.forEach(priority => {
    if (flagState[priority.id] === priority.preferredValue) {
      matches++;
    }
  });

  return matches;
}
